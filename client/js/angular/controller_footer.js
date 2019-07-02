/**
 * Created by Manuel on 12/02/2018.
 */

rfseaApp.controller('rfseafooterCtrl', function($rootScope, $scope, rfseaSrv)
{

    $scope.addLayersMap = function(mapType, legendTitle){

        if($scope.maptype !== mapType)
        {
            var promises = [];
            $scope.maptype = mapType;
            $scope.legendtitle = legendTitle;

        }
    }


});
