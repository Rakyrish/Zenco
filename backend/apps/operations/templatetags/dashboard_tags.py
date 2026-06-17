import datetime
from django import template
from django.db.models import Sum, F, Avg
from django.utils import timezone
from apps.products.models import Product, Category
from apps.inquiries.models import Inquiry, Customer
from apps.operations.models import ApiRequestLog, LoginAttempt, SeoPageMeta, ChatConversation

register = template.Library()


@register.simple_tag
def get_dashboard_stats():
    """Computes real metrics from the database for the admin control center."""
    stats = {
        'products_count': 0,
        'categories_count': 0,
        'inventory_value': 0.0,
        'leads_count': 0,
        'quotes_count': 0,
        'customers_count': 0,
        'low_stock_count': 0,
        'failed_logins_count': 0,
        'api_error_rate': 0.0,
        'avg_response_time': 0.0,
        'chatbot_conversations': 0,
        'seo_health_score': 100,
        'recent_leads': [],
        'recent_alerts': [],
        'recent_failed_logins': [],
        'recent_api_errors': []
    }

    try:
        # 1. Product & Categories
        stats['products_count'] = Product.objects.filter(is_deleted=False).count()
        stats['categories_count'] = Category.objects.filter(is_deleted=False).count()
        
        # Aggregate Inventory Value
        inv_val = Product.objects.filter(is_deleted=False).aggregate(
            total=Sum(F('stock_quantity') * F('cost_per_unit'))
        )['total']
        stats['inventory_value'] = float(inv_val) if inv_val else 0.0

        # 2. CRM & Customers
        stats['leads_count'] = Inquiry.objects.filter(is_deleted=False).count()
        stats['quotes_count'] = Inquiry.objects.filter(inquiry_type='quote', is_deleted=False).count()
        stats['customers_count'] = Customer.objects.count()
        stats['recent_leads'] = Inquiry.objects.filter(is_deleted=False).order_by('-created_at')[:5]

        # 3. Low Stock Alerts
        low_stock_qs = Product.objects.filter(stock_quantity__lte=F('reorder_level'), is_deleted=False)
        stats['low_stock_count'] = low_stock_qs.count()
        for p in low_stock_qs[:5]:
            stats['recent_alerts'].append({
                'type': 'warning',
                'message': f"Low Stock: {p.name} ({p.stock_quantity} remaining, reorder level is {p.reorder_level})"
            })

        # 4. Security Logs
        stats['failed_logins_count'] = LoginAttempt.objects.filter(is_successful=False).count()
        stats['recent_failed_logins'] = LoginAttempt.objects.filter(is_successful=False).order_by('-timestamp')[:5]
        for fa in stats['recent_failed_logins']:
            stats['recent_alerts'].append({
                'type': 'danger',
                'message': f"Failed Login: User '{fa.username}' from IP {fa.ip_address}"
            })

        # 5. API & Chatbot Monitoring
        stats['chatbot_conversations'] = ChatConversation.objects.count()

        day_ago = timezone.now() - datetime.timedelta(days=1)
        api_qs = ApiRequestLog.objects.filter(created_at__gte=day_ago)
        total_api = api_qs.count()
        if total_api > 0:
            failed_api = api_qs.filter(status_code__gte=400).count()
            stats['api_error_rate'] = round((failed_api / total_api) * 100, 1)
            
            avg_time = api_qs.aggregate(avg=Avg('response_time_ms'))['avg']
            stats['avg_response_time'] = round(avg_time, 1) if avg_time else 0.0

            # Get recent 500 errors
            stats['recent_api_errors'] = api_qs.filter(status_code__gte=500).order_by('-created_at')[:5]
            for err in stats['recent_api_errors']:
                stats['recent_alerts'].append({
                    'type': 'danger',
                    'message': f"API Error 500: {err.method} {err.path} from IP {err.ip_address}"
                })

        # 6. SEO Health Score
        seo_meta = SeoPageMeta.objects.all()
        if seo_meta.exists():
            total_score = 0
            for item in seo_meta:
                score = 100
                if not item.seo_title: score -= 25
                if not item.seo_description: score -= 25
                if not item.canonical_url: score -= 20
                if not item.og_title or not item.og_description: score -= 15
                if not item.keywords: score -= 15
                total_score += score
            stats['seo_health_score'] = round(total_score / seo_meta.count())

    except Exception:
        pass  # Fail gracefully if tables do not exist yet (during initial migrations)

    return stats
