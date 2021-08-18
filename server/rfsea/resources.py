"""
dds client resources
"""
import glob
import io
import os
from rfsea.settings import DATA_BASE_DIR, DELTARES_WORK_DIR
from acroweb.core.resources import AcrowebResource, URLHelper
from rfsea.service.deltares_reader import DeltaresReader
from rfsea.models import Country
import datetime
from django.http import FileResponse, HttpResponse, response
import calendar
from tastypie.http import HttpUnauthorized
import json
import zipfile
from rfsea import add_logbook_activity

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
                URLHelper('/%s/downloadpop'%self.strParam('country'), 'download_pop'),
                URLHelper('/%s/downloadeo'%self.strParam('country'), 'download_eo'),
                URLHelper('/%s/downloadmodel'%self.strParam('country'), 'download_model'),
                URLHelper('/%s/downloadeomodel'%self.strParam('country'), 'download_eo_model'),
                URLHelper('/downloadwork', 'download_work'),
                URLHelper('/downloadinput', 'download_input'),
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

    def download_pop(self, request, **kwargs):
        self.method_check(request, allowed=['get'])

        response = self._checkCountryPermission(request, kwargs['country'])
        if response: return response

        day = datetime.datetime.strptime(request.GET['d'], '%Y%m%d') if 'd' in request.GET else datetime.date.today()
        country = Country.objects.get(pk=kwargs['country'])

        add_logbook_activity(request, 'download pop: %s;%s'%(country.name, day))

        reader = DeltaresReader(country)
        data = reader.getCountryPopulationCSV(day)
        
        response = HttpResponse(data, content_type='application/force-download')
        response['Content-Disposition'] = 'attachment; filename=%s_population_%s.csv'%(country.name, day)
        return response

    def __download(self, day, country, data_type, data_type_descr=None):
        reader = DeltaresReader(country)
        data = reader.getCountryGeoTiffBytes(day, data_type)        
        response = HttpResponse(data, content_type='application/force-download')
        data_type_descr = data_type_descr if data_type_descr != None else data_type
        response['Content-Disposition'] = 'attachment; filename=%s_%s_%s.tif'%(country.name, data_type_descr, day)
        return response

    def download_eo(self, request, **kwargs):
        self.method_check(request, allowed=['get'])

        response = self._checkCountryPermission(request, kwargs['country'])
        if response: return response

        day = datetime.datetime.strptime(request.GET['d'], '%Y%m%d') if 'd' in request.GET else datetime.date.today()
        country = Country.objects.get(pk=kwargs['country'])

        add_logbook_activity(request, 'download eo: %s;%s'%(country.name, day))

        return self.__download(day, country, 'eo')

    def download_model(self, request, **kwargs):
        self.method_check(request, allowed=['get'])

        response = self._checkCountryPermission(request, kwargs['country'])
        if response: return response

        day = datetime.datetime.strptime(request.GET['d'], '%Y%m%d') if 'd' in request.GET else datetime.date.today()
        country = Country.objects.get(pk=kwargs['country'])

        return self.__download(day, country, 'wd', 'model')
       
    def download_eo_model(self, request, **kwargs):
        self.method_check(request, allowed=['get'])

        response = self._checkCountryPermission(request, kwargs['country'])
        if response: return response

        day = datetime.datetime.strptime(request.GET['d'], '%Y%m%d') if 'd' in request.GET else datetime.date.today()
        country = Country.objects.get(pk=kwargs['country'])

        add_logbook_activity(request, 'download eo_model: %s;%s'%(country.name, day))

        return self.__download(day, country, 'compare_eo_wd', 'eo-model')

    def download_input(self, request, **kwargs):
        self.method_check(request, allowed=['get'])

        response = self._checkCountryPermission(request, None)
        if response: return response

        add_logbook_activity(request, 'download input')

        response = FileResponse(open(os.path.join(DATA_BASE_DIR, 'Input.tgz'), 'rb'), content_type='application/force-download')
        response['Content-Disposition'] = 'attachment; filename=input_data.tgz'
        return response


    def download_work(self, request, **kwargs):
        self.method_check(request, allowed=['get'])

        response = self._checkCountryPermission(request, None)
        if response: return response

        day = datetime.datetime.strptime(request.GET['d'], '%Y%m%d') if 'd' in request.GET else datetime.date.today()

        #get last valid day
        _, day = DeltaresReader(None).getRunDir(day)

        #go to the next days for the work dir
        day = day + datetime.timedelta(days=1)

        add_logbook_activity(request, 'download wok: %s'%(day))
        
        work_run_dir = os.path.join(DELTARES_WORK_DIR, day.strftime('%Y-%m-%d'))

        output = io.BytesIO()

        zip_file = zipfile.ZipFile(output, 'w')

        #add all cvs files to archive
        csv_files = glob.glob(os.path.join(work_run_dir, '*.csv')) 
        for f in csv_files:
            zip_file.write(f, 'work_%s/%s'%(day.strftime('%Y%m%d'), os.path.basename(f)))
        zip_file.close()

        response = HttpResponse(output.getvalue(), content_type='application/force-download')
        response['Content-Disposition'] = 'attachment; filename=work_data_%s.zip'%(day)
        return response

