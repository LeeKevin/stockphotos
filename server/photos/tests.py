import datetime
import hashlib
import math
import os

from django.conf import settings
from django.contrib.auth import get_user_model
from django.contrib.contenttypes.fields import ContentType
from django.core.urlresolvers import reverse
from django.utils import timezone
from oauth2_provider.models import AccessToken, Application
from rest_framework import status
from rest_framework.test import APITestCase, APIRequestFactory, APITransactionTestCase

from utils.functions import encode
from utils.test.helpers import parse_response, set_request_to_context
from .models import Photo, Collection
from .utils import save_photo
from subscriptions.models import Subscription

rf = APIRequestFactory()


class PhotoAddTests(APITransactionTestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user('test@test.com', 'test')
        self.other_user = get_user_model().objects.create_user('other@example.com', 'other')

        # Authentication
        application = Application.objects.create(client_type=Application.CLIENT_CONFIDENTIAL,
                                                 authorization_grant_type=Application.GRANT_PASSWORD)
        token = AccessToken.objects.create(user=self.user, token='1234567890',
                                           application=application,
                                           expires=timezone.now() + datetime.timedelta(days=1),
                                           scope='read write')
        self.token = token.token

        # Someone else's collection
        self.collection = Collection.objects.create(name='Test', created_by=self.other_user)

    def test_add_photo_direct_view(self):
        self.client.credentials(HTTP_AUTHORIZATION='Bearer ' + self.token)
        response = self.client.post(reverse('photo-upload'))
        content = parse_response(response.content)
        photo = Photo.objects.latest('id')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(photo.uploaded_by_id, self.user.id)
        request = rf.post('/')
        self.assertEqual(content['location'], request.build_absolute_uri(
            reverse('photo-upload') + '?upload_id=' + encode(settings.SECRET_KEY, photo.id)))

    # test add to wrong collection (of different user)
    def test_add_photo_other_user_collection(self):
        self.client.credentials(HTTP_AUTHORIZATION='Bearer ' + self.token)
        response = self.client.post(reverse('photo-upload'), {'collection_id': self.collection.id}, format='json')
        content = parse_response(response.content)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertEqual(Photo.objects.count(), 0)
        self.assertEqual(content['error']['description'], "You can't add a photo to someone else's collection.")


class PhotoUploadTests(APITransactionTestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user('test@test.com', 'test')
        self.other_user = get_user_model().objects.create_user('other@test.com', 'other')

        # Authentication
        application = Application.objects.create(client_type=Application.CLIENT_CONFIDENTIAL,
                                                 authorization_grant_type=Application.GRANT_PASSWORD)
        token = AccessToken.objects.create(user=self.user, token='1234567890',
                                           application=application,
                                           expires=timezone.now() + datetime.timedelta(days=1),
                                           scope='read write')
        self.token = token.token

        # PNG image
        self.image_data = b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x02\x00\x00\x00\x90wS\xde\x00\x00\x00\x01sRGB\x00\xae\xce\x1c\xe9\x00\x00\x00\tpHYs\x00\x00\x0b\x13\x00\x00\x0b\x13\x01\x00\x9a\x9c\x18\x00\x00\x00\x07tIME\x07\xdb\x0c\x17\x020;\xd1\xda\xcf\xd2\x00\x00\x00\x0cIDAT\x08\xd7c\xf8\xff\xff?\x00\x05\xfe\x02\xfe\xdc\xccY\xe7\x00\x00\x00\x00IEND\xaeB`\x82'
        # Get hash for photo contents
        md5 = hashlib.md5()
        md5.update(self.image_data)
        self.expected_hash = md5.hexdigest()

        self.expected_extension = '.png'

        # Get expected media url
        name = '{}{}'.format(self.expected_hash, self.expected_extension)
        self.expected_path = os.path.join('media', self.expected_hash[:2], self.expected_hash[2:4], name)
        self.expected_uri = os.path.join(os.path.dirname(settings.BASE_DIR), self.expected_path)

        # Create a photo record in the database (but not on photosystem)
        self.user_content_type = ContentType.objects.get_for_model(get_user_model())
        # Note that we name it jpg here
        self.photo = Photo.objects.create(uploaded_by=self.user)
        self.other_photo = Photo.objects.create(uploaded_by=self.other_user)

        self.request = rf.post('/')
        self.upload_url = self.request.build_absolute_uri(
            reverse('photo-upload') + '?upload_id=' + encode(settings.SECRET_KEY, self.photo.id))

        # Ensure any created photos from last test are deleted
        self.tearDown()

    def tearDown(self):
        try:
            os.remove(self.expected_uri)
            os.removedirs(os.path.dirname(self.expected_uri))
        except OSError:
            # If any error (because can't delete non-empty directory)
            pass

    def test_upload_new_photo(self):
        self.client.credentials(HTTP_AUTHORIZATION='Bearer ' + self.token)
        response = self.client.put(self.upload_url, self.image_data, format='raw')
        content = parse_response(response.content)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        self.photo.refresh_from_db()
        self.assertTrue(hasattr(self.photo, 'hash'))
        self.assertEqual(self.expected_hash, self.photo.hash)

        # Check that photo exists
        self.assertTrue(os.path.isfile(self.expected_uri))

        # Check that expected path is correct
        self.assertEqual(self.expected_path, self.photo.path)

        # Check that location in response is correct
        self.assertEqual(self.request.build_absolute_uri('/' + self.expected_path), content['location'])

        # Check that extension changed to right one
        self.assertEqual(self.expected_extension, os.path.splitext(self.photo.path)[1])

    def test_upload_existing_photo(self):
        # Build existing photo
        save_photo(self.expected_path, self.image_data)
        self.photo.path = self.expected_path
        self.photo.hash = self.expected_hash
        self.photo.save()

        self.client.credentials(HTTP_AUTHORIZATION='Bearer ' + self.token)

        photo = Photo.objects.create(uploaded_by=self.user)

        response = self.client.put(
            '{}?upload_id={}'.format(
                self.request.build_absolute_uri(reverse('photo-upload')), encode(settings.SECRET_KEY, photo.id)
            ), self.image_data, format='raw')
        content = parse_response(response.content)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(Photo.objects.filter(pk=photo.pk).exists())
        self.assertEqual(self.request.build_absolute_uri('/' + self.expected_path), content['location'])

        # TODO: check that existing photo has updated description and collection and active

    def test_upload_without_upload_id(self):
        self.client.credentials(HTTP_AUTHORIZATION='Bearer ' + self.token)

        response = self.client.put(self.request.build_absolute_uri(reverse('photo-upload')), self.image_data,
                                   format='raw')
        content = parse_response(response.content)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual('You must specify an upload id.', content['error']['description'])

    def test_upload_with_invalid_upload_id(self):
        self.client.credentials(HTTP_AUTHORIZATION='Bearer ' + self.token)

        response = self.client.put(self.request.build_absolute_uri(
            reverse('photo-upload') + '?upload_id=2312kdkdaskdskdko'), self.image_data,
            format='raw')
        content = parse_response(response.content)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual('You must specify an upload id.', content['error']['description'])

    def test_upload_without_photo_data(self):
        self.client.credentials(HTTP_AUTHORIZATION='Bearer ' + self.token)

        response = self.client.put(self.request.build_absolute_uri(
            reverse('photo-upload') + '?upload_id=' + encode(settings.SECRET_KEY, self.photo.id)), format='raw')
        content = parse_response(response.content)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual('You must provide photo data to upload.', content['error']['description'])

    def test_upload_too_large(self):
        self.client.credentials(HTTP_AUTHORIZATION='Bearer ' + self.token)

        too_large_bytes = bytes(int(math.pow(2, 20) * 100 + 1))  # over 100 MB

        response = self.client.put(self.request.build_absolute_uri(
            reverse('photo-upload') + '?upload_id=' + encode(settings.SECRET_KEY, self.photo.id)), too_large_bytes,
            format='raw')
        content = parse_response(response.content)
        self.assertEqual(response.status_code, status.HTTP_413_REQUEST_ENTITY_TOO_LARGE)
        self.assertEqual('Your photo must not exceed 100 MB.', content['error']['description'])

    # test upload expired (existing path)
    def test_upload_expired(self):
        self.client.credentials(HTTP_AUTHORIZATION='Bearer ' + self.token)

        # Photo already has path, hash
        self.photo.path = 'test'
        self.photo.hash = 'test'
        self.photo.save()

        response = self.client.put(self.request.build_absolute_uri(
            reverse('photo-upload') + '?upload_id=' + encode(settings.SECRET_KEY, self.photo.id)), self.image_data,
            format='raw')
        content = parse_response(response.content)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual('The upload id is expired.', content['error']['description'])

    # test upload unauthorized user (wrong user uploading vs create)
    def test_upload_unauthorized_user(self):
        self.client.credentials(HTTP_AUTHORIZATION='Bearer ' + self.token)

        response = self.client.put(self.request.build_absolute_uri(
            reverse('photo-upload') + '?upload_id=' + encode(settings.SECRET_KEY, self.other_photo.id)),
            self.image_data,
            format='raw')
        content = parse_response(response.content)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertEqual('You are not authorized to upload this photo.', content['error']['description'])


class PhotoDeleteTests(APITestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user(
            'test@test.com', 'test')

        # PNG image
        self.image_data = b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x02\x00\x00\x00\x90wS\xde\x00\x00\x00\x01sRGB\x00\xae\xce\x1c\xe9\x00\x00\x00\tpHYs\x00\x00\x0b\x13\x00\x00\x0b\x13\x01\x00\x9a\x9c\x18\x00\x00\x00\x07tIME\x07\xdb\x0c\x17\x020;\xd1\xda\xcf\xd2\x00\x00\x00\x0cIDAT\x08\xd7c\xf8\xff\xff?\x00\x05\xfe\x02\xfe\xdc\xccY\xe7\x00\x00\x00\x00IEND\xaeB`\x82'
        # Get hash for photo contents
        md5 = hashlib.md5()
        md5.update(self.image_data)
        self.expected_hash = md5.hexdigest()

        # Create a photo record
        self.photo = Photo(uploaded_by=self.user)
        # Build existing photo
        self.photo.path = os.path.join('media', self.expected_hash[:2], self.expected_hash[2:4], 'test.png')
        self.photo.save()
        self.expected_uri = os.path.join(os.path.dirname(settings.BASE_DIR), self.photo.path)

        save_photo(self.photo.path, self.image_data)

    def tearDown(self):
        try:
            os.remove(self.expected_uri)
            os.removedirs(os.path.dirname(self.expected_uri))
        except OSError:
            # If any error (because can't delete non-empty directory)
            pass

    def test_delete_photo(self):
        self.photo.delete()

        # Check that photo is deleted
        self.assertEqual(0, Photo.objects.count())
        self.assertFalse(os.path.isfile(self.expected_uri))


class CollectionAddTests(APITestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user('test@test.com', 'test')

        # Authentication
        application = Application.objects.create(client_type=Application.CLIENT_CONFIDENTIAL,
                                                 authorization_grant_type=Application.GRANT_PASSWORD)
        token = AccessToken.objects.create(user=self.user, token='1234567890',
                                           application=application,
                                           expires=timezone.now() + datetime.timedelta(days=1),
                                           scope='read write')
        self.token = token.token

    # test basic add (with description)
    def test_add_collection(self):
        self.client.credentials(HTTP_AUTHORIZATION='Bearer ' + self.token)

        collection_data = {'name': 'Test collection', 'description': 'desc'}
        response = self.client.post(reverse('my-collections'), collection_data, format='json')
        content = parse_response(response.content)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        collection = Collection.objects.latest('id')
        self.assertEqual(collection.id, content['id'])
        self.assertEqual(content['name'], collection_data['name'])
        self.assertEqual(content['description'], collection_data['description'])
        self.assertEqual(content['draft'], True)
        self.assertEqual(content['created_by']['id'], self.user.id)

    # test add without name
    def test_add_collection_without_name(self):
        self.client.credentials(HTTP_AUTHORIZATION='Bearer ' + self.token)

        response = self.client.post(reverse('my-collections'))
        content = parse_response(response.content)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(content['error']['description'], 'You must provide a name for this photo collection.')

    # test add with existing name
    def test_add_collection_with_existing_name(self):
        self.client.credentials(HTTP_AUTHORIZATION='Bearer ' + self.token)
        duplicate_name = 'Test collection'
        Collection.objects.create(name=duplicate_name, created_by=self.user)

        collection_data = {'name': duplicate_name, 'description': 'desc'}
        response = self.client.post(reverse('my-collections'), collection_data, format='json')
        content = parse_response(response.content)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(content['error']['description'],
                         'You already have a photo collection with the name "{}".'.format(duplicate_name))


class CollectionUpdateTests(APITestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user('test@test.com', 'test')
        self.other_user = get_user_model().objects.create_user('other@test.com', 'other')

        # Authentication
        application = Application.objects.create(client_type=Application.CLIENT_CONFIDENTIAL,
                                                 authorization_grant_type=Application.GRANT_PASSWORD)
        token = AccessToken.objects.create(user=self.user, token='1234567890',
                                           application=application,
                                           expires=timezone.now() + datetime.timedelta(days=1),
                                           scope='read write')
        self.token = token.token

        self.collection = Collection.objects.create(name='Test collection', created_by=self.user)
        self.other_collection = Collection.objects.create(name='Other collection', created_by=self.other_user)

        self.photo = Photo.objects.create(uploaded_by=self.user, collection=self.collection)

    # test basic update
    def test_update_collection(self):
        self.client.credentials(HTTP_AUTHORIZATION='Bearer ' + self.token)

        collection_data = {'name': 'New name', 'description': 'New description'}
        response = self.client.put(reverse('collection', kwargs={'collection_id': self.collection.id}),
                                   collection_data, format='json')
        self.collection.refresh_from_db()
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(self.collection.name, collection_data['name'])
        self.assertEqual(self.collection.description, collection_data['description'])

    # test update unauthorized user
    def test_update_collection_unauthorized_user(self):
        self.client.credentials(HTTP_AUTHORIZATION='Bearer ' + self.token)

        collection_data = {'name': 'New name', 'description': 'New description'}
        response = self.client.put(reverse('collection', kwargs={'collection_id': self.other_collection.id}),
                                   collection_data, format='json')
        content = parse_response(response.content)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertEqual('You are not authorized to make changes to this collection.', content['error']['description'])

    # test update already approved
    def test_update_approved_collection(self):
        self.client.credentials(HTTP_AUTHORIZATION='Bearer ' + self.token)

        self.collection.approved = True
        self.collection.save()

        collection_data = {'name': 'New name', 'description': 'New description'}
        response = self.client.put(reverse('collection', kwargs={'collection_id': self.collection.id}),
                                   collection_data, format='json')
        content = parse_response(response.content)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual('You cannot make changes to the collection after it has already been approved.',
                         content['error']['description'])

    # test approve collection
    def test_approve_collection(self):
        self.collection.approved = True
        self.collection.save()
        self.collection.refresh_from_db()
        self.photo.refresh_from_db()
        self.assertTrue(self.collection.approved)
        self.assertTrue(isinstance(self.collection.approved_date, datetime.date))
        self.assertTrue(self.photo.approved)
        self.assertTrue(isinstance(self.photo.approved_date, datetime.date))
        self.assertEqual(self.collection.approved_date, self.photo.approved_date)


class CollectionGetTests(APITestCase):
    def setUp(self):
        self.request = rf.post('/')
        set_request_to_context(request=self.request)

        self.user = get_user_model().objects.create_user('test@test.com', 'test')
        self.premium_user = get_user_model().objects.create_user('premium@example.com', 'test',
                                                                 subscribed_until=timezone.now() +
                                                                                  datetime.timedelta(days=1))

        # Authentication
        application = Application.objects.create(client_type=Application.CLIENT_CONFIDENTIAL,
                                                 authorization_grant_type=Application.GRANT_PASSWORD)
        token = AccessToken.objects.create(user=self.user, token='1234567890',
                                           application=application,
                                           expires=timezone.now() + datetime.timedelta(days=1),
                                           scope='read write')
        self.author_token = token.token
        premium_token = AccessToken.objects.create(user=self.premium_user, token='9282728',
                                                   application=application,
                                                   expires=timezone.now() + datetime.timedelta(days=1),
                                                   scope='read write')
        self.premium_token = premium_token.token

        self.public_collection = Collection.objects.create(name='Test collection', created_by=self.user, approved=True)
        self.premium_collection = Collection.objects.create(name='Other collection', created_by=self.user, premium=True,
                                                            approved=True)

        self.public_photo = Photo.objects.create(uploaded_by=self.user, collection=self.public_collection,
                                                 approved=True)
        self.extra_public_photo = Photo.objects.create(uploaded_by=self.user, collection=self.public_collection,
                                                       extra=True, approved=True)
        self.premium_photo = Photo.objects.create(uploaded_by=self.user, collection=self.premium_collection)
        self.extra_premium_photo = Photo.objects.create(uploaded_by=self.user, collection=self.premium_collection,
                                                        extra=True, approved=True)

    # test get unsubscribed
    def test_get_public_collection_anonymous(self):
        response = self.client.get(reverse('collection', kwargs={'collection_id': self.public_collection.id}))
        content = parse_response(response.content)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(content['id'], self.public_collection.id)
        self.assertEqual(len(content['photos']), 1)  # No extra photos
        self.assertEqual(content['photos'][0]['id'], self.public_photo.id)

    def test_get_premium_collection(self):
        self.client.credentials(HTTP_AUTHORIZATION='Bearer ' + self.premium_token)

        response = self.client.get(reverse('collection', kwargs={'collection_id': self.premium_collection.id}))
        content = parse_response(response.content)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(content['id'], self.premium_collection.id)
        self.assertEqual(len(content['photos']), 1)  # No extra photos
        self.assertEqual(content['photos'][0]['id'], self.premium_photo.id)

    def test_get_premium_collection_anonymous(self):
        response = self.client.get(reverse('collection', kwargs={'collection_id': self.premium_collection.id}))
        content = parse_response(response.content)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertEqual('You are not authorized to view this collection.',
                         content['error']['description'])

    def test_get_premium_collection_subscribed(self):
        self.client.credentials(HTTP_AUTHORIZATION='Bearer ' + self.premium_token)
        Subscription.objects.create(photographer=self.user, subscriber=self.premium_user)

        response = self.client.get(reverse('collection', kwargs={'collection_id': self.premium_collection.id}))
        content = parse_response(response.content)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(content['id'], self.premium_collection.id)
        self.assertEqual(len(content['photos']), 2)  # With extra photos
        photo_ids = [photo['id'] for photo in content['photos']]
        self.assertTrue(self.premium_photo.id in photo_ids)
        self.assertTrue(self.extra_premium_photo.id in photo_ids)


class UnapprovedCollectionTests(APITestCase):
    def setUp(self):
        self.request = rf.post('/')
        set_request_to_context(request=self.request)

        self.author = get_user_model().objects.create_user('test@test.com', 'test')
        self.user = get_user_model().objects.create_user('test@example.com', 'test')

        # Authentication
        application = Application.objects.create(client_type=Application.CLIENT_CONFIDENTIAL,
                                                 authorization_grant_type=Application.GRANT_PASSWORD)
        token = AccessToken.objects.create(user=self.author, token='1234567890',
                                           application=application,
                                           expires=timezone.now() + datetime.timedelta(days=1),
                                           scope='read write')
        self.author_token = token.token
        user_token = AccessToken.objects.create(user=self.user, token='9282728',
                                                application=application,
                                                expires=timezone.now() + datetime.timedelta(days=1),
                                                scope='read write')
        self.user_token = user_token.token

        self.public_collection = Collection.objects.create(name='Test collection', created_by=self.author,
                                                           approved=False)
        self.approved_public_collection = Collection.objects.create(name='Test collection', created_by=self.author,
                                                                    approved=True)
        self.public_photo = Photo.objects.create(uploaded_by=self.author, collection=self.public_collection,
                                                 approved=False)
        self.approved_public_photo = Photo.objects.create(uploaded_by=self.author,
                                                          collection=self.approved_public_collection, approved=True)

    def test_get_unapproved_collection_not_creator(self):
        self.client.credentials(HTTP_AUTHORIZATION='Bearer ' + self.user_token)

        response = self.client.get(reverse('collection', kwargs={'collection_id': self.public_collection.id}))
        content = parse_response(response.content)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual('The collection could not be found.', content['error']['description'])

    def test_get_unapproved_collection_creator(self):
        self.client.credentials(HTTP_AUTHORIZATION='Bearer ' + self.author_token)

        response = self.client.get(reverse('collection', kwargs={'collection_id': self.public_collection.id}))
        content = parse_response(response.content)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # can get own unapproved collection
        self.assertEqual(content['id'], self.public_collection.id)
        self.assertEqual(len(content['photos']), 1)
        self.assertEqual(content['photos'][0]['id'], self.public_photo.id)

    def test_get_collections_not_creator(self):
        self.client.credentials(HTTP_AUTHORIZATION='Bearer ' + self.user_token)

        response = self.client.get(reverse('user-collections', kwargs={'user_id': self.author.id}))
        content = parse_response(response.content)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(content), 1)  # Can only view approved public collections
        self.assertEqual(content[0]['id'], self.approved_public_collection.id)
        self.assertEqual(content[0]['photo_count'], 1)

    def test_get_collections_creator(self):
        self.client.credentials(HTTP_AUTHORIZATION='Bearer ' + self.author_token)

        response = self.client.get(reverse('user-collections', kwargs={'user_id': self.author.id}))
        content = parse_response(response.content)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(content), 2)  # Can view all own collections
        collection_ids = [collection['id'] for collection in content]
        self.assertTrue(self.approved_public_collection.id in collection_ids)
        self.assertTrue(self.public_collection.id in collection_ids)


class UserCollectionsGetTests(APITestCase):
    def setUp(self):
        self.request = rf.post('/')
        set_request_to_context(request=self.request)

        self.author = get_user_model().objects.create_user('test@test.com', 'test')
        self.premium_user = get_user_model().objects.create_user('premium@example.com', 'test',
                                                                 subscribed_until=timezone.now() +
                                                                                  datetime.timedelta(days=1))

        # Authentication
        application = Application.objects.create(client_type=Application.CLIENT_CONFIDENTIAL,
                                                 authorization_grant_type=Application.GRANT_PASSWORD)
        token = AccessToken.objects.create(user=self.author, token='1234567890',
                                           application=application,
                                           expires=timezone.now() + datetime.timedelta(days=1),
                                           scope='read write')
        self.author_token = token.token
        premium_token = AccessToken.objects.create(user=self.premium_user, token='9282728',
                                                   application=application,
                                                   expires=timezone.now() + datetime.timedelta(days=1),
                                                   scope='read write')
        self.premium_token = premium_token.token

        self.public_collection = Collection.objects.create(name='Test collection', created_by=self.author,
                                                           approved=True)
        self.premium_collection = Collection.objects.create(name='Other collection', created_by=self.author,
                                                            premium=True, approved=True)

        self.public_photo = Photo.objects.create(uploaded_by=self.author, collection=self.public_collection,
                                                 path='test')
        self.featured_public_photo = Photo.objects.create(uploaded_by=self.author, collection=self.public_collection,
                                                          featured=True, path='test2')
        self.extra_public_photo = Photo.objects.create(uploaded_by=self.author, collection=self.public_collection,
                                                       extra=True)
        self.premium_photo = Photo.objects.create(uploaded_by=self.author, collection=self.premium_collection)
        self.featured_premium_photo = Photo.objects.create(uploaded_by=self.author, collection=self.premium_collection,
                                                           featured=True, path='test3')
        self.extra_premium_photo = Photo.objects.create(uploaded_by=self.author, collection=self.premium_collection,
                                                        extra=True)

    # test get unsubscribed
    def test_get_user_collections_anonymous(self):
        response = self.client.get(reverse('user-collections', kwargs={'user_id': self.author.id}))
        content = parse_response(response.content)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(content), 1)  # Can only view public collections
        self.assertEqual(content[0]['id'], self.public_collection.id)
        self.assertEqual(content[0]['photo_count'], 2)
        self.assertEqual(content[0]['extra_photo_count'], 0)
        self.assertEqual(len(content[0]['featured_photos']), 1)
        self.assertTrue(self.featured_public_photo.path in content[0]['featured_photos'][0])

    # test get premium
    def test_get_user_collections_as_premium_user(self):
        self.client.credentials(HTTP_AUTHORIZATION='Bearer ' + self.premium_token)

        response = self.client.get(reverse('user-collections', kwargs={'user_id': self.author.id}))
        content = parse_response(response.content)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(content), 2)  # can view all collections
        collection_ids = (collection['id'] for collection in content)
        self.assertTrue(self.public_collection.id in collection_ids)
        self.assertTrue(self.premium_collection.id in collection_ids)
        for collection in content:
            self.assertEqual(collection['photo_count'], 2)
            self.assertEqual(collection['extra_photo_count'], 0)
            self.assertEqual(len(collection['featured_photos']), 1)

    def test_get_user_collections_as_subscribed_user(self):
        self.client.credentials(HTTP_AUTHORIZATION='Bearer ' + self.premium_token)
        Subscription.objects.create(photographer=self.author, subscriber=self.premium_user)

        response = self.client.get(reverse('user-collections', kwargs={'user_id': self.author.id}))
        content = parse_response(response.content)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(content), 2)  # can view all collections
        collection_ids = (collection['id'] for collection in content)
        self.assertTrue(self.public_collection.id in collection_ids)
        self.assertTrue(self.premium_collection.id in collection_ids)
        for collection in content:
            self.assertEqual(collection['photo_count'], 3)  # Can see extra photos
            self.assertEqual(collection['extra_photo_count'], 1)
            self.assertEqual(len(collection['featured_photos']), 1)


pass
# TODO: update photo in collection and delete photo from collection tests
