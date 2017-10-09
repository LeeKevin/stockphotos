import io
import math

from PIL import Image
from django.conf import settings
from django.core.urlresolvers import reverse
from rest_framework import status
from rest_framework import views
from rest_framework.permissions import IsAuthenticatedOrReadOnly, IsAuthenticated
from rest_framework.response import Response

from stockphotos import errors
from utils.functions import encode, decode
from .models import Photo
from .serializers import PhotoSerializer


def photo_upload_validation(request):
    if not (request.body and isinstance(request.body, bytes) and len(request.body)):
        raise errors.BadRequestError(message='You must provide photo data to upload.')

    if len(request.body) > math.pow(2, 20) * 100:  # If bigger than 100 MB, raise error
        raise errors.GenericAPIException(name='Photo Too Large',
                                         status=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                                         message='Your photo must not exceed 100 MB.')

    if 'CONTENT_LENGTH' in request.META and len(request.body) != int(request.META['CONTENT_LENGTH']):
        raise errors.BadRequestError(message='Your photo was corrupted during transfer.')

    b = io.BytesIO(request.data)
    with Image.open(b) as im:
        try:
            im.verify()
        except:
            raise errors.BadRequestError(message='Your photo is not an acceptable image file. Use an image file with '
                                                 'a valid extension: .jpg, .png, .gif')


class PhotoUpload(views.APIView):
    permission_classes = (IsAuthenticated,)

    @staticmethod
    def post(request):
        return add_photo(request, request.data)

    @staticmethod
    def put(request):
        if 'upload_id' not in request.query_params:
            raise errors.BadRequestError(message='You must specify an upload id.')
        try:
            # check if meta data for photo to upload already exists
            photo = Photo.objects.get(pk=int(decode(settings.SECRET_KEY, request.query_params['upload_id'])))
        except:
            raise errors.BadRequestError(message='You must specify an upload id.')

        # Verify the user
        if not ((request.user.is_staff or request.user.id == photo.uploaded_by_id) and request.user.is_active):
            raise errors.GenericAPIException(
                name="Unauthorized user",
                message="You are not authorized to upload this photo.",
                status=status.HTTP_401_UNAUTHORIZED
            )

        if photo.path:
            raise errors.BadRequestError(message='The upload id is expired.')

        try:
            photo_upload_validation(request)
            photo = photo.upload(request.body)
        except Exception as err:
            photo.delete()
            raise err

        return Response({
            'location': request.build_absolute_uri('/' + photo.path)
        }, status=status.HTTP_200_OK)


