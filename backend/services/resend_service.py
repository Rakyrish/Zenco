"""
Resend Email Service for Zenco Systems Ltd – Chemical Division
Handles all transactional emails: inquiry notifications, auto-replies.
"""
import logging
import resend
from django.conf import settings

logger = logging.getLogger(__name__)


def _get_client():
    resend.api_key = settings.RESEND_API_KEY
    return resend


def send_inquiry_notification(inquiry) -> bool:
    """
    Notify admin when a new inquiry is submitted.
    """
    client = _get_client()
    try:
        client.Emails.send({
            "from": f"Zenco Systems <{settings.DEFAULT_FROM_EMAIL}>",
            "to": [settings.INQUIRY_NOTIFICATION_EMAIL],
            "subject": f"New {inquiry.get_inquiry_type_display()} from {inquiry.full_name}",
            "html": _build_admin_notification_html(inquiry),
        })
        logger.info(f"Admin notification sent for inquiry {inquiry.id}")
        return True
    except Exception as e:
        logger.error(f"Failed to send admin notification: {e}")
        return False


def send_inquiry_autoreply(inquiry) -> bool:
    """
    Send auto-reply confirmation to the inquiry submitter.
    """
    client = _get_client()
    try:
        client.Emails.send({
            "from": f"Zenco Systems Ltd <{settings.DEFAULT_FROM_EMAIL}>",
            "to": [inquiry.email],
            "subject": "Thank you for contacting Zenco Systems Ltd",
            "html": _build_autoreply_html(inquiry),
        })
        logger.info(f"Auto-reply sent to {inquiry.email}")
        return True
    except Exception as e:
        logger.error(f"Failed to send auto-reply to {inquiry.email}: {e}")
        return False


def _build_admin_notification_html(inquiry) -> str:
    product_row = ""
    if inquiry.product_interest:
        product_row = f"<tr><td><strong>Product Interest:</strong></td><td>{inquiry.product_interest}</td></tr>"
    quantity_row = ""
    if inquiry.quantity:
        quantity_row = f"<tr><td><strong>Quantity:</strong></td><td>{inquiry.quantity}</td></tr>"

    return f"""
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto;">
  <div style="background: #0C094D; padding: 24px; border-radius: 8px 8px 0 0;">
    <h1 style="color: #fff; margin: 0; font-size: 20px;">New Inquiry – Zenco Systems Ltd</h1>
    <p style="color: #F26C0C; margin: 4px 0 0;">Chemical Division Admin Portal</p>
  </div>
  <div style="background: #f8f9fc; padding: 24px; border: 1px solid #e5e7eb;">
    <h2 style="color: #0C094D; font-size: 16px; margin-top: 0;">Inquiry Details</h2>
    <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
      <tr><td style="padding: 8px 0;"><strong>Name:</strong></td><td>{inquiry.full_name}</td></tr>
      <tr><td style="padding: 8px 0;"><strong>Email:</strong></td><td><a href="mailto:{inquiry.email}">{inquiry.email}</a></td></tr>
      <tr><td style="padding: 8px 0;"><strong>Phone:</strong></td><td>{inquiry.phone or 'Not provided'}</td></tr>
      <tr><td style="padding: 8px 0;"><strong>Company:</strong></td><td>{inquiry.company or 'Not provided'}</td></tr>
      <tr><td style="padding: 8px 0;"><strong>Country:</strong></td><td>{inquiry.country}</td></tr>
      <tr><td style="padding: 8px 0;"><strong>Type:</strong></td><td>{inquiry.get_inquiry_type_display()}</td></tr>
      {product_row}
      {quantity_row}
    </table>
    <h3 style="color: #0C094D; font-size: 14px;">Message:</h3>
    <div style="background: #fff; border-left: 4px solid #F26C0C; padding: 12px 16px; border-radius: 4px;">
      <p style="margin: 0; white-space: pre-wrap;">{inquiry.message}</p>
    </div>
    <p style="margin-top: 16px; font-size: 12px; color: #666;">
      Submitted: {inquiry.created_at.strftime('%Y-%m-%d %H:%M')} EAT &nbsp;|&nbsp;
      IP: {inquiry.ip_address or 'Unknown'}
    </p>
  </div>
  <div style="background: #0C094D; padding: 16px; border-radius: 0 0 8px 8px; text-align: center;">
    <p style="color: #aaa; font-size: 12px; margin: 0;">
      Zenco Systems Ltd – Chemical Division &copy; 2025
    </p>
  </div>
</body>
</html>
"""


def _build_autoreply_html(inquiry) -> str:
    return f"""
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto;">
  <div style="background: #0C094D; padding: 24px; border-radius: 8px 8px 0 0; text-align: center;">
    <h1 style="color: #fff; margin: 0; font-size: 22px;">Zenco Systems Ltd</h1>
    <p style="color: #F26C0C; margin: 4px 0 0; font-size: 14px;">Chemical Division – East Africa</p>
  </div>
  <div style="background: #ffffff; padding: 32px 24px; border: 1px solid #e5e7eb;">
    <p style="font-size: 16px;">Dear <strong>{inquiry.full_name}</strong>,</p>
    <p>Thank you for reaching out to <strong>Zenco Systems Ltd – Chemical Division</strong>. We have successfully received your inquiry and our team will respond within <strong>24 business hours</strong>.</p>
    <div style="background: #f8f9fc; border-left: 4px solid #F26C0C; padding: 16px; border-radius: 4px; margin: 24px 0;">
      <p style="margin: 0; font-size: 14px; color: #666;"><strong>Your inquiry reference:</strong> #{str(inquiry.id)[:8].upper()}</p>
      <p style="margin: 8px 0 0; font-size: 14px; color: #666;"><strong>Type:</strong> {inquiry.get_inquiry_type_display()}</p>
    </div>
    <p>While you wait, you can explore our full product catalog at <a href="https://zencosystems.co.ke/products" style="color: #F26C0C;">zencosystems.co.ke/products</a> or call us directly for urgent inquiries.</p>
    <p style="margin-top: 24px;">Warm regards,<br><strong>The Zenco Systems Team</strong><br>
    <span style="font-size: 13px; color: #666;">📞 +254 700 000 000 &nbsp;|&nbsp; 📧 info@zencosystems.co.ke</span></p>
  </div>
  <div style="background: #0C094D; padding: 16px; border-radius: 0 0 8px 8px; text-align: center;">
    <p style="color: #aaa; font-size: 12px; margin: 0;">
      © 2025 Zenco Systems Ltd – Chemical Division, Nairobi, Kenya
    </p>
  </div>
</body>
</html>
"""
