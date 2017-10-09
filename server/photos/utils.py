import mimetypes
import os
import re

from django.conf import settings


def save_photo(save_path, content):
    # save a photo to relative path within media
    save_path = re.sub(r"^(.*?:\/\/(?:[\w_-]+\.[\w_-]+\/)?)?(media)?(\/)?", "", save_path, flags=re.IGNORECASE)
    abs_path = os.path.join(os.path.dirname(settings.BASE_DIR), 'media', save_path)
    dirname = os.path.dirname(abs_path)
    if not os.path.exists(dirname):
        os.makedirs(dirname, exist_ok=True)

    with open(abs_path, 'wb') as f:
        f.write(content)
        f.flush()

    return os.path.relpath(abs_path, os.path.dirname(settings.BASE_DIR))


def guess_extension(mime):
    if mime == 'image/jpeg':
        return '.jpg'
    else:
        return mimetypes.guess_extension(mime)
