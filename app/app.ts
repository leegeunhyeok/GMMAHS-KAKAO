/*
* GMMAHS-KAKAO
* 
* ### TypeScript ###
* 
* - 광명경영회계고등학교 카카오톡 플러스친구 API 서버
* - 데이터베이스: MariaDB
* - 급식정보 제공
* - 버스정보 제공
* - 날씨정보 제공 
* 
* 개발자 : 이근혁
* Github: Leegeunhyeok
* Link: https://github.com/Leegeunhyeok/GMMAHS-KAKAO
*
* MIT license
* 
*/

import * as express from 'express'; 
import * as fs from 'fs'; 
import * as http from 'http'; 
import * as bodyParser from 'body-parser'; // HTML Body 데이터 읽기(POST)
import * as cheerio from 'cheerio'; // HTML 파싱
import * as schedule from 'node-schedule'; // 스케쥴러 
import * as school from 'node-school-kr'; // 학교 급식, 학사일정 파싱
//import * as admin from '../admin/admin.js'; // 관리자 페이지 라우팅 경로
import Weather from '../src/weather.js'; // 날씨 RSS 파싱 모듈
import Timetable from '../src/timetable.js'; // 시간표 파싱 모듈
import Meal from '../src/meal.js'; // 급식 데이터 파싱 모듈
import Calendar from '../src/calendar.js'; // 학교 일정 파싱 모듈 
import Bus from '../src/bus.js'; // 버스 정보 모듈 
import Database from '../src/database.js'; // 데이터베이스 작업 모듈
import Statistics from '../src/statistics.js'; // 통계 모듈
/*

// DialogFlow 모듈 (2018-04-01 사용 중단, 추후에 사용할 수 있음)
import DialogFlow from '../src/dialogflow.js';

*/

const $main: any = {
  'type': 'buttons',
  'buttons': ['급식', '시간표', '학사일정', '날씨', '버스', '통계', '정보']
};

const $buttons: Array<string> = [
  '급식', 
  '시간표',
  '학사일정',
  '날씨', 
  '버스',
  '통계',
  '정보'
];

// express 서버 클래스 
class App {
  private app: express.Application;
  private router: express.Router;
  private db: Database;
  private school: school;
  private port: number;
  private meal: Meal;
  private calendar: Calendar;
  private timetable: Timetable;
  private weather: Weather;
  private bus: Bus;
  private statistics: Statistics;
  private level: any = [
    ['[debug]', '\x1b[37m'], // White 0
    ['[info]', '\x1b[32m'], // Green 1 
    ['[notice]', '\x1b[36m'], // Cyan 2
    ['[warning]', '\x1b[33m'], // Yellow 3
    ['[error]', '\x1b[31m'], // Red 4
    ['[danger]', '\x1b[31m'] // Red 5
  ]

  /* @constructor */
  constructor() {
    this.app = express();
    this.school = new school();
    this.logger('Created express object', 1);
  }

  /* @description length에 해당하는 길이만큼 0을 채워서 반환
  *  @param {number} 포맷 변경할 숫자 데이터  
  *  @param {number} 포맷 길이 
  *  @return {string}
  */ 
  public zeroFormat(number: number, length: number): string {
    let zero: string = '';
    let n :string = number.toString();
    if (n.length < length) {
      for (let i=0; i<length-n.length; i++)
        zero += '0';
    }
    return zero + n;
  }

  /* @description yyyy-MM-dd HH:mm:ss.SSS 형식 문자열 생성
  *  @return {string}
  */ 
  public timeFormatter(): string {
    const $date: Date = new Date();
    let str: string = this.zeroFormat($date.getFullYear(), 4) + '-' +
    this.zeroFormat($date.getMonth() + 1, 2) + '-' +
    this.zeroFormat($date.getDate(), 2) + ' ' +
    this.zeroFormat($date.getHours(), 2) + ':' +
    this.zeroFormat($date.getMinutes(), 2) + ':' +
    this.zeroFormat($date.getSeconds(), 2) + '.' +
    this.zeroFormat($date.getMilliseconds(), 3);
    return str;
  }

