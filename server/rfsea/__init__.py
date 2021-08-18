
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
    
    