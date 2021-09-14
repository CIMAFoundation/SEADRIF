/**
 * Created by Manuel on 12/02/2018.
 */

rfseaApp.controller('rfseamenuCtrl', function($rootScope, $scope, $window, rfseaSrv, $location)
{

    $scope.bCountriesList = false;

    if ($scope.userinfo) {
        $scope.bLoggedInMenu = true;

    } else {
        $scope.bLoggedInMenu = false;

        $scope.login = {
            status:false,
            type: ""
        };

    }

    $scope.setDistrictView = function()
    {
        // $scope.districtShow = !$scope.districtShow;
        $scope.districtShow = true;
        $scope.riskprofileShow = false;

    }

    $scope.setRiskProfileView = function()
    {
        $scope.riskprofileShow = !$scope.riskprofileShow;
        $scope.districtShow = false;
    }

    $scope.setCountryProfileView = function()
    {
        $scope.riskprofileShow = false;
        $scope.districtShow = false;
    }

    $scope.changeCountrySelection = function(country)
    {
        $location.search('p', null);
        $scope.riskprofileShow = false;
        $scope.districtShow = false;
        $scope.bCountriesList = !$scope.bCountriesList;

        $scope.countryselected = country;
        $rootScope.contry_selected = country;

    }

    $scope.changeCountrySelectionMovePage = function(country)
    {
        $scope.riskprofileShow = false;
        $scope.districtShow = false;
        $scope.bCountriesList = !$scope.bCountriesList;

        localStorage.setItem('rfsea_country_selected', JSON.stringify(country));
        $window.location.href = 'countries.html';

    }

    $scope.showHideCountriesList = function () {

        $scope.bCountriesList = !$scope.bCountriesList;

    }

    /***********************************************************/
    /***************** LOGIN FORM ******************************/
    /***********************************************************/

    $scope.setLoginView = function(type){
        $scope.login.status = !$scope.login.status;
        $scope.login.type = type;
    }

    // $scope.loginData = {
    //     usr: "",
    //     psw: ""
    // }
    //
    // $scope.signinUsr = {
    //     name: "",
    //     lastname: "",
    //     email: "",
    //     institution: ""
    // }
    //
    // $scope.bLoginForm = false;
    // $scope.bLoginActive = false;
    // $scope.bRegisterActive = false;
    // $scope.txtBtn = "";
    //
    // $scope.setLoginForm = function(type)
    // {
    //
    //     if(type == 'login')
    //     {
    //         $scope.bLoginForm = true;
    //         $scope.bLoginActive = true;
    //         $scope.bRegisterActive = false;
    //         $scope.txtBtn = "LOGIN";
    //     }
    //
    //     if(type=='register'){
    //         $scope.bLoginForm = true;
    //         $scope.bLoginActive = false;
    //         $scope.bRegisterActive = true;
    //         $scope.txtBtn = "REQUEST REGISTRATION";
    //     }
    //
    //     if(type=='close'){
    //         $scope.bLoginForm = false;
    //         $scope.bLoginActive = false;
    //         $scope.bRegisterActive = false;
    //         $scope.txtBtn = "";
    //         $scope.bLoggedInMenu = false;
    //     }
    //
    //     if(type == '')
    //     {
    //         // Call logout API for brower cookies
    //         // Get user name
    //         rfseaSrv.getLogout(function(data)
    //         {
    //             $scope.bLoginForm = false;
    //             $scope.bLoginActive = false;
    //             $scope.bRegisterActive = false;
    //             $scope.txtBtn = "";
    //             $scope.bLoggedInMenu = false;
    //             localStorage.removeItem('rfsea_login');
    //             localStorage.removeItem('rfsea_country_selected');
    //             $window.location.href = "index.html";
    //
    //         }, function(data)
    //         {
    //             // Error
    //             console.log(data);
    //         });
    //     }
    //
    // }
    //
    // $scope.loginFormEnter = function()
    // {
    //     if($scope.txtBtn == 'LOGIN'){
    //         // Login action
    //
    //         rfseaSrv.login($scope.loginData.usr, $scope.loginData.psw, function(data)
    //         {
    //             // set Login cookies
    //             if(data.data.success){
    //                 //Login success
    //
    //                 console.log(data);
    //
    //                 // Get user name
    //                 rfseaSrv.getWhoami(function(data)
    //                 {
    //                     console.log(data);
    //
    //                     $scope.userinfo = {
    //                         usrlogin: data.data,
    //                         usrlevel: "seaDrif",
    //                         usrloginstatus: true
    //                     };
    //
    //                     localStorage.setItem('rfsea_login', JSON.stringify($scope.userinfo));
    //                     $scope.bLoginForm = false;
    //                     $scope.bLoginActive = false;
    //                     $scope.bRegisterActive = false;
    //
    //                     $window.location.href = "countries.html";
    //
    //                 }, function(data)
    //                 {
    //                     // Error
    //                     console.log(data);
    //                 });
    //
    //             } else {
    //                 // Login error
    //                 vex.dialog.alert({
    //                     message: 'Incorrect username or password'
    //                 })
    //             }
    //
    //         }, function(data)
    //         {
    //             // Error
    //             console.log(data);
    //             vex.dialog.alert({
    //                 message: 'Incorrect username or password'
    //             })
    //         });
    //
    //     } else {
    //         // Register call
    //
    //         var mailInfo = {
    //             'text': 'registration request from SEADRIF: name: ' + $scope.signinUsr.name + '; last name: ' +$scope.signinUsr.lastname + '; email: ' + $scope.signinUsr.email + '; institution: ' + $scope.signinUsr.institution,
    //             'object': 'SEADRIF - Registration request',
    //             //sender: mail mittente
    //             'users': 'manuel.cavallaro@cimafoundation.org'
    //         };
    //
    //         rfseaSrv.sendRegistrationRequest(mailInfo, function(data)
    //         {
    //
    //             vex.dialog.alert({
    //                 message: 'Registration request sent correctly, we will contact you as soon as possible.'
    //             })
    //
    //         }, function(data)
    //         {
    //             // Error
    //             console.log(data);
    //             vex.dialog.alert({
    //                 message: 'API error, contact us'
    //             })
    //         });
    //     }
    // }

    $scope.setHomeView = function(){
        $scope.countryhomeshow = false;
        localStorage.removeItem('rfsea_country_selected');
        $window.location.href = "countries.html";
    }

    /***********************************************************/
    /***************** UTILITY *********************************/
    /***********************************************************/

    $scope.gotoPage = function(url){
        $window.location.href = url;
    }

});
