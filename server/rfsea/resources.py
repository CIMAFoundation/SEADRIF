"""
dds client resources
"""
import glob
import io
import os
from rfsea.settings import DATA_BASE_DIR, DELTARES_LOG_DIR, DELTARES_WORK_DIR
from acroweb.core.resources import AcrowebResource, URLHelper
from rfsea.service.deltares_reader import DeltaresReader
from rfsea.models import Country
import datetime
from django.http import FileResponse, HttpResponse, response
import calendar
from tastypie.http import HttpUnauthorized
import json
import zipfile
from rfsea import add_logbook_activity, get_logbook_csv
import django.utils.timezone


class RFSEAResource(AcrowebResource):
    
    class Meta():
        include_resource_uri = False
        resource_name = 'data'
        
    def getMyUrl(self):
        return [
                URLHelper('/runs/%s/%s'%(self.strParam('year'), self.strParam('month')), 'runs'),
                URLHelper('/%s/globals'%self.strParam('country'), 'globals'), 
                URLHelper('/%s/zones'%self.strParam('country'), 'country_zones'),
                URLHelper('/zones', 'all_zones'),
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
                URLHelper('/%s/inputfloodmaps'%self.strParam('country'), 'get_input_floodmaps'),
                URLHelper('/%s/downloadinputfloodmaps/%s'%(self.strParam('country'), self.strParam('map')), 'download_floodmap'),
                URLHelper('/downloadlog', 'download_log'),
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

    def all_zones(self, request, **kwargs):
        self.method_check(request, allowed=['get'])
        
        day = datetime.datetime.strptime(request.GET['d'], '%Y%m%d') if 'd' in request.GET else datetime.date.today()

        # all_data = None
        all_data = {
            'legend': None,
            'imgs': []
        }

        for country in Country.objects.all():
            #obtain global data
            reader = DeltaresReader(country)
            
            
            reader.getWDImages(day, all_data)

            # data = reader.getZones(day, simplify=True)
            # if all_data is None:
            #     all_data = data
            # else:
            #     all_data['geojson']['features'].extend(data['geojson']['features'])
        
        return self.create_response(request, all_data)

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
        
#        response = self._checkCountryPermission(request, None)
#        if response: return response

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

    def get_input_floodmaps(self, request, **kwargs):
        self.method_check(request, allowed=['get'])

        response = self._checkCountryPermission(request, kwargs['country'])
        if response: return response

        country = Country.objects.get(pk=kwargs['country'])
        country_dir = os.path.join(DATA_BASE_DIR, 'input_downloads', country.name)

        data = os.listdir(country_dir)

        return self.create_response(request, [str(os.path.splitext(f)[0]) for f in data])


    def download_floodmap(self, request, **kwargs):
        self.method_check(request, allowed=['get'])

        response = self._checkCountryPermission(request, None)
        if response: return response

        country = Country.objects.get(pk=kwargs['country'])
        country_dir = os.path.join(DATA_BASE_DIR, 'input_downloads', country.name)

        flood_map = '%s.tif'%kwargs['map']

        add_logbook_activity(request, 'download input')

        response = FileResponse(open(os.path.join(country_dir, flood_map), 'rb'), content_type='application/force-download')
        response['Content-Disposition'] = 'attachment; filename=%s'%flood_map
        return response

    def download_work(self, request, **kwargs):
        self.method_check(request, allowed=['get'])

        response = self._checkCountryPermission(request, None)
        if response: return response

        day_run = datetime.datetime.strptime(request.GET['d'], '%Y%m%d') if 'd' in request.GET else datetime.date.today()

        #get last valid day
        _, day_run = DeltaresReader(None).getRunDir(day_run)

        #go to the next days for the work dir
        day = day_run + datetime.timedelta(days=1)

        add_logbook_activity(request, 'download wok: %s'%(day))
        
        work_run_dir = os.path.join(DELTARES_WORK_DIR, day.strftime('%Y-%m-%d'))

        output = io.BytesIO()

        zip_file = zipfile.ZipFile(output, 'w')

        #add all cvs files to archive
        csv_files = glob.glob(os.path.join(work_run_dir, '*.csv')) 
        for f in csv_files:
            zip_file.write(f, 'work_%s/%s'%(day.strftime('%Y%m%d'), os.path.basename(f)))
        
        #add log files
        for log_file_base_name in ['log', 'log_deltares', 'log_pelc']:      
            log_file = os.path.join(DELTARES_LOG_DIR, '%s_%s.txt'%(log_file_base_name, day_run.strftime('%Y-%m-%d')))
            if os.path.exists(log_file):
                zip_file.write(log_file, 'work_%s/%s'%(day.strftime('%Y%m%d'), os.path.basename(log_file)))

        zip_file.close()

        response = HttpResponse(output.getvalue(), content_type='application/force-download')
        response['Content-Disposition'] = 'attachment; filename=work_data_%s.zip'%(day)
        return response


    def download_log(self, request, **kwargs):
        self.method_check(request, allowed=['get'])

        if request.user is None or not request.user.is_authenticated(): 
            return self.create_response(request, 'not authenticated', HttpUnauthorized)        
        
        userSettingSet = request.user.usersetting_set.all()
        if not userSettingSet or len(userSettingSet)==0:
            return self.create_response(request, 'cannot find user settings', HttpUnauthorized)
        
        try:
            userSettings = json.loads(userSettingSet[0].data)
            
            if 'allow_log' not in userSettings or userSettings['allow_log'].lower() != 'true':
                return self.create_response(request, 'operation not permitted', HttpUnauthorized)
            
        except:
            return self.create_response(request, 'error reading user settings', HttpUnauthorized)

        dt_to = datetime.datetime.strptime(request.GET['to'], '%Y%m%d') if 'to' in request.GET else django.utils.timezone.now()
        s_dt_to = dt_to.strftime('%Y%m%d')
        dt_from = datetime.datetime.strptime(request.GET['from'], '%Y%m%d') if 'from' in request.GET else dt_to - datetime.timedelta(days=1)
        s_dt_from = dt_from.strftime('%Y%m%d')
        
        data = get_logbook_csv(dt_from, dt_to)

        response = HttpResponse(data, content_type='application/force-download')
        response['Content-Disposition'] = 'attachment; filename=log_from_%s_to_%s.csv'%(s_dt_from, s_dt_to)
        return response


