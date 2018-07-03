'''
Created on 2 Dec 2015

@author: doy
'''
from django.contrib.admin.options import ModelAdmin
from django.contrib import admin
from rfsea.models import Country, UserSetting, AppSetting, HistoricalEvent

admin.autodiscover()

admin.site.register(Country)
admin.site.register(UserSetting)
admin.site.register(AppSetting)
admin.site.register(HistoricalEvent)
