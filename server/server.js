require('date-utils');

var express = require('express');
var hbs = require('hbs');
var compression = require('compression');
var cors = require('cors');

var db = require('./lib/db');
var router = require('./lib/router');
var routes = require('./lib/models/routes');
var port = process.env.PORT || 5001;

hbs.registerPartials('./app/templates/partials', function() {});

var app = express();

app.set('view engine', 'hbs');
app.set('views', './app/templates');

app.use(express.static('./app'));
app.use(compression());
app.use(cors());

router.routes(app);

app.listen(port);
console.log('Server started on port', port);
