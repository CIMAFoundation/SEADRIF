/**
 * Created by Manuel on 12/02/2018.
 */

rfseaApp.controller('rfseafooterCtrl', function($rootScope, $scope, rfseaSrv, $filter)
{

    let todayDate = new Date();
    if (!$rootScope.dateSelectedGlobal) $rootScope.dateSelectedGlobal = todayDate;
    $rootScope.dateSelectedGlobal = $filter('date')($rootScope.dateSelectedGlobal, 'yyyyMMdd');

    $scope.addLayersMap = function(mapType, legendTitle){

        if($scope.maptype !== mapType)
        {
            var promises = [];
            $scope.maptype = mapType;
            $scope.legendtitle = legendTitle;

        }
    }

    $scope.showDwlPanel = false
    $scope.openDwlPanel = function() {
      $scope.showDwlPanel = !$scope.showDwlPanel
    }

    /***************************************************/
    /********* DOWNLOAD API ****************************/
    /***************************************************/

    $scope.downloadAffectedPeople = function () {

        rfseaSrv.getDownloadPop($rootScope.contry_selected.id, $rootScope.dateSelectedGlobal,function(response)
        {

            //console.log(response.headers());
            var a = document.createElement('a');
            var blob = new Blob([response.data], {'type':"application/csv"});

            a.href = URL.createObjectURL(blob);
            a.download = $rootScope.contry_selected.name + "_population_" + $rootScope.dateSelectedGlobal + ".csv";
            a.click();

        }, function(data)
        {
            console.log("OnError");

        });
    }

    $scope.downloadEO = function () {

        rfseaSrv.getDownloadEO($rootScope.contry_selected.id, todayDate,function(response)
        {

            //console.log(response.headers());
            var a = document.createElement('a');
            var blob = new Blob([ response.data], {'type':"application/tiff"});
            a.href = URL.createObjectURL(blob);
            a.download = $rootScope.contry_selected.name + "_eo_" + todayDate + ".tif";
            a.click();

        }, function(data)
        {
            console.log("OnError");

        });
    }

    $scope.downloadMODEL = function () {

        rfseaSrv.getDownloadMODEL($rootScope.contry_selected.id, $rootScope.dateSelectedGlobal,function(response)
        {

            //console.log(response.headers());
            var a = document.createElement('a');
            var blob = new Blob([response.data], {'type':"application/force-download"});
            a.href = URL.createObjectURL(blob);
            a.download = $rootScope.contry_selected.name + "_model_" + $rootScope.dateSelectedGlobal + ".tif";
            a.click();

        }, function(data)
        {
            console.log("OnError");

        });
    }

    $scope.downloadEOMODEL = function () {

        rfseaSrv.getDownloadEOMODEL($rootScope.contry_selected.id, $rootScope.dateSelectedGlobal,function(response)
        {

            //console.log(response.headers());
            var a = document.createElement('a');
            var blob = new Blob([response.data], {'type':"application/force-download"});
            a.href = URL.createObjectURL(blob);
            a.download = $rootScope.contry_selected.name + "_eo_model_" + $rootScope.dateSelectedGlobal + ".tif";
            a.click();

        }, function(data)
        {
            console.log("OnError");

        });
    }

    $scope.downloadWorkingDirectory = function () {

        rfseaSrv.getDownloadWorkingDirectory($rootScope.dateSelectedGlobal,function(response)
        {

            var a = document.createElement('a');

            //var fileName = response.headers['response.headers'].split("=")[1].replace(/\"/gi,'');
            var fileName = "work_data_" + $rootScope.dateSelectedGlobal + ".zip";
            //var fileType = response.headers['content-type'] + ';charset=utf-8';
            var blob = new Blob([response.data], {type:"application/octet-stream"});

            a.href = URL.createObjectURL(blob);
            a.download = fileName;
            a.click();

        }, function(data)
        {
            console.log("OnError");

        });
    }

});
