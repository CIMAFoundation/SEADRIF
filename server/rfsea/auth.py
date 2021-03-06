"""
dds client resources
"""
from acroweb.core.resources import AcrowebResource, URLHelper
from tastypie.http import HttpUnauthorized, HttpForbidden
from django.contrib.auth import authenticate, login, logout
from tastypie.exceptions import Unauthorized
from tastypie.authorization import Authorization
import json


class RFSEAAuthorization(Authorization):
        
    def read_list(self, object_list, bundle):                
        user = bundle.request.user
        userSettingSet = user.usersetting_set.all()
        if userSettingSet and len(userSettingSet)>0:
            userSettings = json.loads(userSettingSet[0].data)
            if 'country' in userSettings:      
                
                if userSettings['country'] == 'all': 
                    return object_list          
                
                return object_list.filter(pk=int(userSettings['country']))
        
        return []
        
    def read_detail(self, object_list, bundle):
        raise Unauthorized("operation not allowd")
    
    def create_list(self, object_list, bundle):
        raise Unauthorized("operation not allowd")
    
    def create_detail(self, object_list, bundle):
        raise Unauthorized("operation not allowd")

    def update_list(self, object_list, bundle):
        raise Unauthorized("operation not allowd")
    
    def update_detail(self, object_list, bundle):
        raise Unauthorized("operation not allowd")

    def delete_list(self, object_list, bundle):
        raise Unauthorized("operation not allowed")

    def delete_detail(self, object_list, bundle):
        raise Unauthorized("operation not allowed")



class LoginResource(AcrowebResource):
    
    class Meta:
        include_resource_uri = False
        resource_name = 'user'
        
    def getMyUrl(self):
        return [
                URLHelper('/login', 'login'),
                URLHelper('/logout', 'logout'),
                URLHelper('/whoami', 'whoami'),
                ]
        
    def login(self, request, **kwargs):
        
        self.method_check(request, allowed=['post'])
        data = self.deserialize(request, request.body, format=request.META.get('CONTENT_TYPE', 'application/json'))
        username = data.get('username', '')
        password = data.get('password', '')

#         self.method_check(request, allowed=['get'])
#         username = request.GET['username']
#         password = request.GET['password']
        
        user = authenticate(username=username, password=password)
        if user:
            if user.is_active:
                login(request, user)
                return self.create_response(request, {
                    'success': True
                })
            else:
                return self.create_response(request, {
                    'success': False,
                    'reason': 'disabled',
                    }, HttpForbidden )
        else:
            return self.create_response(request, {
                'success': False,
                'reason': 'incorrect',
                }, HttpUnauthorized )

    def logout(self, request, **kwargs):
        self.method_check(request, allowed=['get'])
        if request.user and request.user.is_authenticated():
            logout(request)
            return self.create_response(request, { 'success': True })
        else:
            return self.create_response(request, { 'success': False }, HttpUnauthorized)

    def whoami(self, request, **kwargs):
        self.method_check(request, allowed=['get'])
        if request.user and request.user.is_authenticated():
            return self.create_response(request, request.user.username)
        else:
            return self.create_response(request, None, HttpUnauthorized)
