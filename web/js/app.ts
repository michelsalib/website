/// <reference path="../../typings/tsd.d.ts" />

declare var Bloodhound: any;

$(document).on('mouseenter', '[data-toggle="tooltip"]', (e) => {
    (<any>$)(e.currentTarget).tooltip('show');
});

var tvShowsSuggestions = new Bloodhound({
  datumTokenizer: Bloodhound.tokenizers.obj.whitespace('title'),
  queryTokenizer: Bloodhound.tokenizers.whitespace,
  prefetch: '/tv/trending',
  remote: '/tv/suggest/%QUERY'
});

module MichelSalib {

    export module Controllers {

        export interface IAppScope extends ng.IScope {
            route: string;
            background: string;
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

            $parent: IAppScope;
        }

        export class AppController {
            constructor(private $scope:IAppScope, private $route) {
                $scope.$on('$routeChangeSuccess', () => {
                    $scope.route = $route.current.locals.name;
                    $scope.background = null;
                });
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
                    .then(r => {
                        $scope.info = r.data;
                        $scope.$parent.background = $scope.info.images.fanart;
                    })
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

var app = angular.module('michel-salib', [/*'ngAnimate',*/ 'ngRoute', 'ngCookies']);

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

app.directive('msBackground', () => {
    return {
        link: ($scope, $element: ng.IAugmentedJQuery, $attrs) => {
            $scope.$watch($attrs.msBackground, bg => {
                if (bg) {
                    $element.css('background-image', 'url(' + bg + ')');
                }
                else {
                    $element.css('background-image', '');
                }
            })
        }
    }
});

app.directive('msSuggest', ($parse) => {
    return {
        link: ($scope, $element: any, $attrs) => {
            var model = $parse($attrs.msSuggest);

            tvShowsSuggestions.initialize();

            $element.typeahead({
                hint: true,
                highlight: true,
                minLength: 2
            },
            {
                name: 'tv-shows',
                displayKey: 'title',
                templates: {
                    suggestion: (item) => {
                        return '<p>' + item.title + ' <em>' + item.genres.join(', ') + '</em></p>'
                    }
                },
                source: tvShowsSuggestions.ttAdapter()
            }).on('typeahead:selected typeahead:autocompleted', (e, item) => {
                model.assign($scope, item.title);
            });
        }
    };
});

app.filter('isFuture', () => date => !date || parseInt(date) > new Date().getTime() / 1000);

app.filter('fromNow', () => date => moment(date * 1000).fromNow());
