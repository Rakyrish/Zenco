"""
Zenco Product Content Engine
─────────────────────────────
Comprehensive, unique, information-rich AI content generation for product and
category pages. Replaces the legacy ~370-word single-description generator.

Design goals:
- Every product page gets a full authority-page structure: introduction,
  detailed overview, per-application explanations, benefits written as
  paragraphs, technical specification tables, packaging, storage & handling,
  safety information, and 6-10 search-intent FAQs.
- Regeneration NEVER touches slug, image, gallery, category, SKU, pricing,
  stock, status, or timestamps other than updated_at. URLs and indexing
  history are preserved by construction.
- Per-product style rotation prevents template repetition across the catalog.
"""
import hashlib
import json
import logging

from django.conf import settings
from django.utils import timezone

logger = logging.getLogger(__name__)

MAX_ATTEMPTS = 3

# ─── Style rotation ──────────────────────────────────────────────────────────
# A deterministic style seed (from the product slug) rotates the writing
# approach so no two product pages share the same sentence structures.

_OPENING_STYLES = [
    "Open the introduction by defining the product in one plain sentence, then widen out to its commercial role.",
    "Open the introduction with the industrial problem this product solves, then introduce the product as the solution.",
    "Open the introduction with the industries that depend on this product, then explain what it is.",
    "Open the introduction with how the product behaves in use (its function), then cover identity and importance.",
    "Open the introduction with a procurement angle: why buyers specify this product, then explain what it is.",
    "Open the introduction with the product's place in its chemical family, then narrow to practical usage.",
]

_VOICE_STYLES = [
    "Write with the voice of a plant chemist advising an operations team: precise, hands-on, measured.",
    "Write with the voice of a procurement consultant briefing a buying committee: commercial, comparative, practical.",
    "Write with the voice of a technical sales engineer walking a customer through the product: helpful, concrete, direct.",
    "Write with the voice of an industry analyst profiling the product for a sector report: factual, contextual, unhurried.",
    "Write with the voice of a senior formulator mentoring a junior colleague: explanatory, specific, grounded in practice.",
]

_STRUCTURE_STYLES = [
    "Vary paragraph lengths deliberately; mix short two-sentence paragraphs with longer explanatory ones.",
    "Prefer medium-length paragraphs of three to five sentences with varied openings; never start consecutive sentences the same way.",
    "Lead paragraphs with the conclusion, then support it; keep sentence rhythm varied between short and long.",
    "Build paragraphs from cause to effect; alternate sentence lengths so the text never falls into a metre.",
]


def _style_directives(seed_text: str) -> str:
    digest = hashlib.sha256((seed_text or "product").encode()).digest()
    opening = _OPENING_STYLES[digest[0] % len(_OPENING_STYLES)]
    voice = _VOICE_STYLES[digest[1] % len(_VOICE_STYLES)]
    structure = _STRUCTURE_STYLES[digest[2] % len(_STRUCTURE_STYLES)]
    return f"- {opening}\n- {voice}\n- {structure}"


# ─── Shared writing rules ────────────────────────────────────────────────────

_QUALITY_RULES = """
## WRITING QUALITY RULES (NON-NEGOTIABLE)
- Prioritize usefulness over word count. Every sentence must teach the reader something or help a buying decision.
- Never write generic filler ("high quality product", "best in the market", "wide range of applications" with no specifics).
- Never use AI-sounding phrases: "In today's fast-paced world", "It is important to note", "delve", "unlock", "elevate", "game-changer", "in conclusion", "furthermore" chains, "whether you are ... or ...".
- No keyword stuffing. Use the primary keyword and its natural variants where they belong and nowhere else.
- Write naturally, as a human expert would. Contractions are allowed. Do not follow a visible template rhythm.
- Content must demonstrate genuine expertise: real mechanisms, real dosing/usage context, real trade-offs, real industry practice.
- Where chemical facts apply (formula, CAS number, physical properties), they must be REAL and ACCURATE for the identified chemical. Never invent CAS numbers. For mixtures or proprietary blends, say so plainly.
- If a value is genuinely unknowable without the supplier's certificate of analysis, write "Confirm with supplier" for that value only.
- Answer for the reader: What is this? Why is it used? Where is it used? How is it used? Which industries depend on it? What are its advantages? What should a buyer check before purchasing?
"""

