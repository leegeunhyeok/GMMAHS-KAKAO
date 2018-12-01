const config = require('config')
const passport = require('../bootstrap/passport')

const { timeStamp } = require('../common/util')

module.exports = app => {
  app.get(config.get('admin.route'), (req, res) => {
    res.send('This is admin page!')
  })

  app.post('/auth', passport.authenticate)
  app.post('/login', passport.login)

  console.log(timeStamp() + 'Admin route initialized'.cyan)
}
