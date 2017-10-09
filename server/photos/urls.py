from django.conf.urls import url

from .views import PhotoUpload, Feed

urlpatterns = [
    url(r'^/photos/upload/?$', PhotoUpload.as_view(), name='photo-upload'),
    # url(r'^/collections/(?P<collection_id>[0-9]+)/?$', CollectionView.as_view(), name='collection'),
    # url(r'^/collections/(?P<collection_id>[0-9]+)/photos/?$', CollectionPhotosView.as_view(), name='collection-photos'),
    # url(r'^/collections/(?P<collection_id>[0-9]+)/photos/(?P<photo_id>[0-9]+)/?$', CollectionPhotoView.as_view(),
    #     name='collection-photo'),
    # url(r'^/accounts/me/collections/?$', MyCollectionsView.as_view(), name='my-collections'),
    # url(r'^/accounts/(?P<user_id>[0-9]+)/collections/?$', UserCollectionsView.as_view(), name='user-collections'),
    url(r'^/feed/?$', Feed.as_view(), name='feed'),
]