_PRODUCT_JSON_SPEC = """
OUTPUT MUST BE A SINGLE VALID JSON OBJECT with exactly this shape:

{
  "product_title": "",
  "short_product_description": "",
  "content_sections": {
    "introduction": "",
    "detailed_overview": "",
    "applications_detailed": [
      {"title": "", "description": ""}
    ],
    "benefits_detailed": [
      {"title": "", "paragraph": ""}
    ],
    "packaging_information": "",
    "storage_handling": "",
    "safety_information": ""
  },
  "technical_specifications": {},
  "applications": [],
  "features": [],
  "industries_served": [],
  "faq_section": [
    {"question": "", "answer": ""}
  ],
  "seo": {
    "seo_title": "",
    "meta_description": "",
    "focus_keyword": "",
    "seo_keywords": [],
    "og_title": "",
    "og_description": "",
    "twitter_title": "",
    "twitter_description": "",
    "image_alt_text": ""
  },
  "product_tags": [],
  "common_names_synonyms": [],
  "internal_linking_suggestions": [],
  "product_attributes": {
    "chemical_name": "",
    "cas_number": "",
    "formula": "",
    "appearance": "",
    "purity": "",
    "grade": "",
    "packaging": ""
  }
}
"""

_PRODUCT_SECTION_RULES = """
## SECTION REQUIREMENTS

### content_sections.introduction (150-300 words)
Professional introduction covering: what the product is, why it is used, the
industries that use it, and its commercial importance. Plain paragraphs
separated by blank lines. No headings inside the text.

### content_sections.detailed_overview (300-500 words)
Comprehensive explanation of composition, how the product functions (the actual
mechanism where known), performance characteristics, and key properties that
matter in use. Multiple paragraphs. No headings inside the text.

### content_sections.applications_detailed (4-8 items, 300-800 words total)
Each application explained INDIVIDUALLY: a short title (e.g. "Water treatment",
"Food processing") and a 60-140 word description of how the product is used in
that context, typical usage patterns, and what outcome it delivers there. Cover
only applications that are genuinely relevant to this product.

### content_sections.benefits_detailed (3-6 items)
Benefits in PARAGRAPH format, not bullet lists. Each item has a short title and
a 50-120 word paragraph explaining the benefit concretely: cost benefits,
performance benefits, operational benefits, industry benefits. Explain the
"because" behind each claim.

### content_sections.packaging_information (60-150 words)
Available packaging formats, bulk supply options, and commercial packaging
notes realistic for Kenya, Uganda, and Tanzania (e.g. 5L, 10L, 20L, 25kg, 50kg bags, 200L
drums, 1000L IBC, bulk tanker where plausible for this product type).

### content_sections.storage_handling (80-180 words)
Detailed, product-specific storage and handling guidance: temperature,
container compatibility, segregation, shelf life expectations, handling
practices. Must reflect this chemical's real behavior.

### content_sections.safety_information (60-180 words; empty string ONLY if truly not applicable)
Real safety considerations: hazard character, PPE, first-response basics,
disposal notes. Refer readers to the SDS for full detail.

### technical_specifications (structured table object)
Keys like "Chemical Name", "Formula", "CAS Number", "Appearance", "Purity",
"Density", "pH", "Solubility", "Grade", "Packaging", "Storage Conditions" —
include those that apply to this product. Values must be accurate; use
"Confirm with supplier" only for values that require a certificate of analysis.

### applications (plain list)
Short list form of the detailed applications (one 2-6 word label each).

### features (4-6 items)
Technical/physical characteristics, each under 15 words.

### industries_served (4-8 items)
Actual industries that depend on this product.

### faq_section (6-10 items)
Questions real buyers and searchers ask about THIS product (search intent:
"what is X used for", dosing, dilution, compatibility, food-grade status,
shelf life, packaging sizes, MOQ, delivery, safety). NO generic questions that
could apply to any product. Answers 25-70 words, specific and useful.

## SEO REQUIREMENTS
- seo.seo_title: 50-60 characters, primary keyword naturally placed, no clickbait, no "Industrial Grade" in the title.
- seo.meta_description: 140-160 characters, includes the keyword naturally, written to earn the click (benefit + supply region).
- seo.focus_keyword: the single primary keyword phrase.
- seo.seo_keywords: 6-10 relevant keywords (product, synonyms, applications, industry and geographic modifiers). No stuffing.
- seo.og_title / og_description: social-share optimized variants (og_description up to 200 chars).
- seo.twitter_title / twitter_description: Twitter-card variants (twitter_description up to 200 chars).
- seo.image_alt_text: describes the product image naturally with the product name. No "Industrial Grade".

## INTERNAL LINKING
- internal_linking_suggestions: 3-6 site paths that a buyer of this product would naturally visit next
  (e.g. "/products/category/<category-slug>", related product slugs as "/products/<slug>", "/industries/...", "/services/...").
- Inside introduction and detailed_overview you may reference the product's category and related applications by NAME so the frontend can link them, but do NOT embed HTML or markdown links.

## PRODUCT ATTRIBUTES
- chemical_name, formula, cas_number MUST be real and exact for identifiable single chemicals.
- For mixtures/blends set cas_number to "Mixture".
- appearance always filled (what the product physically looks like).
- purity/grade: use "Confirm with supplier" when not determinable.
"""


