import json
import traceback

from django.conf import settings
from django.http import HttpResponse
from rest_framework import status as statuses
from rest_framework.compat import set_rollback
from rest_framework.exceptions import APIException, NotAuthenticated


def handle_404(request, exception):
    return NotFoundError().build_response()


def exception_handler(exc, context=None):
    """
    Returns the response that should be used for any given exception.

    Any unhandled exceptions may return `None`, which will cause a 500 error
    to be raised.
    """
    headers = {}
    if getattr(exc, 'auth_header', None):
        headers['WWW-Authenticate'] = exc.auth_header
    if getattr(exc, 'wait', None):
        headers['Retry-After'] = '%d' % exc.wait
    set_rollback()
    traceback.print_exc()
    if isinstance(exc, NotAuthenticated):
        return NoAuthenticationError().build_response(headers=headers)
    elif isinstance(exc, GenericAPIException):
        return exc.build_response(headers=headers)
    elif isinstance(exc, APIException):
        return GenericAPIException.build_from_exception(exc).build_response(headers=headers)
    elif settings.DEBUG:
        return None
    else:
        return GenericAPIException(name=type(exc).__name__, status=statuses.HTTP_500_INTERNAL_SERVER_ERROR,
                                   message="There was an issue with the server").build_response(headers=headers)


class GenericAPIException(APIException):
    name = 'System Error'
    status = statuses.HTTP_500_INTERNAL_SERVER_ERROR
    message = 'There was an error processing your request.'
    errors = {}

    @classmethod
    def build_from_exception(cls, exception: Exception):
        name = exception.name if hasattr(exception, 'name') else type(exception).__name__
        message = exception.message if hasattr(exception, 'message') else (
            exception.detail if hasattr(exception, 'detail') else None
        )
        status = exception.status if hasattr(exception, 'status') else (
            exception.status_code if hasattr(exception, 'status_code') else None
        )
        return cls(name=name,
                   message=message,
                   status=status,
                   errors=(exception.errors if hasattr(exception, 'errors') else None),
                   )

    def build_response(self, headers: dict = {}):
        response = HttpResponse(
            content_type="application/json",
            status=self.status,
            content=json.dumps({'errors': self.errors} if self.errors else {
                'error': {
                    'type': self.name,
                    'description': self.message
                }
            }))

        for header, value in headers.items():
            response[header] = value

        return response

    def __init__(self, message=None, name=None, status=None, errors=None):
        if name:
            self.name = name
        if status:
            self.status = status
        if message:
            self.message = message
        if errors:
            self.errors = errors
        self.status_code = status


class NoAuthenticationError(GenericAPIException):
    def __init__(self, message=None):
        super(NoAuthenticationError, self).__init__(
            name='Invalid Client',
            status=statuses.HTTP_401_UNAUTHORIZED,
            message=(message if message else 'You must supply valid credentials.')
        )


class InvalidCredentialsError(GenericAPIException):
    def __init__(self, message=None):
        super(InvalidCredentialsError, self).__init__(
            name='Invalid Client',
            status=statuses.HTTP_401_UNAUTHORIZED,
            message=(message if message else 'The supplied credentials are invalid.')
        )


class NotFoundError(GenericAPIException):
    def __init__(self, message=None):
        super(NotFoundError, self).__init__(
            name='Not Found',
            status=statuses.HTTP_404_NOT_FOUND,
            message=(message if message else 'The requested page could not be found.')
        )


class BadRequestError(GenericAPIException):
    name = 'Bad Request'
    status = statuses.HTTP_400_BAD_REQUEST
