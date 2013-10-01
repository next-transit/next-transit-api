var ctrl = require('./controller').create('directions', true),
	directions = require('../models/directions');

ctrl.action('index', function(req, res, callback) {
	var route_id = (req.query.route_id || req.params.route_id || '').toLowerCase();

	directions
		.where('agency_id = ?', [req.agency.id])
		.where_if('(lower(route_id) = ? OR lower(route_short_name) = ?)', [route_id, route_id], route_id)
		.orders('direction_name')
		.limit(ctrl.limit)
		.count(true)
		.error(res.internal_error)
		.done(function(results, count) {
			callback({
				data: directions.public(results),
				count: results.length,
				total_count: count
			});
		});
});

ctrl.action('item', function(req, res, callback) {
	var route_id = (req.query.route_id || req.params.route_id || '').toLowerCase(),
		direction_id = parseInt(req.params.direction_id, 10);

	directions
		.where('agency_id = ? AND direction_id = ?', [req.agency.id, direction_id])
		.where_if('(lower(route_id) = ? OR lower(route_short_name) = ?)', [route_id, route_id], route_id)
		.error(res.internal_error)
		.first(function(direction) {
			if(direction) {
				callback({ data:directions.public(direction) });
			} else {
				res.error('Could not find route direction.', 404);
			}
		});
});

module.exports = ctrl;