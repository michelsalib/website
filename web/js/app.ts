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
            shows: any;
            goToShow(show: string): void;
        }

        export interface IShowScope extends IAppScope {
            show: string;
            info: any;
            subtitles: any;
            torrents: any;
            error: any;
            loading: boolean;
            episodeMatcher(season, episode): (item) => boolean;
        }

        export class AppController {
            constructor(private $scope:IAppScope, private $route) {
                $scope.$on('$routeChangeSuccess', () => $scope.route = $route.current.locals.name);
            }
        }

        export class TvController {
            constructor(private $scope:ITvScope, private $location: ng.ILocationService, private $http: ng.IHttpService) {
                $http.get('/tv/trending/')
                    .then(r => $scope.shows = r.data);

                $scope.goToShow = (show:string) => {
                    $location.path('/tv/' + show);
                };
            }
        }

        export class ShowController {
            constructor(private $scope:IShowScope, private $routeParams, private $http: ng.IHttpService) {
                $scope.show = $routeParams.show;
                $scope.loading = true;

                $http.get('/tv/shows/' + $scope.show)
                    .then(r => $scope.info = r.data)
                    .catch(err => $scope.error = err)
                    .finally(() => $scope.loading = false);

                $http.get('/tv/torrents/' + $scope.show)
                    .then(r => $scope.torrents = r.data);

                $http.get('/tv/subtitles/' + $scope.show)
                    .then(r => $scope.subtitles = r.data);

                $scope.episodeMatcher = (season, episode) => (item) => item.season == season && item.episode == episode;
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

app.config(($compileProvider) => {
    $compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|ftp|mailto|tel|file|magnet):/);
});

app.directive('msEnter', () => (scope, element, attrs) => {
    element.bind("keydown keypress", event => {
        if (event.which === 13) {
            scope.$apply(() => scope.$eval(attrs.msEnter));
            event.preventDefault();
        }
    });
});

app.filter('isFuture', () => (date) => parseInt(date) > new Date().getTime() / 1000);