def _product_context(product) -> dict:
    schema = product.schema_data if isinstance(product.schema_data, dict) else {}
    return {
        'name': product.name,
        'sku': product.sku,
        'category': product.category.name if product.category else '',
        'category_slug': product.category.slug if product.category else '',
        'current_short_description': product.short_description or '',
        'current_description': (product.description or '')[:2000],
        'current_applications': product.applications or [],
        'current_specifications': product.specifications or {},
        'packaging': product.packaging or '',
        'regions_available': product.regions_available or [],
        'known_attributes': {
            k: schema.get(k) for k in (
                'chemical_name', 'cas_number', 'formula', 'appearance',
                'purity', 'grade', 'common_names_synonyms',
            ) if schema.get(k)
        },
    }


def _related_context(product) -> list:
    """Sibling products in the same category, used for internal link grounding."""
    if not product.category:
        return []
    siblings = type(product).objects.filter(
        category=product.category, is_active=True, is_deleted=False,
    ).exclude(pk=product.pk).values_list('name', 'slug')[:12]
    return [{'name': n, 'slug': s} for n, s in siblings]


def build_product_content_prompt(product, extra_context: str = '') -> str:
    """Build the full-page content generation prompt for an existing product."""
    context = _product_context(product)
    related = _related_context(product)
    return f"""
You are four experts working as one writer for Zenco Systems Ltd, an industrial
chemical supplier serving Kenya, Uganda, and Tanzania:
1. A chemical industry expert who knows how this product is actually made, specified and used.
2. An industrial procurement consultant who knows what buyers check before ordering.
3. A technical writer who explains complex material clearly without dumbing it down.
4. An SEO specialist who structures content to rank for transactional AND informational queries without ever stuffing keywords.

Your task: generate the COMPLETE content for this product's page. The page must
read like it was written by a supplier with deep first-hand knowledge — an
authoritative industry resource, not an e-commerce listing.

## PRODUCT CONTEXT
{json.dumps(context, indent=2, default=str)}

## SIBLING PRODUCTS IN THE SAME CATEGORY (for internal_linking_suggestions; use "/products/<slug>")
{json.dumps(related, default=str)}

{f"## ADDITIONAL CONTEXT FROM THE ADMIN{chr(10)}{extra_context}" if extra_context else ""}

## STYLE ROTATION FOR THIS SPECIFIC PRODUCT (follow exactly — this keeps every page unique)
{_style_directives(product.slug or product.name)}

{_QUALITY_RULES}
{_PRODUCT_SECTION_RULES}
{_PRODUCT_JSON_SPEC}

## HARD CONSTRAINTS
- Do NOT invent a new product name; product_title must be for "{product.name}" (you may normalize casing/format).
- Do NOT include a slug field; the URL is fixed and must not change.
- Mention Zenco Systems Ltd as the supplier naturally (1-3 times total across all sections, not more).
- Mention the supply regions (Kenya, Uganda, and Tanzania) naturally where relevant, without repeating them in every section.
- Return ONLY the JSON object. No markdown, no commentary.
"""


