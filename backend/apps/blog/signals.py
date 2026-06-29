from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import BlogPost, TechnicalDocument
from .linker import inject_internal_links


@receiver(post_save, sender=BlogPost)
def auto_link_blog_post(sender, instance, created, **kwargs):
    """
    Automates internal link injection for blog posts upon saving.
    Uses recursion protection by setting a private attribute and using Django filter updates.
    """
    if getattr(instance, '_linking_running', False):
        return

    # Avoid running linking on completely blank or tiny stub drafts
    if not instance.content or len(instance.content.strip()) < 50:
        return

    instance._linking_running = True
    try:
        # Retrieve related products, services, and docs dynamically
        related_products = instance.related_products
        related_services = instance.related_services
        related_docs = instance.related_docs

        new_content = inject_internal_links(
            instance.content,
            related_products=related_products,
            related_services=related_services,
            related_docs=related_docs,
        )

        if new_content != instance.content:
            BlogPost.objects.filter(pk=instance.pk).update(content=new_content)
    finally:
        instance._linking_running = False


@receiver(post_save, sender=TechnicalDocument)
def auto_link_tech_doc(sender, instance, created, **kwargs):
    """
    Automates internal link injection for technical documents upon saving.
    """
    if getattr(instance, '_linking_running', False):
        return

    if not instance.body_html or len(instance.body_html.strip()) < 50:
        return

    instance._linking_running = True
    try:
        related_products = instance.related_products

        new_body = inject_internal_links(
            instance.body_html,
            related_products=related_products,
        )

        if new_body != instance.body_html:
            TechnicalDocument.objects.filter(pk=instance.pk).update(body_html=new_body)
    finally:
        instance._linking_running = False
