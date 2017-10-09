import _thread
import traceback

from django.conf import settings

from stockphotos.errors import exception_handler


class GlobalRequestMiddleware(object):
    _threadmap = {}

    @classmethod
    def get_current_request(cls):
        return cls._threadmap[_thread.get_ident()]

    def process_request(self, request):
        self._threadmap[_thread.get_ident()] = request

    def process_exception(self, request, exception):
        try:
            del self._threadmap[_thread.get_ident()]
        except KeyError:
            pass

    def process_response(self, request, response):
        try:
            del self._threadmap[_thread.get_ident()]
        except KeyError:
            pass
        return response


class ExceptionHandlerMiddleware(object):
    @staticmethod
    def process_exception(request, exception):
        # skip middleware if this is an admin request (i.e. not API)
        if '/admin' in request.path:
            return None
        if hasattr(settings, 'DEBUG') and settings.DEBUG:
            traceback.print_exc()

        return exception_handler(exception, {
            'request': request
        })
