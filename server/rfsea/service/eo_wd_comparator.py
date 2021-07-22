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

# eo: 
#     0: Undefined Pixels
#     1: No Water
#     2: Permanent Water
#     3: Flooded Pixel

EO_UNDEFIND = 0
EO_NO_WATER = 1
EO_PERMANENT_WATER = 2
EO_FLOODED = 3

# compare:
#     0: Permanent Water
#     1: No Water
#     2: Likely Not Flooded
#     3: Likely To Be Flooded
#     4: Flooded Pixels
#     5: Uncertain Pixels

CMP_PERMANENT_WATER = 0
CMP_NO_WATER = 1
CMP_LIKELY_NOT_FLOODED = 2
CMP_LIKELY_TO_BE_FLOODED = 3
CMP_FLOODED = 4
CMP_UNCERTAIN = 5

# def compare(eo, wd):
#     if eo==255: return 255
#     wd = 1 if wd <= 0.3 else 3 
#     if eo==2: return 0
#     if eo == 1 and wd == 1: return 1
#     if eo == 0 and wd == 1: return 2
#     if eo == 0 and wd == 3: return 3
#     if eo == 3 and wd == 3: return 4
#     if eo != wd:return 5
#     print 'NOOOOOO eo=%s wd=%s'%(eo, wd)
#     return 255


def compare(eo, wd):
    if eo==255: return 255
    wd = 1 if wd <= 0.3 else 3 
    
#     EO: Permanent Water  + Modello: Any class -> Final code: Permanent Water
    if eo==EO_PERMANENT_WATER: return CMP_PERMANENT_WATER
    
#     EO: Unclassified (blind spot)  + Modello: Flood -> Final code: Likely to be Flooded
    if eo == EO_UNDEFIND and wd == 3: return CMP_LIKELY_TO_BE_FLOODED
    
#     EO: Unclassified (blind spot)  + Modello:  noFlood -> Final code: Likely not flooded     
    if eo == EO_UNDEFIND and wd == 1: return CMP_LIKELY_NOT_FLOODED

#     EO: noFlood  + Modello:  noFlood -> Final code: No Water
    if eo == EO_NO_WATER and wd == 1: return CMP_NO_WATER
    
#     EO: noFlood  + Modello:  Flood -> Final code: Likely to be Flooded
    if eo == EO_NO_WATER and wd == 3: return CMP_LIKELY_TO_BE_FLOODED
    
#     EO: Flooded  + Modello:  Flood -> Final code: Flooded Areas
    if eo == EO_FLOODED and wd == 3: return CMP_FLOODED
    
#     EO: Flooded  + Modello:  noFlood -> Final code: Likely to be Flooded
    if eo == EO_FLOODED and wd == 1: return CMP_LIKELY_TO_BE_FLOODED
    
#     if eo != wd:return 5    
    
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
                
    
        
