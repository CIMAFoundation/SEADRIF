'''
Created on Feb 6, 2018

@author: doy
'''
import io
from rfsea.settings import DATA_BASE_DIR, SPATIALS_DIR_NAME, DATA_DIR_NAME,\
    POP_FILE_NAME, RUN_IMAGES_DIR_NAME
import os
import ogr
import csv
from datetime import timedelta
from rfsea.models import AppSetting
import json
import glob
import gdal
import gdalnumeric
import numpy
from PIL import Image
import time


def my_int(v):
    return int(v) if len(v)>0 else 0

def getPaletteIndex(v, paletteValues):
    if v == 255: return 255;
    for i, pv in enumerate(paletteValues):
        if pv > v: return i-1 if i>0 else 0
    return len(paletteValues)-1

class DeltaresReader(object):
    '''
    reader for the rfsea data
    '''
    countriesIDs = {}
    countriesIdNames = {}

    def __init__(self, country):
        '''
        Constructor with country object  
        '''
        self.country = country
        self.spatialDir = os.path.join(DATA_BASE_DIR, SPATIALS_DIR_NAME)
        self.dataDir = os.path.join(DATA_BASE_DIR, DATA_DIR_NAME)

        
    def _getReferenceScenario(self):
        #get the application settings
        cfg = json.loads(str(AppSetting.objects.all()[0].data))
        referenceScenario = cfg['reference_scenario']
        return referenceScenario

    def _getAnalisysScenarios(self):
        #get the application settings
        cfg = json.loads(str(AppSetting.objects.all()[0].data))
        return cfg['scenarios']

    def _getAvailablesRuns(self, dt1, dt2):
        #search for the latest available at "day"
        runs = []
        day = dt2        
        while day >= dt1:
            p = os.path.join(self.dataDir, day.strftime('%Y'), day.strftime('%m'), day.strftime('%d'))
            if os.path.exists(p): runs.append(day) 
            day = day - timedelta(days=1)        
        return runs         

    def getRunDir(self, day):
        runDir = None
        while runDir is None and day.year >= 1970:
            p = os.path.join(self.dataDir, day.strftime('%Y'), day.strftime('%m'), day.strftime('%d'))
            if os.path.exists(p): runDir = p
            else: day = day - timedelta(days=1)        
        if not runDir: raise ValueError('no data found') 
        
        #read the pop data
        if not os.path.exists(runDir): raise ValueError('invald run dir: %s'%runDir)
        return runDir, day

    def _readPopData(self, day):
        runDir, day = self.getRunDir(day)

        popFile = os.path.join(runDir, POP_FILE_NAME)
        if not os.path.exists(popFile): raise ValueError('cannot find pop file: %s'%popFile)
        fields=None
        popData = {}
        with open(popFile, 'rb') as csvfile:
            spamreader = csv.reader(csvfile)
            for row in spamreader:
                if fields is None:
                    fields = row[1:]
                    continue                
                popData[row[0]] = map(my_int, row[1:])                    
        return day, fields, popData, runDir
    

    def _readZonesIds(self):
        if self.country.name not in self.countriesIDs:
            print '%s not found in couontry ID cache... loading' % self.country.name
            ids = []
            shpFile = os.path.join(self.spatialDir, '%s.shp' % self.country.name)
            if not os.path.exists(shpFile):
                raise ValueError('cannot find contry shape file: %s' % shpFile)
            driver = ogr.GetDriverByName('ESRI Shapefile')
            ds = driver.Open(shpFile)
            lyr = ds.GetLayer(0)
            for feature in lyr:
                prop = feature.ExportToJson(as_object=True)
                ids.append(str(prop['properties']['ID']))
                self.countriesIdNames[str(prop['properties']['ID'])] = str(prop['properties']['name'])
            self.countriesIDs[self.country.name] = ids

            
        return self.countriesIDs[self.country.name]


    def getRuns(self, dt1, dt2):
        return self._getAvailablesRuns(dt1, dt2)


    def getGlobal(self, day):        
        '''
        read global data for the country at a specific day
        '''

        referenceScenario = self._getReferenceScenario()        

        #read the pop data
        runDay, fields, popData, _ = self._readPopData(day)        
        
        #search for the reference scenario index
        if not referenceScenario in fields: raise ValueError('reference scenario not found in data')
        scenarioIdx = fields.index(referenceScenario)
        
        #get the zones id 
        ids = self._readZonesIds()
        
        totalPop = 0
        for i in ids:
            totalPop += popData[i][scenarioIdx]
            
        rel_path = os.path.join(runDay.strftime('%Y'), runDay.strftime('%m'), runDay.strftime('%d'), RUN_IMAGES_DIR_NAME)
        
        data = {
            'day': runDay,
            'pop': totalPop,
            'wd_img': os.path.join(rel_path, 'wd', 'wd_global.tif'),
            'eo_img': os.path.join(rel_path, 'eo', 'eo_global.tif'),
            }
        
        return data
    
    
    def getZones(self, day, simplify=False):
        '''
        return the zone of the country in geojson format
        for each zone is computed also the population value
        '''
        referenceScenario = self._getReferenceScenario() 
        
        shpFile = os.path.join(self.spatialDir, '%s.shp'%self.country.name)
        if not os.path.exists(shpFile): raise ValueError('cannot find contry shape file: %s'%shpFile)

        #read the pop data
        _, fields, popData, _ = self._readPopData(day)                    
        
        #search for the reference scenario index
        if not referenceScenario in fields: raise ValueError('reference scenario not found in data')
        scenarioIdx = fields.index(referenceScenario)
        
        #read the country shape file        
        driver = ogr.GetDriverByName('ESRI Shapefile')
        ds = driver.Open(shpFile)
        fc = {
            'type': 'FeatureCollection',
            'features': []
            }        
        lyr = ds.GetLayer(0)
        for feature in lyr:
            if simplify:
                feature.SetGeometry(feature.GetGeometryRef().SimplifyPreserveTopology(0.01))    
            prop = feature.ExportToJson(as_object=True)
            prop['properties']['data'] = popData[str(prop['properties']['ID'])][scenarioIdx]            
            fc['features'].append(prop)
        
        fc['features'] = sorted(fc['features'], key= lambda k: -k['properties']['data'])
        
        
        #get the palette from the settings
        app_settings = json.loads(AppSetting.objects.all()[0].data)
        pal = app_settings["pop_palette"]
        
        return {'pal': pal, 'geojson': fc}            
            
            
    def getCountryDetails(self, day):
        
        referenceScenario = self._getReferenceScenario()        

        #read the pop data
        _, fields, popData, _ = self._readPopData(day)        
        
        #search for the reference scenario index
        if not referenceScenario in fields: raise ValueError('reference scenario not found in data')
        scenarioIdx = fields.index(referenceScenario)
        
        #get the zones id 
        ids = self._readZonesIds()
        
        totalPop = 0        
        for i in ids:
            totalPop += popData[i][scenarioIdx]
        
        #compute the historical data
        littlerEv = None
        biggerEv = None
        for ev in self.country.historicalevent_set.all():
            if ev.pop <= totalPop and (littlerEv is None or ev.pop > littlerEv.pop): littlerEv = ev
            if ev.pop > totalPop and (biggerEv is None or ev.pop < biggerEv.pop): biggerEv = ev                 
        
        data = {
            'pop_est': totalPop,
            'pop_hl': littlerEv.pop if littlerEv is not None else None,
            'hl': '%s - %s'%(littlerEv.name, littlerEv.year) if littlerEv is not None else None,
            'hl_descr': littlerEv.descr if littlerEv is not None else None,
            'pop_hg': biggerEv.pop if biggerEv is not None else None,
            'hg': '%s - %s'%(biggerEv.name, biggerEv.year) if biggerEv is not None else None,
            'hg_descr': biggerEv.descr if biggerEv is not None else None,
            }
        
        return data
        
    
    def getCountryPopulationCSV(self, day):
        #rad population data
        _, fields, popData, _ = self._readPopData(day)
        #ensure that all country ids are decoded with name
        ids = self._readZonesIds()
        #build csv string
        
        
        output = io.BytesIO()
        # output = open('/tmp/pippo.csv', 'w')
        writer = csv.writer(output, dialect=csv.excel, delimiter=';')
        writer.writerow([u'id', u'name'] + fields)
        for fid in popData:
            if fid in ids:
                writer.writerow([fid, self.countriesIdNames[fid]] + popData[fid]) 

        csv_string = output.getvalue()

        output.close()
        
        # csv_string = open('/tmp/pippo.csv', 'r').read()
        
        return csv_string


    
    def getCountryAnalysis(self, day):
        
        scenariosSets = self._getAnalisysScenarios();
        
        #read the pop data
        _, fields, popData, _ = self._readPopData(day)        
        
        #get the zones id 
        ids = self._readZonesIds()
                
        data = []
        for set in scenariosSets:
            d = [0 for s in set]
            idxs = [fields.index(s) for s in set]
            for fid in ids:
                for i, idx in enumerate(idxs):
                    d[i] += popData[fid][idx]
            data.append(d)
        
        referenceScenario = self._getReferenceScenario() 
        return {
            'data': data,
            'ref_scenario': fields.index(referenceScenario)
            }
    
    def getWDImages(self, day, res):
        ids = self._readZonesIds()
        for zone_id in ids:
            details = self.getZoneDetails(day, zone_id)            
            if res['legend'] is None: 
                res['legend'] = details['imgs']['wd']['legend']
            res['imgs'].append({
                'extent': details['imgs']['wd']['extent'],
                'img': details['imgs']['wd']['img']
            })

    
    def getZoneDetails(self, day, zoneId):        
        '''
        read global data for the zone at a specific day
        '''

        referenceScenario = self._getReferenceScenario()        

        #read the pop data
        day, fields, popData, runDir = self._readPopData(day)        
        
        #search for the reference scenario index
        if not referenceScenario in fields: raise ValueError('reference scenario not found in data')
        scenarioIdx = fields.index(referenceScenario)
        
        totalPop = popData[zoneId][scenarioIdx]

        #get app settings for the palettes
        app_settings = json.loads(AppSetting.objects.all()[0].data)
        palettes = app_settings["palette"]
        
        #get all available images
        imgs = {}
        for img_set_path in glob.glob(os.path.join(runDir, RUN_IMAGES_DIR_NAME, '*')):
            img_set = os.path.basename(img_set_path)
            rel_path = os.path.join(day.strftime('%Y'), day.strftime('%m'), day.strftime('%d'), RUN_IMAGES_DIR_NAME, img_set)
            img_file_name = '%s_%s.tif' % (img_set, zoneId)
