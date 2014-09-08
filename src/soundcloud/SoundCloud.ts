/// <reference path="../../typings/tsd.d.ts" />

import request = require('request');
import Q = require('q');

import IHttp = require('../Http/IHttp');

class SoundCloud {

    constructor(private http: IHttp, private soundCloudClientId: string) {

    }

    getTracks(user: string): Q.Promise<any> {
        return this.http
            .get('http://api.soundcloud.com/users/' + user + '/tracks.json?client_id=1a54317f399a23ae3f4234dc0f6fd2c7')
            .then(r => JSON.parse(r.body));
    }
}

export = SoundCloud;
