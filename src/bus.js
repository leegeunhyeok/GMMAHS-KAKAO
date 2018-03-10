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
const $KEY = 'ueetzd6IwyycNhCcWK4ROb%2FguB7qnp0Wc6iJQFl4mZH9%2Fp7KFBMhv8YZGuRfN8expGwaMnXxhzGAaEqmQuIMjw%3D%3D';

// 입력한 텍스트를 기반으로 광명에 위치한 정류장을 조회 
var getStation = str => {
  return new Promise((resolve, reject) => { // 동기 작업을 위해 프라미스 생성 
    // OpenAPI 접속 URL
    var url = $station + $KEY + '&keyword=' + encodeURIComponent(str);

    // XML 내려받기 
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
    // OpenAPI 접속 URL
    var baseUrl = $bus + $KEY + '&stationId='; 

    // 도착할 버스 목록 조회
    var $buslist = []; 
    
    // 프라미스 저장 배열 
    var $promise = [];

    for(let i=0; i<stationId.length; i++) {
      $promise[i] = new Promise((resolve, reject) => {
        let url = baseUrl + stationId[i].id;

        // XML 내려받기 
        request(url, (err, res, body) => {
          if(err) {
            console.log(err);
            resolve();
          }

          // 버스 데이터 저장 배열 
          var bus = [];
          var $ = cheerio.load(body);
          $('busArrivalList').each(function(idx) {
            let route = $(this).find('routeId').text(); // 노선 ID
            let predictTime1 = $(this).find('predictTime1').text(); // 첫 번째 버스 도착시간
            let predictTime2 = $(this).find('predictTIme2').text(); // 두 번째 버스 도착시간
            bus.push({id: route, station: stationId[i].name, time1: predictTime1, time2: predictTime2});
          });
          resolve(bus);
        });
      });
    }

    // 생성된 프라미스 모두 동기작업 
    Promise.all($promise).then(value => {
      // 완료된 데이터 resolve 데이터로 전달
      resolve(value);
    });
  });
}

// 버스에 대한 세부 정보 조회 
var getBusInfo = bus => {
  var baseUrl = $info + $KEY + '&routeId=';
  return new Promise((reject, resolve) => {
    // 버스 정보 배열 
    var $buslist = []; 

    // 프라미스 저장 배열 
    var $promise = []; 

    // 프라미스 배열 전용 인덱스 
    var idx = 0; 
    for(let i=0; i<bus.length; i++) {
      for(let j=0; j<bus[i].length; j++) {

        // 프라미스 생성 및 저장 
        $promise[idx++] = new Promise((resolve, reject) => {
          // 버스 데이터 임시로 배열에 저장 
          var tempBus = bus[i][j]; 

          // 접속할 API URL
          var url = baseUrl + tempBus.id;

          // XML 불러오기 
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
              // 버스번호, 종점, 정류장이름, 첫버스 도착시간, 두번째버스 도착시간
            });
            resolve(bus);
          });
        }).then(result => {
          // 배열에 누적 
          $buslist = $buslist.concat(result);
        });
      }
    }

    // 모든 프라미스 동기 작업
    Promise.all($promise).then(bus => {
      resolve($buslist);
    });
  }); 
}

// 해당 버스정류장의 버스정보를 조회하여 제공 
var search = (str, callback) => {
  // 키워드에 대한 버스정류장 검색
  getStation(str).then(station => {
    // 버스정류장에 오는 버스 목록 조회 
    return getBus(station);
  }).then(result => {
    // 버스 목록에 대한 세부 정보 조회 
    return getBusInfo(result);
  }).then(bus => {
    callback(bus);
  }).catch(err => {
    callback(err);
  });
}

exports.search = search;