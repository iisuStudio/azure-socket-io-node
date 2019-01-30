

var http = require('http');
var express = require('express');
var routes = require('./routes');
var user = require('./routes/user');
var path = require('path');
var socket = require('socket.io');

var favicon = require('serve-favicon');
var logger = require('morgan');
var methodOverride = require('method-override');
var session = require('express-session');
var bodyParser = require('body-parser');
var errorHandler = require('errorhandler');

var app = express();
var server = http.createServer(app);
var io = socket(server);

if(process.env.NODE_ENV === 'development') {
    require('dotenv-extended').load();
    // additional develop environment configuration
}

app.set('port', process.env.PORT || 3000);
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
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
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', routes.index);
app.get('/users', user.list);

io.on('connection', function(socket){
    socket.on('chat_message', function(msg){
        io.emit('chat_message', msg);
    });
});

server.listen(app.get('port'), function(){
    console.log('listening on *:' + app.get('port'));
});