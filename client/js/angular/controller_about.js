/**
 * Created by Manuel on 08/03/2018.
 */

rfseaApp.controller('rfseaCtrlAbout', function($rootScope, $scope, $window, rfseaSrv)
{



    /***************************************************/
    /********* SIDEBAR SHOW/HIDE ***********************/
    /***************************************************/
    $scope.bShowBar = true;
    $scope.showHideSideBar = function()
    {
        $scope.bShowBar = !$scope.bShowBar;
    }

});
