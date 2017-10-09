from django.conf import settings
from django.template.loader import render_to_string
from post_office import mail
from post_office import utils
from post_office.utils import validate_email_with_name, string_types, ValidationError


def parse_emails(emails):
    """
    A function that returns a list of valid email addresses.
    This function will also convert a single email address into
    a list of email addresses.
    None value is also converted into an empty list.
    """

    if not emails:
        emails = None

    if isinstance(emails, string_types):
        emails = [emails]
    elif emails is None:
        emails = []

    for email in emails:
        if not email:
            continue

        try:
            validate_email_with_name(email)
        except ValidationError:
            raise ValidationError('{} is not a valid email address'.format(email))

    return emails


utils.parse_emails = mail.parse_emails = parse_emails


def send_multi_format_email(template_prefix, template_ctxt, target_email):
    subject_file = '{}_subject.txt'.format(template_prefix)
    txt_file = '{}.txt'.format(template_prefix)
    html_file = '{}.html'.format(template_prefix)

    subject = render_to_string(subject_file, template_ctxt).strip()
    from_email = settings.DEFAULT_EMAIL_FROM
    to = []
    bcc = []
    if isinstance(target_email, str):
        to = [settings.DEBUG_EMAIL if settings.DEBUG else target_email]
    else:
        bcc = [settings.DEBUG_EMAIL] if settings.DEBUG else target_email
    text_content = render_to_string(txt_file, template_ctxt)
    html_content = render_to_string(html_file, template_ctxt)

    mail.send(recipients=to, sender=from_email, subject=subject, message=text_content, html_message=html_content,
              bcc=bcc)


def send_basic_email(subject, template, data, target_email):
    from_email = settings.DEFAULT_EMAIL_FROM
    to = []
    bcc = []
    if isinstance(target_email, str):
        to = [settings.DEBUG_EMAIL if settings.DEBUG else target_email]
    else:
        bcc = [settings.DEBUG_EMAIL] if settings.DEBUG else target_email
    text_content = render_to_string(template, data)
    mail.send(recipients=to, sender=from_email, subject=subject, message=text_content,
              bcc=bcc)