def build_image_product_prompt(admin_context: str = '') -> str:
    """
    Prompt for creating a NEW product from an image (admin publishing flow).
    Unlike regeneration, this includes product identification and a seo_slug
    field, because a new product has no URL yet.
    """
    import uuid as _uuid
    return f"""
You are four experts working as one writer for Zenco Systems Ltd, an industrial
chemical supplier serving Kenya, Uganda, and Tanzania:
1. A chemical industry expert who knows how products are made, specified and used.
2. An industrial procurement consultant who knows what buyers check before ordering.
3. A technical writer who explains complex material clearly without dumbing it down.
4. An SEO specialist who structures content to rank for transactional AND informational queries without keyword stuffing.

Identify the industrial product in the provided image or context, then generate
the COMPLETE content for its product page. If you cannot confidently identify
the product, return {{"error": "Unable to identify product from image"}} instead
of guessing.

## PRODUCT IDENTIFICATION
- Chemical Name, Formula and CAS Number must be REAL and EXACT for identifiable single chemicals (e.g. Hydrogen Peroxide, H2O2, 7722-84-1). Use "Mixture" for blends. Never invent CAS numbers.
- product_title is the clean product name only — no "Industrial Grade", no region suffixes.
- Additionally include a top-level "seo_slug" field: lowercase, hyphenated, product keyword only (e.g. "hydrogen-peroxide-50"). This is used once at creation; it never changes afterwards.

{f"## ADDITIONAL CONTEXT FROM THE ADMIN{chr(10)}{admin_context}" if admin_context else ""}

## STYLE ROTATION FOR THIS GENERATION (keeps every page unique)
{_style_directives(admin_context or str(_uuid.uuid4()))}

{_QUALITY_RULES}
{_PRODUCT_SECTION_RULES}
{_PRODUCT_JSON_SPEC}

Add "seo_slug" as an extra top-level key to that JSON shape.

## HARD CONSTRAINTS
- Mention Zenco Systems Ltd as the supplier naturally (1-3 times total).
- Mention the supply regions (Kenya, Uganda, and Tanzania) naturally where relevant, without repeating them in every section.
- Return ONLY the JSON object. No markdown, no commentary.
"""


# ─── Validation ──────────────────────────────────────────────────────────────

def _wc(text) -> int:
    return len(str(text or '').split())


