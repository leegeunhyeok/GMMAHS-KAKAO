const $main = {
  'type': 'buttons',
  'buttons': ['급식', '날씨', '버스', '정보']
};

var http = require('http'), 
  express = require('express'), // REST API 서버로 구현
  bodyParser = require('body-parser'), // HTML Body 데이터 읽기(POST)
  cheerio = require('cheerio'); // HTML 파싱

var meal = require('./meal.js'); // 급식 정보 파싱

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
      send = {
        'message': {
          'text': '다양한 기능을 이용해보세요!'
        },
        'keyboard': {
          'type': 'buttons',
          'buttons': ['급식', '날씨', '버스', '정보']
        }
      }
      break;
    }

    case '급식': {
      send = {
        'message': {
          'text': meal.get(),
          'message_button': {
            'label': '이번달 급식 확인하기',
            'url': 'http://www.gmma.hs.kr/wah/main/schoolmeal/calendar.htm?menuCode=102'
          },
        },
        'keyboard': {
          'type': 'buttons',
          'buttons': ['처음으로']
        }
      };
      break;  
    }

    case '날씨': {
      send = {
        'message': {
          'text': `현재 구현 중인 기능입니다. ${new Date()}`
        },
        'keyboard': {
          'type': 'buttons',
          'buttons': ['처음으로']
        }
      };
      break;  
    }

    case '버스': {
      send = {
        'message': {
          'text': '현재 구현 중인 기능입니다.'
        },
        'keyboard': {
          'type': 'buttons',
          'buttons': ['처음으로']
        }
      };
      break;
    }

    case '정보': {
      send = {
        'message': {
          'text': '광명경영회계고등학교 정보제공 서비스입니다.\n\n' +
          '다양한 기능 및 오류 신고는\n[이메일] lghlove0509@naver.com\n' +
          '[전화번호] 010-4096-4475로 문의해주시면 감사하겠습니다.\n\n' +
          '본 서비스는 오픈소스로 Github에 모두 공개되어있으며 MIT 라이센스를 적용하고 있습니다.\n\n' +
          '개발자: 이근혁(3-8)',
          'message_button': {
            'label': '소스코드',
            'url': 'https://github.com/leegeunhyeok'
          },
        },
        'keyboard': {
          'type': 'buttons',
          'buttons': ['처음으로']
        }
      };
      break;  
    }

    default: {
      send = {
        'message': {
          'text': '알 수 없는 명령입니다.'
        },
        'keyboard': {
          'type': 'buttons',
          'buttons': ['처음으로']
        }
      };
      break;
    }
  }
  res.json(send); // 지정된 json 데이터를 사용자에게 응답 
});

// Express 서버 시작, 포트 지정 
http.createServer(app).listen(8080, () => {
  console.log('Gmmahs KAKAO server start.');
});