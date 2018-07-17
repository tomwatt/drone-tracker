var server = require('http').createServer()
var io = require('socket.io')(server)
var updateHandler = require('./update-handler')

server.listen(3000)

// This application listens for updates to drone locations to be received via this socket.io connection,
// then passes them to the handler.
io.on('connection', function (socket) {
  socket.on('drone-location-update', function (data) {
    updateHandler.newMessage(data)
  })
})
