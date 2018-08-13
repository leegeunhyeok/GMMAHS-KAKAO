/*
* meal.ts
* 
* 교육청의 본교 급식 데이터를 파싱하여
* 서버 DB에 저장 및 제공
*
*/

import school from 'node-school-kr';
import Database from './database.js';

class Meal {
  private $url: string = 'https://stu.goe.go.kr/sts_sci_md00_001.do?schulCode=J100000488&schulCrseScCode=4&schulKndScCode=4';
  private $weekStr: Array<string> = ['일', '월', '화', '수', '목', '금', '토'];
  private db: Database;
  private school: school;
  
  /* @constructor 
  *  @typedef {object} Database 데이터베이스 커넥션 객체
  *  @typedef {object} School 파싱 모듈 인스턴스
  */
  constructor(database: Database, school: school) {
    this.db = database;
    this.school = school;
  }

  /* @description 급식 데이터 파싱 후 저장
  *  @return {Promise}
  */
  public async set(tomorrow: boolean): Promise<any> {
    try {
      let result = await this.school.getMeal();
  
      let $date: any = new Date(); // 현재 시점의 날짜
      let $month: number = $date.getMonth() + 1; // 월
      let $day: number = $date.getDate(); // 일
      let $weekDay: number = $date.getDay(); // 요일 
      let $week: number = Math.ceil($date.getDate() / 7); // 몇번째주
  
      // 내일이 이번달 마지막날보다 작거나 같은 경우 (만약 내일이 새로운 달이라면 파싱에 문제가 생길 수 있기때문)
      let $last_day: Date = new Date($date.getYear(), $date.getMonth() + 1, 0); // 이번달의 마지막 날
      let changeTomorrow: boolean = tomorrow && $day+1 <= $last_day.getDate(); // 함수의 tomorrow 인자가 참일경우 (내일 급식으로 변경하기)
      if(changeTomorrow) {
        // 내일 
        $day++;
  
        // 내일의 요일 (범위 초과 시 다시 처음 요일로)
        if($weekDay+1 > 6) {
          $weekDay = 0;
        } else {
          $weekDay++;
        }
      }
  
      let dateStr: string = `${$month}월 ${$day}일 ${this.$weekStr[$weekDay]}요일`
      if(changeTomorrow) {
        dateStr = '[내일의 급식]\n\n' + dateStr;
      }
  
      await this.db.executeQuery("DELETE FROM meal");
      await this.db.executeQuery(`INSERT INTO meal VALUES ('${dateStr}', '${result[$day]}')`);
      return {'msg': 'Meal data changed', 'err': false};
    } catch(e) {
      return {'msg': 'Meal data set error: ' + e, 'err': true};
    }
  }

  /* @description 날씨 데이터 파싱 후 저장
  *  @return {Promise}
  */
  public async get(): Promise<any> {
    if(this.db) {
      try {
        let rows: any = await this.db.executeQuery('SELECT * FROM meal');
        if(rows.length) {
          let info: string = rows[0].info ? rows[0].info : '급식이 없습니다.';
          return {'msg': rows[0].date + '\n\n' + info, 'reset': false};
        } else {
          return {'msg': '급식 데이터를 불러오고 있습니다.\n잠시 후 다시 시도해주세요', 'reset': true};
        }
      } catch(e) {
        return {'msg': '데이터베이스 오류', 'reset': true};
      }
    } else {
      return {'msg': '데이터베이스 커넥션이 존재하지 않습니다.', 'reset': false};
    }
  }
}

export default Meal;