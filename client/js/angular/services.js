/**
 * Created by Manuel on 13/01/2017.
 */

rfseaApp.service("rfseaSrv", ['$http', '$filter', function($http, $filter)
{

    /*****************************************************************************************/
    /***************** LEAFLET MAP ***********************************************************/
    /*****************************************************************************************/

    this.createMapObject = function()
    {

        var mapTile_1 = L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {id: 'map_1', attribution:''});
        var mapTile_2 = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}', {id: 'map_2', attribution:''}); // Esri_WorldStreetMap
        var mapTile_3 = L.tileLayer('https://stamen-tiles-{s}.a.ssl.fastly.net/terrain/{z}/{x}/{y}{r}.png', {id: 'map_3', attribution:''}); // Stamen_Terrain
        var mapTile_4 = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/NatGeo_World_Map/MapServer/tile/{z}/{y}/{x}', {id: 'map_4', attribution:''}); //Esri_NatGeoWorldMap
        var mapTile_5 = L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {id: 'map_5', attribution:''}); // CartoDB.Positron
        var mapTile_6 = L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {id: 'map_6', attribution:''}); // CartoDB.Voyager

        // User not logged in - VISITOR
        var map = L.map('map', {
                center: [19.80, 91.00],
                zoom: 5,
                trackResize: true,
                layers: [mapTile_1, mapTile_2, mapTile_3, mapTile_4, mapTile_5, mapTile_6]
            }
        );

        map.zoomControl.setPosition('topright');

        var baseMaps = {
            "Stamen_Terrain": mapTile_3,
            "Esri_NatGeoWorldMap": mapTile_4,
            "CartoDB.Positron": mapTile_5,
            "CartoDB.Voyager": mapTile_6,
            "OpenStreetMap": mapTile_1,
            "Esri_WorldStreetMap": mapTile_2
        };

        // L.tileLayer(mapTile_1, {
        //     attribution: ''
        // }).addTo(map);

        L.control.layers(baseMaps).addTo(map);
        L.control.scale({position: 'bottomright'}).addTo(map);

        return map;

    }

    /*****************************************************************************************/
    /***************** COUNTRY DATA & MAPS ***************************************************/
    /*****************************************************************************************/

    /* This API allow the user to obtain a list of supported data. */
    this.getCountriesList = function (onSuccess, onError)
    {
        $http({
            method: 'GET',
            url: baseAPIurl + 'countries/'
        }).then(function (data) {
            if(onSuccess) onSuccess(data)
        },function(data){
            if(onError)onError(data)
        });
    }

    // This API allow the user to obtain the number of total affected population of a country.
    this.getCountryGlobals = function(countryID, date, onSuccess, onError)
    {
        var linkCall = baseAPIurl + 'data/' + countryID + '/globals/';

        if(date !== ''){
            linkCall = linkCall + '?d=' + date;
        }

        $http({
            method: 'GET',
            url: linkCall
        }).then(function (data) {
            if(onSuccess) onSuccess(data);
            
        },function(data){
            if(onError)onError(data)
        });
    }

    // This API allow the user to obtain a geojson with all the information of the provinces of a country.
    this.getCountryZones = function(countryID, date, onSuccess, onError)
    {

        var url = "";
        if(date == '')
        {
            url = baseAPIurl + 'data/' + countryID + '/zones/';
        } else {
            url = baseAPIurl + 'data/' + countryID + '/zones/?d=' + date;
        }

        $http({
            method: 'GET',
            url: url
        }).then(function (data) {
            if(onSuccess) onSuccess(data)
        },function(data){
            if(onError)onError(data)
        });
    }

    // This API allow the user to obtain the analysis of the estimated affected population.
    this.getProvinceDetails = function(countryID, zoneID, date, onSuccess, onError){

        var url = "";
        if(date == '')
        {
            url = baseAPIurl + 'data/' + countryID + '/' + zoneID + '/zonedetails/';
        } else {
            url = baseAPIurl + 'data/' + countryID + '/' + zoneID + '/zonedetails/?d=' + date;
        }

        $http({
            method: 'GET',
            url: baseAPIurl + 'data/' + countryID + '/' + zoneID + '/zonedetails/'
        }).then(function (data) {
            if(onSuccess) onSuccess(data)
        },function(data){
            if(onError)onError(data)
        });

    }

    // This API allow the user to obtain the byte stream of one image. This API call should be used as a url to a file.
    this.getImage = function(imgID, onSuccess, onError){

        $http({
            method: 'GET',
            url: baseAPIurl + 'data/img/?img=' + imgID
        }).then(function (data) {
            if(onSuccess) onSuccess(data)
        },function(data){
            if(onError)onError(data)
        });

    }

    /*****************************************************************************************/
    /***************** CHARTS DATA ***********************************************************/
    /*****************************************************************************************/

    // This API allow the user to obtain the details of the computed population affected for a country.
    this.getCountryDetails = function(countryID, date, onSuccess, onError){

        var url = "";
        if(date == '')
        {
            url = baseAPIurl + 'data/' + countryID + '/details/';
        } else {
            url = baseAPIurl + 'data/' + countryID + '/details/?d=' + date;
        }

        $http({
            method: 'GET',
            url: url
        }).then(function (data) {
            if(onSuccess) onSuccess(data)
        },function(data){
            if(onError)onError(data)
        });

    }

    // This API allow the user to obtain the analysis of the estimated affected population.
    this.getCountryAnalysis = function(countryID, onSuccess, onError){

        $http({
            method: 'GET',
            url: baseAPIurl + 'data/' + countryID + '/analysis/'
        }).then(function (data) {
            if(onSuccess) onSuccess(data)
        },function(data){
            if(onError)onError(data)
        });

    }

    /*****************************************************************************************/
    /***************** COUNTRY ZONE COLOR SETTINGS *******************************************/
    /*****************************************************************************************/

    this.setPaletteColor = function (colors, values) {
        // Return palette array for zones color and legend values

        var objItem = {
            color: '',
            label_min: 0,
            label_max: 0
        };

        var paletteColors = [];

        for (i=0; i < values.length; i++)
        {
            // for every values in palette array

            if(i == 0)
            {
                // First item

                objItem = {
                    // color: colors[0].includes('#') ? colors[0] : '#' + colors[0],
                    color: colors[0].indexOf('#') !== -1 ? colors[0] : '#' + colors[0],
                    label_min: 0,
                    label_max: values[0] * 1
                }

            } else {
                // no first element
                if(i == values.length - 1){
                    // Last item

                    objItem = {
                        color: colors[i].indexOf('#') !== -1 ? colors[i] : '#' + colors[i],
                        label_min: (values[i-1] + 1) * 1,
                        label_max: values[i] * 1
                    }

                    paletteColors.push(objItem);

                    objItem = {
                        color: colors[i + 1].indexOf('#') !== -1 ? colors[i + 1] : '#' + colors[i + 1],
                        label_min: (values[i] + 1) * 1,
                        label_max: (1000000 * 1)
                    }

                } else {
                    // Generic element
                    objItem = {
                        color: colors[i].indexOf('#') !== -1 ? colors[i] : '#' + colors[i],
                        label_min: (values[i-1] + 1) * 1,
                        label_max: values[i] * 1
                    }
                } // end if / else
            } // end if/else

            paletteColors.push(objItem);

        } // end for

        return paletteColors;
    }

    this.setColorMap = function(dataValue, paletteColors){

        // Set color object for the specific zone
        var color = $filter('filter')(paletteColors, function(item){
            return dataValue.properties.data >= item.label_min && dataValue.properties.data < item.label_max;
        });

        var objColor = {
            color: "#22293e",
            fillColor: color[0].color,
            fillOpacity: 0.5
        }

        return objColor;
    }


    /*****************************************************************************************/
    /***************** RUNS AVAILABLE & UTILITIES ********************************************/
    /*****************************************************************************************/

    this.getAvailableRuns = function(month, year, onSuccess, onError)
    {
        $http({
            method: 'GET',
            url: baseAPIurl + 'data/runs/' + year + '/' + month + '/'
        }).then(function (data) {
            if(onSuccess) onSuccess(data)
        },function(data){
            if(onError)onError(data)
        });
    }

    this.getAvailableYears = function(){
        // Return available years for date runs

        var startYear = startDateRuns;
        var today = new Date();
        var todayYear = today.getFullYear();
        var aYears = [];

        while (startYear <= todayYear){
            aYears.push(startYear);
            startYear = startYear + 1;
        }

        return aYears;

    }

    this.getAvailableMonths = function(year){
        // Return available months for date runs

        var aMonths = [];
        const monthNames = ["January", "February", "March", "April", "May", "June",
            "July", "August", "September", "October", "November", "December"
        ];

        var today = new Date();
        var todayYear = today.getFullYear();
        var todayMonth = today.getMonth();

        if(todayYear > year){
            // All months available
            aMonths = monthNames;

        } else {

            // Only past months
            for(i=0; i<= todayMonth; i++){
                aMonths.push(monthNames[i]);
            }

        }

        return aMonths;

    }


    /*****************************************************************************************/
    /***************** LOGIN / LOGOUT *************************************************************/
    /*****************************************************************************************/

    this.login = function (usr, psw, onSuccess, onError)
    {
        $http({
            method: 'POST',
            url: baseAPIurl + 'user/login/',
            data:{
                username: usr,
                password: psw
                // username: 'admin',
                // password: 'admin4rfsea'
            }
        }).then(function (data) {
            if(onSuccess) onSuccess(data)
        },function(data){
            if(onError)onError(data)
        });
    }

    this.getWhoami = function (onSuccess, onError)
    {
        $http({
            method: 'GET',
            url: baseAPIurl + 'user/whoami/'
        }).then(function (data) {
            if(onSuccess) onSuccess(data)
        },function(data){
            if(onError)onError(data)
        });
    }

    this.getLogout = function (onSuccess, onError)
    {
        $http({
            method: 'GET',
            url: baseAPIurl + 'user/logout/'
        }).then(function (data) {
            if(onSuccess) onSuccess(data)
        },function(data){
            if(onError)onError(data)
        });
    }

    this.sendRegistrationRequest = function(mailInfo, onSuccess, onError)
    {
        // Send mail for registration

    }

    this.setRPValue = function(value){

        if(value >= 0 && value <= 0.5){
            return 0;
        }

        if(value > 0.5 && value <= 1){
            return 1;
        }

        if(value >1 && value <= 10){
            return 10;
        }

        if(value >10 && value <= 50){
            return 50;
        }

        if(value >50 && value <= 100){
            return 100;
        }

        if(value >100 && value <= 500){
            return 500;
        }

        if(value >500 && value <= 1000){
            return 1000;
        }

        return value;

    }
}]);

