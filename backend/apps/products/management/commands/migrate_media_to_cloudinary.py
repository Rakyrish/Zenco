import mimetypes
from pathlib import Path

from django.conf import settings
from django.core.management.base import BaseCommand

from apps.blog.models import BlogPost
from apps.products.models import Category, Product
from apps.operations.views import _cloudinary_upload


class Command(BaseCommand):
    help = 'Upload existing local product, category, and blog images to Cloudinary and store SEO-safe URLs.'

    def handle(self, *args, **options):
        if not all([settings.CLOUDINARY_CLOUD_NAME, settings.CLOUDINARY_API_KEY, settings.CLOUDINARY_API_SECRET]):
            self.stderr.write('Cloudinary credentials are not configured.')
            return

        migrated = 0
        for obj, field_name in self._iter_media_objects():
            field = getattr(obj, field_name, None)
            if not field or not getattr(field, 'name', ''):
                continue
            path = Path(field.path)
            if not path.exists():
                continue
            content_type = mimetypes.guess_type(path.name)[0] or 'image/jpeg'
            url = _cloudinary_upload(path.read_bytes(), path.name, content_type)
            if not url:
                continue
            if hasattr(obj, 'schema_data'):
                obj.schema_data = {**(obj.schema_data or {}), 'cloudinary_image_url': url}
                obj.save(update_fields=['schema_data', 'updated_at'])
            elif hasattr(obj, 'og_image'):
                obj.og_image = url
                obj.save(update_fields=['og_image', 'updated_at'])
            migrated += 1
            self.stdout.write(f'Migrated {obj.__class__.__name__} {obj.pk}: {url}')

        self.stdout.write(self.style.SUCCESS(f'Migrated {migrated} media files.'))

    def _iter_media_objects(self):
        for product in Product.objects.exclude(image=''):
            yield product, 'image'
        for category in Category.objects.exclude(image=''):
            yield category, 'image'
        for post in BlogPost.objects.exclude(featured_image=''):
            yield post, 'featured_image'
