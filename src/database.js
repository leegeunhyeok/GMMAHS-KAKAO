const mysql = require('mysql2');
var db;

// 커넥션 생성 
const init = () => {
  return new Promise((resolve, reject) => {
    try {
      db = mysql.createConnection({
        host:'localhost',
        port:'3306',
        user: 'root',
        password:'1234',
        database:'gmmahs'
      });
      resolve('Create database connection');
    } catch(e) {
      reject(e);
    }
  });
}

// 인자로 넘어온 SQL 문장 실행 
const executeQuery = async sql => {
  if(db) {
    let result = await new Promise((resolve, reject) => {
      db.query(sql, (err, rows) => {
        if(err) {
          reject(err);
        } 
        resolve(rows);
      });
    });
    return result;
  } else { // db 커넥션 생성하지 않았을 경우(init 함수 미 호출)
    return 'Database init() execute please.'
  }
}

exports.init = init;
exports.executeQuery = executeQuery;