import re
from django.conf import settings
from apps.products.models import Product
from apps.services.models import Service
from .models import BlogPost, TechnicalDocument


def get_valid_sitemap_urls():
    """Builds a set of all valid internal URLs in the system to prevent 404s."""
    urls = {
        "/",
        "/contact",
        "/request-quote",
        "/products",
        "/services",
        "/industries",
        "/blog",
        "/technical-docs",
        "/faqs",
        "/about",
    }
    
    # Add dynamic products
    for p in Product.objects.filter(status="published"):
        urls.add(f"/products/{p.slug}")
    
    # Add dynamic services
    for s in Service.objects.all():
        urls.add(f"/services/{s.slug}")
        
    # Add dynamic technical documents
    for d in TechnicalDocument.objects.filter(is_published=True):
        urls.add(f"/technical-docs/{d.slug}")
        
    # Add dynamic blog posts
    for b in BlogPost.objects.filter(status="published"):
        urls.add(f"/blog/{b.slug}")
        
    return urls


def run_quality_audit(title, content, meta_title="", meta_description="", excerpt=""):
    """
    Runs a comprehensive quality audit on a blog post.
    Returns a dict with total_score, pass_save (>=65), pass_publish (>=80), and details.
    """
    total_score = 0
    breakdown = {}
    details = []

    # 1. Heading Structure (10 pts)
    headings = re.findall(r'<h([1-6])\b', content, re.IGNORECASE)
    levels = [1] + [int(h) for h in headings]
    h2_count = levels.count(2)
    h3_count = levels.count(3)
    
    skipped_headings = False
    for i in range(len(levels) - 1):
        if levels[i+1] > levels[i] + 1:
            skipped_headings = True
            break

    heading_score = 0
    if h2_count >= 4 and h3_count >= 2 and not skipped_headings:
        heading_score = 10
        details.append("Heading structure: Passed (4+ H2, 2+ H3, no skipped levels).")
    else:
        heading_issues = []
        if h2_count < 4:
            heading_issues.append(f"fewer than 4 H2 headings ({h2_count} found)")
        if h3_count < 2:
            heading_issues.append(f"fewer than 2 H3 headings ({h3_count} found)")
        if skipped_headings:
            heading_issues.append("skipped levels detected")
        details.append(f"Heading structure: Failed ({', '.join(heading_issues)}).")
    
    total_score += heading_score
    breakdown["headings"] = heading_score

    # 2. FAQ Quality (10 pts)
    # Check details/summary tags
    details_faqs = re.findall(r'<details\b.*?>(.*?)</details>', content, re.DOTALL | re.IGNORECASE)
    faq_count = 0
    long_answers_count = 0
    
    for item in details_faqs:
        summary = re.search(r'<summary\b.*?>(.*?)</summary>', item, re.DOTALL | re.IGNORECASE)
        answer = re.sub(r'<summary\b.*?>.*?</summary>', '', item, flags=re.DOTALL | re.IGNORECASE)
        answer_clean = re.sub(r'<[^>]+>', ' ', answer).strip()
        words = answer_clean.split()
        if summary:
            faq_count += 1
            if len(words) >= 50:
                long_answers_count += 1

    # Fallback to H3/H4 questions ending with ? followed by <p>
    if faq_count < 5:
        h_questions = re.findall(r'<h[34]\b.*?>(.*?)\?</h[34]>.*?<p\b.*?>(.*?)</p>', content, re.DOTALL | re.IGNORECASE)
        if len(h_questions) > faq_count:
            faq_count = len(h_questions)
            long_answers_count = sum(1 for q, a in h_questions if len(re.sub(r'<[^>]+>', ' ', a).split()) >= 50)

    faq_score = 0
    if faq_count >= 5 and long_answers_count >= 5:
        faq_score = 10
        details.append("FAQ Quality: Passed (5+ FAQs, each answer 50+ words).")
    else:
        details.append(f"FAQ Quality: Failed ({faq_count} FAQs found, {long_answers_count} have 50+ words).")

    total_score += faq_score
    breakdown["faqs"] = faq_score

    # 3. Internal Links (15 pts)
    # Extract links
    raw_links = re.findall(r'href=["\']([^"\']+)["\']', content)
    valid_urls = get_valid_sitemap_urls()
    
    internal_links_count = 0
    invalid_internal_links = []
    
    for link in raw_links:
        # Check if internal
        if link.startswith("/") or any(domain in link for domain in ["zencosystems.co.ke", "zencochemicals.com", "localhost"]):
            clean_link = link
            # strip domain
            for d in ["https://zencosystems.co.ke", "http://zencosystems.co.ke", "https://zencochemicals.com", "http://zencochemicals.com", "http://localhost:3000", "http://localhost:8000"]:
                if clean_link.startswith(d):
                    clean_link = clean_link[len(d):]
            # strip query params or hash
            clean_link = clean_link.split("?")[0].split("#")[0]
            if clean_link in valid_urls:
                internal_links_count += 1
            else:
                invalid_internal_links.append(link)

    internal_score = 0
    if internal_links_count >= 3 and len(invalid_internal_links) == 0:
        internal_score = 15
        details.append(f"Internal Links: Passed ({internal_links_count} valid links).")
    else:
        issues = []
        if internal_links_count < 3:
            issues.append(f"fewer than 3 valid internal links ({internal_links_count} found)")
        if invalid_internal_links:
            issues.append(f"invalid internal URLs ({', '.join(invalid_internal_links)})")
        details.append(f"Internal Links: Failed ({', '.join(issues)}).")

    total_score += internal_score
    breakdown["internal_links"] = internal_score

    # 4. External Links (10 pts)
    approved_domains = [
        "wikipedia.org", "en.wikipedia.org", "iso.org", "kebs.org",
        "unece.org", "echa.europa.eu", "osha.gov", "who.int",
        "iwa-network.org", "waterqualityassociation.org"
    ]
    
    # Extract external links as complete tag strings to verify attributes
    a_tags = re.findall(r'<a\b[^>]*>(.*?)</a>', content, re.IGNORECASE | re.DOTALL)
    external_valid_count = 0
    external_invalid = []
    
    for tag in re.finditer(r'<a\b([^>]*)>(.*?)</a>', content, re.IGNORECASE | re.DOTALL):
        attributes = tag.group(1)
        href_match = re.search(r'href=["\']([^"\']+)["\']', attributes)
        if href_match:
            url = href_match.group(1)
            # check if external
            if url.startswith("http") and not any(d in url for d in ["zencosystems.co.ke", "zencochemicals.com", "localhost"]):
                # check domain
                domain_approved = any(domain in url for domain in approved_domains)
                # check target="_blank" and rel="noopener noreferrer"
                has_blank = "target=\"_blank\"" in attributes or "target='_blank'" in attributes
                has_rel = "rel=\"noopener noreferrer\"" in attributes or "rel='noopener noreferrer'" in attributes or "rel=\"noreferrer noopener\"" in attributes
                
                if domain_approved and has_blank and has_rel:
                    external_valid_count += 1
                else:
                    external_invalid.append(url)

    external_score = 0
    if external_valid_count >= 2 and len(external_invalid) == 0:
        external_score = 10
        details.append(f"External Links: Passed ({external_valid_count} valid external links).")
    else:
        issues = []
        if external_valid_count < 2:
            issues.append(f"fewer than 2 approved external links ({external_valid_count} found)")
        if external_invalid:
            issues.append(f"unapproved domains or missing target/rel tags for URLs ({', '.join(external_invalid)})")
        details.append(f"External Links: Failed ({', '.join(issues)}).")

    total_score += external_score
    breakdown["external_links"] = external_score

    # 5. Metadata Quality (10 pts)
    title_len = len(title or "")
    meta_title_len = len(meta_title or "")
    meta_desc_len = len(meta_description or "")
    excerpt_len = len(excerpt or "")
    
    title_valid = title_len <= 70 or meta_title_len <= 70
    desc_valid = meta_desc_len <= 160
    excerpt_valid = excerpt_len <= 300

    metadata_score = 0
    if title_valid and desc_valid and excerpt_valid:
        metadata_score = 10
        details.append("Metadata Quality: Passed (Title <=70, Desc <=160, Excerpt <=300).")
    else:
        issues = []
        if not title_valid:
            issues.append(f"Title too long ({max(title_len, meta_title_len)} chars)")
        if not desc_valid:
            issues.append(f"Meta Description too long ({meta_desc_len} chars)")
        if not excerpt_valid:
            issues.append(f"Excerpt too long ({excerpt_len} chars)")
        details.append(f"Metadata Quality: Failed ({', '.join(issues)}).")

    total_score += metadata_score
    breakdown["metadata"] = metadata_score

    # 6. Word Count (5 pts)
    content_clean = re.sub(r'<[^>]+>', ' ', content)
    words = content_clean.split()
    word_count = len(words)
    
    word_score = 0
    if 1500 <= word_count <= 2800:
        word_score = 5
        details.append(f"Word Count: Passed ({word_count} words).")
    else:
        details.append(f"Word Count: Failed ({word_count} words. Must be 1500-2800).")

    total_score += word_score
    breakdown["word_count"] = word_score

    # 7. OpenAI Quality Checks (40 pts)
    # Grammar (15 pts), Readability grade level 10-14 (10 pts), Technical Accuracy (15 pts)
    openai_score = 0
    ai_feedback = "OpenAI Check not run."
    
    if settings.OPENAI_API_KEY:
        from apps.operations.views import _openai_client
        import json
        
        # Take first 1500 words for token savings
        audit_text = " ".join(words[:1500])
        
        prompt = f"""
        Audit the following article content for Zenco Chemicals. Rate it on the following criteria:
        1. Grammar & Spelling: Errors, flow, punctuation. Score out of 15 (15 = perfect, 0 = unreadable).
        2. Readability Grade Level: Professional tone targeting plant engineers and buyers. Ideal grade level is 10-14. Score out of 10 (10 = ideal professional tone, 0 = too academic or too childish).
        3. Technical Accuracy: Contains valid references to standards (ISO, KEBS, REACH, IEC, GHS). Score out of 15 (15 = rich standard references, 0 = generic/fluffy with no standards).
        
        Return your response ONLY as a JSON object of this structure:
        {{
          "grammar_score": 15,
          "readability_score": 10,
          "accuracy_score": 15,
          "feedback": "Concise bullet-point feedback on how to improve the text."
        }}
        
        Article Content:
        {audit_text}
        """
        
        try:
            client = _openai_client()
            res = client.responses.create(
                model=getattr(settings, "OPENAI_MODEL", "gpt-4.1-mini"),
                input=prompt,
                text={'format': {'type': 'json_object'}},
            )
            data = json.loads(res.output_text)
            
            grammar_score = min(15, max(0, int(data.get("grammar_score", 0))))
            readability_score = min(10, max(0, int(data.get("readability_score", 0))))
            accuracy_score = min(15, max(0, int(data.get("accuracy_score", 0))))
            ai_feedback = data.get("feedback", "")
            
            openai_score = grammar_score + readability_score + accuracy_score
            breakdown["openai_grammar"] = grammar_score
            breakdown["openai_readability"] = readability_score
            breakdown["openai_accuracy"] = accuracy_score
            
            details.append(f"OpenAI Grade: Grammar {grammar_score}/15, Readability {readability_score}/10, Accuracy {accuracy_score}/15.")
        except Exception as e:
            # If OpenAI fails, log and fallback to default (giving minimum safe score to avoid blocking edits)
            import logging
            logging.getLogger(__name__).error(f"OpenAI Quality Audit error: {e}")
            openai_score = 30  # Default moderate fallback
            breakdown["openai_grammar"] = 11
            breakdown["openai_readability"] = 7
            breakdown["openai_accuracy"] = 12
            ai_feedback = f"Failed to contact OpenAI: {e}. Fallback score applied."
            details.append(f"OpenAI Grade: Fallback applied due to API error ({e}).")
    else:
        # Fallback if no key is configured
        openai_score = 30
        breakdown["openai_grammar"] = 11
        breakdown["openai_readability"] = 7
        breakdown["openai_accuracy"] = 12
        ai_feedback = "OpenAI API Key not configured. Fallback applied."
        details.append("OpenAI Grade: Fallback applied (API Key missing).")

    total_score += openai_score
    breakdown["openai_total"] = openai_score

    pass_save = total_score >= 65
    pass_publish = total_score >= 80

    return {
        "total_score": total_score,
        "pass_save": pass_save,
        "pass_publish": pass_publish,
        "breakdown": breakdown,
        "details": details,
        "feedback": ai_feedback,
    }
