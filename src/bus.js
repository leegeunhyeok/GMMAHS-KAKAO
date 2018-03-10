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

// 버스도착시간 조회 EndPoint
const $bus = 'http://openapi.gbis.go.kr/ws/rest/busarrivalservice?serviceKey=';

// Open API Key
const $KEY = 'YOUR_KEY';

// 입력한 텍스트를 기반으로 광명에 위치한 정류장을 조회 
var getStation = (str, callback) => {
  var url = $station + $KEY + '&keyword=' + encodeURIComponent(str);
  console.log(url);
  request(url, (err, res, body) => {
    if(err) {
      console.log(err);
      return;
    }
    var $ = cheerio.load(body);
    console.log('[' + $('queryTime').text() + '기준]');
    $('busStationList').each(function(idx) {
      if($(this).find('regionName').text() === '광명') { // 지역이 광명인 정류장만 추출 
        console.log($(this).find('stationName').text() + ' / ' + $(this).find('stationId').text());
      }
    });
  });
}

var getBus = (str) => {

}

getStation('하안');