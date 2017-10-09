import hashlib
import os

import magic
from django.conf import settings
from django.core.files.images import get_image_dimensions
from django.db import models
from django.db.models.signals import pre_delete
from django.dispatch import receiver

from stockphotos import errors
from utils.models import TimeStamped, ModelMixin
from .utils import save_photo, guess_extension

User = settings.AUTH_USER_MODEL

IMAGE_FORMATS = ('.bmp', '.gif', '.jpg', '.jpe', '.jpeg', '.png', '.tif', '.tiff')


# class Pack(TimeStamped, ModelMixin):
#     created_by = models.ForeignKey(User, db_index=True)
#     name = models.CharField(max_length=30)
#     description = models.TextField(max_length=500, blank=True, default='')
#
#     approved = models.BooleanField(default=False)
#     approved_date = models.DateTimeField(blank=True, null=True)
#     draft = models.BooleanField(default=True)
#
#     # Subscribers can access premium collections
#     premium = models.BooleanField(default=False)
#
#     class Meta:
#         ordering = ['created_at']
#
#     def save(self, *args, **kwargs):
#         initial = self._initial
#
#         with transaction.atomic():
#             if not initial['approved'] and self.approved:
#                 self.approved_date = timezone.now()
#
#                 self.photo_set.filter(active=True).update(approved=True, approved_date=self.approved_date)
#
#                 self.draft = False
#
#                 # TODO: Send approval email
#
#             elif not self.approved:
#                 self.approved_date = None
#                 self.photo_set.filter(approved=True).update(approved=False, approved_date=None)
#                 self.draft = True
#
#             super(Collection, self).save(*args, **kwargs)
#
#     def __str__(self):
#         return self.name or 'New'


class Photo(TimeStamped, ModelMixin):
    uploaded_by = models.ForeignKey(User, db_index=True)
    photographer = models.ForeignKey('accounts.Photographer', db_index=True, blank=True, null=True)
    path = models.FilePathField(blank=True, null=True, max_length=1000)
    hash = models.CharField(max_length=40, blank=True, null=True, db_index=True)
    description = models.TextField(max_length=500, blank=True, default='')
    # collection = models.ForeignKey(Collection, db_index=True, null=True, blank=True, on_delete=models.SET_NULL)
    active = models.BooleanField(default=True)
    showcase = models.BooleanField(default=False)

    # Meta data
    width = models.IntegerField(blank=True, null=True)
    height = models.IntegerField(blank=True, null=True)

    is_profile = models.BooleanField(default=False, verbose_name='Profile picture')

    class Meta:
        ordering = ['created_at']

    def save(self, *args, **kwargs):
        # if not self.collection and self.collection_id:
        #     try:
        #         self.collection = Collection.objects.get(self.collection_id)
        #     except models.ObjectDoesNotExist:
        #         self.collection_id = None

        super(Photo, self).save(*args, **kwargs)

    def upload(self, file_contents):
        # Get hash for photo contents
        md5 = hashlib.md5()
        md5.update(file_contents)
        hash_string = md5.hexdigest()

        existing_photo = Photo.objects.filter(hash=hash_string).first()
        if existing_photo:  # Check if photos exist with same photo contents
            photo_path = existing_photo.path

            existing_photo.description = self.description
            existing_photo.collection_id = self.collection_id
            existing_photo.active = True
            existing_photo.save()
            self.delete()

            return existing_photo
        else:
            # Check mime type and get proper extension
            mime = magic.from_buffer(file_contents, mime=True)
            extension = guess_extension(mime)
            if not extension:
                raise errors.GenericAPIException(name='File Error',
                                                 message='Could not identity the uploaded photo\'s media type.')

            if extension.lower() not in IMAGE_FORMATS:
                raise errors.GenericAPIException(name='File Error',
                                                 message='The uploaded file is not a valid image format: {}'.format(
                                                     ', '.join(IMAGE_FORMATS)))

            photo_name = "{}{}".format(hash_string, extension)
            try:
                # Two level directory structure
                directory_path = os.path.join(hash_string[:2], hash_string[2:4], photo_name)
                photo_path = save_photo(directory_path, file_contents)
            except:
                raise errors.GenericAPIException(name='File Error', message='Error while attempting to save photo.')

            try:
                self.path = photo_path
                self.hash = hash_string

                dimensions = get_image_dimensions(photo_path)
                self.width = dimensions[0]
                self.height = dimensions[1]
                self.save()
            except:
                raise errors.GenericAPIException(name='File Error', message='Error while attempting to save photo.')

            return self

    def __str__(self):
        return self.path or 'New'


# @receiver(pre_delete, sender=Collection)
# def on_collection_delete(sender, instance, **kwargs):
#     instance.photo_set.all().update(active=False)


@receiver(pre_delete, sender=Photo)
def on_photo_delete(sender, instance, **kwargs):
    try:
        abs_path = os.path.join(os.path.dirname(settings.BASE_DIR), instance.path)
        os.remove(abs_path)
        os.removedirs(os.path.dirname(abs_path))
    except (OSError, TypeError):
        # If any error (because can't delete non-empty directory)
        pass
