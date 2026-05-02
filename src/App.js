import { useState, useEffect } from "react";

const API_KEY = process.env.REACT_APP_ANTHROPIC_API_KEY || "";

async function ai(prompt, tokens = 1000) {
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

function getTodayStr() {
  const d = new Date();
  return [d.getFullYear(), String(d.getMonth()+1).padStart(2,"0"), String(d.getDate()).padStart(2,"0")].join("-");
}
function getTodayKr() {
  const d = new Date();
  return `${d.getFullYear()}년 ${d.getMonth()+1}월 ${d.getDate()}일`;
}
function readCache(todayStr) {
  try {
    const raw = localStorage.getItem(`qt_${todayStr}`);
    if (!raw) return null;
    const p = JSON.parse(raw);
    if (p._date !== todayStr) { localStorage.removeItem(`qt_${todayStr}`); return null; }
    return p;
  } catch(e) { return null; }
}
function writeCache(todayStr, data) {
  try {
    Object.keys(localStorage).forEach(k => {
      if (k.startsWith("qt_") && k !== `qt_${todayStr}` && k !== "qt_streak") localStorage.removeItem(k);
    });
    localStorage.setItem(`qt_${todayStr}`, JSON.stringify({ ...data, _date: todayStr }));
  } catch(e) {}
}

const FALLBACK = {
  season:"성령강림절 후", seasonEmoji:"🌿", seasonColor:"#2d6a4f",
  passage:"시편 23:1-6", theme:"하나님이 나를 돌봐주세요",
  verse:`"주님은 나의 목자시니, 내게 부족함이 없습니다. 그가 나를 푸른 풀밭에 누이시며, 잔잔한 물가로 인도하십니다. 그가 내 영혼을 소생시키시고, 자기 이름을 위하여 의의 길로 나를 인도하십니다. 내가 비록 사망의 음침한 골짜기로 다닐지라도 해를 두려워하지 않을 것은 주께서 나와 함께 하심이라. 주의 지팡이와 막대기가 나를 안위하시나이다. 주께서 내 원수의 목전에서 내게 상을 차려 주시고, 기름을 내 머리에 부으셨으니 내 잔이 넘칩니다. 내 평생에 선하심과 인자하심이 반드시 나를 따르리니 내가 여호와의 집에 영원히 살리로다." — 시편 23:1-6 (새번역)`,
  memVerse:`"주님은 나의 목자시니, 내게 부족함이 없습니다." — 시편 23:1`,
  explain:`오늘 많이 지치셨나요? 혼자 다 감당해야 할 것 같아 버거우신가요? 시편 23편을 쓴 다윗도 수많은 두려움과 어려움 속에 살았지만, 하나님이 목자처럼 자신을 돌봐주신다는 사실을 굳게 믿었어요. 목자는 양이 부탁하지 않아도 먼저 풀밭과 물가로 데려가요. 하나님도 바로 그렇게 우리가 미처 말하지 않아도 우리에게 필요한 것을 아시고 채워주세요. '사망의 음침한 골짜기'처럼 정말 무섭고 막막한 상황에서도 하나님은 우리 곁을 떠나지 않으세요. 오늘 하루, 내 힘이 아닌 하나님의 손을 잡고 걸어가 보세요. 그분이 반드시 이끌어주실 거예요.`
};

const TYPE = { 말씀이해:"📖 말씀 이해", 말씀의미:"💎 말씀의 의미", 삶적용:"🌱 삶에 적용", 믿음확인:"✝️ 믿음 확인", 창의적용:"💬 생각해봐요" };

export default function App() {
  const [tab, setTab] = useState(0);
  const [day, setDay] = useState(null);
  const [dayLoading, setDayLoading] = useState(true);
  const [qt, setQt] = useState(null);
  const [qtLoading, setQtLoading] = useState(false);
  const [quiz, setQuiz] = useState(null);
  const [quizLoading, setQuizLoading] = useState(false);
  const [qi, setQi] = useState(0);
  const [chosen, setChosen] = useState(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const [memCopied, setMemCopied] = useState(false);
  const streak = parseInt(localStorage.getItem("qt_streak") || "1");
  const [todayStr] = useState(() => getTodayStr());
  const [todayKr] = useState(() => getTodayKr());

  useEffect(() => {
    const cached = readCache(todayStr);
    if (cached) { setDay(cached); setDayLoading(false); return; }
    ai(`오늘 날짜: ${todayStr}
한국 개신교 교회력 기준 초등학생/성인 큐티 콘텐츠.
2026년: 부활절=4월5일, 성령강림절=5월24일, 대림절=11월29일.

반드시 JSON만 반환 (다른 텍스트 없이):
{
  "season": "절기이름",
  "seasonEmoji": "이모지1개",
  "seasonColor": "#hex색상",
  "passage": "성경책 장:절-절",
  "theme": "오늘주제 (10자이내)",
  "verse": "새번역 성경 해당 구절 전체 본문 (생략 없이 전부, 절번호 포함)",
  "memVerse": "오늘 암송 핵심 구절 한 문장 (출처 포함, 예: '주님은 나의 목자시니 내게 부족함이 없습니다. — 시편 23:1')",
  "explain": "5~6문장. 현대인의 지침과 피로감에 공감하면서 시작하고, 말씀 배경과 내용을 쉽게 설명하고, 하나님께 의지하면 된다는 따뜻한 격려와 힘이 되는 메시지로 마무리. 초등학생도 이해할 수 있는 쉬운 말로."
}`, 1000)
      .then(t => { const p = JSON.parse(t); writeCache(todayStr, p); setDay(p); })
      .catch(() => setDay(FALLBACK))
      .finally(() => setDayLoading(false));
  }, [todayStr]);

  function goTab(i) {
    if (!day) return;
    setTab(i);
    if (i === 1 && !qt && !qtLoading) {
      setQtLoading(true);
      ai(`초등학생(2~4학년) 큐티 선생님.
절기: ${day.season}, 본문: ${day.passage}
주제: "${day.theme}", 말씀: "${day.verse}"

오늘 말씀 적용 질문 1개 + 초등학생 일상 예시 2개 + 기도 예시 1개.
예시는 학교/집/친구관계에서 실제로 할 수 있는 구체적인 행동으로.

JSON만 반환:
{
  "applyQ": "적용 질문 (오늘 ~하려면 어떻게 할 수 있을까요? 형식)",
  "example1": "예시1 (이모지+구체적행동, 1~2문장)",
  "example2": "예시2 (이모지+구체적행동, 1~2문장)",
  "prayer": "기도 예시 (2~3문장, 따뜻하고 솔직하게)"
}`, 500)
        .then(t => setQt(JSON.parse(t)))
        .catch(() => setQt({
          applyQ:"오늘 말씀처럼 하나님을 믿고 의지하려면 어떻게 할 수 있을까요?",
          example1:"💡 걱정되는 일이 생기면 먼저 '하나님, 도와주세요'라고 짧게 기도해봐요",
          example2:"💡 친구가 힘들어할 때 '내가 옆에 있을게'라고 말해줘요",
          prayer:"하나님, 오늘도 제 목자가 되어주세요. 제 힘으로 안 될 때 하나님을 의지하게 해주세요. 예수님 이름으로 기도합니다. 아멘."
        }))
        .finally(() => setQtLoading(false));
    }
    if (i === 2 && !quiz && !quizLoading) {
      setQuizLoading(true);
      ai(`초등학생(2~4학년) 성경퀴즈.
본문: ${day.passage}, 절기: ${day.season}
말씀: "${day.verse}", 주제: "${day.theme}"

3지선다 퀴즈 5문제. 유형: 말씀이해×2, 말씀의미×1, 삶적용×1, 창의적용×1.
선택지 3개. answer는 0~2 인덱스. 힌트는 말씀 인용하며 친절하게.

JSON만 반환:
[
  {"type":"말씀이해","q":"문제","choices":["보기1","보기2","보기3"],"answer":0,"hint":"힌트"},
  {"type":"말씀이해","q":"문제","choices":["보기1","보기2","보기3"],"answer":1,"hint":"힌트"},
  {"type":"말씀의미","q":"문제","choices":["보기1","보기2","보기3"],"answer":2,"hint":"힌트"},
  {"type":"삶적용","q":"문제","choices":["보기1","보기2","보기3"],"answer":0,"hint":"힌트"},
  {"type":"창의적용","q":"문제","choices":["보기1","보기2","보기3"],"answer":1,"hint":"힌트"}
]`, 900)
        .then(t => setQuiz(JSON.parse(t)))
        .catch(() => setQuiz([
          {type:"말씀이해",q:"시편 23편에서 하나님은 무엇으로 비유되었나요?",choices:["목자","왕","선생님"],answer:0,hint:"'주님은 나의 목자시니'라고 시작해요!"},
          {type:"말씀이해",q:"목자는 양을 어디로 인도하나요?",choices:["사막으로","푸른 풀밭과 잔잔한 물가로","높은 산으로"],answer:1,hint:"'푸른 풀밭에 누이시며 잔잔한 물가로 인도하십니다'예요!"},
          {type:"말씀의미",q:"'내게 부족함이 없습니다'가 뜻하는 것은?",choices:["내가 부자예요","하나님이 필요한 것을 다 채워주세요","아무것도 필요없어요"],answer:1,hint:"하나님이 목자처럼 우리에게 필요한 것을 다 아시고 돌봐주세요!"},
          {type:"삶적용",q:"무섭고 힘든 일이 생겼을 때 나는?",choices:["하나님께 기도해요","혼자 다 해결해요","포기해요"],answer:0,hint:"'사망의 음침한 골짜기에서도 해를 두려워 않음은 주께서 함께하심이라'예요!"},
          {type:"창의적용",q:"내가 하나님의 양이라면 오늘 하나님께 뭐라고 할까요?",choices:["감사해요, 늘 함께해주셔서!","저 혼자도 잘할 수 있어요","왜 저를 돌봐주시나요?"],answer:0,hint:"하나님은 우리를 사랑하셔서 항상 함께하세요. 감사 마음을 전해봐요!"}
        ]))
        .finally(() => setQuizLoading(false));
    }
  }

  function pick(i) {
    if (chosen !== null || !quiz) return;
    if (i === quiz[qi].answer) setScore(s => s+1);
    setChosen(i);
    setTimeout(() => {
      if (qi+1 >= quiz.length) { setDone(true); localStorage.setItem("qt_streak", String(streak+1)); }
      else { setQi(q => q+1); setChosen(null); }
    }, 2200);
  }

  const c = day?.seasonColor || "#2d6a4f";

  return (
    <div style={{fontFamily:"'Nanum Gothic',system-ui,sans-serif",background:"#fffdf7",minHeight:"100vh",maxWidth:420,margin:"0 auto"}}>

      {/* 헤더 */}
      <div style={{background:c,padding:"20px 20px 26px",borderRadius:"0 0 28px 28px",transition:"background .5s",position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",top:-40,right:-40,width:160,height:160,background:"rgba(255,255,255,.08)",borderRadius:"50%"}}/>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
          <b style={{fontFamily:"Jua,sans-serif",color:"white",fontSize:21}}>🌱 말씀 나무</b>
          <span style={{background:"rgba(255,255,255,.2)",color:"white",padding:"5px 11px",borderRadius:18,fontSize:13,fontWeight:700}}>🔥 {streak}일째</span>
        </div>
        <div style={{color:"rgba(255,255,255,.8)",fontSize:13,marginBottom:4}}>{todayKr}</div>
        <div style={{display:"inline-block",background:"rgba(255,255,255,.22)",color:"white",padding:"3px 11px",borderRadius:10,fontSize:12,fontWeight:700,marginBottom:8}}>
          {day ? `${day.seasonEmoji} ${day.season}` : "⏳ 불러오는 중..."}
        </div>
        <div style={{color:"rgba(255,255,255,.7)",fontSize:11,marginBottom:3}}>오늘의 말씀</div>
        <div style={{fontFamily:"Jua,sans-serif",color:"white",fontSize:18}}>{day?.passage || "잠깐만요..."}</div>
      </div>

      {/* 탭 */}
      <div style={{display:"flex",gap:6,padding:"14px 14px 0"}}>
        {["📖 말씀","🙏 묵상","🎯 퀴즈"].map((l,i)=>(
          <button key={i} onClick={()=>goTab(i)} style={{flex:1,padding:"9px 0",border:"none",borderRadius:"14px 14px 0 0",background:tab===i?"white":"#f0ebe0",color:tab===i?c:"#999",fontWeight:700,fontSize:13,cursor:day?"pointer":"default",opacity:!day&&i>0?.4:1,boxShadow:tab===i?"0 -3px 10px rgba(0,0,0,.06)":"none"}}>{l}</button>
        ))}
      </div>

      {/* 콘텐츠 */}
      <div style={{background:"white",margin:"0 14px",borderRadius:"0 0 22px 22px",padding:18,boxShadow:"0 4px 18px rgba(0,0,0,.06)",minHeight:420}}>

        {/* ── 말씀 탭 ── */}
        {tab===0 && (dayLoading ? <Spin c={c} msg="오늘의 말씀 준비 중 🌱"/> : day && (
          <div>
            {/* 주제 */}
            <div style={{background:"linear-gradient(135deg,#fff8e8,#fff)",border:"1.5px solid #f0d080",borderRadius:14,padding:13,marginBottom:12}}>
              <div style={{fontSize:10,color:"#c89020",fontWeight:800,letterSpacing:1,marginBottom:3}}>오늘의 주제</div>
              <div style={{fontFamily:"Jua,sans-serif",fontSize:16,color:"#333"}}>{day.theme}</div>
            </div>

            {/* 말씀 전체 */}
            <div style={{background:"#f5f0e8",borderLeft:`4px solid ${c}`,borderRadius:"0 14px 14px 0",padding:14,marginBottom:12}}>
              <span style={{background:c,color:"white",fontSize:9,fontWeight:800,padding:"2px 7px",borderRadius:7,marginBottom:8,display:"inline-block"}}>새번역 성경</span>
              <div style={{fontSize:14,lineHeight:2.0,color:"#333",whiteSpace:"pre-line"}}>{day.verse}</div>
              <div style={{fontSize:11,color:"#aaa",textAlign:"right",marginTop:6}}>— {day.passage} (새번역)</div>
            </div>

            {/* 오늘의 암송 */}
            <div style={{background:`linear-gradient(135deg,${c}22,${c}11)`,border:`1.5px solid ${c}44`,borderRadius:14,padding:14,marginBottom:12,position:"relative"}}>
              <div style={{fontSize:10,color:c,fontWeight:800,letterSpacing:1,marginBottom:6}}>📣 오늘의 암송</div>
              <div style={{fontSize:15,lineHeight:1.8,color:"#333",fontWeight:700,fontStyle:"italic"}}>{day.memVerse}</div>
              <button
                onClick={()=>{ navigator.clipboard?.writeText(day.memVerse); setMemCopied(true); setTimeout(()=>setMemCopied(false),2000); }}
                style={{marginTop:10,padding:"5px 12px",border:`1.5px solid ${c}`,borderRadius:10,background:"white",color:c,fontSize:12,fontWeight:700,cursor:"pointer"}}>
                {memCopied ? "✅ 복사됐어요!" : "📋 복사하기"}
              </button>
            </div>

            {/* 함께 알아봐요 */}
            <div style={{background:"linear-gradient(135deg,#f0f8ff,#e8f4ff)",border:"1.5px solid #b8d8f8",borderRadius:14,padding:14,marginBottom:14}}>
              <div style={{fontSize:10,color:"#3a80c0",fontWeight:800,letterSpacing:1,marginBottom:6}}>🔍 함께 알아봐요</div>
              <div style={{fontSize:14,lineHeight:1.9,color:"#2a4a6a"}}>{day.explain}</div>
            </div>

            <button onClick={()=>goTab(1)} style={{width:"100%",padding:14,border:"none",borderRadius:18,background:c,color:"white",fontFamily:"Jua,sans-serif",fontSize:16,cursor:"pointer",boxShadow:`0 4px 14px ${c}44`}}>
              📝 묵상하러 가기 →
            </button>
          </div>
        ))}

        {/* ── 묵상 탭 ── */}
        {tab===1 && (qtLoading||!qt ? <Spin c={c} msg="묵상 내용 만드는 중..."/> : (
          <div>
            {/* 적용 질문 */}
            <div style={{marginBottom:20}}>
              <div style={{display:"flex",alignItems:"center",gap:7,fontWeight:800,fontSize:15,color:c,marginBottom:10}}>
                <div style={{width:28,height:28,background:c,color:"white",borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14}}>💡</div>
                오늘 말씀 적용해요
              </div>
              <div style={{background:"#f5f0e8",borderRadius:14,padding:14,fontSize:15,lineHeight:1.8,color:"#333",marginBottom:12}}>
                {qt.applyQ}
              </div>
              {/* 예시 2개 */}
              {[qt.example1, qt.example2].map((ex,i)=>(
                <div key={i} style={{background:i===0?"linear-gradient(135deg,#f0fff4,#e6ffed)":"linear-gradient(135deg,#f0f4ff,#e6edff)",border:i===0?"1.5px solid #b8f0c8":"1.5px solid #b8c8f0",borderRadius:12,padding:12,marginBottom:8,fontSize:14,lineHeight:1.7,color:"#333"}}>
                  {ex}
                </div>
              ))}
            </div>

            {/* 기도해요 */}
            <div style={{marginBottom:20}}>
              <div style={{display:"flex",alignItems:"center",gap:7,fontWeight:800,fontSize:15,color:c,marginBottom:10}}>
                <div style={{width:28,height:28,background:c,color:"white",borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14}}>🙏</div>
                기도해요
              </div>
              <div style={{background:"linear-gradient(135deg,#fff8e8,#fff8f0)",border:"1.5px solid #f0d080",borderRadius:14,padding:14,fontSize:14,lineHeight:1.9,color:"#7a5010",fontStyle:"italic"}}>
                {qt.prayer}
              </div>
            </div>

            {/* 암송 카드 */}
            <div style={{background:`linear-gradient(135deg,${c}18,${c}08)`,border:`1.5px solid ${c}33`,borderRadius:14,padding:13,marginBottom:16,textAlign:"center"}}>
              <div style={{fontSize:10,color:c,fontWeight:800,letterSpacing:1,marginBottom:6}}>📣 오늘의 암송 구절</div>
              <div style={{fontSize:14,fontWeight:700,color:"#333",lineHeight:1.7}}>{day.memVerse}</div>
            </div>

            <button onClick={()=>goTab(2)} style={{width:"100%",padding:13,border:"none",borderRadius:16,background:c,color:"white",fontFamily:"Jua,sans-serif",fontSize:15,cursor:"pointer"}}>
              🎯 퀴즈 풀러 가기 →
            </button>
          </div>
        ))}

        {/* ── 퀴즈 탭 ── */}
        {tab===2 && (quizLoading||!quiz ? <Spin c={c} msg="퀴즈 만드는 중..."/> : done ? (
          <div style={{textAlign:"center",paddingTop:16}}>
            <div style={{fontSize:36,animation:"pop .4s ease",marginBottom:8}}>{["💪","⭐","⭐⭐","⭐⭐⭐","🏆","🏆🌟"][score]||"🏆"}</div>
            <b style={{fontFamily:"Jua,sans-serif",fontSize:20,color:c}}>{score}/{quiz.length}문제 맞았어요!</b>
            <div style={{color:"#888",fontSize:13,marginBottom:20,marginTop:4}}>
              {score===quiz.length?"완벽해요! 말씀 박사 🎊":score>=3?"잘했어요! 😊":"다시 한번 읽어봐요 💪"}
            </div>
            <div style={{fontSize:52,animation:"bob 1s ease infinite alternate",marginBottom:10}}>🌳</div>
            <b style={{fontFamily:"Jua,sans-serif",fontSize:20,color:c,display:"block",marginBottom:6}}>오늘 큐티 완료!</b>
            <div style={{color:"#888",fontSize:13,lineHeight:1.7,marginBottom:8}}>말씀 나무가 쑥쑥 자라고 있어요!<br/>내일도 함께 말씀 읽어요 🙏</div>
            {/* 암송 구절 다시 보기 */}
            <div style={{background:`linear-gradient(135deg,${c}18,${c}08)`,border:`1.5px solid ${c}33`,borderRadius:14,padding:12,margin:"12px 0 18px",textAlign:"center"}}>
              <div style={{fontSize:10,color:c,fontWeight:800,marginBottom:5}}>📣 오늘의 암송 구절</div>
              <div style={{fontSize:13,fontWeight:700,color:"#333",lineHeight:1.7}}>{day.memVerse}</div>
            </div>
            <div style={{display:"flex",gap:10,justifyContent:"center"}}>
              {[["🔥"+(streak+1),"연속 큐티"],["⭐"+score+"/"+quiz.length,"오늘 퀴즈"]].map(([n,l])=>(
                <div key={l} style={{background:"#f5f0e8",borderRadius:14,padding:"12px 18px",textAlign:"center"}}>
                  <div style={{fontFamily:"Jua,sans-serif",fontSize:22,color:c}}>{n}</div>
                  <div style={{fontSize:11,color:"#aaa"}}>{l}</div>
                </div>
              ))}
            </div>
          </div>
        ) : (() => {
          const q = quiz[qi];
          return (
            <div>
              <div style={{textAlign:"center",marginBottom:14}}>
                <b style={{fontFamily:"Jua,sans-serif",fontSize:17,color:c}}>🎯 성경 퀴즈</b>
                <div style={{display:"flex",gap:5,justifyContent:"center",marginTop:7}}>
                  {quiz.map((_,i)=><div key={i} style={{width:9,height:9,borderRadius:"50%",background:i<qi?c:i===qi?"#ddd":"#ddd",opacity:i===qi?.9:i<qi?1:.4,border:i===qi?`2px solid ${c}`:"2px solid #ddd"}}/>)}
                </div>
                <div style={{fontSize:12,color:"#aaa",marginTop:4}}>{qi+1} / {quiz.length}</div>
              </div>
              <div style={{background:"#f5f0e8",borderRadius:18,padding:18}}>
                <span style={{background:c,color:"white",fontSize:9,fontWeight:800,padding:"2px 9px",borderRadius:9,marginBottom:8,display:"inline-block"}}>{TYPE[q.type]||q.type}</span>
                <div style={{fontSize:14,lineHeight:1.8,color:"#333",marginBottom:14}}>{qi+1}. {q.q}</div>
                <div style={{display:"flex",flexDirection:"column",gap:7}}>
                  {q.choices.map((ch,i)=>{
                    const right=i===q.answer, picked=i===chosen;
                    let bg="white",bd="2px solid #e0e0e0",nb="#f0ebe0",nc="#888";
                    if(chosen!==null){
                      if(right){bg="#f0fff0";bd="2px solid #4caf50";nb="#4caf50";nc="white";}
                      else if(picked){bg="#fff0f0";bd="2px solid #f44";nb="#f44";nc="white";}
                    }
                    return (
                      <button key={i} onClick={()=>pick(i)} disabled={chosen!==null}
                        style={{width:"100%",padding:"12px 14px",border:bd,borderRadius:12,background:bg,fontSize:13,color:"#333",cursor:chosen!==null?"default":"pointer",textAlign:"left",display:"flex",alignItems:"center",gap:9,lineHeight:1.5,transition:"all .2s"}}>
                        <span style={{minWidth:24,height:24,borderRadius:"50%",background:nb,color:nc,fontWeight:800,fontSize:12,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{"①②③"[i]}</span>
                        <span>{ch}</span>
                      </button>
                    );
                  })}
                </div>
                {chosen!==null&&(
                  <div style={{background:"#fff8e8",border:"1.5px solid #f0d080",borderRadius:10,padding:10,fontSize:12,color:"#a07020",marginTop:10,lineHeight:1.7}}>
                    {chosen===q.answer?"🎉 정답이에요! ":`😢 정답은 ${"①②③"[q.answer]}번이에요. `}{q.hint}
                  </div>
                )}
              </div>
            </div>
          );
        })())}
      </div>
      <div style={{height:24}}/>
    </div>
  );
}

function Spin({c,msg}){
  return (
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minHeight:300,gap:14,textAlign:"center"}}>
      <div style={{width:44,height:44,border:"5px solid #eee",borderTopColor:c,borderRadius:"50%",animation:"spin .9s linear infinite"}}/>
      <b style={{color:c,fontSize:16}}>{msg}</b>
    </div>
  );
}
