/// <reference path="../../typings/tsd.d.ts" />

import Q = require('q');
import cheerio = require('cheerio');

import IHttp = require('../Http/IHttp');
import HttpResponse = require('../Http/HttpResponse');
import IShow = require('../Model/IShow');
import IEpisode = require('../Model/IEpisode');

class Addic7edSubtitles {

    constructor(private http: IHttp) {

    }

    getSubtitles(show: string, season?: string): Q.Promise<IShow> {
        return this.http.get('http://www.addic7ed.com/search.php?search=' + show)
            .then(r => cheerio.load(r.body)('.titulo a'))
            .then(link => {
                if (1 != link.length) {
                    throw new Error('Cannot find show named ' + show);
                }

                return <IShow>{
                    id: link.attr('href').split('/').pop(),
                    title: link.find('i').text()
                };
            })
            .then(show => {
                return this.http.get('http://www.addic7ed.com/show/' + show.id + '?langs=|1|' + (season ? ('&season=' + season) : ''))
                    .then(r => cheerio.load(r.body))
                    // extract seasons
                    .then(r => {
                        show.numberOfSeasons = r('#sl button').length;

                        return r;
                    })
                    // extract current season
                    .then(r => {
                        var episodes: IEpisode[] = [];

                        r('.epeven').each((i) =>{
                            var episodeFields = r('.epeven').eq(i).find('td');

                            episodes.push({
                                season: parseInt(episodeFields.eq(0).text()),
                                number: parseInt(episodeFields.eq(1).text()),
                                title: episodeFields.eq(2).text(),
                                subtitles: [{
                                    version: episodeFields.eq(4).text(),
                                    hearingImpared: !!episodeFields.eq(6).text(),
                                    verified: !!episodeFields.eq(7).text(),
                                    hd: !!episodeFields.eq(8).text(),
                                    link: '/link?referer=http://www.addic7ed.com&href=http://www.addic7ed.com' + episodeFields.eq(9).find('a').attr('href')
                                }]
                            });

                        });

                        episodes = episodes.reduce((result: IEpisode[], current: IEpisode) => {
                            var last = result[result.length-1];

                            if (!last || last.number != current.number) {
                                result.push(current);
                            }
                            else {
                                [].push.apply(last.subtitles, current.subtitles);
                            }

                            return result;
                        }, []);

                        show.seasons = [{
                            number: parseInt(season) || show.numberOfSeasons,
                            episodes: episodes
                        }];
                    })
                    .then(() => show, err => show);
            });
    }
}

export = Addic7edSubtitles;
