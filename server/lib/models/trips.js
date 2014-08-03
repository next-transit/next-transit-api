var trips = require('./model').create('trips');

trips.get_longest_trip = function(agency_id, route_id, direction_id, success, error) {
	trips.query()
		.select('t.id, t.route_id, t.trip_id, t.shape_id, count(st.*) stop_count')
		.join('JOIN stop_times st ON t.trip_id = st.trip_id AND st.agency_id = ?')
		.where('t.agency_id = ? AND t.direction_id = ? AND t.route_id = ?', [agency_id, agency_id, direction_id, route_id])
		.group_by('t.id, t.route_id, t.trip_id, t.shape_id')
		.orders('stop_count DESC')
		.error(error)
		.first(success);
};

module.exports = trips;