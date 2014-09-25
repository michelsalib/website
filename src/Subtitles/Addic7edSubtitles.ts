/// <reference path="../../typings/tsd.d.ts" />

import Q = require('q');
import cheerio = require('cheerio');

import IHttp = require('../Http/IHttp');
import HttpResponse = require('../Http/HttpResponse');
import ISubtitle = require('./ISubtitle');

class Addic7edSubtitles {

    constructor(private http:IHttp) {

    }

    getSubtitles(show:string):Q.Promise<ISubtitle[]> {
        return this.http.get('http://www.addic7ed.com/shows.php')
            .then(r => cheerio.load(r.body)('.tabel90 tr'))
            .then(rows => {
                var showId = null;
                var seasons = null;

                rows.each((rowIndex) => {
                    var columns = rows.eq(rowIndex).find('td.version a');

                    columns.each((columnIndex) => {
                        if (columns.eq(columnIndex).text().toUpperCase() == show.toUpperCase()) {
                            showId = parseInt(columns.eq(columnIndex).attr('href').split('/').pop());
                            seasons = parseInt(rows.eq(rowIndex + 1).find('td.newsDate').eq(columnIndex).text());

                            return false;
                        }
                    });

                    if (showId) {
                        return false;
                    }
                });

                if (!showId) {
                    throw new Error('Cannot find show named ' + show);
                }

                return Q.all(
                    Array.apply(null, Array(seasons)).map((_, i) => i + 1).map(season =>
                        this.http.get('http://www.addic7ed.com/ajax_loadShow.php', {
                            qs: {
                                show: showId,
                                langs: '|1|1en',
                                season: season
                            }
                        })
                            .then(r => cheerio.load(r.body)('.epeven'))
                            .then(r => {
                                var episodes:ISubtitle[] = [];

                                r.each((i) => {
                                    var episodeFields = r.eq(i).find('td');

                                    episodes.push({
                                        season: parseInt(episodeFields.eq(0).text()),
                                        episode: parseInt(episodeFields.eq(1).text()),
                                        version: episodeFields.eq(4).text(),
                                        hearingImpared: !!episodeFields.eq(6).text(),
                                        verified: !!episodeFields.eq(7).text(),
                                        hd: !!episodeFields.eq(8).text(),
                                        link: '/link?referer=http://www.addic7ed.com&href=http://www.addic7ed.com' + episodeFields.eq(9).find('a').attr('href')
                                    });
                                });

                                return episodes;
                            })
                    )
                ).then(r => [].concat.apply([], r));
            });
    }
}

export = Addic7edSubtitles;
