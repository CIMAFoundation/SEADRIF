# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations


class Migration(migrations.Migration):

    dependencies = [
        ('rfsea', '0002_country_descr'),
    ]

    operations = [
        migrations.AddField(
            model_name='historicalevent',
            name='descr',
            field=models.TextField(default=''),
            preserve_default=False,
        ),
    ]
