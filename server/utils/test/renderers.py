import json

from django.utils import six
from rest_framework import renderers
from rest_framework.compat import (
    LONG_SEPARATORS
)


class RawRenderer(renderers.BaseRenderer):
    charset = None
    format = 'raw'
    media_type = 'application/octet-stream'
    charset = None

    @staticmethod
    def render(data, *args, **kwargs):
        if data is None or not isinstance(data, bytes):
            return bytes()

        return data


class DummyJSONRenderer(renderers.BaseRenderer):
    @staticmethod
    def render(data, *args, **kwargs):
        if data is None:
            return bytes()

        separators = LONG_SEPARATORS

        ret = json.dumps(
            data, separators=separators
        )

        # On python 2.x json.dumps() returns bytestrings if ensure_ascii=True,
        # but if ensure_ascii=False, the return type is underspecified,
        # and may (or may not) be unicode.
        # On python 3.x json.dumps() returns unicode strings.
        if isinstance(ret, six.text_type):
            # We always fully escape \u2028 and \u2029 to ensure we output JSON
            # that is a strict javascript subset. If bytes were returned
            # by json.dumps() then we don't have these characters in any case.
            # See: http://timelessrepo.com/json-isnt-a-javascript-subset
            ret = ret.replace('\u2028', '\\u2028').replace('\u2029', '\\u2029')
            return bytes(ret.encode('utf-8'))
        return ret
