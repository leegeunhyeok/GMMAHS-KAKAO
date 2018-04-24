/*
* bus.ts
*
* 경기도 버스 정보 Open API 이용
* 
* 키 발급: https://www.data.go.kr
* 경기도 버스 정보: http://gbis.go.kr
* 
* 사용중인 API 
* - 버스 도착 정보 조회 서비스
* - 정류소 조회 서비스 (정류소 검색)
* - 버스 노선 조회 서비스 (버스 정보)
*
*/

import * as request from 'request';
import * as cheerio from 'cheerio';

class Bus {
  private $station: string = 'http://openapi.gbis.go.kr/ws/rest/busstationservice?serviceKey='; // 정류장 조회 EndPoint
  private $bus: string = 'http://openapi.gbis.go.kr/ws/rest/busarrivalservice/station?serviceKey='; // stationId 의 정류장에 오는 버스 조회  
  private $route: string = 'http://openapi.gbis.go.kr/ws/rest/busrouteservice/info?serviceKey='; // 해당 노선의 정보 조회
  private $info: string = 'http://openapi.gbis.go.kr/ws/rest/busrouteservice/info?serviceKey='; // 버스 정보 조회
  private API_ERR: string = 'API 서버에 문제가 발생하였습니다\n\n[왜 문제가 발행하나요?]\n- 일일 트래픽 제한 초과\n- 서버 접속 오류\n\n잠시 후 다시 시도하거나\n내일 다시 시도해주세요';
  private $KEY: string = null; // Open API Key
  private db: any;

  /* @constructor */
  constructor(database: any) {
    this.$KEY = require('../key/key.js').getKey();
    this.db = database;
  }

  /* @description 해당 키워드의 정류장 검색 후 도착 버스 정보 조회
  *  @param {string} 검색할 키워드  
  *  @param {Function} 콜백함수  
  *  @return {void}
  */
  public search(keyword: string, callback: Function): void {
    // 키워드에 대한 버스정류장 검색
    this.getStation(keyword).then((station: Array<any>) => {
      // 버스정류장에 오는 버스 목록 조회 
      return this.getBus(station);
    }).then((result: Array<any>) => {
      // 버스 목록에 대한 세부 정보 조회 
      return this.getBusInfo(result);
    }).then((bus) => {
      callback(this.process(bus));
    }).catch((err: any) => {
      callback(err);
    });
  }

  /* @description 사용자 입력 키워드 기준의 버스 정류장 검색
  *  @param {string} 사용자 입력 키워드 
  *  @return {Promise}
  */  
  private getStation(str: string): Promise<any> {
    return new Promise((resolve, reject) => { // 동기 작업을 위해 프라미스 생성 
      // OpenAPI 접속 URL
      var url: string = this.$station + this.$KEY + '&keyword=' + encodeURIComponent(str);
  
      // XML 내려받기 
      request(url, (err, res, body) => {
        if(err) {
          console.log(err);
          reject(err);
        }
        var station: Array<any> = [];
        var $: cheerio = cheerio.load(body);
        if($('resultCode').text() === '0') {
          $('busStationList').each(function(idx) {
            if($(this).find('regionName').text().indexOf('광명') !== -1) { // 지역이 광명인 정류장만 추출 
              let name: string = $(this).find('stationName').text();
              let id: string = $(this).find('stationId').text();
              station.push({name: name, id: id});
            }
          });
    
          if(station.length === 0) {
            reject('해당 정류장을 찾을 수 없습니다\n다시 입력해주세요');
          } else if(station.length > 6) {
            reject('검색된 정류장이 너무 많습니다\n더 자세하게 입력해주세요\n\n검색된 정류장 수: ' + station.length);
          } else {
            resolve(station);
          }
        } else {
          reject(this.API_ERR);
        }
      });
    }); 
  }

