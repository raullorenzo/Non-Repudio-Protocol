
nonRepudio.config(function ($stateProvider, $urlRouterProvider) {

    $stateProvider
        .state('/', {
            url: "/",
            templateUrl: "index.html"
        });
    $urlRouterProvider.otherwise('/');
});