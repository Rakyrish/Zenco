# Generated manually for ProductDataSheet model

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('products', '0001_initial'),
        ('blog', '0003_blogtag_blogpost_categories_and_more'),
    ]

    operations = [
        migrations.CreateModel(
            name='ProductDataSheet',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('title', models.CharField(max_length=200)),
                ('slug', models.SlugField(unique=True)),
                ('version', models.CharField(default='1.0', max_length=10)),
                ('issue_date', models.DateField(auto_now_add=True)),
                ('revision_date', models.DateField(auto_now=True)),
                ('meta_title', models.CharField(blank=True, max_length=70)),
                ('meta_description', models.TextField(blank=True, max_length=160)),
                ('product_description', models.TextField()),
                ('chemical_composition', models.JSONField(default=list)),
                ('physical_properties', models.JSONField(default=dict)),
                ('performance_data', models.JSONField(default=dict)),
                ('applications', models.JSONField(default=list)),
                ('industries_served', models.JSONField(default=list)),
                ('health_safety', models.JSONField(default=dict)),
                ('storage_handling', models.JSONField(default=dict)),
                ('packaging_info', models.JSONField(default=dict)),
                ('standards_compliance', models.JSONField(default=list)),
                ('certifications', models.JSONField(default=list)),
                ('faq', models.JSONField(default=list)),
                ('related_products_text', models.TextField(blank=True)),
                ('ai_generated', models.BooleanField(default=False)),
                ('ai_model_used', models.CharField(blank=True, max_length=50)),
                ('tokens_used', models.PositiveIntegerField(default=0)),
                ('generation_date', models.DateTimeField(blank=True, null=True)),
                ('validation_flags', models.JSONField(blank=True, default=list)),
                ('status', models.CharField(
                    choices=[('draft', 'Draft'), ('published', 'Published'), ('archived', 'Archived')],
                    default='draft',
                    max_length=20,
                )),
                ('is_public', models.BooleanField(default=True)),
                ('pdf_file', models.FileField(blank=True, null=True, upload_to='datasheets/pdf/')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('view_count', models.PositiveIntegerField(default=0)),
                ('product', models.OneToOneField(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='product_data_sheet',
                    to='products.product',
                )),
            ],
            options={
                'ordering': ['product__name'],
            },
        ),
        migrations.AddIndex(
            model_name='productdatasheet',
            index=models.Index(fields=['slug'], name='blog_produc_slug_idx'),
        ),
        migrations.AddIndex(
            model_name='productdatasheet',
            index=models.Index(fields=['status'], name='blog_produc_status_idx'),
        ),
        migrations.AddIndex(
            model_name='productdatasheet',
            index=models.Index(fields=['status', 'is_public'], name='blog_produc_status_public_idx'),
        ),
    ]
