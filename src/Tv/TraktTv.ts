/// <reference path="../../typings/tsd.d.ts" />

var S = require('string');

import Q = require('q');
import cheerio = require('cheerio');

import IHttp = require('../Http/IHttp');
import HttpResponse = require('../Http/HttpResponse');

class TraktTv {

    constructor(private http: IHttp, private traktTvId: string) {

    }

    getShow(show: string): Q.Promise<any> {
        var query = S(show).slugify().s;

        return this.http
            .get('http://api.trakt.tv/show/summary.json/' + this.traktTvId + '/' + query + '/extended')
            .then(r => JSON.parse(r.body));
    }

}

export = TraktTv;
