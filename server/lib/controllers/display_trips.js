var promise = require('promise'),
	routes = require('../models/routes'),
	directions = require('../models/directions'),
	display_trips = require('../models/display_trips'),
	ctrl = require('./controller').create('display_trips', true);

function get_route(req) {
	return new promise(function(resolve, reject) {
		var route_id = (req.params.route_id || '').toLowerCase();
		routes
			.where('agency_id = ? AND (lower(route_id) = ? OR lower(route_short_name) = ?)', [req.agency.id, route_id, route_id])
			.error(reject)
			.first(resolve);
	});
}

ctrl.action('index', function(req, res, success) {
	var route = req.route,
		direction = req.direction,
		from_stop = req.from_stop;

	get_route(req).then(function(route) {
		var direction_id = parseInt(req.params.direction_id, 10),
			from_id = parseInt(req.params.stop_id, 10),
			day_of_week = parseInt(req.query.day, 10);

		if(day_of_week.toString() === 'NaN') {
			day_of_week = req.query.day;
		}

		display_trips.get_by_day(req.agency, route.is_rail, route.route_id, direction_id, from_id, day_of_week).then(function(trips, count) {
			success({
				data: trips,
				count: trips.length,
				total_count: count
			});
		}, res.internal_error);
	}, res.internal_error);
});

ctrl.action('trips', function(req, res, success) {
	var offset = 0,
		view = 'trips';

	if(req.query.offset) {
		offset = parseInt(req.query.offset, 10) || 0;
	}

	var offset_prev = offset - 5,
		offset_next = offset + 5;

	get_route(req).then(function(route) {
		if(route) {
			var direction_id = parseInt(req.params.direction_id, 10),
				stops = req.params.stop_id.split('...'),
				from_id = parseInt(stops[0], 10),
				to_id = parseInt(stops[1], 10);

			display_trips.get_by_time(req.agency, route.is_rail, route.route_id, direction_id, from_id, offset, to_id, function(trips, count) {
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