var ctrl = require('./controller').create('route_types', true),
	route_types = require('../models/route_types');

ctrl.action('index', function(req, res, callback) {
	route_types.query(req.agency.id)
		.error(res.internal_error)
		.where('agency_id = ?', [req.agency.id])
		.orders('route_type_order, label')
		.limit(ctrl.limit)
		.count(true)
		.done(function(results, count) {
			callback({
				data: route_types.public(results),
				count: results.length,
				total_count: count
			});
		});
});

ctrl.action('item', function(req, res, callback) {
	var route_type_id = req.params.route_type_id.toLowerCase(),
		route_type_id_int = parseInt(route_type_id, 10) || -1;

	route_types.query(req.agency.id)
		.where('agency_id = ? AND route_type_id IS NOT NULL AND (lower(slug) = ? OR route_type_id = ?)', [req.agency.id, route_type_id, route_type_id_int])
		.error(res.internal_error)
		.first(function(route_type) {
			if(route_type) {
				callback({ data:route_types.public(route_type) });	
			} else {
				res.error('Route Type could not be found.', 404);
			}
		});
});

module.exports = ctrl;