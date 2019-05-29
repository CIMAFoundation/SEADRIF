/**
 * Created by Manuel on 5/29/2019.
 */

rfseaApp.controller('rfseaCtrlloginform', function($rootScope, $scope, $timeout, $filter, rfseaSrv, $window)
{

    $scope.loginData = {
        usr: "",
        psw: ""
    }

    $scope.signinUsr = {
        name: "",
        lastname: "",
        email: "",
        institution: ""
    }

    $scope.formstatus = false;
    $scope.bLoginActive = false;
    $scope.bRegisterActive = false;
    $scope.txtBtn = "";

    $scope.$watch('formstatus',function(){
        if($scope.type !== 'close' || $scope.type !== 'register')
        {
            setLoginForm($scope.type);
        }

    })

    function setLoginForm(type){
        if(type == 'login')
        {
            $scope.formstatus = true;
            $scope.bLoginActive = true;
            $scope.bRegisterActive = false;
            $scope.txtBtn = "LOGIN";
        }

        if(type=='register'){
            $scope.formstatus = true;
            $scope.bLoginActive = false;
            $scope.bRegisterActive = true;
            $scope.txtBtn = "REQUEST REGISTRATION";
        }

        if(type=='close'){
            $scope.formstatus = false;
            $scope.bLoginActive = false;
            $scope.bRegisterActive = false;
            $scope.txtBtn = "";
            $scope.bLoggedInMenu = false;
        }

        if(type == '')
        {
            // Call logout API for brower cookies
            // Get user name
            rfseaSrv.getLogout(function(data)
            {
                $scope.formstatus = false;
                $scope.bLoginActive = false;
                $scope.bRegisterActive = false;
                $scope.txtBtn = "";
                $scope.bLoggedInMenu = false;
                localStorage.removeItem('rfsea_login');
                localStorage.removeItem('rfsea_country_selected');
                $window.location.href = "index.html";

            }, function(data)
            {
                // Error
                console.log(data);
            });
        }
    }

    $scope.setLoginForm = function(type)
    {
        $scope.type = type;
        setLoginForm(type);
    }

    $scope.loginFormEnter = function()
    {
        if($scope.txtBtn == 'LOGIN'){
            // Login action

            rfseaSrv.login($scope.loginData.usr, $scope.loginData.psw, function(data)
            {
                // set Login cookies
                if(data.data.success){
                    //Login success

                    console.log(data);

                    // Get user name
                    rfseaSrv.getWhoami(function(data)
                    {
                        console.log(data);

                        $scope.userinfo = {
                            usrlogin: data.data,
                            usrlevel: "seaDrif",
                            usrloginstatus: true
                        };

                        localStorage.setItem('rfsea_login', JSON.stringify($scope.userinfo));
                        $scope.formstatus = false;
                        $scope.bLoginActive = false;
                        $scope.bRegisterActive = false;

                        $window.location.href = "countries.html";

                    }, function(data)
                    {
                        // Error
                        console.log(data);
                    });

                } else {
                    // Login error
                    vex.dialog.alert({
                        message: 'Incorrect username or password'
                    })
                }

            }, function(data)
            {
                // Error
                console.log(data);
                vex.dialog.alert({
                    message: 'Incorrect username or password'
                })
            });

        } else {
            // Register call

            var mailInfo = {
                'text': 'registration request from SEADRIF: name: ' + $scope.signinUsr.name + '; last name: ' +$scope.signinUsr.lastname + '; email: ' + $scope.signinUsr.email + '; institution: ' + $scope.signinUsr.institution,
                'object': 'SEADRIF - Registration request',
                //sender: mail mittente
                'users': 'manuel.cavallaro@cimafoundation.org'
            };

            rfseaSrv.sendRegistrationRequest(mailInfo, function(data)
            {

                vex.dialog.alert({
                    message: 'Registration request sent correctly, we will contact you as soon as possible.'
                })

            }, function(data)
            {
                // Error
                console.log(data);
                vex.dialog.alert({
                    message: 'API error, contact us'
                })
            });
        }
    }

});


