from django import forms
from django.contrib import admin
from django.contrib.auth import get_user_model
from django.contrib.auth.admin import UserAdmin as DjangoUserAdmin

from .forms import EmailUserChangeForm, EmailUserCreationForm
from .models import Subscription


class SubscriptionForm(forms.ModelForm):
    class Meta:
        model = Subscription
        fields = '__all__'


class UserAdmin(DjangoUserAdmin):
    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Personal Info', {'fields': ('first_name', 'last_name')}),
        ('Permissions', {'fields': ('is_active', 'is_staff',
                                    'is_superuser', 'is_verified',
                                    'groups', 'user_permissions')}),
        ('Important dates', {'fields': ('last_login', 'date_joined')}),
        ('Profile Picture', {'fields': ('picture',)})
    )
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'password1', 'password2'),
        }),
    )
    raw_id_fields = ('picture',)
    form = EmailUserChangeForm
    add_form = EmailUserCreationForm
    list_display = ('email', 'is_verified', 'first_name', 'last_name',
                    'is_staff')
    search_fields = ('first_name', 'last_name', 'email')
    ordering = ('email',)


admin.site.register(get_user_model(), UserAdmin)
