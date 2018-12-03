const { timeStamp } = require('../common/util')
const MealModel = require('../model/Meal')

var Meal = {}

Meal._week = ['일', '월', '화', '수', '목', '금', '토']

Meal.init = async function (school) {
  this.school = school
  await MealModel.init()
  console.log(timeStamp() + 'Meal model defined'.cyan)
}

Meal.update = async function (tomorrow) {
  try {
    const mealInfo = await this.school.getMeal()

    // 월, 일, 요일
    const $date = new Date()
    const $month = $date.getMonth() + 1
    let $day = $date.getDate()
    let $weekDay = $date.getDay()

    // 이번달의 마지막 날 (일)
    const $lastDay = new Date($date.getYear(), $month, 0).getDate()
    let changed = false
    if (tomorrow && $day + 1 <= $lastDay) {
      $day += 1
      changed = true
    }

    let dateString = `${$month}월 ${$day}일 ${this._week[$weekDay]}요일`
    if (changed) {
      dateString = '[내일의 급식]\n\n' + dateString
    }

    await MealModel.update(dateString, mealInfo[$day])
    console.log(timeStamp() + 'Meal data updated'.green)
  } catch (e) {
    console.log(timeStamp() + e.message.red)
  }
}

Meal.get = async function () {
  try {
    const row = await MealModel.get()
    if (row && row.date && row.info) {
      return row.date + '\n\n' + row.info
    }
    return '급식 데이터가 존재하지 않습니다.'
  } catch (e) {
    console.log(timeStamp() + e.message.red)
    return '급식 데이터를 불러오는 중 오류가 발생했습니다.'
  }
}

module.exports = Meal
