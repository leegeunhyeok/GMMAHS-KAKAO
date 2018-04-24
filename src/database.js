"use strict";
/*
* database.ts
*
* 데이터베이스 커넥션 생성,
* 데이터베이스 쿼리
*
*/
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const mysql = require("mysql2");
class Database {
    constructor() {
        this.db = null;
    }
    /* @description 데이터베이스 커넥션 생성
    *  @param {string} 호스트
    *  @param {number} 포트
    *  @param {string} 유저이름
    *  @param {string} 비밀번호
    *  @param {string} 데이터베이스 명
    *  @return {Promise}
    */
    init(host, port, user, password, database) {
        return new Promise((resolve, reject) => {
            try {
                this.db = mysql.createConnection({
                    host: host,
                    port: port,
                    user: user,
                    password: password,
                    database: database
                });
                resolve('Create database connection');
            }
            catch (e) {
                reject(e);
            }
        });
    }
    /* @description 데이터베이스 쿼리 실행 후 결과 반환
    *  @param {string} 쿼리 문장
    *  @return {Promise}
    */
    executeQuery(sql) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.db) {
                let result = yield new Promise((resolve, reject) => {
                    this.db.query(sql, (err, rows) => {
                        if (err) {
                            reject(err);
                        }
                        resolve(rows);
                    });
                });
                return result;
            }
            else { // db 커넥션 생성하지 않았을 경우(init 함수 미 호출)
                return 'Database init() execute please.';
            }
        });
    }
}
exports.default = Database;
