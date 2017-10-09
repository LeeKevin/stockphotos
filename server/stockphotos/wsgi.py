import os
import subprocess
from django.core.wsgi import get_wsgi_application

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "stockphotos.settings")

application = get_wsgi_application()

try:
    import uwsgidecorators
    from django.core.management import call_command


    # Send mail
    @uwsgidecorators.timer(10)
    def send_queued_mail(num):
        """Send queued mail every 10 seconds"""
        call_command('send_queued_mail', processes=1)


    # Prune photos
    @uwsgidecorators.cron(0, 2, -1, -1, -1)
    def prune_photos(num):
        """Prune photos at 2 AM"""
        call_command('clean_files', processes=1)

except ImportError:
    call_command = None
    uwsgidecorators = None
    print("uwsgidecorators not found. Cron and timers are disabled")
