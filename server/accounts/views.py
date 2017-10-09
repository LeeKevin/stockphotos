import io
import json
import re
from datetime import timedelta

import stripe
from PIL import Image
from django.contrib.auth import get_user_model
from django.core.urlresolvers import reverse
from django.db import transaction
from django.utils import timezone
from oauth2_provider.settings import oauth2_settings
from oauth2_provider.views.mixins import OAuthLibMixin
from oauthlib.oauth2.rfc6749 import errors
from rest_framework import permissions, views
from rest_framework import status
from rest_framework.response import Response
from rest_framework_social_oauth2.oauth2_backends import KeepRequestCore
from social.apps.django_app.utils import load_backend, load_strategy
from social.apps.django_app.views import NAMESPACE
from social.exceptions import MissingBackend
from social.utils import requests

from photos.models import Photo
from photos.serializers import PhotoBriefSerializer
from photos.views import photo_upload_validation
from stockphotos.errors import BadRequestError
from utils.functions import add_months
from .models import UserTokenServer, PLAN, Subscription
from .serializers import UserSerializer


class MeView(views.APIView):
    permission_classes = (permissions.IsAuthenticated,)

    @staticmethod
    def get(request):
        return Response(UserSerializer(request.user).data)

    @staticmethod
    def put(request):
        data = request.data

        email = data.get('email')
        if email:
            if not isinstance(email, str) or not re.match(r'^.+@.+\..+$', email):
                raise BadRequestError(message="Please provide a valid email address.")

            if get_user_model().objects.filter(email=email).exclude(id=request.user.id).exists():
                raise BadRequestError(message="Email taken.")

            request.user.email = email

        first_name = data.get('first_name')
        if first_name:
            request.user.first_name = first_name

        last_name = data.get('last_name')
        if last_name:
            request.user.last_name = last_name

        password = data.get('password')
        if password:
            if not isinstance(password, str) or len(password) < 6:
                raise BadRequestError(message="Password must be at least 6 characters.")
            request.user.set_password(password)

        request.user.save()

        return Response(UserSerializer(request.user).data)


class ProfilePhotoView(views.APIView):
    @staticmethod
    def post(request):
        with transaction.atomic():
            photo_upload_validation(request)

            b = io.BytesIO(request.data)
            with Image.open(b) as im:
                width, height = im.size
            photo = Photo.objects.create(uploaded_by=request.user, is_profile=True,
                                         width=width,
                                         height=height)
            photo = photo.upload(request.body)
            if photo.id != request.user.picture_id:
                request.user.picture = photo
                request.user.save()

        return Response(PhotoBriefSerializer(photo).data, status=status.HTTP_200_OK)


class CheckEmail(views.APIView):
    @staticmethod
    def post(request):
        email = request.data.get('email')
        if not email:
            raise BadRequestError(message="You must provide an email address.")

        check = get_user_model().objects.filter(email__iexact=email)
        if request.auth:
            check = check.exclude(id=request.user.id)

        return Response(not check.exists())


class SignUpView(OAuthLibMixin, views.APIView):
    oauthlib_backend_class = KeepRequestCore
    validator_class = oauth2_settings.OAUTH2_VALIDATOR_CLASS
    server_class = UserTokenServer

    def post(self, request):
        data = request.data

        request.client_id = data.get('client_id')
        request.grant_type = 'convert_user'

        with transaction.atomic():
            if 'backend' in data and 'token' in data:
                backend = data.get('backend')
                token = data.get('token')
                strategy = load_strategy(request=request._request)

                try:
                    backend = load_backend(strategy, backend, reverse(NAMESPACE + ":complete", args=(backend,)))
                except MissingBackend:
                    raise errors.InvalidRequestError(
                        description='Invalid backend parameter.',
                        request=request)

                try:
                    user = backend.do_auth(access_token=token)
                except requests.HTTPError as e:
                    raise errors.InvalidRequestError(
                        description="Backend responded with HTTP{0}: {1}.".format(e.response.status_code,
                                                                                  e.response.text),
                        request=request)
            elif 'email' in data and 'password' in data:
                email = data.get('email')
                password = data.get('password')
                first_name = data.get('first_name')
                last_name = data.get('last_name')

                if not first_name or not isinstance(first_name, str):
                    raise BadRequestError(message="Missing signup first name.")
                if not last_name or not isinstance(last_name, str):
                    raise BadRequestError(message="Missing signup last name.")

                if not email or not isinstance(email, str) or not re.match(r'^.+@.+\..+$', email):
                    raise BadRequestError(message="Please provide a valid email address.")

                if not password or not isinstance(password, str) or len(password) < 6:
                    raise BadRequestError(message="Password must be at least 6 characters.")

                if get_user_model().objects.filter(email=email).count():
                    raise BadRequestError(message="Email taken.")

                user = get_user_model().objects.create_user(email, password=password, first_name=first_name,
                                                            last_name=last_name)
            else:
                raise BadRequestError(message="Missing signup parameters.")

            try:
                if not user.customer_id:  # If not already a stripe customer
                    customer = stripe.Customer.create(
                        email=user.email,
                        source=str(data['stripe_token']),
                    )

                    user.customer_id = customer.id
                    try:
                        subscription = stripe.Subscription.create(
                            customer=user.customer_id,
                            plan="basic-premium",
                        )

                        subscribed_until = timezone.now() + timedelta(days=3)  # 3-day grace period

                        if user.subscription:
                            user.subscription.plan = PLAN.premium
                            user.subscription.will_renew = True
                            user.subscription.subscription_id = subscription.id
                            user.subscription.subscribed_until = subscribed_until
                            user.subscription.save()
                        else:
                            user.subscription = Subscription.objects.create(
                                plan=PLAN.premium,
                                subscribed_until=subscribed_until,
                                will_renew=True,
                                subscription_id=subscription.id
                            )

                        user.has_valid_payment = True
                    except stripe.error.CardError:
                        pass
                user.save()
            except (ValueError, TypeError):
                pass

            request.user = user
            url, headers, body, status = self.create_token_response(request)
            response = Response(data=json.loads(body), status=status)

            for k, v in headers.items():
                response[k] = v
            return response


