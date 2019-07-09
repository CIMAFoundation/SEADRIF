/**
 * Created by Manuel on 21/02/2018.
 */

rfseaApp.controller('rfsea_countries_Ctrl', function($rootScope, $scope, $window, $timeout, $filter, $location, rfseaSrv, $q)
{

    $scope.bPeople = true;
    // $scope.bCountryHome = {status: true};
    $scope.bDistrict = false;
    $scope.bRiskProfile = {status: false};
    $scope.bdistrictDetails = {status: false};
    $scope.bDatePicker = false;
    $scope.maptype = "scale"; // Only 'scale' or 'value-translate'
    $scope.legendtitle= "";
    $scope.maptypeview = "scale";
    $scope.countrySelect = "";
    $scope.district_list = [];
    $scope.district_list_people = [];
    $scope.district_list_dollar = [];
    $scope.userinfo = {
        usrlogin: "",
        usrlevel: "",
        usrloginstatus: false
    };
    $rootScope.countriesList = [];

    // Date picker
    $scope.dateSelected = ""; // Format YYYY-MM-GG
    $scope.availableYears = rfseaSrv.getAvailableYears();
    $scope.yearSelected = new Date().getFullYear();
    $scope.availableMonths = rfseaSrv.getAvailableMonths($scope.yearSelected);
    $scope.monthSelected = -1;
    $scope.runsAvailable = [];

    var bDistrictView = $location.search().p;

    $scope.country_globals =
        {
            data_day: new Date(),   // Country Global: available date
            pop: ""                 // Country Global: affected population
        };

    $scope.palettePosition = 'bottomright';
    $scope.paletteColors = [];
    $scope.paletteColors_saved = [];

    $scope.userinfo = JSON.parse(localStorage.getItem('rfsea_login'));

    if(!$scope.userinfo){
        // There isn't a cookies saved
        $scope.userinfo = {
            usrlogin: "",
            usrlevel: "",
            usrloginstatus: false
        };
    }

    $scope.sliderData = {
        data: {
            pop: 0,
            thr1: 0,
            thr2: 0,
            people: $scope.bPeople,
            pop_est:0,
            curve_x: [],
            curve_y: []
        }
    };

    $scope.totScore = 0;

    var map = rfseaSrv.createMapObject();

    loadMapLayers(false, false);

    $scope.zonesData = [];

    init();

    //Verify login info
    // Get user name
    rfseaSrv.getWhoami(function(data)
    {
        //working right

        $timeout(function(){


        }, 500)

    }, function(data)
    {

        // User not logged in - VISITOR, reset all coookies
        localStorage.removeItem('rfsea_login');
        localStorage.removeItem('rfsea_country_selected');
        $window.location.href = "index.html";

    });

    // ********************************************************** //
    // **************** FUNCTIONS ******************************* //
    // ********************************************************** //

    // Init country list view & data
    function init()
    {

        if ($scope.userinfo.usrloginstatus) {
            // User logged in

            // Get the list of available countries
            rfseaSrv.getCountriesList(function(data)
            {

                // Countries list OK
                $rootScope.countriesList = data.data.objects;
                $scope.countrySelected = JSON.parse(localStorage.getItem('rfsea_country_selected'));

                if($scope.countrySelected){

                    // Load new data from server
                    var serverData = [];

                    serverData = $filter('filter')($rootScope.countriesList, function(item){
                        return item.id == $scope.countrySelected.id;
                    });

                    if (serverData && serverData.length > 0){
                        $scope.countrySelected = serverData[0];
                    }

                    // $scope.countrySelect = $scope.countrySelected.name;

                    setFirstCountryDatails();

                } else {
                    //No country saved in cookies
                    if($rootScope.countriesList.length > 0){

                        // Set first country as default country to view
                        setCountrySelected($scope.countriesList[0]);
                    }
                }

                $scope.$watch('countrySelected', function (newVal, oldVal) {
                    if(newVal !== oldVal){
                        rfseaSrv.clearMap(map);
                        $scope.maptype = 'scale';
                        bMapRaster = false;
                        setCountrySelected($scope.countrySelected);

                        $timeout(function(){
                            $scope.maptypeview = 'scale';
                        }, 1500)
                    }
                });

            }, function(data)
            {
                // Error
                console.log(data);
                vex.dialog.alert({
                    message: 'API loading error.'
                })
            });


        } else {
            // User not logged in
            $window.location.href = "index.html";
        }

    };

    // Select one contry
    function setCountrySelected(country) {

        $scope.countrySelected = country;
        $scope.countrySelect = country.name;

        setFirstCountryDatails();
        //loadCountryZones();

        localStorage.setItem('rfsea_country_selected', JSON.stringify(country));

    }

    // Set first country details page
    function setFirstCountryDatails()
    {
        dollarMultiplier = $scope.countrySelected.pcost;
        $scope.dollarMultiplier = dollarMultiplier;

        $scope.sliderData.data.thr1 = $scope.countrySelected.thr1;
        $scope.sliderData.data.thr2 = $scope.countrySelected.thr2;

        // Global data for Country
        rfseaSrv.getCountryGlobals($scope.countrySelected.id, $scope.dateSelected, function(data)
        {
            // Country globals
            $scope.country_globals.data_day = new Date(data.data.day);
            $scope.country_globals.pop = data.data.pop;

            $scope.dateFrom = angular.copy($scope.country_globals.data_day);
            $scope.dateFrom.AddDays(-7);
            $scope.dateTo = $scope.country_globals.data_day;

            $scope.sliderData.data.pop = data.data.pop;
            $scope.sliderData.data.thr1 = $scope.countrySelected.thr1;
            $scope.sliderData.data.thr2 = $scope.countrySelected.thr2;

            loadCountryZones();

        }, function(data)
        {
            // Error
            console.log(data);
            vex.dialog.alert({
                message: 'No data availables.'
            })
        });

    }

    function loadCountryZones()
    // Load country selected zones
    {

        rfseaSrv.getCountryZones($scope.countrySelected.id, $scope.dateSelected, function(data)
        {
            $scope.district_list = data.data.geojson.features;

            // Set color Palette
            setPaletteColor(data.data.pal.colors, data.data.pal.values);

            $scope.zonesData = data.data.geojson.features;

            $scope.totScore = getTotalSumData($scope.zonesData);

            loadMapLayers(false, true);

            // var geojsondata = L.geoJSON(data.data.geojson.features, {
            //         style: function (item) {
            //             return setColorMap(item);
            //         },
            //         onEachFeature: onEachFeature
            //     }
            // ).addTo(map);
            //
            // map.fitBounds(geojsondata.getBounds());
            // map.setZoom(5);

            $scope.selectDistrict = function(obj){

                var geojson_district = L.geoJSON(obj.geometry);
                map.fitBounds(geojson_district.getBounds());

            }

        }, function(data)
        {
            // Error
            console.log(data);
            vex.dialog.alert({
                message: 'API loading error.'
            })
        });

        loadRiskProfileData();
    }

    function loadRiskProfileData()
    // Load risk profile data
    {

        // Check if country is already set
        if($scope.countrySelected){
            // Country Selected

            $scope.datachart = {
                idCountry: $scope.countrySelected.id,
                countryName: $scope.countrySelected.name,
                population: $scope.countrySelected.pop,
                thrLow: $scope.countrySelected.thr1,
                thrHight: $scope.countrySelected.thr2,
                dateFrom: $scope.dateFrom,
                dateTo: $scope.dateTo
            };

            rfseaSrv.getCountryDetails($scope.countrySelected.id, $scope.dateSelected, function(data)
            {
                // Country details OK
                $scope.populationDetails = {
                    pop_est: 0,
                    pop_hg: 0,
                    pop_hl: 0,
                    desc_hg: "",
                    long_desc_hg: "",
                    desc_hl: "",
                    long_desc_hl: ""
                };

                $scope.populationDetails.pop_est = data.data.pop_est;
                $scope.populationDetails.pop_hg = data.data.pop_hg;
                $scope.populationDetails.pop_hl = data.data.pop_hl;
                $scope.populationDetails.desc_hl = data.data.hl;
                $scope.populationDetails.long_desc_hl = data.data.hl_descr;
                $scope.populationDetails.desc_hg = data.data.hg;
                $scope.populationDetails.long_desc_hg = data.data.hg_descr;

                $scope.countrycurve = $scope.countrySelected.curve;

                $scope.sliderData.data.curve_x = $scope.countrycurve.x;
                $scope.sliderData.data.curve_y = $scope.countrycurve.y;
                $scope.sliderData.data.pop_est = $scope.populationDetails.pop_est;

                setFirstView();

            }, function(data)
            {
                // Error
                console.log(data);
                vex.dialog.alert({
                    message: 'API loading error.'
                })
            });

        } else {
            // No country selected, go to countries list
            $window.location.href = "countries.html";
        }
    }

    // Reload Globals Variable
    function ReloadGlobals(date, step)
    {

        // Convert format date for API call
        date = $filter("date")(date, 'yyyyMMdd');

        rfseaSrv.getCountryGlobals($scope.countrySelected.id, date, function(data)
        {
            // Country globals
            $scope.country_globals.data_day = new Date(data.data.day);
            $scope.country_globals.pop = data.data.pop;

            $scope.dateFrom = angular.copy($scope.country_globals.data_day);
            $scope.dateFrom.AddDays(-7);
            $scope.dateTo = $scope.country_globals.data_day;

        }, function(data)
        {
            // Error
            console.log(data);
            $scope.country_globals.data_day.AddDays(-1 * step);

            vex.dialog.alert({
                message: 'No data found, last available date: ' + $filter("date")($scope.country_globals.data_day, 'dd/MM/yyyy')
            });



        });

    }

    function loadMapLayers(dollarType, districtLayer){

        if(districtLayer){

            if(dollarType ){
                var geojsondata = L.geoJSON($scope.district_list, {
                        style: function (item) {
                            return setColorMap(item);
                        },
                        onEachFeature: onEachFeature_dollar
                    }
                ).addTo(map);

            } else {
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

        }

    }

    function onEachFeature(feature, layer) {
        //bind click

        layer.myTag = "CountryGEOJson";

        // layer.on('click', function (e) {
        //     // e = event
        //     $scope.districtSelected = {
        //         id: feature.properties.ID,
        //         name: feature.properties.name
        //     };
        //
        //     localStorage.removeItem('rfsea_district');
        //     localStorage.setItem('rfsea_district', JSON.stringify($scope.districtSelected));
        //
        //     $window.location.href = "district_details.html";
        //
        // });

        // var popPercent = $filter('number')(feature.properties.data * 100 / feature.properties.pop, 0) + '%';

        var customPopup = feature.properties.name + ': ' + $filter('number')(feature.properties.data);
        var customOptions =
            {
                'maxWidth': '400',
                'width': '200',
                'className' : 'popupCustom',
                'autoPan': false
            }

        // var popup = L.popup({});
        // popup.setLatLng(layer.getBounds().getCenter());
        // popup.setContent(customPopup, customOptions);

        layer.bindPopup(customPopup, customOptions);

        // L.marker(layer.getBounds().getCenter(), {}).bindPopup(customPopup,customOptions).addTo(map);

        layer.on('mouseover', function(){
            this.openPopup();
        });
        layer.on('mouseout', function(){
            this.closePopup();
        });
    }

    function onEachFeature_dollar(feature, layer) {
        //bind click
        layer.myTag = "CountryGEOJson";

        // layer.on('click', function (e) {
        //     // e = event
        //     $scope.districtSelected = {
        //         id: feature.properties.ID,
        //         name: feature.properties.name
        //     };
        //
        //     localStorage.removeItem('rfsea_district');
        //     localStorage.setItem('rfsea_district', JSON.stringify($scope.districtSelected));
        //
        //     $window.location.href = "district_details.html";
        //
        // });
        var customOptions =
            {
                'maxWidth': '400',
                'width': '200',
                'className' : 'popupCustom',
                'autoPan': false
            }

        layer.bindPopup(feature.properties.name + ': ' + $filter('number')(feature.properties.data * dollarMultiplier, 0) + '$', customOptions);

        layer.on('mouseover', function(){
            this.openPopup();
        });
        layer.on('mouseout', function(){
            this.closePopup();
        });

    }

    function setPaletteColor(colors, values) {
        // Set the palette objects for zones color and legend values

        $scope.paletteColors = rfseaSrv.setPaletteColor(colors, values);
        $scope.paletteColors_saved = angular.copy($scope.paletteColors);

    }

    function setColorMap(dataValue){
        return rfseaSrv.setColorMap(dataValue, $scope.paletteColors_saved);
    }

    function setFirstView(){

        if (bDistrictView == 'dist'){
            $scope.bDistrict = true;
            $scope.bCountriesList = false;
            // $scope.bCountryHome.status = false;
            $scope.bRiskProfile.status = false;
            $scope.bdistrictDetails.status = false;
        }

        if (bDistrictView == 'rp'){
            $scope.bDistrict = false;
            $scope.bCountriesList = false;
            // $scope.bCountryHome.status = false;
            $scope.bRiskProfile.status = true;
            $scope.bdistrictDetails.status = false;

        }

        $scope.bDatePicker = false;

    }

    function getTotalSumData(arrayCountryFeatures) {
        // Return properties.data sum
        var tot = 0;

        for (var i = 0; i < arrayCountryFeatures.length; i++)
        {
            tot = tot + arrayCountryFeatures[i].properties.data;
        }

        return tot;
    }

    /***************************************************/
    /********* MAP EO NATIONAL START *******************/
    /***************************************************/

    $scope.$watch("maptypeview", function(newValue, oldValue) {

        //Clear map from others map layer
        rfseaSrv.clearMapLayerNational(map);
        rfseaSrv.clearMap(map);

        var promises = [];

        if(newValue !== oldValue){

            if($scope.maptypeview == 'scale'){

                $scope.maptype = "scale";
                $scope.paletteColors = angular.copy($scope.paletteColors_saved);
                bMapRaster = false;
                loadMapLayers(!$scope.bPeople, true);

            } else {

                bMapRaster = true;

                if($scope.maptypeview == 'eo'){
                    angular.forEach($scope.district_list, function(value, key){
                        promises.push(setLayer_eo($scope.countrySelected.id, value.properties.ID));
                    });
                }

                if($scope.maptypeview == 'compare'){
                    angular.forEach($scope.district_list, function(value, key){
                        promises.push(setLayer_eo_wd($scope.countrySelected.id, value.properties.ID));
                    });
                }

                if($scope.maptypeview == 'model'){
                    angular.forEach($scope.district_list, function(value, key){
                        promises.push(setLayer_wd($scope.countrySelected.id, value.properties.ID));
                    });
                }

                $q.all(promises).then(function(response) {
                    //Do nothing
                    bMapRaster = true;
                    loadMapLayers(!$scope.bPeople, true);

                });

            }

        }

    });

    // $scope.addLayersMap = function(mapType, legendTitle){
    //
    //     //Clear map from others map layer
    //     rfseaSrv.clearMapLayerNational(map);
    //     rfseaSrv.clearMap(map);
    //
    //     if($scope.maptype !== mapType)
    //     {
    //         var promises = [];
    //         $scope.maptype = mapType;
    //         $scope.legendtitle = legendTitle;
    //
    //         if($scope.maptype == 'eo'){
    //             angular.forEach($scope.district_list, function(value, key){
    //                 promises.push(setLayer_eo($scope.countrySelected.id, value.properties.ID));
    //             });
    //         }
    //
    //         if($scope.maptype == 'compare'){
    //             angular.forEach($scope.district_list, function(value, key){
    //                 promises.push(setLayer_eo_wd($scope.countrySelected.id, value.properties.ID));
    //             });
    //         }
    //
    //         if($scope.maptype == 'model'){
    //             angular.forEach($scope.district_list, function(value, key){
    //                 promises.push(setLayer_wd($scope.countrySelected.id, value.properties.ID));
    //             });
    //         }
    //
    //         $q.all(promises).then(function(response) {
    //             //Do nothing
    //             bMapRaster = true;
    //             loadMapLayers(!$scope.bPeople, true);
    //
    //         });
    //     } else {
    //         $scope.maptype = "scale";
    //         $scope.paletteColors = angular.copy($scope.paletteColors_saved);
    //         bMapRaster = false;
    //         loadMapLayers(!$scope.bPeople, true);
    //     }
    //
    // }

    function setLayer_eo(idCountry, idDistrict){

        rfseaSrv.getProvinceDetails_promise(idCountry, idDistrict, $scope.dateSelected).then(function(data){

            var	bounds = new L.LatLngBounds(
                new L.LatLng(data.data.imgs.eo.extent.ne[0],data.data.imgs.eo.extent.ne[1]),
                new L.LatLng(data.data.imgs.eo.extent.sw[0],data.data.imgs.eo.extent.sw[1])
            );

            // Set legend parameters
            $scope.paletteColors = data.data.imgs.eo.legend;
            $scope.palettePosition = "bottomright";
            $scope.maptype = "value-translate";

            $scope.overlay = new L.ImageOverlay(baseAPIurl + 'data/img/?img=' + data.data.imgs.eo.img, bounds, {
                opacity: 1,
                interactive: true,
                attribution: ''
            });

            $scope.overlay.myTag = "MapCompaire";

            map.addLayer($scope.overlay);

        });

    }

    function setLayer_eo_wd(idCountry, idDistrict) {

        rfseaSrv.getProvinceDetails_promise(idCountry,  idDistrict, $scope.dateSelected).then(function(data){

            var	bounds = new L.LatLngBounds(
                new L.LatLng(data.data.imgs.compare_eo_wd.extent.ne[0],data.data.imgs.compare_eo_wd.extent.ne[1]),
                new L.LatLng(data.data.imgs.compare_eo_wd.extent.sw[0],data.data.imgs.compare_eo_wd.extent.sw[1])
            );

            // Set legend parameters
            $scope.paletteColors = data.data.imgs.compare_eo_wd.legend;
            $scope.palettePosition = "bottomright";
            $scope.maptype = "value-translate";

            $scope.overlay = new L.ImageOverlay(baseAPIurl + 'data/img/?img=' + data.data.imgs.compare_eo_wd.img, bounds, {
                opacity: 1,
                interactive: true,
                attribution: ''
            });

            $scope.overlay.myTag = "MapCompaire";

            map.addLayer($scope.overlay);

        });

    }

    function setLayer_wd(idCountry, idDistrict) {

        rfseaSrv.getProvinceDetails_promise(idCountry,  idDistrict, $scope.dateSelected).then(function(data){

            var	bounds = new L.LatLngBounds(
                new L.LatLng(data.data.imgs.wd.extent.ne[0],data.data.imgs.wd.extent.ne[1]),
                new L.LatLng(data.data.imgs.wd.extent.sw[0],data.data.imgs.wd.extent.sw[1])
            );

            // Set legend parameters
            $scope.paletteColors = data.data.imgs.wd.legend;
            $scope.palettePosition = "bottomright";
            $scope.maptype = "value-translate";

            $scope.overlay = new L.ImageOverlay(baseAPIurl + 'data/img/?img=' + data.data.imgs.wd.img, bounds, {
                opacity: 1,
                interactive: true,
                attribution: ''
            });

            $scope.overlay.myTag = "MapCompaire";

            map.addLayer($scope.overlay);
        });

    }

    /***************************************************/
    /********* MAP EO NATIONAL END *********************/
    /***************************************************/

    $scope.setVisibilityDatePicker = function()
    {
        $scope.bDatePicker = !$scope.bDatePicker;
    }

    $scope.setNewYearSelected = function (item)
    {
        $scope.yearSelected = item;

        if (item == 0){
            $scope.availableMonths = [];
            $scope.monthSelected = -1;
        } else {
            // Calculate available months
            $scope.availableMonths = rfseaSrv.getAvailableMonths($scope.yearSelected);
        }

    }

    $scope.setNewMonthSelected = function(item){

        $scope.monthSelected = item;

    }

    // Set People or Dollar data
    $scope.setTypeDataToShow = function()
    {
        $scope.bPeople = !$scope.bPeople;
        $scope.sliderData.data.people = $scope.bPeople;

        bDistrictView = "";

        loadCountryZones();

    }

    $scope.searchAvailableRuns = function()
    {
        // Get user name
        rfseaSrv.getAvailableRuns($scope.monthSelected + 1, $scope.yearSelected, function(data)
        {

            $scope.runsAvailable = data.data;

        }, function(data)
        {
            // API error
            console.log(data);
            $scope.runsAvailable = [];
            vex.dialog.alert({
                message: 'No runs available'
            })
        });
    }

    $scope.setNewRunDate = function(RunDate)
    {
        //Set new RUN date
        $scope.dateSelected = RunDate;
        bMapRaster = false;
        init();
    }

    // Increase date days
    Date.prototype.AddDays = function(noOfDays) {
        this.setTime(this.getTime() + (noOfDays * (1000 * 60 * 60 * 24)));
        return this;
    };


    /***************************************************/
    /********* SIDEBAR SHOW/HIDE ***********************/
    /***************************************************/
    $scope.bShowBar = true;
    $scope.showHideSideBar = function()
    {
        $scope.bShowBar = !$scope.bShowBar;
    }

});
