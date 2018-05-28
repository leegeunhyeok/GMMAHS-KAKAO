/*
* statistics.ts
* 
* 사용자 사용 메뉴 통계 저장 및 제공
*
*/

import Database from './database.js';

class Statistics {
	private db: Database;
	
	/* @constructor 
  *  @typedef {object} DB 데이터베이스 커넥션 객체
  */
	constructor(database: Database) {
		this.db =  database;
	}

	/* @description 통계 데이터 초기화
	*  @return {Promise}
	*/
	public async reset(): Promise<any> {
		await this.db.executeQuery('DELETE FROM statistics');
	}

	/* @description 첫 통계 데이터 삽입(0)
	*  @return {Promise} 
	*/
	public async addFirstData(): Promise<any> {
		await this.db.executeQuery('INSERT INTO statistics VALUES ()');
	}

	/* @description 현재 시점까지의 사용 메뉴 통계
	*  @return {Promise} 결과 텍스트와 함께 반환
	*/
	public async getStatistics(): Promise<any> {
		let result = await this.db.executeQuery('SELECT * FROM statistics');
		result = result[0];
		let total: number = result['meal'] + 
							result['timetable'] + 
							result['calendar'] + 
							result['weather'] + 
							result['bus'] + 
							result['other']; // 메뉴 사용 전체 인원
		
		return `급식: ${(result['meal']/total * 100).toFixed(2)}%\n` + 
					 `시간표: ${(result['timetable']/total * 100).toFixed(2)}%\n` + 
					 `학사일정: ${(result['calendar']/total * 100).toFixed(2)}%\n` + 
					 `날씨: ${(result['weather']/total * 100).toFixed(2)}%\n` + 
					 `버스: ${(result['bus']/total * 100).toFixed(2)}%\n` + 
					 `기타: ${(result['other']/total * 100).toFixed(2)}%\n` + 
					 `\n\n전체 채팅 요청 수: ${total}회\n`;
	}
}

export default Statistics;