'''
Created on Feb 8, 2018

@author: doy
'''
import os
import time

from PIL import Image
from PIL import ImageDraw
import gdal
import numpy
import ogr
from osgeo import gdalnumeric
from rfsea.service.eo_wd_comparator import EOWDComparator
import osr
from rfsea.settings import SPOOL_DIR, SPLIT_SHP, DATA_BASE_DIR,\
    RUN_IMAGES_DIR_NAME, DATA_DIR_NAME, POP_FILE_NAME
import glob
import sys
from datetime import datetime
import copy


raster_base_path = SPOOL_DIR

downscaleFactors = {
    'wd': 4,
    'eo': 2
    }

image_sets = {
    'wd': 'wd.tif',
    'eo': 'eo.tif',
    }

comparison = {'eo': 'eo', 'wd': 'wd', 'dir': 'compare_eo_wd'}

def world2Pixel(geoMatrix, lon, lat):
    ulX = geoMatrix[0]
    ulY = geoMatrix[3]
    xDist = geoMatrix[1]
    yDist = geoMatrix[5]
    x = int((lon - ulX) / xDist)
    y = int((lat - ulY) / yDist)
    return (x, y)

def imageToArray(i):
    b = i.tobytes()
    a=numpy.frombuffer(b, dtype="b")
    a.shape=i.im.size[1], i.im.size[0]
    return a

if __name__ == '__main__':
    
    #check data in the spooler
    
    csv_files = glob.glob(os.path.join(SPOOL_DIR, '*.csv'))    
    if len(csv_files)>1: 
        raise ValueError('found more than one csv!!!')
    if len(csv_files)==0:
        print 'no csv found!'
        sys.exit(0)
    csv_file = csv_files[0]
    dt_str = os.path.basename(csv_file).split('_')[0]
    run_date = datetime.strptime(dt_str, '%Y-%m-%d')
    run_dir = os.path.join(DATA_BASE_DIR, DATA_DIR_NAME, datetime.strftime(run_date, '%Y'), 
                              datetime.strftime(run_date, '%m'), datetime.strftime(run_date, '%d'))
    
    driver = gdal.GetDriverByName('GTiff')
    
    for the_set in image_sets:
        
        print 'managing %s...'%the_set
    
        raster_path = os.path.join(raster_base_path, image_sets[the_set])
        
        output_dir = os.path.join(run_dir, RUN_IMAGES_DIR_NAME, the_set)
        
        if not os.path.exists(output_dir): os.makedirs(output_dir)
        
        output_file_name = '%s_%s.tif'
        
        # Load the source data as a gdalnumeric array
        srcArray = gdalnumeric.LoadFile(raster_path)
    
        # Also load as a gdal image to get geotransform
        srcImage = gdal.Open(raster_path)
        geoTrans = srcImage.GetGeoTransform()
    
        #downscale the image
