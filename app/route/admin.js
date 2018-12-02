const fs = require('fs')
const passport = require('../bootstrap/passport')

const { timeStamp } = require('../common/util')

module.exports = app => {
  app.get('/admin', (req, res) => {
    fs.readFile('./public/index.html', 'utf-8', (err, data) => {
      if (err) {
        console.log(timeStamp() + err.message.red)
        res.writeHead(500, { 'Content-Type': 'text/html' })
        res.write(err.message)
        res.end()
      } else {
        res.writeHead(200, { 'Content-Type': 'text/html' })
        res.write(data)
        res.end()
      }
    })
  })

  app.post('/auth', passport.authenticate)
  app.post('/login', passport.login)
  app.post('/logout', passport.logout)

  console.log(timeStamp() + 'Admin route initialized'.cyan)
}