def validate_product_content(data: dict) -> list:
    """Return a list of human-readable issues; empty list means acceptable."""
    issues = []
    if not isinstance(data, dict):
        return ['Response is not a JSON object.']
    sections = data.get('content_sections') or {}
    if not isinstance(sections, dict):
        return ['content_sections missing.']

    intro_wc = _wc(sections.get('introduction'))
    if not 100 <= intro_wc <= 380:
        issues.append(f'introduction is {intro_wc} words (target 150-300).')

    overview_wc = _wc(sections.get('detailed_overview'))
    if not 220 <= overview_wc <= 620:
        issues.append(f'detailed_overview is {overview_wc} words (target 300-500).')

    apps = sections.get('applications_detailed') or []
    if not isinstance(apps, list) or len(apps) < 3:
        issues.append('applications_detailed needs at least 3 individually explained applications.')
    else:
        apps_wc = sum(_wc(a.get('description')) for a in apps if isinstance(a, dict))
        if apps_wc < 200:
            issues.append(f'applications_detailed total is {apps_wc} words (target 300-800).')

    benefits = sections.get('benefits_detailed') or []
    if not isinstance(benefits, list) or len(benefits) < 3:
        issues.append('benefits_detailed needs at least 3 paragraph-format benefits.')

    faqs = data.get('faq_section') or []
    valid_faqs = [f for f in faqs if isinstance(f, dict) and f.get('question') and f.get('answer')]
    if len(valid_faqs) < 6:
        issues.append(f'faq_section has {len(valid_faqs)} valid items (need 6-10).')

    seo = data.get('seo') or {}
    title_len = len(str(seo.get('seo_title') or ''))
    if not 35 <= title_len <= 65:
        issues.append(f'seo_title is {title_len} chars (target 50-60).')
    meta_len = len(str(seo.get('meta_description') or ''))
    if not 120 <= meta_len <= 170:
        issues.append(f'meta_description is {meta_len} chars (target 140-160).')
    if not seo.get('seo_keywords'):
        issues.append('seo_keywords missing.')

    specs = data.get('technical_specifications') or {}
    if not isinstance(specs, dict) or len(specs) < 4:
        issues.append('technical_specifications needs at least 4 entries.')

    return issues


# ─── Generation ──────────────────────────────────────────────────────────────

def _openai_client():
    from openai import OpenAI
    return OpenAI(api_key=settings.OPENAI_API_KEY)


def _call_model(prompt: str) -> dict:
    response = _openai_client().responses.create(
        model=getattr(settings, 'OPENAI_MODEL', 'gpt-4.1-mini'),
        input=[{'role': 'user', 'content': prompt}],
        text={'format': {'type': 'json_object'}},
    )
    return json.loads(response.output_text)


def generate_product_content(product, extra_context: str = ''):
    """
    Generate comprehensive content for a product. Returns (data, error).
    Retries with validation feedback appended, keeping the best attempt.
    """
    prompt = build_product_content_prompt(product, extra_context)
    best_data, best_issue_count = None, 999
    last_error = ''
    last_issues = []

    for attempt in range(1, MAX_ATTEMPTS + 1):
        try:
            data = _call_model(prompt if not last_issues else (
                prompt + "\n\n## PREVIOUS ATTEMPT FAILED VALIDATION — FIX THESE ISSUES\n- " + "\n- ".join(last_issues)
            ))
        except Exception as exc:
            last_error = str(exc)
            logger.error('[Content Engine] %s attempt %s failed: %s', product.slug, attempt, exc)
            continue

        last_issues = validate_product_content(data)
        if not last_issues:
            return data, None
        if len(last_issues) < best_issue_count:
            best_data, best_issue_count = data, len(last_issues)
        logger.warning('[Content Engine] %s attempt %s issues: %s', product.slug, attempt, last_issues)

    if best_data is not None:
        # Accept the best near-miss rather than failing the whole product.
        return best_data, None
    return None, last_error or 'Generation failed validation on all attempts.'


