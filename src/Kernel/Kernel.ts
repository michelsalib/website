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
        this.container.service('http', require('../Http/Http'));

        // soundcloud
        this.container.service('soundCloud', require('../SoundCloud/SoundCloud'));
    }

    setupServer(server: Server.IServer): void {

        server.setup((request: express.Request, response: express.Response) => {
            var container = this.container.clone();

            container.constant('request', request);
            container.constant('response', response);

            return container;
        });

        server.get('/soundcloud/:user', (container: Container, req: express.Request) => {
            return container.get('soundCloud').getTracks(req.param('user'));
        });

    }
}

export = Kernel;