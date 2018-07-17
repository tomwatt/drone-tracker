var server = require('http').createServer()
var io = require('socket.io')(server)

server.listen(3000)

io.on('connection', function (socket) {
  socket.on('drone-location-update', function (data) {})
})
