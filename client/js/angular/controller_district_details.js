/**
 * Created by Manuel on 09/03/2018.
 */

rfseaApp.controller('rfseaCtrlDistrictMap', function($rootScope, $scope, $filter, $window, rfseaSrv)
{

    $scope.userinfo = {
        usrlogin: "",
        usrlevel: "",
        usrloginstatus: false
    };

    $scope.mapType = "eo";
    $scope.legendtitle = "EO MAP";

    $scope.bdistrictDetails = {status: true};

    $scope.userinfo = JSON.parse(localStorage.getItem('rfsea_login'));

    if(!$scope.userinfo){
        //User not loggedin
        $window.location.href = "index.html";
    }

    $scope.districtObj = JSON.parse(localStorage.getItem('rfsea_district'));

    $scope.paletteColors = [];
    $scope.palettePosition = "bottomright";
    $scope.maptype = "value";

    if ($scope.userinfo.usrloginstatus) {
        // User logged in

        var map = rfseaSrv.createMapObject();

        $scope.countrySelected = JSON.parse(localStorage.getItem('rfsea_country_selected'));

        if ($scope.countrySelected){

            init();

            // Layer layout
            $scope.setLayer_eo_wd = function()
            {

                $scope.mapType = "compare";
                $scope.legendtitle = "COMPARE EO/MODEL";

                rfseaSrv.getProvinceDetails($scope.countrySelected.id,  $scope.districtObj.id, function(data)
                {
                    // Country zone details

                    var	bounds = new L.LatLngBounds(
                        new L.LatLng(data.data.imgs.compare_eo_wd.extent.ne[0],data.data.imgs.compare_eo_wd.extent.ne[1]),
                        new L.LatLng(data.data.imgs.compare_eo_wd.extent.sw[0],data.data.imgs.compare_eo_wd.extent.sw[1])
                    );

                    // map.fitBounds(bounds);

                    // Set legend parameters
                    $scope.paletteColors = data.data.imgs.compare_eo_wd.legend;
                    $scope.palettePosition = "bottomright";
                    $scope.maptype = "value-translate";

                    //data.data.imgs.compare_eo_wd.img

                    // Image
                    if ($scope.overlay) {
                        map.removeLayer($scope.overlay)
                    }
                    $scope.overlay = new L.ImageOverlay(baseAPIurl + 'data/img/?img=' + data.data.imgs.compare_eo_wd.img, bounds, {
                        opacity: 1,
                        interactive: true,
                        attribution: ''
                    });
                    map.addLayer($scope.overlay);


                }, function(data)
                {
                    // Error
                    console.log(data);
                    vex.dialog.alert({
                        message: 'API loading error.'
                    })
                });
            }

            $scope.setLayer_eo = function()
            {

                $scope.mapType = "eo";
                $scope.legendtitle = "EO MAP";

                rfseaSrv.getProvinceDetails($scope.countrySelected.id,  $scope.districtObj.id, function(data)
                {
                    // Country zone details

                    var	bounds = new L.LatLngBounds(
                        new L.LatLng(data.data.imgs.eo.extent.ne[0],data.data.imgs.eo.extent.ne[1]),
                        new L.LatLng(data.data.imgs.eo.extent.sw[0],data.data.imgs.eo.extent.sw[1])
                    );

                    // map.fitBounds(bounds);

                    // Set legend parameters
                    $scope.paletteColors = data.data.imgs.eo.legend;
                    $scope.palettePosition = "bottomright";
                    $scope.maptype = "value-translate";

                    //data.data.imgs.compare_eo_wd.img

                    // Image
                    if ($scope.overlay) {
                        map.removeLayer($scope.overlay);
                    }
                    $scope.overlay = new L.ImageOverlay(baseAPIurl + 'data/img/?img=' + data.data.imgs.eo.img, bounds, {
                        opacity: 1,
                        interactive: true,
                        attribution: ''
                    });
                    map.addLayer($scope.overlay);


                }, function(data)
                {
                    // Error
                    console.log(data);
                    vex.dialog.alert({
                        message: 'API loading error.'
                    })
                });
            }

            $scope.setLayer_wd = function()
            {

                $scope.mapType = "model";
                $scope.legendtitle = "MODEL MAP";

                rfseaSrv.getProvinceDetails($scope.countrySelected.id,  $scope.districtObj.id, function(data)
                {
                    // Country zone details
                    var	bounds = new L.LatLngBounds(
                        new L.LatLng(data.data.imgs.wd.extent.ne[0],data.data.imgs.wd.extent.ne[1]),
                        new L.LatLng(data.data.imgs.wd.extent.sw[0],data.data.imgs.wd.extent.sw[1])
                    );

                    // map.fitBounds(bounds);

                    // Set legend parameters
                    $scope.paletteColors = data.data.imgs.wd.legend;
                    $scope.palettePosition = "bottomright";
                    $scope.maptype = "value";

                    //data.data.imgs.compare_eo_wd.img

                    // Image
                    if ($scope.overlay) {
                        map.removeLayer($scope.overlay)
                    }
                    $scope.overlay = new L.ImageOverlay(baseAPIurl + 'data/img/?img=' + data.data.imgs.wd.img, bounds, {
                        opacity: 1,
                        interactive: true,
                        attribution: ''
                    });
                    map.addLayer($scope.overlay);


                }, function(data)
                {
                    // Error
                    console.log(data);
                    vex.dialog.alert({
                        message: 'API loading error.'
                    })
                });
            }

            /***************************************************/
            /********* SIDEBAR SHOW/HIDE ***********************/
            /***************************************************/
            $scope.bShowBar = true;
            $scope.showHideSideBar = function()
            {
                $scope.bShowBar = !$scope.bShowBar;
            }

        } else {
            $window.location.href = "countries.html";
        }

        function init(){
            rfseaSrv.getProvinceDetails($scope.countrySelected.id,  $scope.districtObj.id, function(data)
            {
                // Country zone details
                var	bounds = new L.LatLngBounds(
                    new L.LatLng(data.data.imgs.eo.extent.ne[0],data.data.imgs.eo.extent.ne[1]),
                    new L.LatLng(data.data.imgs.eo.extent.sw[0],data.data.imgs.eo.extent.sw[1])
                );

                map.fitBounds(bounds);

                $scope.paletteColors = data.data.imgs.eo.legend;
                $scope.palettePosition = "bottomright";
                $scope.maptype = "value-translate";

                //data.data.imgs.compare_eo_wd.img

                // Image
                $scope.overlay = new L.ImageOverlay(baseAPIurl + 'data/img/?img=' + data.data.imgs.eo.img, bounds, {
                    opacity: 1,
                    interactive: true,
                    attribution: '&copy; A.B.B Corp.'
                });
                map.addLayer($scope.overlay);


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

});
