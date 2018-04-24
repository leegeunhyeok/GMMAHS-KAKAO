import * as apiai from 'apiai';

class DialogFlow {
  private $KEY: string;
  private app: any;
  
  /* @constructor */
  constructor() {
    this.$KEY = require('../key/token.js').getToken();
    this.app = apiai(this.$KEY);
  }

  /* @description 사용자 메시지를 DialogFlow 서버로 전송 후 결과 받아오기
  *  @param {string} 사용자 메시지
  *  @param {any} 세션 객체
  *  @param {Function} 콜백함수  
  *  @return {void}
  */
  public sendMessage(msg: string, session: any, callback: Function): void {
    let request: any = this.app.textRequest(msg, {
      sessionId: session
    });
    
    request.on('response', res => {
      callback(res);
    });
  
    request.on('error', err => {
      console.log(err);
      callback();
    });
    
    request.end();
  }
}

export default DialogFlow;