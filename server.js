// 온라인 김장 — 실시간 서버
// 정적 파일(public/)을 서빙하고, /ws 로 들어온 접속을 마당(채널)별로 묶어
// 위치·몸짓·한 일(절이기, 양념, 버무리기, 수육)을 중계합니다.
// 채팅은 없어요. 말은 정해진 인사 목록에서만 고를 수 있어요.

const http = require('http');
const fs = require('fs');
const path = require('path');
const { WebSocketServer } = require('ws');

// ---- 설정 (환경변수로 바꿀 수 있어요) ----
const PORT = Number(process.env.PORT) || 3000;
const CHANNELS = Number(process.env.CHANNELS) || 30;  // 마당 개수
const CAPACITY = Number(process.env.CAPACITY) || 30;  // 마당당 정원
const MAX_TOTAL = Number(process.env.MAX_TOTAL) || CHANNELS * CAPACITY;
const PUBLIC_DIR = path.join(__dirname, 'public');
const BOOT_VERSION = Date.now().toString(36);

// 클라이언트와 맞춰야 하는 목록
const ACTS = ['salt', 'sauce', 'mix', 'eat', 'wrap', 'drink'];
const CHEERS = 6;          // 몸짓 3개 + 인사말 3개
const ZONES = ['rest', 'salt', 'sauce', 'mix', 'eat'];
const XY = 120;            // 좌표 범위 (마당 ±12 유닛 × 10)
const COLORS = ['#6c8fb3', '#a66b9e', '#6a994e', '#8d6e63', '#457b9d', '#b56576', '#e07a5f', '#3d8a8a'];

// 오늘 전국에서 버무린 김치 (서버가 다시 켜지면 0부터)
let kimchiTotal = 0, kimchiDirty = false;

// ---- 정적 파일 ----
const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.png': 'image/png', '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.json': 'application/json', '.txt': 'text/plain; charset=utf-8',
};
const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://x');
  if (url.pathname === '/healthz') { res.writeHead(200); return res.end('ok'); }
  if (url.pathname === '/api/status') {
    res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
    return res.end(JSON.stringify(lobbyPayload()));
  }
  let file = decodeURIComponent(url.pathname);
  if (file === '/' || file === '') file = '/index.html';
  const full = path.normalize(path.join(PUBLIC_DIR, file));
  if (!full.startsWith(PUBLIC_DIR)) { res.writeHead(403); return res.end(); }
  fs.readFile(full, (err, data) => {
    if (err) { res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }); return res.end('길을 잃으셨네요. 김장 마당으로 돌아가세요.'); }
    const ext = path.extname(full);
    res.writeHead(200, {
      'Content-Type': MIME[ext] || 'application/octet-stream',
      'Cache-Control': ['.html', '.js', '.css'].includes(ext) ? 'no-cache' : 'public, max-age=3600',
      'X-Content-Type-Options': 'nosniff',
    });
    if (ext === '.html') data = data.toString('utf8').replace(/(["'])\/(game\.js)\1/g, `$1/$2?v=${BOOT_VERSION}$1`);
    res.end(data);
  });
});

// ---- 마당 / 사람 ----
const channels = Array.from({ length: CHANNELS + 1 }, () => new Map()); // 1번부터 사용
const sockets = new Set();
let nextId = 1;

const counts = () => channels.slice(1).map(m => m.size);
const total = () => sockets.size;
const lobbyPayload = () => ({ t: 'lobby', total: total(), cap: CAPACITY, ch: counts(), kimchi: kimchiTotal });
const pub = p => ({ id: p.id, nick: p.nick, color: p.color, x: p.x, z: p.z, zn: p.zn });

function send(ws, msg) { if (ws.readyState === 1) ws.send(typeof msg === 'string' ? msg : JSON.stringify(msg)); }
function toChannel(ch, msg, exceptId) {
  const s = JSON.stringify(msg);
  for (const p of channels[ch].values()) if (p.id !== exceptId) send(p.ws, s);
}
function pickChannel() {
  // 사람이 좀 있는 마당부터 채워서 북적이는 느낌이 나도록
  let best = 0, bestN = -1;
  for (let i = 1; i <= CHANNELS; i++) { const n = channels[i].size; if (n < CAPACITY && n > bestN) { best = i; bestN = n; } }
  return best;
}
function leaveChannel(p) {
  if (!p.ch) return;
  channels[p.ch].delete(p.id);
  toChannel(p.ch, { t: 'leave', id: p.id });
  p.ch = 0;
}
// 이름 검사: 2~8자, 한글·영문·숫자·공백만. 욕설이나 운영자 사칭은 막아요
const BANNED = ['씨발', '시발', 'ㅅㅂ', '병신', 'ㅂㅅ', '개새', '좆', '지랄', '꺼져', '섹스', '자지', '보지', '니미', '애미', '애비', '느금', 'fuck', 'shit', 'sex', 'bitch', '관리자', '운영자', '운영진', 'admin'];
const NPC_NAMES = ['옆집할머니', '김장고수이모', '막내삼촌', '동네친구수진', '통장님', '윗집새댁'];
function cleanNick(raw) {
  if (typeof raw !== 'string') return { err: '이름을 적어 주세요.' };
  const n = raw.normalize('NFC').replace(/\s+/g, ' ').trim();
  if (n.length < 2 || n.length > 8) return { err: '이름은 2~8글자로 정해 주세요.' };
  if (!/^[가-힣a-zA-Z0-9 ]+$/.test(n)) return { err: '한글, 영문, 숫자만 쓸 수 있어요.' };
  const flat = n.replace(/\s/g, '').toLowerCase();
  if (BANNED.some(w => flat.includes(w))) return { err: '쓸 수 없는 단어가 들어 있어요.' };
  if (NPC_NAMES.includes(flat)) return { err: '이웃 이름이랑 겹쳐요. 다른 이름으로 해 주세요.' };
  return { nick: n };
}
const int = (v, lo, hi) => (Number.isInteger(v) && v >= lo && v <= hi) ? v : null;

