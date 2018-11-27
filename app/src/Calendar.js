const { timeStamp } = require('../common/util')
const CalendarModel = require('../model/Calendar')

var Calendar = {}

Calendar.init = async function (school) {
  this.school = school
  await CalendarModel.init()
  console.log((timeStamp() + 'Calendar model defined').cyan)
}


Calendar.update = async function () {
  try {
    await CalendarModel.update(await this.school.getNotice())
    console.log((timeStamp() + 'Calendar data changed').cyan)
  } catch (e) {
    console.log((timeStamp() + e).red)
  }
}


Calendar.get = async function () {
  try {
    const rows = await CalendarModel.get()
    let resultString = '[이번 달 학사일정]\n\n'
    if (rows) {
      for (let row of rows) {
        resultString += `${row.month}월 ${row.day}일: ${row.content}\n`
      }
      return resultString
    } else {
      return resultString + '학사일정이 없습니다.'
    }
  } catch (e) {
    console.log((timeStamp() + e).red)
    return '학사일정 데이터를 불러오는 중 오류가 발생했습니다.'
  }
}

module.exports = Calendar