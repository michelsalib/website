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

        return Q.all([
            this.http.get('http://api.trakt.tv/show/summary.json/' + this.traktTvId + '/' + query, {
                qs: {
                    extended: true
                }
            }).then(r => JSON.parse(r.body)),
            this.http.get('http://api.trakt.tv/show/seasons.json/' + this.traktTvId + '/' + query, {
                qs: {
                    extended: true
                }
            }).then(r => JSON.parse(r.body))
        ]).spread((summary, seasons) => {
            summary.seasons = seasons;

            return summary;
        });
    }

}

export = TraktTv;
