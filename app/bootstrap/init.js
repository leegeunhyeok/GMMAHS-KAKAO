const config = require('config'),
      cookieParser = require('cookie-parser'),
      bodyParser = require('body-parser')

const bus = require('../src/Bus'),
      calendar = require('../src/Calendar'),
      meal = require('../src/Meal'),
      statistics = require('../src/Statistics'),
      weather = require('../src/Weather')


const { timeStamp } = require('../common/util')
const school = require('./school').school

module.exports = async app => {
  console.log((timeStamp() + 'Server initializing').cyan)

  await require('./database').init()
  
  await bus.init()
  await calendar.init(school)
  await meal.init(school)
  await statistics.init()
  await weather.init()

  /* 테스트 */
  await calendar.update()
  console.log(await calendar.get())

  await weather.update()
  console.log(await weather.get())

  await statistics.count('MEAL')
  await statistics.count('MEAL')
  await statistics.count('MEAL')
  console.log(await statistics.get())
  /*-------*/

  await require('./scheduler').init()

  // 포트 설정, 기본값 8080
  app.set('port', config.has('port') ? config.get('port') : 8080)

  // 미들웨어 사용
  app.use(cookieParser())
  app.use(bodyParser.urlencoded({ extended: true }))
}
