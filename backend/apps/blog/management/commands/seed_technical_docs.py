"""
Management command: seed_technical_docs
Generates 10 AI-powered Technical Documents for Zenco Chemicals.
Usage: python manage.py seed_technical_docs [--dry-run]
"""
import json
import logging
from django.core.management.base import BaseCommand
from django.conf import settings
from apps.blog.models import TechnicalDocument

logger = logging.getLogger(__name__)

TECH_DOC_TOPICS = [
    {
        "title": "Aluminium Sulphate (Alum) — Product Technical Data Sheet",
        "doc_type": "datasheet",
        "standard_code": "KEBS KS 1490",
        "focus": (
            "Create a comprehensive Product Technical Data Sheet (TDS) for Aluminium Sulphate (Alum) "
            "as used in water treatment. Include: product description, chemical formula (Al₂(SO₄)₃·18H₂O), "
            "CAS number (10043-01-3), physical properties (appearance, pH, specific gravity, solubility), "
            "application guidelines (optimal dosage, pH range 6-8, jar test procedures), "
            "storage requirements, shelf life, packaging options (25kg bags, 1000kg IBC), "
            "relevant standards (KEBS KS 1490, ISO 10058, AWWA B403), "
            "and a short FAQ section (3 questions)."
        ),
    },
    {
        "title": "Sodium Hypochlorite Solution — Safety Data Sheet (SDS)",
        "doc_type": "datasheet",
        "standard_code": "GHS Rev.9",
        "focus": (
            "Create a GHS-compliant Safety Data Sheet (SDS) for Sodium Hypochlorite Solution (12-15% active chlorine). "
            "Include all 16 SDS sections as per GHS Rev.9: identification, hazard identification (oxidiser, corrosive), "
            "composition, first-aid measures, firefighting, accidental release, handling & storage, "
            "exposure controls/PPE, physical & chemical properties, stability & reactivity, "
            "toxicological information, ecological information, disposal, transport (UN 1791), "
            "regulatory information (REACH, KEBS), and other information. "
            "Include relevant pictograms descriptions and NFPA ratings."
        ),
    },
    {
        "title": "ISO 9001:2015 Quality Management — Implementation Guide for Chemical Suppliers",
        "doc_type": "iso_guide",
        "standard_code": "ISO 9001:2015",
        "focus": (
            "Create a detailed implementation guide for ISO 9001:2015 Quality Management System for industrial chemical suppliers. "
            "Cover: (1) scope and applicability to chemical trading and distribution businesses, "
            "(2) clause-by-clause summary of key requirements (Clauses 4-10), "
            "(3) documentation requirements: quality policy, quality objectives, risk register, "
            "SOPs for procurement, storage, and dispatch, "
            "(4) common nonconformances found during audits in chemical businesses, "
            "(5) how certification improves bid eligibility for government and NGO tenders in Kenya. "
            "Include 3+ FAQs."
        ),
    },
    {
        "title": "ISO 14001:2015 Environmental Management — Guide for Chemical Warehousing",
        "doc_type": "iso_guide",
        "standard_code": "ISO 14001:2015",
        "focus": (
            "Create a practical guide to implementing ISO 14001:2015 Environmental Management System for chemical warehousing operations in Kenya. "
            "Cover: (1) environmental aspects and impacts register for chemical storage (spills, VOC emissions, effluent discharge), "
            "(2) NEMA compliance integration with ISO 14001 requirements, "
            "(3) emergency response procedures for chemical spills and fire, "
            "(4) monitoring and measurement requirements for environmental performance, "
            "(5) how ISO 14001 certification aligns with green procurement policies in East Africa. "
            "Include 3+ FAQs."
        ),
    },
    {
        "title": "KEBS KS 04-136 — Compliance Guide for Industrial Chemical Importers",
        "doc_type": "kebs_guide",
        "standard_code": "KEBS KS 04-136",
        "focus": (
            "Create a compliance guide for industrial chemical importers in Kenya under KEBS KS 04-136 "
            "(Requirements for Chemical Products). "
            "Cover: (1) mandatory KEBS pre-export verification requirements for imported chemicals, "
            "(2) Diamond Mark of Quality certification process for chemical products, "
            "(3) documentation required at Kenya ports of entry: CoA, MSDS, Bill of Lading, Form C17, "
            "(4) KEBS product certification fees and timelines, "
            "(5) common import clearance issues and how to resolve them. "
            "Include 3+ FAQs targeting import/procurement managers."
        ),
    },
    {
        "title": "Boiler Water Quality Guidelines — Technical Reference Card",
        "doc_type": "datasheet",
        "standard_code": "ASME PTC 12.2",
        "focus": (
            "Create a concise technical reference document for boiler water quality parameters "
            "based on ASME PTC 12.2 and BS EN 12952-12. "
            "Include a table with recommended water quality parameters by boiler pressure range "
            "(0-20 bar, 20-40 bar, 40+ bar) for: pH, conductivity, TDS, silica, iron, hardness, alkalinity, oxygen. "
            "Include guidance on blowdown calculations, chemical dosing rates for oxygen scavengers and scale inhibitors, "
            "frequency of water analysis testing, and corrective actions when parameters are out of range. "
            "Include 3+ FAQs targeting boiler operators and plant engineers."
        ),
    },
    {
        "title": "GHS Hazard Classification — Quick Reference for Chemical Buyers",
        "doc_type": "iso_guide",
        "standard_code": "GHS Rev.9",
        "focus": (
            "Create a practical quick-reference guide to GHS hazard classification for chemical procurement staff in Kenya. "
            "Include: (1) overview of all 9 GHS pictograms with descriptions of when each applies, "
            "(2) signal word rules (Danger vs Warning), "
            "(3) H-statement and P-statement numbering conventions, "
            "(4) how to assess chemical compatibility and segregation requirements during storage, "
            "(5) a summary table of common industrial chemicals (acids, bases, oxidisers, flammables) "
            "and their hazard categories. "
            "Include 3+ FAQs."
        ),
    },
    {
        "title": "REACH Compliance for Chemical Importers in East Africa — A Practical Overview",
        "doc_type": "whitepaper",
        "standard_code": "REACH (EC 1907/2006)",
        "focus": (
            "Create a technical whitepaper explaining REACH (Registration, Evaluation, Authorisation and Restriction of Chemicals) "
            "regulation and its practical implications for chemical importers and distributors in East Africa. "
            "Cover: (1) what REACH is and which chemicals are affected (Substances of Very High Concern — SVHC list), "
            "(2) how REACH affects Kenyan importers purchasing from European suppliers, "
            "(3) SVHC communication obligations down the supply chain, "
            "(4) REACH-aligned product documentation requirements (ECHA SIEF registration numbers), "
            "(5) due diligence checklist when sourcing EU-manufactured chemicals. "
            "Include 3+ FAQs."
        ),
    },
    {
        "title": "Cooling Tower Water Treatment — Legionella Risk Management Guide",
        "doc_type": "whitepaper",
        "standard_code": "BS 8580-1:2019",
        "focus": (
            "Create a detailed Legionella risk management guide for cooling tower operators in Kenya, "
            "based on BS 8580-1:2019 and WHO cooling tower guidelines. "
            "Cover: (1) biology of Legionella pneumophila and conditions that promote growth, "
            "(2) risk assessment methodology: cooling tower inspection checklist, "
            "(3) chemical treatment programme: biocides (chlorine dioxide, isothiazolinone, DBNPA), dosing frequencies, "
            "(4) physical cleaning procedures and disinfection protocols, "
            "(5) monitoring requirements: Legionella sampling, dip slide tests, TVC counts, "
            "(6) legal obligations for facilities managers under occupational health regulations. "
            "Include 3+ FAQs targeting facilities managers and HVAC contractors."
        ),
    },
    {
        "title": "Effluent Treatment for Flower Farms — NEMA Compliance Technical Guide",
        "doc_type": "kebs_guide",
        "standard_code": "NEMA Legal Notice 120",
        "focus": (
            "Create a practical technical guide on effluent treatment for flower and horticulture farms in Kenya "
            "targeting NEMA compliance under Legal Notice 120 (Environmental Management and Co-ordination Act). "
            "Cover: (1) typical effluent composition from floriculture: pesticide residues, fertiliser runoff, pH extremes, "
            "(2) NEMA discharge limits for water, land, and sewers, "
            "(3) chemical treatment approach: pH correction with lime/H₂SO₄, coagulation with FeCl₃ or PAC, "
            "and sludge dewatering with polyelectrolytes, "
            "(4) effluent monitoring records and NEMA annual environmental audit requirements, "
            "(5) cost-effective treatment system design for small to medium flower farms (1-10 hectares). "
            "Include 3+ FAQs targeting environmental compliance officers and farm managers."
        ),
    },
]

