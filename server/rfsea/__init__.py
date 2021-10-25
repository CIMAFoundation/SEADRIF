
import csv
import io
from rfsea.models import LogActivity
import traceback

def add_logbook_activity(request, activity):
    try:
        LogActivity.objects.create(
            user = request.user.username,
            address = request.META['REMOTE_ADDR'],
            activity = activity
        )
    except:
        traceback.print_exc()
    

def get_logbook_csv(dt_from, dt_to):
    
    activities = LogActivity.objects.filter(dt__range=(dt_from, dt_to))
    
    output = io.BytesIO()
    writer = csv.writer(output, dialect=csv.excel, delimiter=';')
    writer.writerow([u'user', 'date', u'activity'])
    for activity in activities:
        writer.writerow([activity.user, activity.dt, activity.activity]) 

    csv_string = output.getvalue()
    output.close()
    
    return csv_string
    