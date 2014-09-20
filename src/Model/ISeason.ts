import IEpisode = require('./IEpisode');

interface ISeason {
	number: number;
	episodes?: IEpisode[];
}

export = ISeason;