  /* @description 콘솔에 현재 시간과 메시지 출력
  *  @param {string} 출력할 메시지
  *  @return {void}
  */ 
  public logger(msg: string, level: number): void {
    let lv: Array<string>;
    if(this.level[level] === undefined) {
      lv = this.level[1];
    } else {
      lv = this.level[level];
    }
    console.log(this.timeFormatter(), lv[1], lv[0], '\x1b[0m', msg);
  }

  /* @description Express 라우팅 설정
  *  @return {void}
  */ 
  private initRouter(): void {
    // 익스프레스 라우터 객체 
    let router = express.Router(); 

    // 관리자 전용 페이지 
    router.route(admin.getRoute()).get((req: express.Request, res: express.Response): void => {
      fs.readFile('./static/admin.html', (err, data) => {
        if(err) {
          console.log(err);
          res.writeHead(200, {'Content-Type': 'text/html'});
          res.write(err.toString());
          res.end();
          return;
        }
        res.writeHead(200, {'Content-Type': 'text/html'});
        res.write(data);
        res.end();
      });
    });

    // 데이터 삭제 
    router.route('/clear').post(async (req: express.Request, res: express.Response): Promise<any> => {
      try {
        await this.db.executeQuery('DELETE FROM meal');
        await this.db.executeQuery('DELETE FROM calendar');
        await this.db.executeQuery('DELETE FROM timetable');
        await this.db.executeQuery('DELETE FROM weather');
        await this.statistics.reset();
        await this.statistics.addFirstData();
        res.json({'msg':'Success'});
      } catch(e) {
        res.json({'msg':'Fail'});
      }
    });

    // 플러스친구 추가 시 보여줄 버튼 목록
    router.route('/keyboard').get((req: express.Request, res: express.Response): void => { 
      res.json($main);
    });

    // 사용자가 메시지를 전송하면 응답 
    router.route('/message').post(async (req: express.Request, res: express.Response): Promise<any> => {
      // 사용자가 입력한 텍스트 데이터 
      const $content: any = req.body.content; 

      // 사용자 식별 키
      const $user_key: any = req.body.user_key;

      // 텍스트에 따라 적절한 응답하기
      if($content === '처음으로') {
        res.json({
          'message': {
            'text': '다양한 기능을 이용해보세요!'
          },
          'keyboard': {
            'type': 'buttons',
            'buttons': $buttons
          }
        });
      } else if($content === '급식') {
        await this.db.executeQuery('UPDATE statistics SET meal = meal + 1');
        this.meal.get().then((result: any) => {
          res.json({
            'message': {
              'text': result.msg,
              'message_button': {
                'label': '이번달 급식 확인하기',
                'url': 'http://www.gmma.hs.kr/wah/main/schoolmeal/calendar.htm?menuCode=102'
              }
            },
            'keyboard': {
              'type': 'buttons',
              'buttons': $buttons
            }
          });
          
          if(result.reset) {
            this.meal.set(false).then((result: any) => {
              this.logger(result.msg, result.err ? 4 : 1);
            });
          }
        });
      } else if($content === '시간표') {
        await this.db.executeQuery('UPDATE statistics SET timetable = timetable + 1');
        res.json({
          'message': {
            'text': '시간표 형식을 아래와 같이\n입력해주세요!\n\n' + 
            '"학년-반 요일"\n\n[예시] 1-1 월\n\n\n' + 
            '취소하고싶으시면 [처음으로]를\n입력해주세요!'
          }
        });
      } else if($content === '학사일정') {
        await this.db.executeQuery('UPDATE statistics SET calendar = calendar + 1');
        this.calendar.get().then((result: any) => {
          res.json({
            'message': {
              'text': result.msg
            },
            'keyboard': {
              'type': 'buttons',
              'buttons': $buttons
            }
          });

          if(result.reset) {
            this.calendar.set().then((result: any) => {
              this.logger(result.msg, result.err ? 4 : 1);
            });
          }
        });
      } else if($content === '날씨') {
        await this.db.executeQuery('UPDATE statistics SET weather = weather + 1');
        this.weather.get().then((result: any) => {
          res.json({
            'message': {
              'text': result.msg
            },
            'keyboard': {
              'type': 'buttons',
              'buttons': $buttons
            }
          });

          if(result.reset) {
            this.weather.set().then((result: any) => {
              this.logger(result.msg, result.err ? 4 : 1);
            });
          }
        });
      } else if($content === '버스') {
        await this.db.executeQuery('UPDATE statistics SET bus = bus + 1');
        res.json({
          'message': {
            'text': '버스정류장 이름을 아래와 같이\n입력해주세요!\n\n' + 
            '"정류장 정류장이름"\n\n[예시] 정류장 하안사거리\n\n\n' +
            '취소하고싶으시면 [처음으로]를\n입력해주세요!'
          }
        });
      } else if($content === '통계') {
        await this.db.executeQuery('UPDATE statistics SET other = other + 1');
        let result = await this.statistics.getStatistics();
        res.json({
          'message': {
            'text': '여러분들이 사용하는 메뉴들의\n사용량 통계입니다!\n\n' + result + '\n기간: 서버 가동 후 ~ 현재'
          },
          'keyboard': {
            'type': 'buttons',
            'buttons': ['처음으로']
          }
        });
      } else if($content === '정보') {
        await this.db.executeQuery('UPDATE statistics SET other = other + 1');
        res.json({
          'message': {
            'text': '광명경영회계고등학교 정보제공\n서비스입니다!\n\n' +
            '기능 및 오류 신고는\n아래에 문의해주세요~\n\n> 챗봇에서 상담원으로 전환하기\n\n> lghlove0509@naver.com\n\n' +
            '> 010-4096-4475\n\n' +
            '본 서비스는 오픈소스로 Github에 모두 공개되어있으며 MIT 라이센스를 적용하고 있습니다!\n\n' + 
            'Server: Node.js\nDB: MariaDB',
            'message_button': {
              'label': '소스코드',
              'url': 'https://github.com/leegeunhyeok/GMMAHS-KAKAO'
            }
          },
          'keyboard': {
            'type': 'buttons',
            'buttons': ['개발자', '처음으로']
          }
        });
      } else if($content === '개발자') {
        res.json({
          'message': {
            'text': '[개발자 정보]\n\n' +
            '개발자: 이근혁(3-8)\n이메일: lghlove0509@naver.com\n깃허브: Leegeunhyeok'
          },
          'keyboard': {
            'type': 'buttons',
            'buttons': ['블로그', '처음으로']
          }
        });
      } else if($content === '블로그') {
        res.json({
          'message': {
            'text': '[개발자 블로그]\n\n개발자의 개인 블로그입니다!\n다양한 글과 작품이 올라와있습니다~!\n\n' +
            '다음 티스토리\nhttp://codevkr.tistory.com\n\n\n네이버\nhttp://blog.naver.com/lghlove0509\n\n\n' + 
            '개인 포트폴리오 웹사이트\nhttps://leegeunhyeok.github.io'
          },
          'keyboard': {
            'type': 'buttons',
            'buttons': $buttons
          }
        });
      } else if($content.match($content.match(/^[1-3]-[0-9]{1,2} [일월화수목금토]/))) { // 1~3학년
        let week = ['일', '월', '화', '수', '목', '금', '토'];
        let grade_idx = $content.search(/^[1-3]/);
        let grade_num = $content[grade_idx];
        let class_idx = $content.search(/-[0-9]{1,2}/)+1;
        let class_num = $content[class_idx];
        let weekday_idx = $content.search(/[일월화수목금토]/);
        let weekday_num = week.indexOf($content[weekday_idx]);

        if(!($content[class_idx + 1] === ' ')) { // 1~9반 제외(반이 2자리수인 경우)
          class_num += $content[class_idx + 1];
        }
        // 해당 학급의 시간표 데이터 가져오기 
        this.timetable.get(parseInt(grade_num), parseInt(class_num), weekday_num).then(msg => {
          res.json({
            'message': {
              'text': msg
            },
            'keyboard': {
              'type': 'buttons',
              'buttons': $buttons
            }
          });
        });
      } else if($content.match(/^정류장 /)) { // 사용자 입력 데이터에 정류장이라는 단어가 있는지 확인 
        // 맨 앞의 정류장 문자와 공백을 기준으로 나눔
        // 예) 정류장 하안사거리 => ['', '하안사거리']
        let msg: string = $content.split(/^정류장 /)[1]; 
        // 입력한 버스정류장을 OpenAPI 에서 검색 
        this.bus.search(msg).then(result => {
          res.json({
            'message': {
              'text': result
            },
            'keyboard': {
              'type': 'buttons',
              'buttons': $buttons
            }
          });
        });
      } else {
        res.json({
          'message': {
            'text': '알 수 없는 명령입니다.\n\n형식과 일치하게 입력해주세요!'
          }, 
          'keyboard': {
            'type': 'buttons',
            'buttons': $buttons
          }
        });
      }
    });
    this.router = router;
  }

