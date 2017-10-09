from rest_framework import serializers

from accounts.serializers import PhotographerSerializer
from stockphotos.middleware import GlobalRequestMiddleware
from .models import Photo


class PhotoBriefSerializer(serializers.ModelSerializer):
    url = serializers.SerializerMethodField()

    class Meta:
        model = Photo
        fields = ('id', 'url', 'width', 'height')

    @staticmethod
    def get_url(obj):
        if not obj.path:
            return None

        request = GlobalRequestMiddleware.get_current_request()
        return request.build_absolute_uri('/{}'.format(obj.path))


class PhotoSerializer(PhotoBriefSerializer):
    photographer = PhotographerSerializer()

    class Meta:
        model = Photo
        fields = (
            'id', 'photographer', 'url', 'created_at', 'modified_at', 'approved', 'description', 'extra', 'width',
            'height')

#
# class CollectionInlineSerializer(serializers.ModelSerializer):
#     photo_count = serializers.SerializerMethodField()
#     extra_photo_count = serializers.SerializerMethodField()
#     details_url = serializers.SerializerMethodField()
#     created_by = UserSerializer()
#
#     class Meta:
#         model = Collection
#         fields = (
#             'id', 'approved', 'draft', 'created_at', 'modified_at', 'description', 'name', 'photo_count',
#             'extra_photo_count', 'details_url', 'premium', 'created_by'
#         )
#
#     @staticmethod
#     def get_photo_count(obj):
#         request = GlobalRequestMiddleware.get_current_request()
#
#         queryset = obj.photo_set.filter(active=True)
#
#         # If not subscriber
#         if (not request.auth
#             or (request.user.id != obj.created_by and not Subscription.objects.filter(
#                 photographer=obj.created_by,
#                 subscriber=request.user).exists() and not request.user.is_staff
#                 )):
#             queryset = queryset.exclude(extra=True)
#
#         return queryset.count()
#
#     @staticmethod
#     def get_extra_photo_count(obj):
#         request = GlobalRequestMiddleware.get_current_request()
#
#         if request.auth and (
#                             request.user.id == obj.created_by or
#                         Subscription.objects.filter(
#                             photographer=obj.created_by,
#                             subscriber=request.user
#                         ).exists() or
#                     request.user.is_staff
#         ):
#             return obj.photo_set.filter(extra=True).count()
#
#         return 0
#
#     @staticmethod
#     def get_details_url(obj):
#         request = GlobalRequestMiddleware.get_current_request()
#         return request.build_absolute_uri(reverse('collection', kwargs={'collection_id': obj.id}))
#
#
# class PhotoWithCollectionSerializer(PhotoSerializer):
#     collection = CollectionInlineSerializer()
#
#     class Meta:
#         model = Photo
#         fields = (
#             'id', 'uploaded_by', 'url', 'created_at', 'modified_at', 'approved', 'description', 'extra', 'collection',
#             'width', 'height'
#         )
#
#
# class CollectionListSerializer(serializers.ModelSerializer):
#     photo_count = serializers.SerializerMethodField()
#     extra_photo_count = serializers.SerializerMethodField()
#     details_url = serializers.SerializerMethodField()
#     featured_photos = serializers.SerializerMethodField()
#
#     class Meta:
#         model = Collection
#         fields = (
#             'id', 'approved', 'draft', 'created_at', 'modified_at', 'description', 'name', 'photo_count',
#             'extra_photo_count', 'details_url', 'premium', 'featured_photos'
#         )
#
#     @staticmethod
#     def get_photo_count(obj):
#         request = GlobalRequestMiddleware.get_current_request()
#
#         queryset = obj.photo_set.filter(active=True)
#
#         # If not subscriber
#         if (not request.auth
#             or (request.user.id != obj.created_by and not Subscription.objects.filter(
#                 photographer=obj.created_by,
#                 subscriber=request.user).exists() and not request.user.is_staff
#                 )):
#             queryset = queryset.exclude(extra=True)
#
#         return queryset.count()
#
#     @staticmethod
#     def get_extra_photo_count(obj):
#         request = GlobalRequestMiddleware.get_current_request()
#
#         if request.auth and (
#                             request.user.id == obj.created_by or
#                         Subscription.objects.filter(
#                             photographer=obj.created_by,
#                             subscriber=request.user
#                         ).exists() or
#                     request.user.is_staff
#         ):
#             return obj.photo_set.filter(extra=True).count()
#
#         return 0
#
#     @staticmethod
#     def get_details_url(obj):
#         request = GlobalRequestMiddleware.get_current_request()
#         return request.build_absolute_uri(reverse('collection', kwargs={'collection_id': obj.id}))
#
#     @staticmethod
#     def get_featured_photos(obj):
#         request = GlobalRequestMiddleware.get_current_request()
#
#         return (request.build_absolute_uri('/{}'.format(path)) for path in
#                 obj.photo_set.filter(featured=True, path__isnull=False, extra=False).order_by('id')[:2].values_list(
#                     'path'))
#
#
# class CollectionSerializer(serializers.ModelSerializer):
#     photos = serializers.SerializerMethodField()
#     created_by = UserSerializer()
#     add_photo_url = serializers.SerializerMethodField()
#
#     class Meta:
#         model = Collection
#         fields = (
#             'id', 'approved', 'draft', 'created_at', 'modified_at', 'description', 'name', 'created_by',
#             'photos', 'premium', 'add_photo_url')
#
#     @staticmethod
#     def get_photos(obj):
#         request = GlobalRequestMiddleware.get_current_request()
#         queryset = obj.photo_set.filter(active=True)
#
#         # If not subscriber
#         if not request.auth or (
#                             request.user.id != obj.created_by and
#                         not Subscription.objects.filter(
#                             photographer=obj.created_by,
#                             subscriber=request.user).exists()
#                 and not request.user.is_staff):
#             queryset = queryset.exclude(extra=True)
#
#         return PhotoSerializer(queryset, many=True).data
#
#     @staticmethod
#     def get_add_photo_url(obj):
#         request = GlobalRequestMiddleware.get_current_request()
#         return request.build_absolute_uri(reverse('collection-photos', kwargs={'collection_id': obj.id}))
