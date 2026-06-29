import re
from django.utils.text import slugify
from apps.products.models import Product
from apps.services.models import Service
from .models import TechnicalDocument


def inject_internal_links(content, related_products=None, related_services=None, related_docs=None):
    """
    Scans the HTML body, finds references to products, services, and technical documents,
    and replaces them with links (if they exist and are valid).
    Also appends contact, quote, and related sections.
    """
    from .quality_engine import get_valid_sitemap_urls
    valid_urls = get_valid_sitemap_urls()

    # 1. Gather all linkable items
    linkables = []

    # Products
    all_products = Product.objects.filter(status="published")
    for p in all_products:
        url = f"/products/{p.slug}"
        if url in valid_urls:
            linkables.append((p.name, url, "product"))

    # Services
    all_services = Service.objects.all()
    for s in all_services:
        url = f"/services/{s.slug}"
        if url in valid_urls:
            linkables.append((s.name, url, "service"))

    # Technical Documents
    all_docs = TechnicalDocument.objects.filter(is_published=True)
    for d in all_docs:
        url = f"/technical-docs/{d.slug}"
        if url in valid_urls:
            if d.standard_code:
                linkables.append((d.standard_code, url, "doc"))
            linkables.append((d.title, url, "doc"))

    # Sort linkables by term length descending to match longest phrases first
    linkables.sort(key=lambda x: len(x[0]), reverse=True)

    # 2. Parse HTML and perform replacement on text nodes
    parts = re.split(r'(<[^>]+>)', content)
    
    in_link = False
    linked_urls = set()
    linked_terms = set()

    for idx, part in enumerate(parts):
        # Check if this part is an HTML tag
        if part.startswith("<") and part.endswith(">"):
            tag_name = part[1:].split()[0].lower() if len(part) > 2 else ""
            if tag_name.startswith("a"):
                in_link = True
                # Extract URL if present in tag to prevent linking to it again
                href_match = re.search(r'href=["\']([^"\']+)["\']', part)
                if href_match:
                    linked_urls.add(href_match.group(1))
            elif tag_name == "/a":
                in_link = False
            continue

        # If inside a link, skip
        if in_link:
            continue

        # Modify text node
        modified_part = part
        for term, url, item_type in linkables:
            if url in linked_urls or term.lower() in linked_terms:
                continue

            # Exact word match boundary regex
            pattern = re.compile(r'\b(' + re.escape(term) + r')\b', re.IGNORECASE)
            
            # Check if there is a match in this text part
            if pattern.search(modified_part):
                # Replace only the first occurrence
                def replace_match(match):
                    matched_text = match.group(1)
                    return f'<a href="{url}">{matched_text}</a>'
                
                modified_part, count = pattern.subn(replace_match, modified_part, count=1)
                if count > 0:
                    linked_urls.add(url)
                    linked_terms.add(term.lower())
                    
        parts[idx] = modified_part

    reconstructed_content = "".join(parts)

    # 3. Inject CTA section at the bottom (Contact & Quote)
    cta_injected = False
    if "/contact" in valid_urls and "/request-quote" in valid_urls:
        # Check if already has CTA
        if "/contact" not in reconstructed_content and "/request-quote" not in reconstructed_content:
            cta_html = (
                '<div class="cta-strip my-8 p-6 bg-gray-50 rounded-2xl border border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4">\n'
                '  <div>\n'
                '    <h4 class="font-bold text-lg text-primary">Need Technical Assistance?</h4>\n'
                '    <p class="text-sm text-gray-500">Contact our chemical engineers to discuss your plant requirements.</p>\n'
                '  </div>\n'
                '  <div class="flex gap-3">\n'
                '    <a href="/contact" class="btn btn-secondary px-4 py-2 text-xs">Send Inquiry</a>\n'
                '    <a href="/request-quote" class="btn btn-primary px-4 py-2 text-xs">Request a Quote</a>\n'
                '  </div>\n'
                '</div>\n'
            )
            reconstructed_content += "\n" + cta_html
            cta_injected = True

    # 4. Inject Related Products and Services sections at the bottom
    related_html_sections = []
    
    if related_products and related_products.exists():
        prod_list = "".join([f'<li><a href="/products/{p.slug}">{p.name}</a></li>' for p in related_products])
        related_html_sections.append(
            f'<div class="related-products-section mt-8">\n'
            f'  <h3 class="text-xl font-bold text-primary mb-3">Related Products</h3>\n'
            f'  <ul class="list-disc pl-5 space-y-1 text-accent font-medium">\n'
            f'    {prod_list}\n'
            f'  </ul>\n'
            f'</div>\n'
        )

    if related_services and related_services.exists():
        serv_list = "".join([f'<li><a href="/services/{s.slug}">{s.name}</a></li>' for s in related_services])
        related_html_sections.append(
            f'<div class="related-services-section mt-8">\n'
            f'  <h3 class="text-xl font-bold text-primary mb-3">Related Services</h3>\n'
            f'  <ul class="list-disc pl-5 space-y-1 text-accent font-medium">\n'
            f'    {serv_list}\n'
            f'  </ul>\n'
            f'</div>\n'
        )

    if related_html_sections:
        reconstructed_content += "\n" + "\n".join(related_html_sections)

    return reconstructed_content
