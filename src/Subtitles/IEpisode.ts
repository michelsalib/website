import ISubtitle = require('./ISubtitle');

interface IEpisode {
	season: number;
	number: number;
	title: string;
	subtitles?: ISubtitle[];
}

export = IEpisode;