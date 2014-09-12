var express = require('express');
var compression = require('compression');
var bodyParser = require('body-parser');
var methodOverride = require('method-override');

var Kernel = require('./src/Kernel/Kernel');
var Server = require('./src/Server/Server');

var app = express();

app.use(compression());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(methodOverride('_method'));
app.use(express.static(__dirname + '/web'));

new Kernel().setupServer(new Server.ExpressServer(app));

app.listen(process.env.PORT || 9000);
