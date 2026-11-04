# 온라인 김장

감나무 아래 한옥 마당에서 다 같이 하는 김장이에요. 설치 없이 브라우저로 들어와서 배추 절이고, 양념 만들고, 속 버무리고, 수육 먹다 가요. 허리는 안 아파요.

**동선**: 입장 화면(오늘 김장 이름) → 한옥 마당 → 바닥을 눌러 걸어가서 `배추 절이기` / `양념 만들기` / `속 버무리기` / `수육 먹기` / `평상`.
화면을 끌면 둘러보고, 휠이나 두 손가락으로 확대해요. 같은 마당에 있는 사람들이 걸어 다니는 모습과 한 일("OO님이 김치 한 쪽 버무렸어요")이 실시간으로 보여요.
채팅은 없고, 몸짓(꾸벅, 손 흔들기, 만세)과 정해진 인사말만 주고받아요. 사람이 없을 때도 이웃 6명(옆집 할머니, 김장 고수 이모, 막내 삼촌, 동네 친구 수진, 통장님, 윗집 새댁)이 마당에서 같이 김장해요.

```
online-kimjang/
├─ server.js        실시간 서버 (마당 채널, 위치·몸짓·한 일 중계, 정적 파일 서빙)
├─ package.json     필요한 라이브러리 목록 (ws 하나)
├─ render.yaml      Render 배포 설정
└─ public/
   ├─ index.html    입장 화면 + 마당 화면
   ├─ game.js       3D 마당, 김장 미니게임, 이웃, 멀티플레이
   └─ favicon.svg   브라우저 탭 아이콘
```

---

## 1. 내 컴퓨터에서 먼저 돌려보기 (선택)

1. [Node.js](https://nodejs.org) LTS 버전 설치
2. 터미널에서 이 폴더로 이동한 뒤:
   ```
   npm install
   npm start
   ```
3. 브라우저에서 `http://localhost:3000` 접속. 창을 두 개 열면 서로 보여요.

## 2. Render에 올리기

1. [render.com](https://render.com) 로그인 (GitHub 계정으로)
2. **New +** → **Blueprint** → `online-kimjang` 저장소 선택 → **Apply**
   - `render.yaml`을 읽어서 설정이 자동으로 채워져요.
   - Blueprint가 안 보이면 **New + → Web Service**로 만들고 Build `npm install`, Start `npm start`를 입력하세요.
3. 몇 분 뒤 `https://online-kimjang.onrender.com` 같은 주소가 생겨요.

> 무료 플랜은 15분 동안 아무도 없으면 서버가 잠들고, 다음 사람이 들어올 때 깨어나는 데 30초~1분 걸려요.
> 릴스 올리기 전에 Render 대시보드에서 **Starter(월 $7)** 로 올리면 항상 켜져 있어요.

## 3. 설정 바꾸기

Render 서비스 → **Environment**에서 바꿀 수 있어요.

| 이름 | 뜻 | 기본값 |
|---|---|---|
| `CHANNELS` | 마당 개수 | 30 |
| `CAPACITY` | 마당당 정원 | 30 |

"오늘 전국 김치" 숫자는 서버 메모리에만 있어서, 재배포하거나 서버가 잠들었다 깨면 0부터 다시 세요.

## 4. 코드 고친 뒤 다시 올리기

GitHub에서 파일을 고쳐서 커밋하면 Render가 자동으로 새 버전을 배포해요.

---

만든 곳: 딴짓연구소 [@ttanjit.lab](https://www.instagram.com/ttanjit.lab)
