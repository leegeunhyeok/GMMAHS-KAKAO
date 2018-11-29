const bus = require('../src/Bus')
const calendar = require('../src/Calendar')
const meal = require('../src/Meal')
const statistics = require('../src/Statistics')
const timetable = require('../src/Timetable')
const weather = require('../src/Weather')

const { timeStamp } = require('../common/util')

const buttons = [
  '급식',
  '시간표',
  '학사일정',
  '날씨',
  '버스',
  '통계',
  '정보'
]

const week = ['일', '월', '화', '수', '목', '금', '토']

module.exports = app => {
  app.get('/keyboard', (req, res) => {
    res.json({
      type: 'buttons',
      buttons
    })
  })

  app.post('/message', async (req, res) => {
    const content = req.body.content
    // const key = req.body.user_key

    if (content === '처음으로') {
      res.json({
        'message': {
          'text': '다양한 기능을 이용해보세요!'
        },
        'keyboard': {
          'type': 'buttons',
          'buttons': buttons
        }
      })
    } else if (content === '급식') {
      await statistics.count('MEAL')
      res.json({
        'message': {
          'text': await meal.get(),
          'message_button': {
            'label': '이번달 급식 확인하기',
            'url': 'http://www.gmma.hs.kr/wah/main/schoolmeal/calendar.htm?menuCode=102'
          }
        },
        'keyboard': {
          'type': 'buttons',
          'buttons': buttons
        }
      })
    } else if (content === '시간표') {
      await statistics.count('TIMETABLE')
      res.json({
        message: {
          text: '시간표 형식을 아래와 같이\n입력해주세요!\n\n' +
                '형식: "학년-반 요일"\n\n[예시] 1-1 월\n' +
                '1학년 1반 월요일 시간표를 조회합니다.\n\n' +
                '취소하시려면 [처음으로]를\n입력해주세요!'
        }
      })
    } else if (content === '학사일정') {
      await statistics.count('CALENDAR')
      res.json({
        message: {
          text: await calendar.get()
        },
        keyboard: {
          type: 'buttons',
          buttons: buttons
        }
      })
    } else if (content === '날씨') {
      await statistics.count('WEATHER')
      res.json({
        message: {
          text: await weather.get()
        },
        keyboard: {
          type: 'buttons',
          buttons: buttons
        }
      })
    } else if (content === '버스') {
      await statistics.count('BUS')
      res.json({
        message: {
          text: '버스정류장 이름을 아래와 같이\n입력해주세요!\n\n' +
                '"정류장 정류장이름"\n\n[예시] 정류장 하안사거리\n\n\n' +
                '취소하고싶으시면 [처음으로]를\n입력해주세요!'
        }
      })
    } else if (content === '통계') {
      await statistics.count('OTHER')
      res.json({
        message: {
          text: '여러분들이 사용하는 메뉴들의\n사용량 통계입니다!\n\n' +
                await statistics.get() +
                '\n기간: 서버 가동 후 ~ 현재'
        },
        keyboard: {
          type: 'buttons',
          buttons: buttons
        }
      })
    } else if (content === '정보') {
      await statistics.count('OTHER')
      res.json({
        message: {
          text: '광명경영회계고등학교 정보제공\n서비스입니다!\n\n' +
                '기능 및 오류 신고는\n아래에 문의해주세요~\n\n> lghlove0509@naver.com\n' +
                '> 010-4096-4475\n\n' +
                '본 서비스는 오픈소스로 Github에 모두 공개되어있으며 MIT 라이센스를 적용하고 있습니다!\n\n' +
                'Server: Node.js\nDatabase: MariaDB',
          message_button: {
            label: '소스코드',
            url: 'https://github.com/leegeunhyeok/GMMAHS-KAKAO'
          }
        },
        keyboard: {
          type: 'buttons',
          buttons: ['개발자', '처음으로']
        }
      })
    } else if (content === '개발자') {
      res.json({
        message: {
          text: '[개발자 정보]\n\n' +
                '개발자: 이근혁(3-8)\n' +
                '이메일: lghlove0509@naver.com\n' +
                '깃허브: Leegeunhyeok'
        },
        keyboard: {
          type: 'buttons',
          buttons: ['블로그', '처음으로']
        }
      })
    } else if (content === '블로그') {
      res.json({
        message: {
          text: '[개발자 블로그]\n\n개발자의 개인 블로그입니다!\n다양한 글과 작품이 올라와있습니다~!\n\n' +
          '다음 티스토리\nhttp://codevkr.tistory.com\n\n\n네이버\nhttp://blog.naver.com/lghlove0509\n\n\n' +
          '개인 포트폴리오 웹사이트\nhttps://leegeunhyeok.github.io'
        },
        keyboard: {
          type: 'buttons',
          buttons: buttons
        }
      })
    } else if (content.match(/^[1-3]-[0-9]{1,2} [일월화수목금토]/)) {
      let gradeIdx = content.search(/^[1-3]/)
      let gradeNum = content[gradeIdx]
      let classIdx = content.search(/-[0-9]{1,2}/) + 1
      let classNum = content[classIdx]
      let weekdayIdx = content.search(/[일월화수목금토]/)
      let weekdayNum = week.indexOf(content[weekdayIdx])

      if (!(content[classIdx + 1] === ' ')) {
        classNum += content[classIdx + 1]
      }

      const result = await timetable.get(parseInt(gradeNum), parseInt(classNum), weekdayNum)
      res.json({
        message: {
          text: result
        },
        keyboard: {
          type: 'buttons',
          buttons: buttons
        }
      })
    } else if (content.match(/^정류장 /)) {
      let keyword = content.split(/^정류장 /)[1]
      const result = await bus.search(keyword)
      res.json({
        message: {
          text: result
        },
        keyboard: {
          type: 'buttons',
          buttons: buttons
        }
      })
    } else {
      res.json({
        message: {
          text: '알 수 없는 명령입니다.\n\n형식과 일치하게 입력해주세요!'
        },
        keyboard: {
          type: 'buttons',
          buttons: buttons
        }
      })
    }
  })

  console.log(timeStamp() + 'Message initialized'.cyan)
}
