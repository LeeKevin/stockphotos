import re

from django.contrib.contenttypes.fields import ContentType
from django.core.management.base import BaseCommand

from photos.models import Photo


class Command(BaseCommand):
    help = ('Removes Photo records from the database that do not have an associated file in the filesystem')

    def add_arguments(self, parser):
        pass

    def handle(self, *args, **options):
        photos = Photo.objects.filter(path__isnull=True).delete()

