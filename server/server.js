require('date-utils');

const express = require('express');
const hbs = require('hbs');
const compression = require('compression');
const cors = require('cors');

const db = require('./lib/db');
const router = require('./lib/router');
const port = process.env.PORT || 5001;

hbs.registerPartials('./app/templates/partials', function() {});

var app = express();

app.set('view engine', 'hbs');
app.set('views', './app/templates');

app.use(cors());
app.use(express.static('./app'));
app.use(compression());
app.use(cors());

router.routes(app);

app.listen(port);

console.log('Server started on port', port);
