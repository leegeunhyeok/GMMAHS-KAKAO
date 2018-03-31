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
  'buttons': ['급식', '시간표', '날씨', '버스', '자유채팅', '정보']
};

const $buttons = [
  '급식', 
  '시간표',
  '날씨', 
  '버스', 
  '자유채팅', 
  '정보'
];

const http = require('http'), 
  express = require('express'), // REST API 서버로 구현
  bodyParser = require('body-parser'), // HTML Body 데이터 읽기(POST)
  cheerio = require('cheerio'); // HTML 파싱

// 스케줄러 모듈 
const schedule = require('node-schedule'); 

// 데이터베이스 작업 모듈 
const db = require('./src/database.js');

// 급식 데이터 파싱 모듈 
const meal = require('./src/meal.js');

// 시간표 데이터 파싱 모듈
const timetable = require('./src/timetable.js');

// 날씨 RSS 파싱 모듈
const weather = require('./src/weather.js'); 

// 버스 정보 파싱 모듈
const bus = require('./src/bus.js'); 

// DialogFlow 모듈
const dialogflow = require('./src/dialogflow.js');

// 익스프레스 객체 
const app = express();

// 익스프레스 라우터 객체 
const router = express.Router();

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

  // 사용자 식별 키
  const $user_key = req.body.user_key;

  // 텍스트에 따라 적절한 응답하기
  switch($content) {  
    case '처음으로': {
      res.json({
        'message': {
          'text': '다양한 기능을 이용해보세요!'
        },
        'keyboard': {
          'type': 'buttons',
          'buttons': $buttons
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
            'buttons': $buttons
          }
        });
      });
      break;  
    }

    case '시간표': {
      res.json({
        'message': {
          'text': '시간표 형식을 아래와 같이\n입력해주세요!\n\n' + 
          '"@학년 @반 @요일 시간표"\n\n[예시] 1학년 1반 월요일 시간표\n\n\n' + 
          '취소하고싶으시면 [처음으로]를\n입력해주세요!'
        }
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
            'buttons': $buttons
          }
        });
      });
      break;  
    }

    case '버스': {
      res.json({
        'message': {
          'text': '버스정류장 이름을 아래와 같이\n입력해주세요!\n\n' + 
          '"정류장 @@@"\n\n[예시] 정류장 하안사거리\n\n\n' +
          '취소하고싶으시면 [처음으로]를\n입력해주세요!'
        }
      });
      break;
    }

    case '정보': {
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
          'buttons': $buttons
        }
      });
      break;  
    }

    case '자유채팅': {
      res.json({
        'message': {
          'text': '챗봇과 자유롭게 채팅할 수 있는 기능입니다!\n' +
          '학교에 대해 궁금한것을 물어보거나 여러가지를 물어보세요~\n\n' +
          '[처음으로] 또는 나가고 싶다고 얘기하면\n대화를 종료합니다.'
        }
      });
      break;
    }

    default: {
      if($content.match(/^[1-3]학년 [0-9]{1,2}반 [일월화수목금토]요일 시간표/)) { // 시간표 
        let week = ['일', '월', '화', '수', '목', '금', '토'];
        let grade_idx = $content.search(/^[1-3]학년/);
        let grade_num = $content[grade_idx];
        let class_idx = $content.search(/[0-9]{1,2}반/);
        let class_num = $content[class_idx];
        let weekday_idx = $content.search(/[일월화수목금토]요일/);
        let weekday_num = week.indexOf($content[weekday_idx]);

        if(!($content[class_idx + 1] === '반')) { // 1~9반 제외(반이 2자리수인 경우)
          class_num += $content[class_idx + 1];
        }
        // 해당 학급의 시간표 데이터 가져오기 
        timetable.get(parseInt(grade_num), parseInt(class_num), weekday_num).then(msg => {
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
        var msg = $content.split(/^정류장 /); 
        // 입력한 버스정류장을 OpenAPI 에서 검색 
        bus.search(msg[1], result => { 
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
        // 정류장을 제외한 기타 문자들은 DialogFlow로 위임
        dialogflow.sendMessage($content, $user_key, data => {
          if(data) {
            let params = data.result.parameters;
            let intent = data.result.metadata.intentName;
            let speech = data.result.fulfillment.speech;

            if(intent === 'meal') { // DialogFlow 급식 
              meal.get((data, err) => {
                if(err) {
                  // 에러 발생 시 새로운 급식으로 불러오기 
                  meal.set();
                }
                res.json({
                  'message': {
                    'text': '제가 찾은 급식정보에요!\n\n' + data,
                    'message_button': {
                      'label': '이번달 급식 확인하기',
                      'url': 'http://www.gmma.hs.kr/wah/main/schoolmeal/calendar.htm?menuCode=102'
                    }
                  }
                });
              });
            } else if(intent === 'weather') { // DialogFlow 날씨 
              weather.get((data, err) => {
                if(err) {
                  // 에러 발생 시 새로운 날씨로 불러오기 
                  weather.set();
                }
                res.json({
                  'message': {
                    'text': '날씨 정보를 확인해봤어요!\n\n' + data
                  }
                });
              });
            } else if(intent === 'school_notice') { // DialogFlow 공지사항
              res.json({
                'message': {
                  'text': speech,
                  'message_button': {
                    'label': '학교 소식 확인하기',
                    'url': 'http://www.gmma.hs.kr/wah/main/bbs/board/list.htm?menuCode=68'
                  }
                }
              });
            } else if(intent === 'school_website') { // DialogFlow 학교 홈페이지 
              res.json({
                'message': {
                  'text': speech,
                  'message_button': {
                    'label': '학교 홈페이지',
                    'url': 'http://www.gmma.hs.kr'
                  }
                }
              });
            } else if(intent === 'school_student_council') {
              res.json({
                'message': {
                  'text': speech,
                  'message_button': {
                    'label': '학생회 페이스북',
                    'url': 'https://www.facebook.com/gmmahs'
                  }
                }
              });
            } else if(intent === 'exit') {
              res.json({
                'message': {
                  'text': speech
                },
                'keyboard': {
                  'type': 'buttons',
                  'buttons': $buttons
                }
              });
            } else { // 기타 질문 
              res.json({
                'message': {
                  'text': speech
                }
              });
            }
          } else {
            res.json({
              'message': {
                'text': '자유채팅 봇에 문제가 발생했습니다'
              }, 
              'keyboard': {
                'type': 'buttons',
                'buttons': $buttons
              }
            });
          }
        });
      }
      break;
    }
  }
});

// Express 서버 시작, 포트 지정 
http.createServer(app).listen(8080, async () => {
  console.log('Gmmahs KAKAO server start.');

  try {
    // 데이터베이스 초기화 
    await db.init();

    // 매일 00:00:01 급식데이터 갱신
    schedule.scheduleJob('1 0 0 * * * *', () => {
      meal.set();
    });

    // 매주 토요일 00:00:00에 시간표 데이터 갱신
    schedule.scheduleJob('0 0 0 * * * 7', () => {
      timetable.set();
    });

    // 매일 14:00:00 급식데이터 갱신 (내일 급식으로)
    // 점심시간이 지난 후 (2시에 내일 급식으로 갱신)
    schedule.scheduleJob('0 0 14 * * * *', () => {
      meal.set(true);
    });

    // 매 시간마다 날씨데이터 갱신
    schedule.scheduleJob('0 0 * * * * *', () => {
      weather.set();  
    });
  } catch(e) {
    console.log(e);
    console.log("Database init() failed.");
  }
});