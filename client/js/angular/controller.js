/**
 * Created by Manuel on 13/01/2017.
 */

rfseaApp.controller('rfseaCtrl', function($rootScope, $scope, $filter, $window, rfseaSrv)
{

    $scope.userinfo = {
        usrlogin: "",
        usrlevel: "",
        usrloginstatus: false
    };
    $scope.login = {
        status:false,
        type: ""
    };
    $scope.bDisclaimer = false;

    $scope.district_list = [];
    $scope.zonesData = [];
    $scope.palettePosition = 'bottomright';
    $scope.paletteColors = [];
    $scope.paletteColors_saved = [];
    $scope.maptype = "scale";
    $scope.bPeople = true;
    $scope.legendtitle= "";

    // Get user name
    rfseaSrv.getWhoami(function(data)
    {
        if(data.status == 200){
            // User logged in
            $scope.userinfo = {
                usrlogin: data.data,
                usrlevel: "seaDrif",
                usrloginstatus: true
            };

            localStorage.setItem('rfsea_login', JSON.stringify($scope.userinfo));
            $window.location.href = "countries.html";

        } else {
            // Visitor
            var map = L.map('map', {
                    center: [19.80, 91.00],
                    zoom: 5,
                    trackResize: true
                }
            );

            map.zoomControl.setPosition('topright');

            L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: ''
            }).addTo(map);

        }

    }, function(data)
    {

        // User not logged in - VISITOR

        var map = rfseaSrv.createMapObject();

        getZonesForGuest (map);

    });

    $scope.setLoginView = function(type){
        $scope.login.status = !$scope.login.status;
        $scope.login.type = type;
    }

    function getZonesForGuest (map){

        rfseaSrv.getCountryDataForGuest(function(data)
        {
            $scope.district_list = data.data.geojson.features;

            // Set color Palette
            setPaletteColor(data.data.pal.colors, data.data.pal.values);

            $scope.zonesData = data.data.geojson.features;

            loadMapLayers( map);

        }, function(data)
        {
            console.log(data);
        });
    }

    function setPaletteColor(colors, values) {
        // Set the palette objects for zones color and legend values

        $scope.paletteColors = rfseaSrv.setPaletteColor(colors, values);
        $scope.paletteColors_saved = angular.copy($scope.paletteColors);

    }

    function loadMapLayers(map){

        var geojsondata = L.geoJSON($scope.district_list, {
            style: function (item) {
                return setColorMap(item);
            },
            onEachFeature: onEachFeature
        }
        ).addTo(map);

        if(!bMapRaster){
            map.fitBounds(geojsondata.getBounds());
        }

    }

    function onEachFeature(feature, layer) {
        //bind click

        layer.myTag = "CountryGEOJson";

        var customPopup = feature.properties.name + ': ' + $filter('number')(feature.properties.data);
        var customOptions = {
            'maxWidth': '400',
            'width': '200',
            'className' : 'popupCustom',
            'autoPan': false
        }

        layer.bindPopup(customPopup, customOptions);

        layer.on('mouseover', function(){
            this.openPopup();
        });
        layer.on('mouseout', function(){
            this.closePopup();
        });
    }

    function setColorMap(dataValue){
        return rfseaSrv.setColorMap(dataValue, $scope.paletteColors_saved);
    }

    /***************************************************/
    /********* SIDEBAR SHOW/HIDE ***********************/
    /***************************************************/
    $scope.bShowBar = true;
    $scope.showHideSideBar = function()
    {
        $scope.bShowBar = !$scope.bShowBar;
    }

    /***************************************************/
    /********* DISCLAIMER ******************************/
    /***************************************************/

    $scope.showDisclaimer = function () {

        $scope.bDisclaimer = !$scope.bDisclaimer;

    }

});