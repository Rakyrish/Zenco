"""
AI-powered Technical Data Sheet generation and validation for Zenco Chemicals.
"""
import json
import logging
import re
from decimal import Decimal

from django.conf import settings
from django.utils import timezone

logger = logging.getLogger(__name__)

REQUIRED_KEYS = [
    'title', 'meta_title', 'meta_description', 'product_description',
    'chemical_composition', 'physical_properties', 'performance_data',
    'applications', 'industries_served', 'health_safety', 'storage_handling',
    'packaging_info', 'standards_compliance', 'certifications', 'faq',
    'related_products_text',
]

CAS_REGEX = re.compile(r'^\d{2,7}-\d{2}-\d$')
VALID_GHS_PICTOGRAMS = {f'GHS{i:02d}' for i in range(1, 10)}
PHYSICAL_PROPERTY_KEYS = [
    'appearance', 'ph', 'specific_gravity', 'boiling_point', 'flash_point',
    'solubility', 'viscosity', 'colour', 'odour',
]


def build_datasheet_prompt(product) -> str:
    """Collect product context and build the OpenAI user prompt."""
    schema = product.schema_data if isinstance(product.schema_data, dict) else {}
    tags = schema.get('tags') or schema.get('seo_keywords') or []
    if isinstance(tags, str):
        tags = [tags]

    context = {
        'name': product.name,
        'sku': product.sku,
        'category': product.category.name if product.category else '',
        'description': product.description or '',
        'short_description': product.short_description or '',
        'applications': product.applications or [],
        'specifications': product.specifications or {},
        'packaging': product.packaging or '',
        'regions_available': product.regions_available or [],
        'tags': tags if isinstance(tags, list) else [],
        'schema_data': {
            k: v for k, v in schema.items()
            if k not in ('cloudinary_image_url',)
        },
    }

    return f"""
You are a senior chemical industry technical writer.
Generate a complete, professional Technical Data Sheet (TDS) for the following
industrial chemical product sold by Zenco Chemicals — a specialty chemicals
supplier in Kenya serving East African industrial facilities.

PRODUCT INFORMATION:
{json.dumps(context, indent=2, default=str)}

Generate a structured TDS in valid JSON format with these exact keys:

{{
  "title": "Technical Data Sheet — [Product Name]",
  "meta_title": "...",
  "meta_description": "...",
  "product_description": "...",
  "chemical_composition": [
    {{"component": "...", "cas_number": "...", "percentage": "..."}}
  ],
  "physical_properties": {{
    "appearance": "...",
    "ph": "...",
    "specific_gravity": "...",
    "boiling_point": "...",
    "flash_point": "...",
    "solubility": "...",
    "viscosity": "...",
    "colour": "...",
    "odour": "..."
  }},
  "performance_data": {{
    "recommended_dosage": "...",
    "dilution_ratio": "...",
    "treatment_temperature": "...",
    "contact_time": "...",
    "compatibility": ["..."],
    "incompatibility": ["..."]
  }},
  "applications": ["..."],
  "industries_served": ["..."],
  "health_safety": {{
    "ghs_hazard_class": "...",
    "ghs_pictograms": ["..."],
    "signal_word": "...",
    "hazard_statements": ["..."],
    "precautionary_statements": ["..."],
    "ppe_required": ["..."],
    "first_aid_skin": "...",
    "first_aid_eyes": "...",
    "first_aid_ingestion": "..."
  }},
  "storage_handling": {{
    "storage_temperature": "...",
    "storage_conditions": "...",
    "container_material": "...",
    "shelf_life": "...",
    "disposal": "..."
  }},
  "packaging_info": {{
    "available_sizes": ["..."],
    "un_number": "...",
    "packing_group": "...",
    "transport_class": "..."
  }},
  "standards_compliance": [
    {{"standard": "...", "scope": "..."}}
  ],
  "certifications": ["..."],
  "faq": [
    {{"question": "...", "answer": "..."}}
  ],
  "related_products_text": "..."
}}

RULES:
- CAS numbers must be real and chemically accurate for the stated components
- GHS classifications must follow GHS Rev.9
- KEBS references must be real Kenya Bureau of Standards codes
- ISO references must be real and applicable
- Do not invent commercial brand names
- Return valid JSON only. No markdown. No preamble. No explanation.
- If any field cannot be confidently determined, use "Consult product label"
"""


def validate_datasheet_payload(data: dict) -> tuple[dict, list[str]]:
    """Validate and normalise AI-generated TDS payload. Returns (data, flags)."""
    flags: list[str] = []

    if not isinstance(data, dict):
        return {}, ['invalid_json_structure']

    missing = [k for k in REQUIRED_KEYS if k not in data]
    if missing:
        flags.append(f'missing_keys:{",".join(missing)}')

    meta_title = str(data.get('meta_title') or '')[:70]
    meta_description = str(data.get('meta_description') or '')[:160]
    data['meta_title'] = meta_title
    data['meta_description'] = meta_description

    composition = data.get('chemical_composition') or []
    if isinstance(composition, list):
        for item in composition:
            if not isinstance(item, dict):
                continue
            cas = str(item.get('cas_number', '')).strip()
            if cas and cas.lower() != 'consult product label' and not CAS_REGEX.match(cas):
                flags.append(f'invalid_cas:{cas}')

    health = data.get('health_safety') or {}
    if isinstance(health, dict):
        pictograms = health.get('ghs_pictograms') or []
        if isinstance(pictograms, list):
            for code in pictograms:
                code_str = str(code).strip().upper()
                if code_str and code_str not in VALID_GHS_PICTOGRAMS:
                    flags.append(f'invalid_ghs:{code_str}')

    physical = data.get('physical_properties') or {}
    if isinstance(physical, dict):
        filled = sum(
            1 for k in PHYSICAL_PROPERTY_KEYS
            if str(physical.get(k, '')).strip()
            and str(physical.get(k, '')).strip().lower() != 'consult product label'
        )
        if filled < 6:
            flags.append('incomplete_physical_properties')

    faq = data.get('faq') or []
    if not isinstance(faq, list) or len(faq) < 4:
        flags.append('insufficient_faq')

    return data, flags


