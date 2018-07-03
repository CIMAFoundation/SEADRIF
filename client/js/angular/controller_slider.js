/**
 * Created by Manuel on 12/02/2018.
 */

rfseaApp.controller('rfseasliderCtrl', function($rootScope, $scope, rfseaSrv) {


    var gridValues = [0, 3000, 10000, 100000, 500000, 1000000, 10000000]

    $scope.gridValues = gridValues
    $scope.multipier = $scope.data.people ? 1 : dollarMultiplier;

    function getPercPos (v) {
        //search value position
        for (var i=1; i<gridValues.length; i++) {
            if (v < gridValues[i]) {
                var perc = (v - gridValues[i-1]) / (gridValues[i] - gridValues[i-1]);
                var percGap = 1.0 / (gridValues.length-1);
                return Math.floor(300 * ((i-1)*percGap + percGap*perc))
            }
        }
        return 300
    }

    function setElementPosition(itemId, pos) {
        var elem = document.getElementById(itemId);
        elem.style.left= "" + pos + "px";

        // console.log('item: ' + itemId + 'pos: ' + pos);
        // console.log(itemId + ": " + elem.style.left)
    }

    function setElementPosition_tooltip(itemId, pos) {
        var elem = document.getElementById(itemId);
        elem.style.marginLeft= "-" + (pos * 0.5) - 26 + "px";
        // console.log(pos);

        // console.log(itemId + ": " + elem.style.left)

    }

    $scope.$watch('data.pop', function (newVal, oldVal) {
        setElementPosition('slider_thr1_item', getPercPos($scope.data.thr1));
        setElementPosition('slider_thr2_item', getPercPos($scope.data.thr2));
        setElementPosition('slider_pop_item', getPercPos($scope.data.pop));

        //tooltip position
        setElementPosition_tooltip('tooltip_value_1', getPercPos($scope.data.thr1))
        setElementPosition_tooltip('tooltip_value_2', getPercPos($scope.data.thr2))

    });

    $scope.$watch('data.people', function (newVal, oldVal) {
        $scope.multipier = newVal ? 1 : dollarMultiplier;
    });

});
