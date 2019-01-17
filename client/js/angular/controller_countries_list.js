/**
 * Created by Manuel on 21/02/2018.
 */

rfseaApp.controller('rfsea_countries_Ctrl', function($rootScope, $scope, $window, $timeout, $filter, $location, rfseaSrv)
{

    $scope.bPeople = true;
    $scope.bCountryHome = {status: true};
    $scope.bDistrict = false;
    $scope.bRiskProfile = {status: false};
    $scope.bdistrictDetails = {status: false};
    $scope.bDatePicker = false;
    $scope.maptype = 'scale';
    $scope.countrySelect = "";
    $scope.district_list = [];
    $scope.district_list_people = [];
    $scope.district_list_dollar = [];
    $scope.userinfo = {
        usrlogin: "",
        usrlevel: "",
        usrloginstatus: false
    };

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

    // var map = L.map('map', {
    //         center: [19.80, 91.00],
    //         zoom: 5,
    //         trackResize: true
    //     }
    // );


    var map = rfseaSrv.createMapObject();

    loadMapLayers(false, false);

    $scope.bCountriesList = true;

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

            $scope.countriesList = [];
            $scope.countrySelected = JSON.parse(localStorage.getItem('rfsea_country_selected'));

            // Check if country is already set
            if($scope.countrySelected){

                $scope.bCountriesList = false;
                $scope.countrySelect = $scope.countrySelected.name;

                setFirstCountryDatails();

            } else {
                $scope.bCountriesList = true;
                $scope.bCountryHome.status = false;

                rfseaSrv.getCountriesList(function(data)
                {
                    // Countries list OK
                    $scope.countriesList = data.data.objects;

                    //If countriesList == 1 set this country like country selected
                    if($scope.countriesList.length == 1)
                    {
                        //There is only one country
                        setCountrySelected($scope.countriesList[0]);

                    }

                    $scope.setCountrySelection = function(country){

                        setCountrySelected(country);

                    };

                }, function(data)
                {
                    // Error
                    console.log(data);
                    vex.dialog.alert({
                        message: 'API loading error.'
                    })
                });
            }

        } else {
            // User no logged in
            $window.location.href = "index.html";
        }

    };

    // Select one contry
    function setCountrySelected(country) {

        $scope.countrySelected = country;
        $scope.bCountriesList = false;
        $scope.bCountryHome.status = true;
        // $scope.bdistrictDetails.status = false;
        $scope.countrySelect = country.name;

        loadCountryZones();

        localStorage.setItem('rfsea_country_selected', JSON.stringify(country));
        setFirstCountryDatails();

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

            // $scope.increaseDate = function(step)
            // {
            // Increase date by step (+1 or -1)
            // $scope.country_globals.data_day.AddDays(step);
            // ReloadGlobals($scope.country_globals.data_day, step);
            // }

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

        // if ($scope.district_list.length == 0){

            // First access

            rfseaSrv.getCountryZones($scope.countrySelected.id, $scope.dateSelected, function(data)
            {
                $scope.district_list = data.data.geojson.features;

                // Calculating map labels for dollar value
                // for(var i = 0; i <= $scope.district_list.length - 1; i++){
                // For every district i'll calculate the dollar value
                // var obj = angular.copy($scope.district_list[i]);
                // obj.properties.data = obj.properties.data * dollarMultiplier;
                // $scope.district_list_dollar.push(obj);
                // };

                // Set color Palette
                setPaletteColor(data.data.pal.colors, data.data.pal.values);

                $scope.zonesData = data.data.geojson.features;

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
        // } else {
        //
        //     console.log('Layer lenght zero');
        //
        //     if($scope.bPeople){
        //         loadMapLayers(false, true);
        //     } else {
        //         loadMapLayers(true, true);
        //     }
        //
        // }

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
                    desc_hl: ""
                };

                // $timeout(function(){
                    $scope.populationDetails.pop_est = data.data.pop_est;
                    $scope.populationDetails.pop_hg = data.data.pop_hg;
                    $scope.populationDetails.pop_hl = data.data.pop_hl;
                    $scope.populationDetails.desc_hl = data.data.hl;
                    $scope.populationDetails.desc_hg = data.data.hg;

                    $scope.countrycurve = $scope.countrySelected.curve;

                $scope.sliderData.data.curve_x = $scope.countrycurve.x;
                $scope.sliderData.data.curve_y = $scope.countrycurve.y;
                $scope.sliderData.data.pop_est = $scope.populationDetails.pop_est;

                // }, 0);

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

        // L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
        //     attribution: ''
        // }).addTo(map);
        //
        // map.zoomControl.setPosition('topright');

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

                map.fitBounds(geojsondata.getBounds());
                // map.setZoom(5);

            }

        }

    }

    function onEachFeature(feature, layer) {
        //bind click
        layer.on('click', function (e) {
            // e = event
            $scope.districtSelected = {
                id: feature.properties.ID,
                name: feature.properties.name
            };

            localStorage.removeItem('rfsea_district');
            localStorage.setItem('rfsea_district', JSON.stringify($scope.districtSelected));

            // var geojson_district = L.geoJSON(feature.geometry);

            // map.fitBounds(geojson_district.getBounds());

            $window.location.href = "district_details.html";
            // $timeout(function(){
            //     $scope.bCountryHome.status = false;
            //     $scope.bDistrict = false;
            //     $scope.bRiskProfile.status = false;
            //     $scope.bdistrictDetails.status = true;
            //
            //     $scope.districtObj = $scope.districtSelected;
            //
            //     $scope.paletteColors = [];
            //     $scope.palettePosition = "bottomright";
            //     $scope.maptype = "value";
            //
            //     initDistrictDetails();
            //
            // }, 0);

        });

        // var popPercent = $filter('number')(feature.properties.data * 100 / feature.properties.pop, 0) + '%';

        var customPopup = feature.properties.name + ': ' + $filter('number')(feature.properties.data);
        var customOptions =
            {
                'maxWidth': '400',
                'width': '200',
                'className' : 'popupCustom'
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
        layer.on('click', function (e) {
            // e = event
            $scope.districtSelected = {
                id: feature.properties.ID,
                name: feature.properties.name
            };

            localStorage.removeItem('rfsea_district');
            localStorage.setItem('rfsea_district', JSON.stringify($scope.districtSelected));

            // var geojson_district = L.geoJSON(feature.geometry);

            // map.fitBounds(geojson_district.getBounds());

            $window.location.href = "district_details.html";
            // $timeout(function(){
            //     $scope.bCountryHome.status = false;
            //     $scope.bDistrict = false;
            //     $scope.bRiskProfile.status = false;
            //     $scope.bdistrictDetails.status = true;
            //
            //     $scope.districtObj = $scope.districtSelected;
            //
            //     $scope.paletteColors = [];
            //     $scope.palettePosition = "bottomright";
            //     $scope.maptype = "value";
            //
            //     initDistrictDetails();
            //
            // }, 0);

        });

        layer.bindPopup(feature.properties.name + ': ' + $filter('number')(feature.properties.data * dollarMultiplier, 0) + '$');

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

    }

    function setColorMap(dataValue){
        return rfseaSrv.setColorMap(dataValue, $scope.paletteColors);
    }

    function setFirstView(){

        if (bDistrictView == 'dist'){
            $scope.bDistrict = true;
            $scope.bCountriesList = false;
            $scope.bCountryHome.status = false;
            $scope.bRiskProfile.status = false;
            $scope.bdistrictDetails.status = false;
        }

        if (bDistrictView == 'rp'){
            $scope.bDistrict = false;
            $scope.bCountriesList = false;
            $scope.bCountryHome.status = false;
            $scope.bRiskProfile.status = true;
            $scope.bdistrictDetails.status = false;

        }

        $scope.bDatePicker = false;

    }

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
