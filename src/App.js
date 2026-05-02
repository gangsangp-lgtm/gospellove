import { useState, useEffect } from "react";

const API_KEY = process.env.REACT_APP_ANTHROPIC_API_KEY || "";

async function ai(prompt, tokens = 800) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": API_KEY,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: tokens,
      messages: [{ role: "user", content: prompt }],
    }),
  });
  const d = await res.json();
  return d.content[0].text.replace(/```json|```/g, "").trim();
}

// ── 날짜를 항상 런타임에 계산 ──
function getTodayStr() {
  const d = new Date();
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, "0"),
    String(d.getDate()).padStart(2, "0"),
  ].join("-");
}
function getTodayKr() {
  const d = new Date();
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`;
}

// ── localStorage에서 오늘 것만 읽고 나머지는 삭제 ──
function readCache(todayStr) {
  try {
    // 오래된 캐시 전부 삭제
    Object.keys(localStorage).forEach((k) => {
      if (k.startsWith("qt_")) localStorage.removeItem(k);
    });
    // 오늘 날짜로 다시 저장된 것 읽기
    const raw = localStorage.getItem(`qt_${todayStr}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed._date !== todayStr) {
      localStorage.removeItem(`qt_${todayStr}`);
      return null;
    }
    return parsed;
  } catch (e) {
    return null;
  }
}

function writeCache(todayStr, data) {
  try {
    // 다른 날짜 캐시 삭제 후 저장
    Object.keys(localStorage).forEach((k) => {
      if (k.startsWith("qt_")) localStorage.removeItem(k);
    });
    localStorage.setItem(`qt_${todayStr}`, JSON.stringify({ ...data, _date: todayStr }));
  } catch (e) {}
}

const FALLBACK = {
  season: "성령강림절 후",
  seasonEmoji: "🌿",
  seasonColor: "#2d6a4f",
  passage: "시편 23:1-6",
  theme: "하나님이 나를 돌봐주세요",
  verse: '"주님은 나의 목자시니, 내게 부족함이 없습니다. 그가 나를 푸른 풀밭에 누이시며, 잔잔한 물가로 인도하십니다." — 시편 23:1-2 (새번역)',
  explain: "시편 23편은 다윗이 쓴 아주 유명한 노래예요. 하나님을 목자, 우리를 양으로 비유했어요. 목자는 양에게 먹을 풀과 마실 물을 찾아주고 위험에서 지켜줘요. 하나님도 꼭 그렇게 우리를 돌봐주세요!",
};

const TYPE = { 말씀이해: "📖 말씀 이해", 말씀의미: "💎 말씀의 의미", 삶적용: "🌱 삶에 적용" };

