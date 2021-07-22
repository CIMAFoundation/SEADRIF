from django.db import models
from django.contrib.auth.models import User




class UserSetting(models.Model):
    user = models.ForeignKey(User, unique=True)
    data = models.TextField()
    def __unicode__(self):
        return '%s - %s'%(self.user,self.data)
      

class AppSetting(models.Model):
    data = models.TextField()
    def __unicode__(self):
        return 'the settings'


class Country(models.Model):
    name = models.CharField(max_length=255)
    thr1 = models.FloatField(default=0)
    thr2 = models.FloatField(default=0)
    pcost = models.FloatField(default=50)
    curve = models.TextField()
    descr = models.TextField()
    pop = models.FloatField(default=0)
    def __unicode__(self):
        return self.name

class HistoricalEvent(models.Model):
    name = models.CharField(max_length=255)
    year = models.IntegerField()
    pop = models.IntegerField()
    source = models.TextField()
    country = models.ForeignKey(Country)
    descr = models.TextField()
    def __unicode__(self):
        return '%s --> %s - %s'%(self.country.name, self.name, self.year)
    
