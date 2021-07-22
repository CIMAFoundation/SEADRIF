'''
Created on Feb 8, 2018

@author: doy
'''
import json
import os
import time

from PIL import Image
from PIL import ImageDraw
import gdal
import numpy
import ogr
from osgeo import gdalnumeric
from rfsea.service.eo_wd_comparator import EOWDComparator


raster_base_path = '/home/doy/tmp/rfsea/tiff'

output_base_dir = '/home/doy/tmp/rfsea/data/runs/2018/02/06/images'

image_sets = {
    'wd': 'merged_output1.tif_com.tif',
    'eo': 'output.tif',
    'compare_eo_wd': ['eo', 'wd'] 
    }


palettes = {
    'wd': {
        'values': [0.01, 0.3, 1, 3, 5],
        'colors': [
            255,0,255,
            255,255,255,
            126,170,252,
            2,2,254,
            20,50,105,
            ],
        },
#     'imp': {
#         'values': [0.01, 20, 100, 1000, 5000, 1000000],
#         'colors': [
#             255,0,255,
#             255,250,181,
#             246,204,98,
#             238,145,85,
#             228,81,67,
#             185,46,60,
#             ],
#         },
    'eo': {
        'values': [0, 1, 2, 3],
        'colors': [
            200,200,200,
            255,255,255,
            127,127,255,
            0,0,255,
            ],
        'transparency': 1
        },
    'compare_eo_wd': {
        'values': [0, 1, 2, 3, 4, 5],
        'colors': [
            0,0,255,
            0,255,0,
            255,255,0,
            255,127,0,
            255,0,0,
            127,127,127],
        'transparency': 0
        }
            
    }



def world2Pixel(geoMatrix, lon, lat):
    ulX = geoMatrix[0]
    ulY = geoMatrix[3]
    xDist = geoMatrix[1]
    yDist = geoMatrix[5]
    x = int((lon - ulX) / xDist)
    y = int((ulY - lat) / yDist)
    return (x, y)


values = None
def getPaletteIndex(v):
#     values = palette['values']
    for i, pv in enumerate(values):
        if pv > v: return i-1 if i>0 else 0
    return len(values)-1

if __name__ == '__main__':
    
    for the_set in image_sets:
    
        if the_set == 'compare_eo_wd':
            raster_file_name = '%s_%s.tif'%(the_set, '_'.join(image_sets[the_set]))
            eo_raster_path = os.path.join(raster_base_path, image_sets[image_sets[the_set][0]])
            wd_raster_path = os.path.join(raster_base_path, image_sets[image_sets[the_set][1]])
            raster_path = os.path.join(raster_base_path, raster_file_name)
            EOWDComparator(eo_raster_path, wd_raster_path).save(raster_path)        
        else:
            raster_path = os.path.join(raster_base_path, image_sets[the_set])
        
        palette = palettes[the_set]
        values = palette['values']

        continue
        
        shapefile_path = '/home/doy/tmp/rfsea/provinces/provinces.shp'
        output_dir = os.path.join(output_base_dir, the_set)
        if not os.path.exists(output_dir): os.makedirs(output_dir)
        
        output_file_name = '%s_%s.png'
        output_geo_file_name = '%s_%s.json'
        
        # Load the source data as a gdalnumeric array
        srcArray = gdalnumeric.LoadFile(raster_path)
    
        # Also load as a gdal image to get geotransform
        srcImage = gdal.Open(raster_path)
        geoTrans = srcImage.GetGeoTransform()
    
        # Create an OGR layer from a boundary shapefile
        shapef = ogr.Open(shapefile_path)
        lyr = shapef.GetLayer(os.path.split(os.path.splitext(shapefile_path)[0])[1])
        
        for poly in lyr:
            
            feature_id = poly.GetField("ID")
            out_file = os.path.join(output_dir, output_file_name%(the_set, feature_id))
            out_geo_file = os.path.join(output_dir, output_geo_file_name%(the_set, feature_id))
                        
            # Convert the poly extent to image pixel coordinates
            minX, maxX, minY, maxY = poly.GetGeometryRef().GetEnvelope()
            ulX, ulY = world2Pixel(geoTrans, minX, maxY)
            lrX, lrY = world2Pixel(geoTrans, maxX, minY)
            
            print 'clipping %s - extent: %s,%s,%s,%s'%(feature_id, minX, maxX, minY, maxY)
        
            # Calculate the pixel size of the new image
            pxWidth = int(lrX - ulX)
            pxHeight = int(lrY - ulY)
        
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
            
            transparencyIdx = 0#palette['transparency'] if 'transparency' in palette else 0
             
            for p in range(pts.GetPointCount()):
                px, py = world2Pixel(geoTrans, pts.GetX(p), pts.GetY(p))
                pixels.append((px-ulX, py-ulY))
            rasterPoly = Image.new("1", (pxWidth, pxHeight), transparencyIdx)
            rasterize = ImageDraw.Draw(rasterPoly)
            rasterize.polygon(pixels, 255)
            
            t = time.time()
            v = numpy.vectorize(getPaletteIndex)
            pi = v(clip).astype('byte')
            print 'palette indexes comnputed: %s'%(time.time()-t)
            
    #         t = time.time()
            out_map = Image.fromarray(pi, 'P')
            out_img = Image.new("P", (pxWidth, pxHeight), 0)                
            out_img.paste(out_map, None, rasterPoly)
            out_img.putpalette(palette['colors'])
            
            print 'drawed: %s'%(time.time()-t)
                        
            out_img.save(out_file, transparency=transparencyIdx)
            
            with open(out_geo_file, 'w') as outfile:
                json.dump({
                    'sw': [minY, minX],
                    'ne': [maxY, maxX],
                    }, outfile)
            
            
        gdal.ErrorReset()