def apply_generated_content(product, data: dict):
    """
    Apply generated content to a product IN PLACE, preserving URL and media.

    Never writes: slug, image, gallery, category, sku, pricing, stock, status.
    """
    sections = data.get('content_sections') or {}
    seo = data.get('seo') or {}
    attrs = data.get('product_attributes') or {}

    intro = str(sections.get('introduction') or '').strip()
    overview = str(sections.get('detailed_overview') or '').strip()
    if intro or overview:
        product.description = '\n\n'.join(part for part in (intro, overview) if part)

    short = str(data.get('short_product_description') or '').strip()
    if short:
        product.short_description = short[:300]

    specs = data.get('technical_specifications')
    if isinstance(specs, dict) and specs:
        product.specifications = {str(k): str(v) for k, v in specs.items() if str(v).strip()}

    apps = data.get('applications')
    if isinstance(apps, list) and apps:
        product.applications = [str(a) for a in apps if str(a).strip()]

    packaging = str(attrs.get('packaging') or '').strip()
    if packaging:
        product.packaging = packaging[:255]

    if seo.get('seo_title'):
        product.seo_title = str(seo['seo_title'])[:70]
    if seo.get('meta_description'):
        product.seo_description = str(seo['meta_description'])[:160]

    schema = product.schema_data if isinstance(product.schema_data, dict) else {}
    preserved_image = schema.get('cloudinary_image_url')
    schema.update({
        'content_sections': {
            'introduction': intro,
            'detailed_overview': overview,
            'applications_detailed': sections.get('applications_detailed') or [],
            'benefits_detailed': sections.get('benefits_detailed') or [],
            'packaging_information': str(sections.get('packaging_information') or '').strip(),
            'storage_handling': str(sections.get('storage_handling') or '').strip(),
            'safety_information': str(sections.get('safety_information') or '').strip(),
        },
        'faq_section': data.get('faq_section') or [],
        'features': data.get('features') or [],
        'industries_served': data.get('industries_served') or [],
        'technical_data_sheet': data.get('technical_specifications') or {},
        'seo_keywords': seo.get('seo_keywords') or [],
        'focus_keyword': seo.get('focus_keyword') or '',
        'og_title': seo.get('og_title') or '',
        'og_description': seo.get('og_description') or '',
        'twitter_title': seo.get('twitter_title') or '',
        'twitter_description': seo.get('twitter_description') or '',
        'image_alt_text': seo.get('image_alt_text') or schema.get('image_alt_text') or f'{product.name} supplied by Zenco Systems Ltd',
        'product_tags': data.get('product_tags') or [],
        'common_names_synonyms': data.get('common_names_synonyms') or [],
        'internal_linking_suggestions': data.get('internal_linking_suggestions') or [],
        'chemical_name': attrs.get('chemical_name') or schema.get('chemical_name') or '',
        'cas_number': attrs.get('cas_number') or schema.get('cas_number') or '',
        'formula': attrs.get('formula') or schema.get('formula') or '',
        'appearance': attrs.get('appearance') or schema.get('appearance') or '',
        'purity': attrs.get('purity') or schema.get('purity') or '',
        'grade': attrs.get('grade') or schema.get('grade') or '',
        'ai_generated_at': timezone.now().isoformat(),
        'content_engine_version': 2,
    })
    if preserved_image:
        schema['cloudinary_image_url'] = preserved_image
    product.schema_data = schema

    product.save(update_fields=[
        'description', 'short_description', 'specifications', 'applications',
        'packaging', 'seo_title', 'seo_description', 'schema_data', 'updated_at',
    ])
    return product


def regenerate_product(product, extra_context: str = ''):
    """Generate + apply. Returns (product, error)."""
    data, error = generate_product_content(product, extra_context)
    if error:
        return None, error
    return apply_generated_content(product, data), None


# ─── Category authority pages ────────────────────────────────────────────────

_CATEGORY_JSON_SPEC = """
OUTPUT MUST BE A SINGLE VALID JSON OBJECT with exactly this shape:

{
  "content_sections": {
    "introduction": "",
    "industry_applications": [
      {"title": "", "description": ""}
    ],
    "buying_guide": "",
    "selection_criteria": [
      {"title": "", "description": ""}
    ]
  },
  "faq_section": [
    {"question": "", "answer": ""}
  ],
  "seo": {
    "seo_title": "",
    "meta_description": "",
    "seo_keywords": []
  }
}
"""


