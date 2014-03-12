var transforms = {},
	route_overrides = [
		{ re:/^MAX ([a-z]+)/i },
		{ re:/^WES/i },
		{ re:/^Portland Aerial Tram/i, short_name:'tram' },
		{ re:/^Vintage Trolley/i, short_name:'vintage' }
	];

transforms.routes = function(record) {
	if(!record.route_short_name) {
		route_overrides.forEach(function(override) {
			var matches = override.re.exec(record.route_long_name);
			if(matches && matches.length) {
				record.route_short_name = override.short_name || matches[0].toLowerCase().replace(' ', '');
			}
		});
	}
};

module.exports = transforms;
