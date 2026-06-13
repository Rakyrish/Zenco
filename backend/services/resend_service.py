"""
Resend Email Service for Zenco Systems Ltd – Chemical Division
Handles transactional emails: admin notifications, customer auto-replies, and direct admin responses.
"""
import logging
import time
import resend
from django.conf import settings
from django.utils import timezone

logger = logging.getLogger(__name__)


def _get_client():
    # Use RESEND_API_KEY from settings (which falls back to RESEND_MAIL)
    resend.api_key = getattr(settings, 'RESEND_API_KEY', '') or getattr(settings, 'RESEND_MAIL', '')
    return resend


def retry_on_failure(max_retries=3, backoff_factor=2):
    """Decorator to retry Resend API calls upon failure with exponential backoff."""
    def decorator(func):
        def wrapper(*args, **kwargs):
            delay = 1
            last_exception = None
            for attempt in range(max_retries):
                try:
                    return func(*args, **kwargs)
                except Exception as e:
                    last_exception = e
                    if attempt == max_retries - 1:
                        logger.error(f"Resend call failed after {max_retries} attempts: {e}")
                        raise e
                    logger.warning(f"Resend API error (attempt {attempt + 1}/{max_retries}): {e}. Retrying in {delay}s...")
                    time.sleep(delay)
                    delay *= backoff_factor
            if last_exception:
                raise last_exception
        return wrapper
    return decorator


def send_inquiry_notification(inquiry) -> bool:
    """
    Notify the company admin of a new inquiry.
    Sends to the COMPANY_EMAIL address defined in base settings.
    """
    client = _get_client()
    try:
        # Resolve company email from env settings. NEVER hardcode email addresses.
        company_email = getattr(settings, 'COMPANY_EMAIL', 'info@zenithcoltd.com')
        from_email = getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@zencosystems.co.ke')
        company_name = getattr(settings, 'COMPANY_NAME', 'Zenco Systems Ltd')

        @retry_on_failure(max_retries=3)
        def _send():
            return client.Emails.send({
                "from": f"{company_name} <{from_email}>",
                "to": [company_email],
                "subject": f"New {inquiry.get_inquiry_type_display()} – {inquiry.ticket_number}",
                "html": _build_admin_notification_html(inquiry),
            })

        _send()
        inquiry.notification_sent = True
        inquiry.save(update_fields=['notification_sent'])
        logger.info(f"Admin notification email sent for {inquiry.ticket_number} to {company_email}")
        return True
    except Exception as e:
        error_msg = f"Failed to send admin notification for {inquiry.ticket_number}: {str(e)}"
        logger.error(error_msg)
        # Log to model instances
        inquiry.error_log = f"{inquiry.error_log}\n[{timezone.now().strftime('%Y-%m-%d %H:%M:%S')}]: {error_msg}".strip()
        inquiry.save(update_fields=['error_log'])
        return False


def send_inquiry_autoreply(inquiry) -> bool:
    """
    Send an automated acknowledgment response to the customer.
    """
    client = _get_client()
    try:
        from_email = getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@zencosystems.co.ke')
        company_name = getattr(settings, 'COMPANY_NAME', 'Zenco Systems Ltd')

        @retry_on_failure(max_retries=3)
        def _send():
            return client.Emails.send({
                "from": f"{company_name} <{from_email}>",
                "to": [inquiry.email],
                "subject": f"We Have Received Your Inquiry – {inquiry.ticket_number}",
                "html": _build_autoreply_html(inquiry),
            })

        _send()
        inquiry.autoreply_sent = True
        inquiry.save(update_fields=['autoreply_sent'])
        logger.info(f"Customer auto-reply email sent for {inquiry.ticket_number} to {inquiry.email}")
        return True
    except Exception as e:
        error_msg = f"Failed to send customer auto-reply for {inquiry.ticket_number} to {inquiry.email}: {str(e)}"
        logger.error(error_msg)
        inquiry.error_log = f"{inquiry.error_log}\n[{timezone.now().strftime('%Y-%m-%d %H:%M:%S')}]: {error_msg}".strip()
        inquiry.save(update_fields=['error_log'])
        return False


