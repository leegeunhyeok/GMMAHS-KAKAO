/*
* database.ts
* 
* 데이터베이스 커넥션 생성,
* 데이터베이스 쿼리
*
*/

import * as mysql from 'mysql2';

class Database {
  private db: any;

  /* @description 데이터베이스 커넥션 생성
  *  @param {string} 호스트
  *  @param {number} 포트
  *  @param {string} 유저이름 
  *  @param {string} 비밀번호
  *  @param {string} 데이터베이스 명
  *  @return {Promise}
  */
  public init(host: string, port: number, user: string, password: string, database: string): Promise<any> {
    return new Promise((resolve, reject) => {
      try {
        this.db = mysql.createConnection({
          host: host,
          port: port,
          user: user,
          password: password,
          database: database
        });

        this.executeQuery('SELECT * FROM INFORMATION_SCHEMA.TABLES').then(r => {
          resolve('Created database connection');
        }).catch(e => {
          reject('Database connection error: ' + e)
        })
      } catch(e) {
        reject(e);
      }
    });
  }

  /* @description 데이터베이스 쿼리 실행 후 결과 반환 
  *  @param {string} 쿼리 문장
  *  @return {Promise}
  */
  public async executeQuery(sql: string): Promise<any> {
    if(this.db) {
      try {
        let result: any = await new Promise((resolve, reject) => {
          this.db.query(sql, (err, rows) => {
            if(err) {
              reject(err);
            } 
            resolve(rows);
          });
        });
        return result;
      } catch(e) {
        throw Error(e)
      }
    } else { // db 커넥션 생성하지 않았을 경우(init 함수 미 호출)
      throw Error('Database init() execute please.')
    }
  }
}

export default Database;