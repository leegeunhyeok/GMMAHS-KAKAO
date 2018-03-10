var mysql = require('mysql2');
var db;

// 00 포맷으로 변환 
var fillZero = (data) => {
  var str = data.toString();
  return str.length === 1 ? '0' + str : str;
}

// 커넥션 생성 
var init = () => {
  db = mysql.createConnection({
    host:'localhost',
    port:'3306',
    user: 'root',
    password:'1234',
    database:'gmmahs'
  });
  console.log('Create database connection');
}

// 함수 호출된 시점의 급식 데이터 불러오기 
var setMeal = (dateStr, meal) => {
  // 기존의 급식데이터 삭제 
  db.query('DELETE FROM meal', () => { 
    
    console.log('Delete old meal data');
    // 새로운 데이터 추가 
    db.query(`INSERT INTO meal VALUES ('${dateStr}', '${meal}')`, (err, rows) => {
      if(err) {
        console.log(err);
        return;
      }

      // 변경된 행이 있을 때
      if(rows.affectedRows) {
        console.log(dateStr + ' Meal data inserted');
      }
    });
  });
}

// DB에서 급식 데이터 불러오기 
var getMeal = callback => {
  db.query('SELECT * FROM meal', (err, rows) => {
    if(err) {
      console.log(err);
      callback('서버에 문제가 발생하였습니다.', false);
    }

    // 조회된 데이터 길이 
    if(rows.length) {
      let info = rows[0].info ? rows[0].info : '급식이 없습니다.';
      callback(rows[0].date + '\n\n' + info, false);
    } else {
      callback('새로운 데이터를 불러오고있습니다.\n잠시 후 다시 시도해주세요', true);
    }
  });
}

// RSS 날씨 불러와서 저장 
var setWeather = weather => {
  var data = '';
  weather.forEach(i => {
    data += `(${i.index},${i.hour},${i.temp},${i.pty},${i.pop},'${i.wfKor}',${i.reh},'${i.pub}'),`;
  });

  // 기존의 날씨 데이터 삭제 
  db.query('DELETE FROM weather', () => {

    console.log('Delete old weather data');
    // 새로운 데이터 추가 
    db.query('INSERT INTO weather VALUES ' + data.slice(0, -1), (err, rows) => {
      if(err) {
        console.log(err);
        return;
      }

      // 추가된 행이 있을 때
      if(rows.affectedRows) {
        console.log('Weather data inserted');
      }
    })
  })
}

// DB에서 날씨 데이터 불러오기 
var getWeather = callback => {
  db.query('SELECT * FROM weather', (err, rows) => {
    if(err) {
      console.log(err);
      callback('서버에 문제가 발생하였습니다.', false);
    }

    // 조회된 데이터 길이 확인
    if(!rows.length) {
      callback('날씨 데이터가 없습니다.\n잠시 후 다시 시도해주세요', true);
    } else {
      const $pty = ['없음', '비', '비와 눈', '눈'];
      let str = '';
      let pub = '';
      rows.forEach(i => {
        str += `[시간: ${fillZero(i.hour)}:00]\n- 기온: ${i.temp}℃\n- 강수형태: ${$pty[i.pty]}\n- 강수확률: ${i.pop}%, ${i.wfKor}\n- 습도: ${i.reh}%\n\n`;
        pub = i.pub;
      });
      callback(str + pub + ' 발표\n소하 2동 기준\n(시간은 24시간 형식)', false);
    }
  });
}

exports.init = init;
exports.setMeal = setMeal;
exports.getMeal = getMeal;
exports.setWeather = setWeather;
exports.getWeather = getWeather;