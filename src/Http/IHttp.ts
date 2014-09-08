/// <reference path="../../typings/tsd.d.ts" />

import Q = require('q');
import request = require('request');
import HttpResponse = require('./HttpResponse');

interface IHttp {
    get(uri: string, options?: request.Options): Q.Promise<HttpResponse>;

    post(uri: string, options?: request.Options): Q.Promise<HttpResponse>;
}

export = IHttp;

