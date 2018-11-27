const { timeStamp } = require('../common/util')
const MealModel = require('../model/Meal')

var Meal = {}

Meal._week = ['일', '월', '화', '수', '목', '금', '토']

Meal.init = async function (school) {
  this.school = school
  await MealModel.init()
  console.log((timeStamp() + 'Meal model defined').cyan)
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
    let $last_day = new Date($date.getYear(), $month, 0)

    // 매개변수 tomorrow가 참일경우 내일 급식으로 변경하기
    let changeTomorrow = tomorrow && $day + 1 <= $last_day.getDate()
    if (changeTomorrow) {
      $day++;
      if($weekDay + 1 > 6) {
        $weekDay = 0;
      } else {
        $weekDay++;
      }
    }

    let dateString = `${$month}월 ${$day}일 ${this._week[$weekDay]}요일`
    if (changeTomorrow) {
      dateString = '[내일의 급식]\n\n' + dateString;
    }

    await MealModel.update(dateString, mealInfo)
    console.log((timeStamp() + 'Meal data changed').cyan)
  } catch (e) {
    console.log((timeStamp() + e).red)
  }
}


Meal.get = function () {
  return new Promise((resolve, reject) => {
    MealModel.get().then(row => {
      if (row && row.date && row.info) {
        resolve(row.date + '\n\n' + row.info)
      } else {
        resolve('급식 데이터가 존재하지 않습니다.')
      }
    }).catch(e => {
      console.log((timeStamp() + e).red)
      reject('급식 데이터를 불러오는 중 오류가 발생했습니다.')
    })
  })
}

module.exports = Meal
