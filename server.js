// ---- 基本設定 ----
var http    = require('http');
var express = require('express');
var session = require('express-session');

// ---- ROUTES ----
var path    = require('path');
var routes  = {
    index   : require('./routes/index'),
    user    : require('./routes/user')
};

// ---- WEBSOCKET ----
var socket = require('socket.io');


// ---- FAVICON ----
var favicon = require('serve-favicon');

// ---- LOGGER ----
var logger = require('morgan');

// ---- METHOD ----
var methodOverride = require('method-override');

// ---- RESPONSE ----
var bodyParser = require('body-parser');

// ---- ERROR ----
var errorHandler = require('errorhandler');

// ---- SETTING ----
var app = express();

if (process.env.NODE_ENV === 'development') {
    require('dotenv-extended').load({
        path: '.env',
        defaults: '.env.example',
    });

}
app.set('port', process.env.PORT || 3000);
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');

var server = http.createServer(app);
var io = socket(server);

app.use(errorHandler());
app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
app.use(methodOverride());
// app.use(session({
//     resave: true,
//     saveUninitialized: true,
//     secret: 'uwotm8'
// }));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

// ---- STATIC FILES ----
app.use(express.static(path.join(__dirname, 'public')));
// ---- RENDER FILES ----
app.use('/web', routes.index);
app.use('/users', routes.user.list);

io.on('connection', function (socket) {
    socket.on('chat_message', function (msg) {
        io.emit('chat_message', msg);
    });
});

server.listen(app.get('port'), function () {
    console.log('listening on http://localhost:' + app.get('port'));
});
