"""
Management command: generate AI datasheets for all products without one.
Usage: python manage.py generate_all_datasheets
"""
from django.core.management.base import BaseCommand

from apps.products.models import Product
from apps.blog.datasheet_engine import generate_datasheet_for_product


class Command(BaseCommand):
    help = 'Generate AI Technical Data Sheets for all products without a datasheet (saved as drafts).'

    def add_arguments(self, parser):
        parser.add_argument(
            '--regenerate',
            action='store_true',
            help='Regenerate existing datasheets (increments version).',
        )

    def handle(self, *args, **options):
        regenerate = options['regenerate']
        if regenerate:
            products = Product.objects.filter(
                is_active=True, is_deleted=False
            ).select_related('category').order_by('name')
        else:
            products = Product.objects.filter(
                is_active=True,
                is_deleted=False,
                product_data_sheet__isnull=True,
            ).select_related('category').order_by('name')

        total = products.count()
        if total == 0:
            self.stdout.write(self.style.WARNING('No products need datasheet generation.'))
            return

        self.stdout.write(f'Generating datasheets for {total} product(s)...')
        success = 0
        failed = 0

        for product in products:
            sheet, error = generate_datasheet_for_product(
                product,
                regenerate=regenerate,
                triggered_by='bulk_seed',
            )
            if sheet:
                success += 1
                flags = sheet.validation_flags
                flag_msg = f' [flags: {flags}]' if flags else ''
                self.stdout.write(self.style.SUCCESS(
                    f'  ✓ {product.name} (v{sheet.version}){flag_msg}'
                ))
            else:
                failed += 1
                self.stdout.write(self.style.ERROR(f'  ✗ {product.name}: {error}'))

        self.stdout.write('')
        self.stdout.write(self.style.SUCCESS(f'Done: {success} succeeded, {failed} failed out of {total}.'))
