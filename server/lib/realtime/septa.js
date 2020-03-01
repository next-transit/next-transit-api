const models = require('../models');
const request = require('./request');

const REALTIME_RAIL_URL = 'http://www3.septa.org/hackathon/TrainView/'; // This trailing slash is require. Don't ask why
const REALTIME_BUS_URL = 'http://www3.septa.org/transitview/bus_route_data';

const septa = {};

function getTripsByBlockIds(agencyId, blockIds) {
  return new Promise((resolve, reject) => {
    const valuePlaceholders = blockIds.map(b => '?');
    models.trips
      .select(agencyId)
      .where(`block_id IN (${valuePlaceholders})`, blockIds)
      .error(reject)
      .all(resolve);
  });
}

function translateBus(bus) {
  return {
    mode: 'bus',
    lat: bus.lat,
    lng: bus.lng,
    vehicle_id: bus.VehicleID,
    offset: bus.Offset,
    block_id: bus.BlockID,
    destination: bus.destination,
    direction: bus.Direction,
    late: null
  };
}

function translateBuses(data) {
  return new Promise((resolve, reject) => {
    resolve(data.bus.map(translateBus));
  });
}

function translateTrains(data, agencyId) {
  return new Promise((resolve, reject) => {
    const blockIds = data.map(train => train.trainno).filter(v => !!v);

    getTripsByBlockIds(agencyId, blockIds).then((trips) => {
      const vehicles = data.map((train) => {
        const trip = trips.find((trip) => {
          return trip.block_id === train.trainno;
        });

        return {
          mode: 'rail',
          lat: train.lat,
          lng: train.lon,
          vehicle_id: train.trainno,
          offset: 0,
          block_id: train.trainno,
          destination: train.dest,
          late: train.late,
          route_id: (trip ? trip.route_id : '')
        };
      });

      resolve(vehicles);
    }, reject);
  });
}

function getRoute(agencyId, routeId, callback, error) {
  models.routes
    .select(agencyId)
    .where('(lower(route_id) = ? OR lower(route_short_name) = ?)', [routeId, routeId])
    .error(error)
    .first((route) => {
      if(route) {
        return callback(route);
      }

      error('Route could not be found.', 404);
    });
}

septa.get_vehicles = (agencyId, routeTypeId, routeId) => {
  return new Promise((resolve, reject) => {
    getRoute(agencyId, routeId, (route) => {
      if (!route.has_realtime) {
        return reject('Route does not support a realtime API.', 400);
      }

      let requestURL = REALTIME_RAIL_URL;
      let translateFn = translateTrains;

      if (!route.is_rail) {
        requestURL = `${REALTIME_BUS_URL}/${routeId}`;
        translateFn = translateBuses;
      }

      request(requestURL).then((data) => {
        translateFn(data, agencyId).then(resolve, reject);
      }, reject);
    }, reject);
  });
};

module.exports = septa;