#             json_file_name = '%s_%s.json' % (img_set, zoneId)
            img_file_path = os.path.join(img_set_path, img_file_name)
#             json_file_path = os.path.join(img_set_path, json_file_name)            
            if not os.path.exists(img_file_path): raise ValueError('img file not found: %s'%img_file_name)            
#             if not os.path.exists(json_file_path): raise ValueError('extent file not found: %s'%json_file_name)
            src = gdal.Open(img_file_path)
            minX, xres, xskew, maxY, yskew, yres  = src.GetGeoTransform()
            maxX = minX+ (src.RasterXSize * xres)
            minY = maxY + (src.RasterYSize * yres)            
            src = None
            extent = {
                    'sw': [minY, minX],
                    'ne': [maxY, maxX],
                    }            
            
            #build palette
            pal = []
            p_values = palettes[img_set]['values']
            p_colors = palettes[img_set]['colors']
            for i,v in enumerate(p_values):
                label = '%s m'%v if img_set=='wd' else '%s_%s'%(img_set,v) 
                color = '#%0.2X%0.2X%0.2X'%(p_colors[(i+1)*3], p_colors[(i+1)*3+1], p_colors[(i+1)*3+2])
                pal.append({'label': label, 'color': color})
                
            imgs[img_set] = {
                'img': os.path.join(rel_path, img_file_name),
                'extent': extent,
                'legend': pal                
                }
        
        
        data = {
            'pop': totalPop,
            'imgs': imgs
            }
        
        return data
    
    
    def getImgAbsolutePath(self, rel_path):
        path = os.path.join(self.dataDir, rel_path)
        if not os.path.exists(path): raise ValueError('img file not found: %s', rel_path)
        return path
            
    def getImg(self, rel_path):
        path = os.path.join(self.dataDir, rel_path)
        if not os.path.exists(path): raise ValueError('img file not found: %s', rel_path)

        #get palette from app settings
        app_settings = json.loads(AppSetting.objects.all()[0].data)
        palette_name = os.path.basename(os.path.dirname(path))
        if palette_name not in app_settings['palette']:
            raise ValueError("ivalid image set: %s"%palette_name)
        palette = app_settings['palette'][palette_name]

        t = time.time()

        #read the tiff float data
        raster_data = gdalnumeric.LoadFile(path)
        
        #evenctually make a single value transparent
        if 'replace' in app_settings and palette_name in app_settings['replace']:
            for idx in  app_settings['replace'][palette_name]:
                old_value = float(idx)            
                new_value = app_settings['replace'][palette_name][idx]
                numpy.place(raster_data, raster_data==old_value, new_value)
        
        #apply palette
        values = numpy.append(palette['values'], 254)
        img_data = numpy.digitize(raster_data, values).astype(numpy.uint8)
        tr_idx = len(values)
        
        #build the image
        img = Image.fromarray(img_data, 'P')
        img.putpalette(palette['colors'])
        
        print 'image paletted in %s ms'%(time.time() - t)
        t = time.time()
        
        #return the paletted image as byte array
        bytes_io = io.BytesIO() 
        img.save(bytes_io, format='png', transparency=tr_idx) 
        
        print 'image saved in %s ms'%(time.time() - t)
        
        return bytes_io.getvalue()
        
    def getCountryGeoTiffBytes(self, day, data_type):

        run_dir, _ = self.getRunDir(day)
        
        country_geotiff = os.path.join(run_dir, '%s_%s.tif'%(self.country.name, data_type))

        if not os.path.exists(country_geotiff):
            tif_folder = os.path.join(run_dir, 'images/%s'%(data_type))
            ids = self._readZonesIds()
            tif_files = [os.path.join(tif_folder, '%s_%s.tif'%(data_type, i)) for i in ids]
            tif_files_param = ' '.join(tif_files)

            # cmd = 'gdal_merge.py -init 255 -n 255 -co "COMPRESS=DEFLATE" -o %s %s/*'%(country_geotiff, tiff_folder)
            cmd = 'gdal_merge.py -n 255 -co "COMPRESS=DEFLATE" -o %s %s'%(country_geotiff, tif_files_param)
            print('running %s'%cmd)
            os.system(cmd)
            print('\tDONE!');

        with open(country_geotiff, 'rb') as f:
            return f.read()

            
