var promise = require('promise'),
	routes = require('../models/routes'),
	directions = require('../models/directions'),
	display_trips = require('../models/display_trips'),
	ctrl = require('./controller').create('display_trips', true);

function get_route(req) {
	return new promise(function(resolve, reject) {
		var route_id = (req.params.route_id || '').toLowerCase();
		routes
			.where('agency_id = ? AND (lower(route_id) = ? OR lower(route_short_name) = ?)', [req.agency.id, req.params.route_id])
			.error(reject)
			.first(resolve);
	});
}

ctrl.action('trips', function(req, res, success) {
	var route = req.route, 
		direction = req.direction, 
		offset = 0,
		view = 'trips';

	if(req.query.offset) {
		offset = parseInt(req.query.offset, 10) || 0;
	}

	var offset_prev = offset - 5,
		offset_next = offset + 5;

	get_route(req).then(function(route) {
		if(route) {
			var direction_id = parseInt(req.params.direction_id, 10),
				stops = req.params.stops.split('...'),
				from_id = parseInt(stops[0], 10),
				to_id = parseInt(stops[1], 10);

			display_trips.get_by_time(req.agency.id, route.is_rail, route.route_id, direction_id, from_id, offset, to_id, function(trips, count) {
				success({
					data: trips,
					count: trips.length,
					total_count: count
				});
			});
		} else {
			res.error('Could not find route.', 404);
		}
	}, res.internal_error);
});

module.exports = ctrl;