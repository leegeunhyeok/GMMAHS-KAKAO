/*
* timetable.ts
* 
* 컴시간알리미 시간표 사이트 파싱
*
*/

import * as request from 'request';

class Timetable {
  private status: boolean = false;
  private db: any;

  /* @constructor */
  constructor(database: any) {
    this.db = database;
  }

  /* @description 00 형식으로 변환 후 문자열 반환
  *  @param {any} 변환할 데이터 
  *  @return {string}
  */
  private fillZero(data: any): string {
    let str: string = data.toString();
    return str.length === 1 ? '0' + str : str;
  }
  
  /* @description 시간표 데이터 파싱 후 데이터 저장
  *  @return {Promise}
  */
  public async set(): Promise<any> {
    this.status = false;
    let data: any = await new Promise((resolve, reject) => {
      request('http://comcigan.com:4083/124246?NjE0OF8xMzIwOV8xXzA', (err, res, body) => {
        if(err) {
          reject(err);
        }
        try {
          let data: string = body.substr(0, body.lastIndexOf('}') + 1);
          resolve(JSON.parse(data)); 
        } catch(e) { // JSON 파싱 도중 예외가 발생할수도 있음
          reject(e);
        }
      });
    });

    let class_count: Array<number> = data['학급수'];
    let teacher: Array<string> = data['성명'];
    let subject: Array<string> = data['긴과목명'];
    let time_table: Array<any> = data['시간표'];
    let time: Array<any> = data['요일별시수'];
    await this.db.executeQuery('DELETE FROM timetable');
    var sql: string = 'INSERT INTO timetable VALUES ';
    for(let grade=1; grade<=3; grade++) { // 1 ~ 3 학년 
      for(let class_=1; class_<=class_count[grade]; class_++) { // 해당 학년의 반 수
        let temp_time_table = time_table[grade][class_]; // *학년 *반의 시간표 임시 저장
        for(let weekday=1; weekday<=5; weekday++) { // 월(1) ~ 금(5)
          for(let t=1; t<=time[grade][weekday]; t++) { // 1 ~ n교시
            let code: string = temp_time_table[weekday][t].toString();
            let techer_code: number;
            let subject_code: number;
            
            if(code.length == 3) {
              techer_code = parseInt(this.fillZero(code.substr(0, 1)));
              subject_code = parseInt(this.fillZero(code.substr(1, 2)));
            } else {
              techer_code = parseInt(this.fillZero(code.substr(0, 2)));
              subject_code = parseInt(this.fillZero(code.substr(2, 2)));
            }
            sql += `(${grade}, ${class_}, ${weekday}, ${t}, ${code}, '${teacher[techer_code]}', '${subject[subject_code].replace(/_/g, '')}'), `;
          }
        }
      }
    }
    await this.db.executeQuery(sql.slice(0, -2));
    this.status = true;
    return 'Timetable data changed';
  }

  /* @description 해당 학급의 데이터 조회
  *  @param {any} 학년 값
  *  @param {any} 반 값
  *  @param {any} 요일 값
  *  @return {Promise}
  */
  public async get(grade: any, class_: any, weekday: any): Promise<any> {
    var str: string = '';
    if(status) {
      const weekdayStr: Array<string> = ['일', '월', '화', '수', '목', '금', '토'];
      str = `${grade}학년 ${class_}반 ${weekdayStr[weekday]}요일 시간표\n\n`;
      try {
        let sql: string = `SELECT subject, teacher FROM timetable WHERE grade=${grade} AND class=${class_} AND weekday=${weekday}`;
        let result: any = await this.db.executeQuery(sql);
        if(result.length === 0) {
          str += '시간표 데이터가 없습니다.';
        } else {
          result.forEach((i: any, idx: number) => {
            str += `[${idx+1}교시]\n${i.subject} (${i.teacher})\n\n`;
          });
        }
      } catch(e) {
        str = '시간표를 불러오는 중 문제가 발생하였습니다.';
      }
    } else {
      str = '시간표 데이터를 불러오고 있습니다.\n잠시 후 다시 시도해주세요\n\n문제가 지속될 경우 문의해주세요';
      this.set();
    }
    return str;
  }
}

export default Timetable;