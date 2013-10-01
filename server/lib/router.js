var routes = require('../routes.json'),
	app_ctrl = require('./controllers/app');

function register_route(app, method, path, ctrl, action) {
	app[method](path, app_ctrl.before, function(req, res, next) {
		if(ctrl.require_api_key && !req.api_key) {
			res.error('API key required.', 401);
		} else {
			next();	
		}
	}, action);
}

function add_routes(app) {
	for(var key in routes) {
		var path = key,
			options = routes[key],
			ctrl_name = options.action,
			ctrl_parts = ctrl_name.split(':'),
			ctrl = require('./controllers/' + ctrl_parts[0]),
			method = 'get',
			action = ctrl.get_action(ctrl_parts[1] || 'index'),
			method_matches = key.match(/^(get|post|put|delete) /i);

		if(method_matches) {
			path = key.replace(method_matches[0], '');
			method = method_matches[1];
		}

		register_route(app, method, path, ctrl, action);
	}
}

module.exports = {
	routes: add_routes
};