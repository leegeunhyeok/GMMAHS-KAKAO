const $main = {
  'type': 'buttons',
  'buttons': ['급식', '날씨', '버스', '도움말', '정보', '개발자']
};

var http = require('http'), 
  express = require('express'), // REST API 서버로 구현
  bodyParser = require('body-parser'), // HTML Body 데이터 읽기(POST)
  cheerio = require('cheerio'); // HTML 파싱

var schedule = require('node-schedule'), // 스케줄러 
  rule = new schedule.RecurrenceRule();

var db = require('./src/database.js');
var meal = require('./src/meal.js'); // 급식 정보 파싱
var weather = require('./src/weather.js'); // 날씨 RSS 파싱
var bus = require('./src/bus.js'); // OpenAPI 버스 정보 조회

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
          'buttons': ['급식', '날씨', '버스', '도움말', '정보', '개발자']
        }
      });
      break;
    }

    case '급식': {
      meal.get((data, err) => {
        if(err) {
          meal.set();
        }
        res.json({
          'message': {
            'text': data,
            'message_button': {
              'label': '이번달 급식 확인하기',
              'url': 'http://www.gmma.hs.kr/wah/main/schoolmeal/calendar.htm?menuCode=102'
            },
          }
        });
      });
      break;  
    }

    case '날씨': {
      weather.get((data, err) => {
        if(err) {
          weather.set();
        }
        res.json({
          'message': {
            'text': data
          }
        });
      });
      break;  
    }

    case '버스': {
      res.json({
        'message': {
          'text': '버스정류장 이름을 아래와 같이\n입력해주세요!\n\n' + 
          '\'정류장 정류장이름\'\n(예시) 정류장 하안사거리'
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
          },
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
        }
      });
      break;  
    }

    case '도움말': {
      res.json({
        'message': {
          'text': '사용 가능한 명령어를 소개해드릴게요!\n\n' + 
          '[급식]\n오늘의 급식을 확인할 수 있어요\n\n' + 
          '[날씨]\n가까운 시간대의 날씨를 확인할 수 있어요\n\n' + 
          '[버스]\n입력한 정류장의 버스 도착시간을 알 수 있어요\n\n' +
          '[정보]\n본 서비스의 간단한 정보를 알 수 있어요\n\n' + 
          '[개발자]\n개발자에 대해 알아볼 수 있어요\n\n' + 
          '[처음으로]\n처음으로 돌아갈 수 있어요\n\n' + 
          '[도움말]\n명령어를 확인할 수 있어요'
        }
      });
      break;
    }

    default: {
      if($content.indexOf('정류장') !== -1) {
        // 맨 앞의 정류장 문자와 공백을 기준으로 나눔
        var msg = $content.split(/^정류장 /); // 예) 정류장 하안사거리 => ['', '하안사거리']
        bus.search(msg[1], result => { // 입력한 버스정류장을 OpenAPI 에서 검색 
          res.json({
            'message': {
              'text': result
            }
          });
        }); 
      } else {  
        res.json({
          'message': {
            'text': '알 수 없는 명령입니다.\n\n[도움말]을 입력하면 도와드릴게요!\n\n처음으로 돌아가고싶으시면\n[처음으로]를 입력해주세요!'
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
  db.init();
  schedule.scheduleJob('1 0 0 * * * *', () => {
    meal.set(); // 매일 00:00:01 급식데이터 갱신
  });

  schedule.scheduleJob('0 0 * * * * *', () => {
    weather.set(); // 매 시간마다 날씨데이터 갱신 
  })
});