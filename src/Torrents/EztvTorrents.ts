/// <reference path="../../typings/tsd.d.ts" />

import request = require('request');
import Q = require('q');
import cheerio = require('cheerio');

import IHttp = require('../Http/IHttp');
import HttpResponse = require('../Http/HttpResponse');
import ITorrent = require('./ITorrent');

class EztvTorrents {

    constructor(private http: IHttp) {

    }

    getTorrents(show: string): Q.Promise<ITorrent[]> {
        show = show.replace(/^(the) (.*)$/i, '$2, $1');

        return this.http.get('https://eztv.it/showlist/')
            .then(r => cheerio.load(r.body)('a.thread_link'))
            .then(links => links.filter((i) => links.eq(i).text().toUpperCase() == show.toUpperCase()))
            .then((links: Cheerio) => {
                if (links.length != 1) {
                    throw new Error('Cannot find show named ' + show);
                }

                return /\/shows\/(\d+)\//.exec(links.attr('href'))[1];
            })
            .then(showId => this.http.get('https://eztv.it/shows/' + showId + '/'))
            // extract torrent raws
            .then(r => cheerio.load(r.body)('table.forum_header_noborder tr.forum_header_border'))
            // extract episodes
            .then(r => {
                var torrents: ITorrent[] = [];

                r.each((i) =>{
                    try {
                        var torrentFields = r.eq(i).find('td');
                        var episodeFields = /(.+) s?(\d+)[ex](\d+)(e(\d+))? (\d+p )?(.*)/i.exec(torrentFields.eq(1).text());

                        torrents.push({
                            season: parseInt(episodeFields[2]),
                            episode: parseInt(episodeFields[3]),
                            version: episodeFields[7],
                            hd: !!episodeFields[6],
                            link: torrentFields.eq(2).find('a.magnet').attr('href')
                        });
                    } catch(err) {
                        // ignore torrent field
                    }
                });

                return torrents;
            });
    }
}

export = EztvTorrents;
