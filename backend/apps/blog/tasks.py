"""
Zenco Blog Automation — Celery Tasks
Scheduled weekly AI blog generation (Monday & Thursday at 9:00 AM EAT / 06:00 UTC)
"""
import json
import logging
from celery import shared_task
from django.conf import settings
from django.utils import timezone
from django.core.mail import send_mail

logger = logging.getLogger(__name__)

# ─── Topic Pools ─────────────────────────────────────────────────────────────

MONDAY_TOPIC_POOL = [
    "Water treatment challenges in East Africa's dry season: chemical dosing adjustments",
    "How to reduce chemical costs in municipal water treatment without sacrificing quality",
    "Phosphate removal from wastewater: chemical precipitation methods and NEMA compliance",
    "Understanding Total Dissolved Solids (TDS) in industrial process water",
    "The role of pH control chemicals in manufacturing quality control",
    "Iron and manganese removal from borehole water: treatment options and dosing guides",
    "Choosing between chlorine gas, sodium hypochlorite, and chlorine dioxide for disinfection",
    "Sustainable water treatment: reducing chemical consumption with smart dosing systems",
    "Membrane fouling prevention in reverse osmosis systems: antiscalants and biocides",
    "Understanding water hardness and its impact on industrial boilers and cooling systems",
]

THURSDAY_TOPIC_POOL = [
    "GHS SDS updates for 2024/2025: what East African chemical importers need to know",
    "Legionella prevention in hotel cooling towers: a practical risk management guide for Kenyan facilities",
    "NEMA environmental audits: preparing your chemical storage and handling documentation",
    "How ISO 14001 can help Kenyan chemical companies win government tenders",
    "Selecting the right industrial degreaser: solvent-based vs. aqueous alkaline cleaners",
    "Chemical supply chain disruption: how to evaluate alternative reagent grades",
    "Food-grade chemical certification: navigating KEBS and HACCP requirements in Kenya",
    "Corrosion in stainless steel chemical storage tanks: causes, prevention, and chemical compatibility",
    "Aquatic toxicity of industrial effluents: NEMA biological oxygen demand (BOD) monitoring guide",
    "Understanding SVHC (Substances of Very High Concern) lists and their import implications in Kenya",
]

SYSTEM_PROMPT = (
    "You are a highly experienced technical writer and chemical engineer writing authoritative, SEO-optimised blog content for Zenco Chemicals, "
    "a leading industrial and specialty chemical supplier in East Africa (Kenya). "
    "Your audience is plant engineers, procurement managers, and environmental officers. "
    "\n\n"
    "Every article must:\n"
    "- Be between 1,600 and 2,400 words in the body\n"
    "- Use valid HTML with proper heading hierarchy (H1 = title, 4+ H2 sections, 2+ H3 subsections)\n"
    "- Include at least 5 FAQ items: <details><summary>Question?</summary><p>60+ word answer</p></details>\n"
    "- Include at least 3 internal links: <a href='/products'>...</a>, <a href='/contact'>...</a>, etc.\n"
    "- Include at least 2 external authority links (wikipedia.org, iso.org, kebs.org, who.int, echa.europa.eu) "
    "with target='_blank' rel='noopener noreferrer'\n"
    "- Reference at least 2 specific standards (ISO, KEBS, NEMA, GHS, WHO, ASME, BS EN)\n"
    "- End with <h2>Conclusion</h2>\n\n"
    "Return ONLY a JSON object:\n"
    "{\n"
    '  "title": "...",\n'
    '  "slug": "url-safe-slug",\n'
    '  "excerpt": "150-280 char summary",\n'
    '  "meta_title": "<=70 char SEO title",\n'
    '  "meta_description": "<=160 char meta description",\n'
    '  "content": "<h1>...</h1>... full HTML body",\n'
    '  "suggested_tags": ["tag1", "tag2"],\n'
    '  "suggested_category": "Water Treatment|Safety & Compliance|Cooling Systems|Industrial Cleaning|Boiler Systems|Wastewater Treatment"\n'
    "}"
)


def _get_used_topics():
    """Returns a set of topics already used in recent blog generation logs."""
    from apps.blog.models import BlogGenerationLog
    recent_logs = BlogGenerationLog.objects.filter(
        status="success"
    ).values_list("topic_used", flat=True)
    return set(recent_logs)


