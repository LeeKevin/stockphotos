from collections import namedtuple

import requests
from django.contrib.auth.models import BaseUserManager, AbstractBaseUser
from django.contrib.auth.models import PermissionsMixin
from django.db import models, transaction
from django.utils import timezone
from django.utils.translation import ugettext_lazy as _
from oauthlib.oauth2.rfc6749 import errors
from oauthlib.oauth2.rfc6749.endpoints.base import catch_errors_and_unavailability
from oauthlib.oauth2.rfc6749.endpoints.token import TokenEndpoint
from oauthlib.oauth2.rfc6749.grant_types.refresh_token import RefreshTokenGrant
from oauthlib.oauth2.rfc6749.tokens import BearerToken

from utils.models import TimeStamped, ModelMixin

PLAN = namedtuple('PLAN', 'free premium')._make(range(2))
PLAN_CHOICES = [(PLAN.free, _("None")), (PLAN.premium, _("Premium")), ]


class EmailUserManager(BaseUserManager):
    def _create_user(self, email, password, is_staff, is_superuser,
                     is_verified, **extra_fields):
        """
        Creates and saves a User with a given email and password.
        """
        now = timezone.now()
        if not email:
            raise ValueError('Users must have an email address')
        email = self.normalize_email(email)

        picture_data = extra_fields.pop('picture', None)
        model_fields = list(f.name for f in self.model._meta.get_fields())
        extra_user_fields = {field: value for field, value in extra_fields.items() if field in model_fields}

        with transaction.atomic():
            # create local user
            user = self.model(
                email=email,
                is_staff=is_staff, is_active=True,
                is_superuser=is_superuser, is_verified=is_verified,
                last_login=now, date_joined=now, **extra_user_fields,
            )
            user.set_password(password)
            user.save(using=self._db)

            # Upload profile photo
            if picture_data and picture_data.get('data', {}).get('url'):
                try:
                    url_content = requests.get(picture_data['data']['url']).content
                    if url_content:
                        from photos.models import Photo
                        picture = Photo.objects.create(
                            uploaded_by=user, is_profile=True,
                            width=picture_data['data'].get('width'),
                            height=picture_data['data'].get('height')
                        )
                        picture = picture.upload(url_content)
                        user.picture = picture
                        user.save(using=self._db)
                except:
                    pass

        return user

    def create_user(self, email, password=None, **extra_fields):
        return self._create_user(email, password, False, False, False, **extra_fields)

    def create_superuser(self, email, password, **extra_fields):
        return self._create_user(email, password, True, True, True, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    first_name = models.CharField(_('first name'), max_length=30, blank=True)
    last_name = models.CharField(_('last name'), max_length=30, blank=True)
    email = models.EmailField(_('email address'), max_length=255, unique=True, db_index=True)
    is_staff = models.BooleanField(_('staff status'), default=False,
                                   help_text=_('Designates whether the user can log into this admin '
                                               'site.'))
    is_active = models.BooleanField(_('active'), default=True,
                                    help_text=_('Designates whether this user should be treated as '
                                                'active. Unselect this instead of deleting accounts.'))
    date_joined = models.DateTimeField(_('date joined'), default=timezone.now)

    is_verified = models.BooleanField(_('verified'), default=False,
                                      help_text=_('Designates whether this user has completed the '
                                                  'email verification process to allow login.'))

    has_valid_payment = models.NullBooleanField(
        _('has valid payment'), blank=True, null=True,
        help_text=_('Designates whether this user has a payment method in good standing.'))
    picture = models.ForeignKey('photos.Photo', blank=True, null=True, help_text=_('The profile photo for this user.'))

    customer_id = models.CharField(_('customer id'), max_length=255, unique=True, db_index=True, blank=True, null=True)

    subscription = models.OneToOneField('accounts.Subscription', blank=True, null=True)
    photographer = models.OneToOneField('accounts.Photographer', blank=True, null=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['last_name', 'first_name']

    objects = EmailUserManager()

    def __str__(self):
        return self.get_full_name()

    class Meta:
        verbose_name = _('user')
        verbose_name_plural = _('users')
        ordering = ['last_name', 'first_name']

    def get_full_name(self):
        """
        Returns the first_name plus the last_name, with a space in between.
        """
        full_name = '%s %s' % (self.first_name, self.last_name)
        return full_name.strip()

    def get_short_name(self):
        """
        Returns the short name for the user.
        """
        return self.first_name

    def is_subscribed(self, plan):
        return self.subscription and self.subscription.plan == plan and \
               self.subscription.subscribed_until >= timezone.now().date()


USER_FIELDS = ['email']


# Social pipeline method
def create_user(strategy, details, user=None, *args, **kwargs):
    if user:
        return {'is_new': False}

    fields = dict((name, kwargs.get(name, details.get(name, kwargs.get('response', {}).get(name))))
                  for name in strategy.setting('USER_FIELDS', USER_FIELDS))
    if not fields:
        return

    return {
        'is_new': True,
        'user': strategy.create_user(**fields)
    }


class UserTokenGrant(RefreshTokenGrant):
    def validate_token_request(self, request):
        # This method's code is based on the parent method's code
        # We removed the original comments to replace with ours
        # explaining our modifications.

        # request._params.setdefault("client_secret", None)

        if request.grant_type != 'convert_user':
            raise errors.UnsupportedGrantTypeError(request=request)

        if not request.client_id:
            raise errors.MissingClientIdError(request=request)

        if not self.request_validator.validate_client_id(request.client_id, request):
            raise errors.InvalidClientIdError(request=request)

        # Existing code to retrieve the application instance from the client id
        if self.request_validator.client_authentication_required(request):
            if not self.request_validator.authenticate_client(request):
                raise errors.InvalidClientError(request=request)
        elif not self.request_validator.authenticate_client_id(request.client_id, request):
            raise errors.InvalidClientError(request=request)

        # Ensure client is authorized use of this grant type
        # We chose refresh_token as a grant_type
        # as we don't want to modify all the codebase.
        # It is also the most permissive and logical grant for our needs.
        request.grant_type = "refresh_token"
        self.validate_grant_type(request)

        self.validate_scopes(request)

        if not request.user:
            raise errors.InvalidGrantError('Invalid credentials given.', request=request)


class UserTokenServer(TokenEndpoint):
    """An endpoint used only for token generation."""

    def __init__(self, request_validator, token_generator=None,
                 token_expires_in=None, refresh_token_generator=None, **kwargs):
        """Construct a client credentials grant server.
        :param request_validator: An implementation of
                                  oauthlib.oauth2.RequestValidator.
        :param token_expires_in: An int or a function to generate a token
                                 expiration offset (in seconds) given a
                                 oauthlib.common.Request object.
        :param token_generator: A function to generate a token from a request.
        :param refresh_token_generator: A function to generate a token from a
                                        request for the refresh token.
        :param kwargs: Extra parameters to pass to authorization-,
                       token-, resource-, and revocation-endpoint constructors.
        """
        refresh_grant = UserTokenGrant(request_validator)
        bearer = BearerToken(request_validator, token_generator,
                             token_expires_in, refresh_token_generator)
        TokenEndpoint.__init__(self, default_grant_type='convert_user',
                               grant_types={
                                   'convert_user': refresh_grant,
                               },
                               default_token_type=bearer)

    # We override this method just so we can pass the django request object
    @catch_errors_and_unavailability
    def create_token_response(self, uri, http_method='GET', body=None,
                              headers=None, credentials=None):
        """Extract grant_type and route to the designated handler."""
        request = headers.pop("Django-request-object", None)
        grant_type_handler = self.grant_types.get(request.grant_type,
                                                  self.default_grant_type_handler)
        request.client = None
        request.headers = request.META
        request.scope = None
        request.scopes = None
        request.state = None
        request.extra_credentials = None
        if not hasattr(request, 'refresh_token'):
            request.refresh_token = None
        return grant_type_handler.create_token_response(request, self.default_token_type)


class Subscription(TimeStamped):
    plan = models.PositiveSmallIntegerField(_("plan"), choices=PLAN_CHOICES, default=0)
    subscription_id = models.CharField(_("subscription_id"), blank=True, null=True, max_length=100)
    subscribed_until = models.DateField(
        _('subscribed until'), blank=True, null=True,
        help_text='Designates the period for which this subscription is valid.')
    will_renew = models.BooleanField(_('will auto renew'), default=False,
                                     help_text=_('Designates whether this subscription will renew at the end of the '
                                                 'subscription period.'))
    photographer_status = models.BooleanField(default=False,
                                              help_text=_('Designates whether this subscription was granted because '
                                                          'of special photographer status.'))

    class Meta:
        verbose_name = _('subscription')
        verbose_name_plural = _('subscriptions')
        ordering = ['-created_at']

    def __str__(self):
        return 'New Subscription'


class Photographer(ModelMixin, TimeStamped):
    approved = models.BooleanField(default=False)

    handle = models.CharField(max_length=100, help_text=_('The username for this photographer.'))

    # bio information
    location = models.CharField(max_length=100, blank=True, null=True)
    website = models.CharField(max_length=150, blank=True, null=True)
    instagram = models.CharField(max_length=100, blank=True, null=True)
    twitter = models.CharField(max_length=100, blank=True, null=True)

    followers = models.ManyToManyField('accounts.User', blank=True, through='accounts.Follower',
                                       related_name='following')

    # pay out information settings here eventually


class Follower(ModelMixin, TimeStamped):
    user = models.ForeignKey('accounts.User')
    photographer = models.ForeignKey('accounts.Photographer')
