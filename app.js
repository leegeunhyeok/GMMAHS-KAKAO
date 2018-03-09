const $main = {
  'type': 'buttons',
  'buttons': ['급식', '날씨', '버스', '정보', '개발자']
};

var http = require('http'), 
  express = require('express'), // REST API 서버로 구현
  bodyParser = require('body-parser'), // HTML Body 데이터 읽기(POST)
  cheerio = require('cheerio'); // HTML 파싱

var schedule = require('node-schedule'), // 스케줄러 
  rule = new schedule.RecurrenceRule();

var db = require('./database.js');
var meal = require('./meal.js'); // 급식 정보 파싱
var weather = require('./weather.js');

var app = express();
var router = express.Router();

app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());
app.use(router);

// 플러스친구 추가 시 보여줄 버튼 목록
router.route('/keyboard').get((req, res) => { 
  res.json($main);
});

// 사용자가 메시지를 전송하면 응답 
router.route('/message').post((req, res) => {
  const $content = req.body.content; // 사용자가 입력한 텍스트 데이터 
  var send; // 전송할 json 저장 변수

  switch($content) { // 텍스트에 따라 적절한 응답하기 
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
      meal.get(data => {
        res.json({
          'message': {
            'text': data,
            'message_button': {
              'label': '이번달 급식 확인하기',
              'url': 'http://www.gmma.hs.kr/wah/main/schoolmeal/calendar.htm?menuCode=102'
            },
          },
          'keyboard': {
            'type': 'buttons',
            'buttons': ['처음으로']
          }
        });
      });
      break;  
    }

    case '날씨': {
      weather.get(data => {
        res.json({
          'message': {
            'text': data
          },
          'keyboard': {
            'type': 'buttons',
            'buttons': ['처음으로']
          }
        });
      });
      break;  
    }

    case '버스': {
      res.json({
        'message': {
          'text': '현재 구현 중인 기능입니다.'
        },
        'keyboard': {
          'type': 'buttons',
          'buttons': ['처음으로']
        }
      });
      break;
    }

    case '정보': {
      res.json({
        'message': {
          'text': '광명경영회계고등학교 정보제공\n서비스입니다.\n\n' +
          '기능 및 오류 신고는\n아래에 문의해주시길 바랍니다.\n\n> lghlove0509@naver.com\n\n' +
          '> 010-4096-4475\n\n' +
          '본 서비스는 오픈소스로 Github에 모두 공개되어있으며 MIT 라이센스를 적용하고 있습니다.\n\n' + 
          'Server: Node.js\nDB: MariaDB',
          'message_button': {
            'label': '소스코드',
            'url': 'https://github.com/leegeunhyeok/GMMAHS-KAKAO'
          },
        },
        'keyboard': {
          'type': 'buttons',
          'buttons': ['처음으로']
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
          'buttons': ['처음으로']
        }
      });
      break;  
    }

    default: {
      res.json({
        'message': {
          'text': '알 수 없는 명령입니다.'
        },
        'keyboard': {
          'type': 'buttons',
          'buttons': ['처음으로']
        }
      });
      break;
    }
  }
});

// Express 서버 시작, 포트 지정 
http.createServer(app).listen(8080, () => {
  console.log('Gmmahs KAKAO server start.');
  db.init();
  schedule.scheduleJob('1 0 0 * * * *', () => {
    meal.set(); // 매일 00:00:01 급식데이터 갱신
  });

  schedule.scheduleJob('0 0 * * * * *', () => {
    weather.set(); // 매 시간마다 급식 데이터 갱신 
  })
});