def send_admin_reply_email(inquiry, reply_message: str) -> bool:
    """
    Send direct administrator response to the customer.
    """
    client = _get_client()
    try:
        from_email = getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@zencosystems.co.ke')
        company_name = getattr(settings, 'COMPANY_NAME', 'Zenco Systems Ltd')

        @retry_on_failure(max_retries=3)
        def _send():
            return client.Emails.send({
                "from": f"{company_name} <{from_email}>",
                "to": [inquiry.email],
                "subject": f"Response regarding your inquiry – {inquiry.ticket_number}",
                "html": _build_admin_reply_html(inquiry, reply_message),
            })

        _send()
        logger.info(f"Direct admin reply email sent for {inquiry.ticket_number} to {inquiry.email}")
        return True
    except Exception as e:
        error_msg = f"Failed to send direct admin reply for {inquiry.ticket_number} to {inquiry.email}: {str(e)}"
        logger.error(error_msg)
        inquiry.error_log = f"{inquiry.error_log}\n[{timezone.now().strftime('%Y-%m-%d %H:%M:%S')}]: {error_msg}".strip()
        inquiry.save(update_fields=['error_log'])
        return False


def _build_admin_notification_html(inquiry) -> str:
    site_url = getattr(settings, 'SITE_URL', 'https://zencosystems.co.ke')
    dashboard_url = f"{site_url}/admin/inquiries"
    
    product_section = ""
    if inquiry.product_name:
        product_section = f"""
        <tr><td class="label">Product Name:</td><td class="value"><strong>{inquiry.product_name}</strong></td></tr>
        """
    quantity_section = ""
    if inquiry.quantity:
        quantity_section = f"""
        <tr><td class="label">Quantity/Volume:</td><td class="value">{inquiry.quantity}</td></tr>
        """

    return f"""<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>New Customer Inquiry</title>
  <style>
    body {{ font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f4f6f9; margin: 0; padding: 0; -webkit-font-smoothing: antialiased; }}
    table {{ border-collapse: collapse; }}
    .wrapper {{ width: 100%; table-layout: fixed; background-color: #f4f6f9; padding-bottom: 40px; }}
    .main-table {{ width: 100%; max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05); margin-top: 30px; }}
    .header {{ background-color: #0C094D; padding: 32px; text-align: center; }}
    .logo-text {{ color: #ffffff; font-size: 24px; font-weight: bold; letter-spacing: 1px; margin: 0; }}
    .header-subtitle {{ color: #F26C0C; font-size: 14px; font-weight: 600; text-transform: uppercase; margin-top: 6px; letter-spacing: 1.5px; }}
    .content {{ padding: 32px; color: #333333; }}
    .section-title {{ font-size: 15px; font-weight: bold; color: #0C094D; border-bottom: 2px solid #f0f0f0; padding-bottom: 8px; margin-top: 24px; margin-bottom: 16px; text-transform: uppercase; letter-spacing: 0.5px; }}
    .info-table {{ width: 100%; margin-bottom: 20px; }}
    .info-table td {{ padding: 8px 0; font-size: 14px; vertical-align: top; }}
    .info-table td.label {{ width: 150px; font-weight: bold; color: #666666; }}
    .info-table td.value {{ color: #111111; }}
    .message-box {{ background-color: #f8f9fc; border-left: 4px solid #F26C0C; padding: 18px; border-radius: 4px; font-size: 14px; line-height: 1.6; color: #333333; margin-top: 10px; }}
    .btn-container {{ text-align: center; margin-top: 32px; margin-bottom: 10px; }}
    .btn {{ display: inline-block; padding: 12px 24px; font-size: 14px; font-weight: bold; color: #ffffff !important; background-color: #0C094D; border-radius: 8px; text-decoration: none; margin: 0 8px; box-shadow: 0 3px 6px rgba(12,9,77,0.15); }}
    .btn-accent {{ background-color: #F26C0C; box-shadow: 0 3px 6px rgba(242,108,12,0.15); }}
    .footer {{ background-color: #f8f9fc; padding: 24px; text-align: center; border-top: 1px solid #eeeeee; }}
    .footer-text {{ font-size: 12px; color: #888888; margin: 0; line-height: 1.5; }}
  </style>
</head>
<body>
  <div class="wrapper">
    <table class="main-table">
      <tr>
        <td class="header">
          <div class="logo-text">{getattr(settings, 'COMPANY_NAME', 'Zenco Systems Ltd')}</div>
          <div class="header-subtitle">New Customer Inquiry</div>
        </td>
      </tr>
      <tr>
        <td class="content">
          <div class="section-title">Customer Information</div>
          <table class="info-table">
            <tr><td class="label">Full Name:</td><td class="value"><strong>{inquiry.name}</strong></td></tr>
            <tr><td class="label">Company Name:</td><td class="value">{inquiry.company or 'Not Provided'}</td></tr>
            <tr><td class="label">Email Address:</td><td class="value"><a href="mailto:{inquiry.email}">{inquiry.email}</a></td></tr>
            <tr><td class="label">Phone Number:</td><td class="value">{inquiry.phone or 'Not Provided'}</td></tr>
            <tr><td class="label">Country:</td><td class="value">{inquiry.country}</td></tr>
          </table>

          <div class="section-title">Inquiry Information</div>
          <table class="info-table">
            {product_section}
            {quantity_section}
            <tr><td class="label">Inquiry Type:</td><td class="value">{inquiry.get_inquiry_type_display()}</td></tr>
          </table>

          <div class="section-title">Message Details</div>
          <div class="message-box">{inquiry.message}</div>

          <div class="section-title">Submission Details</div>
          <table class="info-table">
            <tr><td class="label">Ticket Number:</td><td class="value"><strong>{inquiry.ticket_number}</strong></td></tr>
            <tr><td class="label">Date:</td><td class="value">{inquiry.created_at.strftime('%Y-%m-%d')}</td></tr>
            <tr><td class="label">Time:</td><td class="value">{inquiry.created_at.strftime('%H:%M:%S')} EAT</td></tr>
            <tr><td class="label">Source Page:</td><td class="value">{inquiry.source_page or 'Direct/External'}</td></tr>
            <tr><td class="label">IP Address:</td><td class="value">{inquiry.ip_address or 'Unknown'}</td></tr>
          </table>

          <div class="btn-container">
            <a href="{dashboard_url}" class="btn" target="_blank">View in Dashboard</a>
            <a href="mailto:{inquiry.email}?subject=Regarding%20your%20inquiry%20{inquiry.ticket_number}" class="btn btn-accent">Reply to Customer</a>
          </div>
        </td>
      </tr>
      <tr>
        <td class="footer">
          <p class="footer-text">
            © {timezone.now().year} {getattr(settings, 'COMPANY_NAME', 'Zenco Systems Ltd')} – Chemical Division.<br/>
            This is an automated administrative notification.
          </p>
        </td>
      </tr>
    </table>
  </div>
</body>
</html>
"""