def _pick_topic(pool):
    """Picks the next unused topic from the pool. Falls back to first item if all used."""
    used = _get_used_topics()
    for topic in pool:
        if topic not in used:
            return topic
    return pool[0]  # All used, start over


def _generate_blog_post(topic, triggered_by="scheduler"):
    """
    Core AI generation logic. Returns the saved BlogPost or None on failure.
    Retries up to 3 times with score enforcement.
    """
    from openai import OpenAI
    from apps.blog.models import BlogPost, BlogCategory, BlogTag, BlogGenerationLog
    from apps.blog.quality_engine import run_quality_audit

    client = OpenAI(api_key=settings.OPENAI_API_KEY)
    model = getattr(settings, "OPENAI_MODEL", "gpt-4.1-mini")

    MAX_RETRIES = 3
    attempt = 0
    last_error = ""
    token_total = 0

    while attempt < MAX_RETRIES:
        attempt += 1
        logger.info(f"[Blog Generation] Attempt {attempt}/{MAX_RETRIES} for topic: '{topic}'")

        try:
            response = client.responses.create(
                model=model,
                input=[
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user", "content": f"Write an article on: {topic}"},
                ],
                text={"format": {"type": "json_object"}},
            )

            tokens = getattr(response, "usage", None)
            token_count = tokens.total_tokens if tokens else 0
            token_total += token_count

            data = json.loads(response.output_text)
            content = data.get("content", "")
            title = data.get("title", topic)
            meta_title = (data.get("meta_title", "") or "")[:70]
            meta_description = (data.get("meta_description", "") or "")[:160]
            excerpt = data.get("excerpt", "")

            # Run quality audit
            audit = run_quality_audit(
                title=title,
                content=content,
                meta_title=meta_title,
                meta_description=meta_description,
                excerpt=excerpt,
            )
            quality_score = audit["total_score"]

            logger.info(f"[Blog Generation] Quality score: {quality_score}/100 (pass_save={audit['pass_save']})")

            if not audit["pass_save"]:
                last_error = f"Quality score {quality_score} is below minimum (65). Retrying..."
                logger.warning(f"[Blog Generation] {last_error}")
                continue

            # Determine status
            post_status = "published" if audit["pass_publish"] else "draft"

            # Get or create category
            cat_name = data.get("suggested_category", "General")
            category, _ = BlogCategory.objects.get_or_create(
                name=cat_name,
                defaults={"color": "#F26C0C"}
            )

            # Create post
            post = BlogPost.objects.create(
                title=title,
                slug=data.get("slug") or None,
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
                quality_score=quality_score,
                author_name="Zenco Technical Team",
            )
            post.categories.add(category)

            # Tags
            all_tags = data.get("suggested_tags", [])
            for tag_name in all_tags[:8]:
                tag, _ = BlogTag.objects.get_or_create(
                    name=tag_name.lower().strip(), defaults={}
                )
                post.tags.add(tag)

            # Log success
            BlogGenerationLog.objects.create(
                blog=post,
                triggered_by=triggered_by,
                topic_used=topic,
                tokens_used=token_total,
                quality_score=quality_score,
                retries=attempt - 1,
                status="success",
            )

            return post

        except Exception as exc:
            last_error = str(exc)
            logger.error(f"[Blog Generation] Error on attempt {attempt}: {exc}")

    # All retries exhausted
    from apps.blog.models import BlogGenerationLog
    BlogGenerationLog.objects.create(
        blog=None,
        triggered_by=triggered_by,
        topic_used=topic,
        tokens_used=token_total,
        quality_score=0,
        retries=MAX_RETRIES,
        status="failed",
        error_log=last_error,
    )
    logger.error(f"[Blog Generation] All retries exhausted for topic: '{topic}'. Last error: {last_error}")
    return None


def _send_admin_notification(post, day_label):
    """Sends an email notification to the admin when a new blog is generated."""
    admin_email = getattr(settings, "ADMIN_EMAIL", None)
    if not admin_email:
        return

    try:
        site_url = getattr(settings, "SITE_URL", "https://zencochemicals.com")
        status_str = f"[{post.status.upper()}]"
        subject = f"Zenco Blog Auto-Generated ({day_label}): {post.title} {status_str}"
        message = (
            f"A new blog post was automatically generated by the Zenco AI Blog Engine.\n\n"
            f"Title: {post.title}\n"
            f"Status: {post.status}\n"
            f"Quality Score: {post.quality_score}/100\n"
            f"Preview: {site_url}/blog/{post.slug}\n\n"
            f"Log in to the admin panel to review, edit, or publish the post.\n"
            f"Admin: {site_url}/admin/blog/{post.id}/edit"
        )
        send_mail(
            subject=subject,
            message=message,
            from_email=getattr(settings, "DEFAULT_FROM_EMAIL", "noreply@zencochemicals.com"),
            recipient_list=[admin_email],
            fail_silently=True,
        )
    except Exception as exc:
        logger.error(f"[Blog Generation] Failed to send admin notification: {exc}")


