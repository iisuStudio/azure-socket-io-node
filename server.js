// ---- 基本設定 ----
var http    = require('http');
var express = require('express');
var session = require('express-session');
var Array = require('node-array');
var querystring = require('querystring');

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

// ---- CACHE ----
var cache = require('node-file-cache').create();

// ---- METHOD ----
var methodOverride = require('method-override');

// ---- RESPONSE ----
var bodyParser = require('body-parser');

// ---- ERROR ----
var errorHandler = require('errorhandler');

// ---- SETTING ----
var app = express();

if (!process.env.NODE_ENV) {
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


// ---- HOST NODES ----
var node = [
    'iisustudio-socket-io-node.azurewebsites.net:80',
    'iisustudio-socket-io-node-0.azurewebsites.net:80',
    'iisustudio-socket-io-node-1.azurewebsites.net:80',
    process.env.NODE_ENV === 'development' ? 'localhost:3000' : '',
    process.env.NODE_ENV === 'development' ? 'localhost:3001' : '',
    process.env.NODE_ENV === 'development' ? 'localhost:3002' : '',
];

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
app.get('/wss/connect_info', function (req, res) {
    res.send({clientsCount: io.engine.clientsCount});
});
app.post('/wss/connect_info', function (req, res) {
    cache.set( req.headers.host, req.body );
    var hosts = node;
    var clientsTotal = 0;
    hosts.forEach(function(value, index){
        var item = cache.get(value);
        clientsCount = item ? parseInt(item.clientsCount) : 0;
        clientsTotal += clientsCount;
    });
    req.body.clientsTotal = clientsTotal;
    io.emit('chat_user', req.body);
    res.send({clientsCount: io.engine.clientsCount});
});
app.post('/wss/message_pool', function (req, res) {
    io.emit('chat_message', req.body.message);
    res.send(req.body.message);
});

io.on('connection', function (socket) {
    socket.on('chat_user', function (info) {
        hosts = node;
        hosts.forEachAsync(function (value, index) {
            host = value.split(':');
            // Build the post string from an object
            var post_data = querystring.stringify({
                clientsCount: io.engine.clientsCount,
            });
            var post_options = {
                host: host[0],
                path: '/wss/connect_info',
                port: host[1],
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Content-Length': Buffer.byteLength(post_data)
                }
            };

            var req = http.request(post_options, function (response) {
                // response.setEncoding('utf8');
                var str = '';
                response.on('data', function (chunk) {
                    str += chunk;
                });

                response.on('end', function () {
                    console.log(str);
                });
            });
            //This is the data we are posting, it needs to be a string or a buffer
            req.on('error', function (err) {
                // Handle error
                console.log(value + " was error!");
                console.log(err);
            });
            req.write(post_data);
            req.end();
        })
    });
    socket.on('chat_message', function (msg) {
        // io.emit('chat_message', msg);
        hosts = node;
        hosts.forEachAsync(function (value, index) {
            host = value.split(':');
            // Build the post string from an object
            var post_data = querystring.stringify({
                message: msg,
            });
            var post_options = {
                host: host[0],
                path: '/wss/message_pool',
                port: host[1],
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Content-Length': Buffer.byteLength(post_data)
                }
            };

            var req = http.request(post_options, function (response) {
                // response.setEncoding('utf8');
                var str = '';
                response.on('data', function (chunk) {
                    str += chunk;
                });

                response.on('end', function () {
                    console.log(str);
                });
            });
            //This is the data we are posting, it needs to be a string or a buffer
            req.on('error', function (err) {
                // Handle error
                console.log(value + " was error!");
                console.log(err);
            });
            req.write(post_data);
            req.end();
        })
    });
});

server.listen(app.get('port'), function () {
    console.log('listening on http://localhost:' + app.get('port'));
});
