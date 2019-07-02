/**
 * Created by Manuel on 12/02/2018.
 */

rfseaApp.controller('rfseasliderCtrl', function($rootScope, $scope, $timeout, rfseaSrv, $filter) {

    var gridValues = [0, 3000, 10000, 100000, 500000, 1000000, 10000000];

    var marginLeftZeroValue = 88;
    var marginLeftZeroValueThr = 40;

    var thr1Width = 0;
    var thr2Width = 0;

    $scope.gridValues = gridValues;
    $scope.multipier = $scope.data.people ? 1 : dollarMultiplier;

    $scope.$watch('data.curve_x', function (newVal, oldVal) {
        $scope.series_model = [];
        rpValueApp = rfseaSrv.setRPValue(returnInterpulationPoint($scope.data.pop_est,'est'));

        $scope.rpValue = rpValueApp;

    });

    $scope.widthRangeYellow = 0;
    $scope.widthRangeRed = 0;

    function getPercPos (v) {
        //search value position
        for (var i=1; i<gridValues.length; i++) {
            if (v < gridValues[i]) {
                var perc = (v - gridValues[i-1]) / (gridValues[i] - gridValues[i-1]);
                var percGap = 1.0 / (gridValues.length-1);
                return Math.floor(300 * ((i-1)*percGap + percGap*perc));
            }
        }
        return 300;

    }

    function setElementPosition(itemId, pos) {

        if (itemId == 'slider_pop_item'){
            var elem = document.getElementById(itemId);
            elem.style.left= "" + pos - marginLeftZeroValue + "px";
        } else
        {
            var elem = document.getElementById(itemId);
            elem.style.left= "" + pos - marginLeftZeroValueThr + "px";
        }

        if(itemId == 'slider_thr1_item')
        {
            thr1Width = pos;
        }

        if(itemId == 'slider_thr2_item')
        {
            thr2Width = pos;
        }

    }

    function setGradient(itemId, value){

        var item = document.getElementById(itemId);
        if(item){
            item.style.width = value + "px";
        }
    }

    function setElementPosition_tooltip(itemId, pos) {
        var elem = document.getElementById(itemId);
        // elem.style.marginLeft= "-" + (pos * 0.5) - 26 + "px";
        elem.style.left = "-95px";
        elem.style.top = "45px";
    }

    function returnInterpulationPoint(yValue, type){
        // Return the x value relative the curve values
        var objCurve = [];
        var indexPoint1 = 0;
        var indexPoint0 = 0;
        var dy = 0;
        var xVal = 0;

        for (var i = 0; i < $scope.data.curve_x.length; i++)
        {
            objPoint = [];
            objPoint =[$scope.data.curve_x[i], $scope.data.curve_y[i]];
            $scope.series_model.push(objPoint);

        }

        objCurve = $filter('filter')($scope.series_model, function(item){
            return item[1] >= yValue;
        })

        if (objCurve.length > 0){
            // finded points
            indexPoint1 = $scope.series_model.indexOf(objCurve[0]);
            indexPoint0 = indexPoint1 - 1;

            if(indexPoint0 < 0){
                // Precedent index out of range
                indexPoint0 = 0;
            }

            if(yValue == 0){
                dy = 0;

            } else {

                dy = (yValue - $scope.series_model[indexPoint0][1]) / ($scope.series_model[indexPoint1][1] - $scope.series_model[indexPoint0][1]);
            }

            xVal = ($scope.series_model[indexPoint0][0] + ($scope.series_model[indexPoint1][0] - $scope.series_model[indexPoint0][0]) * dy);

            return xVal;

        } else {
            // No points found
            return 0;
        }

    }

    $scope.$watch('[data.pop, data.thr1]', function (newVal, oldVal) {

        setElementPosition('slider_thr1_item', getPercPos($scope.data.thr1));
        setElementPosition('slider_thr2_item', getPercPos($scope.data.thr2));
        setElementPosition('slider_pop_item', getPercPos($scope.data.pop));

        // Calculate the with of scale gradient


        $timeout(function(){

            setGradient('slider_step_1', thr1Width);
            setGradient('slider_step_2', thr2Width - thr1Width);
            setGradient('slider_step_3', 300 - thr2Width);

        }, 500);


        //tooltip position
        setElementPosition_tooltip('tooltip_value_1', getPercPos($scope.data.thr1))
        setElementPosition_tooltip('tooltip_value_2', getPercPos($scope.data.thr2))

    });

    $scope.$watch('data.people', function (newVal, oldVal) {
        $scope.multipier = newVal ? 1 : dollarMultiplier;
    });

});
