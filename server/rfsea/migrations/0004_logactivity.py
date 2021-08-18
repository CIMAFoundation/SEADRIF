# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import migrations, models
import django.utils.timezone


class Migration(migrations.Migration):

    dependencies = [
        ('rfsea', '0003_historicalevent_descr'),
    ]

    operations = [
        migrations.CreateModel(
            name='LogActivity',
            fields=[
                ('id', models.AutoField(verbose_name='ID', serialize=False, auto_created=True, primary_key=True)),
                ('user', models.CharField(max_length=255)),
                ('dt', models.DateTimeField(default=django.utils.timezone.now)),
                ('address', models.TextField()),
                ('activity', models.TextField()),
            ],
        ),
    ]
