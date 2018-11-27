const express = require('express')
const app = express()

const colors = require('colors')
const { timeStamp } = require('./app/common/util')

require('./app/bootstrap/init')(app).then(() => {
  app.listen(app.get('port'), () => {
    console.log(colors.cyan(timeStamp() + 'GMMAHS KAKAO server started, port: ' + app.get('port')))
  })
}).catch(e => {
  console.log((timeStamp() + 'ERROR: ' + e.message).red)
})
