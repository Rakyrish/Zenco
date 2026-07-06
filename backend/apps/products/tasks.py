"""
Zenco Product Content — Celery Tasks
Bulk and single-product content regeneration. URL, image, category, and SEO
history are always preserved (see content_engine.apply_generated_content).
"""
import logging

from celery import shared_task

logger = logging.getLogger(__name__)


@shared_task(name="products.regenerate_product_content")
def regenerate_product_content_task(product_id, extra_context="", triggered_by="admin"):
    """Async single-product content regeneration."""
    from apps.products.models import Product
    from apps.products.content_engine import regenerate_product

    try:
        product = Product.objects.select_related('category').get(pk=product_id)
    except Product.DoesNotExist:
        return {"status": "failed", "error": "Product not found."}

    updated, error = regenerate_product(product, extra_context)
    if updated:
        logger.info("[Content Regen] Updated '%s' (%s) by %s", product.name, product.slug, triggered_by)
        return {"status": "success", "product_id": str(product.id), "slug": product.slug}
    logger.error("[Content Regen] Failed for '%s': %s", product.name, error)
    return {"status": "failed", "error": error, "product_id": str(product.id)}


@shared_task(bind=True, name="products.bulk_regenerate_content")
def bulk_regenerate_content_task(self, product_ids=None, triggered_by="admin"):
    """
    Bulk regenerate content for selected products (product_ids list) or the
    entire active catalog (product_ids=None). Reports progress via task state.
    """
    from apps.products.models import Product
    from apps.products.content_engine import regenerate_product

    qs = Product.objects.filter(is_active=True, is_deleted=False).select_related('category')
    if product_ids:
        qs = qs.filter(pk__in=product_ids)
    products = list(qs.order_by('name'))

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
                'success': success,
                'failed': len(failed),
            },
        )
        updated, error = regenerate_product(product)
        if updated:
            success += 1
            logger.info("[Content Regen Bulk] %s/%s OK: %s", index, total, product.slug)
        else:
            failed.append({'product': product.name, 'slug': product.slug, 'error': error})
            logger.error("[Content Regen Bulk] %s/%s FAILED: %s — %s", index, total, product.slug, error)

    return {'success': success, 'total': total, 'failed': failed, 'triggered_by': triggered_by}


@shared_task(name="products.generate_category_content")
def generate_category_content_task(category_id, triggered_by="admin"):
    """Async category authority-page content generation."""
    from apps.products.models import Category
    from apps.products.content_engine import generate_category_content, apply_category_content

    try:
        category = Category.objects.get(pk=category_id)
    except Category.DoesNotExist:
        return {"status": "failed", "error": "Category not found."}

    data, error = generate_category_content(category)
    if error:
        logger.error("[Category Content] Failed for '%s': %s", category.name, error)
        return {"status": "failed", "error": error}
    apply_category_content(category, data)
    logger.info("[Category Content] Updated '%s' by %s", category.name, triggered_by)
    return {"status": "success", "category_id": str(category.id), "slug": category.slug}