def _build_autoreply_html(inquiry) -> str:
    company_name = getattr(settings, 'COMPANY_NAME', 'Zenco Systems Ltd')
    company_email = getattr(settings, 'COMPANY_EMAIL', 'info@zenithcoltd.com')
    company_phone = getattr(settings, 'COMPANY_PHONE_NUMBER', '0114591982')
    company_website = getattr(settings, 'SITE_URL', 'https://zencosystems.co.ke')
    
    product_str = inquiry.product_name or "General Inquiry"
    date_str = inquiry.created_at.strftime('%Y-%m-%d %H:%M')

    return f"""<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>We Have Received Your Inquiry</title>
  <style>
    body {{ font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f4f6f9; margin: 0; padding: 0; -webkit-font-smoothing: antialiased; }}
    table {{ border-collapse: collapse; }}
    .wrapper {{ width: 100%; table-layout: fixed; background-color: #f4f6f9; padding-bottom: 40px; }}
    .main-table {{ width: 100%; max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05); margin-top: 30px; }}
    .header {{ background-color: #0C094D; padding: 32px; text-align: center; }}
    .logo-text {{ color: #ffffff; font-size: 24px; font-weight: bold; letter-spacing: 1px; margin: 0; }}
    .header-subtitle {{ color: #F26C0C; font-size: 14px; font-weight: 600; text-transform: uppercase; margin-top: 6px; letter-spacing: 1.5px; }}
    .content {{ padding: 32px; color: #333333; font-size: 15px; line-height: 1.6; }}
    .greeting {{ font-size: 18px; font-weight: bold; color: #0C094D; margin-top: 0; margin-bottom: 16px; }}
    .details-box {{ background-color: #f8f9fc; border-left: 4px solid #F26C0C; padding: 20px; border-radius: 6px; margin: 24px 0; }}
    .details-box p {{ margin: 8px 0; font-size: 14px; color: #555555; }}
    .details-box p strong {{ color: #111111; }}
    .steps-title {{ font-size: 16px; font-weight: bold; color: #0C094D; margin-top: 24px; margin-bottom: 12px; }}
    .steps-list {{ margin: 0; padding-left: 20px; }}
    .steps-list li {{ margin-bottom: 8px; font-size: 14px; color: #555555; }}
    .contact-alert {{ background-color: #fff9f5; border: 1px solid #ffd8bf; padding: 16px; border-radius: 8px; margin-top: 24px; font-size: 13px; color: #666666; text-align: center; }}
    .contact-link {{ color: #F26C0C; font-weight: bold; text-decoration: none; }}
    .footer {{ background-color: #f8f9fc; padding: 32px 24px; text-align: center; border-top: 1px solid #eeeeee; }}
    .footer-text {{ font-size: 12px; color: #888888; margin: 0; line-height: 1.6; }}
    .footer-text a {{ color: #0C094D; text-decoration: none; font-weight: bold; }}
  </style>
</head>
<body>
  <div class="wrapper">
    <table class="main-table">
      <tr>
        <td class="header">
          <div class="logo-text">{company_name}</div>
          <div class="header-subtitle">Inquiry Received</div>
        </td>
      </tr>
      <tr>
        <td class="content">
          <div class="greeting">Hello {inquiry.name},</div>
          <p>Thank you for contacting <strong>{company_name}</strong>.</p>
          <p>We have successfully received your inquiry regarding:</p>
          <p style="font-size: 16px; font-style: italic; color: #0C094D; font-weight: bold; margin: 12px 0;">
            "{product_str}"
          </p>
          <p>Our team is currently reviewing your request, and one of our specialists will respond shortly.</p>

          <div class="details-box">
            <p><strong>Reference Number:</strong> {inquiry.ticket_number}</p>
            <p><strong>Submitted On:</strong> {date_str} EAT</p>
          </div>

          <div class="steps-title">What Happens Next?</div>
          <ol class="steps-list">
            <li>Our technical sales team reviews your request specifications.</li>
            <li>A specialist prepares the required technical sheets or custom quotation.</li>
            <li>We respond via email as soon as possible.</li>
          </ol>

          <div class="contact-alert">
            If your request is urgent, please call us via <strong>{company_phone}</strong> or whatsapp us.
          </div>
        </td>
      </tr>
      <tr>
        <td class="footer">
          <p class="footer-text">
            Kind Regards,<br/>
            <strong>{company_name}</strong><br/>
            <a href="{company_website}">{company_website.replace('https://', '').replace('http://', '')}</a><br/>
            {company_email} | {company_phone}
          </p>
        </td>
      </tr>
    </table>
  </div>
</body>
</html>
"""