#         out_file = os.path.join(output_dir, output_file_name%(the_set, 'global'))
#         print 'creating global downscaled image (factor=%s) %s'%(downscaleFactors[the_set],out_file)
#         outGT = list(geoTrans)
#         outGT[1] = geoTrans[1]*downscaleFactors[the_set]
#         outGT[5] = geoTrans[5]*downscaleFactors[the_set]
#         outGT = tuple(outGT)
#         outCols = srcImage.RasterXSize/downscaleFactors[the_set]
#         outRows = srcImage.RasterYSize/downscaleFactors[the_set]
#         outDS = driver.Create(out_file, outCols, outRows, 1, gdal.GDT_Float32, options=['COMPRESS=LZW'])
#         outDS.SetGeoTransform(outGT)
#         outDS.SetProjection(srcImage.GetProjection()) # copy projection info
#         gdal.ReprojectImage(srcImage, outDS, None, None, gdal.GRA_Average)
        
        # Create an OGR layer from a boundary shapefile
        shapef = ogr.Open(SPLIT_SHP)
        lyr = shapef.GetLayer(os.path.split(os.path.splitext(SPLIT_SHP)[0])[1])
        
        for poly in lyr:
            
            feature_id = poly.GetField("ID")
            out_file = os.path.join(output_dir, output_file_name%(the_set, feature_id))
                        
            # Convert the poly extent to image pixel coordinates
            minX, maxX, minY, maxY = poly.GetGeometryRef().GetEnvelope()
            ulX, ulY = world2Pixel(geoTrans, minX, maxY)
            lrX, lrY = world2Pixel(geoTrans, maxX, minY)
            
            # Calculate the pixel size of the new image
            pxWidth = int(lrX - ulX)
            pxHeight = int(lrY - ulY)
        
            print 'clipping %s - extent: %s,%s,%s,%s - size: %s,%s'%(feature_id, minX, maxX, minY, maxY, pxWidth, pxHeight)

            clip = srcArray[ulY:lrY, ulX:lrX]
        
            pixels = []
            geom = poly.GetGeometryRef()        
            pts = None
            area=0
            for i in range(0, geom.GetGeometryCount()):
                tmp_area = geom.GetGeometryRef(i).GetArea()
                if tmp_area > area or pts==None:
                    area = tmp_area
                    pts = geom.GetGeometryRef(i)
             
            while pts.GetGeometryCount() > 0:
                pts = pts.GetGeometryRef(0)
            
            for p in range(pts.GetPointCount()):
                px, py = world2Pixel(geoTrans, pts.GetX(p), pts.GetY(p))
                pixels.append((px-ulX, py-ulY))
            rasterPoly = Image.new("L", (pxWidth, pxHeight), 1)
            rasterize = ImageDraw.Draw(rasterPoly)
            rasterize.polygon(pixels, 0)
            
#             t = time.time()
            
            mask = imageToArray(rasterPoly);
            
#             masked = numpy.multiply(clip, mask)
            masked = numpy.choose(mask, (clip, 255))
#             masked = clip
                
            outRaster = driver.Create(out_file, pxWidth, pxHeight, 1, gdal.GDT_Float32, options=['COMPRESS=DEFLATE'])
            outRaster.SetGeoTransform((minX, geoTrans[1], 0, minY if geoTrans[5]>0 else maxY, 0, geoTrans[5]))
            outband = outRaster.GetRasterBand(1)
            outband.WriteArray(masked)
            outRasterSRS = osr.SpatialReference()
            outRasterSRS.ImportFromEPSG(4326)
            outRaster.SetProjection(outRasterSRS.ExportToWkt())
            outband.FlushCache()
            
            outRaster = None
            clip=None
            
        gdal.ErrorReset()
        srcArray = None
        srcImage = None
        shapef = None
    
    print 'managing comparison...'
    
    dir_wd = os.path.join(run_dir, RUN_IMAGES_DIR_NAME, comparison['wd'])
    dir_eo = os.path.join(run_dir, RUN_IMAGES_DIR_NAME, comparison['eo'])
    dir_cmp = os.path.join(run_dir, RUN_IMAGES_DIR_NAME, comparison['dir'])    
    for eo_file in glob.glob(os.path.join(dir_eo, '*.tif')):
        if not os.path.exists(dir_cmp): os.makedirs(dir_cmp)
        idx = os.path.basename(eo_file).split('.')[0].split('_')[1]
        wd_file = os.path.join(dir_wd, '%s_%s.tif'%(comparison['wd'], idx))
        cmp_file = os.path.join(dir_cmp, '%s_%s.tif'%(comparison['dir'], idx))
        print 'processing %s '%(os.path.basename(cmp_file))
        EOWDComparator(eo_file, wd_file).save(cmp_file)
    
    #move the cvs file in the run directory
    os.rename(csv_file, os.path.join(run_dir, POP_FILE_NAME)) 
    #clear the spool
    for f in glob.glob(os.path.join(SPOOL_DIR, '*')):
        os.remove(f)
        
        