from .base import *

FILENAME = os.path.splitext(os.path.basename(__file__))[0]
ENV_YML_FILE = './stockphotos/settings/' + FILENAME + '.yml'

stream = open(ENV_YML_FILE, 'r')
env = yaml.load(stream)
stream.close()

if 'debug' in env and 'DEBUG' in env['debug']:
    DEBUG = env['debug']['DEBUG']
    DEBUG_EMAIL = env['debug']['DEBUG_EMAIL']

# Secrets
SECRET_KEY = env['secrets']['SECRET_KEY']

# Database
DATABASES = {
    'default': {
        'ENGINE': env['database']['DB_ENGINE'],
        'NAME': env['database']['DB_NAME'],
        'USER': env['database']['DB_USER'],
        'PASSWORD': env['database']['DB_PASSWORD'],
        'HOST': env['database']['DB_HOST'],
        'PORT': env['database']['DB_PORT'],
    }
}

# Email
DEFAULT_EMAIL_FROM = DEBUG_EMAIL if DEBUG and DEBUG_EMAIL else env['email']['DEFAULT_EMAIL_FROM']
SERVER_EMAIL = env['email']['SERVER_EMAIL']
DEFAULT_EMAIL_BCC = '' if DEBUG else env['email']['DEFAULT_EMAIL_BCC']

EMAIL_HOST = env['email']['EMAIL_HOST']
EMAIL_PORT = env['email']['EMAIL_PORT']
EMAIL_HOST_USER = env['email']['EMAIL_HOST_USER']
EMAIL_HOST_PASSWORD = env['email']['EMAIL_HOST_PASSWORD']
EMAIL_USE_TLS = env['email']['EMAIL_USE_TLS']
EMAIL_USE_SSL = env['email']['EMAIL_USE_SSL']

# Facebook configuration
SOCIAL_AUTH_FACEBOOK_KEY = env['facebook']['SOCIAL_AUTH_FACEBOOK_KEY']
SOCIAL_AUTH_FACEBOOK_SECRET = env['facebook']['SOCIAL_AUTH_FACEBOOK_SECRET']

# Stripe
stripe.api_key = env['stripe']['API_KEY']
