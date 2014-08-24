var transforms = {},
	north_side_routes = [
		'CHE',
		'LAN',
		'FOX',
		'NOR',
		'WAR',
		'WTR'
	];

transforms.directions = function transform_direction(record) {
	if(north_side_routes.indexOf(record.route_id) > -1) {
		record.direction_name = record.direction_id === 0 ? 'Outbound' : 'Inbound';
	}
};

module.exports = transforms;
