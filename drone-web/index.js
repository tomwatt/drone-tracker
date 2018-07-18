var express = require('express')
var app = express()
var server = require('http').Server(app)
var io = require('socket.io')(server)
var path = require('path')
var updateHandler = require('./update-handler')

server.listen(80)

app.use(express.static('public'))

app.get('/', function (req, res) {
  res.sendFile(path.join(__dirname, '/index.html'))
})

io.on('connection', function (socket) {
  updateHandler.broadcastAllValues(socket)
  updateHandler.subscribeToUpdates(socket)
})
