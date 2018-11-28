const request = require('request'),
      cheerio = require('cheerio'),
      iconv = require('iconv-lite')

const { timeStamp } = require('../common/util')
const TimetableModel = require('../model/Timetable')

var Timetable = {}

Timetable._baseUrl = 'http://comci.kr:4081'
Timetable._url = 'http://comci.kr:4081/st'

Timetable.init = async function () {
  await TimetableModel.init()
  console.log((timeStamp() + 'Timetable model defined').cyan)
}


Timetable.update = async function (schoolKeyword) {
  await new Promise((resolve, reject) => {
    request(this._url, (err, res, body) => {
      const idx = body.indexOf('school_ra(sc)')
      const idx2 = body.indexOf('sc_data(\'')

      if (err) {
        reject('학교 정보를 불러오던 중 오류가 발생했습니다')
      } else if (idx === -1 || idx2 === -1) {
        reject('학교를 찾을 수 없습니다')
      }

      const extract_school_ra = body.substr(idx, 50).replace(' ', '')
      const school_ra = extract_school_ra.match(/url:'.(.*?)'/)

      const extract_sc_data = body.substr(idx2, 30).replace(' ', '')
      const sc_data = extract_sc_data.match(/\(.*?\)/)

      if (sc_data) {
        this.sc_data = sc_data[0].replace(/[\(\)]/g, '').replace(/\'/g, '').split(',')
      }

      if (school_ra) {
        this.extractCode = school_ra[1]
        let hexString = ''
        for (let buf of iconv.encode(schoolKeyword, 'euc-kr')) {
          hexString += '%' + buf.toString(16)
        }

        request(this._baseUrl + this.extractCode + hexString, (err, res, body) => {
          jsonString = body.substr(0, body.lastIndexOf('}') + 1)
          searchData = JSON.parse(jsonString)['학교검색']
          if (err) {
            reject('코드 추출 중 문제가 발생했습니다.')
          } else if (searchData.length > 1) {
            reject('조회된 학교가 많습니다. 자세한 키워드를 입력해주세요')
          } else {
            const da1 = '0'
            const s7 = this.sc_data[0] + searchData[0][3]
            const sc3 = this.extractCode.split('?')[0] + '?' +
                        Buffer.from(s7 + '_' + da1 + '_' + this.sc_data[2])
                        .toString('base64')
            
            console.log(sc3)
            
            request(sc3, (err, res, body) => {
              console.log(body)
              resolve(body)
            })
          }
        })
      } else {
        reject('URL을 추출할 수 없습니다.')
      }
    })
  })

  // await TimetableModel.update(result)
}


Timetable.get = async function () {
  try {
    const rows = await TimetableModel.get()
    if (rows) {
      let resultString = ''
      const pub = rows[0].pub
      rows.forEach(row => {
        resultString += `[${row.hour > 12 ? '오후':'오전'}` +
                        ` ${row.hour > 12 ? row.hour - 12 : row.hour}시]\n` +
                        `- 기온: ${row.temp}℃\n` +
                        `- 강수형태: ${this._pty[row.pty]}\n` + 
                        `- 강수확률: ${row.pop}%, ${row.wfKor}\n` + 
                        `- 습도: ${row.reh}%\n\n`
      })
      return resultString + pub + ' 발표\n소하 2동 날씨 기준'
    } else {
      return '날씨 데이터가 없습니다.'
    }
  } catch (e) {
    console.log((timeStamp() + e).red)
    return '날씨 데이터를 불러오는 중 오류가 발생했습니다.'
  }
}

module.exports = Timetable

Timetable.update('광명경영회계고등학교')
