var server = require('http').createServer()
var io = require('socket.io')(server)
var updateHandler = require('./update-handler')

server.listen(3000)

io.on('connection', function (socket) {
  socket.on('drone-location-update', function (data) {
    updateHandler.newMessage(data)
  })
})
