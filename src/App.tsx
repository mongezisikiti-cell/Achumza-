import { useState, useEffect, useRef } from 'react';
import { 
  Variable, 
  LineChart, 
  Triangle, 
  Shapes, 
  BarChart2, 
  Dices, 
  BookOpen, 
  Calculator, 
  TrendingUp, 
  Mic, 
  Send, 
  X, 
  Menu,
  ChevronRight,
  Info,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Play,
  Award,
  Clock,
  Brain
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI, Type } from "@google/genai";
import ReactMarkdown from 'react-markdown';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Utility for Tailwind classes
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Types ---
interface Message {
  role: 'user' | 'ai';
  content: string;
  audioUrl?: string;
}

interface Question {
  id: string;
  text: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  difficulty: number;
}

interface QuizState {
  isOpen: boolean;
  topic: string;
  questions: Question[];
  currentIndex: number;
  score: number;
  isFinished: boolean;
  difficulty: number;
  loading: boolean;
}

// --- Constants ---
const TOPICS = [
  { id: 'maths', title: 'Mathematics', icon: Variable, color: 'bg-blue-500', description: 'Algebra, Geometry, Trigonometry & Functions' },
  { id: 'english', title: 'English FAL', icon: BookOpen, color: 'bg-emerald-500', description: 'Literature, Language Structures & Creative Writing' },
  { id: 'accounting', title: 'Accounting', icon: Calculator, color: 'bg-amber-500', description: 'Financial Statements, Ledger Accounts & Ethics' },
  { id: 'economics', title: 'Economics', icon: TrendingUp, color: 'bg-purple-500', description: 'Macroeconomics, Microeconomics & Economic Systems' }
];

// --- Components ---

