from django.contrib.auth import get_user_model
from django.db.models import ObjectDoesNotExist
from post_office import mail
from rest_framework import serializers


class EmailSerializer(serializers.ModelSerializer):
    to = serializers.SerializerMethodField()
    bcc = serializers.SerializerMethodField()
    cc = serializers.SerializerMethodField()
    sender = serializers.SerializerMethodField()

    class Meta:
        model = mail.Email
        exclude = ('scheduled_time', 'headers', 'context', 'backend_alias', 'template', 'priority', 'from_email')

    @staticmethod
    def get_to(obj):
        return obj.to

    @staticmethod
    def get_bcc(obj):
        return obj.bcc

    @staticmethod
    def get_cc(obj):
        return obj.cc

    @staticmethod
    def get_sender(obj):
        User = get_user_model()
        from accounts.serializers import UserSerializer

        try:
            return UserSerializer(User.objects.get(email=obj.from_email)).data
        except ObjectDoesNotExist:
            return obj.from_email
