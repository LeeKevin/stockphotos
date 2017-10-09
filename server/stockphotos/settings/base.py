"""
Django settings for stockphotos project.

"""

import os
import sys

import stripe
import yaml

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SECRET_KEY = 'u8w9%y&*-_l^idf=wl&wrhgzx-g=&6dn9ulutn@2x+7wz%2dzd'
DEBUG = True

CORS_ORIGIN_ALLOW_ALL = True
ALLOWED_HOSTS = ['*']

AUTH_USER_MODEL = 'accounts.User'
ROOT_URLCONF = 'stockphotos.urls'

DATA_UPLOAD_MAX_MEMORY_SIZE = 105906176

AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]

APP_YML_FILE = './stockphotos/apps.yml'
stream = open(APP_YML_FILE, 'r')
apps = yaml.load(stream)
stream.close()
other_apps = apps.get('apps', ())
INSTALLED_APPS = tuple(
    (
        'method_override',
        'django.contrib.admin',
        'django.contrib.auth',
        'django.contrib.contenttypes',
        'django.contrib.sessions',
        'django.contrib.sites',
        'django.contrib.messages',
        'django.contrib.staticfiles',
        'corsheaders',
        'rest_framework',
        'dbbackup',
        'crequest',
        'oauth2_provider',
        'social.apps.django_app.default',
        'rest_framework_social_oauth2',
        'post_office',
        'accounts',
        'photos',
    ) + (tuple(other_apps) if other_apps else ()))

APPEND_SLASH = True
AUTH_EMAIL_VERIFICATION = False
REST_FRAMEWORK = {
    'DEFAULT_FILTER_BACKENDS': ('rest_framework.filters.DjangoFilterBackend',),
    'DEFAULT_PERMISSION_CLASSES': ('rest_framework.permissions.AllowAny',),
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'oauth2_provider.ext.rest_framework.OAuth2Authentication',
        'rest_framework_social_oauth2.authentication.SocialAuthentication',
    ),
    'PAGE_SIZE': 1000,
    'EXCEPTION_HANDLER': 'stockphotos.errors.exception_handler',
    'TEST_REQUEST_RENDERER_CLASSES': (
        'rest_framework.renderers.MultiPartRenderer',
        'rest_framework.renderers.JSONRenderer',
        'utils.test.renderers.RawRenderer',
    ),
    'DEFAULT_PARSER_CLASSES': (
        'rest_framework.parsers.JSONParser',
        'rest_framework.parsers.FormParser',
        'rest_framework.parsers.MultiPartParser',
        'stockphotos.parsers.RawParser',
    )
}

AUTHENTICATION_BACKENDS = (
    'social.backends.facebook.FacebookAppOAuth2',
    'social.backends.facebook.FacebookOAuth2',
    'rest_framework_social_oauth2.backends.DjangoOAuth2',
    'django.contrib.auth.backends.ModelBackend',
)

DBBACKUP_STORAGE = 'dbbackup.storage.filesystem_storage'
DBBACKUP_STORAGE_OPTIONS = {'location': 'backups'}
DBBACKUP_MEDIA_FILENAME_TEMPLATE = 'media-{servername}-{datetime}.{extension}'
DBBACKUP_CLEANUP_KEEP = 30  # Days
DBBACKUP_CLEANUP_KEEP_MEDIA = 30  # Days

# Middleware
MIDDLEWARE_CLASSES = (
    'django.middleware.security.SecurityMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    'method_override.middleware.MethodOverrideMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',  # Required for Django Admin
    'django.middleware.common.CommonMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',  # Required for Django Admin
    'django.contrib.auth.middleware.SessionAuthenticationMiddleware',  # Required for Django Admin
    'django.contrib.messages.middleware.MessageMiddleware',  # Required for Django Admin
    'stockphotos.middleware.ExceptionHandlerMiddleware',
    'crequest.middleware.CrequestMiddleware',
    'stockphotos.middleware.GlobalRequestMiddleware',
)

TEMPLATES = (
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': (os.path.join(BASE_DIR, 'templates')),
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
                'social.apps.django_app.context_processors.backends',
                'social.apps.django_app.context_processors.login_redirect',
            ],
        },
    },
)

WSGI_APPLICATION = 'stockphotos.wsgi.application'
DATABASES = {}

SOCIAL_AUTH_FACEBOOK_SCOPE = ['email']
SOCIAL_AUTH_FACEBOOK_PROFILE_EXTRA_PARAMS = {
    'fields': 'id, name, email, picture.width(300),first_name,last_name',
}
SOCIAL_AUTH_PIPELINE = (
    # Get the information we can about the user and return it in a simple
    # format to create the user instance later. On some cases the details are
    # already part of the auth response from the provider, but sometimes this
    # could hit a provider API.
    'social.pipeline.social_auth.social_details',

    # Get the social uid from whichever service we're authing thru. The uid is
    # the unique identifier of the given user in the provider.
    'social.pipeline.social_auth.social_uid',

    # Verifies that the current auth process is valid within the current
    # project, this is where emails and domains whitelists are applied (if
    # defined).
    'social.pipeline.social_auth.auth_allowed',

    # Checks if the current social-account is already associated in the site.
    'social.pipeline.social_auth.social_user',

    # Associates the current social details with another user account with
    # a similar email address. Disabled by default.
    # 'social_core.pipeline.social_auth.associate_by_email',

    # Create a user account if we haven't found one yet.
    'accounts.models.create_user',

    # Create the record that associates the social account with the user.
    'social.pipeline.social_auth.associate_user',

    # Populate the extra_data field in the social record with the values
    # specified by settings (and the default ones like access_token, etc).
    'social.pipeline.social_auth.load_extra_data',

    # Update the user record with any changed info from the auth service.
    'social.pipeline.user.user_details',
)

USER_FIELDS = ['email', 'picture']

OAUTH2_PROVIDER = {
    'ACCESS_TOKEN_EXPIRE_SECONDS': 60 * 60 * 24 * 365 * 10  # 10 years
}

# Internationalization
# https://docs.djangoproject.com/en/1.10/topics/i18n/
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_L10N = True
USE_TZ = True

# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/1.10/howto/static-files/

STATIC_URL = '/static/'
STATIC_ROOT = os.path.join(os.path.dirname(BASE_DIR), "stockphotos/static/")

# Media files
MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join(os.path.dirname(BASE_DIR), "media/")

# Email
EMAIL_BACKEND = 'post_office.EmailBackend'
DEFAULT_EMAIL_FROM = ''
SERVER_EMAIL = ''
DEFAULT_EMAIL_BCC = ''

EMAIL_HOST = ''
EMAIL_PORT = ''
EMAIL_HOST_USER = ''
EMAIL_HOST_PASSWORD = ''
EMAIL_USE_TLS = ''
EMAIL_USE_SSL = ''

SILENCED_SYSTEM_CHECKS = (
    "urls.W002"  # We want to suppress url checks for beginning slash
)

stripe.api_key = ''

# Testing
TESTING = len(sys.argv) > 1 and sys.argv[1] == 'test'
if TESTING:
    print('In test mode... Disabling migrations \n')


    class DisableMigrations(object):
        def __contains__(self, item):
            return True

        def __getitem__(self, item):
            return "notmigrations"


    DEBUG = False
    MIGRATION_MODULES = DisableMigrations()
