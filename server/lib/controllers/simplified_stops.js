var ctrl = require('./controller').create('stops', true),
	routes = require('../models/routes'),
	simplified_stops = require('../models/simplified_stops');

ctrl.action('index', function(req, res, success) {
	var route_id = (req.query.route_id || req.params.route_id || '').toLowerCase(),
		direction_id = (req.query.direction_id || req.params.direction_id || ''),
		min_sequence = (req.query.min_sequence || '');

	routes
		.where('agency_id = ? AND (lower(route_id) = ? OR lower(route_short_name) = ?)', [req.agency.id, route_id, route_id])
		.error(req.internal_error)
		.first(function(route) {
			if(route) {
				simplified_stops
					.where('agency_id = ?', [req.agency.id])
					.where_if('route_id = ?', [route.route_id], route)
					.where_if('direction_id = ?', [parseInt(direction_id, 10)], direction_id)
					.where_if('stop_sequence > ?', [parseInt(min_sequence, 10)], min_sequence)
					.orders('stop_sequence')
					.limit(ctrl.limit)
					.count(true)
					.error(req.internal_error)
					.done(function(results, count) {
						success({
							data: simplified_stops.public(results),
							count: results.count,
							total_count: count
						});
					});
			} else {
				res.error('Could not find route.');
			}
		});
});

ctrl.action('item', function(req, res, success) {
	var id = (req.params.id || ''),
		route_id = (req.params.route_id || '').toLowerCase(),
		direction_id = (req.params.direction_id || ''),
		stop_id = (req.params.stop_id || '');

	routes
		.where('agency_id = ? AND (lower(route_id) = ? OR lower(route_short_name) = ?)', [req.agency.id, route_id, route_id])
		.error(req.internal_error)
		.first(function(route) {
			var query = simplified_stops.query().error(req.internal_error);

			if(id) {
				query.where('agency_id = ? AND id = ?', [req.agency.id, parseInt(id, 10)]);
			} else {
				direction_id = parseInt(direction_id, 10);
				stop_id = parseInt(stop_id, 10);
				query.where('agency_id = ? AND route_id = ? AND direction_id = ? AND stop_id = ?', [req.agency.id, route.route_id, direction_id, stop_id]);
			}

			query.first(function(results) {
				success({
					data: simplified_stops.public(results)
				});
			});
		});
});

module.exports = ctrl;