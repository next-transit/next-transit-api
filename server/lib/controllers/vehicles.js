var ctrl = require('./controller').create('vehicles');
var realtime_ctrls = require('../realtime');

ctrl.action('index', { json:true }, function(req, res, callback) {
  try {
    var agency_realtime = realtime_ctrls[req.agency.slug];

    var { route_type, route_id } = req.route.params;

    if (!route_type || !route_id) {
      return res.error('Vehicles request requires a route ID');
    }

    agency_realtime.get_vehicles(route_type, route_id).then(function(vehicles) {
      callback({ vehicles:vehicles });
    }, function(err) {
      res.error(err);
    });
  } catch(e) {
    res.internal_error('Couldn\'t load agency realtime library.');
  }
});

module.exports = ctrl;