const FinancialCalculator = () => {
  const [principal, setPrincipal] = useState<number>(1000);
  const [rate, setRate] = useState<number>(5);
  const [time, setTime] = useState<number>(1);
  const [type, setType] = useState<'simple' | 'compound'>('simple');

  const calculate = () => {
    const r = rate / 100;
    if (type === 'simple') {
      const interest = principal * r * time;
      return { interest, total: principal + interest };
    } else {
      const total = principal * Math.pow((1 + r), time);
      return { interest: total - principal, total };
    }
  };

  const results = calculate();

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
      <div className="bg-primary p-6 text-white">
        <h3 className="text-xl font-bold flex items-center gap-2">
          <Calculator className="w-6 h-6 text-secondary" />
          Financial Calculator
        </h3>
        <p className="text-white/70 text-sm mt-1">Master Grade 10 Finance concepts</p>
      </div>
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Principal Amount (R)</label>
              <input 
                type="number" 
                value={principal} 
                onChange={(e) => setPrincipal(Number(e.target.value))}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all font-medium"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Interest Rate (%)</label>
              <input 
                type="number" 
                value={rate} 
                onChange={(e) => setRate(Number(e.target.value))}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all font-medium"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Time (Years)</label>
              <input 
                type="number" 
                value={time} 
                onChange={(e) => setTime(Number(e.target.value))}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all font-medium"
              />
            </div>
          </div>
          <div className="space-y-4">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Interest Type</label>
            <div className="grid grid-cols-2 gap-2">
              <button 
                onClick={() => setType('simple')}
                className={cn("py-3 rounded-xl font-bold text-sm transition-all border", type === 'simple' ? "bg-primary text-white border-primary shadow-lg shadow-primary/20" : "bg-white text-slate-600 border-slate-200 hover:border-primary/50")}
              >
                Simple
              </button>
              <button 
                onClick={() => setType('compound')}
                className={cn("py-3 rounded-xl font-bold text-sm transition-all border", type === 'compound' ? "bg-primary text-white border-primary shadow-lg shadow-primary/20" : "bg-white text-slate-600 border-slate-200 hover:border-primary/50")}
              >
                Compound
              </button>
            </div>
            <div className="mt-8 p-6 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-slate-500">Interest Earned</span>
                <span className="text-lg font-bold text-primary">R {results.interest.toFixed(2)}</span>
              </div>
              <div className="h-px bg-slate-200 w-full" />
              <div className="flex justify-between items-center">
                <span className="text-sm font-bold text-slate-700">Total Amount</span>
                <span className="text-2xl font-black text-secondary">R {results.total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Main Component ---
export default function App() {
  const [language, setLanguage] = useState<'en' | 'xh'>('en');
  const [isAgentOpen, setIsAgentOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'ai', content: "Molo! Hello! I'm Axiom. I can help you with Grade 10 Maths, English, Accounting, and Economics based on the WC CAPS curriculum. What would you like to learn today?" }
  ]);
  const [userInput, setUserInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      
      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setUserInput(prev => prev + (prev ? ' ' : '') + transcript);
        setIsListening(false);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
  }, []);

  useEffect(() => {
    if (recognitionRef.current) {
      recognitionRef.current.lang = language === 'en' ? 'en-ZA' : 'xh-ZA';
    }
  }, [language]);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      try {
        recognitionRef.current?.start();
        setIsListening(true);
      } catch (err) {
        console.error('Failed to start recognition:', err);
      }
    }
  };

  const [quiz, setQuiz] = useState<QuizState>({
    isOpen: false,
    topic: '',
    questions: [],
    currentIndex: 0,
    score: 0,
    isFinished: false,
    difficulty: 3,
    loading: false
  });

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping]);

  const handleSendMessage = async (customPrompt?: string) => {
    const text = customPrompt || userInput;
    if (!text.trim() || isTyping) return;

    const newMessages: Message[] = [...messages, { role: 'user', content: text }];
    setMessages(newMessages);
    setUserInput('');
    setIsTyping(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
      
      const model = ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: newMessages.map(m => ({
          role: m.role === 'user' ? 'user' : 'model',
          parts: [{ text: m.content }]
        })),
        config: {
          systemInstruction: `You are Axiom AI, a bilingual tutor for Grade 10 students in the Western Cape, South Africa. 
          You speak both English and isiXhosa fluently. 
          Current language preference: ${language === 'en' ? 'English' : 'isiXhosa'}.
          If the user speaks in isiXhosa, respond in isiXhosa. If in English, respond in English.
          You specialize in the CAPS curriculum for Mathematics, English FAL, Accounting, and Economics. 
          Provide clear, step-by-step explanations, use local examples where relevant, and be encouraging. 
          Use Markdown for formatting math and lists.`
        }
      });

      const response = await model;
      const aiResponse = response.text || "I'm sorry, I couldn't process that.";
      
      let audioUrl = '';
      try {
        const ttsResponse = await ai.models.generateContent({
          model: "gemini-2.5-flash-preview-tts",
          contents: [{ parts: [{ text: aiResponse }] }],
          config: {
            responseModalities: ["AUDIO"],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: { voiceName: 'Kore' },
              },
            },
          },
        });

        const base64Audio = ttsResponse.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (base64Audio) {
          const binary = atob(base64Audio);
          const bytes = new Uint8Array(binary.length);
          for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
          }
          const blob = new Blob([bytes], { type: 'audio/pcm;rate=24000' });
          audioUrl = URL.createObjectURL(blob);
        }
      } catch (ttsError) {
        console.error("TTS Error:", ttsError);
      }

      setMessages(prev => [...prev, { role: 'ai', content: aiResponse, audioUrl }]);
    } catch (error) {
      console.error("Gemini Error:", error);
      setMessages(prev => [...prev, { role: 'ai', content: "Oops! I'm having trouble connecting." }]);
    } finally {
      setIsTyping(false);
    }
  };

  const playAudio = (url: string) => {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    fetch(url)
      .then(res => res.arrayBuffer())
      .then(buffer => {
        const pcmData = new Int16Array(buffer);
        const audioBuffer = audioCtx.createBuffer(1, pcmData.length, 24000);
        const nowBuffering = audioBuffer.getChannelData(0);
        for (let i = 0; i < pcmData.length; i++) {
          nowBuffering[i] = pcmData[i] / 32768;
        }
        const source = audioCtx.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(audioCtx.destination);
        source.start();
        setIsSpeaking(true);
        source.onended = () => setIsSpeaking(false);
      });
  };

  const startAssessment = async (topic: string) => {
    setQuiz({ ...quiz, isOpen: true, topic, loading: true, questions: [], currentIndex: 0, score: 0, isFinished: false });
    
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Generate a 5-question multiple choice quiz for Grade 10 ${topic} (WC CAPS curriculum). 
        Difficulty level: ${quiz.difficulty}/5. 
        Return a JSON array of objects with: id, text, options (array of 4), correctAnswer (index 0-3), explanation, and difficulty.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                text: { type: Type.STRING },
                options: { type: Type.ARRAY, items: { type: Type.STRING } },
                correctAnswer: { type: Type.INTEGER },
                explanation: { type: Type.STRING },
                difficulty: { type: Type.INTEGER }
              },
              required: ["id", "text", "options", "correctAnswer", "explanation", "difficulty"]
            }
          }
        }
      });

      const questions = JSON.parse(response.text);
      setQuiz(prev => ({ ...prev, questions, loading: false }));
    } catch (error) {
      console.error("Quiz Gen Error:", error);
      setQuiz(prev => ({ ...prev, isOpen: false, loading: false }));
    }
  };

  const handleAnswer = (index: number) => {
    const isCorrect = index === quiz.questions[quiz.currentIndex].correctAnswer;
    const newScore = isCorrect ? quiz.score + 1 : quiz.score;
    
    if (quiz.currentIndex + 1 < quiz.questions.length) {
      setQuiz({ ...quiz, currentIndex: quiz.currentIndex + 1, score: newScore });
    } else {
      // Adaptive difficulty adjustment
      const performance = newScore / quiz.questions.length;
      let nextDifficulty = quiz.difficulty;
      if (performance >= 0.8) nextDifficulty = Math.min(5, quiz.difficulty + 1);
      else if (performance <= 0.4) nextDifficulty = Math.max(1, quiz.difficulty - 1);
      
      setQuiz({ ...quiz, isFinished: true, score: newScore, difficulty: nextDifficulty });
    }
  };

  const openModule = (topic: string) => {
    setIsAgentOpen(true);
    handleSendMessage(`I want to learn about ${topic}. Can you give me an overview of the Grade 10 curriculum for this subject?`);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* Header */}
      <header className="sticky top-0 z-40 w-full bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-primary/20">A</div>
            <span className="font-extrabold text-xl tracking-tight text-slate-900">AXIOM.AI</span>
          </div>
          <nav className="hidden md:flex items-center gap-8">
            <div className="flex p-1 bg-slate-100 rounded-lg mr-4">
              <button 
                onClick={() => setLanguage('en')}
                className={cn("px-3 py-1 text-xs font-bold rounded-md transition-all", language === 'en' ? "bg-white shadow-sm text-primary" : "text-slate-500")}
              >
                EN
              </button>
              <button 
                onClick={() => setLanguage('xh')}
                className={cn("px-3 py-1 text-xs font-bold rounded-md transition-all", language === 'xh' ? "bg-white shadow-sm text-primary" : "text-slate-500")}
              >
                XH
              </button>
            </div>
            <a href="#" className="text-sm font-bold text-primary hover:text-secondary transition-colors uppercase tracking-wider">Dashboard</a>
            <a href="#" className="text-sm font-bold text-slate-500 hover:text-primary transition-colors uppercase tracking-wider">Curriculum</a>
            <a href="#" className="text-sm font-bold text-slate-500 hover:text-primary transition-colors uppercase tracking-wider">Analysis</a>
          </nav>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsAgentOpen(true)}
              className="bg-primary text-white px-5 py-2 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
            >
              <Mic className="w-4 h-4" />
              {language === 'en' ? 'Ask Axiom' : 'Buza uAxiom'}
            </button>
            <button className="md:hidden p-2 text-slate-600">
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>
      </header>

      <main className="flex-grow">
        {/* Hero Section */}
        <section className="relative py-20 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-secondary/5 -z-10" />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-8"
              >
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-secondary/10 text-secondary rounded-full text-xs font-bold uppercase tracking-widest">
                  <Award className="w-3 h-3" />
                  Western Cape CAPS Curriculum
                </div>
                <h1 className="text-5xl md:text-7xl font-black text-slate-900 leading-tight">
                  {language === 'en' ? 'Master Grade 10 with' : 'Funda iBanga le-10 nge'} <span className="text-primary">Axiom AI</span>
                </h1>
                <p className="text-lg text-slate-600 font-medium max-w-xl">
                  {language === 'en' 
                    ? 'Personalized tutoring in Mathematics, English, Accounting, and Economics. Built specifically for South African students.'
                    : 'Ukufunda okukodwa kwiMathematika, isiNgesi, uBalo, kunye ne-Economics. Yakhelwe ngokukodwa abafundi baseMzantsi Afrika.'}
                </p>
                <div className="flex flex-wrap gap-4">
                  <button 
                    onClick={() => startAssessment('Mathematics')}
                    className="px-8 py-4 bg-primary text-white rounded-2xl font-bold text-lg flex items-center gap-2 hover:scale-105 transition-all shadow-xl shadow-primary/20"
                  >
                    <Play className="w-5 h-5 fill-current" />
                    {language === 'en' ? 'Take Mock Exam' : 'Thatha iMviwo'}
                  </button>
                  <button 
                    onClick={() => setIsAgentOpen(true)}
                    className="px-8 py-4 bg-white text-slate-700 border-2 border-slate-200 rounded-2xl font-bold text-lg hover:bg-slate-50 transition-all"
                  >
                    {language === 'en' ? 'Chat with Tutor' : 'Thetha noMhlohli'}
                  </button>
                </div>
              </motion.div>
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative"
              >
                <div className="relative z-10 bg-white p-8 rounded-[2.5rem] shadow-2xl border border-slate-100">
                  <div className="flex items-center justify-between mb-8">
                    <h3 className="font-bold text-xl">Learning Progress</h3>
                    <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-lg text-xs font-bold uppercase tracking-wider">On Track</span>
                  </div>
                  <div className="space-y-6">
                    {TOPICS.map((topic, i) => (
                      <div key={topic.id} className="space-y-2">
                        <div className="flex justify-between text-sm font-bold">
                          <span className="text-slate-600">{topic.title}</span>
                          <span className="text-primary">{[85, 72, 94, 68][i]}%</span>
                        </div>
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${[85, 72, 94, 68][i]}%` }}
                            transition={{ delay: 0.5 + i * 0.1, duration: 1 }}
                            className={cn("h-full rounded-full", topic.color)}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="absolute -top-6 -right-6 w-32 h-32 bg-secondary/20 rounded-full blur-3xl -z-10" />
                <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-primary/20 rounded-full blur-3xl -z-10" />
              </motion.div>
            </div>
          </div>
        </section>

        {/* Curriculum Modules */}
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16 space-y-4">
              <h2 className="text-3xl md:text-4xl font-black text-slate-900">Curriculum Modules</h2>
              <p className="text-slate-500 font-medium">Select a subject to start learning or take a practice quiz</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {TOPICS.map((topic) => (
                <motion.div 
                  key={topic.id}
                  whileHover={{ y: -8 }}
                  className="group bg-slate-50 rounded-3xl p-8 border border-slate-100 hover:border-primary/20 hover:shadow-2xl hover:shadow-primary/5 transition-all"
                >
                  <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center text-white mb-6 shadow-lg", topic.color)}>
                    <topic.icon className="w-7 h-7" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-3">{topic.title}</h3>
                  <p className="text-slate-500 text-sm mb-8 leading-relaxed">{topic.description}</p>
                  <div className="space-y-3">
                    <button 
                      onClick={() => openModule(topic.title)}
                      className="w-full py-3 bg-white text-slate-700 border border-slate-200 rounded-xl font-bold text-sm flex items-center justify-center gap-2 group-hover:bg-primary group-hover:text-white group-hover:border-primary transition-all"
                    >
                      <BookOpen className="w-4 h-4" />
                      Learn Topic
                    </button>
                    <button 
                      onClick={() => startAssessment(topic.title)}
                      className="w-full py-3 bg-slate-100 text-slate-600 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-secondary hover:text-white transition-all"
                    >
                      <Brain className="w-4 h-4" />
                      Practice Quiz
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Financial Calculator Section */}
        <section className="py-20 bg-slate-50">
          <div className="max-w-4xl mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-black text-slate-900">Accounting & Maths Tools</h2>
              <p className="text-slate-500 mt-2">Interactive tools to help you visualize complex calculations</p>
            </div>
            <FinancialCalculator />
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white font-bold text-xl">A</div>
              <span className="font-extrabold text-xl tracking-tight">AXIOM.AI</span>
            </div>
            <div className="flex gap-8 text-sm font-medium text-slate-400">
              <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-white transition-colors">Contact Support</a>
            </div>
            <div className="text-slate-500 text-sm">
              © 2026 Axiom AI. Built for the Western Cape Department of Education.
            </div>
          </div>
        </div>
      </footer>

      {/* AI Agent Panel */}
      <AnimatePresence>
        {isAgentOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 100, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.95 }}
            className="fixed bottom-6 right-6 w-[400px] h-[600px] bg-white rounded-[2rem] shadow-2xl border border-slate-200 z-50 flex flex-col overflow-hidden"
          >
            <div className="bg-primary p-6 flex items-center justify-between text-white">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center font-bold text-xl shadow-lg shadow-black/10">A</div>
                <div>
                  <div className="font-bold text-lg leading-none">Agent Axiom</div>
                  <div className="text-[10px] text-secondary font-bold uppercase tracking-widest mt-1">
                    {language === 'en' ? 'Bilingual Tutor' : 'Umhlohli weelwimi ezimbini'}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex p-0.5 bg-white/10 rounded-lg text-[10px] font-bold">
                  <button onClick={() => setLanguage('en')} className={cn("px-2 py-1 rounded", language === 'en' ? "bg-white text-primary" : "text-white/60")}>EN</button>
                  <button onClick={() => setLanguage('xh')} className={cn("px-2 py-1 rounded", language === 'xh' ? "bg-white text-primary" : "text-white/60")}>XH</button>
                </div>
                <button 
                  onClick={() => setIsAgentOpen(false)} 
                  className="p-2 hover:bg-white/10 rounded-xl transition-colors flex items-center gap-2 group"
                  aria-label="Close chat"
                >
                  <span className="text-[10px] font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity hidden sm:inline">
                    {language === 'en' ? 'Close' : 'Vala'}
                  </span>
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="flex-grow overflow-y-auto p-6 space-y-6 bg-slate-50/50">
              {messages.map((m, i) => (
                <div key={i} className={cn("flex flex-col max-w-[85%]", m.role === 'ai' ? "self-start" : "self-end items-end")}>
                  <div className={cn(
                    "p-4 rounded-2xl text-sm font-medium shadow-sm",
                    m.role === 'ai' ? "bg-white text-slate-800 border border-slate-100" : "bg-primary text-white"
                  )}>
                    {m.role === 'ai' ? (
                      <div className="space-y-3">
                        <div className="markdown-body prose prose-sm max-w-none">
                          <ReactMarkdown>{m.content}</ReactMarkdown>
                        </div>
                        {m.audioUrl && (
                          <button 
                            onClick={() => playAudio(m.audioUrl!)}
                            className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-lg text-[10px] font-bold text-primary hover:bg-slate-200 transition-all uppercase tracking-wider"
                          >
                            <Mic className="w-3 h-3" /> {language === 'en' ? 'Listen' : 'Mamela'}
                          </button>
                        )}
                      </div>
                    ) : (
                      m.content
                    )}
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">
                    {m.role === 'ai' ? 'Axiom' : 'You'}
                  </span>
                </div>
              ))}
              {isTyping && (
                <div className="flex gap-1 p-4 bg-white rounded-2xl w-16 shadow-sm border border-slate-100">
                  <div className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce" />
                  <div className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce [animation-delay:0.2s]" />
                  <div className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce [animation-delay:0.4s]" />
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            <div className="p-6 bg-white border-t border-slate-100">
              <div className="relative flex items-center gap-2">
                <div className="relative flex-grow">
                  <input 
                    type="text" 
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder={language === 'en' ? "Ask anything..." : "Buza nantoni na..."}
                    className={cn(
                      "w-full pl-4 pr-12 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all font-medium",
                      isListening && "ring-2 ring-secondary/50 border-secondary"
                    )}
                  />
                  <button 
                    onClick={toggleListening}
                    className={cn(
                      "absolute right-2 top-2 p-3 rounded-xl transition-all",
                      isListening ? "bg-secondary text-white animate-pulse" : "bg-slate-100 text-slate-400 hover:text-primary hover:bg-slate-200"
                    )}
                    title={language === 'en' ? "Voice Input" : "Igalelo lelizwi"}
                  >
                    <Mic className={cn("w-5 h-5", isListening && "animate-pulse")} />
                  </button>
                </div>
                <button 
                  onClick={() => handleSendMessage()}
                  disabled={!userInput.trim() || isTyping}
                  className="p-4 bg-primary text-white rounded-2xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 disabled:opacity-50 disabled:shadow-none"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
              {isListening && (
                <motion.p 
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-[10px] font-bold text-secondary mt-2 text-center uppercase tracking-widest animate-pulse"
                >
                  {language === 'en' ? 'Listening...' : 'Iyamamela...'}
                </motion.p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quiz Modal */}
      <AnimatePresence>
        {quiz.isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden"
            >
              <div className="bg-primary p-8 text-white flex justify-between items-center">
                <div>
                  <h3 className="text-2xl font-black">{quiz.topic} Assessment</h3>
                  <p className="text-white/70 text-sm font-bold uppercase tracking-widest mt-1">Difficulty Level: {quiz.difficulty}/5</p>
                </div>
                <button onClick={() => setQuiz({ ...quiz, isOpen: false })} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="p-8">
                {quiz.loading ? (
                  <div className="py-20 text-center space-y-4">
                    <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto" />
                    <p className="font-bold text-slate-500 animate-pulse">Generating adaptive questions...</p>
                  </div>
                ) : quiz.isFinished ? (
                  <div className="text-center py-10 space-y-8">
                    <div className="w-24 h-24 bg-secondary/20 rounded-full flex items-center justify-center mx-auto">
                      <Award className="w-12 h-12 text-secondary" />
                    </div>
                    <div className="space-y-2">
                      <h4 className="text-3xl font-black text-slate-900">Assessment Complete!</h4>
                      <p className="text-slate-500 font-medium">You scored {quiz.score} out of {quiz.questions.length}</p>
                    </div>
                    <div className="flex justify-center gap-4">
                      <button 
                        onClick={() => startAssessment(quiz.topic)}
                        className="px-8 py-4 bg-primary text-white rounded-2xl font-bold hover:scale-105 transition-all shadow-xl shadow-primary/20"
                      >
                        Try Again
                      </button>
                      <button 
                        onClick={() => setQuiz({ ...quiz, isOpen: false })}
                        className="px-8 py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 transition-all"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-8">
                    <div className="flex justify-between items-center text-sm font-bold uppercase tracking-widest text-slate-400">
                      <span>Question {quiz.currentIndex + 1} of {quiz.questions.length}</span>
                      <span className="text-primary">Score: {quiz.score}</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <motion.div 
                        className="h-full bg-primary"
                        initial={{ width: 0 }}
                        animate={{ width: `${((quiz.currentIndex + 1) / quiz.questions.length) * 100}%` }}
                      />
                    </div>
                    <h4 className="text-xl font-bold text-slate-900 leading-relaxed">
                      {quiz.questions[quiz.currentIndex]?.text}
                    </h4>
                    <div className="grid grid-cols-1 gap-4">
                      {quiz.questions[quiz.currentIndex]?.options.map((option, idx) => (
                        <button 
                          key={idx}
                          onClick={() => handleAnswer(idx)}
                          className="p-5 text-left bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold text-slate-700 hover:border-primary hover:bg-primary/5 hover:text-primary transition-all flex items-center justify-between group"
                        >
                          {option}
                          <ArrowRight className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-all" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Floating Toggle Button */}
      <button 
        onClick={() => setIsAgentOpen(!isAgentOpen)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-primary text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-[60] group md:hidden"
        aria-label={isAgentOpen ? "Close chat" : "Open chat"}
      >
        <AnimatePresence mode="wait">
          {isAgentOpen ? (
            <motion.div
              key="close"
              initial={{ opacity: 0, rotate: -90 }}
              animate={{ opacity: 1, rotate: 0 }}
              exit={{ opacity: 0, rotate: 90 }}
            >
              <X className="w-6 h-6" />
            </motion.div>
          ) : (
            <motion.div
              key="open"
              initial={{ opacity: 0, rotate: 90 }}
              animate={{ opacity: 1, rotate: 0 }}
              exit={{ opacity: 0, rotate: -90 }}
            >
              <Mic className="w-6 h-6" />
            </motion.div>
          )}
        </AnimatePresence>
      </button>
    </div>
  );
}
