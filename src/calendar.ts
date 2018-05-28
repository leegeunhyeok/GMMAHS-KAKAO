/*
* calendar.ts
* 
* 교육청의 본교 학사일정 파싱 후 
* 서버 DB에 저장 및 제공
*
*/

import school from 'node-school-kr';
import Database from './database.js';

class Calendar {
  private $url: string = 'https://stu.goe.go.kr/sts_sci_sf00_001.do?schulCode=J100000488&schulCrseScCode=4&schulKndScCode=4'; // 교육청 학사일정
  private check: boolean; // 데이터베이스 세팅 체크(false: 미완료)
  private db: Database;
  private school: school;

  /* @constructor 
  *  @typedef {object} DB 데이터베이스 커넥션 객체
  *  @typedef {object} School 파싱 모듈 인스턴스
  */
  constructor(database: Database, school: school) {
    this.check = false;
    this.db = database;
    this.school = school;
  }

  /* @description 이번 달 학사 일정 파싱 후 저장  
  *  @return {Promise}
  */
  public async set(): Promise<any> {
    this.check = false;
    try {
      let result = await this.school.getNotice(); // 이번 달 학사일정 파싱
      await this.db.executeQuery('DELETE FROM calendar');
      for(let i=1; i <= 31; i++) {
        if(result[i]) {
          await this.db.executeQuery(`INSERT INTO calendar VALUES (${result.month}, ${i}, '${result[i]}')`);
        }
      }
    
      this.check = true;
      return {'msg': 'Calendar data changed', 'err': false};
    } catch(e) {
      return {'msg': 'Calendar data change error', 'err': true};
    }
  }

  /* @description 이번 달 학사 일정 조회
  *  @return {void}
  */
  public async get(): Promise<any> {
    if(this.check) {
      try {
        let str: string = '[이번 달 학사일정]\n\n';
        let data = await this.db.executeQuery('SELECT * FROM calendar');
        if(data.length) {
          for(let d of data) {
            str += `${d.month}월 ${d.day}일: ${d.content}\n`;
          }
        } else {
          str += '학사일정이 없습니다.';
        }
        return {'msg': str, 'reset': false};
      } catch(e) {
        return {'msg': '데이터베이스 오류', 'reset': true};
      }
    } else {
      return {'msg': '일정 데이터를 불러오고 있습니다.\n잠시 후 다시 시도해주세요', 'reset': true};
    }
  }
}

export default Calendar;