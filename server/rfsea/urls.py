from django.conf.urls import patterns, include, url
from django.contrib import admin
from tastypie.api import Api
from rfsea.models_resources import CountryResource
from rfsea.resources import RFSEAResource
from rfsea.auth import LoginResource


rfseaApi = Api(api_name="api")

rfseaApi.register(CountryResource())

rfseaApi.register(RFSEAResource())

rfseaApi.register(LoginResource())

urlpatterns = patterns('',
    url(r'^admin/', include(admin.site.urls)),
    url(r'', include(rfseaApi.urls)),
)