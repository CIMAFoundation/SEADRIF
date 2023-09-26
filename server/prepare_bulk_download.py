# initialize django
import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "rfsea.settings")
django.setup()



from rfsea.models import Country
from rfsea.service.deltares_reader import DeltaresReader
import datetime
from rfsea.settings import DATA_BASE_DIR, DELTARES_LOG_DIR, DELTARES_OUTPUT_DIR, DELTARES_WORK_DIR
import io
import zipfile
import glob

dt1 = datetime.datetime(2023, 9, 10)
dt2 = datetime.datetime(2023, 9, 15)

output_dir = '/share/seadrif/bulk_dowload'

data_types = {
    'eo': 'eo', 
    'wd': 'model',
    'compare_eo_wd': 'eo_model'
}


def prepare_work(day_run, output_path):
    
    #get last valid day
    _, day_run = DeltaresReader(None).getRunDir(day_run)

    #go to the next days for the work dir
    day = day_run + datetime.timedelta(days=1)
    
    work_run_dir = os.path.join(DELTARES_WORK_DIR, day.strftime('%Y-%m-%d'))
    out_run_dir = os.path.join(DELTARES_OUTPUT_DIR, day.strftime('%Y-%m-%d'))

    zip_file = zipfile.ZipFile(output_path, 'w')

    #add all cvs files to archive
    csv_files = glob.glob(os.path.join(work_run_dir, '*.csv')) 
    for f in csv_files:
        zip_file.write(f, 'work_%s/%s'%(day.strftime('%Y%m%d'), os.path.basename(f)))
    
    #add all aoutmatch files to archive
    outmatch_files = glob.glob(os.path.join(out_run_dir, 'outmatch??.txt')) 
    for f in outmatch_files:
        zip_file.write(f, 'work_%s/%s'%(day.strftime('%Y%m%d'), os.path.basename(f)))

    #add log files
    for log_file_base_name in ['log', 'log_deltares', 'log_pelc']:      
        log_file = os.path.join(DELTARES_LOG_DIR, '%s_%s.txt'%(log_file_base_name, day.strftime('%Y-%m-%d')))
        if os.path.exists(log_file):
            zip_file.write(log_file, 'work_%s/%s'%(day.strftime('%Y%m%d'), os.path.basename(log_file)))

    zip_file.close()    





if not os.path.exists(output_dir):
    os.makedirs(output_dir)

day = dt1
while day <= dt2:
    print(day)

    day_output_dir = os.path.join(output_dir, day.strftime("%Y"), day.strftime("%m"), day.strftime("%d"))
    if not os.path.exists(day_output_dir):
        os.makedirs(day_output_dir)

    # computed maps
    countries = Country.objects.all()
    for country in countries:
        print('\t%s'%country.name)
        reader = DeltaresReader(country)        
        for data_type in data_types:
            print('\t\t%s'%data_type)
            data = reader.getCountryGeoTiffBytes(day, data_type)

            if data is not None:
                filename = '%s_%s_%s.tif'%(country.name, data_types[data_type], day.strftime("%Y%m%d"))
                with open(os.path.join(day_output_dir, filename), 'wb') as f:
                    f.write(data)

    # deltares work data
    print('\tWork data')
    output_path = os.path.join(day_output_dir, 'work_data_%s.zip'%day.strftime('%Y%m%d'))
    prepare_work(day, output_path)


    day += datetime.timedelta(days=1)