  /* @description 정류장ID에 도착할 예정인 버스 조회
  *  @param {Array} 정류장ID 리스트 
  *  @return {Promise}
  */
  private getBus(stationId: Array<any>): Promise<any> {
    return new Promise((resolve, reject) => {
      // OpenAPI 접속 URL
      var baseUrl: string = this.$bus + this.$KEY + '&stationId='; 
      
      // 프라미스 저장 배열 
      var $promise: Array<Promise<any>> = [];

      for(let i=0; i<stationId.length; i++) {
        $promise[i] = new Promise((resolve, reject) => {
          let url: string = baseUrl + stationId[i].id;

          // XML 내려받기 
          request(url, (err, res, body) => {
            if(err) {
              console.log(err);
              resolve('');
            }

            // 버스 데이터 저장 배열 
            var bus: Array<any> = [];
            var $ = cheerio.load(body);
            if($('resultCode').text() === '0') {
              $('busArrivalList').each(function(idx) {
                let route: string = $(this).find('routeId').text(); // 노선 ID
                let predictTime1: string = $(this).find('predictTime1').text(); // 첫 번째 버스 도착시간
                let predictTime2: string = $(this).find('predictTIme2').text(); // 두 번째 버스 도착시간
                bus.push({id: route, station: stationId[i].name, time1: predictTime1, time2: predictTime2});
              });
              resolve(bus);
            } else {
              reject(this.API_ERR);
            }
          });
        });
      }

      // 생성된 프라미스 모두 동기작업 
      Promise.all($promise).then((value: any): void => {
        // 완료된 데이터 resolve 데이터로 전달
        resolve(value);
      }).catch((msg: string) => {
        reject(msg);
      });
    });
  }

  /* @description 해당 버스의 상세 정보 조회
  *  @param {Array} 버스ID 리스트
  *  @return {Promise}
  */
  private getBusInfo(bus: Array<any>): Promise<any> {
    return new Promise((resolve, reject) => {
      var baseUrl: string = this.$info + this.$KEY + '&routeId=';

      // 프라미스 저장 배열 
      var $promise: Array<Promise<any>> = []; 

      // 프라미스 배열 전용 인덱스 
      var idx: number = 0; 
      for(let i=0; i<bus.length; i++) {
        for(let j=0; j<bus[i].length; j++, idx++) {

          // 프라미스 생성 및 저장 
          $promise[idx] = new Promise((resolve, reject) => {
            // 버스 데이터 임시로 배열에 저장 
            var tempBus: any = bus[i][j]; 

            // 접속할 API URL
            var url: string = baseUrl + tempBus.id;

            // XML 불러오기 
            request(url, (err, res, body) => {
              if(err) {
                console.log(err);
                resolve('');
              }
              var bus: Array<any> = [];
              var $: cheerio = cheerio.load(body);
              if($('resultCode').text() === '0') {
                $('busRouteInfoItem').each(function(idx) {
                  let end: string = $(this).find('endStationName').text(); // 종점 
                  let number: string = $(this).find('routeName').text(); // 버스 번호 
                  bus.push({number: number, end: end, station: tempBus.station, time1: tempBus.time1, time2: tempBus.time2});
                  // 버스번호, 종점, 정류장이름, 첫버스 도착시간, 두번째버스 도착시간
                });
                resolve(bus);
              } else {
                reject(this.API_ERR);
              }
            });
          });
        }
      }

      // 모든 프라미스 동기 작업
      Promise.all($promise).then(($buslist: any): void => {
        resolve($buslist);
      }).catch((msg: string) => {
        reject(msg);
      });
    }); 
  }
  
  /* @description 버스 데이터를 가공
  *  @param {any} 버스 데이터  
  *  @return {string} 가공된 문자열 데이터
  */
  private process(data: any): string {
    let str: string = '';
    for(let i=0; i < data.length; i++) {
      let bus: any = data[i][0];
      if(bus.time1) {
        str += `--[${bus.number}번 버스]--\n${bus.station} 정류장에\n${bus.time1}분 후 도착합니다.\n다음 버스는 ${bus.time2 ? bus.time2 + '분 후 도착합니다.' : '없습니다'}\n---------------\n\n`;
      }
    }
    return str;
  }
} 

export default Bus;
