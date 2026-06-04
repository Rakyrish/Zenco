"""
Management command: ingest_website
Scrapes publicly accessible pages from the Zenco / Zenith Chemicals website
and stores the plain-text content in KnowledgeCache for use as chatbot context.

Usage:
    python manage.py ingest_website
    python manage.py ingest_website --url https://zenithcoltd.com/

Run this periodically (e.g. daily cron) to keep knowledge fresh.
"""
import re
import logging
from html.parser import HTMLParser
from urllib import request as urllib_request
from urllib.error import URLError
from urllib.parse import urljoin, urlparse
from django.core.management.base import BaseCommand
from django.utils import timezone

logger = logging.getLogger(__name__)


# ─── Simple HTML → plain text extractor ──────────────────────────────────────

SKIP_TAGS = {'script', 'style', 'noscript', 'head', 'meta', 'link', 'svg', 'path', 'img'}


class _TextExtractor(HTMLParser):
    def __init__(self):
        super().__init__()
        self._skip = 0
        self.parts = []

    def handle_starttag(self, tag, attrs):
        if tag.lower() in SKIP_TAGS:
            self._skip += 1

    def handle_endtag(self, tag):
        if tag.lower() in SKIP_TAGS:
            self._skip = max(0, self._skip - 1)

    def handle_data(self, data):
        if not self._skip:
            text = data.strip()
            if text:
                self.parts.append(text)


def _html_to_text(html: str) -> str:
    parser = _TextExtractor()
    parser.feed(html)
    text = ' '.join(parser.parts)
    text = re.sub(r'\s{2,}', ' ', text)
    return text[:8000]  # cap per page to keep context manageable


def _fetch_page(url: str, timeout: int = 15) -> str | None:
    try:
        req = urllib_request.Request(
            url,
            headers={
                'User-Agent': 'ZencoKnowledgeBot/1.0 (+https://zencosystems.co.ke)',
                'Accept': 'text/html,application/xhtml+xml;q=0.9',
                'Accept-Language': 'en-US,en;q=0.5',
            }
        )
        with urllib_request.urlopen(req, timeout=timeout) as resp:
            content_type = resp.headers.get('Content-Type', '')
            if 'text/html' not in content_type:
                return None
            raw = resp.read(500_000)  # 500 KB limit
            charset = 'utf-8'
            if 'charset=' in content_type:
                charset = content_type.split('charset=')[-1].strip().split(';')[0]
            return raw.decode(charset, errors='replace')
    except (URLError, TimeoutError, Exception) as exc:
        logger.warning(f'[ingest_website] Failed to fetch {url}: {exc}')
        return None


# ─── Pages to ingest ─────────────────────────────────────────────────────────

DEFAULT_PAGES = [
    ('Homepage', 'https://zenithcoltd.com/'),
    ('About Us', 'https://zenithcoltd.com/about'),
    ('Products', 'https://zenithcoltd.com/products'),
    ('Services', 'https://zenithcoltd.com/services'),
    ('Contact', 'https://zenithcoltd.com/contact'),
    ('Industries', 'https://zenithcoltd.com/industries'),
    ('Water Treatment', 'https://zenithcoltd.com/products/water-treatment'),
    ('Solvents', 'https://zenithcoltd.com/products/solvents'),
    ('Cleaning Chemicals', 'https://zenithcoltd.com/products/cleaning'),
]

# Also ingest Zenco Systems site for completeness
ZENCO_PAGES = [
    ('Zenco Homepage', 'https://zencosystems.co.ke/'),
    ('Zenco Products', 'https://zencosystems.co.ke/products'),
    ('Zenco Services', 'https://zencosystems.co.ke/services'),
]


class Command(BaseCommand):
    help = 'Scrape company website pages and cache content for AI chatbot knowledge'

    def add_arguments(self, parser):
        parser.add_argument(
            '--url',
            type=str,
            help='Scrape a single custom URL (optional)',
        )
        parser.add_argument(
            '--label',
            type=str,
            default='Custom Page',
            help='Label for the custom URL',
        )
        parser.add_argument(
            '--clear',
            action='store_true',
            help='Clear all cached knowledge before ingestion',
        )

    def handle(self, *args, **options):
        from apps.operations.models import KnowledgeCache  # local import

        if options['clear']:
            count = KnowledgeCache.objects.all().delete()[0]
            self.stdout.write(self.style.WARNING(f'Cleared {count} cached knowledge entries.'))

        pages = DEFAULT_PAGES + ZENCO_PAGES
        if options.get('url'):
            pages = [(options['label'], options['url'])]

        success = 0
        skipped = 0
        for label, url in pages:
            self.stdout.write(f'Fetching: {label} — {url}')
            html = _fetch_page(url)
            if not html:
                self.stdout.write(self.style.WARNING(f'  → SKIP (no content returned)'))
                skipped += 1
                continue

            text = _html_to_text(html)
            if len(text) < 100:
                self.stdout.write(self.style.WARNING(f'  → SKIP (content too short: {len(text)} chars)'))
                skipped += 1
                continue

            obj, created = KnowledgeCache.objects.update_or_create(
                url=url,
                defaults={
                    'page_label': label,
                    'content': text,
                    'scraped_at': timezone.now(),
                    'is_active': True,
                }
            )
            action = 'CREATED' if created else 'UPDATED'
            self.stdout.write(self.style.SUCCESS(f'  → {action} ({len(text)} chars)'))
            success += 1

        self.stdout.write(
            self.style.SUCCESS(
                f'\nDone. {success} pages ingested, {skipped} skipped.'
            )
        )
