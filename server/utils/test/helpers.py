import base64
import json

from rest_framework.test import APIRequestFactory
from stockphotos.middleware import GlobalRequestMiddleware
from .renderers import DummyJSONRenderer

rf = APIRequestFactory()


def build_basic_authorization(username, password):
    return 'Basic ' + base64.b64encode((username + ':' + password).encode()).decode()


def parse_response(res: bytes):
    j = res.decode()
    if not j:
        return None
    return json.loads(j)


def prepare_response(response):
    response.accepted_renderer = DummyJSONRenderer
    response.accepted_media_type = "application/json"
    response.renderer_context = {'response': {}}
    response.render()


def set_request_to_context(request):
    GlobalRequestMiddleware().process_request(request)