@shared_task(name="blog.generate_monday_blog")
def generate_monday_blog():
    """Monday 9:00 AM EAT — generates a topic-pool post on water treatment / process topics."""
    logger.info("[Celery Beat] Monday blog generation task triggered.")

    topic = _pick_topic(MONDAY_TOPIC_POOL)
    post = _generate_blog_post(topic, triggered_by="scheduler")

    if post:
        _send_admin_notification(post, "Monday")
        logger.info(f"[Celery Beat] Monday post created: '{post.title}' [score={post.quality_score}]")
    else:
        logger.error("[Celery Beat] Monday blog generation failed after all retries.")


@shared_task(name="blog.generate_thursday_blog")
def generate_thursday_blog():
    """Thursday 9:00 AM EAT — generates a compliance / safety topic post."""
    logger.info("[Celery Beat] Thursday blog generation task triggered.")

    topic = _pick_topic(THURSDAY_TOPIC_POOL)
    post = _generate_blog_post(topic, triggered_by="scheduler")

    if post:
        _send_admin_notification(post, "Thursday")
        logger.info(f"[Celery Beat] Thursday post created: '{post.title}' [score={post.quality_score}]")
    else:
        logger.error("[Celery Beat] Thursday blog generation failed after all retries.")


@shared_task(name="blog.generate_ai_blog_on_demand")
def generate_ai_blog_on_demand(topic, triggered_by="admin"):
    """On-demand blog generation triggered from the admin dashboard."""
    logger.info(f"[Blog Gen] On-demand generation: '{topic}' by {triggered_by}")
    post = _generate_blog_post(topic, triggered_by=triggered_by)
    if post:
        return {"status": "success", "post_id": str(post.id), "title": post.title, "quality_score": post.quality_score}
    return {"status": "failed", "error": "All retries exhausted"}


@shared_task(name="blog.generate_datasheet_on_demand")
def generate_datasheet_on_demand(product_id, regenerate=False, triggered_by="admin"):
    """Async single-product datasheet generation."""
    from apps.products.models import Product
    from apps.blog.datasheet_engine import generate_datasheet_for_product

    try:
        product = Product.objects.select_related('category').get(pk=product_id)
    except Product.DoesNotExist:
        return {"status": "failed", "error": "Product not found."}

    sheet, error = generate_datasheet_for_product(
        product, regenerate=regenerate, triggered_by=triggered_by
    )
    if sheet:
        return {
            "status": "success",
            "datasheet_id": sheet.id,
            "product_name": product.name,
            "validation_flags": sheet.validation_flags,
        }
    return {"status": "failed", "error": error}


@shared_task(bind=True, name="blog.generate_all_datasheets")
def generate_all_datasheets_task(self, triggered_by="admin"):
    """Bulk generate datasheets for all products without one. Saves as drafts."""
    from apps.products.models import Product
    from apps.blog.datasheet_engine import generate_datasheet_for_product

    products = list(
        Product.objects.filter(
            is_active=True,
            is_deleted=False,
            product_data_sheet__isnull=True,
        ).select_related('category').order_by('name')
    )
    total = len(products)
    success = 0
    failed = []

    for index, product in enumerate(products, start=1):
        self.update_state(
            state='PROGRESS',
            meta={
                'current': index,
                'total': total,
                'product_name': product.name,
            },
        )
        sheet, error = generate_datasheet_for_product(
            product, regenerate=False, triggered_by='bulk_seed'
        )
        if sheet:
            success += 1
            logger.info("[Datasheet Bulk] Created TDS for %s", product.name)
        else:
            failed.append({'product': product.name, 'error': error})
            logger.error("[Datasheet Bulk] Failed for %s: %s", product.name, error)

    return {'success': success, 'total': total, 'failed': failed}
