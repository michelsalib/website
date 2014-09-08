/// <reference path="../../typings/tsd.d.ts" />

import Q = require('q');
import express = require('express');

import Container = require('../DependencyInjection/Container');

export interface IServerCallback {
    (container: Container, req: express.Request): any;
}

export interface IServer {
    get(path: string, handler: IServerCallback): void;
    post(path: string, handler: IServerCallback): void;
    setup(handler: (req: express.Request, res: express.Response) => Container): void;
    tearDown(handler: (container: Container, responseData: any) => any): void;
    error(handler: (container: Container, error: Error) => any): void;
}

export class ExpressServer implements IServer {
    private _setup: (req: express.Request, res: express.Response) => Container;
    private _tearDown: (container: Container, responseData: any) => any = (inj, data) => data;
    private _error: (container: Container, error: Error) => any = (_, e) => { return { error: { message: e.message } } };

    handle(handler: IServerCallback, req: express.Request, res: express.Response): void {
        var container = this._setup(req, res);

        Q.promised(handler)(container, req)
            // transform errors to response
            .catch(err => {
                res.status(500);
                return this._error(container, err);
            })
            // tear down response
            .then(response => this._tearDown(container, response))
            // send response
            .then(response => res.send(response))
            // generic error handling
            .catch((err) => {
                res.status(500);
                res.send({
                    error: {
                        message: err.toString()
                    }
                });
            });
    }

    constructor(private app: express.Application) {

    }

    setup(handler: (req: express.Request, res: express.Response) => Container): void {
        this._setup = handler;
    }

    tearDown(handler: (container: Container, responseData: any) => any): void{
        this._tearDown = handler;
    }

    error(handler: (container: Container, error: Error) => any): void {
        this._error = handler;
    }

    get(path: string, handler: IServerCallback) {
        this.app.get(path, (req, res) => this.handle(handler, req, res));
    }

    post(path: string, handler: IServerCallback) {
        this.app.post(path, (req, res) => this.handle(handler, req, res));
    }
}
