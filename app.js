/*
* GMMAHS-KAKAO
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

const $main = {
  'type': 'buttons',
  'buttons': ['급식', '날씨', '버스', '정보', '개발자']
};

var http = require('http'), 
  express = require('express'), // REST API 서버로 구현
  bodyParser = require('body-parser'), // HTML Body 데이터 읽기(POST)
  cheerio = require('cheerio'); // HTML 파싱

// 스케줄러 모듈 
var schedule = require('node-schedule'); 

// 데이터베이스 작업 모듈 
var db = require('./src/database.js');

// 급식 데이터 파싱 모듈 
var meal = require('./src/meal.js');

// 날씨 RSS 파싱 모듈
var weather = require('./src/weather.js'); 

// 버스 정보 파싱 모듈
var bus = require('./src/bus.js'); 

// 익스프레스 객체 
var app = express();

// 익스프레스 라우터 객체 
var router = express.Router();

// 미들웨어 사용 설정 
app.use(bodyParser.urlencoded({extended: false})); 
app.use(bodyParser.json());
app.use(router);

// 개발 테스트용 form 페이지 
// 실제 서비스중에는 사용 안함
/*
router.route('/test').get((req, res) => {
  const fs = require('fs');
  fs.readFile('./test.html', (err, data) => {
    if(err) {
      console.log(err);
      res.writeHead(200, {'Content-Type': 'text/html'});
      res.write(err);
      res.end();
      return;
    }
    res.writeHead(200, {'Content-Type': 'text/html'});
    res.write(data);
    res.end();
  });
});
*/

// 플러스친구 추가 시 보여줄 버튼 목록
router.route('/keyboard').get((req, res) => { 
  res.json($main);
});

// 사용자가 메시지를 전송하면 응답 
router.route('/message').post((req, res) => {
  // 사용자가 입력한 텍스트 데이터 
  const $content = req.body.content; 

  // 텍스트에 따라 적절한 응답하기
  switch($content) {  
    case '처음으로': {
      res.json({
        'message': {
          'text': '다양한 기능을 이용해보세요!'
        },
        'keyboard': {
          'type': 'buttons',
          'buttons': ['급식', '날씨', '버스', '정보', '개발자']
        }
      });
      break;
    }

    case '급식': {
      meal.get((data, err) => {
        if(err) {
          // 에러 발생 시 새로운 급식으로 불러오기 
          meal.set();
        }
        res.json({
          'message': {
            'text': data,
            'message_button': {
              'label': '이번달 급식 확인하기',
              'url': 'http://www.gmma.hs.kr/wah/main/schoolmeal/calendar.htm?menuCode=102'
            }
          },
          'keyboard': {
            'type': 'buttons',
            'buttons': ['급식', '날씨', '버스', '정보', '개발자']
          }
        });
      });
      break;  
    }

    case '날씨': {
      weather.get((data, err) => {
        if(err) {
          // 에러 발생 시 새로운 날씨로 불러오기 
          weather.set();
        }
        res.json({
          'message': {
            'text': data
          },
          'keyboard': {
            'type': 'buttons',
            'buttons': ['급식', '날씨', '버스', '정보', '개발자']
          }
        });
      });
      break;  
    }

    case '버스': {
      res.json({
        'message': {
          'text': '버스정류장 이름을 아래와 같이\n입력해주세요!\n\n' + 
          '"정류장 정류장이름"\n\n[예시] 정류장 하안사거리'
        }
      });
      break;
    }

    case '정보': {
      res.json({
        'message': {
          'text': '광명경영회계고등학교 정보제공\n서비스입니다!\n\n' +
          '기능 및 오류 신고는\n아래에 문의해주세요~\n\n> lghlove0509@naver.com\n\n' +
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
          'buttons': ['급식', '날씨', '버스', '정보', '개발자']
        }
      });
      break;  
    }

    case '개발자': {
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
      break;  
    }

    case '블로그': {
      res.json({
        'message': {
          'text': '[개발자 블로그]\n\n개발자의 개인 블로그입니다!\n다양한 글과 작품이 올라와있습니다~!\n\n' +
          '다음 티스토리\nhttp://codevkr.tistory.com\n\n\n네이버\nhttp://blog.naver.com/lghlove0509\n\n\n' + 
          '개인 포트폴리오 웹사이트\nhttps://leegeunhyeok.github.io'
        },
        'keyboard': {
          'type': 'buttons',
          'buttons': ['급식', '날씨', '버스', '정보', '개발자']
        }
      });
      break;  
    }

    default: {
      // 사용자 입력 데이터에 정류장이라는 단어가 있는지 확인 
      if($content.match(/^정류장 /)) {
        // 맨 앞의 정류장 문자와 공백을 기준으로 나눔
        // 예) 정류장 하안사거리 => ['', '하안사거리']
        var msg = $content.split(/^정류장 /); 
        // 입력한 버스정류장을 OpenAPI 에서 검색 
        bus.search(msg[1], result => { 
          res.json({
            'message': {
              'text': result
            }
          });
        }); 
      } else {  
        // 정류장을 제외한 기타 문자들은 알 수 없는 명령으로 처리 
        res.json({
          'message': {
            'text': '알 수 없는 명령입니다.'
          }, 
          'keyboard': {
            'type': 'buttons',
            'buttons': ['급식', '날씨', '버스', '정보', '개발자']
          }
        });
      }
      break;
    }
  }
});

// Express 서버 시작, 포트 지정 
http.createServer(app).listen(8080, () => {
  console.log('Gmmahs KAKAO server start.');

  // 데이터베이스 초기화 
  db.init();

  // 매일 00:00:01 급식데이터 갱신
  schedule.scheduleJob('1 0 0 * * * *', () => {
    meal.set();
  });

  // 매 시간마다 날씨데이터 갱신
  schedule.scheduleJob('0 0 * * * * *', () => {
    weather.set();  
  })
});