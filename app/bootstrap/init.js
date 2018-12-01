const config = require('config')
const cookieParser = require('cookie-parser')
const bodyParser = require('body-parser')

const admin = require('../src/Admin')
const bus = require('../src/Bus')
const calendar = require('../src/Calendar')
const meal = require('../src/Meal')
const statistics = require('../src/Statistics')
const timetable = require('../src/Timetable')
const weather = require('../src/Weather')

const { timeStamp } = require('../common/util')
const school = require('./school').school

module.exports = async app => {
  const startTime = new Date()
  console.log(timeStamp() + 'Server initializing..')

  await require('./database').init()

  await admin.init()
  await bus.init()
  await calendar.init(school)
  await meal.init(school)
  await statistics.init()
  await timetable.init('광명경영회계고등학교')
  await weather.init()

  await calendar.update()
  await meal.update()
  await timetable.update()
  await weather.update()

  await require('./scheduler').init()

  // 포트 설정, 기본값 8080
  app.set('port', config.has('port') ? config.get('port') : 8080)

  // 미들웨어 사용
  app.use(cookieParser())
  app.use(bodyParser.urlencoded({ extended: false }))
  app.use(bodyParser.json())

  require('../message/message')(app)
  require('../route/admin')(app)

  console.log(timeStamp() + 'Initialization complete! ' + (new Date() - startTime + 'ms').yellow)
}
