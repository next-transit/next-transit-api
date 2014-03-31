var promise = require('promise'),
	ctrl = require('./controller').create('shapes', true),
	routes = require('../models/routes'),
	simplified_shapes = require('../models/simplified_shapes'),
	simplified_stops = require('../models/simplified_stops');

function get_route_by_multi_id(agency_id, route_id) {
	return new promise(function(resolve, reject) {
		routes.query(agency_id)
			.where('agency_id = ? AND (lower(route_id) = ? OR lower(route_short_name) = ?)', [agency_id, route_id.toLowerCase(), route_id.toLowerCase()])
			.error(reject)
			.first(function(route) {
				resolve(routes.public(route));
			});
	});
}

function get_simplified_stops_by_route(agency_id, route, include_stops) {
	return new promise(function(resolve, reject) {
		if(!include_stops) {
			resolve([]);
		} else {
			simplified_stops.where('agency_id = ? AND route_id = ?', [agency_id, route.route_id])
				.orders('direction_id, stop_sequence')
				.error(reject)
				.done(function(stops) {
					stops.forEach(function(stop) {
						stop.stop_lat = parseFloat(stop.stop_lat);
						stop.stop_lon = parseFloat(stop.stop_lon);
					});
					resolve(stops);
				});
		}
	});
}

function get_simplified_shape_by_route(agency_id, route) {
	return new promise(function(resolve, reject) {
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
				resolve(shapes);
			});
	});
}

function get_paths_and_stops_for_route(agency_id, route_id, include_stops) {
	return new promise(function(resolve, reject) {
		get_route_by_multi_id(agency_id, route_id).then(function(route) {
			if(route) {
				promise.all([
					get_simplified_shape_by_route(agency_id, route),
					get_simplified_stops_by_route(agency_id, route, include_stops)
				]).done(function(results) {
					route.paths = results[0];
					route.stops = results[1];
					resolve(route);
				});
			} else {
				resolve({});
			}
		});
	});
}

function get_shapes_for_routes(agency_id, route_results, include_stops) {
	return new promise(function(resolve, reject) {
		if(!route_results || !route_results.length) {
			resolve([]);
			return;
		}

		var routes = [], 
			promises = [];

		route_results.forEach(function(result) {
			if(result.route_id) {
				promises.push(get_paths_and_stops_for_route(agency_id, result.route_id, include_stops));
			}
		});

		promise.all(promises).done(resolve);
	});
}

ctrl.action('index', { json:true }, function(req, res, callback) {
	if(req.params.route_id) {
		var route_id = req.params.route_id.toLowerCase();

		get_route_by_multi_id(req.agency.id, route_id).then(function(route) {
			if(route) {
				promise.all([
					get_simplified_shape_by_route(req.agency.id, route),
					get_simplified_stops_by_route(req.agency.id, route, true)
				]).done(function(results) {
					route.paths = results[0];
					route.stops = results[1];
					callback({ data:route });
				});
			} else {
				res.error('Could not find route.', 404);
			}
		}, res.internal_error);
	} else {
		res.error('Could not find route.', 404);
	}
});

ctrl.action('bbox', { json:true }, function(req, res, callback) {
	if(req.query.bbox) {
		var bbox = req.query.bbox.split(','),
			left = parseFloat(bbox[0]),
			bottom = parseFloat(bbox[1]),
			right = parseFloat(bbox[2]),
			top = parseFloat(bbox[3]),
			include_stops = req.query.stops !== 'false';

		simplified_shapes.query()
			.select('distinct route_id')
			.where('agency_id = ? AND shape_pt_lon > ? AND shape_pt_lon < ? AND shape_pt_lat > ? AND shape_pt_lat < ?', [req.agency.id, left, right, bottom, top])
			.limit(ctrl.limit)
			.count(true)
			.done(function(results, count) {
				get_shapes_for_routes(req.agency.id, results, include_stops).then(function(routes) {
					callback({
						data: routes,
						count: routes.count,
						total_count: count
					});
				}, res.internal_error);
			});
	} else {
		res.error('Bounding box is required.', 400);
	}
});

module.exports = ctrl;