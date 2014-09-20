import ISubtitle = require('../Subtitles/ISubtitle');
import ITorrent = require('../Torrents/ITorrent');

interface IEpisode {
	season: number;
	number: number;
	title?: string;
	subtitles?: ISubtitle[];
	torrents?: ITorrent[];
}

export = IEpisode;