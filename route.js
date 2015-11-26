var fs = require('fs')
  , OSRM = require('OSRM')
  , byline = require('byline')
  , level = require('level')
  , moment = require('moment')
  , polyline = require('polyline')
  , report = require('./report.js')

var routeSegments = level('./data/routeSegments')
var osrm = new OSRM('./data/osrm/nyc.osrm')
var stream = byline(fs.createReadStream('./data/201509-citibike-tripdata.csv', {encoding: 'utf8'}))

var count = 0
stream.on('data', function(line) {
  var trip = parseLine(line)
  osrm.route({coordinates: trip.coordinates, printInstructions: true}, function(err, route) {
    if(err) throw err
    if(route.route_geometry) {
      var coords = polyline.decode(route.route_geometry, 6)
      for(var i=0; i<coords.length-1;i++) {
        var segment = [[coords[i][1],coords[i][0]], [coords[i+1][1],coords[i+1][0]]]
        var seconds = route.route_summary.total_time * (i/coords.length)
        var key = moment(trip.startTime).add(seconds, 's').format("MM-DD-YYYY-HH-mm-ss-")+i
        routeSegments.put(key, JSON.stringify(segment), function() {
          report(count++)
        })
      }
    }
  })
})

function parseLine(line) {
  var cells = line.split(',')
  var startLat = parseFloat(cells[5].slice(1,-1))
  var startLng = parseFloat(cells[6].slice(1,-1))
  var endLat = parseFloat(cells[9].slice(1,-1))
  var endLng = parseFloat(cells[10].slice(1,-1))
  var startTime = cells[1].slice(1,-1).split('/').join(' ').split(' ')
  if(startTime[0].length<2) {startTime[0] = '0'+startTime[0]}
  if(startTime[1].length<2) {startTime[1] = '0'+startTime[1]}
  var endTime = cells[2].slice(1,-1).split('/').join(' ').split(' ')
  if(endTime[0].length<2) {endTime[0] = '0'+endTime[0]}
  if(endTime[1].length<2) {endTime[1] = '0'+endTime[1]}
  var trip = {
    startTime: moment(startTime.join('-').split(':').join('-'), "MM-DD-YYYY-HH-mm-ss"),
    endTime: moment(endTime.join('-').split(':').join('-'), "MM-DD-YYYY-HH-mm-ss"),
    coordinates: [[+startLat,+startLng], [+endLat,+endLng]],
  }
  return trip
}