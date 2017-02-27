var ctrl = require('./controller').create('version');

ctrl.action('index', function(req, res, callback) {
  callback({
    data: {
      version: '1.0.0'
    }
  });
});

module.exports = ctrl;
