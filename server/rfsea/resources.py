"""
dds client resources
"""
from acroweb.core.resources import AcrowebResource, URLHelper
from rfsea.service.deltares_reader import DeltaresReader
from rfsea.models import Country
import datetime
from django.http.response import HttpResponse
import calendar
from tastypie.http import HttpUnauthorized
import json


class RFSEAResource(AcrowebResource):
    
    class Meta():
        include_resource_uri = False
        resource_name = 'data'
        
    def getMyUrl(self):
        return [
                URLHelper('/runs/%s/%s'%(self.strParam('year'), self.strParam('month')), 'runs'),
                URLHelper('/%s/globals'%self.strParam('country'), 'globals'), 
                URLHelper('/%s/zones'%self.strParam('country'), 'country_zones'),
                URLHelper('/%s/details'%self.strParam('country'), 'country_details'),
                URLHelper('/%s/analysis'%self.strParam('country'), 'country_analysis'),
                URLHelper('/%s/%s/zonedetails'%(self.strParam('country'), self.strParam('zone')), 'zone_details'),
                URLHelper('/img', 'img'),
                ]

    def _checkCountryPermission(self, request, countryPK):        
        
        if request.user is None or not request.user.is_authenticated(): 
            return self.create_response(request, 'not authenticated', HttpUnauthorized)        
        
        if countryPK is None: return None
        
        userSettingSet = request.user.usersetting_set.all()
        if not userSettingSet or len(userSettingSet)==0:
            return self.create_response(request, 'cannot find user settings', HttpUnauthorized)
        
        try:
            userSettings = json.loads(userSettingSet[0].data)
            
            if 'country' not in userSettings:
                return self.create_response(request, 'cannot find "country" in user settings', HttpUnauthorized)
            
            if userSettings['country'] != 'all' and userSettings['country'] != countryPK:
                return self.create_response(request, 'not authorized', HttpUnauthorized) 
            
        except:
            return self.create_response(request, 'error reading user settings', HttpUnauthorized)
        
        return None
    

    def globals(self, request, **kwargs):
        self.method_check(request, allowed=['get'])
        
        response = self._checkCountryPermission(request, kwargs['country'])
        if response: return response
            
        day = datetime.datetime.strptime(request.GET['d'], '%Y%m%d') if 'd' in request.GET else datetime.date.today()
        country = Country.objects.get(pk=kwargs['country'])
        
        #obtain global data
        reader = DeltaresReader(country)
        data = reader.getGlobal(day)
        
        return self.create_response(request, data)
    

    def country_zones(self, request, **kwargs):
        self.method_check(request, allowed=['get'])
        
        response = self._checkCountryPermission(request, kwargs['country'])
        if response: return response

        day = datetime.datetime.strptime(request.GET['d'], '%Y%m%d') if 'd' in request.GET else datetime.date.today()
        country = Country.objects.get(pk=kwargs['country'])
        
        #obtain global data
        reader = DeltaresReader(country)
        data = reader.getZones(day)
        
        return self.create_response(request, data)

    def country_details(self, request, **kwargs):
        self.method_check(request, allowed=['get'])
        
        response = self._checkCountryPermission(request, kwargs['country'])
        if response: return response

        day = datetime.datetime.strptime(request.GET['d'], '%Y%m%d') if 'd' in request.GET else datetime.date.today()
        country = Country.objects.get(pk=kwargs['country'])
        
        #obtain global data
        reader = DeltaresReader(country)
        data = reader.getCountryDetails(day)
        
        return self.create_response(request, data)

    def country_analysis(self, request, **kwargs):
        self.method_check(request, allowed=['get'])
        
        response = self._checkCountryPermission(request, kwargs['country'])
        if response: return response

        day = datetime.datetime.strptime(request.GET['d'], '%Y%m%d') if 'd' in request.GET else datetime.date.today()
        country = Country.objects.get(pk=kwargs['country'])
        
        #obtain global data
        reader = DeltaresReader(country)
        data = reader.getCountryAnalysis(day)
        
        return self.create_response(request, data)

    def zone_details(self, request, **kwargs):
        self.method_check(request, allowed=['get'])
        
        response = self._checkCountryPermission(request, kwargs['country'])
        if response: return response

        day = datetime.datetime.strptime(request.GET['d'], '%Y%m%d') if 'd' in request.GET else datetime.date.today()
        country = Country.objects.get(pk=kwargs['country'])
        zoneId = kwargs['zone']
        
        #obtain global data
        reader = DeltaresReader(country)
        data = reader.getZoneDetails(day, zoneId)
        
        return self.create_response(request, data)

    def runs(self, request, **kwargs):
        self.method_check(request, allowed=['get'])
        
        response = self._checkCountryPermission(request, None)
        if response: return response

        year = int(kwargs['year'])
        month = int(kwargs['month'])
        
        #obtain global data
        reader = DeltaresReader(None)
        
        dayRange = calendar.monthrange(int(year), int(month))
        
        dt1 = datetime.datetime.strptime('%04d%02d%02d'%(year, month, 1), '%Y%m%d')
        dt2 = datetime.datetime.strptime('%04d%02d%02d'%(year, month, dayRange[1]), '%Y%m%d')
        
        data = reader.getRuns(dt1, dt2)
        
        return self.create_response(request, data)

    def img(self, request, **kwargs):
        self.method_check(request, allowed=['get'])
        
        response = self._checkCountryPermission(request, None)
        if response: return response

        if 'img' not in request.GET: raise ValueError('img query param not found')
        rel_path = request.GET['img']
        
        #obtain the image
        reader = DeltaresReader(None)
        bytes = reader.getImg(rel_path);

        response = HttpResponse(bytes, content_type='text/plain')
        response['Content-Length'] = len(bytes)
        return response


