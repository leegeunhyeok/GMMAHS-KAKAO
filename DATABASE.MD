# 데이터베이스 메뉴얼
* 데이터베이스는 MySQL (MariaDB) 사용
> ## 급식정보 테이블
> * 테이블명 : meal
> * 설명: 급식 날짜 데이터 및 급식 메뉴 저장
> ```sql
> CREATE TABLE meal (
>   date TEXT NOT NULL, -- 날짜 문자열
>   info TEXT NOT NULL  -- 급식 메뉴
> );
> ```

> ## 시간표정보 테이블
> * 테이블명 : timetable
> * 설명: 학년, 반, 요일, 교시, 시간표코드, 교사명, 과목명 저장
> ```sql
> CREATE TABLE timetable (
>   grade INT NOT NULL,           -- 학년 (1, 2, 3)
>   class INT NOT NULL,           -- 반(1 ~ 10..)
>   weekday INT NOT NULL,         -- 요일(월:1 ~ 금:5)
>   period INT NOT NULL,          -- 교시(1 ~ 7..)
>   code INT NOT NULL,            -- 시간표코드 (3~4 자리 숫자)
>   teacher VARCHAR(12) NOT NULL, -- 교사명
>   subject VARCHAR(36) NOT NULL  -- 과목명
> );
> ```

> ## 날씨정보 테이블
> * 테이블명 : weather
> * 설명: 시간, 온도, 강수상태, 강수확률, 날씨, 습도, 정보발표시간 저장
> ```sql
> CREATE TABLE weather (
>   _index INT NOT NULL PRIMARY KEY, -- 순번
>   hour INT NOT NULL,               -- 시간
>   temp DOUBLE NOT NULL,            -- 기온(섭씨)
>   pty INT NOT NULL,                -- 강수상태(0: 없음, 1: 비, 2: 비/눈, 3: 눈)
>   pop INT NOT NULL,                -- 강수확률(%)
>   wfKor TEXT NOT NULL,             -- 날씨(맑음, 흐림 등)
>   reh INT NOT NULL,                -- 습도(%)
>   pub TEXT NOT NULL                -- 기상청 발표시간
> );
> ```

> ## 일정정보 테이블
> * 테이블명 : calendar
> * 설명: 이번달의 학교 일정을 저장
> ```sql
> CREATE TABLE calendar (
>   month INT NOT NULL,            -- 달(m)
>   day INT NOT NULL,              -- 일(d)
>   content VARCHAR(50) NOT NULL   -- 일정 내용
> );
> ```