const config = require('config')
const request = require('request')
const cheerio = require('cheerio')

const { timeStamp } = require('../common/util')

var Bus = {}

Bus._station = 'http://openapi.gbis.go.kr/ws/rest/busstationservice?serviceKey='
Bus._bus = 'http://openapi.gbis.go.kr/ws/rest/busarrivalservice/station?serviceKey='
Bus._route = 'http://openapi.gbis.go.kr/ws/rest/busrouteservice/info?serviceKey='
Bus._info = 'http://openapi.gbis.go.kr/ws/rest/busrouteservice/info?serviceKey='

Bus._err = {
  '1': 'API 서버에 시스템 에러가 발생하였습니다.',
  '2': '필수 요청 파라미터가 존재하지 않습니다.',
  '3': '필수 요청 파라미터가 잘못되었습니다.',
  '4': '검색 결과가 존재하지 않습니다.',
  '5': '인증키가 존재하지 않습니다.',
  '6': '등록되지 않은 키 입니다.',
  '7': '사용 중지된 키 입니다.',
  '8': '요청 제한을 초과하였습니다.',
  '20': '잘못된 위치로 요청하였습니다.',
  '21': '노선번호는 1자리 이상 입력하세요',
  '22': '정류소 명 또는 번호는 2자리 이상 입력하세요',
  '23': '버스 도착 정보가 존재하지 않습니다.',
  '31': '존재하지 않는 출발 정류소ID 입니다.',
  '32': '존재하지 않는 도착 정류소ID 입니다.',
  '99': 'API 서버 준비 중입니다.'
}

Bus.init = () => {
  this._key = config.get('api_key')
  console.log(timeStamp() + 'API Key loaded'.cyan)
}

Bus.getStation = function (keyword) {
  return new Promise((resolve, reject) => {
    const url = this._station + this._key + '&keyword=' + encodeURIComponent(keyword)

    request(url, (err, res, body) => {
      if (err) {
        reject(err)
      }

      const station = []
      const $ = cheerio.load(body)

      if ($('resultCode').text() === '0') {
        $('busStationList').each(function () {
          const name = $(this).find('stationName').text()
          const id = $(this).find('stationId').text()
          station.push({ name, id })
        })

        if (station.length > 6) {
          reject(new Error('검색된 정류장이 너무 많습니다.\n' +
                '더 자세한 키워드를 입력해주세요\n\n검색된 정류장 수: ' +
                station.length))
        } else {
          resolve(station)
        }
      } else {
        reject(new Error(this._err[parseInt($('resultCode').text())]))
      }
    })
  })
}

Bus.getBus = function (stationIds = []) {
  return new Promise((resolve, reject) => {
    const baseUrl = this._bus + this._key + '&stationId='
    const works = []

    for (let station of stationIds) {
      works.push(new Promise((resolve, reject) => {
        const url = baseUrl + station.id

        request(url, (err, res, body) => {
          if (err) {
            reject(new Error('정류장에 도착할 버스를 조회하는 도중 오류가 발생하였습니다.'))
          }

          // 버스 데이터 저장 배열
          const bus = []
          const $ = cheerio.load(body)
          if ($('resultCode').text() === '0') {
            $('busArrivalList').each(function () {
              const route = $(this).find('routeId').text() // 노선 ID
              const predictTime1 = $(this).find('predictTime1').text() // 첫 번째 버스 도착시간
              const predictTime2 = $(this).find('predictTIme2').text() // 두 번째 버스 도착시간
              bus.push({
                id: route,
                station: station.name,
                time1: predictTime1,
                time2: predictTime2
              })
            })

            resolve(bus)
          } else {
            reject(new Error(this._err[parseInt($('resultCode').text())]))
          }
        })
      }))
    }

    Promise.all(works).then(result => {
      resolve(result)
    }).catch(e => {
      reject(e)
    })
  })
}

exports.getBusInfo = bus => {
  return new Promise((resolve, reject) => {
    const baseUrl = this._info + this._key + '&routeId='
    const works = []

    for (let i = 0; i < bus.length; i++) {
      for (let j = 0; j < bus[i].length; j++) {
        works.push(new Promise((resolve, reject) => {
          const tempBus = bus[i][j]
          const url = baseUrl + tempBus.id

          request(url, (err, res, body) => {
            if (err) {
              reject(new Error('버스 상세정보를 불러오던 중 오류가 발생했습니다.'))
            }
            const bus = []
            const $ = cheerio.load(body)
            if ($('resultCode').text() === '0') {
              $('busRouteInfoItem').each(function () {
                const end = $(this).find('endStationName').text() // 종점
                const number = $(this).find('routeName').text() // 버스 번호
                bus.push({
                  number: number,
                  end: end,
                  station: tempBus.station,
                  time1: tempBus.time1,
                  time2: tempBus.time
                })
              })
              resolve(bus)
            } else {
              reject(new Error(this._err[parseInt($('resultCode').text())]))
            }
          })
        }))
      }
    }

    Promise.all(works).then(busList => {
      resolve(busList)
    }).catch(e => {
      reject(e)
    })
  })
}

Bus.process = data => {
  let resultString = ''
  for (let bus of data) {
    if (bus.time1) {
      resultString += `[${bus.number}번 버스]\n${bus.station} 정류장에\n${bus.time1}분 후 도착합니다.\n다음 버스는 ${bus.time2 ? bus.time2 + '분 후 도착합니다.' : '없습니다'}\n\n\n`
    }
  }
  return resultString
}

Bus.search = async keyword => {
  try {
    let stations = await this.getStation(keyword)
    let buses = await this.getBus(stations)
    let infos = await this.getBusInfo(buses)
    return this.process(infos)
  } catch (e) {
    console.log(timeStamp() + e.message.red)
    return '버스 정보를 불러오는 중 오류가 발생했습니다.'
  }
}

module.exports = Bus
