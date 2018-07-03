/**
 * Created by Manuel on 12/03/2018.
 */

rfseaApp.controller('rfseaCtrllegend', function($rootScope, $scope, $window, rfseaSrv)
{

    $scope.styleposition = '';

    $scope.$watch("datatype", function(newValue, oldValue) {

        $scope.dollarMultiplier = dollarMultiplier;
    });

    $scope.$watch("paletteobj", function(newValue, oldValue) {

        if($scope.paletteobj.length > 0){

            if ($scope.position == 'bottomright'){
                $scope.styleposition = 'bottom:150px; right:20px;';
            }

            if ($scope.position == 'bottomleft'){
                $scope.styleposition = 'bottom:120px; left:20px;';
            }

            if ($scope.position == 'topright'){
                $scope.styleposition = 'top:100px; right:20px;';
            }

            if ($scope.position == 'topleft'){
                $scope.styleposition = 'top:100px; left:20px;';
            }

        }

    });

});
