from tastypie.resources import ModelResource
from rfsea.models import Country
from tastypie.authentication import SessionAuthentication
from tastypie import authorization
from rfsea.auth import RFSEAAuthorization


class CountryResource(ModelResource):
    class Meta():
        limit = 0
        include_resource_uri = False
        queryset = Country.objects.all()
        resource_name = 'countries'
        list_allowed_methods = ['get']
        authentication = SessionAuthentication()
        authorization = RFSEAAuthorization()
    def dehydrate(self, bundle):
        [strX, strY] = bundle.data['curve'].split(';')
        x = map(float, strX.split(','))
        y = map(float, strY.split(','))
        bundle.data['curve'] = {
            'x':x,
            'y': y
            }
        return bundle