  /* @description Express 서버의 미들웨어 사용설정
  *  @return {void}
  */ 
  private initMiddleware(): void {
    this.app.use('/static', express.static('static'));
    this.app.use(bodyParser.urlencoded({extended: false})); 
    this.app.use(bodyParser.json());
    this.app.use(this.router);
    this.logger('Express middleware initialization completed', 1);
  }
  

  /* @description 라우터 및 미들웨어 설정을 하나로 사용
  *  @param {number}
  *  @return {void}
  */ 
  public async init(port: number): Promise<any> {
    try {
      this.db = await new Database(); // 데이터베이스 초기화 
      this.logger(await this.db.init('localhost', 3306, 'root', '1234', 'gmmahs'), 1);
      this.initRouter();
      this.initMiddleware();
      this.school.init(this.school.eduType.high, this.school.region.gyeonggi, 'J100000488'); // 학교 정보: 광명경영회계고등학교로 초기화
      this.meal = new Meal(this.db, this.school);
      this.calendar = new Calendar(this.db, this.school);
      this.timetable = new Timetable(this.db);
      this.weather = new Weather(this.db);
      this.bus = new Bus();
      this.statistics = new Statistics(this.db);
      this.statistics.reset();
      this.statistics.addFirstData();
      this.port = port;
      this.logger(`Server initialization complated [Server port: ${this.port}]`, 1);
      return {
        err: false
      }
    } catch(e) {
      this.logger('Application initialization error: ' + e, 4);
      return {
        err: true
      }
    }
  }

