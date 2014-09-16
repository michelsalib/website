import ISeason = require('./ISeason');

interface IShow {
	id: string;
	title: string;
	numberOfSeasons?: number;
	seasons?: ISeason[];
}

export = IShow;