def _increment_version(version: str) -> str:
    try:
        parts = version.split('.')
        major = int(parts[0])
        minor = int(parts[1]) if len(parts) > 1 else 0
        return f'{major}.{minor + 1}'
    except (ValueError, IndexError):
        return '1.1'


def generate_datasheet_for_product(product, regenerate=False, triggered_by='admin'):
    """
    Generate or regenerate a ProductDataSheet via OpenAI.
    Returns (ProductDataSheet | None, error_message | None).
    """
    from openai import OpenAI
    from apps.blog.models import ProductDataSheet

    if not getattr(settings, 'OPENAI_API_KEY', None):
        return None, 'OpenAI API key not configured.'

    client = OpenAI(api_key=settings.OPENAI_API_KEY)
    model = getattr(settings, 'OPENAI_MODEL', 'gpt-4.1-mini')
    prompt = build_datasheet_prompt(product)

    last_error = ''
    token_total = 0

    for attempt in range(1, 3):
        try:
            response = client.responses.create(
                model=model,
                input=[
                    {
                        'role': 'system',
                        'content': (
                            'You are a senior chemical industry technical writer for Zenco Chemicals. '
                            'Return only valid JSON.'
                        ),
                    },
                    {'role': 'user', 'content': prompt},
                ],
                text={'format': {'type': 'json_object'}},
            )
            usage = getattr(response, 'usage', None)
            token_count = usage.total_tokens if usage else 0
            token_total += token_count

            raw = response.output_text
            data = json.loads(raw)
            data, flags = validate_datasheet_payload(data)

            if flags and attempt == 1 and any(
                f.startswith('missing_keys') or f == 'insufficient_faq' for f in flags
            ):
                last_error = f'Validation failed: {flags}'
                continue

            existing = getattr(product, 'product_data_sheet', None)
            if existing and regenerate:
                version = _increment_version(existing.version)
                sheet = existing
            elif existing:
                return None, 'Product already has a datasheet. Use regenerate=True.'
            else:
                version = '1.0'
                sheet = ProductDataSheet(product=product)

            sheet.title = data.get('title') or f'Technical Data Sheet — {product.name}'
            sheet.meta_title = data.get('meta_title', '')[:70]
            sheet.meta_description = data.get('meta_description', '')[:160]
            sheet.product_description = data.get('product_description', '')
            sheet.chemical_composition = data.get('chemical_composition') or []
            sheet.physical_properties = data.get('physical_properties') or {}
            sheet.performance_data = data.get('performance_data') or {}
            sheet.applications = data.get('applications') or []
            sheet.industries_served = data.get('industries_served') or []
            sheet.health_safety = data.get('health_safety') or {}
            sheet.storage_handling = data.get('storage_handling') or {}
            sheet.packaging_info = data.get('packaging_info') or {}
            sheet.standards_compliance = data.get('standards_compliance') or []
            sheet.certifications = data.get('certifications') or []
            sheet.faq = data.get('faq') or []
            sheet.related_products_text = data.get('related_products_text', '')
            sheet.ai_generated = True
            sheet.ai_model_used = model
            sheet.tokens_used = token_total
            sheet.generation_date = timezone.now()
            sheet.validation_flags = flags
            sheet.version = version
            if triggered_by != 'bulk_seed':
                sheet.status = 'draft'
            sheet.save()
            return sheet, None

        except json.JSONDecodeError as exc:
            last_error = f'JSON parse error: {exc}'
            logger.warning('[Datasheet] Attempt %s JSON error: %s', attempt, exc)
        except Exception as exc:
            last_error = str(exc)
            logger.exception('[Datasheet] Generation failed for %s', product.name)

    return None, last_error or 'Generation failed after retries.'


def apply_payload_to_sheet(sheet, data: dict) -> list[str]:
    """Apply validated admin-edited payload to an existing sheet."""
    data, flags = validate_datasheet_payload(data)
    sheet.title = data.get('title', sheet.title)
    sheet.meta_title = data.get('meta_title', sheet.meta_title)[:70]
    sheet.meta_description = data.get('meta_description', sheet.meta_description)[:160]
    sheet.product_description = data.get('product_description', sheet.product_description)
    sheet.chemical_composition = data.get('chemical_composition', sheet.chemical_composition)
    sheet.physical_properties = data.get('physical_properties', sheet.physical_properties)
    sheet.performance_data = data.get('performance_data', sheet.performance_data)
    sheet.applications = data.get('applications', sheet.applications)
    sheet.industries_served = data.get('industries_served', sheet.industries_served)
    sheet.health_safety = data.get('health_safety', sheet.health_safety)
    sheet.storage_handling = data.get('storage_handling', sheet.storage_handling)
    sheet.packaging_info = data.get('packaging_info', sheet.packaging_info)
    sheet.standards_compliance = data.get('standards_compliance', sheet.standards_compliance)
    sheet.certifications = data.get('certifications', sheet.certifications)
    sheet.faq = data.get('faq', sheet.faq)
    sheet.related_products_text = data.get('related_products_text', sheet.related_products_text)
    sheet.validation_flags = flags
    return flags
