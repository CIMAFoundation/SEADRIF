/**
 * Created by Manuel on 12/02/2017.
 */

// rfseaApp.directive('topmenu',function(){
//     return {
//         // transclude: true,
//         restrict: 'E',
//         controller: "rfseamenuCtrl",
//         templateUrl: 'js/views/main-menu-top.html',
//         scope: {
//             page: "@",
//             districtShow: "=",
//             countrySelect: "=",
//             countryhomeshow: "=",
//             riskprofileShow: "=",
//             districtdetails: "="
//         }
//     }
// });

rfseaApp.directive('topmenu',function(){
    return {
        // transclude: true,
        restrict: 'E',
        controller: "rfseamenuCtrl",
        templateUrl: 'js/views/main-menu-top.html',
        scope: {
            mainmenu: "=",
            userinfo: "=",
            countryselected: "=",
            riskprofileShow: "=",
            districtShow: "=",
            countries: "=",
            districtdetails: "="
        }
    }
});

rfseaApp.directive('loginform',function(){
    return {
        // transclude: true,
        restrict: 'E',
        controller: "rfseaCtrlloginform",
        templateUrl: 'js/views/login-form.html',
        scope: {
            formstatus: "=",
            type: "="
        }
    }
});

rfseaApp.directive('rfseafooter',function(){
    return {
        // transclude: true,
        restrict: 'E',
        controller: "rfseafooetrCtrl",
        templateUrl: 'js/views/footer.html'
    }
});

rfseaApp.directive('rfseachartpeople',function(){
    return {
        // transclude: true,
        restrict: 'E',
        controller: "rfseaCtrlchartpeople",
        templateUrl: 'js/views/chart_people.html',
        scope: {
            datachart: "=",
            curvex: "=",
            curvey: "=",
            popDetails: "=",
            bRiskProfile: "=",
            countryhomeshow: "=",
            sliderdata: "="
        }
    }
});

rfseaApp.directive('rfsealegend',function(){
    return {
        // transclude: true,
        restrict: 'E',
        controller: "rfseaCtrllegend",
        templateUrl: 'js/views/map_legend.html',
        scope: {
            paletteobj: "=",
            position: "=",
            type: "=",
            datatype: "=",
            titletoshow: "="
        }
    }
});


rfseaApp.directive('rfseaslider',function(){
    return {
        // transclude: true,
        restrict: 'AEC',
        controller: "rfseasliderCtrl",
        templateUrl: 'js/views/slider.html',
        scope: {
            data: "="
        }
    }
});
