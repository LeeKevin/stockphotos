import mimetypes
import os
import posixpath
import stat
from importlib import import_module

import yaml
from django.conf import settings
from django.conf.urls import include, url
from django.conf.urls.static import static
from django.contrib import admin
from django.http import (
    FileResponse, Http404, HttpResponseNotModified,
    HttpResponseRedirect,
)
from django.utils.http import http_date
from django.utils.six.moves.urllib.parse import unquote
from django.utils.translation import ugettext as _
from django.views.static import was_modified_since

admin.site.site_header = 'Stockphotos administration'
APP_YML_FILE = './stockphotos/apps.yml'
stream = open(APP_YML_FILE, 'r')
apps = yaml.load(stream)
stream.close()

urlpatterns = [
    url(r'^$', lambda x: HttpResponseRedirect('admin/')),
    url(r'^admin/', include(admin.site.urls), name='admin'),
    url(r'^api/auth/', include('rest_framework_social_oauth2.urls')),
    url(r'^api', include('photos.urls')),
    url(r'^api', include('accounts.urls')),
]

if apps.get('apps'):
    for app in apps['apps']:
        try:
            if not os.path.isfile('%s/urls.py' % app):  # Skip if module doesn't have urls.py'
                continue

            _module = import_module('%s.urls' % app)
        except:
            if settings.DEBUG:
                raise
            else:
                continue
        else:
            urlpatterns += [url(r'^api/%s' % app, include('%s.urls' % app))]


def serve_with_indexes(request, path, document_root=None, show_indexes=False):
    """
    Modified version of django.views.static.serve, except that index.html is returned for directories
    """
    path = posixpath.normpath(unquote(path))
    path = path.lstrip('/')
    newpath = ''
    for part in path.split('/'):
        if not part:
            # Strip empty path components.
            continue
        drive, part = os.path.splitdrive(part)
        head, part = os.path.split(part)
        if part in (os.curdir, os.pardir):
            # Strip '.' and '..' in path.
            continue
        newpath = os.path.join(newpath, part).replace('\\', '/')
    if newpath and path != newpath:
        return HttpResponseRedirect(newpath)
    fullpath = os.path.join(document_root, newpath)
    if os.path.isdir(fullpath):
        fullpath += '/index.html'
    if not os.path.exists(fullpath):
        raise Http404(_('"%(path)s" does not exist') % {'path': fullpath})
    # Respect the If-Modified-Since header.
    statobj = os.stat(fullpath)
    if not was_modified_since(request.META.get('HTTP_IF_MODIFIED_SINCE'),
                              statobj.st_mtime, statobj.st_size):
        return HttpResponseNotModified()
    content_type, encoding = mimetypes.guess_type(fullpath)
    content_type = content_type or 'application/octet-stream'
    response = FileResponse(open(fullpath, 'rb'), content_type=content_type)
    response["Last-Modified"] = http_date(statobj.st_mtime)
    if stat.S_ISREG(statobj.st_mode):
        response["Content-Length"] = statobj.st_size
    if encoding:
        response["Content-Encoding"] = encoding
    return response


if settings.DEBUG is True:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    handler404 = 'stockphotos.errors.handle_404'
