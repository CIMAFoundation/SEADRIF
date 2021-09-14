/**
 * Created by Manuel on 13/01/2017.
 */

var rfseaApp = angular.module('rfseaApp', ['ngCookies', 'pascalprecht.translate']);

rfseaApp.run(['$http', '$cookies', function($http, $cookies) {
    $http.defaults.headers.post['X-CSRFToken'] = $cookies.csrftoken;
}]);

//var baseAPIurl = "https://seadrif2.cimafoundation.org/seadrif_test/api/";
var baseAPIurl = "http://seadrif2.cimafoundation.org/seadrif/api/";

var dollarMultiplier = 0;
var startDateRuns = 2018;
var rpValueApp = 0;
var bMapRaster = false;

rfseaApp.config(function($translateProvider, $translatePartialLoaderProvider, $locationProvider, $httpProvider) {

    $httpProvider.defaults.withCredentials = true

    /* translate provider - INIZIO */
    $translateProvider.useLoader('$translatePartialLoader', {
        urlTemplate: 'languages/{lang}/{part}.json'
    });

    $translatePartialLoaderProvider.addPart('labels');

    $translateProvider.preferredLanguage('en_EN');
    $translateProvider.fallbackLanguage('en_EN');

    $translateProvider.useSanitizeValueStrategy('escaped');

    /* translate provider - FINE */

    $locationProvider.html5Mode({
        enabled: true,
        requireBase: false
    });

});