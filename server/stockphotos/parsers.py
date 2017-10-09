from rest_framework.parsers import BaseParser


class RawParser(BaseParser):
    media_type = '*/*'

    def parse(self, stream, media_type=None, parser_context=None):
        return stream.body
