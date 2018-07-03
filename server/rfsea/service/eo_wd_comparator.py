'''
Created on Feb 16, 2018

@author: doy
'''
import gdalnumeric
import gdal
import osr
import gdalconst
import time
import os
import numpy

# def pixel2World(geoMatrix, x, y):
#     ulX = geoMatrix[0]
#     ulY = geoMatrix[3]
#     xDist = geoMatrix[1]
#     yDist = geoMatrix[5]
#     lon = (float(x) * float(xDist)) + float(ulX)
#     lat = float(ulY) - (float(y) * float(yDist))
#     return (lon, lat)

def compare(eo, wd):
    if eo==255: return 255
    wd = 1 if wd <= 0.3 else 3 
    if eo==2: return 0
    if eo == 1 and wd == 1: return 1
    if eo == 0 and wd == 1: return 2
    if eo == 0 and wd == 3: return 3
    if eo == 3 and wd == 3: return 4
    if eo != wd:return 5    
    print 'NOOOOOO eo=%s wd=%s'%(eo, wd)
    return 255

class EOWDComparator(object):

    def __init__(self, eo_file, wd_file):
        self.eo_file = eo_file
        self.wd_file = wd_file
        self.wdImage = gdal.Open(self.wd_file)
        self.wdGeoTrans = self.wdImage.GetGeoTransform()
        self.wdProj = self.wdImage.GetProjection()
        
        self.eoImage = gdal.Open(self.eo_file)
        self.eoGeoTrans = self.eoImage.GetGeoTransform()        
        self.eoProj = self.eoImage.GetProjection()
        self.counter = 0

    def regridEO(self, out_file):
        
        t = time.time()
#         print 'reprojecting...'
        eoReprojectedImage = gdal.GetDriverByName('GTiff').Create(out_file, self.wdImage.RasterXSize, self.wdImage.RasterYSize, 1, gdalconst.GDT_Byte)
        eoReprojectedImage.SetGeoTransform(self.wdGeoTrans)
        eoReprojectedImage.SetProjection(self.wdProj)
        gdal.ReprojectImage(self.eoImage, eoReprojectedImage, self.eoProj, self.wdProj, gdalconst.GRA_NearestNeighbour)
        del eoReprojectedImage
#         print '\tDONE: %s'%(time.time() - t)
    
    def save(self, out_file):
        #read the wd data
        wd_data = gdalnumeric.LoadFile(self.wd_file)
        
        #regrid the eo data and read them
        regridded_eo_file = '%s_eo_regridded.tif' % out_file
        self.regridEO(regridded_eo_file)
        eo_data = gdalnumeric.LoadFile(regridded_eo_file)
        
        #the destination array
#         print 'comparing...'
        t = time.time()
        cmp_func = numpy.vectorize(compare, otypes=[numpy.uint8])
        
        cmp_data = cmp_func(eo_data, wd_data)
        
#         cmp_data = numpy.zeros(wd_data.shape, dtype=numpy.uint8)        
#         for x in range(wd_data.shape[0]):
# #             print '%s / %s --> sum eo: %s sum wd: %s'%(x, wd_data.shape[0], numpy.sum(eo_data[x]), numpy.sum(wd_data[x]))
#             cmp_data[x] = cmp_func(eo_data[x], wd_data[x])
# #         print '\tDONE: %s'%(time.time() - t)
                    
        driver = gdal.GetDriverByName('GTiff')
        outRaster = driver.Create(out_file, wd_data.shape[1], wd_data.shape[0], 1, gdal.GDT_Byte, options=['COMPRESS=DEFLATE'])
        outRaster.SetGeoTransform(self.wdGeoTrans)
        outband = outRaster.GetRasterBand(1)
        outband.WriteArray(cmp_data)
        outRasterSRS = osr.SpatialReference()
        outRasterSRS.ImportFromEPSG(4326)
        outRaster.SetProjection(outRasterSRS.ExportToWkt())
        outband.FlushCache()
        
        os.remove(regridded_eo_file)
                
    
        