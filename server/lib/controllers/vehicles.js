var ctrl = require('./controller').create('vehicles');
var realtime_ctrls = require('../realtime');

ctrl.action('index', { json:true }, function(req, res, callback) {
  try {
    // var agency_realtime = realtime_ctrls[req.agency.slug];

    // const agencyId = req.agency.id;
    // var { route_type, route_id } = req.params;

    // if (!route_type || !route_id) {
    //   return res.error('Vehicles request requires a route ID');
    // }

    // agency_realtime.get_vehicles(agencyId, route_type, route_id).then((vehicles) => {
    //   callback({ vehicles:vehicles });
    // }, res.error);

    callback({ vehicles:[] });
  } catch(e) {
    res.internal_error('Couldn\'t load agency realtime library.');
    console.error(e);
  }
});

module.exports = ctrl;
