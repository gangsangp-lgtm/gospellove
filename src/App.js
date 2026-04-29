import { useState, useEffect } from "react";

const TODAY = new Date();
const TODAY_STR = TODAY.toISOString().slice(0, 10);
const TODAY_KR = `${TODAY.getFullYear()}년 ${TODAY.getMonth() + 1}월 ${TODAY.getDate()}일`;
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

const FALLBACK = {
  season: "부활절", seasonEmoji: "🌸", seasonColor: "#c8820a",
  passage: "요한복음 10:11-18",
  theme: "예수님은 선한 목자예요",
  verse: '"나는 선한 목자다. 선한 목자는 양들을 위하여 자기 목숨을 버린다." — 요한복음 10:11 (새번역)',
  explain: "예수님은 스스로를 선한 목자라고 하셨어요. 목자는 양을 돌보는 사람이에요. 예수님은 우리를 위해 목숨까지 버리실 만큼 우리를 사랑하세요!"
};

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

  useEffect(() => {
    const cacheKey = `qt_day_${TODAY_STR}`;
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      try { setDay(JSON.parse(cached)); setDayLoading(false); return; }
      catch(e) { localStorage.removeItem(cacheKey); }
    }
    ai(`날짜:${TODAY_STR}. 한국 개신교 교회력 기준 초등학생 큐티. 2026부활절=4월5일.
JSON만(다른말금지):{"season":"절기","seasonEmoji":"이모지","seasonColor":"#hex","passage":"구절","theme":"주제(짧게)","verse":"새번역본문2~3절","explain":"초등2~4학년설명3문장"}`, 600)
      .then(t => { const p = JSON.parse(t); localStorage.setItem(cacheKey, JSON.stringify(p)); setDay(p); })
      .catch(() => setDay(FALLBACK))
      .finally(() => setDayLoading(false));
  }, []);

  function goTab(i) {
    if (!day) return;
    setTab(i);
    if (i === 1 && !qt && !qtLoading) {
      setQtLoading(true);
      ai(`초등학생큐티. 본문:${day.passage} 주제:"${day.theme}"
JSON만:{"observe":"관찰질문","apply":"적용질문","prayer":"기도예시"}`, 400)
        .then(t => setQt(JSON.parse(t)))
        .catch(() => setQt({ observe:`${day.passage}에서 누가 나왔나요?`, apply:"오늘 실천할 것을 써봐요!", prayer:"하나님 오늘 말씀대로 살게 해주세요. 아멘." }))
        .finally(() => setQtLoading(false));
    }
    if (i === 2 && !quiz && !quizLoading) {
      setQuizLoading(true);
      ai(`초등학생성경퀴즈. 본문:${day.passage} 말씀:"${day.verse}"
4지선다3문제(말씀이해/말씀의미/삶적용). JSON만:
[{"type":"말씀이해","q":"문제","choices":["선택1","선택2","선택3","선택4"],"answer":0,"hint":"힌트"},
{"type":"말씀의미","q":"문제","choices":["선택1","선택2","선택3","선택4"],"answer":1,"hint":"힌트"},
{"type":"삶적용","q":"문제","choices":["선택1","선택2","선택3","선택4"],"answer":2,"hint":"힌트"}]`, 700)
        .then(t => setQuiz(JSON.parse(t)))
        .catch(() => setQuiz([
          {type:"말씀이해",q:`${day.passage}에서 예수님은 자신을 뭐라 하셨나요?`,choices:["선한 목자","좋은 선생님","위대한 왕","친절한 의사"],answer:0,hint:"'나는 선한 목자다'라고 하셨어요!"},
          {type:"말씀의미",q:"오늘 말씀의 교훈은?",choices:["힘이 세야 해요","예수님이 우릴 사랑해요","교회 안 가도 돼요","공부만 해요"],answer:1,hint:"예수님은 우리 위해 목숨도 버리셨어요!"},
          {type:"삶적용",q:"친구가 혼자 외로워해요. 나는?",choices:["함께 놀자고 해요","모른 척해요","놀려요","그냥 가요"],answer:0,hint:"예수님처럼 외로운 친구 곁에 있어줘요!"}
        ]))
        .finally(() => setQuizLoading(false));
    }
  }

  function pick(i) {
    if (chosen !== null || !quiz) return;
    if (i === quiz[qi].answer) setScore(s => s + 1);
    setChosen(i);
    setTimeout(() => {
      if (qi + 1 >= quiz.length) { setDone(true); localStorage.setItem("qt_streak", String(streak + 1)); }
      else { setQi(q => q + 1); setChosen(null); }
    }, 2000);
  }

  const c = day?.seasonColor || "#2d6a4f";
  const TYPE = { 말씀이해:"📖 말씀 이해", 말씀의미:"💎 말씀의 의미", 삶적용:"🌱 삶에 적용" };

  return (
    <div style={{fontFamily:"'Nanum Gothic',system-ui,sans-serif",background:"#fffdf7",minHeight:"100vh",maxWidth:420,margin:"0 auto"}}>
      <div style={{background:c,padding:"20px 20px 26px",borderRadius:"0 0 28px 28px",transition:"background .5s",position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",top:-40,right:-40,width:160,height:160,background:"rgba(255,255,255,.08)",borderRadius:"50%"}}/>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
          <b style={{fontFamily:"Jua,sans-serif",color:"white",fontSize:21}}>🌱 말씀 나무</b>
          <span style={{background:"rgba(255,255,255,.2)",color:"white",padding:"5px 11px",borderRadius:18,fontSize:13,fontWeight:700}}>🔥 {streak}일째</span>
        </div>
        <div style={{color:"rgba(255,255,255,.8)",fontSize:13,marginBottom:4}}>{TODAY_KR}</div>
        <div style={{display:"inline-block",background:"rgba(255,255,255,.22)",color:"white",padding:"3px 11px",borderRadius:10,fontSize:12,fontWeight:700,marginBottom:8}}>
          {day ? `${day.seasonEmoji} ${day.season}` : "⏳ 불러오는 중..."}
        </div>
        <div style={{color:"rgba(255,255,255,.7)",fontSize:11,marginBottom:3}}>오늘의 말씀</div>
        <div style={{fontFamily:"Jua,sans-serif",color:"white",fontSize:18}}>{day?.passage || "잠깐만요..."}</div>
      </div>

      <div style={{display:"flex",gap:6,padding:"14px 14px 0"}}>
        {["📖 말씀","🙏 묵상","🎯 퀴즈"].map((l,i)=>(
          <button key={i} onClick={()=>goTab(i)} style={{flex:1,padding:"9px 0",border:"none",borderRadius:"14px 14px 0 0",background:tab===i?"white":"#f0ebe0",color:tab===i?c:"#999",fontWeight:700,fontSize:13,cursor:day?"pointer":"default",opacity:!day&&i>0?.4:1,boxShadow:tab===i?"0 -3px 10px rgba(0,0,0,.06)":"none"}}>{l}</button>
        ))}
      </div>

      <div style={{background:"white",margin:"0 14px",borderRadius:"0 0 22px 22px",padding:18,boxShadow:"0 4px 18px rgba(0,0,0,.06)",minHeight:420}}>
        {tab===0 && (dayLoading ? <Spin c={c} msg="오늘의 말씀 준비 중 🌱"/> : day && (
          <div>
            <div style={{background:"linear-gradient(135deg,#fff8e8,#fff)",border:"1.5px solid #f0d080",borderRadius:14,padding:13,marginBottom:12}}>
              <div style={{fontSize:10,color:"#c89020",fontWeight:800,letterSpacing:1,marginBottom:3}}>오늘의 주제</div>
              <div style={{fontFamily:"Jua,sans-serif",fontSize:16,color:"#333"}}>{day.theme}</div>
            </div>
            <div style={{background:"#f5f0e8",borderLeft:`4px solid ${c}`,borderRadius:"0 14px 14px 0",padding:14,marginBottom:12}}>
              <span style={{background:c,color:"white",fontSize:9,fontWeight:800,padding:"2px 7px",borderRadius:7,marginBottom:7,display:"inline-block"}}>새번역 성경</span>
              <div style={{fontSize:15,lineHeight:1.9,color:"#333"}}>{day.verse}</div>
              <div style={{fontSize:11,color:"#aaa",textAlign:"right",marginTop:6}}>— {day.passage} (새번역)</div>
            </div>
            <div style={{background:"linear-gradient(135deg,#f0f8ff,#e8f4ff)",border:"1.5px solid #b8d8f8",borderRadius:14,padding:13,marginBottom:14}}>
              <div style={{fontSize:10,color:"#3a80c0",fontWeight:800,letterSpacing:1,marginBottom:5}}>🔍 쉽게 알아봐요</div>
              <div style={{fontSize:14,lineHeight:1.8,color:"#2a4a6a"}}>{day.explain}</div>
            </div>
            <button onClick={()=>goTab(1)} style={{width:"100%",padding:14,border:"none",borderRadius:18,background:c,color:"white",fontFamily:"Jua,sans-serif",fontSize:16,cursor:"pointer"}}>
              📝 묵상 질문 보러 가기 →
            </button>
          </div>
        ))}

        {tab===1 && (qtLoading||!qt ? <Spin c={c} msg="묵상 질문 만드는 중..."/> : (
          <div>
            {[{icon:"👀",title:"관찰해요",q:qt.observe,k:"o",ph:"말씀에서 찾은 것을 써봐요 ✏️"},
              {icon:"💡",title:"적용해요",q:qt.apply,k:"a",ph:"내 생각을 써봐요 💭"}].map(({icon,title,q,k,ph})=>(
              <div key={k} style={{marginBottom:18}}>
                <div style={{display:"flex",alignItems:"center",gap:7,fontWeight:800,fontSize:14,color:c,marginBottom:7}}>
                  <div style={{width:26,height:26,background:c,color:"white",borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13}}>{icon}</div>{title}
                </div>
                <div style={{background:"#f5f0e8",borderRadius:12,padding:12,fontSize:14,lineHeight:1.7,color:"#444",marginBottom:6}}>{q}</div>
                <textarea value={ans[k]} onChange={e=>setAns(a=>({...a,[k]:e.target.value}))} rows={3} placeholder={ph}
                  style={{width:"100%",border:"2px solid #eee",borderRadius:12,padding:10,fontSize:14,resize:"none",color:"#333",background:"#fafafa"}}/>
              </div>
            ))}
            <div style={{marginBottom:18}}>
              <div style={{display:"flex",alignItems:"center",gap:7,fontWeight:800,fontSize:14,color:c,marginBottom:7}}>
                <div style={{width:26,height:26,background:c,color:"white",borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13}}>🙏</div>기도해요
              </div>
              <div style={{background:"#fff8e8",borderRadius:10,padding:9,fontSize:12,color:"#a07020",marginBottom:6,lineHeight:1.6}}>💛 예시: {qt.prayer}</div>
              <textarea value={ans.p} onChange={e=>setAns(a=>({...a,p:e.target.value}))} rows={2} placeholder="나만의 기도 🙏"
                style={{width:"100%",border:"2px solid #eee",borderRadius:12,padding:10,fontSize:14,resize:"none",color:"#333",background:"#fafafa"}}/>
            </div>
            <button onClick={()=>goTab(2)} style={{width:"100%",padding:13,border:"none",borderRadius:16,background:c,color:"white",fontFamily:"Jua,sans-serif",fontSize:15,cursor:"pointer"}}>🎯 퀴즈 풀러 가기 →</button>
          </div>
        ))}

        {tab===2 && (quizLoading||!quiz ? <Spin c={c} msg="퀴즈 만드는 중..."/> : done ? (
          <div style={{textAlign:"center",paddingTop:16}}>
            <div style={{fontSize:36,animation:"pop .4s ease",marginBottom:8}}>{["💪","⭐","⭐⭐","⭐⭐⭐"][score]}</div>
            <b style={{fontFamily:"Jua,sans-serif",fontSize:20,color:c}}>{score}문제 맞았어요!</b>
            <div style={{color:"#888",fontSize:13,marginBottom:20,marginTop:4}}>
              {score===3?"완벽해요! 말씀 박사 🎊":score===2?"잘했어요! 😊":"다시 한번 읽어봐요 💪"}
            </div>
            <div style={{fontSize:52,animation:"bob 1s ease infinite alternate",marginBottom:10}}>🌳</div>
            <b style={{fontFamily:"Jua,sans-serif",fontSize:20,color:c,display:"block",marginBottom:6}}>오늘 큐티 완료!</b>
            <div style={{color:"#888",fontSize:13,lineHeight:1.7,marginBottom:18}}>말씀 나무가 쑥쑥 자라고 있어요!<br/>내일도 함께 말씀 읽어요 🙏</div>
            <div style={{display:"flex",gap:10,justifyContent:"center"}}>
              {[["🔥"+(streak+1),"연속 큐티"],["⭐"+score+"/3","오늘 퀴즈"]].map(([n,l])=>(
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
                  {quiz.map((_,i)=><div key={i} style={{width:9,height:9,borderRadius:"50%",background:i<=qi?c:"#ddd",opacity:i===qi?.5:1}}/>)}
                </div>
              </div>
              <div style={{background:"#f5f0e8",borderRadius:18,padding:18}}>
                <span style={{background:c,color:"white",fontSize:9,fontWeight:800,padding:"2px 9px",borderRadius:9,marginBottom:8,display:"inline-block"}}>{TYPE[q.type]||q.type}</span>
                <div style={{fontSize:14,lineHeight:1.75,color:"#333",marginBottom:14}}>{qi+1}. {q.q}</div>
                <div style={{display:"flex",flexDirection:"column",gap:7}}>
                  {q.choices.map((ch,i)=>{
                    const right=i===q.answer,picked=i===chosen;
                    let bg="white",bd="2px solid #e0e0e0",nb="#f0ebe0",nc="#888";
                    if(chosen!==null){
                      if(right){bg="#f0fff0";bd="2px solid #4caf50";nb="#4caf50";nc="white";}
                      else if(picked){bg="#fff0f0";bd="2px solid #f44";nb="#f44";nc="white";}
                    }
                    return (
                      <button key={i} onClick={()=>pick(i)} disabled={chosen!==null}
                        style={{width:"100%",padding:"11px 14px",border:bd,borderRadius:12,background:bg,fontSize:13,color:"#333",cursor:chosen!==null?"default":"pointer",textAlign:"left",display:"flex",alignItems:"center",gap:9,lineHeight:1.5,transition:"all .2s"}}>
                        <span style={{minWidth:24,height:24,borderRadius:"50%",background:nb,color:nc,fontWeight:800,fontSize:12,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{"①②③④"[i]}</span>
                        <span>{ch}</span>
                      </button>
                    );
                  })}
                </div>
                {chosen!==null&&<div style={{background:"#fff8e8",border:"1.5px solid #f0d080",borderRadius:10,padding:10,fontSize:12,color:"#a07020",marginTop:10,lineHeight:1.6}}>
                  {chosen===q.answer?"🎉 정답이에요! ":`😢 정답은 ${"①②③④"[q.answer]}번이에요. `}{q.hint}
                </div>}
              </div>
            </div>
          );
        })())}
      </div>
      <div style={{height:20}}/>
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
