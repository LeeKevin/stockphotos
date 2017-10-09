import copy

from django.db import models
from django.forms.models import model_to_dict
from django.utils import timezone


class TimeStamped(models.Model):
    created_at = models.DateTimeField(editable=False)
    modified_at = models.DateTimeField(editable=False)

    def __init__(self, *args, **kwargs):
        super(TimeStamped, self).__init__(*args, **kwargs)

        if not self.created_at:
            self.created_at = timezone.now()
        if not self.modified_at:
            self.modified_at = timezone.now()

    def save(self, *args, **kwargs):
        if not self.created_at:
            self.created_at = timezone.now()
        self.modified_at = timezone.now()
        return super(TimeStamped, self).save(*args, **kwargs)

    class Meta:
        abstract = True


class ModelMixin:
    def __init__(self, *args, **kwargs):
        super(ModelMixin, self).__init__(*args, **kwargs)
        self._initial = self._dict()

    def __str__(self):
        return self.name if hasattr(self, 'name') else None

    def _dict(self):
        # Make a copy of the model here so that nested dicts don't hold the same reference (and aren't updated together)
        # This is because we want a snapshot
        return copy.deepcopy(model_to_dict(self, fields=[field.name for field in
            self._meta.fields]))

    def has_changed(self):
        initial = self._initial
        current = self._dict()
        return [k for k, v in initial.items() if v != current[k]]
