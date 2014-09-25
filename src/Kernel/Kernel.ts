/// <reference path="../../typings/tsd.d.ts" />

import Q = require('q');
import express = require('express');

import Container = require('../DependencyInjection/Container');
import Server = require('../Server/Server');

class Kernel {
    private container: Container;

    constructor() {
        // init container
        this.container = new Container();

        this.loadConfig();
        this.loadServices();
    }

    private loadConfig(): void {
        try {
            // default conf in conf.json file
            var conf = require('../../conf.json');

            for (var name in conf) {
                this.container.constant(name, conf[name]);
            }
        }
        catch (ex) {
            // else read in env variable (azure style)
            for (var name in process.env) {
                this.container.constant(name, process.env[name]);
            }
        }
    }

    private loadServices(): void {
        // http
        this.container.factory('requestLib', () => { return require('request'); });
        this.container.service('rawHttp', require('../Http/Http'));
        this.container.service('http', require('../Http/CachedHttp'));

        // soundcloud
        this.container.service('soundCloud', require('../SoundCloud/SoundCloud'));

        // subtitles
        this.container.service('subtitles', require('../Subtitles/Addic7edSubtitles'));

        // torrentz
        this.container.service('torrents', require('../Torrents/EztvTorrents'));

        // tv
        this.container.service('tv', require('../Tv/TraktTv'));

        // cache
        this.container.service('cache', require('../Storage/Cache'));
    }

    setupServer(server: Server.IServer): void {

        server.setup((request: express.Request, response: express.Response) => {
            var container = this.container.clone();

            container.constant('request', request);
            container.constant('response', response);

            return container;
        });

        server.get('/tv/shows/:show', (container: Container, req: express.Request) => {
            return container.get('tv').getShow(req.param('show'));
        });

        server.get('/tv/trending', (container: Container, req: express.Request) => {
            return container.get('tv').getTrending();
        });

        server.get('/soundcloud/:user', (container: Container, req: express.Request) => {
            return container.get('soundCloud').getTracks(req.param('user')).then(r => {
                container.get('response').set('Content-Type', 'application/xml; charset=utf-8');

                return r;
            });
        });

        server.get('/tv/subtitles/:show', (container: Container, req: express.Request) => {
            return container.get('subtitles').getSubtitles(req.param('show'));
        });

        server.get('/tv/torrents/:show', (container: Container, req: express.Request) => {
            return container.get('torrents').getTorrents(req.param('show'));
        });

        server.get('/link', (container: Container, req: express.Request) => {
            return container.get('rawHttp').get(req.query.href, {
                    headers: {
                        referer: req.query.referer
                    }
                })
                .then(r => {
                    container.get('response').set('content-disposition', r.headers['content-disposition']);
                    container.get('response').set('content-type', r.headers['content-type']);

                    return r.body;
                });
        });

    }
}

export = Kernel;
