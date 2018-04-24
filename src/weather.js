"use strict";
/*
* weather.ts
*
* 기상청의 RSS를 기반으로 한 데이터를
* 서버 DB에 저장 및 제공
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
const request = require("request");
const cheerio = require("cheerio");
class Weather {
    /* constructor */
    constructor(database) {
        this.$url = 'http://www.weather.go.kr/wid/queryDFSRSS.jsp?zone=4121065000';
        this.db = null;
        this.db = database;
    }
    /* @description 날씨 데이터 파싱 후 저장
    *  @return {Promise}
    */
    set() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let weather = yield new Promise((resolve, reject) => {
                    request(this.$url, (err, res, body) => {
                        if (err) {
                            reject(err);
                        }
                        var $ = cheerio.load(body);
                        var pub = $('pubDate').text().replace(/^[0-9]{4}[년] /, '');
                        var weather = [];
                        for (let i = 2; i <= 4; i++) {
                            let obj = {};
                            let data = $(`data:nth-child(${i})`);
                            obj['index'] = i - 2;
                            obj['hour'] = data.find('hour').text(); // 시간
                            obj['temp'] = data.find('temp').text(); // 기온 
                            obj['pty'] = data.find('pty').text(); // 강수형태(0: 없음, 1: 비, 2: 비/눈, 3: 눈)
                            obj['pop'] = data.find('pop').text(); // 강수확률
                            obj['wfKor'] = data.find('wfKor').text(); // 하늘 상태(맑음..등)
                            obj['reh'] = data.find('reh').text(); // 습도
                            obj['pub'] = pub;
                            weather.push(obj);
                        }
                        resolve(weather);
                    });
                });
                let data = 'INSERT INTO weather VALUES ';
                weather.forEach(i => {
                    data += `(${i.index},${i.hour},${i.temp},${i.pty},${i.pop},'${i.wfKor}',${i.reh},'${i.pub}'),`;
                });
                yield this.db.executeQuery('DELETE FROM weather');
                let rows = yield this.db.executeQuery(data.slice(0, -1));
                if (rows.affectedRows) {
                    return 'Weather data changed';
                }
                else {
                    return 'Weather data change error';
                }
            }
            catch (e) {
                return e;
            }
        });
    }
    get(callback) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let rows = yield this.db.executeQuery('SELECT * FROM weather');
                if (!rows.length) {
                    callback('날씨 데이터가 없습니다.\n잠시 후 다시 시도해주세요', true);
                }
                else {
                    const $pty = ['없음', '비', '비와 눈', '눈'];
                    let str = '';
                    let pub = ''; // 발표한 시간 
                    rows.forEach((i) => {
                        str += `[${i.hour > 12 ? '오후' : '오전'} ${i.hour > 12 ? i.hour - 12 : i.hour}시]\n- 기온: ${i.temp}℃\n- 강수형태: ${$pty[i.pty]}\n- 강수확률: ${i.pop}%, ${i.wfKor}\n- 습도: ${i.reh}%\n\n`;
                        pub = i.pub;
                    });
                    callback(str + pub + ' 발표\n소하 2동 기준\n(시간은 24시간 형식)', false);
                }
            }
            catch (e) {
                console.log(e);
                callback('서버에 문제가 발생하였습니다.', false);
            }
        });
    }
}
exports.default = Weather;