export default function App() {
  const [tab, setTab] = useState(0);
  const [day, setDay] = useState(null);
  const [dayLoading, setDayLoading] = useState(true);
  const [qt, setQt] = useState(null);
  const [qtLoading, setQtLoading] = useState(false);
  const [ans, setAns] = useState({ o: "", a: "", p: "" });
  const [quiz, setQuiz] = useState(null);
  const [quizLoading, setQuizLoading] = useState(false);
  const [qi, setQi] = useState(0);
  const [chosen, setChosen] = useState(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const streak = parseInt(localStorage.getItem("qt_streak") || "1");

  // 날짜는 state로 관리 — 컴포넌트 마운트 시 계산
  const [todayStr] = useState(() => getTodayStr());
  const [todayKr] = useState(() => getTodayKr());

  useEffect(() => {
    // 1. 캐시 확인
    const cached = readCache(todayStr);
    if (cached) {
      setDay(cached);
      setDayLoading(false);
      return;
    }

    // 2. AI 호출
    ai(
      `오늘 날짜: ${todayStr}
한국 개신교 교회력 기준으로 이 날짜에 맞는 초등학생 큐티 콘텐츠를 만들어줘.

교회력 절기 계산 기준:
- 2026년 부활절 = 4월 5일
- 성령강림절 = 부활절 후 50일 (2026년 5월 24일)
- 대림절 = 성탄절(12/25) 전 4번째 일요일부터
- 사순절 = 부활절 46일 전부터
- 나머지 = 성령강림절 후 (연중절기)

반드시 JSON만 반환 (다른 텍스트 절대 없이):
{
  "season": "절기이름",
  "seasonEmoji": "이모지1개",
  "seasonColor": "#16진수색상",
  "passage": "성경책 장:절-절",
  "theme": "오늘주제 (10자 이내)",
  "verse": "새번역 성경 본문 2~3절 (따옴표 포함)",
  "explain": "초등학교 2~4학년이 이해할 수 있는 쉬운 설명 3문장"
}`,
      700
    )
      .then((t) => {
        const parsed = JSON.parse(t);
        writeCache(todayStr, parsed);
        setDay(parsed);
      })
      .catch(() => setDay(FALLBACK))
      .finally(() => setDayLoading(false));
  }, [todayStr]);

  function goTab(i) {
    if (!day) return;
    setTab(i);

    if (i === 1 && !qt && !qtLoading) {
      setQtLoading(true);
      ai(
        `초등학생(2~4학년) 큐티 선생님이야.
날짜: ${todayStr}, 절기: ${day.season}
본문: ${day.passage}, 주제: "${day.theme}"
말씀: "${day.verse}"

JSON만 반환:
{"observe":"관찰질문(누가무엇을어떻게)","apply":"적용질문(오늘실천)","prayer":"기도예시문장"}`,
        400
      )
        .then((t) => setQt(JSON.parse(t)))
        .catch(() =>
          setQt({
            observe: `오늘 말씀 ${day.passage}에서 누가 나왔나요? 어떤 일이 있었나요?`,
            apply: "오늘 말씀을 생각하며 내가 실천할 수 있는 것을 한 가지 써봐요!",
            prayer: "하나님, 오늘 말씀대로 살 수 있도록 도와주세요. 예수님 이름으로 기도합니다. 아멘.",
          })
        )
        .finally(() => setQtLoading(false));
    }

    if (i === 2 && !quiz && !quizLoading) {
      setQuizLoading(true);
      ai(
        `초등학생(2~4학년) 성경퀴즈 선생님이야.
본문: ${day.passage}, 말씀: "${day.verse}"

4지선다 3문제. JSON만 반환:
[
  {"type":"말씀이해","q":"본문사건질문","choices":["보기1","보기2","보기3","보기4"],"answer":0,"hint":"정답이유"},
  {"type":"말씀의미","q":"교훈질문","choices":["보기1","보기2","보기3","보기4"],"answer":1,"hint":"정답이유"},
  {"type":"삶적용","q":"일상상황질문","choices":["보기1","보기2","보기3","보기4"],"answer":2,"hint":"정답이유"}
]`,
        700
      )
        .then((t) => setQuiz(JSON.parse(t)))
        .catch(() =>
          setQuiz([
            { type: "말씀이해", q: `오늘 말씀 ${day.passage}에서 일어난 일은?`, choices: ["하나님이 도와주셨어요", "아무 일 없었어요", "다들 도망갔어요", "예수님이 화내셨어요"], answer: 0, hint: "오늘 말씀을 다시 읽어봐요!" },
            { type: "말씀의미", q: "오늘 말씀의 교훈은?", choices: ["힘이 세야 해요", "예수님이 우릴 사랑해요", "교회 안 가도 돼요", "기도는 소용없어요"], answer: 1, hint: "예수님은 항상 우리 곁에 계세요!" },
            { type: "삶적용", q: "친구가 슬퍼해요. 나는?", choices: ["옆에서 위로해줘요", "모른 척해요", "놀려요", "그냥 가요"], answer: 0, hint: "예수님처럼 곁에 있어주는 게 사랑이에요!" },
          ])
        )
        .finally(() => setQuizLoading(false));
    }
  }

  function pick(i) {
    if (chosen !== null || !quiz) return;
    if (i === quiz[qi].answer) setScore((s) => s + 1);
    setChosen(i);
    setTimeout(() => {
      if (qi + 1 >= quiz.length) {
        setDone(true);
        localStorage.setItem("qt_streak", String(streak + 1));
      } else {
        setQi((q) => q + 1);
        setChosen(null);
      }
    }, 2000);
  }

  const c = day?.seasonColor || "#2d6a4f";

  return (
    <div style={{ fontFamily: "'Nanum Gothic',system-ui,sans-serif", background: "#fffdf7", minHeight: "100vh", maxWidth: 420, margin: "0 auto" }}>
      {/* 헤더 */}
      <div style={{ background: c, padding: "20px 20px 26px", borderRadius: "0 0 28px 28px", transition: "background .5s", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: -40, right: -40, width: 160, height: 160, background: "rgba(255,255,255,.08)", borderRadius: "50%" }} />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <b style={{ fontFamily: "Jua,sans-serif", color: "white", fontSize: 21 }}>🌱 말씀 나무</b>
          <span style={{ background: "rgba(255,255,255,.2)", color: "white", padding: "5px 11px", borderRadius: 18, fontSize: 13, fontWeight: 700 }}>🔥 {streak}일째</span>
        </div>
        <div style={{ color: "rgba(255,255,255,.8)", fontSize: 13, marginBottom: 4 }}>{todayKr}</div>
        <div style={{ display: "inline-block", background: "rgba(255,255,255,.22)", color: "white", padding: "3px 11px", borderRadius: 10, fontSize: 12, fontWeight: 700, marginBottom: 8 }}>
          {day ? `${day.seasonEmoji} ${day.season}` : "⏳ 불러오는 중..."}
        </div>
        <div style={{ color: "rgba(255,255,255,.7)", fontSize: 11, marginBottom: 3 }}>오늘의 말씀</div>
        <div style={{ fontFamily: "Jua,sans-serif", color: "white", fontSize: 18 }}>{day?.passage || "잠깐만요..."}</div>
      </div>

      {/* 탭 */}
      <div style={{ display: "flex", gap: 6, padding: "14px 14px 0" }}>
        {["📖 말씀", "🙏 묵상", "🎯 퀴즈"].map((l, i) => (
          <button key={i} onClick={() => goTab(i)}
            style={{ flex: 1, padding: "9px 0", border: "none", borderRadius: "14px 14px 0 0", background: tab === i ? "white" : "#f0ebe0", color: tab === i ? c : "#999", fontWeight: 700, fontSize: 13, cursor: day ? "pointer" : "default", opacity: !day && i > 0 ? 0.4 : 1, boxShadow: tab === i ? "0 -3px 10px rgba(0,0,0,.06)" : "none" }}>
            {l}
          </button>
        ))}
      </div>

      {/* 콘텐츠 */}
      <div style={{ background: "white", margin: "0 14px", borderRadius: "0 0 22px 22px", padding: 18, boxShadow: "0 4px 18px rgba(0,0,0,.06)", minHeight: 420 }}>

        {/* 말씀 탭 */}
        {tab === 0 && (dayLoading ? (
          <Spin c={c} msg="오늘의 말씀 준비 중 🌱" />
        ) : day && (
          <div>
            <div style={{ background: "linear-gradient(135deg,#fff8e8,#fff)", border: "1.5px solid #f0d080", borderRadius: 14, padding: 13, marginBottom: 12 }}>
              <div style={{ fontSize: 10, color: "#c89020", fontWeight: 800, letterSpacing: 1, marginBottom: 3 }}>오늘의 주제</div>
              <div style={{ fontFamily: "Jua,sans-serif", fontSize: 16, color: "#333" }}>{day.theme}</div>
            </div>
            <div style={{ background: "#f5f0e8", borderLeft: `4px solid ${c}`, borderRadius: "0 14px 14px 0", padding: 14, marginBottom: 12 }}>
              <span style={{ background: c, color: "white", fontSize: 9, fontWeight: 800, padding: "2px 7px", borderRadius: 7, marginBottom: 7, display: "inline-block" }}>새번역 성경</span>
              <div style={{ fontSize: 15, lineHeight: 1.9, color: "#333" }}>{day.verse}</div>
              <div style={{ fontSize: 11, color: "#aaa", textAlign: "right", marginTop: 6 }}>— {day.passage} (새번역)</div>
            </div>
            <div style={{ background: "linear-gradient(135deg,#f0f8ff,#e8f4ff)", border: "1.5px solid #b8d8f8", borderRadius: 14, padding: 13, marginBottom: 14 }}>
              <div style={{ fontSize: 10, color: "#3a80c0", fontWeight: 800, letterSpacing: 1, marginBottom: 5 }}>🔍 쉽게 알아봐요</div>
              <div style={{ fontSize: 14, lineHeight: 1.8, color: "#2a4a6a" }}>{day.explain}</div>
            </div>
            <button onClick={() => goTab(1)} style={{ width: "100%", padding: 14, border: "none", borderRadius: 18, background: c, color: "white", fontFamily: "Jua,sans-serif", fontSize: 16, cursor: "pointer" }}>
              📝 묵상 질문 보러 가기 →
            </button>
          </div>
        ))}

        {/* 묵상 탭 */}
        {tab === 1 && (qtLoading || !qt ? <Spin c={c} msg="묵상 질문 만드는 중..." /> : (
          <div>
            {[{ icon: "👀", title: "관찰해요", q: qt.observe, k: "o", ph: "말씀에서 찾은 것을 써봐요 ✏️" },
              { icon: "💡", title: "적용해요", q: qt.apply, k: "a", ph: "내 생각을 써봐요 💭" }].map(({ icon, title, q, k, ph }) => (
              <div key={k} style={{ marginBottom: 18 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 7, fontWeight: 800, fontSize: 14, color: c, marginBottom: 7 }}>
                  <div style={{ width: 26, height: 26, background: c, color: "white", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13 }}>{icon}</div>{title}
                </div>
                <div style={{ background: "#f5f0e8", borderRadius: 12, padding: 12, fontSize: 14, lineHeight: 1.7, color: "#444", marginBottom: 6 }}>{q}</div>
                <textarea value={ans[k]} onChange={e => setAns(a => ({ ...a, [k]: e.target.value }))} rows={3} placeholder={ph}
                  style={{ width: "100%", border: "2px solid #eee", borderRadius: 12, padding: 10, fontSize: 14, resize: "none", color: "#333", background: "#fafafa" }} />
              </div>
            ))}
            <div style={{ marginBottom: 18 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 7, fontWeight: 800, fontSize: 14, color: c, marginBottom: 7 }}>
                <div style={{ width: 26, height: 26, background: c, color: "white", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13 }}>🙏</div>기도해요
              </div>
              <div style={{ background: "#fff8e8", borderRadius: 10, padding: 9, fontSize: 12, color: "#a07020", marginBottom: 6, lineHeight: 1.6 }}>💛 예시: {qt.prayer}</div>
              <textarea value={ans.p} onChange={e => setAns(a => ({ ...a, p: e.target.value }))} rows={2} placeholder="나만의 기도 🙏"
                style={{ width: "100%", border: "2px solid #eee", borderRadius: 12, padding: 10, fontSize: 14, resize: "none", color: "#333", background: "#fafafa" }} />
            </div>
            <button onClick={() => goTab(2)} style={{ width: "100%", padding: 13, border: "none", borderRadius: 16, background: c, color: "white", fontFamily: "Jua,sans-serif", fontSize: 15, cursor: "pointer" }}>🎯 퀴즈 풀러 가기 →</button>
          </div>
        ))}

        {/* 퀴즈 탭 */}
        {tab === 2 && (quizLoading || !quiz ? <Spin c={c} msg="퀴즈 만드는 중..." /> : done ? (
          <div style={{ textAlign: "center", paddingTop: 16 }}>
            <div style={{ fontSize: 36, animation: "pop .4s ease", marginBottom: 8 }}>{["💪", "⭐", "⭐⭐", "⭐⭐⭐"][score]}</div>
            <b style={{ fontFamily: "Jua,sans-serif", fontSize: 20, color: c }}>{score}문제 맞았어요!</b>
            <div style={{ color: "#888", fontSize: 13, marginBottom: 20, marginTop: 4 }}>
              {score === 3 ? "완벽해요! 말씀 박사 🎊" : score === 2 ? "잘했어요! 😊" : "다시 한번 읽어봐요 💪"}
            </div>
            <div style={{ fontSize: 52, animation: "bob 1s ease infinite alternate", marginBottom: 10 }}>🌳</div>
            <b style={{ fontFamily: "Jua,sans-serif", fontSize: 20, color: c, display: "block", marginBottom: 6 }}>오늘 큐티 완료!</b>
            <div style={{ color: "#888", fontSize: 13, lineHeight: 1.7, marginBottom: 18 }}>말씀 나무가 쑥쑥 자라고 있어요!<br />내일도 함께 말씀 읽어요 🙏</div>
            <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
              {[["🔥" + (streak + 1), "연속 큐티"], ["⭐" + score + "/3", "오늘 퀴즈"]].map(([n, l]) => (
                <div key={l} style={{ background: "#f5f0e8", borderRadius: 14, padding: "12px 18px", textAlign: "center" }}>
                  <div style={{ fontFamily: "Jua,sans-serif", fontSize: 22, color: c }}>{n}</div>
                  <div style={{ fontSize: 11, color: "#aaa" }}>{l}</div>
                </div>
              ))}
            </div>
          </div>
        ) : (() => {
          const q = quiz[qi];
          return (
            <div>
              <div style={{ textAlign: "center", marginBottom: 14 }}>
                <b style={{ fontFamily: "Jua,sans-serif", fontSize: 17, color: c }}>🎯 성경 퀴즈</b>
                <div style={{ display: "flex", gap: 5, justifyContent: "center", marginTop: 7 }}>
                  {quiz.map((_, i) => <div key={i} style={{ width: 9, height: 9, borderRadius: "50%", background: i <= qi ? c : "#ddd", opacity: i === qi ? 0.5 : 1 }} />)}
                </div>
              </div>
              <div style={{ background: "#f5f0e8", borderRadius: 18, padding: 18 }}>
                <span style={{ background: c, color: "white", fontSize: 9, fontWeight: 800, padding: "2px 9px", borderRadius: 9, marginBottom: 8, display: "inline-block" }}>{TYPE[q.type] || q.type}</span>
                <div style={{ fontSize: 14, lineHeight: 1.75, color: "#333", marginBottom: 14 }}>{qi + 1}. {q.q}</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                  {q.choices.map((ch, i) => {
                    const right = i === q.answer, picked = i === chosen;
                    let bg = "white", bd = "2px solid #e0e0e0", nb = "#f0ebe0", nc = "#888";
                    if (chosen !== null) {
                      if (right) { bg = "#f0fff0"; bd = "2px solid #4caf50"; nb = "#4caf50"; nc = "white"; }
                      else if (picked) { bg = "#fff0f0"; bd = "2px solid #f44"; nb = "#f44"; nc = "white"; }
                    }
                    return (
                      <button key={i} onClick={() => pick(i)} disabled={chosen !== null}
                        style={{ width: "100%", padding: "11px 14px", border: bd, borderRadius: 12, background: bg, fontSize: 13, color: "#333", cursor: chosen !== null ? "default" : "pointer", textAlign: "left", display: "flex", alignItems: "center", gap: 9, lineHeight: 1.5, transition: "all .2s" }}>
                        <span style={{ minWidth: 24, height: 24, borderRadius: "50%", background: nb, color: nc, fontWeight: 800, fontSize: 12, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{"①②③④"[i]}</span>
                        <span>{ch}</span>
                      </button>
                    );
                  })}
                </div>
                {chosen !== null && (
                  <div style={{ background: "#fff8e8", border: "1.5px solid #f0d080", borderRadius: 10, padding: 10, fontSize: 12, color: "#a07020", marginTop: 10, lineHeight: 1.6 }}>
                    {chosen === q.answer ? "🎉 정답이에요! " : `😢 정답은 ${"①②③④"[q.answer]}번이에요. `}{q.hint}
                  </div>
                )}
              </div>
            </div>
          );
        })())}
      </div>
      <div style={{ height: 20 }} />
    </div>
  );
}

function Spin({ c, msg }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 300, gap: 14, textAlign: "center" }}>
      <div style={{ width: 44, height: 44, border: "5px solid #eee", borderTopColor: c, borderRadius: "50%", animation: "spin .9s linear infinite" }} />
      <b style={{ color: c, fontSize: 16 }}>{msg}</b>
    </div>
  );
}
