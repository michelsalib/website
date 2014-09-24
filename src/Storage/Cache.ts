/// <reference path="../../typings/tsd.d.ts" />

var sqlite3 = require('sqlite3').verbose();
import Q = require('q');

class Cache {

    private ttl = 1000 * 60 * 60; // 1h

    constructor() {
        var db = new sqlite3.Database('db.sqlite3');

        db.serialize(() => {
            db.run('CREATE TABLE IF NOT EXISTS cache (key TEXT PRIMARY KEY, datetime INTEGER, value TEXT)');

            db.run('DELETE FROM cache WHERE datetime < ?', (new Date().getTime() - this.ttl));
        });

        db.close();
    }

    set(key: string, value: string): void {
        var db = new sqlite3.Database('db.sqlite3');

        db.run('INSERT OR REPLACE INTO cache VALUES (?, ?, ?)', key, new Date().getTime(), value);

        db.close();
    }

    get(key: string): Q.Promise<string> {
        var db = new sqlite3.Database('db.sqlite3');

        var get = Q.nbind(db.get, db);

        return <any>get('SELECT * FROM cache WHERE key = ? AND datetime > ?', key, (new Date().getTime() - this.ttl))
            .finally(() => db.close())
            .then((r: any) => r ? r.value : null);
    }

}

export = Cache;
