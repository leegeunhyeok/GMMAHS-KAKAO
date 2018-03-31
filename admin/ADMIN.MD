# 챗봇 관리자 페이지
* 데이터 관리 및 서버 상태 확인 페이지
* 라우팅 경로는 보안상 공개하지 않습니다.
* 원하는 구성으로 관리자만의 웹 페이지를 만드시면 됩니다
> ## 라우트 모듈 생성
> * 라우트 경로는 아래와 같이 현재 디렉토리에 admin.js 모듈로 저장합니다.
> 
> ```javascript
> // 파일명: admin.js
> const $ROUTE = '/YOUR/ADMIN_ROUTE';
>
> exports.getRoute = () => {
>   return $ROUTE;
> }
> ```

> ## 라우트 경로 모듈 사용하기
> * 생성한 admin.js 모듈을 불러온 후 getRoute()를 호출하여 경로를 가져옵니다.
> 
> ```javascript
> // ../app.js 
> const admin = require('./admin/admin.js');
>
> router.route(admin.getRoute()).get((req, res) => {
>     .. 
> })
> ``` 