/*
* timetable.js
* 
* 컴시간알리미 시간표 사이트 파싱
*
*/

const request = require('request');

const db = require('./database.js');

// 00 포맷으로 변경 
const fillZero = (data) => {
  var str = data.toString();
  return str.length === 1 ? '0' + str : str;
}

// 데이터 저장 상태 
var status = false;

// 시간표 데이터를 DB에 저장
const set = async () => {
  status = false;
  let data = await new Promise((resolve, reject) => {
    request('http://comcigan.com:4081/_hourdata?sc=13209', (err, res, body) => {
      if(err) {
        reject(err);
      }
      let data = body.substr(0, body.lastIndexOf('}') + 1);
      resolve(JSON.parse(data));
    });
  });

  let class_count = data['학급수'];
  let teacher = data['성명'];
  let subject = data['긴과목명'];
  let save_date = data['저장일'];
  let time_table = data['시간표'];
  let time = data['요일별시수'];
  
  await db.executeQuery('DELETE FROM timetable');
  var sql = 'INSERT INTO timetable VALUES ';
  for(let grade=1; grade<=3; grade++) { // 1 ~ 3 학년 
    for(let class_=1; class_<=class_count[grade]; class_++) { // 해당 학년의 반 수
      let temp_time_table = time_table[grade][class_]; // *학년 *반의 시간표 임시 저장
      for(let weekday=1; weekday<=5; weekday++) { // 월(1) ~ 금(5)
        for(let t=1; t<=time[grade][weekday]; t++) { // 1 ~ n교시
          let code = temp_time_table[weekday][t].toString();
          let techer_code;
          let subject_code;
          
          if(code.length == 3) {
            techer_code = parseInt(fillZero(code.substr(0, 1)));
            subject_code = parseInt(fillZero(code.substr(1, 2)));
          } else {
            techer_code = parseInt(fillZero(code.substr(0, 2)));
            subject_code = parseInt(fillZero(code.substr(2, 2)));
          }
          sql += `(${grade}, ${class_}, ${weekday}, ${t}, ${code}, '${teacher[techer_code]}', '${subject[subject_code].replace(/_/g, '')}'), `;
        }
      }
    }
  }
  await db.executeQuery(sql.slice(0, -2));
  console.log('Timetable data changed');
  status = true;
}

// grade학년 class_반의 weekday(1: 월 ~ 5: 금)요일 시간표
const get = async (grade, class_, weekday) => {
  var str = '';
  if(status) {
    const weekdayStr = ['일', '월', '화', '수', '목', '금', '토'];
    str = `${grade}학년 ${class_}반 ${weekdayStr[weekday]}요일 시간표\n\n`;
    try {
      let sql = `SELECT subject, teacher FROM timetable WHERE grade=${grade} AND class=${class_} AND weekday=${weekday}`;
      let result = await db.executeQuery(sql);
      if(result.length === 0) {
        str += '시간표 데이터가 없습니다.';
      } else {
        result.forEach((i, idx) => {
          str += `[${idx+1}교시]\n${i.subject} (${i.teacher})\n\n`;
        });
      }
    } catch(e) {
      str = '시간표를 불러오는 중 문제가 발생하였습니다.';
      console.log(e);
    }
  } else {
    str = '시간표 데이터를 불러오고 있습니다.\n잠시 후 다시 시도해주세요';
    set();
  }
  return str;
}

exports.set = set;
exports.get = get;