// ---- 웹소켓 ----
const wss = new WebSocketServer({ server, path: '/ws', maxPayload: 512 });

wss.on('connection', ws => {
  if (total() >= MAX_TOTAL) { send(ws, { t: 'full' }); return ws.close(1013, 'full'); }
  const p = { id: nextId++, nick: '', color: COLORS[Math.random() * COLORS.length | 0], ws, ch: 0, x: 0, z: 60, zn: '',
    tokens: 40, strikes: 0, alive: true, last: {} };
  sockets.add(p);
  send(ws, { ...lobbyPayload(), t: 'hello', id: p.id });

  ws.on('pong', () => { p.alive = true; });
  ws.on('message', raw => {
    if (p.tokens <= 0) { if (++p.strikes > 200) ws.close(1008, 'rate'); return; }
    p.tokens--;
    let m; try { m = JSON.parse(raw); } catch { return; }
    if (!m || typeof m.t !== 'string') return;
    const now = Date.now();
    const cool = (k, ms) => { if (now - (p.last[k] || 0) < ms) return false; p.last[k] = now; return true; };

    switch (m.t) {
      case 'join': {
        const r = cleanNick(m.nick); if (r.err) return send(ws, { t: 'nickerr', msg: r.err });
        let ch = int(m.ch, 0, CHANNELS); if (ch === null) return;
        if (ch === 0 || channels[ch].size >= CAPACITY) ch = pickChannel();
        if (!ch) return send(ws, { t: 'full' });
        leaveChannel(p);
        p.nick = r.nick; p.ch = ch;
        channels[ch].set(p.id, p);
        send(ws, { t: 'joined', ch, cap: CAPACITY, me: pub(p), kimchi: kimchiTotal, players: [...channels[ch].values()].filter(o => o.id !== p.id).map(pub) });
        toChannel(ch, { t: 'enter', p: pub(p) }, p.id);
        break;
      }
      case 'pos': {
        if (!p.ch) return;
        const x = int(m.x, -XY, XY), z = int(m.z, -XY, XY);
        const zn = ZONES.includes(m.zn) ? m.zn : '';
        if (x === null || z === null) return;
        p.x = x; p.z = z; p.zn = zn;
        toChannel(p.ch, { t: 'pos', id: p.id, x, z, zn }, p.id);
        break;
      }
      case 'did': {
        if (!p.ch || !ACTS.includes(m.a) || !cool('did', 600)) return;
        if (m.a === 'mix') { kimchiTotal++; kimchiDirty = true; }
        toChannel(p.ch, { t: 'did', id: p.id, a: m.a }, p.id);
        break;
      }
      case 'help': {
        if (!p.ch || !cool('help', 1500)) return;
        const to = int(m.to, 1, 1e9); const q = to && channels[p.ch].get(to);
        if (!q) return;
        send(q.ws, { t: 'help', from: p.id });
        break;
      }
      case 'cheer': {
        if (!p.ch || !cool('cheer', 800)) return;
        const i = int(m.i, 0, CHEERS - 1); if (i === null) return;
        toChannel(p.ch, { t: 'cheer', id: p.id, i }, p.id);
        break;
      }
      case 'leave': leaveChannel(p); break;
    }
  });
  ws.on('close', () => { leaveChannel(p); sockets.delete(p); });
  ws.on('error', () => {});
});

// 속도 제한 토큰 충전
setInterval(() => { for (const p of sockets) p.tokens = Math.min(40, p.tokens + 20); }, 1000);
// 끊긴 연결 정리
setInterval(() => {
  for (const p of sockets) { if (!p.alive) { p.ws.terminate(); continue; } p.alive = false; try { p.ws.ping(); } catch {} }
}, 30000);
// 마당 현황과 전국 김치 수 알려주기
setInterval(() => {
  const s = JSON.stringify(lobbyPayload());
  for (const p of sockets) send(p.ws, s);
}, 4000);
setInterval(() => {
  if (!kimchiDirty) return; kimchiDirty = false;
  const s = JSON.stringify({ t: 'kimchi', n: kimchiTotal });
  for (const p of sockets) send(p.ws, s);
}, 1500);

server.listen(PORT, () => console.log(`온라인 김장 마당 개장: http://localhost:${PORT}  (마당 ${CHANNELS}개 × 정원 ${CAPACITY}명)`));