SYSTEM_PROMPT = (
    "You are a senior chemical engineer and technical documentation specialist writing authoritative "
    "technical reference documents for Zenco Chemicals, a leading industrial and specialty chemical supplier in East Africa. "
    "Your audience is plant engineers, environmental compliance officers, and procurement managers.\n\n"
    "Every document you produce must:\n"
    "- Use proper, well-structured HTML with clear H1, H2, and H3 headings\n"
    "- Include HTML tables where appropriate (property tables, comparison tables, parameter tables)\n"
    "- Include at least 3 FAQ items using <details><summary>Question?</summary><p>Answer...</p></details> format\n"
    "- Reference the relevant standard code prominently\n"
    "- Include at least 2 external links to authority sources (iso.org, kebs.org, echa.europa.eu, who.int, wikipedia.org) "
    "with target='_blank' rel='noopener noreferrer'\n"
    "- Be between 900 and 1,800 words in the body\n\n"
    "Return ONLY a valid JSON object with these exact keys:\n"
    "{\n"
    '  "title": "...",\n'
    '  "slug": "url-safe-slug",\n'
    '  "excerpt": "150-280 char professional summary",\n'
    '  "meta_title": "<=70 char SEO title",\n'
    '  "meta_description": "<=160 char meta description",\n'
    '  "body_html": "<h1>...</h1><h2>...</h2>... full HTML content"\n'
    "}"
)


