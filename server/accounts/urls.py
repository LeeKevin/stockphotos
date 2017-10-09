from django.conf.urls import url

from .views import MeView, CheckEmail, SignUpView, StripeWebhookView, UpdateSubscriptionView, ProfilePhotoView, \
    InvoicesView, PaymentMethodView

urlpatterns = [
    url(r'^/accounts/me/?$', MeView.as_view(), name='me'),
    url(r'^/accounts/me/photo/?$', ProfilePhotoView.as_view(), name='profile-photo'),
    url(r'^/accounts/check-email/?', CheckEmail.as_view(), name='check-email'),
    url(r'^/stripe/?$', StripeWebhookView.as_view()),
    url(r'^/auth/sign-up/?', SignUpView.as_view(), name='signup'),
    url(r'^/accounts/me/subscription/?', UpdateSubscriptionView.as_view(), name='update-subscription'),
    url(r'^/accounts/me/invoices/?', InvoicesView.as_view(), name='invoices'),
    url(r'^/accounts/me/payment-method/?', PaymentMethodView.as_view(), name='payment-method'),
]
