/*
* meal.js
* 
* 교육청의 본교 급식 데이터를 파싱하여
* 서버 DB에 저장 및 제공
*
*/

var request = require('request'),
  cheerio = require('cheerio');

var db = require('./database.js');

// 광명경영회계고등학교의 이번달 급식정보 (교육청)
const $url = 'https://stu.goe.go.kr/sts_sci_md00_001.do?schulCode=J100000488&schulCrseScCode=4&schulKndScCode=4';
const $weekStr = ['일', '월', '화', '수', '목', '금', '토'];

// 현재 시점의 급식정보 파싱 
var set = () => {
  request($url, (err, res, body) => {
    if(err) return;
    let $date = new Date(); // 현재 시점의 날짜
    let $month = $date.getMonth() + 1; // 월
    let $day = $date.getDate(); // 일
    let $weekDay = $date.getDay() + 1; // 요일 
    let $week = Math.ceil($date.getDate() / 7); // 몇번째주

    let $ = cheerio.load(body, {decodeEntities: false});
    //let meal = $(`tbody:nth-child(${$week}) > td:nth-child(${$weekDay})`); // 오늘의 급식 파싱 
    //meal = meal.text().replace(/\.*[0-9]/g, '').replace(/\./g, '\n').replace(']', ']\n'); // 불필요한 문자 삭제 및 가공 
    let meal;
    let countDay = 1;
    $('tbody > tr > td').each(function(idx) {
      if($(this).text().match(/^[0-9]{1,2}/)) {
        if(countDay === $day) {
          meal = $(this).html().replace(/<div>[0-9]{1,2}<br>\[중식\]<br>/, '').replace(/<br>/g, '\n').replace(/<\/div>$/, '');
        } 
        countDay++;
      }
    });
    let dateStr = `${$month}월 ${$day}일 ${$weekStr[$weekDay-1]}요일`
    db.setMeal(dateStr, meal);
  });
}

// DB에 저장된 데이터 가져오기 
var get = callback => {
  db.getMeal(callback);
}

exports.set = set;
exports.get = get;