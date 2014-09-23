/// <reference path="../../typings/tsd.d.ts" />

$(document).on('mouseenter', '[data-toggle="tooltip"]', (e) => {
    (<any>$)(e.currentTarget).tooltip('show');
});

module MichelSalib {

    export module Controllers {

        export interface IAppScope extends ng.IScope {
            route: string;
        }

        export interface ITvScope extends IAppScope {
            goToShow(show: string): void;
        }

        export interface IShowScope extends IAppScope {
            show: string;
            info: any;
            error: any;
            loading: boolean;
        }

        export interface ITorrentsScope extends ng.IScope {
            torrents: any;
            error: any;
            loading: boolean;
        }

        export class AppController {
            constructor(private $scope:IAppScope, private $route) {
                $scope.$on('$routeChangeSuccess', () => $scope.route = $route.current.locals.name);
            }
        }

        export class TvController {
            constructor(private $scope:ITvScope, private $location: ng.ILocationService) {
                $scope.goToShow = (show:string) => {
                    $location.path('/tv/' + show);
                };
            }
        }

        export class ShowController {
            constructor(private $scope:IShowScope, private $routeParams, private $http: ng.IHttpService) {
                $scope.show = $routeParams.show;
                $scope.loading = true;

                $http.get('/tv/' + $scope.show)
                    .then(r => $scope.info = r.data)
                    .catch(err => $scope.error = err)
                    .finally(() => $scope.loading = false);
            }
        }

        export class TorrentsController {
            private load(show: string) {
                this.$scope.error = null;
                this.$scope.torrents = null;

                if (!show) {
                    this.$scope.loading = false;
                    return;
                }

                this.$scope.loading = true;

                this.$http.get('/torrents', {params: {show: show}})
                    .then(r => this.$scope.torrents = r.data)
                    .catch(err => this.$scope.error = err)
                    .finally(() => this.$scope.loading = false);
            }

            constructor(private $scope:ITorrentsScope, private $attrs, private $http: ng.IHttpService) {
                $scope.$parent.$watch($attrs.msTorrents, (n, o) => {
                    if (n && n!=o) {
                        this.load(n);
                    }
                });

                this.load($scope.$parent.$eval($attrs.msTorrents));
            }
        }
    }
}

var app = angular.module('michel-salib', ['ngRoute', 'ngCookies']);

app.controller('AppController', MichelSalib.Controllers.AppController);

app.config(($routeProvider, $locationProvider) => {
    $locationProvider.html5Mode(false);

    $routeProvider.otherwise({
        redirectTo: '/tv'
    });
    $routeProvider.when('/tv', {
        templateUrl: 'partials/tv.html',
        controller: MichelSalib.Controllers.TvController,
        resolve: {
            name: () => 'tv'
        }
    });
    $routeProvider.when('/tv/:show', {
        templateUrl: 'partials/show.html',
        controller: MichelSalib.Controllers.ShowController,
        resolve: {
            name: () => 'tv'
        }
    });
});

app.directive('msTorrents', () => {
    return {
        templateUrl: 'partials/torrents.html',
        scope: {},
        controller: MichelSalib.Controllers.TorrentsController
    };
});

app.directive('msEnter', () => (scope, element, attrs) => {
    element.bind("keydown keypress", event => {
        if (event.which === 13) {
            scope.$apply(() => scope.$eval(attrs.msEnter));
            event.preventDefault();
        }
    });
});