  /* @description Express 서버 실행
  *  @return {void}
  */ 
  public start(): void {
    // Express 서버 시작, 포트 지정 
    http.createServer(this.app).listen(this.port, async () => {
      this.logger('Gmmahs KAKAO server started', 1);
      try {
        // 서버 실행 후 데이터 세팅 
        try {
          let log: Array<any> = [];
          log.push(await this.meal.set(false));
          log.push(await this.calendar.set());
          log.push(await this.weather.set());
          log.push(await this.timetable.set());
          for(let l of log) {
            this.logger(l.msg, l.err ? 4 : 1);
          }
        } catch(e) {
          this.logger(e, 4);
        }

        // 매일 00:00:01 급식데이터 및 이번달 일정 데이터 갱신
        schedule.scheduleJob('1 0 0 * * * *', async (): Promise<any> => {
          this.logger(await this.meal.set(false), 1);
          this.logger(await this.calendar.set(), 1);
        });

        // 매주 토요일 00:00:00에 시간표 데이터 갱신
        schedule.scheduleJob('0 0 0 * * * 7', (): void => {
          this.timetable.set().then((result: any) => {
            this.logger(result.msg, result.err ? 4 : 1);
          });
        });

        // 매일 14:00:00 급식데이터 갱신 (내일 급식으로)
        // 점심시간이 지난 후 (2시에 내일 급식으로 갱신)
        schedule.scheduleJob('0 0 14 * * * *', (): void => {
          this.meal.set(true).then((result: any) => {
            this.logger(result.msg, result.err ? 4 : 1);
          });
        });

        // 매 시간마다 날씨데이터 갱신
        schedule.scheduleJob('0 0 * * * * *', (): void => {
          this.weather.set().then((result: any) => {
            this.logger(result.msg, result.err ? 4 : 1);
          });
        });
      } catch(e) {
        this.logger("Database init() failed.", 4);
        console.log(e);
      }
    });
  }
}

export default App;