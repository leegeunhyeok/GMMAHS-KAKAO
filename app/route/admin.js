const config = require('config')

module.exports = app => {
  app.get(config.get('admin.route'), (req, res) => {
    res.send('This is admin page!')
  })

  console.log(timeStamp() + 'Admin route initialized'.cyan)
}
