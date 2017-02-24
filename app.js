var express = require('express');
var app = express();
var fs = require('fs');
var options = {
	key: fs.readFileSync('key.pem'),
	cert: fs.readFileSync('cert.pem')
};
var https = require('https').createServer(options,app).listen(process.env.PORT || 5000, function () {
	console.log('server running at '+( process.env.PORT || 5000));
});

var io = require('socket.io')(https); 

app.get('/', function (req,res) {
	res.redirect('index.html');
});

// handle static file
app.use(express.static('public'));
app.use(express.static(__dirname));