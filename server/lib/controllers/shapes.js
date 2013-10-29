var promise = require('promise'),
	ctrl = require('./controller').create('shapes', true),
	routes = require('../models/routes'),
	simplified_shapes = require('../models/simplified_shapes');

function get_simplified_shape_by_route_id(agency_id, route_id) {
	return new promise(function(resolve, reject) {
		routes.query(agency_id)
			.where('agency_id = ? AND (lower(route_id) = ? OR lower(route_short_name) = ?)', [agency_id, route_id.toLowerCase(), route_id.toLowerCase()])
			.first(function(route) {
				simplified_shapes.where('agency_id = ? AND route_id = ?', [agency_id, route.route_id])
					.orders('segment_id, id')
					.done(function(points) {
						var segments = {};

						points.forEach(function(point) {
							var segment_id = point.segment_id.toString();
							if(!(segment_id in segments)) {
								segments[segment_id] = [];
							}
							segments[segment_id].push([parseFloat(point.shape_pt_lat), parseFloat(point.shape_pt_lon)]);
						});

						var shapes = [];
						for(segment_id in segments) {
							if(segments.hasOwnProperty(segment_id)) {
								shapes.push(segments[segment_id]);
							}
						}

						route.shapes = shapes;
						resolve({ shapes:shapes, route:routes.public(route) });
					});
			});
	});
}

function get_shapes_for_routes(agency_id, route_results, callback) {
	if(!route_results || !route_results.length) {
		callback([]);
		return;
	}

	var routes = [], 
		promises = [];

	route_results.forEach(function(result) {
		if(result.route_id) {
			promises.push(get_simplified_shape_by_route_id(agency_id, result.route_id));
		}
	});

	promise.all(promises).done(function(results) {
		var routes = results.map(function(result) {
			result.route.shapes = result.shapes;
			return result.route;
		});
		callback(routes);
	});
}

ctrl.action('index', { json:true }, function(req, res, callback) {
	if(req.params.route_id) {
		var route_id = req.params.route_id.toLowerCase();

		get_simplified_shape_by_route_id(req.agency.id, route_id).done(function(results) {
			callback({
				data: results.shapes,
				count: results.shapes.length,
				total_count: results.shapes.length
			});
		});
	} else {
		res.error('Could not find round.', 404);
	}
});

ctrl.action('bbox', { json:true }, function(req, res, callback) {
	if(req.query.bbox) {
		var bbox = req.query.bbox.split(','),
			left = parseFloat(bbox[0]),
			bottom = parseFloat(bbox[1]),
			right = parseFloat(bbox[2]),
			top = parseFloat(bbox[3]);

		simplified_shapes.query()
			.select('distinct route_id')
			.where('agency_id = ? AND shape_pt_lon > ? AND shape_pt_lon < ? AND shape_pt_lat > ? AND shape_pt_lat < ?', [req.agency.id, left, right, bottom, top])
			.limit(ctrl.limit)
			.count(true)
			.done(function(results, count) {
				get_shapes_for_routes(req.agency.id, results, function(routes) {
					callback({
						data: routes,
						count: routes.count,
						total_count: count
					});
				});
			});
	} else {
		res.error('Bounding box is required.', 400);
	}
});

module.exports = ctrl;