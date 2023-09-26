'''
Created on Mar 26, 2018

@author: doy
'''
from datetime import datetime     

if __name__ == '__main__':
     #obtain the image
     
     now = datetime.now()
     #set timezome to now to gmt+2
     from datetime import timezone, timedelta
     now = now.replace(tzinfo=timezone.utc).astimezone(tz=timezone(timedelta(hours=2)))
     
     
     print(now.strftime("%a %b %d %Y"))

     str_date = "Thu Aug 10 2023 17:56:12 GMT 0200 (Central European Summer Time)"
     str_date = " ".join(str_date.split(" ")[:4])
     print(str_date)
     #convert str_date to date
     date = datetime.strptime(str_date, '%a %b %d %Y')

     print(date)