# Open API 키 
* Open API 키는 https://www.data.go.kr 에서 발급받으실 수 있습니다.
* key.js는 API 키 유출 방지를 위해 업로드되지 않습니다.
* 개인이 발급한 키를 이용하여 아래 메뉴얼에 맞춰 사용하기실 바랍니다.
* 
* DialogFlow Access Key는 구글 DialogFlow에서 Agent를 생성하신 후
* 설정 > Client access token 에서 받으실 수 있습니다.
* token.js는 토큰(키) 유출 방지를 위해 업로드되지 않습니다.
> ## OpenAPI 키 모듈 생성
> * 키 값은 아래와 같이 현재 디렉토리에 key.js 모듈로 저장합니다.
> 
> ```javascript
> // 파일명: key.js
> const $KEY = 'API_KEY_HERE';
>
> exports.getKey = () => {
>   return $KEY;
> }
> ```

> ## OpenAPI 키 값을 포함한 모듈 사용하기
> * 생성한 key.js 모듈을 불러온 후 getKey()를 호출하여 키값을 가져옵니다.
> * 키값은 버스 정보 모듈에 사용됩니다 (../src/bus.js)
> 
> ```javascript
> // ../src/bus.js 버스 정보 모듈 일부분
> const $KEY = require('../key/key.js').getKey();
> ``` 

> ## DialogFlow access token 키 모듈 생성
> * 키 값은 아래와 같이 현재 디렉토리에 token.js 모듈로 저장합니다.
> 
> ```javascript
> // 파일명: token.js
> const $KEY = 'ACCESS_TOKEN_HERE';
>
> exports.getToken = () => {
>   return $KEY;
> }
> ```

> ## DialogFlow 접근 키 값을 포함한 모듈 사용하기
> * 생성한 token.js 모듈을 불러온 후 getToken()를 호출하여 키값을 가져옵니다.
> * 키값은 버스 정보 모듈에 사용됩니다 (../src/dialogflow.js)
> 
> ```javascript
> // ../src/dialogflow.js 다이얼로그플로우 모듈 일부분
> const $KEY = require('../key/token.js').getToken();
> ``` 