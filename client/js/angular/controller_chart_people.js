/**
 * Created by Manuel on 05/03/2018.
 */

rfseaApp.controller('rfseaCtrlchartpeople', function($rootScope, $scope, $timeout, $filter, $window, rfseaSrv)
{

    // Variables definition
    $scope.series_model = [];
    $scope.series_model_dollar = [];
    $scope.bModel = true;
    $scope.bPeople = true;
    var serieEst = [];
    var serieEst_dollar = [];
    var serieHG = [];
    var serieHG_dollar = [];
    var serieHL = [];
    var serieHL_dollar = [];
    var serieAlternative1 = [];
    var serieAlternative1_dollar = [];
    var serieAlternative2 = [];
    var serieAlternative2_dollar = [];
    var serieAlternative3 = [];
    var serieAlternative3_dollar = [];
    $scope.titleHistoricalSelected = "";
    $scope.descHistoricalSelected = "";
    var chart = {};
    $scope.dollarValue  =dollarMultiplier;

    var objMarkerCurve = {
        symbol: 'square',
        radius: 0,
        fillColor: '#ffffff'
    };

    $scope.aHistoricalEventListDesc = [];

    $scope.clickChartsDisableHistorical = false;

    $scope.detailsTitle = "ESTIMATED AFFECTED POPULATION";

    $scope.bAnalysis = false;
    $scope.bPastEvents = false;

    $scope.typeTitleHeader = "ESTIMATED AFFECTED POPULATION";

    $scope.populationDetails = {
        pop_est: $scope.popDetails.pop_est
    }

    $scope.$watch("curvex", function(newValue, oldValue) {

        if($scope.curvex) {

            // Generatin curve

            // if($scope.popDetails.pop_est == 0){
            //
            //     $scope.series_model.push([0,0]);
            //     $scope.series_model_dollar.push([0,0]);
            //
            //     serieEst = [{
            //         x: 0,
            //         y:0,
            //         marker: {
            //             enabled: true,
            //             symbol: 'url(img/template/orange.png)'
            //         },
            //         name: 'est'
            //     }];
            //
            //     serieEst_dollar = angular.copy(serieEst);
            //
            // }

            $scope.aHistoricalEventListDesc = rfseaSrv.getHistoricalEventsDesc($scope.datachart.idCountry);

            for (var i = 0; i < $scope.curvex.length; i++)
            {
                objPoint = [];

                if($scope.curvex[i] <= 250){

                    objPoint =[$scope.curvex[i], $scope.curvey[i]];
                    $scope.series_model.push(objPoint);

                    objPoint_dollar = [];
                    objPoint_dollar = [angular.copy($scope.curvex[i]) * dollarMultiplier, angular.copy($scope.curvey[i]) * dollarMultiplier];
                    $scope.series_model_dollar.push(objPoint_dollar);

                }

            }

            // Estimated value
            if ($scope.popDetails.pop_est && $scope.popDetails.pop_est > 0){

                serieEst = returnInterpulationPoint($scope.popDetails.pop_est, 'est');

                /* Calculating RP Value from data */
                if(serieEst.length > 0){
                    rpValueApp = rfseaSrv.setRPValue(serieEst[0].x);
                }

                serieEst_dollar = angular.copy(serieEst);
                serieEst_dollar[0].x = serieEst_dollar[0].x * dollarMultiplier;
                serieEst_dollar[0].y = serieEst_dollar[0].y * dollarMultiplier;
            }

            // Historical High
            if($scope.popDetails.pop_hg){

                serieHG = returnInterpulationPoint($scope.popDetails.pop_hg, 'hg');

                serieHG_dollar = angular.copy(serieHG);
                serieHG_dollar[0].x = serieHG_dollar[0].x * dollarMultiplier;
                serieHG_dollar[0].y = serieHG_dollar[0].y * dollarMultiplier;
            }

            // Historical Low
            if($scope.popDetails.pop_hl){

                serieHL = returnInterpulationPoint($scope.popDetails.pop_hl, 'hl');

                serieHL_dollar = angular.copy(serieHL);
                serieHL_dollar[0].x = serieHL_dollar[0].x * dollarMultiplier;
                serieHL_dollar[0].y = serieHL_dollar[0].y * dollarMultiplier;

            }

            // Get Alternative scenario points
            rfseaSrv.getCountryAnalysis($scope.datachart.idCountry, function(data)
            {

                var indexRif = data.data.ref_scenario;

                // Alternative series 1
                serieAlternative1 = returnAlternativeScenario(data.data.data[0], indexRif, "be");
                serieAlternative1_dollar = setDollarValueAlternativePoints(angular.copy(serieAlternative1));

                // Alternative series 2
                serieAlternative2 = returnAlternativeScenario(data.data.data[1], indexRif, "a1");
                serieAlternative2_dollar = setDollarValueAlternativePoints(angular.copy(serieAlternative2));

                // Alternative series 3
                serieAlternative3 = returnAlternativeScenario(data.data.data[2], indexRif, "a2");
                serieAlternative3_dollar = setDollarValueAlternativePoints(angular.copy(serieAlternative3));

                createChartPeople();

                setHistoricalSeries();

                $scope.setPastEventsData = function()
                {

                    $scope.bPastEvents = !$scope.bPastEvents;

                    setHistoricalSeries();

                }

                $scope.setAlternativeScenario = function()
                {
                    $scope.bAnalysis = !$scope.bAnalysis;

                    if ($scope.bAnalysis){
                        // Show Alternative scenaio

                        chart.series[1].hide();

                        chart.series[4].show();
                        chart.series[5].show();
                        chart.series[6].show();

                    } else {
                        chart.series[1].show();

                        chart.series[4].hide();
                        chart.series[5].hide();
                        chart.series[6].hide();
                    }
                }

            }, function(data)
            {
                // Error
                serieAlternative1 = [];
                serieAlternative2 = [];
                serieAlternative3 = [];

                vex.dialog.alert({
                    message: 'No analysis data found for alternative scenario'
                });

            });

        };

    });

    $scope.closePage = function()
    {
        $timeout(function(){
            $scope.bRiskProfile = false;
            $scope.countryhomeshow = true;
        }, 0)
    }

    // Set People or Dollar data
    $scope.setTypeDataToShow = function()
    {

        $scope.bPeople = !$scope.bPeople;
        $scope.sliderdata.data.people = $scope.bPeople;

        var seriesLength = chart.series.length;
        for(var i = seriesLength - 1; i > -1; i--) {
            chart.series[i].remove();
        }

        if($scope.bPeople){
            // Set people series

            createChartPeople();

            setHistoricalSeries();

            if (serieEst.length > 0){
                //Label update
                $scope.populationDetails = {
                    pop_est: serieEst[0].y
                };
            } else {
                //Label update
                $scope.populationDetails = {
                    pop_est: 0
                };
            }

            if($scope.bModel){
                $scope.typeTitleHeader = "ESTIMATED AFFECTED POPULATION";
                $scope.detailsTitle = "ESTIMATED AFFECTED POPULATION"
            } else {
                $scope.detailsTitle = "HISTORIC AFFECTED POPULATION"
                $scope.typeTitleHeader = "HISTORIC AFFECTED POPULATION";
            }

        } else {
            // Set dollar series

            createChartDollar();

            setHistoricalSeries();

            if(serieEst_dollar.length > 0){
                $scope.populationDetails = {
                    pop_est: serieEst_dollar[0].y
                };
            } else {
                $scope.populationDetails = {
                    pop_est: 0
                };
            }

            //Label update
            // $scope.populationDetails = {
            //     pop_est: serieEst_dollar[0].y
            // };

            if($scope.bModel){
                $scope.typeTitleHeader = "ESTIMATED EMERGENCY COSTS";
                $scope.detailsTitle = "ESTIMATED EMERGENCY COSTS"
            } else {
                $scope.detailsTitle = "HISTORIC EMERGENCY COSTS"
                $scope.typeTitleHeader = "HISTORIC EMERGENCY COSTS";
            }

        }

    }



    //insert element into array in a specific index
    Array.prototype.insert = function ( index, item ) {
        this.splice( index, 0, item );
    };

    /*********************************************************/
    /****************FUNCTIONS *******************************/
    /*********************************************************/

    function createChartPeople(){

        (function (H) {
            // Pass error messages
            H.Axis.prototype.allowNegativeLog = true;

            // Override conversions
            H.Axis.prototype.log2lin = function (num) {
                var isNegative = num < 0,
                    adjustedNum = Math.abs(num),
                    result;
                if (adjustedNum < 10) {
                    adjustedNum += (10 - adjustedNum) / 10;
                }
                result = Math.log(adjustedNum) / Math.LN10;
                return isNegative ? -result : result;
            };
            H.Axis.prototype.lin2log = function (num) {
                var isNegative = num < 0,
                    absNum = Math.abs(num),
                    result = Math.pow(10, absNum);
                if (result < 10) {
                    result = (10 * (result - 1)) / (10 - 1);
                }
                return isNegative ? -result : result;
            };
        }(Highcharts));

        chart = Highcharts.chart('chartRFSEA_people_model', {
            chart: {
                type: 'spline',
                backgroundColor:'rgba(255, 255, 255, 0)',
                zoomType: "xy"
            },
            exporting: {
                    enabled: false
                },
            title: {
                text: ''
            },
            xAxis: {
                crosshair: {
                    snap: false
                },
                lineColor: '#232323',
                lineWidth: 1,
                gridLineWidth: 0,
                //type: 'logarithmic',
                type: 'linear',
                title: {
                    text: 'Return Period [Years]'
                }
            },
            yAxis: [{
                crosshair: {
                    snap: false
                },
                lineColor: '#232323',
                lineWidth: 1,
                gridLineWidth: 0,
                // type: 'logarithmic',
                type: 'linear',
                title: {
                    text: 'People Affected [Number]'
                },
                plotLines: [
                    {
                        dashStyle: "Solid",
                        className: 'rfsea_highcharts-plot-line_green',
                        value: $scope.datachart.thrLow,
                        label: {
                            enabled: true,
                            useHTML: true,
                            text: 'threshold 1 - ' + $filter('number')($scope.datachart.thrLow, 0),
                            align: "right",
                            zIndex: 3,
                            verticalAlign: 'top'
                        }
                    },
                    {
                        dashStyle: "Solid",
                        className: 'rfsea_highcharts-plot-line_orange',
                        value: $scope.datachart.thrHight,
                        label: {
                            enabled: true,
                            useHTML: true,
                            text: 'threshold 2 - ' + $filter('number')($scope.datachart.thrHight, 0),
                            align: "right",
                            zIndex: 3
                            // verticalAlign: 'top'
                        }
                    }
                ]
                // className: 'highcharts-color-0',
            }],
            tooltip: {
                crosshairs: [false,false],
                shared: false,
                formatter: function(item){

                    if (this.point){

                        if(this.point.name == 'est')
                        {
                            if($scope.bPeople){
                                return "Current Best Estimate - " + $filter('number')(serieEst[0].y, 0);
                            } else {
                                return "Current Best Estimate - " + $filter('number')(serieEst[0].y, 0) + '$';
                            }

                        }

                        // Historical low or high cliecked
                        if(this.point.name == 'hg')
                        {
                            if($scope.bPeople){
                                return $scope.popDetails.desc_hg + ' - ' + $filter('number')(serieHG[0].y, 0);
                            } else {
                                return $scope.popDetails.desc_hg + ' - ' + $filter('number')(serieHG[0].y, 0) + '$';
                            }

                        }

                        // Historical low or high cliecked
                        if(this.point.name == 'hl')
                        {
                            if($scope.bPeople){
                                return $scope.popDetails.desc_hl + ' - ' + $filter('number')(serieHL[0].y, 0);
                            } else {
                                return $scope.popDetails.desc_hl + ' - ' + $filter('number')(serieHL[0].y, 0) + '$';
                            }

                        }

                        // Alternative scenario
                        //
                        if(this.point.name == 'beP0')
                        {
                            if($scope.bPeople){
                                return 'Flood map best estimate WorldPop population' + ' - ' + $filter('number')(this.y, 0);
                            } else {
                                return 'Flood map best estimate WorldPop population' + ' - ' + $filter('number')(this.y, 0) + '$';
                            }

                        }

                        if(this.point.name == 'beP1')
                        {

                            if($scope.bPeople){
                                return 'Flood map best estimate JRC-GHS population' + ' - ' + $filter('number')(this.y, 0);
                            } else {
                                return 'Flood map best estimate JRC-GHS population' + ' - ' + $filter('number')(this.y, 0) + '$';
                            }

                        }

                        if(this.point.name == 'beP2')
                        {
                            if($scope.bPeople){
                                return 'Flood map best estimate GUF-masked WorldPop' + ' - ' + $filter('number')(this.y, 0);
                            } else {
                                return 'Flood map best estimate GUF-masked WorldPop' + ' - ' + $filter('number')(this.y, 0) + '$';
                            }

                        }

                        if(this.point.name == 'a1P0')
                        {
                            if($scope.bPeople){
                                return 'Flood map alternative 2 WorldPop population' + ' - ' + $filter('number')(this.y, 0);
                            } else {
                                return 'Flood map alternative 2 WorldPop population' + ' - ' + $filter('number')(this.y, 0); + '$';
                            }
                        }

                        if(this.point.name == 'a1P1')
                        {
                            if($scope.bPeople){
                                return 'Flood map alternative 2 JRC-GHS population' + ' - ' + $filter('number')(this.y, 0);
                            } else {
                                return 'Flood map alternative 2 JRC-GHS population' + ' - ' + $filter('number')(this.y, 0) + '$';
                            }

                        }

                        if(this.point.name == 'a1P2')
                        {
                            if($scope.bPeople){
                                return 'Flood map alternative 2 GUF-masked WorldPop' + ' - ' + $filter('number')(this.y, 0);
                            } else {
                                return 'Flood map alternative 2 GUF-masked WorldPop' + ' - ' + $filter('number')(this.y, 0) + '$';
                            }

                        }

                        if(this.point.name == 'a2P0')
                        {
                            if($scope.bPeople){
                                return 'Flood map alternative 3 WorldPop population' + ' - ' + $filter('number')(this.y, 0);
                            } else {
                                return 'Flood map alternative 3 WorldPop population' + ' - ' + $filter('number')(this.y, 0) + '$';
                            }

                        }

                        if(this.point.name == 'a2P1')
                        {
                            if($scope.bPeople){
                                return 'Flood map alternative 3 JRC-GHS population' + ' - ' + $filter('number')(this.y, 0);
                            } else {
                                return 'Flood map alternative 3 JRC-GHS population' + ' - ' + $filter('number')(this.y, 0) + '$';
                            }

                        }

                        if(this.point.name == 'a2P2')
                        {
                            if($scope.bPeople){
                                return 'Flood map alternative 3 GUF-masked WorldPop' + ' - ' + $filter('number')(this.y, 0);
                            } else {
                                return 'Flood map alternative 3 GUF-masked WorldPop' + ' - ' + $filter('number')(this.y, 0) + '$';
                            }

                        }

                    }

                    return false;
                }

            },
            plotOptions: {
                series: {
                    cursor: 'pointer',
                    stickyTracking: false,
                    point: {
                        events:
                            {
                                click: function (item){
                                    var bEstimate = true;

                                    // Estimate value clicked
                                    if(serieEst.length > 0){
                                        if((item.point.x == serieEst[0].x && item.point.y == serieEst[0].y) || $scope.clickChartsDisableHistorical)
                                        {
                                            // Estimated point selected
                                            bEstimate = true;

                                            this.update({marker: {symbol: 'url(img/template/orange.png)'}});

                                            // Historical low data -> transparent
                                            if(serieHL.length > 0){
                                                chart.series[2].data[0].update({marker:{symbol: 'url(img/template/blue_trasp.png)'}});
                                            }

                                            // Historical high data -> transparent
                                            if(chart.series[3].data.length > 0){
                                                chart.series[3].data[0].update({marker:{symbol: 'url(img/template/blue_trasp.png)'}});
                                            }

                                            $scope.populationDetails = {
                                                pop_est: serieEst[0].y
                                            }

                                            $scope.sliderdata.data.pop = serieEst[0].y;

                                        }
                                    } else {
                                        if($scope.clickChartsDisableHistorical){
                                            bEstimate = true;
                                            $scope.populationDetails = {
                                                pop_est: 0
                                            }
                                            $scope.sliderdata.data.pop = 0;
                                        }
                                    }

                                    // Historical high clicked
                                    if(serieHG.length > 0){
                                        if(item.point.x == serieHG[0].x && item.point.y == serieHG[0].y && !$scope.clickChartsDisableHistorical)
                                        {
                                            // Historical point selected
                                            bEstimate = false;
                                            $scope.clickChartsDisableHistorical = true;

                                            // Estimated data -> transparent
                                            if(chart.series[1].data.length > 0){
                                                chart.series[1].data[0].update({marker:{symbol: 'url(img/template/orange_trasp.png)'}});
                                            }

                                            // Historical low data -> transparent
                                            if(serieHL.length > 0){
                                                chart.series[2].data[0].update({marker:{symbol: 'url(img/template/blue_trasp.png)'}});
                                            }

                                            // Historical high data -> transparent
                                            if(serieHG.length > 0){
                                                chart.series[3].data[0].update({marker:{symbol: 'url(img/template/blue.png)'}});
                                            }

                                            $scope.populationDetails = {
                                                pop_est: item.point.y
                                            }

                                            $scope.titleHistoricalSelected = $scope.popDetails.desc_hg;
                                            $scope.descHistoricalSelected = $scope.popDetails.long_desc_hg;

                                            $scope.sliderdata.data.pop = serieHG[0].y;
                                        }
                                    }

                                    // Historical low cliecked
                                    if(serieHL.length > 0){
                                        if(item.point.x == serieHL[0].x && item.point.y == serieHL[0].y && !$scope.clickChartsDisableHistorical)
                                        {
                                            // Historical point selected
                                            bEstimate = false;
                                            $scope.clickChartsDisableHistorical = true;

                                            // Estimated data -> transparent
                                            if (chart.series[1].data.length > 0){
                                                chart.series[1].data[0].update({marker:{symbol: 'url(img/template/orange_trasp.png)'}});
                                            }

                                            // Historical low data -> transparent
                                            if (chart.series[2].data.length > 0){
                                                chart.series[2].data[0].update({marker:{symbol: 'url(img/template/blue.png)'}});
                                            }

                                            // Historical high data -> transparent
                                            if(serieHG.length > 0){
                                                chart.series[3].data[0].update({marker:{symbol: 'url(img/template/blue_trasp.png)'}});
                                            }

                                            $scope.populationDetails = {
                                                pop_est: item.point.y
                                            }

                                            $scope.titleHistoricalSelected = $scope.popDetails.desc_hl;
                                            $scope.descHistoricalSelected = $scope.popDetails.long_desc_hl;

                                            $scope.sliderdata.data.pop = serieHL[0].y;

                                        }
                                    }

                                    $timeout(function(){
                                        $scope.bModel = bEstimate;

                                        if ($scope.bModel)
                                        {
                                            $scope.clickChartsDisableHistorical = false;
                                            if($scope.bPeople){
                                                $scope.detailsTitle = "ESTIMATED AFFECTED POPULATION"
                                                $scope.typeTitleHeader = "ESTIMATED AFFECTED POPULATION";
                                            } else {
                                                $scope.detailsTitle = "ESTIMATED EMERGENCY COSTS"
                                                $scope.typeTitleHeader = "ESTIMATED EMERGENCY COSTS";
                                            }

                                        } else {
                                            if($scope.bPeople){
                                                $scope.detailsTitle = "HISTORIC AFFECTED POPULATION"
                                                $scope.typeTitleHeader = "HISTORIC AFFECTED POPULATION";
                                            } else {
                                                $scope.detailsTitle = "HISTORIC EMERGENCY COSTS"
                                                $scope.typeTitleHeader = "HISTORIC EMERGENCY COSTS";
                                            }
                                        }

                                    }, 0);

                                }
                            }
                    }
                }
            },
                series: [{
                    showInLegend: false,
                    marker: objMarkerCurve,
                    data: $scope.series_model,
                    name: "Curve Value"
                },
                {
                    // type: 'spline',
                    showInLegend: false,
                    data: serieEst,
                    zIndex: 5,
                    name: "Estimated"
                },
                {
                    // type: 'scatter',
                    showInLegend: false,
                    data: serieHL,
                    zIndex: 1
                },
                {
                    // type: 'scatter',
                    showInLegend: false,
                    data: serieHG,
                    zIndex: 1
                },
                {
                    type: 'scatter',
                    showInLegend: false,
                    data: serieAlternative1
                },
                {
                    type: 'scatter',
                    showInLegend: false,
                    data: serieAlternative2
                },
                {
                    type: 'scatter',
                    showInLegend: false,
                    data: serieAlternative3
                }
            ]
        });

        if(!$scope.bAnalysis){
            chart.series[4].hide();
            chart.series[5].hide();
            chart.series[6].hide();
        }

    }

    function createChartDollar(){

        (function (H) {
            // Pass error messages
            H.Axis.prototype.allowNegativeLog = true;

            // Override conversions
            H.Axis.prototype.log2lin = function (num) {
                var isNegative = num < 0,
                    adjustedNum = Math.abs(num),
                    result;
                if (adjustedNum < 10) {
                    adjustedNum += (10 - adjustedNum) / 10;
                }
                result = Math.log(adjustedNum) / Math.LN10;
                return isNegative ? -result : result;
            };
            H.Axis.prototype.lin2log = function (num) {
                var isNegative = num < 0,
                    absNum = Math.abs(num),
                    result = Math.pow(10, absNum);
                if (result < 10) {
                    result = (10 * (result - 1)) / (10 - 1);
                }
                return isNegative ? -result : result;
            };
        }(Highcharts));

        chart = Highcharts.chart('chartRFSEA_people_model', {
            chart: {
                type: 'spline',
                backgroundColor:'rgba(255, 255, 255, 0.0)',
                zoomType: "xy"
            },
            exporting:
                {
                    enabled: false
                },
            title: {
                text: ''
            },
            xAxis: {
                crosshair: {
                    snap: false
                },
                // type: 'logarithmic',
                type: 'linear',
                title: {
                    text: 'Return Period [Years]'
                }
            },
            yAxis: {
                crosshair: {
                    snap: false
                },
                // type: 'logarithmic',
                type: 'linear',
                title: {
                    text: 'Emergency Costs [Dollar]'
                },
                plotLines: [
                    {
                        dashStyle: "Solid",
                        className: 'rfsea_highcharts-plot-line_green',
                        value: $scope.datachart.thrLow * dollarMultiplier,
                        label: {
                            enabled: true,
                            useHTML: true,
                            text: 'threshold 1 - ' + $filter('number')($scope.datachart.thrLow * dollarMultiplier, 0) + '$',
                            align: "right",
                            zIndex: 3,
                            verticalAlign: 'top'
                        }
                    },
                    {
                        dashStyle: "Solid",
                        className: 'rfsea_highcharts-plot-line_orange',
                        value: $scope.datachart.thrHight * dollarMultiplier,
                        label: {
                            enabled: true,
                            useHTML: true,
                            text: 'threshold 2 - ' + $filter('number')($scope.datachart.thrHight * dollarMultiplier, 0) + '$',
                            align: "right",
                            zIndex: 3
                            // verticalAlign: 'top'
                        }
                    }
                ]
                // className: 'highcharts-color-0',
            },
            tooltip: {

                crosshairs: [true,true],
                shared: false,
                formatter: function(item){

                    // Estimate value clicked
                    // if(this.x == serieEst[0].x && this.y == serieEst[0].y)
                    // {
                    //     return "Current Best Estimate - " + $filter('number')(serieEst[0].y, 0);
                    // }
                    if (this.point){
                        if(this.point.name == 'est')
                        {
                            if($scope.bPeople){
                                return "Current Best Estimate - " + $filter('number')(serieEst[0].y, 0);
                            } else {
                                return "Current Best Estimate - " + $filter('number')(serieEst_dollar[0].y, 0) + '$';
                            }

                        }

                        // Historical low or high cliecked
                        if(this.point.name == 'hg')
                        {
                            if($scope.bPeople){
                                return $scope.popDetails.desc_hg + ' - ' + $filter('number')(serieHG[0].y, 0);
                            } else {
                                return $scope.popDetails.desc_hg + ' - ' + $filter('number')(serieHG_dollar[0].y, 0) + '$';
                            }

                        }

                        // Historical low or high cliecked
                        if(this.point.name == 'hl')
                        {
                            if($scope.bPeople){
                                return $scope.popDetails.desc_hl + ' - ' + $filter('number')(serieHL[0].y, 0);
                            } else {
                                return $scope.popDetails.desc_hl + ' - ' + $filter('number')(serieHL_dollar[0].y, 0) + '$';
                            }

                        }

                        // Alternative scenario
                        //
                        if(this.point.name == 'beP0')
                        {
                            if($scope.bPeople){
                                return 'Current best estimate flood map, WorldPop population grid ' + ' - ' + $filter('number')(this.y, 0);
                            } else {
                                return 'Current best estimate flood map, WorldPop population grid ' + ' - ' + $filter('number')(this.y, 0) + '$';
                            }

                        }

                        if(this.point.name == 'beP1')
                        {
                            if($scope.bPeople){
                                return 'Second best estimate flood map, JRC-GHS population grid ' + ' - ' + $filter('number')(this.y, 0);
                            } else {
                                return 'Second best estimate flood map, JRC-GHS population grid ' + ' - ' + $filter('number')(this.y, 0) + '$';
                            }

                        }

                        if(this.point.name == 'beP2')
                        {
                            if($scope.bPeople){
                                return 'Third best estimate flood map, GUF-masked WorldPop population grid ' + ' - ' + $filter('number')(this.y, 0);
                            } else {
                                return 'Third best estimate flood map, GUF-masked WorldPop population grid ' + ' - ' + $filter('number')(this.y, 0) + '$';
                            }

                        }

                        if(this.point.name == 'a1P0')
                        {
                            if($scope.bPeople){
                                return 'Flood map alternative 2 WorldPop population' + ' - ' + $filter('number')(this.y, 0);
                            } else {
                                return 'Flood map alternative 2 WorldPop population' + ' - ' + $filter('number')(this.y, 0); + '$';
                            }
                        }

                        if(this.point.name == 'a1P1')
                        {
                            if($scope.bPeople){
                                return 'Flood map alternative 2 JRC-GHS population' + ' - ' + $filter('number')(this.y, 0);
                            } else {
                                return 'Flood map alternative 2 JRC-GHS population' + ' - ' + $filter('number')(this.y, 0) + '$';
                            }

                        }

                        if(this.point.name == 'a1P2')
                        {
                            if($scope.bPeople){
                                return 'Flood map alternative 2 GUF-masked WorldPop' + ' - ' + $filter('number')(this.y, 0);
                            } else {
                                return 'Flood map alternative 2 GUF-masked WorldPop' + ' - ' + $filter('number')(this.y, 0) + '$';
                            }

                        }

                        if(this.point.name == 'a2P0')
                        {
                            if($scope.bPeople){
                                return 'Flood map alternative 3 WorldPop population' + ' - ' + $filter('number')(this.y, 0);
                            } else {
                                return 'Flood map alternative 3 WorldPop population' + ' - ' + $filter('number')(this.y, 0) + '$';
                            }

                        }

                        if(this.point.name == 'a2P1')
                        {
                            if($scope.bPeople){
                                return 'Flood map alternative 3 JRC-GHS population' + ' - ' + $filter('number')(this.y, 0);
                            } else {
                                return 'Flood map alternative 3 JRC-GHS population' + ' - ' + $filter('number')(this.y, 0) + '$';
                            }

                        }

                        if(this.point.name == 'a2P2')
                        {
                            if($scope.bPeople){
                                return 'Flood map alternative 3 GUF-masked WorldPop' + ' - ' + $filter('number')(this.y, 0);
                            } else {
                                return 'Flood map alternative 3 GUF-masked WorldPop' + ' - ' + $filter('number')(this.y, 0) + '$';
                            }

                        }

                    }

                    return false;
                }

            },
            plotOptions: {
                spline: {

                },
                series: {
                    cursor: 'pointer',
                    stickyTracking: false,
                    point: {
                        events:
                            {
                                click: function (item){
                                    var bEstimate = true;

                                    // Estimate value clicked
                                    if(serieEst_dollar.length > 0){
                                        if((item.point.x == serieEst_dollar[0].x && item.point.y == serieEst_dollar[0].y) || $scope.clickChartsDisableHistorical)
                                        {
                                            // Estimated point selected
                                            bEstimate = true;
                                            this.update({marker: {symbol: 'url(img/template/orange.png)'}});

                                            // Historical low data -> transparent
                                            if(serieHL_dollar.length > 0){
                                                chart.series[2].data[0].update({marker:{symbol: 'url(img/template/blue_trasp.png)'}});
                                            }

                                            // Historical high data -> transparent
                                            if(chart.series[3].data.length > 0){
                                                chart.series[3].data[0].update({marker:{symbol: 'url(img/template/blue_trasp.png)'}});
                                            }

                                            $scope.populationDetails = {
                                                pop_est: serieEst_dollar[0].y
                                            }

                                            $scope.sliderdata.data.pop = serieEst[0].y;

                                        }
                                    } else {
                                        if($scope.clickChartsDisableHistorical){
                                            bEstimate = true;
                                            $scope.populationDetails = {
                                                pop_est: 0
                                            }
                                            $scope.sliderdata.data.pop = 0;
                                        }
                                    }

                                    // Historical high cliecked
                                    if(serieHG_dollar.length > 0){
                                        if(item.point.x == serieHG_dollar[0].x && item.point.y == serieHG_dollar[0].y && !$scope.clickChartsDisableHistorical)
                                        {
                                            // Historical point selected
                                            bEstimate = false;
                                            $scope.clickChartsDisableHistorical = true;

                                            // Estimated data -> transparent
                                            if(chart.series[1].data.length > 0){
                                                chart.series[1].data[0].update({marker:{symbol: 'url(img/template/orange_trasp.png)'}});
                                            }

                                            // Historical low data -> transparent
                                            if(serieHL_dollar.length > 0){
                                                chart.series[2].data[0].update({marker:{symbol: 'url(img/template/blue_trasp.png)'}});
                                            }

                                            // Historical high data -> transparent
                                            if(serieHG_dollar.length > 0){
                                                chart.series[3].data[0].update({marker:{symbol: 'url(img/template/blue.png)'}});
                                            }

                                            $scope.populationDetails = {
                                                pop_est: item.point.y
                                            }

                                            $scope.titleHistoricalSelected = $scope.popDetails.desc_hg;

                                            $scope.sliderdata.data.pop = serieHG[0].y;
                                        }
                                    }

                                    // Historical low cliecked
                                    if(serieHL_dollar.length > 0){
                                        if(item.point.x == serieHL_dollar[0].x && item.point.y == serieHL_dollar[0].y && !$scope.clickChartsDisableHistorical)
                                        {
                                            // Historical point selected
                                            bEstimate = false;
                                            $scope.clickChartsDisableHistorical = true;

                                            // Estimated data -> transparent
                                            if(chart.series[1].data.length > 0){
                                                chart.series[1].data[0].update({marker:{symbol: 'url(img/template/orange_trasp.png)'}});
                                            }

                                            // Historical low data -> transparent
                                            if(chart.series[2].data.length > 0){
                                                chart.series[2].data[0].update({marker:{symbol: 'url(img/template/blue.png)'}});
                                            }


                                            // Historical high data -> transparent
                                            if(serieHG_dollar.length > 0){
                                                chart.series[3].data[0].update({marker:{symbol: 'url(img/template/blue_trasp.png)'}});
                                            }

                                            $scope.populationDetails = {
                                                pop_est: item.point.y
                                            }

                                            $scope.titleHistoricalSelected = $scope.popDetails.desc_hl;

                                            $scope.sliderdata.data.pop = serieHL[0].y;

                                        }
                                    }

                                    $timeout(function(){
                                        $scope.bModel = bEstimate;

                                        if ($scope.bModel)
                                        {
                                            $scope.clickChartsDisableHistorical = false;
                                            if($scope.bPeople){
                                                $scope.detailsTitle = "ESTIMATED AFFECTED POPULATION"
                                                $scope.typeTitleHeader = "ESTIMATED AFFECTED POPULATION";
                                            } else {
                                                $scope.detailsTitle = "ESTIMATED EMERGENCY COSTS"
                                                $scope.typeTitleHeader = "ESTIMATED EMERGENCY COSTS";
                                            }

                                        } else {
                                            if($scope.bPeople){
                                                $scope.detailsTitle = "HISTORIC AFFECTED POPULATION"
                                                $scope.typeTitleHeader = "HISTORIC AFFECTED POPULATION";
                                            } else {
                                                $scope.detailsTitle = "HISTORIC EMERGENCY COSTS"
                                                $scope.typeTitleHeader = "HISTORIC EMERGENCY COSTS";
                                            }
                                        }

                                    }, 0);

                                }
                            }
                    }
                }
            },
            series: [{
                showInLegend: false,
                marker: objMarkerCurve,
                data: $scope.series_model_dollar,
                name: "Curve Value"
            },
                {
                    showInLegend: false,
                    data: serieEst_dollar,
                    zIndex: 5,
                    name: "Estimated"
                },
                {
                    showInLegend: false,
                    data: serieHL_dollar,
                    zIndex: 1
                },
                {
                    showInLegend: false,
                    data: serieHG_dollar,
                    zIndex: 1
                },
                {
                    type: 'scatter',
                    showInLegend: false,
                    data: serieAlternative1_dollar
                },
                {
                    type: 'scatter',
                    showInLegend: false,
                    data: serieAlternative2_dollar
                },
                {
                    type: 'scatter',
                    showInLegend: false,
                    data: serieAlternative3_dollar
                }
            ]
        });

        if(!$scope.bAnalysis){
            chart.series[4].hide();
            chart.series[5].hide();
            chart.series[6].hide();
        }
    }

    function returnInterpulationPoint(yValue, type){
        // Return the x value relative the curve values
        var objCurve = [];
        var indexPoint1 = 0;
        var indexPoint0 = 0;
        var dy = 0;
        var xVal = 0;
        var imgUrl = "";

        if(type=='est')
        {
            imgUrl = 'url(img/template/orange.png)';
        } else {
            imgUrl = 'url(img/template/blue_trasp.png)';
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

            return [{
                x:xVal,
                y:yValue,
                marker:{symbol: imgUrl},
                name: type
            }];

        } else {
            // No points found
            if (type == 'hg'){
                // Historical high
                return [{
                    x: $scope.series_model[$scope.series_model.length - 1][0],
                    y: $scope.series_model[$scope.series_model.length - 1][1],
                    marker:{symbol: imgUrl},
                    name: type
                }];
            }

            if (type == 'hl'){
                // Historical low
                return [{
                    x: $scope.series_model[0][0],
                    y: $scope.series_model[0][1],
                    marker:{symbol: imgUrl},
                    name: type
                }];
            }

            if (type == 'est'){
                // Historical high
                return [];
            }

        }

    }

    function returnAlternativeScenario(aNumberList, indexRif, name){
        // Return three point for the alternative scenario.

        var objMainPoint = [];
        var xVal = 0;
        var imgUrl = 'url(img/template/as_orange_small.png)';
        var imgUrlBig = 'url(img/template/as_orange_big.png)';

        objMainPoint = returnInterpulationPoint(aNumberList[indexRif], 'est');

        if (objMainPoint.length > 0){
            return [
                {
                    x: objMainPoint[0].x,
                    y:aNumberList[0],
                    marker: {
                        enabled: true,
                        symbol: imgUrlBig},
                    name: name + 'P0'
                },
                {
                    x: objMainPoint[0].x,
                    y:aNumberList[1],
                    marker: {
                        enabled: true,
                        symbol: imgUrl
                    },
                    name: name + 'P1'
                },
                {
                    x: objMainPoint[0].x,
                    y:aNumberList[2],
                    marker: {
                        enabled: true,
                        symbol: imgUrl
                    },
                    name: name + 'P2'
                }
            ];
        } else
        {
            return [
                {
                    x: $scope.series_model[$scope.series_model.length - 1][0],
                    y:aNumberList[0],
                    marker:{symbol: imgUrlBig},
                    name: name + 'P0'
                },
                {
                    x: $scope.series_model[$scope.series_model.length - 1][0],
                    y:aNumberList[1],
                    color:'#ff8b00',
                    marker:{symbol: imgUrl},
                    name: name + 'P1'
                },
                {
                    x: $scope.series_model[$scope.series_model.length - 1][0],
                    y:aNumberList[2],
                    color:'#ff8b00',
                    marker:{symbol: imgUrl},
                    name: name + 'P2'
                }
            ];
        }


    }

    function setDollarValueAlternativePoints (objPoints) {
        // Return objPoints with all x & y upgrade in dollar
        var nrPoint = 3;

        for (i=0; i < nrPoint; i++){
            //For all points
            objPoints[i].x = objPoints[i].x * dollarMultiplier;
            objPoints[i].y = objPoints[i].y * dollarMultiplier;
        };

        return objPoints;

    }

    function  setHistoricalSeries() {

        if ($scope.bPastEvents)
        {
            $scope.bModel = true;
            if(serieEst.length > 0){
                // Estimated data
                if(chart.series[1].data.length > 0){
                    chart.series[1].data[0].update({marker:{symbol: 'url(img/template/orange.png)'}});
                }
            }

            // Historical low data
            if(serieHL.length > 0){
                chart.series[2].data[0].update({marker:{symbol: 'url(img/template/blue_trasp.png)'}});
            }

            // Historical high data -> transparent
            if(serieHG.length > 0){
                chart.series[3].data[0].update({marker:{symbol: 'url(img/template/blue_trasp.png)'}});
            }


        } else {
            // Historical low data -> transparent
            if(serieEst.length > 0){
                chart.series[1].data[0].update({marker:{symbol: 'url(img/template/orange.png)'}});
            }

            // Historical low data -> transparent
            if(serieHL.length > 0){
                chart.series[2].data[0].update({marker:{symbol: 'url()'}, dataLabels:{enabled: false }});
            }

            // Historical high data -> transparent
            if(serieHG.length > 0){
                chart.series[3].data[0].update({marker:{symbol: 'url()'}, dataLabels:{enabled: false }});
            }

        }

    }

});

