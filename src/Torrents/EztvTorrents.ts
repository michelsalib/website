/// <reference path="../../typings/tsd.d.ts" />

import request = require('request');
import Q = require('q');
import cheerio = require('cheerio');

import IHttp = require('../Http/IHttp');
import HttpResponse = require('../Http/HttpResponse');
import IShow = require('../Model/IShow');
import ISeason = require('../Model/ISeason');
import IEpisode = require('../Model/IEpisode');

class EztvTorrents {

    constructor(private http: IHttp) {

    }

    getTorrents(show: string, season?: string): Q.Promise<IShow> {
        show = show.replace(/^(the) (.*)$/i, '$2, $1');

        return this.http.get('https://eztv.it/showlist/')
            .then(r => cheerio.load(r.body)('a.thread_link'))
            .then(links => links.filter((i) => links.eq(i).text().toUpperCase() == show.toUpperCase()))
            .then((links: Cheerio) => {
                if (links.length != 1) {
                    throw new Error('Cannot find show named ' + show);
                }

                return <IShow>{
                    id: /\/shows\/(\d+)\//.exec(links.attr('href'))[1],
                    title: links.text()
                };
            })
            .then(show => {
                return this.http.get('https://eztv.it/shows/' + show.id + '/')
                    .then(r => cheerio.load(r.body)('table.forum_header_noborder tr.forum_header_border'))
                    // extract episodes
                    .then(r => {
                        var episodes: IEpisode[] = [];

                        r.each((i) =>{
                            var torrentFields = r.eq(i).find('td');
                            var episodeFields = /(.+) s?(\d+)[ex](\d+)(e(\d+))? (\d+p )?(.*)/i.exec(torrentFields.eq(1).text());

                            episodes.push({
                                season: parseInt(episodeFields[2]),
                                number: parseInt(episodeFields[3]),
                                torrents: [{
                                    version: episodeFields[7],
                                    hd: !!episodeFields[6],
                                    link: torrentFields.eq(2).find('a.magnet').attr('href')
                                }]
                            });
                        });

                        episodes = episodes.reduce((result: IEpisode[], current: IEpisode) => {
                            var last = result[result.length-1];

                            if (!last || last.number != current.number) {
                                result.push(current);
                            }
                            else {
                                [].push.apply(last.torrents, current.torrents);
                            }

                            return result;
                        }, []);

                        return episodes;
                    })
                    // group seasons
                    .then(episodes => {
                        show.seasons = episodes.reduce((result: ISeason[], current: IEpisode) => {
                            var last = result[result.length-1];

                            if (!last || last.number != current.season) {
                                last = <ISeason>{
                                    number: current.season,
                                    episodes: []
                                };
                                result.push(last);
                            }

                            last.episodes.push(current);

                            return result;
                        }, []);
                    })
                    .then(() => show/*, err => show*/);
            });
    }
}

export = EztvTorrents;
