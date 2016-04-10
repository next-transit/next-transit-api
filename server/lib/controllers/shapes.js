var promise = require('promise'),
	ctrl = require('./controller').create('shapes', true),
	models = require('../models')
	routes = models.routes,
	simplified_shapes = require('../models/simplified_shapes'),
	simplified_stops = require('../models/simplified_stops');

function get_route_by_multi_id(agency_id, route_id) {
	return new promise(function(resolve, reject) {
		routes.select(agency_id)
			.where('(lower(route_id) = ? OR lower(route_short_name) = ?)', [route_id.toLowerCase(), route_id.toLowerCase()])
			.error(reject)
			.first(function(route) {
				resolve(route);
			});
	});
}

function get_simplified_stops_by_route(agency_id, route, bbox, include_stops) {
	return new promise(function(resolve, reject) {
		if(!include_stops) {
			resolve([]);
		} else {
			var bbox_array = [];
			if(bbox) {
				bbox_array = [bbox.west, bbox.south, bbox.east, bbox.north];
			}

			simplified_stops.query()
				.where('agency_id = ? AND route_id = ?', [agency_id, route.route_id])
				.where_if('stop_lon > ? AND stop_lat > ? AND stop_lon < ? AND stop_lat < ?', bbox_array, bbox)
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

function get_simplified_shape_by_route(agency_id, route, bbox) {
	return new promise(function(resolve, reject) {
		var bbox_array = [];
		if(bbox) {
			bbox_array = [bbox.west, bbox.south, bbox.east, bbox.north];
		}

		simplified_shapes.query()
			.where('agency_id = ? AND route_id = ?', [agency_id, route.route_id])
			.where_if('shape_pt_lon > ? AND shape_pt_lat > ? AND shape_pt_lon < ? AND shape_pt_lat < ?', bbox_array, bbox)
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

function get_paths_and_stops_for_route(agency_id, route_id, bbox, include_stops) {
	return new promise(function(resolve, reject) {
		get_route_by_multi_id(agency_id, route_id).then(function(route) {
			if(route) {
				promise.all([
					get_simplified_shape_by_route(agency_id, route, bbox),
					get_simplified_stops_by_route(agency_id, route, bbox, include_stops)
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

function get_shapes_for_routes(agency_id, route_results, bbox, include_stops) {
	return new promise(function(resolve, reject) {
		if(!route_results || !route_results.length) {
			resolve([]);
			return;
		}

		var promises = [];

		route_results.forEach(function(result) {
			if(result.route_id) {
				promises.push(get_paths_and_stops_for_route(agency_id, result.route_id, bbox, include_stops));
			}
		});

		promise.all(promises).done(resolve);
	});
}

function get_buffered_bbox(bbox, percent) {
	var decimal_percent = percent * 0.01,
		x_size = bbox.east - bbox.west, // east - west
		y_size = bbox.north - bbox.south, // north - south
		x_buffer = x_size * decimal_percent,
		y_buffer = y_size * decimal_percent;

	return {
		west: bbox.west - x_buffer,
		south: bbox.south - y_buffer,
		east: bbox.east + x_buffer,
		north: bbox.north + y_buffer
	};
}

function string_to_bbox(bbox_str) {
	var bbox_split = bbox_str.split(','),
		left = parseFloat(bbox_split[0]),
		bottom = parseFloat(bbox_split[1]),
		right = parseFloat(bbox_split[2]),
		top = parseFloat(bbox_split[3]);

	return { west:left, south:bottom, east:right, north:top };
}

ctrl.action('index', { json:true }, function(req, res, callback) {
	if(req.params.route_id) {
		var route_id = req.params.route_id.toLowerCase();

		get_route_by_multi_id(req.agency.id, route_id).then(function(route) {
			if(route) {
				promise.all([
					get_simplified_shape_by_route(req.agency.id, route, null),
					get_simplified_stops_by_route(req.agency.id, route, null, true)
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
		var bbox = string_to_bbox(req.query.bbox),
			bbox_array = [bbox.west, bbox.south, bbox.east, bbox.north],
			buffered_bbox = get_buffered_bbox(bbox, 20),
			include_stops = req.query.stops !== 'false';

		simplified_shapes.query()
			.select('distinct route_id')
			.where('agency_id = ?', [req.agency.id])
			.where_if('shape_pt_lon > ? AND shape_pt_lat > ? AND shape_pt_lon < ? AND shape_pt_lat < ?', bbox_array, true)
			.limit(ctrl.limit)
			.count(true)
			.done(function(results, count) {
				get_shapes_for_routes(req.agency.id, results, buffered_bbox, include_stops).then(function(route_results) {
					callback({
						bbox: buffered_bbox,
						data: route_results,
						count: route_results.count,
						total_count: count
					});
				}, res.internal_error);
			});
	} else {
		res.error('Bounding box is required.', 400);
	}
});

module.exports = ctrl;