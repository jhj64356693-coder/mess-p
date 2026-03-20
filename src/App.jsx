import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut } from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc, updateDoc, collection, onSnapshot } from "firebase/firestore";
import { 
  Stethoscope, BookOpen, BrainCircuit, Loader2, CheckCircle2, 
  Settings2, AlertCircle, User, ShieldCheck, X, 
  Activity, ChevronLeft, ChevronRight, LayoutList, Layers,
  BarChart3, CreditCard, LogOut, GraduationCap, TrendingUp,
  ShieldAlert, Play, Square, School, Bell, MessageSquare, RefreshCw, Wallet, Crown, Lock, ChevronDown, ChevronUp
} from 'lucide-react';

// --- [1. Firebase 설정: 교수님 전용 'h' 키 유지] ---
const firebaseConfig = {
  apiKey: "AIzaSyAK_xx2c3FJBurh0fokmoCu_-IbHskQEX8", 
  authDomain: "mess-p-fb5ee.firebaseapp.com",
  projectId: "mess-p-fb5ee",
  storageBucket: "mess-p-fb5ee.firebasestorage.app",
  messagingSenderId: "684674460584",
  appId: "1:684674460584:web:75149de601c64515ff8b9d",
  measurementId: "G-0LQC4C9WME"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

const ADMIN_EMAIL = 'jhj64356693@gmail.com';
const MODE_A_SUBJECTS = ["전체 모의고사 (230문항)", "1교시 전체 (120문항)", "기초의학 (30문항)", "관리학 (40문항)", "총론 (30문항)", "법령 (20문항)", "2교시 전체 (110문항)"];
const MODE_B_SUBJECTS = ["해부생리학", "병리학", "내과전문응급처치학", "전문외상처치학", "특수상황전문응급처치학", "응급환자관리학", "응급구조학 총론", "재난의학", "기본인명소생술", "전문심장소생술", "심전도"];

// --- [2. 챕터 데이터: 전 과목 완벽 복구] ---
const CHAPTERS = {
  "해부생리학": ["전범위", "1. 인체의 체제", "2. 세포와 조직", "3. 피부계통", "4. 뼈대계통", "5. 근육계통", "6. 신경계통", "7. 내분비계통", "8. 혈액", "9. 심장혈관계통", "10. 림프와 면역계통", "11. 호흡계통", "12. 소화계통", "13. 비뇨계통", "14. 생식계통"],
  "병리학": ["전범위", "1. 병리학 개요", "2. 병인론", "3. 세포 손상", "4. 염증과 수복", "5. 순환장애", "6. 감염질환", "7. 면역질환", "8. 신생물", "9. 유전성", "10. 신생아/유소아", "11. 노화", "12. 순환계통", "13. 혈구생성", "14. 호흡계통", "15. 소화계통", "16. 비뇨계통", "17. 생식계통", "18. 내분비계통", "19. 신경계통", "20. 감각계통", "21. 근육뼈대", "22. 피부"],
  "내과전문응급처치학": ["전범위", "1. 호흡기계", "2. 심혈관계", "3. 신경계", "4. 내분비계", "5. 알레르기/아나필락시스", "6. 위장관계", "7. 비뇨생식기계", "8. 독성학", "9. 혈액학", "10. 감염병", "11. 정신질환", "12. 안/이비인후과", "13. 비외상성 근골격"],
  "전문외상처치학": ["전범위", "1. 외상 시스템", "2. 손상기전", "3. 출혈과 쇼크", "4. 연조직", "5. 화상", "6. 머리/목/척추", "7. 흉부외상", "8. 복부 및 골반", "9. 근골격", "10. 환경", "11. 특수 고려사항"],
  "특수상황전문응급처치학": ["전범위", "1. 부인과", "2. 산과", "3. 신생아", "4. 소아", "5. 노인", "6. 학대/폭행", "7. 장애인", "8. 만성질환", "9. 구급차 운영", "10. 항공의료", "11. 다발성 사상자", "12. 구조 상황", "13. 유해 물질", "14. 범죄 현장", "15. 교외 지역", "16. 테러 대응"],
  "응급환자관리학": ["전범위", "1. 건강/환경", "2. 감염관리", "3. 활력징후", "4. 호흡관리", "5. 체온유지", "6. 활동과 안위", "7. 수분/전해질", "8. 배설관리", "9. 투약관리", "10. 수술 관리", "11. 임종관리", "12. 기록"],
  "응급구조학 총론": ["전범위", "1. 국내 응급의료체계", "2. 해외 응급의료체계", "3. 환자 구조와 이송"],
  "재난의학": ["전범위", "1. 개념", "2. 분류", "3. 테러/바이러스", "4. 밀폐공간", "5. 감염/압좌", "6. 외상/내과", "7. 스트레스", "8. 소아 재난", "9. 재난대책", "10. 체계", "11. 해외 긴급구조", "12. 교육/연구"],
  "기본인명소생술": ["전범위", "1. 심장정지", "2. CPR 원리", "3. 모니터링", "4. 기본소생술", "5. 기계식 장치", "6. 시작과 종료", "7. 생존 요소", "8. 생존 사슬"],
  "전문심장소생술": ["전범위", "1. 평가/치료", "2. 위험 환자", "3. 전문기도유지", "4. 제세동", "5. 투약경로", "6. ACLS 약물", "7. 특수 상황", "8. 소생후 통합", "9. 부정맥", "10. 심장박동조율", "11. 혈역학", "12. ACS/뇌졸중"],
  "심전도": ["전범위", "1. 해부", "2. 전기생리학", "3. 벡터", "4. 실제심전도", "5. 도구", "6. 기본 심박동", "7. 박동수", "8. 리듬들", "9. 임상 관련성", "10. 전기축", "11. 각차단", "12. 비대", "13. 급성 심근경색"]
};

const CIRCLE_NUMS = ['①', '②', '③', '④', '⑤'];

// --- [3. 컴포넌트: QuestionCard] ---
function QuestionCard({ q, isSlideMode, onAnswerRecord, onReportSubmit, isAdmin }) {
  const [showAnswer, setShowAnswer] = useState(false);
  const [selectedOption, setSelectedOption] = useState(null);
  const [isReporting, setIsReporting] = useState(false);
  const [feedback, setFeedback] = useState('');

  useEffect(() => { setShowAnswer(false); setSelectedOption(null); setIsReporting(false); }, [q.id]);

  const handleSelect = (num) => {
    if (showAnswer) return;
    setSelectedOption(num);
    if (onAnswerRecord) onAnswerRecord(q, num === q.answer);
  };

  return (
    <div className={`bg-white rounded-[32px] shadow-sm border border-slate-100 overflow-hidden mb-6 ${isSlideMode ? 'min-h-[450px] flex flex-col justify-center' : ''} ${!isAdmin ? 'select-none' : ''}`}>
      <div className="p-6 md:p-10 text-left">
        <div className="flex justify-between items-start mb-6">
            <span className="text-2xl font-black text-blue-600">Q{q.id}.</span>
            {selectedOption && <span className={`text-[10px] font-black px-3 py-1 rounded-full ${selectedOption === q.answer ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>{selectedOption === q.answer ? '정답' : '오답'}</span>}
        </div>
        <h3 className="text-lg md:text-xl font-bold text-slate-900 mb-8 leading-relaxed whitespace-pre-wrap">{q.question}</h3>
        <div className="space-y-3 mb-8">
          {q.options.map((opt, i) => (
            <button key={i} onClick={() => handleSelect(i + 1)} disabled={showAnswer}
              className={`w-full text-left p-4 md:p-5 rounded-2xl border transition-all flex items-start gap-4 
              ${showAnswer ? (i + 1 === q.answer ? 'border-emerald-500 bg-emerald-50 text-emerald-800 font-bold' : selectedOption === i + 1 ? 'border-red-300 bg-red-50 text-red-800' : 'opacity-40') 
              : (selectedOption === i + 1 ? 'border-blue-600 bg-blue-50 ring-2 ring-blue-600 shadow-sm' : 'border-slate-100 hover:border-blue-200 active:bg-slate-50')}`}>
              <span className="shrink-0 text-lg font-bold">{CIRCLE_NUMS[i]}</span>
              <span className="pt-0.5 text-base md:text-lg font-medium">{opt}</span>
            </button>
          ))}
        </div>
        <div className="flex justify-between items-center pt-6 border-t border-slate-50">
          <button onClick={() => setShowAnswer(!showAnswer)} className="px-6 py-3 rounded-xl font-black text-xs bg-slate-900 text-white shadow-lg active:scale-95 transition-all">정답/해설 확인</button>
          <button onClick={() => setIsReporting(!isReporting)} className="flex items-center gap-1 text-slate-400 text-[10px] font-black uppercase"><MessageSquare size={14}/> 오류 제보</button>
        </div>
      </div>
      {showAnswer && <div className="bg-slate-50 p-6 md:p-10 border-t border-slate-100 animate-in slide-in-from-top-2 text-left"><p className="text-slate-700 text-base md:text-lg font-medium leading-relaxed"><span className="font-black text-blue-600 mr-3">정답: {CIRCLE_NUMS[q.answer-1]}</span>{q.explanation}</p></div>}
      {isReporting && (
        <div className="p-6 bg-red-50/50 border-t border-red-100 animate-in slide-in-from-top-2">
          <textarea value={feedback} onChange={e => setFeedback(e.target.value)} placeholder="의학적 오류 내용을 적어주세요." className="w-full h-24 p-4 bg-white border border-red-200 rounded-2xl text-sm outline-none focus:ring-2 ring-red-100"/>
          <div className="flex justify-end gap-3 mt-4"><button onClick={() => setIsReporting(false)} className="text-slate-400 text-xs font-bold">취소</button>
          <button onClick={() => { onReportSubmit({qId: q.id, question: q.question, feedback}); setIsReporting(false); alert("제보 완료"); }} className="px-6 py-2 bg-red-500 text-white rounded-xl font-black text-xs shadow-lg active:scale-95">보내기</button></div>
        </div>
      )}
    </div>
  );
}

// --- [4. 메인 App 컴포넌트] ---
export default function App() {
  const [stats, setStats] = useState({});
  const [wrongAnswers, setWrongAnswers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [isLogged, setIsLogged] = useState(false);
  const [currentView, setCurrentView] = useState('exam');
  const [isSystemActive, setIsSystemActive] = useState(true);
  const [isSettingsExpanded, setIsSettingsExpanded] = useState(true); 
  
  const [userDb, setUserDb] = useState([]);
  const [reportDb, setReportDb] = useState([]);
  const [notice, setNotice] = useState({ title: "MESS-P 안내", content: "로딩 중...", isActive: true });
  const [showNoticePopup, setShowNoticePopup] = useState(false);
  const [paymentNotice, setPaymentNotice] = useState("");

  const [mode, setMode] = useState('A');
  const [subjectA, setSubjectA] = useState(MODE_A_SUBJECTS[0]);
  const [subjectB, setSubjectB] = useState(MODE_B_SUBJECTS[0]);
  const [chapter, setChapter] = useState("전범위");
  const [count, setCount] = useState(1);
  const [difficulty, setDifficulty] = useState('혼합');
  const [questions, setQuestions] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [viewMode, setViewMode] = useState('list');
  const [currentIndex, setCurrentIndex] = useState(0);

  const isAdmin = useMemo(() => currentUser?.email === ADMIN_EMAIL, [currentUser]);
  const statMetrics = useMemo(() => {
    const total = Object.keys(stats).length;
    const correct = Object.values(stats).filter(v => v === true).length;
    return { total, correct, accuracy: total > 0 ? Math.round((correct / total) * 100) : 0 };
  }, [stats]);

  // [중요 함수들 정의: 순서 변경 방지]
  const handleAnswerRecord = async (qObj, isCorrect) => {
    setStats(prev => ({ ...prev, [qObj.id]: isCorrect }));
    if (!isCorrect) {
      const isAlready = wrongAnswers.some(w => w.question === qObj.question);
      if (!isAlready) {
        const newWrong = [...wrongAnswers, qObj];
        setWrongAnswers(newWrong);
        if (currentUser?.uid) await updateDoc(doc(db, "users", currentUser.uid), { wrongAnswers: newWrong });
      }
    }
  };

  const handleReportSubmit = async (data) => {
    await setDoc(doc(collection(db, "reports")), { ...data, studentEmail: currentUser?.email, timestamp: new Date().toLocaleString() });
  };

  const toggleUserProperty = async (userId, userEmail, prop, val) => {
    if (userEmail === ADMIN_EMAIL) return alert("MASTER 권한은 고정입니다.");
    await updateDoc(doc(db, "users", userId), { [prop]: !val });
  };

  const handleGoogleLogin = () => signInWithPopup(auth, googleProvider).catch(e => alert(e.message));
  const handleLogout = () => signOut(auth);

  // [AI 생성 로직: 듀얼 엔진 및 한국어 강제]
  const handleGenerate = async () => {
    if (!isSystemActive || currentUser?.isDisabled) return alert("접근 불가");
    const requiredPoints = count * 100;
    if (!isAdmin && !currentUser?.isFree && !currentUser?.isSubscribed && (currentUser?.points || 0) < requiredPoints) {
        setPaymentNotice(`출제를 위해 포인트가 부족합니다.`);
        setCurrentView('payment');
        return;
    }

    const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
    setIsGenerating(true); setQuestions([]); 
    if (window.innerWidth < 1024) setIsSettingsExpanded(false); 

    try {
      let acc = [];
      const sub = mode === 'A' ? subjectA : `${subjectB} (${chapter})`;
      
      while (acc.length < count) {
        const bSize = Math.min(count - acc.length, 5);
        const prompt = `당신은 응급의학 박사 출제위원입니다. 과목:${sub}, 난이도:${difficulty} 전문 문항 ${bSize}개를 생성하세요. 반드시 모든 텍스트를 '한국어'로 작성하고 다른 대화 없이 [ ]로 감싸진 JSON 배열 형식만 응답하세요. 형식: [{"id":${acc.length+1}, "question":"...", "options":["1","2","3","4","5"], "answer":1, "explanation":"..."}]`;

        let modelName = "gemini-2.5-pro"; 
        let res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${API_KEY}`, { 
          method:'POST', headers:{'Content-Type':'application/json'}, 
          body:JSON.stringify({ contents:[{parts:[{text:prompt}]}] }) 
        });

        if (!res.ok) {
          modelName = "gemini-2.5-flash"; // 폴백
          res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${API_KEY}`, { 
            method:'POST', headers:{'Content-Type':'application/json'}, 
            body:JSON.stringify({ contents:[{parts:[{text:prompt}]}] }) 
          });
        }

        const data = await res.json();
        const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
        const jsonMatch = rawText.match(/\[[\s\S]*\]/);
        
        if (jsonMatch) {
          const batch = JSON.parse(jsonMatch[0]);
          acc = [...acc, ...batch];
          setQuestions([...acc.slice(0, count)]);
        }
        if (acc.length < count) await new Promise(r => setTimeout(r, 1200)); 
      }
      if (!isAdmin && !currentUser?.isSubscribed) await updateDoc(doc(db, "users", currentUser.uid), { points: (currentUser.points || 0) - requiredPoints });
    } catch (e) { alert("AI 서버 지연. 잠시 후 시도하세요."); } finally { setIsGenerating(false); }
  };

  useEffect(() => {
    if (!isLogged) return;
    const unsubUsers = onSnapshot(collection(db, "users"), (snap) => setUserDb(snap.docs.map(d => ({id: d.id, ...d.data()}))));
    const unsubReports = onSnapshot(collection(db, "reports"), (snap) => setReportDb(snap.docs.map(d => ({id: d.id, ...d.data()}))));
    const unsubNotice = onSnapshot(doc(db, "settings", "notice"), (d) => d.exists() && setNotice(d.data()));
    const unsubSystem = onSnapshot(doc(db, "settings", "system"), (d) => d.exists() && setIsSystemActive(d.data().isActive));
    return () => { unsubUsers(); unsubReports(); unsubNotice(); unsubSystem(); };
  }, [isLogged]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);
        const isMaster = user.email === ADMIN_EMAIL;
        if (!userSnap.exists()) {
          const newUser = { name: user.displayName, email: user.email, role: isMaster ? "교수" : "학생", school: "", isFree: isMaster, isDisabled: false, points: isMaster ? 999999 : 0, isSubscribed: isMaster, wrongAnswers: [] };
          await setDoc(userRef, newUser);
          setCurrentUser({ ...newUser, uid: user.uid });
        } else {
          const data = userSnap.data();
          if (isMaster) {
            data.isFree = true; data.isDisabled = false; data.role = "교수";
            await updateDoc(userRef, { isFree: true, isDisabled: false, role: "교수" });
          }
          setCurrentUser({ ...data, uid: user.uid });
          setWrongAnswers(data.wrongAnswers || []);
        }
        setIsLogged(true);
      } else {
        setIsLogged(false);
        setCurrentUser(null);
      }
    });
    return () => unsubscribe();
  }, []);

  if (!isLogged) return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 text-center">
      <div className="max-w-md w-full bg-white rounded-[64px] p-12 md:p-16 shadow-2xl animate-in zoom-in-95 text-slate-900 text-center">
        <div className="w-16 h-16 md:w-20 md:h-20 bg-blue-600 rounded-[28px] flex items-center justify-center text-white mx-auto mb-8 shadow-xl"><Stethoscope size={40}/></div>
        <h1 className="text-3xl md:text-4xl font-black mb-8 uppercase tracking-tighter">MESS-P</h1>
        <button onClick={handleGoogleLogin} className="w-full py-5 bg-white border-2 border-slate-100 rounded-2xl flex items-center justify-center gap-4 font-black text-slate-700 hover:bg-slate-50 transition-all active:scale-95 shadow-sm"><img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-6 h-6" alt="G" /> Google Login</button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-blue-100 relative pb-24 lg:pb-0 overflow-x-hidden">
      {/* 📱 모바일 하단 내비게이션 바 */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 flex justify-around items-center h-20 z-[100] px-2 shadow-[0_-10px_20px_rgba(0,0,0,0.05)]">
        {[ {id: 'exam', label: '시험지', icon: <BookOpen size={22}/>}, {id: 'dashboard', label: '통계', icon: <BarChart3 size={22}/>}, {id: 'payment', label: '결제', icon: <Wallet size={22}/>}, {id: 'profile', label: '내정보', icon: <User size={22}/>} ].map(item => (
          <button key={item.id} onClick={() => {setCurrentView(item.id); setPaymentNotice("");}} className={`flex flex-col items-center gap-1 transition-all ${currentView === item.id ? 'text-blue-600' : 'text-slate-400'}`}>{item.icon}<span className="text-[10px] font-black uppercase tracking-tighter">{item.label}</span></button>
        ))}
        {isAdmin && <button onClick={() => setCurrentView('admin')} className={`flex flex-col items-center gap-1 ${currentView === 'admin' ? 'text-red-500' : 'text-slate-400'}`}><ShieldCheck size={22}/><span className="text-[10px] font-black">ADMIN</span></button>}
      </div>

      <header className="bg-white border-b sticky top-0 z-50 px-6 md:px-10 h-20 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => setCurrentView('exam')}><div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg"><Stethoscope size={24}/></div><h1 className="text-2xl font-black tracking-tighter text-blue-600 uppercase">MESS-P</h1></div>
        <nav className="hidden lg:flex items-center gap-10">
          {['exam', 'dashboard', 'payment'].map(v => (<button key={v} onClick={() => {setCurrentView(v); setPaymentNotice("");}} className={`text-sm font-black uppercase ${currentView === v ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-400'}`}>{v === 'exam' ? '시험 생성' : v === 'dashboard' ? '학습 통계' : '결제/충전'}</button>))}
          {isAdmin && <button onClick={() => setCurrentView('admin')} className="px-5 py-2 bg-red-50 text-red-600 rounded-full text-xs font-black border border-red-100 flex items-center gap-2"><ShieldCheck size={14}/> ADMIN</button>}
          <button onClick={() => setCurrentView('profile')} className="p-2.5 bg-blue-50 rounded-xl text-blue-600 hover:bg-blue-100 transition-all"><User size={20}/></button>
        </nav>
        <div className="lg:hidden flex items-center gap-2">{(isAdmin || currentUser?.isFree || currentUser?.isSubscribed) ? <Crown className="text-blue-600" size={24}/> : <div className="text-[10px] font-black bg-blue-50 text-blue-600 px-3 py-1 rounded-full uppercase tracking-tighter">₩ {(currentUser?.points || 0).toLocaleString()}</div>}</div>
      </header>

      {showNoticePopup && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md animate-in fade-in">
          <div className="bg-white rounded-[48px] w-full max-w-lg overflow-hidden shadow-2xl animate-in slide-in-from-bottom-10 text-center">
            <div className="bg-blue-600 p-10 text-white relative"><Bell size={48} className="mb-4 opacity-50 mx-auto"/><h2 className="text-3xl font-black">{notice.title}</h2><button onClick={() => setShowNoticePopup(false)} className="absolute top-8 right-8 p-2 hover:bg-white/20 rounded-full transition-all"><X size={24}/></button></div>
            <div className="p-10"><p className="text-slate-600 text-lg font-medium whitespace-pre-wrap leading-relaxed">{notice.content}</p><button onClick={() => setShowNoticePopup(false)} className="w-full mt-10 py-5 bg-slate-900 text-white rounded-3xl font-black text-lg shadow-xl">확인하였습니다</button></div>
          </div>
        </div>
      )}

      <main className={`max-w-7xl mx-auto p-4 md:p-12 ${!isAdmin ? 'select-none' : ''}`}>
        {currentView === 'exam' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            <aside className="lg:col-span-4">
              <div className="bg-white rounded-[32px] md:rounded-[48px] border shadow-sm overflow-hidden animate-in slide-in-from-left-4 text-left">
                <div className="p-6 md:p-10 flex justify-between items-center bg-slate-50/50 cursor-pointer lg:cursor-default" onClick={() => setIsSettingsExpanded(!isSettingsExpanded)}>
                    <h2 className="font-black flex items-center gap-3 text-lg md:text-xl text-slate-800"><Settings2 className="text-blue-600" size={22}/> 출제 설정</h2>
                    <div className="lg:hidden">{isSettingsExpanded ? <ChevronUp/> : <ChevronDown/>}</div>
                </div>
                {isSettingsExpanded && (
                  <div className="p-6 md:p-10 space-y-8 animate-in fade-in duration-300">
                    <div className="grid grid-cols-2 gap-3"><button onClick={() => setMode('A')} className={`p-4 rounded-2xl border transition-all font-bold ${mode === 'A' ? 'border-blue-600 bg-blue-50 text-blue-700 ring-2 ring-blue-600 shadow-sm' : 'bg-white text-slate-400'}`}>국가고시</button><button onClick={() => setMode('B')} className={`p-4 rounded-2xl border transition-all font-bold ${mode === 'B' ? 'border-blue-600 bg-blue-50 text-blue-700 ring-2 ring-blue-600 shadow-sm' : 'bg-white text-slate-400'}`}>내신대비</button></div>
                    <div className="space-y-4">
                        <select value={mode === 'A' ? subjectA : subjectB} onChange={(e) => mode === 'A' ? setSubjectA(e.target.value) : setSubjectB(e.target.value)} className="w-full p-4 bg-slate-50 border-none rounded-2xl font-black text-sm outline-none focus:ring-2 ring-blue-100">{(mode === 'A' ? MODE_A_SUBJECTS : MODE_B_SUBJECTS).map(s => <option key={s} value={s}>{s}</option>)}</select>
                        {mode === 'B' && CHAPTERS[subjectB] && (<select value={chapter} onChange={(e) => setChapter(e.target.value)} className="w-full p-4 bg-blue-50 border-none rounded-2xl font-bold text-xs focus:ring-2 ring-blue-100 animate-in slide-in-from-top-2">{CHAPTERS[subjectB].map(c => <option key={c} value={c}>{c}</option>)}</select>)}
                    </div>
                    <div className="space-y-4"><label className="text-[10px] font-black text-slate-300 uppercase tracking-widest pl-2">난이도</label><div className="grid grid-cols-4 gap-2">{['혼합', '하', '중', '상'].map(d => (<button key={d} onClick={() => setDifficulty(d)} className={`py-3 rounded-xl text-[10px] font-black transition-all ${difficulty === d ? 'bg-blue-600 text-white shadow-md' : 'bg-slate-50'}`}>{d}</button>))}</div></div>
                    <div className="space-y-4"><div className="flex justify-between items-center px-2"><label className="text-[10px] font-black text-slate-300 uppercase">문항 수 (₩{(count * 100).toLocaleString()})</label><input type="number" min="1" max="230" value={count} onChange={(e) => setCount(Math.min(230, Math.max(1, parseInt(e.target.value) || 1)))} className="w-16 p-2 bg-blue-50 text-blue-600 font-black text-center rounded-xl text-xs border border-blue-100 outline-none"/></div><input type="range" min="1" max="230" value={count} onChange={(e) => setCount(parseInt(e.target.value))} className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-600"/></div>
                    <button onClick={handleGenerate} disabled={isGenerating || !isSystemActive} className="w-full p-6 bg-slate-900 text-white font-black rounded-3xl flex justify-center items-center gap-4 active:scale-95 shadow-xl transition-all">{isGenerating ? <Loader2 className="animate-spin" size={24}/> : <BrainCircuit size={24}/>} {isGenerating ? "Paramedic 교수가 문제 생성 중" : "시험 생성하기"}</button>
                  </div>
                )}
              </div>
            </aside>
            <section className="lg:col-span-8">{questions.length > 0 ? (<div className="space-y-6 animate-in fade-in"><div className="flex bg-white p-4 rounded-2xl border shadow-sm justify-between items-center mb-4"><div className="flex bg-slate-100 p-1 rounded-xl"><button onClick={() => setViewMode('list')} className={`px-4 py-2 rounded-lg text-xs font-black transition-all ${viewMode === 'list' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}>목록보기</button><button onClick={() => setViewMode('slide')} className={`px-4 py-2 rounded-lg text-xs font-black transition-all ${viewMode === 'slide' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}>슬라이드</button></div></div>{viewMode === 'list' ? ( <div className="space-y-6">{questions.map(q => <QuestionCard key={q.id} q={q} onAnswerRecord={handleAnswerRecord} onReportSubmit={handleReportSubmit} isAdmin={isAdmin} />)}</div> ) : ( <div className="animate-in zoom-in-95"><QuestionCard q={questions[currentIndex]} isSlideMode={true} onAnswerRecord={handleAnswerRecord} onReportSubmit={handleReportSubmit} isAdmin={isAdmin} /><div className="flex justify-between items-center bg-slate-900 p-6 rounded-3xl text-white mt-6 shadow-2xl"><button onClick={() => setCurrentIndex(p => Math.max(0, p-1))} className="p-2 hover:bg-slate-800 rounded-xl transition-all"><ChevronLeft size={32}/></button><span className="text-xl font-black">{currentIndex + 1} / {questions.length}</span><button onClick={() => setCurrentIndex(p => Math.min(questions.length-1, p+1))} className="p-2 hover:bg-slate-800 rounded-xl transition-all"><ChevronRight size={32}/></button></div></div> )}</div>) : (<div className="bg-white rounded-[48px] border-4 border-dashed border-slate-100 p-20 text-center flex flex-col justify-center items-center min-h-[400px] md:min-h-[600px] animate-in fade-in"><h2 className="text-4xl md:text-7xl font-black text-slate-100 mb-6 tracking-tighter uppercase text-center">MESS-P</h2><p className="text-slate-300 font-bold text-center text-xl uppercase tracking-widest text-center">Medical Exam Support System</p></div>)}</section>
          </div>
        )}

        {currentView === 'dashboard' && (
          <div className="animate-in slide-in-from-bottom-5 duration-700 pb-20 text-center md:text-left">
            <h2 className="text-3xl md:text-4xl font-black mb-10 tracking-tighter uppercase text-slate-800">Learning Report</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
              <div className="bg-white p-10 rounded-[40px] border shadow-sm flex flex-col items-center"><BarChart3 size={32} className="text-blue-600 mb-4"/><p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Total Solved</p><p className="text-5xl font-black mt-2 text-slate-800">{statMetrics.total}</p></div>
              <div className="bg-blue-600 p-10 rounded-[40px] shadow-xl text-white flex flex-col items-center"><GraduationCap size={32} className="mb-4 opacity-60"/><p className="opacity-60 text-[10px] font-black uppercase tracking-widest">Accuracy</p><p className="text-5xl font-black mt-2">{statMetrics.accuracy}%</p></div>
              <div className="bg-white p-10 rounded-[40px] border shadow-sm flex flex-col items-center"><RefreshCw size={32} className="text-red-500 mb-4"/><p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Wrong Answers</p><p className="text-5xl font-black mt-2 text-slate-800">{wrongAnswers.length}</p></div>
            </div>
            <div className="space-y-8">
               <h3 className="text-2xl font-black flex items-center gap-3"><AlertCircle className="text-red-500"/> 오답 상세 리스트 (해설 포함)</h3>
               {wrongAnswers.length === 0 ? <div className="bg-white p-16 rounded-[40px] border-2 border-dashed border-slate-100 text-center text-slate-300 font-bold">오답이 아직 없습니다.</div> : (
                 <div className="space-y-6">
                    {wrongAnswers.map((q, idx) => (
                      <div key={idx} className="bg-white rounded-[32px] border-2 border-red-50 p-6 md:p-8 shadow-sm animate-in slide-in-from-bottom-5 text-left">
                         <h4 className="text-lg font-bold text-slate-800 mb-6 leading-relaxed">{q.question}</h4>
                         <div className="grid grid-cols-1 gap-2 mb-6">
                            {q.options.map((opt, i) => (
                              <div key={i} className={`p-4 rounded-xl border text-sm font-medium ${i+1 === q.answer ? 'bg-emerald-50 border-emerald-100 text-emerald-700 font-bold' : 'bg-slate-50 text-slate-400'}`}>{CIRCLE_NUMS[i]} {opt}</div>
                            ))}
                         </div>
                         <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 text-sm leading-relaxed font-medium"><span className="text-blue-600 font-black mr-2">[정답 및 해설]</span>{q.explanation}</div>
                      </div>
                    ))}
                 </div>
               )}
            </div>
          </div>
        )}

        {currentView === 'admin' && isAdmin && (
          <div className="space-y-10 pb-20 animate-in slide-in-from-bottom-5 text-left">
            <div className="flex flex-col md:flex-row justify-between items-center bg-white p-10 rounded-[40px] border-4 border-red-50 shadow-lg gap-6"><div><h2 className="text-3xl font-black tracking-tighter text-slate-900 uppercase">MESS-P Control Center</h2><p className="text-slate-400 font-bold mt-2">시스템 실시간 제어</p></div><button onClick={async () => await setDoc(doc(db, "settings", "system"), { isActive: !isSystemActive })} className={`w-full md:w-auto px-10 py-5 rounded-2xl font-black flex items-center justify-center gap-4 transition-all shadow-lg ${isSystemActive ? 'bg-red-500 text-white' : 'bg-emerald-500 text-white'}`}>{isSystemActive ? <Square/> : <Play/>} {isSystemActive ? "시스템 전체 중지" : "시스템 즉시 재개"}</button></div>
            
            {/* 📢 공지사항 관리 섹션 */}
            <div className="bg-white p-8 md:p-10 rounded-[40px] border shadow-sm space-y-6 text-left">
               <h3 className="text-2xl font-black flex items-center gap-3"><Bell className="text-blue-600"/> 공지사항 팝업 관리</h3>
               <div className="grid grid-cols-1 gap-6">
                  <input type="text" value={notice.title} onChange={e => setNotice({...notice, title: e.target.value})} className="w-full p-4 md:p-5 bg-slate-50 rounded-2xl border-none font-bold" placeholder="공지 제목 입력"/>
                  <textarea value={notice.content} onChange={e => setNotice({...notice, content: e.target.value})} className="w-full h-32 p-4 md:p-5 bg-slate-50 rounded-2xl border-none font-bold" placeholder="공지 내용 입력"/>
                  <div className="flex justify-between items-center flex-wrap gap-4"><label className="flex items-center gap-3 cursor-pointer"><input type="checkbox" checked={notice.isActive} onChange={e => setNotice({...notice, isActive: e.target.checked})} className="w-6 h-6 rounded accent-blue-600"/><span className="font-black text-slate-600 text-xs">팝업 활성화</span></label><button onClick={async () => { await setDoc(doc(db, "settings", "notice"), notice); alert("저장 완료"); }} className="px-10 py-4 bg-blue-600 text-white rounded-2xl font-black shadow-lg hover:bg-blue-700 transition-all">공지 업데이트</button></div>
               </div>
            </div>

            <div className="bg-white rounded-[40px] border shadow-sm overflow-x-auto text-left text-slate-900">
               <table className="w-full text-left min-w-[600px]">
                  <thead className="bg-slate-50 border-b font-black text-[10px] text-slate-400 uppercase tracking-widest"><tr><th className="p-6 md:p-8">유저 정보</th><th className="p-6 md:p-8 text-center">결제 권한</th><th className="p-6 md:p-8 text-center">상태</th></tr></thead>
                  <tbody>{userDb.map(u => { const isMaster = u.email === ADMIN_EMAIL; return (
                          <tr key={u.id} className={`border-b transition-all ${isMaster ? 'bg-blue-50/30' : 'hover:bg-slate-50/50'}`}>
                             <td className="p-6 md:p-8 font-bold">
                               <div className="flex items-center gap-2"> {u.name} {isMaster && <Crown size={14} className="text-blue-600"/>} </div>
                               <span className="text-xs text-slate-400 font-medium block mt-1">{u.email}</span>
                             </td>
                             <td className="p-6 md:p-8 text-center"><button onClick={() => toggleUserProperty(u.id, u.email, 'isFree', u.isFree)} className={`px-6 py-2.5 rounded-xl text-[10px] font-black ${u.isFree ? 'bg-emerald-500 text-white shadow-md' : 'bg-slate-100 text-slate-400'} ${isMaster ? 'cursor-not-allowed opacity-80' : ''}`}>{isMaster ? "MASTER" : u.isFree ? '무료' : '유료'}</button></td>
                             <td className="p-6 md:p-8 text-center"><button onClick={() => toggleUserProperty(u.id, u.email, 'isDisabled', u.isDisabled)} className={`px-6 py-2.5 rounded-xl text-[10px] font-black ${u.isDisabled ? 'bg-red-500 text-white shadow-md' : 'bg-blue-50 text-blue-600'} ${isMaster ? 'cursor-not-allowed opacity-80' : ''}`}>{isMaster ? <Lock size={12}/> : u.isDisabled ? '사용불가' : '사용가'}</button></td>
                          </tr> ); })}</tbody>
               </table>
            </div>
          </div>
        )}

        {currentView === 'payment' && (
          <div className="animate-in slide-in-from-bottom-5 duration-700 pb-20 px-2 text-center max-w-5xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-black mb-4 tracking-tighter text-slate-800 uppercase">Premium Plans</h2>
            <p className="text-slate-400 mb-12 font-bold uppercase tracking-widest text-[10px]">Quality Verified by PhD Paramedic</p>
            {paymentNotice && <div className="mb-10 p-6 bg-red-50 border-2 border-red-200 rounded-3xl flex items-center justify-center gap-4 text-red-600 font-black animate-bounce"><AlertCircle/> {paymentNotice}</div>}
            <div className="flex flex-col md:flex-row gap-8 md:gap-10">
                <div className="flex-1 bg-white p-10 md:p-12 rounded-[40px] md:rounded-[64px] border shadow-sm space-y-8 relative overflow-hidden group text-left text-slate-900">
                    <Wallet size={48} className="text-blue-600"/><h3 className="text-2xl md:text-3xl font-black tracking-tighter">포인트 충전</h3><div className="space-y-2"><p className="text-slate-400 font-bold text-sm">소량 생성 필요 시</p><p className="text-4xl md:text-5xl font-black">₩ 100 <span className="text-sm font-bold text-slate-300">/ 문항</span></p></div><button onClick={async () => { if(currentUser?.uid) await updateDoc(doc(db, "users", currentUser.uid), { points: (currentUser.points || 0) + 5000 }); alert("Google Pay 5,000원 충전 완료"); }} className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black shadow-lg hover:bg-black transition-all active:scale-95">Google Pay 충전</button>
                </div>
                <div className="flex-1 bg-white p-10 md:p-12 rounded-[40px] md:rounded-[64px] border-4 border-blue-600 shadow-2xl shadow-blue-100 space-y-8 relative group text-left text-blue-600">
                    <div className="absolute top-0 right-0 bg-blue-600 text-white px-6 md:px-8 py-3 font-black text-[10px] uppercase rounded-bl-2xl">Verified Best</div>
                    <Activity size={48}/><h3 className="text-2xl md:text-3xl font-black tracking-tighter">무제한 월 구독</h3><div className="space-y-2"><p className="text-slate-400 font-bold text-sm">국가고시 합격까지 무제한 생성</p><p className="text-4xl md:text-5xl font-black text-blue-600">₩ 19,900 <span className="text-sm font-bold text-slate-300">/ mo</span></p></div><button onClick={async () => { if(currentUser?.uid) await updateDoc(doc(db, "users", currentUser.uid), { isSubscribed: true }); alert("구독 시작!"); }} className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black shadow-lg active:scale-95 transition-all">지금 바로 구독 시작</button>
                </div>
            </div>
          </div>
        )}

        {currentView === 'profile' && (
          <div className="max-w-3xl mx-auto bg-white p-8 md:p-12 rounded-[40px] md:rounded-[64px] border shadow-sm space-y-10 animate-in slide-in-from-bottom-5 pb-24 text-left">
             <div className="flex justify-between items-center"><h2 className="text-2xl md:text-3xl font-black uppercase tracking-tighter">My Profile</h2><button onClick={handleLogout} className="px-5 py-2 bg-red-50 text-red-600 rounded-xl font-black text-[10px] uppercase hover:bg-red-100 transition-all">Logout</button></div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 text-slate-900">
                <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 ml-2 uppercase">Full Name</label><input type="text" value={currentUser?.name || ""} onChange={e => setCurrentUser({...currentUser, name: e.target.value})} className="w-full p-4 bg-slate-50 rounded-2xl outline-none font-bold shadow-sm focus:ring-2 ring-blue-100"/></div>
                <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 ml-2 uppercase">School</label><input type="text" value={currentUser?.school || ""} onChange={e => setCurrentUser({...currentUser, school: e.target.value})} className="w-full p-4 bg-slate-50 rounded-2xl outline-none font-bold shadow-sm focus:ring-2 ring-blue-100"/></div>
                <div className="col-span-1 md:col-span-2 space-y-2"><label className="text-[10px] font-black text-slate-400 ml-2 uppercase">Role Selection</label><div className="grid grid-cols-2 gap-3">{['학생', '교수'].map(r => (<button key={r} onClick={() => setCurrentUser({...currentUser, role: r})} className={`p-4 rounded-xl border transition-all font-black text-sm ${currentUser?.role === r ? 'border-blue-600 bg-blue-50 text-blue-600 ring-2 ring-blue-600' : 'bg-slate-50 text-slate-400'}`}>{r}</button>))}</div></div>
             </div>
             <button onClick={async () => { if(currentUser?.uid) await updateDoc(doc(db, "users", currentUser.uid), currentUser); alert("정보가 저장되었습니다."); }} className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black shadow-xl hover:bg-blue-700 transition-all active:scale-95">업데이트 정보 저장</button>
          </div>
        )}
      </main>
    </div>
  );
}