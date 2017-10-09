# -*- coding: utf-8 -*-
# Generated by Django 1.10.4 on 2017-03-20 03:53
from __future__ import unicode_literals

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion
import utils.models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('accounts', '0001_initial'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='Photo',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(editable=False)),
                ('modified_at', models.DateTimeField(editable=False)),
                ('path', models.FilePathField(blank=True, max_length=1000, null=True)),
                ('hash', models.CharField(blank=True, db_index=True, max_length=40, null=True)),
                ('description', models.TextField(blank=True, default='', max_length=500)),
                ('active', models.BooleanField(default=True)),
                ('showcase', models.BooleanField(default=False)),
                ('width', models.IntegerField(blank=True, null=True)),
                ('height', models.IntegerField(blank=True, null=True)),
                ('is_profile', models.BooleanField(default=False, verbose_name='Profile picture')),
                ('uploaded_by', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'ordering': ['created_at'],
            },
            bases=(models.Model, utils.models.ModelMixin),
        ),
    ]
