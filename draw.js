var Canvas = require('canvas')
  , fs = require('fs')
  , leftpad = require('leftpad')
  , byline = require('byline')
  , level = require('level')
  , polyline = require('polyline')
  , moment = require('moment')
  , queue = require('queue-async')

var frameInc = 5
var size = 1000
var clear = 0.15
var canvas = new Canvas(size, size)
var ctx = canvas.getContext('2d')
var frame = 0
var count = 0
var bbox = [
  -74.00493621826172,
  40.72579524882268,
  -73.8698387145996,
  40.64990841734959
]

var startTime = '09-01-2015-00-00-00'
var endTime = '09-30-2015-11-59-59'
var time = moment(startTime, "MM-DD-YYYY-HH-mm-ss")

var xdiff = bbox[2] - bbox[0]
var ydiff = bbox[3] - bbox[1]

var routes = level('./data/routeSegments')

ctx.strokeStyle = 'rgba(29,91,151,0.75)'
ctx.lineWidth = 2.5
var height, width
var q = queue(1)
fs.readFile('./data/brooklyn.png', function(err, bg) {
  img = new Canvas.Image
  img.src = bg
  ctx.drawImage(img, 0, 0, size, size)
  while(time.format('MM-DD-YYYY-HH-mm-ss')<endTime) {
    var start = time.format('MM-DD-YYYY-HH-mm-ss')
    var stop = time.add(frameInc, 's').format('MM-DD-YYYY-HH-mm-ss')
    q.defer(function(start, stop, done) {
      routes.createReadStream({gte:start, lt:stop})
      .on('data', function(data) {
        if(data.value) {
          var line = JSON.parse(data.value)
          ctx.beginPath()
          ctx.shadowColor ='rgba(29,91,151,1)'
          ctx.shadowBlur = 7
          ctx.globalAlpha = 1
          ctx.globalCompositeOperation = 'lighter'
          ctx.moveTo (~~(((line[0][0] - bbox[0]) / xdiff) * size), ~~(((line[0][1] - bbox[1]) / ydiff) * size))
          ctx.lineTo (~~(((line[1][0] - bbox[0]) / xdiff) * size), ~~(((line[1][1] - bbox[1]) / ydiff) * size))
          ctx.stroke()
          if(data.key > endTime) throw new Error(data.key)
        }
      })
      .on('close', function() {
        fs.writeFileSync('frames/' + leftpad(frame++, 5) + '.png', canvas.toBuffer())
        ctx.globalAlpha = clear
        ctx.globalCompositeOperation = clear
        ctx.shadowBlur = 0
        ctx.drawImage(img, 0, 0, size, size)
        done()
      })
    }, start, stop)
  }
  q.awaitAll(function(){})
})