def _build_admin_reply_html(inquiry, reply_message: str) -> str:
    company_name = getattr(settings, 'COMPANY_NAME', 'Zenco Systems Ltd')
    company_email = getattr(settings, 'COMPANY_EMAIL', 'info@zenithcoltd.com')
    company_phone = getattr(settings, 'COMPANY_PHONE_NUMBER', '0114591982')
    company_website = getattr(settings, 'SITE_URL', 'https://zencosystems.co.ke')
    
    formatted_reply = reply_message.replace("\n", "<br/>")

    return f"""<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Response to Inquiry</title>
  <style>
    body {{ font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f4f6f9; margin: 0; padding: 0; -webkit-font-smoothing: antialiased; }}
    table {{ border-collapse: collapse; }}
    .wrapper {{ width: 100%; table-layout: fixed; background-color: #f4f6f9; padding-bottom: 40px; }}
    .main-table {{ width: 100%; max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05); margin-top: 30px; }}
    .header {{ background-color: #0C094D; padding: 32px; text-align: center; }}
    .logo-text {{ color: #ffffff; font-size: 24px; font-weight: bold; letter-spacing: 1px; margin: 0; }}
    .header-subtitle {{ color: #F26C0C; font-size: 14px; font-weight: 600; text-transform: uppercase; margin-top: 6px; letter-spacing: 1.5px; }}
    .content {{ padding: 32px; color: #333333; font-size: 15px; line-height: 1.6; }}
    .greeting {{ font-size: 18px; font-weight: bold; color: #0C094D; margin-top: 0; margin-bottom: 16px; }}
    .reply-box {{ background-color: #ffffff; border: 1px solid #e2e8f0; padding: 24px; border-radius: 8px; margin: 20px 0; box-shadow: inset 0 2px 4px rgba(0,0,0,0.02); }}
    .ref-text {{ font-size: 12px; color: #888888; margin-bottom: 16px; border-bottom: 1px solid #f0f0f0; padding-bottom: 8px; }}
    .footer {{ background-color: #f8f9fc; padding: 32px 24px; text-align: center; border-top: 1px solid #eeeeee; }}
    .footer-text {{ font-size: 12px; color: #888888; margin: 0; line-height: 1.6; }}
    .footer-text a {{ color: #0C094D; text-decoration: none; font-weight: bold; }}
  </style>
</head>
<body>
  <div class="wrapper">
    <table class="main-table">
      <tr>
        <td class="header">
          <div class="logo-text">{company_name}</div>
          <div class="header-subtitle">Official Response</div>
        </td>
      </tr>
      <tr>
        <td class="content">
          <div class="greeting">Hello {inquiry.name},</div>
          <p>Thank you for reaching out to {company_name}. We have reviewed your request and have provided our response below.</p>
          
          <div class="reply-box">
            <div class="ref-text">Reference Ticket: <strong>{inquiry.ticket_number}</strong> | Date: {timezone.now().strftime('%Y-%m-%d')}</div>
            <div style="color: #2d3748; font-size: 14.5px;">{formatted_reply}</div>
          </div>
          
          <p>If you have any further questions or require additional support, feel free to reply directly to this email or reach us using the contacts below.</p>
        </td>
      </tr>
      <tr>
        <td class="footer">
          <p class="footer-text">
            Kind Regards,<br/>
            <strong>{company_name}</strong><br/>
            <a href="{company_website}">{company_website.replace('https://', '').replace('http://', '')}</a><br/>
            {company_email} | {company_phone}
          </p>
        </td>
      </tr>
    </table>
  </div>
</body>
</html>
"""
