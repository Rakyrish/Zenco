"""
Management command: seed_initial_blogs
Generates 6 high-quality AI-powered technical blog posts for Zenco Chemicals.
Usage: python manage.py seed_initial_blogs [--dry-run]
"""
import json
import logging
from django.core.management.base import BaseCommand
from django.conf import settings
from django.utils import timezone
from apps.blog.models import BlogPost, BlogCategory, BlogTag, BlogGenerationLog

logger = logging.getLogger(__name__)

BLOG_TOPICS = [
    {
        "title": "Water Treatment Chemicals: A Complete Guide to Coagulation and Flocculation",
        "category": "Water Treatment",
        "tags": ["water treatment", "coagulation", "flocculation", "alum", "polyelectrolyte", "municipal water"],
        "focus": (
            "Write a comprehensive technical guide on coagulation and flocculation in water treatment plants. "
            "Cover: (1) the chemistry of coagulants like alum (aluminium sulphate) and ferric chloride, "
            "(2) the role of polyelectrolyte flocculants in sludge dewatering, "
            "(3) optimal dosing strategies for East African raw water quality, "
            "(4) common troubleshooting issues like carryover and poor floc formation, "
            "(5) relevant compliance standards: ISO 11885, KEBS KS 1490, and WHO Drinking Water Guidelines. "
            "Include a minimum of 5 FAQ items. Target plant engineers and water utility procurement managers."
        ),
    },
    {
        "title": "GHS Compliance in East Africa: Understanding Hazard Communication for Industrial Chemicals",
        "category": "Safety & Compliance",
        "tags": ["GHS", "SDS", "hazard communication", "KEBS", "chemical safety", "East Africa"],
        "focus": (
            "Write an authoritative guide on GHS (Globally Harmonised System) compliance for industrial chemical suppliers in Kenya and East Africa. "
            "Cover: (1) overview of GHS pictograms, hazard classes, and signal words, "
            "(2) how to read and interpret a Safety Data Sheet (SDS) per GHS Rev.9, "
            "(3) KEBS enforcement of GHS in Kenya and the EAC harmonisation position, "
            "(4) responsibilities of importers, distributors, and end-users, "
            "(5) how Zenco Chemicals ensures all products are GHS-labelled and SDS-compliant. "
            "Include 5+ FAQs and reference GHS Rev.9, KEBS KS 1826, and REACH (EU) for context."
        ),
    },
    {
        "title": "Cooling Water Treatment: Preventing Scale, Corrosion, and Microbial Growth",
        "category": "Cooling Systems",
        "tags": ["cooling water", "scale inhibitor", "corrosion inhibitor", "biocide", "legionella", "HVAC"],
        "focus": (
            "Write a detailed technical article on cooling water treatment for industrial cooling towers and HVAC systems. "
            "Cover: (1) the four main problems — scaling, corrosion, biofouling, and deposition, "
            "(2) chemical solutions: scale inhibitors (phosphonate-based), corrosion inhibitors (molybdate, BZT), "
            "and biocides (isothiazolinone, glutaraldehyde), "
            "(3) cycles of concentration management and bleed-off control, "
            "(4) Legionella risk management in accordance with BS 8580-1:2019 and WHO cooling tower guidelines, "
            "(5) water analysis requirements and frequency of monitoring. "
            "Include 5+ FAQs and target facilities managers and mechanical engineers."
        ),
    },
    {
        "title": "Industrial Cleaning Chemicals: Choosing the Right Detergent for Food Processing Plants",
        "category": "Industrial Cleaning",
        "tags": ["CIP chemicals", "caustic soda", "food grade", "HACCP", "alkaline cleaner", "food processing"],
        "focus": (
            "Write a technical buying guide for industrial cleaning chemicals in food and agro-processing facilities. "
            "Cover: (1) CIP (Clean-in-Place) vs. manual cleaning system selection, "
            "(2) alkaline cleaners (NaOH-based), acid cleaners (phosphoric acid), and sanitisers (peracetic acid, QAC), "
            "(3) HACCP compliance requirements for cleaning chemicals under KEBS and Codex Alimentarius, "
            "(4) how to evaluate chemical efficacy: soil type, contact time, temperature, and concentration, "
            "(5) safe chemical storage and handling in food production environments. "
            "Include 5+ FAQs and reference KEBS KS 1500, ISO 22000, and Codex CAC/RCP 1-1969."
        ),
    },
    {
        "title": "Boiler Water Treatment: Preventing Corrosion and Scale in Industrial Steam Systems",
        "category": "Boiler Systems",
        "tags": ["boiler water", "scale prevention", "oxygen scavenger", "DEHA", "steam system", "corrosion"],
        "focus": (
            "Write a comprehensive technical guide on boiler water treatment for industrial steam boilers. "
            "Cover: (1) the chemistry of scale formation and its impact on thermal efficiency, "
            "(2) internal treatment chemicals: oxygen scavengers (DEHA, sodium sulphite), scale inhibitors (polymaleic acid, HEDP), "
            "pH adjusters (NaOH, morpholine), and condensate line protection, "
            "(3) external treatment: softening, deaeration, and reverse osmosis pretreatment, "
            "(4) ASME boiler water quality guidelines and BS EN 12952-12 compliance, "
            "(5) blowdown control and TDS management strategies. "
            "Include 5+ FAQs targeting plant engineers at tea factories, sugar mills, and manufacturing plants."
        ),
    },
    {
        "title": "Wastewater Treatment for Agro-Processing: Meeting NEMA Effluent Discharge Standards in Kenya",
        "category": "Wastewater Treatment",
        "tags": ["wastewater treatment", "NEMA", "effluent standards", "coagulant", "pH correction", "Kenya"],
        "focus": (
            "Write a practical technical guide on wastewater treatment for agro-processing facilities in Kenya. "
            "Cover: (1) common effluent contaminants from agro-processing (BOD, COD, TSS, fats/oils), "
            "(2) Kenya NEMA effluent discharge standards (Legal Notice 120, Environmental Management and Coordination Act), "
            "(3) chemical treatment stages: pH correction (sulphuric acid or lime), coagulation/flocculation, "
            "and nutrient removal (phosphorous precipitation with FeCl₃), "
            "(4) sludge management and dewatering with polyelectrolytes, "
            "(5) NEMA environmental audit requirements and frequency. "
            "Include 5+ FAQs targeting environmental officers and plant managers in flower, horticulture, and dairy sectors."
        ),
    },
]

