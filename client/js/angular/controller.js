/**
 * Created by Manuel on 13/01/2017.
 */

rfseaApp.controller('rfseaCtrl', function($rootScope, $scope, $window, rfseaSrv)
{

    $scope.userinfo = {
        usrlogin: "",
        usrlevel: "",
        usrloginstatus: false
    };

    $scope.bDisclaimer = false;

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

        // var map = L.map('map', {
        //         center: [19.80, 91.00],
        //         zoom: 5,
        //         trackResize: true
        //     }
        // );

        // map.zoomControl.setPosition('topright');

        // L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        //     attribution: ''
        // }).addTo(map);
        //
        // L.control.scale({position: 'bottomright'}).addTo(map);

    });

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