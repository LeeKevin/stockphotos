import math

from django import forms
from django.contrib import admin
from django.forms import widgets
from django.utils.html import format_html
from django.utils.safestring import mark_safe

from .models import Photo


class PhotoWidget(widgets.TextInput):
    def render(self, name, value, attrs=None):
        return mark_safe(
            u'''<a href="/{0}" target="_blank"><img style="max-width: 100%; max-height: 200px;" src="/{0}" /></a>'''
                .format(value)) if value else 'None'


class AddFileForm(forms.ModelForm):
    file = forms.FileField(required=False)
    description = forms.CharField(widget=forms.Textarea, required=False)

    class Meta:
        model = Photo
        fields = ('file', 'description')

    def clean(self):
        # Don't validate existing files
        if self.instance and self.instance.pk is not None:
            return

        file = self.cleaned_data.get('file', None)

        if not file:
            self.add_error('file', forms.ValidationError('You must upload a file.'))
        elif file._size > math.pow(2, 20) * 100:
            self.add_error('file', forms.ValidationError('File Too Large. Must be less than 100 MB.'))

        super(AddFileForm, self).clean()

    def save(self, *args, **kwargs):

        # Don't save existing files
        if self.instance and self.instance.pk is not None:
            self.instance.description = self.cleaned_data.pop('description', '')
            self.instance.active = self.cleaned_data.pop('active', False)
            self.instance.extra = self.cleaned_data.pop('extra', False)
            self.instance.featured = self.cleaned_data.pop('featured', False)
            self.instance.save()
            return self.instance

        file_object = super(AddFileForm, self).save(commit=False)
        file = self.cleaned_data.pop('file', None)
        description = self.cleaned_data.pop('description', '')

        file_object.uploaded_by = self.current_user
        file_object.description = description
        return file_object.upload(file.read())

    def __init__(self, *args, **kwargs):
        super(AddFileForm, self).__init__(*args, **kwargs)

        instance = kwargs.get('instance', None)

        if instance and instance.pk is not None:  # Check if fresh form (i.e. a create)
            self.base_fields['file'] = self.declared_fields['file'] = self.fields['file'] = forms.CharField(
                max_length=500, initial=instance.path, disabled=True, widget=PhotoWidget)
            if 'active' in self.fields:
                self.base_fields['active'] = self.declared_fields['active'] = self.fields[
                    'active'] = forms.BooleanField(initial=instance.active, required=False)
        else:
            self.base_fields['file'] = self.declared_fields['file'] = self.fields['file'] = forms.FileField(
                required=False)
            if 'active' in self.fields:
                self.base_fields['active'] = self.declared_fields['active'] = self.fields[
                    'active'] = forms.BooleanField(initial=False, required=False, widget=forms.HiddenInput())


class UpdateFileForm(forms.ModelForm):
    file = forms.CharField(max_length=500)
    description = forms.CharField(widget=forms.Textarea)
    active = forms.BooleanField()

    class Meta:
        model = Photo
        fields = ('file', 'description', 'active')

    def clean(self):
        # Don't validate existing files
        if self.instance and self.instance.pk is not None:
            return

    def __init__(self, *args, **kwargs):
        instance = kwargs.get('instance', None)
        super(UpdateFileForm, self).__init__(*args, **kwargs)
        if instance and instance.pk is not None:
            self.base_fields['file'] = self.declared_fields['file'] = self.fields['file'] = forms.CharField(
                max_length=500, initial=instance.path, disabled=True, widget=PhotoWidget)


class FileAdmin(admin.ModelAdmin):
    list_display = ('id', 'uploaded_by', 'photographer', 'created_at', 'show_url', 'active')
    list_filter = ('active', 'is_profile')
    search_fields = ('uploaded_by', 'photographer')
    ordering = ('-created_at',)

    def get_form(self, request, obj=None, *args, **kwargs):
        # Proper kwargs are form, fields, exclude, formfield_callback
        if obj:  # obj is not None, so this is a change page
            self.form = UpdateFileForm
            self.fields = kwargs['fields'] = ('file', 'description', 'active')

        else:  # obj is None, so this is an add page
            self.form = AddFileForm
            self.fields = kwargs['fields'] = ('file', 'description', 'is_profile')

        form = super(FileAdmin, self).get_form(request, *args, **kwargs)
        form.current_user = request.user

        return form

    def show_url(self, obj):
        if not obj.path:
            return None
        return format_html("<a href='/{url}'>{url}</a>", url=obj.path)

    show_url.allow_tags = True
    show_url.short_description = 'Link'


class FileInlineAdmin(admin.StackedInline):
    model = Photo
    extra = 0
    fieldsets = (
        (None, {
            'fields': ('file', 'description', 'active'),
        }),
    )

    def get_formset(self, request, obj, *args, **kwargs):
        self.form = AddFileForm
        self.fields = kwargs['fields'] = ('file', 'description', 'active')
        self.form.current_user = request.user
        return super(FileInlineAdmin, self).get_formset(request, *args, **kwargs)

#
# class CollectionAdmin(admin.ModelAdmin):
#     list_display = ('id', 'name', 'description', 'created_by', 'approved', 'approved_date', 'draft', 'premium')
#     list_filter = ('approved', 'draft', 'premium')
#     search_fields = ('created_by', 'name')
#     ordering = ('-created_at',)
#
#     inlines = [FileInlineAdmin]


admin.site.register(Photo, FileAdmin)
# admin.site.register(Collection, CollectionAdmin)
