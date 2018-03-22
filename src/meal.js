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
var set = tomorrow => {
  request($url, (err, res, body) => {
    if(err) return;
    let $date = new Date(); // 현재 시점의 날짜
    let $month = $date.getMonth() + 1; // 월
    let $day = $date.getDate(); // 일
    let $weekDay = $date.getDay() + 1; // 요일 
    let $week = Math.ceil($date.getDate() / 7); // 몇번째주

    // 내일이 이번달 마지막날보다 작거나 같은 경우 (만약 내일이 새로운 달이라면 파싱에 문제가 생길 수 있기때문)
    let $last_day = new Date($date.getYear(), $date.getMonth() + 1, 0); // 이번달의 마지막 날
    let changeTomorrow = tomorrow && $day <= $last_day.getDate(); // 함수의 tomorrow 인자가 참일경우 (내일 급식으로 변경하기)
    if(changeTomorrow) {
      $day++;
    }

    let $ = cheerio.load(body, {decodeEntities: false});
    let meal;
    let countDay = 1;
    $('tbody > tr > td').each(function(idx) {
      if($(this).text().match(/^[0-9]{1,2}/)) {
        if(countDay === $day) {
          meal = $(this).html().replace(/^<div>[0-9]{1,2}<br>\[중식\]<br>/, '').replace(/<br>/g, '\n').replace(/<\/div>$/, '');

          // 만약 파싱 데이터가 <div>25 와 같이 비정상적으로 수행되었을 때,
          // 급식이 없는 요일을 파싱하면 위와 같이 파싱 됨
          if(meal.match(/^<div/)) { 
            meal = '';
          }
        } 
        countDay++;
      }
    });
    let dateStr = `${$month}월 ${$day}일 ${$weekStr[$weekDay-1]}요일`
    if(changeTomorrow) {
      dateStr = '[내일의 급식]\n\n' + dateStr;
    }
    db.setMeal(dateStr, meal);
  });
}

// DB에 저장된 데이터 가져오기 
var get = callback => {
  db.getMeal(callback);
}

exports.set = set;
exports.get = get;