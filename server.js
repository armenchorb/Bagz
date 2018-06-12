const express = require('express');
const stripe = require('stripe');
var session = require('express-session');
const bcrypt = require('bcrypt-as-promised');
const nodemailer = require('nodemailer');
var app = express();
var path = require('path');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/bagz');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:true}));
app.use(express.static(path.join(__dirname, './static')));
app.set('views', path.join(__dirname, './views'));
app.set('view engine', 'ejs');
app.use(session({
    secret: 'bagzpass',
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 60000 }
  }));
require('./server/config/mongoose.js');
require('./server/config/routes.js')(app);

var server = app.listen(8000, function(){
    console.log('listening on port 8000');
})

var io = require('socket.io').listen(server);

var messages = ["<p>You can now chat with your driver..</p>"];

io.sockets.on('connection', function(socket){
    console.log('SOCKET IS CONNECTED BABY!');
    var user;
    socket.on('got_new_user', function(data){
        console.log(data);
        user = data;
        user.id = socket.id;
        socket.emit("added_user", {messages: messages});
        var joined = "<p>" + "<strong>"+ user.name+ "</strong>" + " " + "has joined";
        messages.push(joined);
        socket.broadcast.emit("update_chat", {message: joined});
    });
    socket.on('new_message', function(data){
        console.log(data);
        messages.push(data.message);
        io.emit('update_chat', {message: data.message});
    });
    socket.on('disconnect', function(){
        console.log("User disconnected from socket" + socket.id);
    });
});
