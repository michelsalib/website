/// <reference path="../../typings/tsd.d.ts" />

import Q = require('q');
import IHttp = require('./IHttp');
import request = require('request');
import HttpResponse = require('./HttpResponse');

class Http implements IHttp {

    constructor(private requestLib) {

    }

    private handle(method: string, uri: string, options: request.Options = {}): Q.Promise<HttpResponse> {
        return (<any>Q).denodeify(this.requestLib[method])(uri, options).spread(response => {
            if (response.statusCode != 200) {
                throw new Error('Http get query for "' + uri + '". Got "' + response.statusCode + '".');
            }

            return response;
        });
    }

    get(uri: string, options: request.Options = {}): Q.Promise<HttpResponse> {
        return this.handle('get', uri, options);
    }

    post(uri: string, options: request.Options = {}): Q.Promise<HttpResponse> {
        return this.handle('post', uri, options);
    }
}

export = Http;
