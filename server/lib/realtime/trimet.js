const http = require('http');
const querystring = require('querystring');

const config = require('../util/config');
const route_types = require('../util/route_types');

const request = require('./request');

const trimet = {};
const REALTIME_URL = 'http://developer.trimet.org/beta/v2/vehicles';

function get_request_url(routeId) {
  const params = {
    appID: '606DD5685EEC20DACC9E720B4',
    routes: routeId
  };

  return REALTIME_URL + '?' + querystring.stringify(params);
}

function normalize(routeTypeId, data) {
  const vehicles = [];

  if(data && data.resultSet && data.resultSet.vehicle) {
    data.resultSet.vehicle.forEach((datum) => {
      vehicles.push({
        mode: route_types.getMode(routeTypeId),
        lat: datum.latitude,
        lng: datum.longitude,
        vehicle_id: datum.vehicleID.toString(),
        block_id: datum.blockID,
        destination: datum.signMessageLong,
        direction: datum.direction,
        offset: null,
        late: 0 - Math.floor(datum.delay / 60)
      });
    });
  }

  return vehicles;
}

trimet.get_vehicles = function(agencyId, routeTypeId, routeId) {
  return new Promise((resolve, reject) => {
    request(get_request_url(routeId)).then((data) => {
      resolve(normalize(routeTypeId, data));
    }, reject)
  });
};

module.exports = trimet;
