require('date-utils');

var express = require('express'),
  cors = require('cors'),
	hbs = require('hbs'),
	db = require('./lib/db'),
	router = require('./lib/router'),
	port = process.env.PORT || 5001;

hbs.registerPartials('./app/templates/partials', function() {});

var app = express();

app.set('view engine', 'hbs');
app.set('views', './app/templates');

app.use(cors());
app.use(express.static('./app'));
app.use(express.compress());

router.routes(app);

app.listen(port);
console.log('Server started on port', port);
