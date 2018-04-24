/*
* calendar.ts
* 
* 교육청의 본교 학사일정 파싱 후 
* 서버 DB에 저장 및 제공
*
*/

import * as request from 'request';
import * as cheerio from 'cheerio';

class Calendar {
  private $url: string = 'https://stu.goe.go.kr/sts_sci_sf00_001.do?schulCode=J100000488&schulCrseScCode=4&schulKndScCode=4'; // 교육청 학사일정
  private db: any;

  /* @constructor */
  constructor(database: any) {
    this.db = database;
  }

  /* @description 이번 달 학사 일정 파싱 후 저장  
  *  @return {void}
  */
  public async set(): Promise<any> {
    try {
      let $body: any = await new Promise((resolve, reject) => {
        request(this.$url, (err, res, body) => {
          if(err) {
            reject(err);
          }
          resolve(body);
        });
      });
    
      let $: cheerio = cheerio.load($body, {decodeEntities: false});
      let head: Array<number> = [];
      let $month: number = new Date().getMonth() + 1; // 이번달 
      $('thead > tr > th').each(function(idx) {
        head.push(parseInt($(this).text().replace('월', '')));
      });
    
      // 기존 데이터 지우기(비동기)
      await this.db.executeQuery('DELETE FROM calendar'); 
    
      $('tbody > tr').each(function(idx: number) {
        let day: string = $(this).find('th').text().trim();
        let month_count: number = head[1];
        // 해당 콜백 함수 내에서 db 비동기 작업을 해야 하므로 async 함수로 선언
        $(this).find('td.textL').each(async function(idx: number) {  
          let str: string = ''; // 학사일정 string 임시 저장 변수 
          $(this).find('span').each(function(idx: number) {
            str += $(this).text().trim() + ','; // 불필요한 공백문자 제거 및 구문문자(,) 추가
          });
          str = str.slice(0, -1); // 마지막 , 문자 제거 
    
          // 비어있거나 토요휴업일인 일정은 제외
          if($month === month_count && str && str !== '토요휴업일') { 
            await this.db.executeQuery(`INSERT INTO calendar VALUES (${$month}, ${parseInt(day)}, '${str}')`);
          }
          month_count++;
        });
      });
      return 'Calendar data changed';
    } catch(e) {
      console.log(e);
      return e;
    }
  }

  /* @description 이번 달 학사 일정 조회
  *  @return {void}
  */
  public async get(): Promise<any> {
    try {
      let str: string = '[이번 달 학사일정]\n\n';
      let data = await this.db.executeQuery('SELECT * FROM calendar');
      if(data.length) {
        for(let i=0; i<data.length; i++) {
          str += `${data.month}월 ${data.day}일: ${data.content}\n`;
        }
      } else {
        str += '일정이 없습니다';
      }
      return str;
    } catch(e) {
      return '데이터베이스 오류';
    }
  }
}

export default Calendar;