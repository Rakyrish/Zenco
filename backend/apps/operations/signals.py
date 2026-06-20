from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from .models import AuditLog
from .middleware import get_current_user, get_current_request


@receiver(post_save)
def audit_log_save(sender, instance, created, **kwargs):
    # Ignore audit logs themselves, sessions, migration logging, and standard system tables
    if sender.__name__ in ['AuditLog', 'ApiRequestLog', 'LoginAttempt', 'Session', 'Migration', 'LogEntry', 'Permission', 'ContentType']:
        return

    user = get_current_user()
    request = get_current_request()
    
    action = "CREATE" if created else "UPDATE"
    
    # Serialize the fields
    changes = {}
    for field in instance._meta.fields:
        # Ignore binary or potentially heavy fields
        if field.__class__.__name__ in ['BinaryField', 'FileField', 'ImageField']:
            continue
        try:
            val = getattr(instance, field.name, None)
            if val is not None:
                changes[field.name] = str(val)
        except Exception:
            pass

    ip_address = None
    user_agent = ""
    if request:
        x_forwarded = request.META.get('HTTP_X_FORWARDED_FOR')
        ip_address = x_forwarded.split(',')[0].strip() if x_forwarded else request.META.get('REMOTE_ADDR')
        user_agent = request.META.get('HTTP_USER_AGENT', '')[:255]

    try:
        AuditLog.objects.create(
            user=user,
            action=action,
            model_name=sender.__name__,
            object_id=str(instance.pk)[:100],
            changes=changes,
            ip_address=ip_address,
            user_agent=user_agent
        )
    except Exception:
        pass


@receiver(post_delete)
def audit_log_delete(sender, instance, **kwargs):
    if sender.__name__ in ['AuditLog', 'ApiRequestLog', 'LoginAttempt', 'Session', 'Migration', 'LogEntry', 'Permission', 'ContentType']:
        return

    user = get_current_user()
    request = get_current_request()

    ip_address = None
    user_agent = ""
    if request:
        x_forwarded = request.META.get('HTTP_X_FORWARDED_FOR')
        ip_address = x_forwarded.split(',')[0].strip() if x_forwarded else request.META.get('REMOTE_ADDR')
        user_agent = request.META.get('HTTP_USER_AGENT', '')[:255]

    try:
        AuditLog.objects.create(
            user=user,
            action="DELETE",
            model_name=sender.__name__,
            object_id=str(instance.pk)[:100],
            changes={"deleted": True},
            ip_address=ip_address,
            user_agent=user_agent
        )
    except Exception:
        pass
