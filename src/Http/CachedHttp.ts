/// <reference path="../../typings/tsd.d.ts" />

import Q = require('q');
import request = require('request');
import IHttp = require('./IHttp');
import HttpResponse = require('./HttpResponse');
import Cache = require('../Storage/Cache');

class CachedHttp implements IHttp {

    constructor(private rawHttp: IHttp, private cache: Cache) {

    }

    get(uri: string, options: request.Options = {}): Q.Promise<HttpResponse> {
        var key = 'http ' + uri + ' ' + JSON.stringify(options);

        return this.cache
            .get(key)
            .then((cachedResult) => {
                var result = this.rawHttp.get(uri, options)
                    // cache
                    .then(r => {
                        this.cache.set(key, r.body);

                        return r;
                    });

                if (cachedResult) {
                    return Q.resolve({
                        body: cachedResult
                    });
                }

                return result;
            });
    }

    post(uri: string, options: request.Options = {}): Q.Promise<HttpResponse> {
        return this.rawHttp.post(uri, options);
    }
}

export = CachedHttp;