SYSTEM_PROMPT = (
    "You are a highly experienced technical writer and chemical engineer writing authoritative, SEO-optimised blog content for Zenco Chemicals, "
    "a leading industrial and specialty chemical supplier in East Africa (Kenya). "
    "Your audience is plant engineers, procurement managers, and environmental officers at water treatment plants, "
    "manufacturing facilities, agro-processors, and cooling system operators. "
    "\n\n"
    "Every article you produce must:\n"
    "- Be between 1,600 and 2,400 words in the body\n"
    "- Use valid HTML with proper heading hierarchy (one H1 == the title, 4+ H2 sections, 2+ H3 subsections)\n"
    "- Include at minimum 5 FAQ items using <details><summary>Question?</summary><p>Answer...</p></details> format, "
    "with each answer being at least 60 words\n"
    "- Include at least 3 internal links formatted as <a href='/[path]'>anchor text</a> (products, services, blog, technical-docs, contact, request-quote)\n"
    "- Include at least 2 external authority links to approved domains (wikipedia.org, iso.org, kebs.org, who.int, echa.europa.eu) "
    "formatted with target='_blank' rel='noopener noreferrer'\n"
    "- Reference at least 2 specific regulatory standards (ISO, KEBS, NEMA, GHS, WHO, ASME, BS EN, etc.)\n"
    "- End with a <h2>Conclusion</h2> section summarising key takeaways\n"
    "\n"
    "Return ONLY a valid JSON object with these exact keys:\n"
    "{\n"
    '  "title": "...",\n'
    '  "slug": "url-safe-slug",\n'
    '  "excerpt": "150-280 char summary for listings",\n'
    '  "meta_title": "<=70 char SEO title",\n'
    '  "meta_description": "<=160 char meta description",\n'
    '  "content": "<h1>...</h1><h2>...</h2>... full HTML body",\n'
    '  "suggested_tags": ["tag1", "tag2"]\n'
    "}"
)


