/*
* meal.ts
* 
* 교육청의 본교 급식 데이터를 파싱하여
* 서버 DB에 저장 및 제공
*
*/

import * as request from 'request';
import * as cheerio from 'cheerio';

class Meal {
  private $url: string = 'https://stu.goe.go.kr/sts_sci_md00_001.do?schulCode=J100000488&schulCrseScCode=4&schulKndScCode=4';
  private $weekStr: Array<string> = ['일', '월', '화', '수', '목', '금', '토'];
  private db: any = null;
  
  constructor(database: any) {
    this.db = database;
  }

  public async set(tomorrow: boolean): Promise<any> {
    try {
      let $body: any = await new Promise((resolve, reject) => {
        request(this.$url, (err, res, body) => {
          if(err) {
            reject(err);
          }
          resolve(body);
        });
      });
  
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
  
        // 내일의 요일 
        if($weekDay+1 > 6) {
          $weekDay = 0;
        } else {
          $weekDay++;
        }
      }
      let $: cheerio = cheerio.load($body, {decodeEntities: false});
      let meal: string;
      let countDay: number = 1;
  
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
  
      let dateStr: string = `${$month}월 ${$day}일 ${this.$weekStr[$weekDay]}요일`
      if(changeTomorrow) {
        dateStr = '[내일의 급식]\n\n' + dateStr;
      }
  
      await this.db.executeQuery("DELETE FROM meal");
      await this.db.executeQuery(`INSERT INTO meal VALUES ('${dateStr}', '${meal}')`);
      return 'Meal data changed';
    } catch(e) {
      return e;
    }
  }

  public async get(callback: Function): Promise<any> {
    if(this.db) {
      try {
        let rows: any = await this.db.executeQuery('SELECT * FROM meal');
        if(rows.length) {
          let info: string = rows[0].info ? rows[0].info : '급식이 없습니다.';
          callback(rows[0].date + '\n\n' + info, false);
        } else {
          callback('급식 데이터를 불러오고 있습니다.\n잠시 후 다시 시도해주세요', true);
        }
      } catch(e) {
        callback('데이터베이스 오류', false);
      }
    } else {
      callback('데이터베이스 커넥션이 존재하지 않습니다.', false);
    }
  }
}

export default Meal;