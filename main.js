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

const express = require('express')
const app = express()

const colors = require('colors')
const { timeStamp } = require('./app/common/util')

require('./app/bootstrap/init')(app, express).then(() => {
  app.listen(app.get('port'), () => {
    console.log(timeStamp() + colors.rainbow('GMMAHS KAKAO server started, port: ' + app.get('port')))
  })
}).catch(e => {
  console.log(timeStamp() + 'ERROR: ' + e.message.red)
})

process.on('uncaughtException', e => {
  console.log(timeStamp() + ('Critical error: ' + e.message).red)
})