class Command(BaseCommand):
    help = "Generates 6 high-quality AI blog posts for Zenco Chemicals and saves them as drafts."

    def add_arguments(self, parser):
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Show what would be created without saving to the database.",
        )
        parser.add_argument(
            "--publish",
            action="store_true",
            help="Publish posts immediately instead of saving as drafts.",
        )

    def handle(self, *args, **options):
        dry_run = options["dry_run"]
        publish = options["publish"]

        if not getattr(settings, "OPENAI_API_KEY", None):
            self.stderr.write(self.style.ERROR("OPENAI_API_KEY is not configured. Aborting."))
            return

        from openai import OpenAI
        client = OpenAI(api_key=settings.OPENAI_API_KEY)
        model = getattr(settings, "OPENAI_MODEL", "gpt-4.1-mini")

        self.stdout.write(self.style.MIGRATE_HEADING(f"🚀 Seeding {len(BLOG_TOPICS)} blog posts using {model}..."))

        created_count = 0
        failed_count = 0

        for i, topic in enumerate(BLOG_TOPICS, 1):
            self.stdout.write(f"\n[{i}/{len(BLOG_TOPICS)}] Generating: {topic['title']}")

            try:
                prompt = (
                    f"Topic: {topic['title']}\n\n"
                    f"Content Focus:\n{topic['focus']}"
                )

                response = client.responses.create(
                    model=model,
                    input=[
                        {"role": "system", "content": SYSTEM_PROMPT},
                        {"role": "user", "content": prompt},
                    ],
                    text={"format": {"type": "json_object"}},
                )

                raw = response.output_text
                data = json.loads(raw)

                title = data.get("title", topic["title"])
                slug = data.get("slug", "")
                excerpt = data.get("excerpt", "")
                meta_title = (data.get("meta_title", "") or "")[:70]
                meta_description = (data.get("meta_description", "") or "")[:160]
                content = data.get("content", "")

                if dry_run:
                    self.stdout.write(self.style.WARNING(f"  [DRY-RUN] Would create: '{title}' ({len(content.split())} words)"))
                    continue

                # Get or create category
                cat_name = topic.get("category", "General")
                category, _ = BlogCategory.objects.get_or_create(
                    name=cat_name,
                    defaults={"color": "#F26C0C"},
                )

                # Determine status
                post_status = "published" if publish else "draft"

                # Create blog post
                post = BlogPost.objects.create(
                    title=title,
                    slug=slug or None,
                    excerpt=excerpt,
                    content=content,
                    meta_title=meta_title,
                    meta_description=meta_description,
                    seo_title=meta_title,
                    seo_description=meta_description,
                    category=category,
                    status=post_status,
                    is_published=(post_status == "published"),
                    published_at=timezone.now() if post_status == "published" else None,
                    author_name="Zenco Technical Team",
                )

                # Add categories M2M
                post.categories.add(category)

                # Add tags (resilient to slug collision across runs)
                all_tags = list(set(topic.get("tags", []) + data.get("suggested_tags", [])))
                for tag_name in all_tags[:8]:  # cap at 8 tags
                    clean = tag_name.lower().strip()
                    try:
                        tag, _ = BlogTag.objects.get_or_create(name=clean, defaults={})
                    except Exception:
                        tag = BlogTag.objects.filter(name=clean).first()
                    if tag:
                        post.tags.add(tag)

                # Log generation
                tokens = getattr(response, "usage", None)
                token_count = tokens.total_tokens if tokens else 0

                BlogGenerationLog.objects.create(
                    blog=post,
                    triggered_by="admin",
                    topic_used=topic["title"],
                    tokens_used=token_count,
                    quality_score=0,  # Will be scored in a separate step
                    retries=0,
                    status="success",
                )

                self.stdout.write(
                    self.style.SUCCESS(
                        f"  ✅ Created '{title}' [{post_status}] — {len(content.split())} words"
                    )
                )
                created_count += 1

            except Exception as exc:
                self.stderr.write(self.style.ERROR(f"  ❌ Failed: {exc}"))
                BlogGenerationLog.objects.create(
                    blog=None,
                    triggered_by="admin",
                    topic_used=topic["title"],
                    tokens_used=0,
                    quality_score=0,
                    retries=0,
                    status="failed",
                    error_log=str(exc),
                )
                failed_count += 1

        self.stdout.write(
            self.style.SUCCESS(
                f"\n✅ Done — {created_count} posts created, {failed_count} failed."
            )
        )
