const mysql = require('mysql2');
var db;

// 커넥션 생성 
const init = () => {
  new Promise((resolve, reject) => {
    db = mysql.createConnection({
      host:'localhost',
      port:'3306',
      user: 'root',
      password:'1234',
      database:'gmmahs'
    });
    console.log('Create database connection');
    resolve();
  });
}

// 인자로 넘어온 SQL 문장 실행 
const executeQuery = async sql => {
  result = await new Promise((resolve, reject) => {
    db.query(sql, (err, rows) => {
      if(err) {
        reject(err);
      } 
      resolve(rows);
    });
  });
  return result;
}

exports.init = init;
exports.executeQuery = executeQuery;