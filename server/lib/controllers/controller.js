var extend = require('extend');

function Controller(name, require_api_key) {
	var _actions = {}, _self = this;

	_self.name = name;
	_self.require_api_key = !!require_api_key;
	_self.limit = 200;

	_self.action = function(name, options, callback) {
		if(typeof options === 'function') {
			callback = options;
			options = {};
		}
		
		_actions[name] = function(req, res) {
			callback(req, res, function(view, data) {
				if(typeof view === 'object') {
					data = view;
					view = null;
				}

				if(view && typeof view === 'string') {
					var view_data = extend({ page_name:_self.name }, req.locals, data || {});
					res.render(view, view_data, function(err, html) {
						res.send(html);
					});
				} else {
					data.success = true;
					data.status_code = 200;

					res.type('application/json');

					res.send(data);
				}

			});
		};

		return _self;
	};

	_self.get_action = function(name) {
		return _actions[name] || _actions.index;
	};

	_self.action('index', function(req, res, callback) {
		callback(name.replace(/\-/g, '_'), {});
	});
}

Controller.prototype.toString = function() {
	return 'Controller: ' + this.name || 'unknown';
};

module.exports = {
	create: function(name, require_api_key) {
		return new Controller(name, require_api_key);
	}
};