class Command(BaseCommand):
    help = "Generates 10 AI-powered Technical Documents for Zenco Chemicals."

    def add_arguments(self, parser):
        parser.add_argument("--dry-run", action="store_true", help="Preview without saving.")
        parser.add_argument("--publish", action="store_true", help="Publish documents immediately.")

    def handle(self, *args, **options):
        dry_run = options["dry_run"]
        publish = options["publish"]

        if not getattr(settings, "OPENAI_API_KEY", None):
            self.stderr.write(self.style.ERROR("OPENAI_API_KEY is not configured. Aborting."))
            return

        from openai import OpenAI
        client = OpenAI(api_key=settings.OPENAI_API_KEY)
        model = getattr(settings, "OPENAI_MODEL", "gpt-4.1-mini")

        self.stdout.write(
            self.style.MIGRATE_HEADING(f"📄 Seeding {len(TECH_DOC_TOPICS)} technical documents using {model}...")
        )

        created, failed = 0, 0

        for i, topic in enumerate(TECH_DOC_TOPICS, 1):
            self.stdout.write(f"\n[{i}/{len(TECH_DOC_TOPICS)}] Generating: {topic['title']}")

            try:
                prompt = (
                    f"Document Title: {topic['title']}\n"
                    f"Document Type: {topic['doc_type']}\n"
                    f"Standard Code: {topic['standard_code']}\n\n"
                    f"Content Instructions:\n{topic['focus']}"
                )

                response = client.responses.create(
                    model=model,
                    input=[
                        {"role": "system", "content": SYSTEM_PROMPT},
                        {"role": "user", "content": prompt},
                    ],
                    text={"format": {"type": "json_object"}},
                )

                data = json.loads(response.output_text)

                if dry_run:
                    body_words = len(data.get("body_html", "").split())
                    self.stdout.write(
                        self.style.WARNING(
                            f"  [DRY-RUN] Would create: '{data.get('title')}' ({body_words} words)"
                        )
                    )
                    continue

                doc = TechnicalDocument.objects.create(
                    title=data.get("title", topic["title"]),
                    slug=data.get("slug") or None,
                    doc_type=topic["doc_type"],
                    standard_code=topic["standard_code"],
                    excerpt=data.get("excerpt", ""),
                    body_html=data.get("body_html", ""),
                    meta_title=data.get("meta_title", ""),
                    meta_description=data.get("meta_description", ""),
                    is_published=publish,
                )

                body_words = len(doc.body_html.split())
                self.stdout.write(
                    self.style.SUCCESS(
                        f"  ✅ Created '{doc.title}' [{doc.doc_type}] — {body_words} words"
                    )
                )
                created += 1

            except Exception as exc:
                self.stderr.write(self.style.ERROR(f"  ❌ Failed: {exc}"))
                logger.error(f"seed_technical_docs error for '{topic['title']}': {exc}")
                failed += 1

        self.stdout.write(
            self.style.SUCCESS(f"\n✅ Done — {created} documents created, {failed} failed.")
        )
