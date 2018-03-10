/*
* 경기도 버스 정보 Open API 이용
* 
* 키 발급: https://www.data.go.kr
* 경기도 버스 정보: http://gbis.go.kr
* 
* 사용중인 API 
* - 버스 도착 정보 조회 서비스
* - 정류소 조회 서비스 (정류소 검색)
* - 버스 노선 조회 서비스 (버스 정보)
*
*/

var request = require('request'),
  cheerio = require('cheerio');

// 정류장 조회 EndPoint
const $station = 'http://openapi.gbis.go.kr/ws/rest/busstationservice?serviceKey='; 

// stationId 의 정류장에 오는 버스 조회 
const $bus = 'http://openapi.gbis.go.kr/ws/rest/busarrivalservice/station?serviceKey=';

// 해당 노선의 정보 조회
const $route = 'http://openapi.gbis.go.kr/ws/rest/busrouteservice/info?serviceKey=';

// 버스 정보 조회 
const $info = 'http://openapi.gbis.go.kr/ws/rest/busrouteservice/info?serviceKey=';

// Open API Key
const $KEY = 'API_KEY';

// 입력한 텍스트를 기반으로 광명에 위치한 정류장을 조회 
var getStation = str => {
  return new Promise((resolve, reject) => { // 동기 작업을 위해 프라미스 생성 
    var url = $station + $KEY + '&keyword=' + encodeURIComponent(str);
    request(url, (err, res, body) => {
      if(err) {
        console.log(err);
        reject(err);
      }
      var station = [];
      var $ = cheerio.load(body);
      console.log('[' + $('queryTime').text() + '기준]');
      $('busStationList').each(function(idx) {
        if($(this).find('regionName').text().indexOf('광명') !== -1) { // 지역이 광명인 정류장만 추출 
          let name = $(this).find('stationName').text();
          let id = $(this).find('stationId').text();
          station.push({name: name, id: id});
        }
      });

      if(station.length === 0) {
        reject('해당 정류장을 찾을 수 없습니다\n다시 입력해주세요');
      } else if(station.length > 6) {
        reject('검색된 정류장이 너무 많습니다\n더 자세하게 입력해주세요');
      } else {
        resolve(station);
      }
    });
  }); 
}

// 해당 정류장에 도착할 예정인 버스 조회
var getBus = stationId => {
  return new Promise((resolve, reject) => {
    var baseUrl = $bus + $KEY + '&stationId='; 
    var $buslist = [];
    var promise = [];
    for(let i=0; i<stationId.length; i++) {
      promise[i] = new Promise((resolve, reject) => {
        let url = baseUrl + stationId[i].id;
        request(url, (err, res, body) => {
          if(err) {
            console.log(err);
            resolve();
          }
          var bus = [];
          var $ = cheerio.load(body);
          $('busArrivalList').each(function(idx) {
            let route = $(this).find('routeId').text();
            let predictTime1 = $(this).find('predictTime1').text(); // 첫 번째 버스 도착시간
            let predictTime2 = $(this).find('predictTIme2').text(); // 두 번째 버스 도착시간
            bus.push({id: route, station: stationId[i].name, time1: predictTime1, time2: predictTime2});
          });
          resolve(bus);
        });
      });
    }
    Promise.all(promise).then(value => {
      resolve(value);
    });
  });
}

var getBusInfo = bus => {
  var baseUrl = $info + $KEY + '&routeId=';
  return new Promise((reject, resolve) => {
    var $buslist = [];
    var $promise = [];
    var idx = 0;
    for(let i=0; i<bus.length; i++) {
      for(let j=0; j<bus[i].length; j++) {
        $promise[idx++] = new Promise((resolve, reject) => {
          var tempBus = bus[i][j];
          var url = baseUrl + tempBus.id;
          request(url, (err, res, body) => {
            if(err) {
              console.log(err);
              resolve();
            }
            var bus = [];
            var $ = cheerio.load(body);
            $('busRouteInfoItem').each(function(idx) {
              let end = $(this).find('endStationName').text(); // 종점 
              let number = $(this).find('routeName').text(); // 버스 번호 
              bus.push({number: number, end: end, station: tempBus.station, time1: tempBus.time1, time2: tempBus.time2});
            });
            resolve(bus);
          });
        }).then(result => {
          $buslist = $buslist.concat(result);
        });
      }
    }

    Promise.all($promise).then(bus => {
      resolve($buslist);
    });
  }); 
}

var search = (str, callback) => {
  getStation(str).then(station => {
    return getBus(station);
  }).then(result => {
    return getBusInfo(result);
  }).then(bus => {
    callback(bus)
  }).catch(err => {
    callback(err);
  });
}

exports.search = search;