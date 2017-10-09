from rest_framework import serializers

from .models import User, Subscription, Photographer


class SubscriptionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Subscription
        fields = ('plan', 'subscribed_until', 'will_renew')


class UserBriefSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()
    picture = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ('id', 'first_name', 'last_name', 'full_name', 'picture', 'date_joined')

    @staticmethod
    def get_full_name(obj):
        return '{} {}'.format(obj.first_name, obj.last_name).strip()

    @staticmethod
    def get_picture(obj):
        if obj.picture:
            from photos.serializers import PhotoBriefSerializer
            return PhotoBriefSerializer(obj.picture).data
        return None


class UserSerializer(serializers.ModelSerializer):
    subscription = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ('id', 'first_name', 'last_name', 'full_name', 'email', 'picture', 'date_joined',
                  'has_valid_payment', 'subscription')

    @staticmethod
    def get_subscription(obj):
        if obj.subscription:
            return SubscriptionSerializer(obj.subscription).data
        return None


class PhotographerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Photographer
        exclude = ('followers',)

    def to_representation(self, instance):
        ret = super(PhotographerSerializer, self).to_representation(instance)

        user = UserBriefSerializer(instance.user).data
        user.pop('id', None)
        ret.update(user)

        return ret
