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

    // Guest data to view
    $scope.paletteColors = [];
    $scope.palettePosition = 'bottomright';
    $scope.maptype = "value-translate";
    $scope.paletteColors_saved = [];
    $scope.legendtitle= "MODEL MAP";

    // Get user name
    rfseaSrv.getWhoami(function(data)
    {
        if(data.status == 200){
            // User logged in
            $scope.userinfo = {
                usrlogin: data.data.user,
                usrlevel: "seaDrif",
                usrloginstatus: true,
                user_settings: data.data.settings
            };

            localStorage.setItem('rfsea_login', JSON.stringify($scope.userinfo));
            $window.location.href = "countries.html";

        } else {
            // Visitor
            var map = L.map('map', {
                    center: [16.69, 101.55],
                    zoom: 7,
                    trackResize: true
                }
            );

            map.zoomControl.setPosition('topright');

            L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}', {
                attribution: ''
            }).addTo(map);

        }

    }, function(data)
    {

        // User not logged in - VISITOR

        //var map = rfseaSrv.createMapObject();
        var map = L.map('map', {
                center: [16.69, 101.55],
                zoom: 6,
                trackResize: true
            }
        );

        map.zoomControl.setPosition('topright');

        L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}', {
            attribution: ''
        }).addTo(map);

        getZonesForGuest (map);

    });

    $scope.setLoginView = function(type){
        $scope.login.status = !$scope.login.status;
        $scope.login.type = type;
    }

    function getZonesForGuest (map){

        rfseaSrv.getCountryDataForGuest(function(data)
        {

            $scope.paletteColors = data.data.legend;

            angular.forEach(data.data.imgs, function(value, key){
                loadLayerImage(map, value);
            });


        }, function(data)
        {
            console.log(data);
        });
    }

    function loadLayerImage(map, data) {

        var	bounds = new L.LatLngBounds(
            new L.LatLng(data.extent.ne[0],data.extent.ne[1]),
            new L.LatLng(data.extent.sw[0],data.extent.sw[1])
        );

        $scope.overlay = new L.ImageOverlay(baseAPIurl + 'data/img/?img=' + data.img, bounds, {
            opacity: 1,
            interactive: true,
            attribution: ''
        });

        $scope.overlay.myTag = "MapCompaire";

        map.addLayer($scope.overlay);

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