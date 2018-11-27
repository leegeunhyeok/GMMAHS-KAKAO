const schedule = require('node-schedule')

const Calendar = require('../src/Calendar'),
      Meal = require('../src/Meal'),
      // Timetable = require('../src/Timetable'),
      Weather = require('../src/Weather')

const { timeStamp } = require('../common/util')

exports.init = () => {

  // 매일 00:00:01 급식데이터 및 이번달 일정 데이터 갱신
  schedule.scheduleJob('1 0 0 * * * *', async () => {
    await Meal.update()
    await Calendar.update()
  })

  // 매주 토요일 00:00:00에 시간표 데이터 갱신
  schedule.scheduleJob('0 0 0 * * * 7', () => {
    // 시간표
  })

  // 매일 14:00:00 급식데이터 갱신 (내일 급식으로)
  // 점심시간이 지난 후 (2시에 내일 급식으로 갱신)
  schedule.scheduleJob('0 0 14 * * * *', async () => {
    await Meal.update(true)
  })

  // 매 시간마다 날씨데이터 갱신
  schedule.scheduleJob('0 0 * * * * *', async () => {
    await Weather.update()
  })

  console.log((timeStamp() + 'Scheduler initialized'))
}
