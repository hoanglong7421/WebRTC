var express = require('express');
var app = express();
var fs = require('fs');
var options = {
    key: fs.readFileSync('key.pem'),
    cert: fs.readFileSync('cert.pem')
};
var https = require('https').createServer(options, app).listen(process.env.PORT || 3000, function() {
    console.log('server running at ' + (process.env.PORT || 3000));
});
var io = require('socket.io')(https);
var _ = require('lodash');
// status code
var SUCCESS = 0;
var ERROR_SOCKET_EXIST = 1001;
var ERROR_USERNAME_EXIST = 1002;

// when there one connect
var user = [];
io.on('connection', function(socket) {
    console.log('[connection]', ' socket: ' + socket.id + ' connected');
    var roomCurrent = -1;
    var isInRoom = false; // check username is already room ?
    socket.on('login', function(username) {
        console.log('[login]', socket.id, username);
        var userCurrent = {
            username: username,
            socket: socket.id
        };
        // check socket exist
        if (_.findIndex(user, {
                socket: socket.id
            }) !== -1) {
            console.log('[login]', 'Error: socket.id exists. ' + socket.id);
            socket.emit('on_login', {
                status: false,
                error_message: 'socket exists'
            });
            return;
        }
        // check username exist
        if (_.findIndex(user, {
                username: username
            }) !== -1) {
            console.log('[login]', 'Error: username exists. ' + username);
            socket.emit('on_login', {
                status: false,
                error_message: 'username exists'
            });
            return;
        }
        // when login succesfull
        user.push(userCurrent);
        console.log('[login]', 'Successfully');
        socket.emit('on_login', {
            status: true,
            list_user: user,
        });

        socket.broadcast.emit('on_online', {
            user: userCurrent,
            status: true
        });
    });

    socket.on('createRoom', function(username) {
    	console.log('[createRoom]', socket.id, username, 'isInRoom: ' + isInRoom);
        if (isInRoom === false) {
            /// do something
            var x = '' + new Date().getTime();
            roomCurrent = x;
            socket.join(x);
        }
        var inviteInfo = {
            room: roomCurrent,
            username: user[_.findIndex(user, {
                socket: socket.id
            })].username
        };
        io.to(user[_.findIndex(user, {
            username: username
        })].socket).emit('invite', inviteInfo);

        console.log('[createRoom]', inviteInfo.username + ' invite ' + username);

        //handle callee's answer
        socket.once('confirm', function(data) {
            console.log('[confirm]', socket.id, data);
            if (data === 0) {
                isInRoom = true;
            } else {
                if (isInRoom === false) {
                    socket.leave(roomCurrent);
                    roomCurrent = -1;
                }
            }
        });
    });

    //listen reply from callee. data = true/ false
    socket.on('reply', function(data) {
        console.log('[reply]', socket.id, data);
        //emit answer to caller
        socket.broadcast.to(data.room).emit('replyToCaller', {
            answer: data.answer,
            from: socket.id
        });
        if (data.answer === 0) {
            roomCurrent = data.room;
            socket.join(data.room);
            isInRoom = true;
        }
    });

    // transfer data 
    socket.on('message', function(data) {
        data.from = socket.id;
        console.log('[message]', socket.id, data);
        socket.broadcast.to(roomCurrent).emit('receiveMessage', data);
    });

    // options video audio
    socket.on('options', function(data) {
    	console.log('[options]', socket.id, data);
        data.socket = socket.id;
        socket.broadcast.to(roomCurrent).emit('listenOptions', data);
    });

    // when finish the call 
    socket.on('end', function() {
    	console.log('[end]', socket.id);
        socket.broadcast.to(roomCurrent).emit('end', {
            socket: socket.id
        });
        socket.leave(roomCurrent);
        console.log('[end]', socket.id + ' leaved room ' + roomCurrent);
        roomCurrent = -1;
        isInRoom = false;
    });

    // when client disconnect
    socket.on('disconnect', function() {
        console.log('[disconnect]', socket.id);
        var uIndex = _.findIndex(user, {
            socket: socket.id
        });
        if (uIndex !== -1) {
            console.log('[disconnected]', ' remove username: ' + user[uIndex].username);
            socket.broadcast.emit('on_online', {
                user: user[uIndex],
                status: false
            });
            user.splice(uIndex, 1);
            console.log('[disconnect]', user);
        }
    });
});

// return homepage
app.get('/', function(req, res) {
    res.redirect('index.html');
});

app.use(express.static(__dirname));