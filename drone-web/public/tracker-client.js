var socket = io()

// The location of all drones has been broadcast. Should occcur once the websocket
// connection has been established i.e. page load. Refresh all rows in table.
socket.on('all-location-broadcast', function (data) {
  if (data) {
    $('#tracking-table tbody tr').remove()
    $.each(data, function (index, value) {
      createNewRow(value)
    })
  }
})

// Individual drone update received. Look for that drone in table and update if it exists,
// replace individual cells rather than entire row to make the change smooth visually.
// Create new row if drone doesnt already exist in table.
socket.on('location-update', function (data) {
  if (data) {
    var existingRow = $('#tracking-table tbody tr#' + data.ID)
    if (existingRow.length) {
      existingRow.children('.lat-cell').html(data.lat)
      existingRow.children('.lon-cell').html(data.lon)
      existingRow
        .children('.time-cell')
        .html(new Date(data.timestamp).toLocaleString())
      existingRow.children('.time-cell').attr('data-timestamp', data.timestamp)
      existingRow.children('.speed-cell').html(data.speed)
    } else {
      createNewRow(data)
    }
  }
})

// Update received that drone has been paused. Adjust UI acccordingly.
socket.on('drone-paused-notification', function (id) {
  $('#' + id).addClass('paused')
})

// Update received that drone has been restarted. Adjust UI acccordingly.
socket.on('drone-restarted-notification', function (id) {
  $('#' + id).removeClass('paused')
})

// Update received that drone has been deleted. Remove drone from table.
socket.on('drone-deleted-notification', function (data) {
  $('#' + data).remove()
})

// Open socket with simulator app. When user clicks pause, restart or delete we send a
// message to the simulator app.
var simulatorSocketUrl = 'http://' + window.location.host + ':3030'
var simulatorSocket = io(simulatorSocketUrl)

// Takes a drone object and creates a new table row. Appends to table.
function createNewRow (drone) {
  var simIcon = ''
  var paused = ''
  var simClass = ''
  var timeString = new Date(drone.timestamp).toLocaleString()
  var dangerClasss = ''

  if (drone.sim) {
    simIcon =
      '<span class="oi oi-check" title="check" aria-hidden="true"></span>'
    simClass = 'simulated'
  }

  if (drone.paused) paused = 'paused'

  if (Date.now() - drone.timestamp > 10000) dangerClasss = 'table-danger'

  var newRow =
    '<tr scope="row" id="' +
    drone.ID +
    '" class="' +
    paused +
    ' ' +
    simClass +
    ' ' +
    dangerClasss +
    '">' +
    '<td class="id-cell">' +
    drone.ID +
    '</td>' +
    '<td class="lat-cell">' +
    drone.lat +
    '</td>' +
    '<td class="lon-cell">' +
    drone.lon +
    '</td>' +
    '<td class="time-cell" data-timestamp="' +
    drone.timestamp +
    '">' +
    timeString +
    '</td>' +
    '<td class="speed-cell">' +
    drone.speed +
    '</td>' +
    '<td class="sim-cell">' +
    simIcon +
    '</td>' +
    '<td class="pause-cell">' +
    '<button type="submit" data-id="' +
    drone.ID +
    '" class="pause-drone btn btn-primary"><span class="oi oi-media-pause" title="pause" aria-hidden="true"></span></button>' +
    '</td>' +
    '<td class="restart-cell">' +
    '<button type="submit" data-id="' +
    drone.ID +
    '" class="restart-drone btn btn-primary"><span class="oi oi-media-play" title="restart" aria-hidden="true"></span></button>' +
    '</td>' +
    '<td class="delete-cell">' +
    '<button type="submit" data-id="' +
    drone.ID +
    '" class="delete-drone btn btn-primary"><span class="oi oi-delete" title="delete" aria-hidden="true"></span></button>' +
    '</td>' +
    '</tr>'

  $('#tracking-table tbody').append(newRow)

  // Hook up click events for the buttons in the new row. Send message to simulator app
  // for each click.
  $('#' + drone.ID + ' .pause-drone').click(function () {
    var id = $(this).attr('data-id')
    simulatorSocket.emit('pause-drone', id)
  })

  $('#' + drone.ID + ' .restart-drone').click(function () {
    var id = $(this).attr('data-id')
    simulatorSocket.emit('restart-drone', id)
  })

  $('#' + drone.ID + ' .delete-drone').click(function () {
    var id = $(this).attr('data-id')
    simulatorSocket.emit('delete-drone', id)
  })
}

// Periodically check to see if any drone has not been updated for more than ten
// seconds. Visually highlight if thats the case.
setInterval(function () {
  $('tr').each(function (index, elem) {
    var timestamp = $(elem)
      .children('.time-cell')
      .attr('data-timestamp')
    if (Date.now() - timestamp > 10000) {
      $(elem).addClass('table-danger')
    } else {
      $(elem).removeClass('table-danger')
    }
  })
}, 2000)

// Hook up click event for create drone button. Send message to simulator app when clicked.
$(document).ready(function () {
  $('#create-drone').click(function () {
    simulatorSocket.emit('create-drone-simulator')
  })
})