# class CollectionView(views.APIView):
#     permission_classes = (IsAuthenticatedOrReadOnly,)
#
#     @staticmethod
#     def get(request, collection_id):
#         collection = Collection.objects.get(pk=collection_id)
#
#         # If not approved and not the creator, don't allow view
#         if not collection.approved and (
#                     not request.auth or request.user.id != collection.created_by_id) and not request.user.is_staff:
#             raise errors.GenericAPIException(
#                 name="Not Found",
#                 message="The collection could not be found.",
#                 status=status.HTTP_404_NOT_FOUND
#             )
#
#         if (not request.auth or not request.user.is_subscribed) and collection.premium and not request.user.is_staff:
#             raise errors.GenericAPIException(
#                 name="Unauthorized user",
#                 message="You are not authorized to view this collection.",
#                 status=status.HTTP_401_UNAUTHORIZED
#             )
#
#         return Response(CollectionSerializer(collection).data)
#
#     @staticmethod
#     def put(request, collection_id):
#         collection = Collection.objects.get(pk=collection_id)
#
#         if not (request.user.id == collection.created_by_id and request.user.is_active):
#             raise errors.GenericAPIException(
#                 name="Unauthorized user",
#                 message="You are not authorized to make changes to this collection.",
#                 status=status.HTTP_401_UNAUTHORIZED
#             )
#
#         if collection.approved:
#             raise errors.BadRequestError(
#                 message="You cannot make changes to the collection after it has already been approved.",
#                 status=status.HTTP_403_FORBIDDEN)
#
#         data = request.data
#         name = data.get('name')
#         description = data.get('description')
#         draft = data.get('draft')
#
#         if name is not None:
#             collection.name = name
#         if description is not None:
#             collection.description = description
#         if draft is not None:
#             collection.draft = bool(draft)
#
#         collection.save()
#
#         return Response(status=status.HTTP_200_OK)
#
#     @staticmethod
#     def delete(request, collection_id):
#         collection = Collection.objects.filter(pk=collection_id, created_by=request.user).first()
#
#         if collection.approved:
#             raise errors.BadRequestError(
#                 message="You cannot remove the collection after it has already been approved.",
#                 status=status.HTTP_403_FORBIDDEN)
#
#         collection.delete()
#
#         return Response(status=status.HTTP_204_NO_CONTENT)
#
#
# class MyCollectionsView(views.APIView):
#     permission_classes = (IsAuthenticated,)
#
#     @staticmethod
#     def get(request):
#         # Get all own collections
#         return Response(
#             CollectionListSerializer(Collection.objects.filter(created_by_id=request.user.id), many=True).data)
#
#     @staticmethod
#     def post(request):
#         data = request.data
#         name = data.get('name')
#         description = data.get('description')
#
#         if not name:
#             raise errors.BadRequestError(message='You must provide a name for this photo collection.')
#
#         if Collection.objects.filter(name=name, created_by=request.user).exists():
#             raise errors.BadRequestError(
#                 message='You already have a photo collection with the name "{}".'.format(name))
#
#         collection = Collection(name=name, created_by=request.user)
#         if description:
#             collection.description = description
#         collection.save()
#
#         return Response(CollectionSerializer(collection).data)
#
#
# class UserCollectionsView(views.APIView):
#     permission_classes = (IsAuthenticatedOrReadOnly,)
#
#     @staticmethod
#     def get(request, user_id):
#         queryset = Collection.objects.filter(created_by_id=user_id)
#
#         if not request.auth or (request.user.id != int(user_id) and not request.user.is_staff):
#             # If not creator, don't show unapproved collections
#             queryset = queryset.exclude(approved=False)
#             if not request.auth or not request.user.is_subscribed:
#                 # Show premium collections if logged in and user is creator or is premium
#                 queryset = queryset.exclude(premium=True)
#
#         return Response(CollectionListSerializer(queryset, many=True).data)
#
#
# class CollectionPhotosView(views.APIView):
#     permission_classes = (IsAuthenticatedOrReadOnly,)
#
#     @staticmethod
#     def post(request, collection_id):
#         data = request.data
#         data['collection_id'] = collection_id
#         return add_photo(request, data)
#
#
# class CollectionPhotoView(views.APIView):
#     permission_classes = (IsAuthenticatedOrReadOnly,)
#
#     @staticmethod
#     def put(request, collection_id, photo_id):
#         try:
#             photo = Photo.objects.get(collection_id=collection_id, id=photo_id, collection__created_by=request.user)
#         except ObjectDoesNotExist:
#             raise errors.BadRequestError('Photo could not be found.', status=status.HTTP_404_NOT_FOUND)
#
#         if photo.approved:
#             raise errors.BadRequestError('Approved photos cannot be edited.', status=status.HTTP_403_FORBIDDEN)
#
#         data = request.data
#         description = data.get('description', None)
#
#         if description is None:
#             raise errors.BadRequestError('You must provide a new description to update this photo.')
#
#         photo.description = description
#         photo.save()
#
#         return Response()
#
#     @staticmethod
#     def delete(request, collection_id, photo_id):
#         try:
#             photo = Photo.objects.get(collection_id=collection_id, id=photo_id, collection__created_by=request.user)
#         except ObjectDoesNotExist:
#             raise errors.BadRequestError('Photo could not be found.', status=status.HTTP_404_NOT_FOUND)
#
#         if photo.approved:
#             raise errors.BadRequestError('Approved photos cannot be removed.', status=status.HTTP_403_FORBIDDEN)
#
#         photo.delete()
#
#         return Response()


class Feed(views.APIView):
    permission_classes = (IsAuthenticatedOrReadOnly,)

    @staticmethod
    def get(request):
        queryset = Photo.objects.filter(active=True, showcase=True)

        return Response(
            PhotoSerializer(queryset.select_related('photographer'), many=True).data)


def add_photo(request, data):
    description = data.get('description', '')
    collection_id = data.get('collection_id')

    # if collection_id and not Collection.objects.filter(id=collection_id, created_by=request.user).exists():
    #     raise errors.BadRequestError("You can't add a photo to someone else's collection.",
    #                                  status=status.HTTP_401_UNAUTHORIZED)

    photographer = request.user.photographer

    photo = Photo.objects.create(uploaded_by=request.user, description=description, collection_id=collection_id,
                                 photographer=photographer if photographer else None)

    return Response({
        'location': request.build_absolute_uri(
            reverse('photo-upload') + '?upload_id=' + encode(settings.SECRET_KEY, photo.id))
    }, status=status.HTTP_201_CREATED)