class UpdateSubscriptionView(views.APIView):
    permission_classes = (permissions.IsAuthenticated,)

    @staticmethod
    def post(request):
        data = request.data

        plan = data.get('plan')

        user = request.user

        if plan is None:
            raise BadRequestError(message="You must provide a plan to assign to the user.")
        try:
            plan = int(plan)
            if plan not in PLAN:
                raise ValueError()
        except (ValueError, TypeError):
            raise BadRequestError(message="You must provide a valid plan.")

        customer = None
        if not user.customer_id:
            try:
                customer = stripe.Customer.create(
                    email=user.email,
                    source=str(data['stripe_token']),
                )
                user.customer_id = customer.id
            except KeyError:
                raise BadRequestError(message="This user doesn't have a customer id. You must provide a stripe token "
                                              "in order for this user to complete a subscription.")

        with transaction.atomic():
            try:
                if plan == PLAN.premium:
                    if not user.is_subscribed(PLAN.premium):
                        # do upgrade
                        subscribed_until = (timezone.now() + timedelta(days=3)).date()
                        if user.subscription and user.subscription.subscription_id:
                            subscription = stripe.Subscription.retrieve(user.subscription.subscription_id)
                            subscription.plan = "basic-premium"
                            subscription.save()
                        else:
                            subscription = stripe.Subscription.create(
                                customer=user.customer_id,
                                plan="basic-premium",
                            )

                        if user.subscription:
                            user.subscription.plan = PLAN.premium
                            user.subscription.will_renew = True
                            user.subscription.subscription_id = subscription.id
                            user.subscription.subscribed_until = subscribed_until
                            user.subscription.save()
                        else:
                            user.subscription = Subscription.objects.create(
                                plan=PLAN.premium,
                                subscribed_until=subscribed_until,
                                will_renew=True,
                                subscription_id=subscription.id
                            )
                        user.has_valid_payment = True
                    elif not user.subscription.will_renew:
                            # try to renew subscription
                            subscription = stripe.Subscription.retrieve(user.subscription.subscription_id)
                            subscription.plan = "basic-premium"
                            subscription.save()
                            user.subscription.will_renew = True
                            user.subscription.save()
                elif plan == PLAN.free and user.is_subscribed(PLAN.premium):
                    # do downgrade/cancellation
                    plan = stripe.Subscription.retrieve(user.subscription)
                    plan.delete(at_period_end=True)
                    user.subscription.will_renew = False
                    user.subscription.save()
            except:
                # If created a customer before an error occurs, delete from Stripe
                if customer:
                    customer.delete()

        user.save()

        return Response(UserSerializer(user).data)


class UpdateBillingView(views.APIView):
    permission_classes = (permissions.IsAuthenticated,)

    @staticmethod
    def post(request):
        data = request.data


class InvoicesView(views.APIView):
    permission_classes = (permissions.IsAuthenticated,)

    @staticmethod
    def get(request):
        customer_id = request.user.customer_id
        if not customer_id:
            return Response([])

        return Response(stripe.Invoice.list(customer=customer_id)['data'])


class PaymentMethodView(views.APIView):
    permission_classes = (permissions.IsAuthenticated,)

    @staticmethod
    def get(request):
        customer_id = request.user.customer_id
        if not customer_id:
            return Response()

        source = stripe.Customer.retrieve(customer_id, expand=['default_source'])['default_source']

        return Response({
            'funding': source['funding'],
            'brand': source['brand'],
            'last4': source['last4']
        })

    @staticmethod
    def post(request):
        customer_id = request.user.customer_id
        token = request.data.get('stripe_token')

        if not token:
            raise BadRequestError(message="You must provide a stripe token.")

        with transaction.atomic():
            if not customer_id:
                customer = stripe.Customer.create(
                    email=request.user.email,
                    source=token,
                )

                request.user.customer_id = customer.id
                request.user.save()
            else:
                customer = stripe.Customer.retrieve(customer_id)
                customer.source = token
                customer.save()

        customer = stripe.Customer.retrieve(customer_id, expand=['default_source'])
        source = customer['default_source']

        return Response({
            'funding': source['funding'],
            'brand': source['brand'],
            'last4': source['last4']
        })


class StripeWebhookView(views.APIView):
    @staticmethod
    def post(request):

        data = request.data
        type = data.get('type')

        obj = data.get('data', {}).get('object')
        if type == 'invoice.payment_succeeded':
            customer = obj['customer']
            user = get_user_model().objects.filter(customer_id=customer).first()
            if not user:
                return
            user.has_valid_payment = True
            user.subscription.subscribed_until = add_months(user.subscribed_until, 1)
            user.subscription.will_renew = True
            user.subscription.save()
            user.save()
        elif type == 'charge.failed':
            customer = obj['customer']
            user = get_user_model().objects.filter(customer_id=customer).first()
            if not user:
                return
            user.has_valid_payment = False
            user.save()
        elif type == 'customer.subscription.deleted':
            customer = obj['customer']
            user = get_user_model().objects.filter(customer_id=customer).first()
            if not user:
                return
            user.has_valid_payment = False
            user.will_renew = False
            user.subscription.subscription_id = None
            user.subscription.save()
            user.save()

        return Response(status=status.HTTP_200_OK)
