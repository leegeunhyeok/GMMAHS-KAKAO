/*
* weather.js
* 
* 기상청의 RSS를 기반으로 한 데이터를
* 서버 DB에 저장 및 제공
*
*/


var request = require('request'),
  cheerio = require('cheerio');

var db = require('./database.js');

// 소하 2동 기상청 rss 
const $url = 'http://www.weather.go.kr/wid/queryDFSRSS.jsp?zone=4121065000';

// 현재 시점의 기상청 RSS 정보 불러오기  
var set = () => {
  request($url, (err, res, body) => {
    if(err) {
      console.log(err);
      return;
    }

    var $ = cheerio.load(body);
    var pub = $('pubDate').text().replace(/^[0-9]{4}[년] /, '');
    var weather = [];

    for(let i=2; i<=4; i++) {
      let obj = {};
      let data = $(`data:nth-child(${i})`);
      obj.index = i-2;
      obj.hour = data.find('hour').text(); // 시간
      obj.temp = data.find('temp').text(); // 기온 
      obj.pty = data.find('pty').text(); // 강수형태(0: 없음, 1: 비, 2: 비/눈, 3: 눈)
      obj.pop = data.find('pop').text(); // 강수확률
      obj.wfKor = data.find('wfKor').text(); // 하늘 상태(맑음..등)
      obj.reh = data.find('reh').text(); // 습도
      obj.pub = pub;
      weather.push(obj);
    }
    db.setWeather(weather);
  });
}

// DB에 저장된 데이터 가져오기 
var get = callback => {
  db.getWeather(callback);
}

exports.get = get;
exports.set = set;