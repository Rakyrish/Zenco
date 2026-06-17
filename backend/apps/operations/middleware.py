import time
import threading
from django.http import HttpResponsePermanentRedirect, HttpResponseRedirect
from django.utils.deprecation import MiddlewareMixin
from .models import ApiRequestLog, RedirectRule

# Thread-local storage to track the active request for signal-based audit logging
_thread_locals = threading.local()

def get_current_request():
    return getattr(_thread_locals, 'request', None)

def get_current_user():
    request = get_current_request()
    if request and hasattr(request, 'user') and request.user.is_authenticated:
        return request.user
    return None


class AuditLogMiddleware(MiddlewareMixin):
    """Stores request context in thread local memory so model saving can access it."""
    def process_request(self, request):
        _thread_locals.request = request

    def process_response(self, request, response):
        if hasattr(_thread_locals, 'request'):
            del _thread_locals.request
        return response

    def process_exception(self, request, exception):
        if hasattr(_thread_locals, 'request'):
            del _thread_locals.request


class ApiMonitoringMiddleware(MiddlewareMixin):
    """Measures request durations and status codes for API endpoints."""
    def process_request(self, request):
        request._start_time = time.time()

    def process_response(self, request, response):
        # Only log requests directed to API endpoints to prevent cluttering
        if request.path.startswith('/api/'):
            duration_ms = 0.0
            if hasattr(request, '_start_time'):
                duration_ms = (time.time() - request._start_time) * 1000

            x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
            ip = x_forwarded_for.split(',')[0].strip() if x_forwarded_for else request.META.get('REMOTE_ADDR')

            try:
                ApiRequestLog.objects.create(
                    path=request.path[:255],
                    method=request.method,
                    status_code=response.status_code,
                    response_time_ms=duration_ms,
                    ip_address=ip,
                )
            except Exception:
                pass  # Do not crash the site if logging fails
        return response


class DatabaseRedirectMiddleware(MiddlewareMixin):
    """Performs dynamic redirects managed in Django Admin."""
    def process_request(self, request):
        path = request.path
        # Look for matching redirects in the DB
        try:
            rule = RedirectRule.objects.filter(old_path=path).first()
            if rule:
                if rule.is_permanent:
                    return HttpResponsePermanentRedirect(rule.new_path)
                return HttpResponseRedirect(rule.new_path)
        except Exception:
            pass
