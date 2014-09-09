/// <reference path="../../typings/tsd.d.ts" />

import request = require('request');
import Q = require('q');

import IHttp = require('../Http/IHttp');
import HttpResponse = require('../Http/HttpResponse');

class SoundCloud {

    constructor(private http: IHttp, private soundCloudClientId: string) {

    }

    getTracks(user: string): Q.Promise<any> {
        return Q.all([
                this.http.get('http://api.soundcloud.com/users/' + user + '.json?client_id=' + this.soundCloudClientId),
                this.http.get('http://api.soundcloud.com/users/' + user + '/tracks.json?client_id=' + this.soundCloudClientId)
            ])
            .spread((userResponse: HttpResponse, tracksResponse: HttpResponse) => {
                var user = JSON.parse(userResponse.body);
                var tracks = JSON.parse(tracksResponse.body);

                var result = '<?xml version="1.0" encoding="UTF-8"?>\
                    <rss xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd" version="2.0">\
                        <channel>\
                        <title>' + user.username + '</title>\
                        <description>' + user.description + '</description>\
                        <link>' + user.website + '</link>\
                        <language>en-us</language>\
                        <lastBuildDate>' + tracks[0].created_at + '</lastBuildDate>\
                        <pubDate>' + tracks[0].created_at + '</pubDate>\
                        <itunes:image href="' + user.avatar_url + '"/>';

                tracks.forEach(t => {
                    result += '<item>\
                        <title>' + t.title + '</title>\
                        <link>' + t.permalink_url + '</link>\
                        <guid>' + t.id + '</guid>\
                        <description>' + t.description + '</description>\
                        <enclosure url="' + t.download_url + '?client_id=' + this.soundCloudClientId + '" length="' + t.original_content_size + '" type="audio/mpeg"/>\
                        <category>Podcasts</category>\
                        <pubDate>' + t.created_at + '</pubDate>\
                        <itunes:image href="' + t.artwork_url + '"/>\
                    </item>';
                });

                result += '</channel></rss>';

                return result;
            });
    }
}

export = SoundCloud;
