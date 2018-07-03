'''
Created on Mar 26, 2018

@author: doy
'''
from numpy.distutils.misc_util import rel_path

from rfsea.service.deltares_reader import DeltaresReader


if __name__ == '__main__':
     #obtain the image
    reader = DeltaresReader('')
    bytes = reader.getImg('2018/03/26/images/wd/wd_global.tif');
    
    print len(bytes)