def build_category_content_prompt(category, products: list) -> str:
    product_lines = json.dumps(
        [{'name': p.name, 'slug': p.slug, 'summary': p.short_description[:120]} for p in products],
        default=str,
    )
    return f"""
You are a chemical industry expert, industrial procurement consultant, technical
writer and SEO specialist writing the authority page for a product category on
the Zenco Systems Ltd website (industrial chemical supplier, Kenya, Uganda, and Tanzania).

CATEGORY: {category.name}
CURRENT DESCRIPTION: {category.description or '(none)'}
PRODUCTS IN THIS CATEGORY (link targets, "/products/<slug>"):
{product_lines}

## STYLE ROTATION FOR THIS CATEGORY
{_style_directives(category.slug or category.name)}

{_QUALITY_RULES}

## SECTION REQUIREMENTS (total 1,500-3,000 words)
- content_sections.introduction: 400-700 word long-form introduction to the category — what these products are, the chemistry family, why industries buy them, the regional market context. Plain paragraphs, no headings, no HTML.
- content_sections.industry_applications: 5-8 items, each a specific industry with a 80-160 word description of how products in this category are used there. Reference specific products from the list BY NAME where genuinely relevant.
- content_sections.buying_guide: 300-600 words of practical buying guidance — grades, purity, packaging choices, documentation to request (COA, SDS), storage planning, how to compare suppliers.
- content_sections.selection_criteria: 4-6 items with title + 40-100 word description (how to choose the right product in this category).
- faq_section: 6-10 FAQs based on real search intent for this category. Specific, useful 30-80 word answers.
- seo.seo_title: 50-60 chars. seo.meta_description: 140-160 chars. seo.seo_keywords: 6-10 keywords.

Return ONLY the JSON object.
"""


def validate_category_content(data: dict) -> list:
    issues = []
    if not isinstance(data, dict):
        return ['Response is not a JSON object.']
    sections = data.get('content_sections') or {}
    if _wc(sections.get('introduction')) < 300:
        issues.append('introduction too short (need 400-700 words).')
    if len(sections.get('industry_applications') or []) < 4:
        issues.append('industry_applications needs at least 5 items.')
    if _wc(sections.get('buying_guide')) < 220:
        issues.append('buying_guide too short (need 300-600 words).')
    faqs = [f for f in (data.get('faq_section') or []) if isinstance(f, dict) and f.get('question')]
    if len(faqs) < 6:
        issues.append('faq_section needs 6-10 items.')
    return issues


def generate_category_content(category):
    """Generate authority content for a category. Returns (data, error)."""
    products = list(category.products.filter(is_active=True, is_deleted=False)[:24])
    prompt = build_category_content_prompt(category, products)
    last_error = ''
    for attempt in range(1, MAX_ATTEMPTS + 1):
        try:
            data = _call_model(prompt)
        except Exception as exc:
            last_error = str(exc)
            logger.error('[Content Engine] category %s attempt %s failed: %s', category.slug, attempt, exc)
            continue
        issues = validate_category_content(data)
        if not issues:
            return data, None
        logger.warning('[Content Engine] category %s attempt %s issues: %s', category.slug, attempt, issues)
        last_error = '; '.join(issues)
    return None, last_error or 'Category generation failed.'


def apply_category_content(category, data: dict):
    """Apply generated authority content to a category, preserving its slug."""
    sections = data.get('content_sections') or {}
    seo = data.get('seo') or {}
    category.content_sections = {
        'introduction': str(sections.get('introduction') or '').strip(),
        'industry_applications': sections.get('industry_applications') or [],
        'buying_guide': str(sections.get('buying_guide') or '').strip(),
        'selection_criteria': sections.get('selection_criteria') or [],
        'faq_section': data.get('faq_section') or [],
        'seo_keywords': seo.get('seo_keywords') or [],
        'ai_generated_at': timezone.now().isoformat(),
    }
    if seo.get('seo_title'):
        category.seo_title = str(seo['seo_title'])[:70]
    if seo.get('meta_description'):
        category.seo_description = str(seo['meta_description'])[:160]
    if not category.description and sections.get('introduction'):
        category.description = str(sections['introduction']).split('\n')[0][:500]
    category.save(update_fields=[
        'content_sections', 'seo_title', 'seo_description', 'description', 'updated_at',
    ])
    return category
