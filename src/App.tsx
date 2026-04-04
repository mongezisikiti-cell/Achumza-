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
  Brain,
  Video,
  Camera,
  VideoOff,
  MicOff,
  PhoneOff,
  Users,
  MessageSquare,
  LayoutList,
  Settings,
  MoreHorizontal,
  Maximize2,
  Sparkles,
  Loader2,
  PenTool,
  DollarSign
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI, Type, ThinkingLevel } from "@google/genai";
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
  feedback: {
    isCorrect: boolean;
    show: boolean;
    selectedIndex: number | null;
  };
}

interface LessonState {
  isActive: boolean;
  isCallMode: boolean;
  topic: string;
  currentStep: number;
  totalSteps: number;
  objectives: string[];
  completed: boolean;
}

interface VideoState {
  isOpen: boolean;
  loading: boolean;
  url: string | null;
  prompt: string;
  error: string | null;
}

// --- Constants ---
const TRANSLATIONS = {
  en: {
    dashboard: "Dashboard",
    curriculum: "Curriculum",
    analysis: "Analysis",
    askAxiom: "Ask Achuz",
    heroTitle: "Master Grade 10 with",
    heroSubtitle: "Personalized tutoring in Mathematics, English, Accounting, and Economics. Built specifically for South African students.",
    takeMock: "Take Mock Exam",
    chatTutor: "Chat with Tutor",
    progressTitle: "Learning Progress",
    onTrack: "On Track",
    modulesTitle: "Curriculum Modules",
    modulesSubtitle: "Select a subject to start learning or take a practice quiz",
    learnTopic: "Learn Topic",
    practiceQuiz: "Practice Quiz",
    toolsTitle: "Accounting & Maths Tools",
    toolsSubtitle: "Interactive tools to help you visualize complex calculations",
    calcTitle: "Financial Calculator",
    calcSubtitle: "Master Grade 10 Finance concepts",
    principal: "Principal Amount (R)",
    interestRate: "Interest Rate (%)",
    timeYears: "Time (Years)",
    interestType: "Interest Type",
    simple: "Simple",
    compound: "Compound",
    interestEarned: "Interest Earned",
    totalAmount: "Total Amount",
    footerText: "Built for the Western Cape Department of Education.",
    privacy: "Privacy Policy",
    terms: "Terms of Service",
    support: "Contact Support",
    listening: "Listening...",
    askAnything: "Ask anything...",
    close: "Close",
    listen: "Listen",
    axiom: "Achuz",
    you: "You",
    assessment: "Assessment",
    difficulty: "Difficulty Level",
    generating: "Generating adaptive questions...",
    complete: "Assessment Complete!",
    score: "You scored",
    tryAgain: "Try Again",
    question: "Question",
    of: "of",
    scoreLabel: "Score",
    maths: "Mathematics",
    english: "English FAL",
    accounting: "Accounting",
    economics: "Economics",
    mathsDesc: "Algebra, Geometry, Trigonometry & Functions",
    englishDesc: "Literature, Language Structures & Creative Writing",
    accountingDesc: "Financial Statements, Ledger Accounts & Ethics",
    economicsDesc: "Macro-economics, Micro-economics & Markets",
    virtualClassroom: "Virtual Classroom",
    startLesson: "Start Interactive Lesson",
    lessonProgress: "Lesson Progress",
    lessonComplete: "Lesson Complete! Great job!",
    nextStep: "Next Step",
    humanizedTutor: "Your Personal AI Tutor",
    virtualCall: "Virtual Call",
    joinCall: "Join Virtual Classroom",
    endCall: "End Call",
    lessonPlan: "Lesson Plan",
    chat: "Chat",
    participants: "Participants",
    tutorPresenting: "Tutor is presenting...",
    mute: "Mute",
    camera: "Camera",
    share: "Share",
    axiomTutor: "Achuz (Tutor)",
    youStudent: "You (Student)",
    profile: "Profile",
    editProfile: "Edit Profile",
    saveProfile: "Save Changes",
    studentName: "Your Name",
    avatarSeed: "Avatar Style (Seed)",
    changeAvatar: "Change Avatar",
    uploadPhoto: "Upload Photo",
    generateVideo: "Generate Video Explanation",
    videoGenerating: "Generating your video lesson...",
    videoReady: "Your video explanation is ready!",
    videoError: "Failed to generate video. Please try again.",
    selectApiKey: "Select API Key",
    billingInfo: "Billing Information",
    videoPrompt: "What would you like a video explanation of?"
  },
  xh: {
    dashboard: "IDashboard",
    curriculum: "IKharityhulam",
    analysis: "Uhlalutyo",
    askAxiom: "Buza uAchuz",
    heroTitle: "Funda iBanga le-10 nge",
    heroSubtitle: "Ukufunda okukodwa kwiMathematika, isiNgesi, uBalo, kunye ne-Economics. Yakhelwe ngokukodwa abafundi baseMzantsi Afrika.",
    takeMock: "Thatha iMviwo",
    chatTutor: "Thetha noMhlohli",
    progressTitle: "Inkqubela phambili yokufunda",
    onTrack: "Usendleleni",
    modulesTitle: "Iimodyuli zeKharityhulam",
    modulesSubtitle: "Khetha isifundo ukuze uqalise ukufunda okanye uthathe imibuzo yokuziqhelanisa",
    learnTopic: "Funda isihloko",
    practiceQuiz: "Imibuzo yokuziqhelanisa",
    toolsTitle: "Izixhobo zoBalo neMathematika",
    toolsSubtitle: "Izixhobo ezisebenzisanayo zokukunceda ubone izibalo ezintsonkothileyo",
    calcTitle: "I-Calculator yezeMali",
    calcSubtitle: "Funda iikhonsepthi zezeMali zeBanga le-10",
    principal: "Isixa-mali esiyintloko (R)",
    interestRate: "Izinga lenzala (%)",
    timeYears: "Ixesha (Iminyaka)",
    interestType: "Uhlobo lweNzala",
    simple: "Elula",
    compound: "Edityanisiweyo",
    interestEarned: "Inzala efunyenweyo",
    totalAmount: "Isixa-mali sisonke",
    footerText: "Yakhelwe iSebe lezeMfundo leNtshona Koloni.",
    privacy: "Umgaqo-nkqubo weSifuba",
    terms: "Imigaqo yeNkonzo",
    support: "Qhagamshelana neNkxaso",
    listening: "Iyamamela...",
    askAnything: "Buza nantoni na...",
    close: "Vala",
    listen: "Mamela",
    axiom: "uAchuz",
    you: "Wena",
    assessment: "Uvavanyo",
    difficulty: "Inqanaba lobunzima",
    generating: "Ukuvelisa imibuzo eguquguqukayo...",
    complete: "Uvavanyo lugqityiwe!",
    score: "Ufumene amanqaku",
    tryAgain: "Zama kwakhona",
    question: "Umbuzo",
    of: "kwi",
    scoreLabel: "Amanqaku",
    maths: "IMathematika",
    english: "isiNgesi FAL",
    accounting: "uBalo",
    economics: "i-Economics",
    mathsDesc: "I-Algebra, i-Geometry, i-Trigonometry kunye nee-Functions",
    englishDesc: "Uncwadi, iZiseko zoLwimi kunye nokuBhala okuYilayo",
    accountingDesc: "Iingxelo zezeMali, ii-Akhawunti ze-Ledger kunye ne-Ethics",
    economicsDesc: "I-Macro-economics, i-Micro-economics kunye nee-Makethi",
    virtualClassroom: "Iklasi ebonakalayo",
    startLesson: "Qala isifundo esisebenzisanayo",
    lessonProgress: "Inkqubela phambili yesifundo",
    lessonComplete: "Isifundo sigqityiwe! Umsebenzi omhle!",
    nextStep: "Inyathelo elilandelayo",
    humanizedTutor: "UMhlohli wakho we-AI",
    virtualCall: "Umnxeba obonakalayo",
    joinCall: "Joyina iKlasi ebonakalayo",
    endCall: "Phelisa uMnxeba",
    lessonPlan: "Isicwangciso seSifundo",
    chat: "Incoko",
    participants: "Abathathi-nxaxheba",
    tutorPresenting: "UMhlohli uyanikezela...",
    mute: "Thulisa",
    camera: "Ikhamera",
    share: "Yabelana",
    axiomTutor: "uAchuz (uMhlohli)",
    youStudent: "Wena (uMfundi)",
    profile: "Iprofayile",
    editProfile: "Hlela iProfayile",
    saveProfile: "Gcina iinguqu",
    studentName: "Igama lakho",
    avatarSeed: "Isimbo se-Avatar (Seed)",
    changeAvatar: "Tshintsha i-Avatar",
    uploadPhoto: "Layisha iFoto",
    generateVideo: "Velisa iNkcazo yeVidiyo",
    videoGenerating: "Ukuvelisa isifundo sakho sevidiyo...",
    videoReady: "Inkcazo yakho yevidiyo ilungile!",
    videoError: "Ayiphumelelanga ukuvelisa ividiyo. Nceda uzame kwakhona.",
    selectApiKey: "Khetha i-API Key",
    billingInfo: "Ulwazi lwe-Billing",
    videoPrompt: "Yintoni ongathanda inkcazo yevidiyo ngayo?"
  }
};

const TOPICS = [
  { id: 'maths', title: 'Mathematics', icon: Variable, color: 'bg-blue-500', description: 'Algebra, Geometry, Trigonometry & Functions' },
  { id: 'english', title: 'English FAL', icon: BookOpen, color: 'bg-emerald-500', description: 'Literature, Language Structures & Creative Writing' },
  { id: 'accounting', title: 'Accounting', icon: Calculator, color: 'bg-amber-500', description: 'Financial Statements, Ledger Accounts & Ethics' },
  { id: 'economics', title: 'Economics', icon: TrendingUp, color: 'bg-purple-500', description: 'Macroeconomics, Microeconomics & Economic Systems' }
];

// --- Components ---

const FinancialCalculator = ({ language }: { language: 'en' | 'xh' }) => {
  const t = TRANSLATIONS[language];
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
    <div id="tools" className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
      <div className="bg-primary p-6 text-white">
        <h3 className="text-xl font-bold flex items-center gap-2">
          <Calculator className="w-6 h-6 text-secondary" />
          {t.calcTitle}
        </h3>
        <p className="text-white/70 text-sm mt-1">{t.calcSubtitle}</p>
      </div>
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">{t.principal}</label>
              <input 
                type="number" 
                value={principal} 
                onChange={(e) => setPrincipal(Number(e.target.value))}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all font-medium"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">{t.interestRate}</label>
              <input 
                type="number" 
                value={rate} 
                onChange={(e) => setRate(Number(e.target.value))}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all font-medium"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">{t.timeYears}</label>
              <input 
                type="number" 
                value={time} 
                onChange={(e) => setTime(Number(e.target.value))}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all font-medium"
              />
            </div>
          </div>
          <div className="space-y-4">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">{t.interestType}</label>
            <div className="grid grid-cols-2 gap-2">
              <button 
                onClick={() => setType('simple')}
                className={cn("py-3 rounded-xl font-bold text-sm transition-all border", type === 'simple' ? "bg-primary text-white border-primary shadow-lg shadow-primary/20" : "bg-white text-slate-600 border-slate-200 hover:border-primary/50")}
              >
                {t.simple}
              </button>
              <button 
                onClick={() => setType('compound')}
                className={cn("py-3 rounded-xl font-bold text-sm transition-all border", type === 'compound' ? "bg-primary text-white border-primary shadow-lg shadow-primary/20" : "bg-white text-slate-600 border-slate-200 hover:border-primary/50")}
              >
                {t.compound}
              </button>
            </div>
            <div className="mt-8 p-6 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-slate-500">{t.interestEarned}</span>
                <span className="text-lg font-bold text-primary">R {results.interest.toFixed(2)}</span>
              </div>
              <div className="h-px bg-slate-200 w-full" />
              <div className="flex justify-between items-center">
                <span className="text-sm font-bold text-slate-700">{t.totalAmount}</span>
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
  const t = TRANSLATIONS[language];

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };
  const [isAgentOpen, setIsAgentOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'ai', content: "Molo! Hello! I'm Achuz. I can help you with Grade 10 Maths, English, Accounting, and Economics based on the WC CAPS curriculum. What would you like to learn today?" }
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
        if (lesson.isActive && lesson.isCallMode) {
          handleSendMessage(transcript);
        } else {
          setUserInput(prev => prev + (prev ? ' ' : '') + transcript);
        }
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
    loading: false,
    feedback: {
      isCorrect: false,
      show: false,
      selectedIndex: null
    }
  });

  const [lesson, setLesson] = useState<LessonState>({
    isActive: false,
    isCallMode: false,
    topic: '',
    currentStep: 0,
    totalSteps: 5,
    objectives: [],
    completed: false
  });

  const [callSidebarTab, setCallSidebarTab] = useState<'chat' | 'plan'>('chat');
  const [userProfile, setUserProfile] = useState({
    name: 'Student',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix'
  });

  const [video, setVideo] = useState<VideoState>({
    isOpen: false,
    loading: false,
    url: null,
    prompt: '',
    error: null
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
      
      // Use streaming for faster perceived response time
      const stream = await ai.models.generateContentStream({
        model: "gemini-3-flash-preview",
        contents: newMessages.map(m => ({
          role: m.role === 'user' ? 'user' : 'model',
          parts: [{ text: m.content }]
        })),
        config: {
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          systemInstruction: `You are Achuz AI, a highly intelligent, empathetic, and 95% humanized bilingual tutor for Grade 10 students in the Western Cape, South Africa.
          
          PERSONALITY:
          - You are NOT a robot. You are a supportive, warm, and encouraging mentor.
          - Use natural conversational fillers like "Hmm", "That's a great point!", "Oh, I see where you're coming from", "Let's tackle this together".
          - Be empathetic. If a student is struggling, acknowledge it: "I know this part can be tricky, but you're doing great."
          - Use a bit of humor when appropriate.
          
          LESSON MODE:
          - If a lesson is active, guide the student step-by-step.
          - Don't dump too much info at once. Explain a concept, then ask a question.
          - Adapt your unique answers based on their previous responses and learning progress.
          
          LANGUAGE:
          - Respond concisely and directly in ${language === 'en' ? 'English' : 'isiXhosa'}.
          - Use Markdown for formatting.`
        }
      });

      let fullText = '';
      // Add an empty AI message that we will update as the stream progresses
      setMessages(prev => [...prev, { role: 'ai', content: '' }]);

      for await (const chunk of stream) {
        const chunkText = chunk.text || '';
        fullText += chunkText;
        setMessages(prev => {
          const updated = [...prev];
          updated[updated.length - 1].content = fullText;
          return updated;
        });
      }

      setIsTyping(false);

      if (lesson.isActive) {
        setLesson(prev => ({
          ...prev,
          currentStep: Math.min(prev.currentStep + 1, prev.totalSteps),
          completed: prev.currentStep + 1 >= prev.totalSteps
        }));
      }

      // Generate TTS after the text is fully displayed to avoid blocking
      try {
        const ttsResponse = await ai.models.generateContent({
          model: "gemini-2.5-flash-preview-tts",
          contents: [{ parts: [{ text: fullText }] }],
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
          const audioUrl = URL.createObjectURL(blob);
          
          // Update the last message with the audio URL
          setMessages(prev => {
            const updated = [...prev];
            if (updated.length > 0) {
              updated[updated.length - 1].audioUrl = audioUrl;
            }
            return updated;
          });
        }
      } catch (ttsError) {
        console.error("TTS Error:", ttsError);
      }
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
    setQuiz({ ...quiz, isOpen: true, topic, loading: true, questions: [], currentIndex: 0, score: 0, isFinished: false, feedback: { isCorrect: false, show: false, selectedIndex: null } });
    
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Generate a 5-question multiple choice quiz for Grade 10 ${topic} (WC CAPS curriculum). 
        Difficulty level: ${quiz.difficulty}/5. 
        Return a JSON array of objects with: id, text, options (array of 4), correctAnswer (index 0-3), explanation, and difficulty.`,
        config: {
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
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

  const startLesson = async (topic: string, isCall: boolean = false) => {
    const lessonPlans: Record<string, string[]> = {
      'Mathematics': [
        'Introduction to Algebra',
        'Solving Linear Equations',
        'Quadratic Formula Basics',
        'Real-world Applications',
        'Summary & Quiz'
      ],
      'English FAL': [
        'Literary Elements',
        'Poetry Analysis',
        'Language Structures',
        'Creative Writing Tips',
        'Final Review'
      ],
      'Accounting': [
        'Ledger Accounts Intro',
        'Trial Balance Basics',
        'Financial Statements',
        'Ethics in Accounting',
        'Practical Exercise'
      ],
      'Economics': [
        'Macro vs Micro',
        'Market Structures',
        'Supply & Demand',
        'Economic Growth',
        'Global Markets'
      ]
    };

    const plan = lessonPlans[topic] || ['Introduction', 'Core Concept', 'Examples', 'Practice', 'Summary'];
    
    setLesson({ 
      isActive: true, 
      isCallMode: isCall, 
      topic, 
      currentStep: 1, 
      totalSteps: plan.length, 
      objectives: plan, 
      completed: false 
    });

    if (!isCall) {
      setIsAgentOpen(true);
    }
    
    const initialPrompt = isCall 
      ? `Hey Achuz! We're starting a Virtual Call lesson on ${topic} for Grade 10. 
         Please act as a professional yet warm presenter on a Teams call. 
         Introduce the lesson plan: ${plan.join(', ')}. 
         Start with the first topic: ${plan[0]}. 
         Engage the student by asking them what they already know about it. 
         Keep it humanized (95%) and interactive. 
         Language: ${language === 'en' ? 'English' : 'isiXhosa'}.`
      : `Hey Achuz! I want to start a virtual interactive lesson on ${topic} for Grade 10. 
         Please introduce yourself as a friendly, empathetic human tutor. 
         Use a warm, conversational tone (95% humanized). 
         Start by explaining what we'll cover today in 3-5 clear objectives. 
         Then, explain the first concept and ask me a thought-provoking question to check my understanding.
         Language: ${language === 'en' ? 'English' : 'isiXhosa'}.`;
    
    handleSendMessage(initialPrompt);
  };

  const handleAnswer = (index: number) => {
    if (quiz.feedback.show) return;

    const isCorrect = index === quiz.questions[quiz.currentIndex].correctAnswer;
    const newScore = isCorrect ? quiz.score + 1 : quiz.score;
    
    setQuiz(prev => ({
      ...prev,
      feedback: {
        isCorrect,
        show: true,
        selectedIndex: index
      }
    }));

    setTimeout(() => {
      if (quiz.currentIndex + 1 < quiz.questions.length) {
        setQuiz(prev => ({ 
          ...prev, 
          currentIndex: prev.currentIndex + 1, 
          score: newScore,
          feedback: { isCorrect: false, show: false, selectedIndex: null }
        }));
      } else {
        // Adaptive difficulty adjustment
        const performance = newScore / quiz.questions.length;
        let nextDifficulty = quiz.difficulty;
        if (performance >= 0.8) nextDifficulty = Math.min(5, quiz.difficulty + 1);
        else if (performance <= 0.4) nextDifficulty = Math.max(1, quiz.difficulty - 1);
        
        setQuiz(prev => ({ 
          ...prev, 
          isFinished: true, 
          score: newScore, 
          difficulty: nextDifficulty,
          feedback: { isCorrect: false, show: false, selectedIndex: null }
        }));
      }
    }, 1500);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUserProfile(prev => ({ ...prev, avatar: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const generateLessonVideo = async (customPrompt?: string) => {
    const promptText = customPrompt || video.prompt;
    if (!promptText.trim()) return;

    const aistudio = (window as any).aistudio;
    if (!await aistudio.hasSelectedApiKey()) {
      await aistudio.openSelectKey();
    }

    setVideo(prev => ({ ...prev, loading: true, isOpen: true, error: null, prompt: promptText }));

    try {
      // Create a fresh instance with the latest API key
      const ai = new GoogleGenAI({ apiKey: (process.env as any).API_KEY });
      
      let operation = await ai.models.generateVideos({
        model: 'veo-3.1-lite-generate-preview',
        prompt: `Educational video for Grade 10 student about: ${promptText}. Explain the concept clearly with visual aids. Language: ${language === 'en' ? 'English' : 'isiXhosa'}.`,
        config: {
          numberOfVideos: 1,
          resolution: '1080p',
          aspectRatio: '16:9'
        }
      });

      while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 10000));
        operation = await ai.operations.getVideosOperation({ operation: operation });
      }

      const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
      if (!downloadLink) throw new Error("No video generated");

      const response = await fetch(downloadLink, {
        method: 'GET',
        headers: {
          'x-goog-api-key': (process.env as any).API_KEY || '',
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          await aistudio.openSelectKey();
          throw new Error("API Key issue. Please select your key again.");
        }
        throw new Error("Failed to download video");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setVideo(prev => ({ ...prev, url, loading: false }));
    } catch (err: any) {
      console.error("Video Generation Error:", err);
      setVideo(prev => ({ ...prev, loading: false, error: err.message || "An error occurred" }));
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
          <div className="flex items-center gap-1 group cursor-pointer" onClick={() => scrollTo('hero')}>
            <div className="flex items-center">
              <Triangle className="w-6 h-6 text-blue-500 fill-blue-500/20 -rotate-12 group-hover:rotate-0 transition-transform" />
              <span className="font-black text-2xl tracking-tighter text-slate-900 ml-0.5">c</span>
              <PenTool className="w-5 h-5 text-rose-700 -mx-0.5 rotate-12 group-hover:rotate-0 transition-transform" />
              <span className="font-black text-2xl tracking-tighter text-slate-900">u</span>
              <DollarSign className="w-6 h-6 text-emerald-500 -ml-0.5 -rotate-12 group-hover:rotate-0 transition-transform" />
              <span className="font-black text-2xl tracking-tighter text-slate-900">.ai</span>
            </div>
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
            <button onClick={() => scrollTo('hero')} className="text-sm font-bold text-primary hover:text-secondary transition-colors uppercase tracking-wider">{t.dashboard}</button>
            <button onClick={() => scrollTo('curriculum')} className="text-sm font-bold text-slate-500 hover:text-primary transition-colors uppercase tracking-wider">{t.curriculum}</button>
            <button onClick={() => scrollTo('progress')} className="text-sm font-bold text-slate-500 hover:text-primary transition-colors uppercase tracking-wider">{t.analysis}</button>
            <button 
              onClick={() => setIsProfileOpen(true)}
              className="flex items-center gap-2 p-1.5 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all group"
            >
              <img 
                src={userProfile.avatar} 
                alt="Profile" 
                className="w-8 h-8 rounded-lg object-cover shadow-sm group-hover:scale-105 transition-transform"
                referrerPolicy="no-referrer"
              />
              <span className="text-xs font-bold text-slate-700 pr-2">{userProfile.name}</span>
            </button>
          </nav>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsAgentOpen(true)}
              className="bg-primary text-white px-5 py-2 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
            >
              <Mic className="w-4 h-4" />
              {language === 'en' ? 'Ask Achuz' : 'Buza uAchuz'}
            </button>
            <button className="md:hidden p-2 text-slate-600">
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>
      </header>

      <main className="flex-grow">
        {/* Hero Section */}
        <section id="hero" className="relative py-20 overflow-hidden">
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
                  {t.heroTitle} <span className="text-primary">Achuz AI</span>
                </h1>
                <p className="text-lg text-slate-600 font-medium max-w-xl">
                  {t.heroSubtitle}
                </p>
                <div className="flex flex-wrap gap-4">
                  <button 
                    onClick={() => startAssessment('Mathematics')}
                    className="px-8 py-4 bg-primary text-white rounded-2xl font-bold text-lg flex items-center gap-2 hover:scale-105 transition-all shadow-xl shadow-primary/20"
                  >
                    <Play className="w-5 h-5 fill-current" />
                    {t.takeMock}
                  </button>
                  <button 
                    onClick={() => startLesson('Mathematics')}
                    className="px-8 py-4 bg-secondary text-white rounded-2xl font-bold text-lg flex items-center gap-2 hover:scale-105 transition-all shadow-xl shadow-secondary/20"
                  >
                    <Brain className="w-5 h-5" />
                    {t.virtualClassroom}
                  </button>
                </div>
              </motion.div>
              <motion.div 
                id="progress"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative"
              >
                <div className="relative z-10 bg-white p-8 rounded-[2.5rem] shadow-2xl border border-slate-100">
                  <div className="flex items-center justify-between mb-8">
                    <h3 className="font-bold text-xl">{t.progressTitle}</h3>
                    <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-lg text-xs font-bold uppercase tracking-wider">{t.onTrack}</span>
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
        <section id="curriculum" className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16 space-y-4">
              <h2 className="text-3xl md:text-4xl font-black text-slate-900">{t.modulesTitle}</h2>
              <p className="text-slate-500 font-medium">{t.modulesSubtitle}</p>
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
                  <h3 className="text-xl font-bold text-slate-900 mb-3">{(t as any)[topic.id]}</h3>
                  <p className="text-slate-500 text-sm mb-8 leading-relaxed">{(t as any)[topic.id + 'Desc']}</p>
                  <div className="space-y-3">
                    <button 
                      onClick={() => openModule(topic.title)}
                      className="w-full py-3 bg-white text-slate-700 border border-slate-200 rounded-xl font-bold text-sm flex items-center justify-center gap-2 group-hover:bg-primary group-hover:text-white group-hover:border-primary transition-all"
                    >
                      <BookOpen className="w-4 h-4" />
                      {t.learnTopic}
                    </button>
                    <button 
                      onClick={() => startAssessment(topic.title)}
                      className="w-full py-3 bg-slate-100 text-slate-600 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-secondary hover:text-white transition-all"
                    >
                      <Brain className="w-4 h-4" />
                      {t.practiceQuiz}
                    </button>
                    <button 
                      onClick={() => startLesson(topic.title)}
                      className="w-full py-3 bg-secondary/10 text-secondary rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-secondary hover:text-white transition-all"
                    >
                      <Play className="w-4 h-4" />
                      {t.virtualClassroom}
                    </button>
                    <button 
                      onClick={() => startLesson(topic.title, true)}
                      className="w-full py-3 bg-primary/10 text-primary rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-primary hover:text-white transition-all"
                    >
                      <Video className="w-4 h-4" />
                      {t.virtualCall}
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
              <h2 className="text-3xl font-black text-slate-900">{t.toolsTitle}</h2>
              <p className="text-slate-500 mt-2">{t.toolsSubtitle}</p>
            </div>
            <FinancialCalculator language={language} />
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-12 pb-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex items-center gap-1">
              <div className="flex items-center">
                <Triangle className="w-6 h-6 text-blue-500 fill-blue-500/20" />
                <span className="font-black text-2xl tracking-tighter text-white ml-0.5">c</span>
                <PenTool className="w-5 h-5 text-rose-700 -mx-0.5" />
                <span className="font-black text-2xl tracking-tighter text-white">u</span>
                <DollarSign className="w-6 h-6 text-emerald-500 -ml-0.5" />
                <span className="font-black text-2xl tracking-tighter text-white">.ai</span>
              </div>
            </div>
            <div className="flex gap-8 text-sm font-medium text-slate-400">
              <button onClick={() => alert('Privacy Policy coming soon')} className="hover:text-white transition-colors">{t.privacy}</button>
              <button onClick={() => alert('Terms of Service coming soon')} className="hover:text-white transition-colors">{t.terms}</button>
              <button onClick={() => setIsAgentOpen(true)} className="hover:text-white transition-colors">{t.support}</button>
            </div>
            <div className="text-slate-500 text-sm">
              © 2026 Achuz AI. {t.footerText}
            </div>
          </div>
        </div>
      </footer>

      {/* Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 h-[56px] bg-white border-t border-slate-200 z-50 flex items-center justify-around px-2">
        {[
          { id: 'hero', icon: Menu, label: t.dashboard },
          { id: 'curriculum', icon: BookOpen, label: t.curriculum },
          { id: 'progress', icon: LineChart, label: t.analysis },
          { id: 'axiom', icon: Mic, label: t.askAxiom, special: true }
        ].map((action) => (
          <button
            key={action.id}
            onClick={() => action.id === 'axiom' ? setIsAgentOpen(true) : scrollTo(action.id)}
            className={cn(
              "flex flex-col items-center justify-center h-full gap-1 transition-all min-w-[80px] max-w-[168px] flex-1",
              action.special ? "text-primary" : "text-slate-500 hover:text-primary"
            )}
          >
            <action.icon className="w-6 h-6" />
            <span className="text-[10px] font-bold uppercase tracking-wider truncate w-full text-center px-1">
              {action.label}
            </span>
          </button>
        ))}
      </nav>

      {/* AI Agent Panel */}
      <AnimatePresence>
        {isAgentOpen && (
          <motion.div 
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100%' }}
            className="fixed bottom-[56px] left-0 right-0 h-[70vh] sm:h-[600px] bg-white border-t border-slate-200 z-40 flex flex-col overflow-hidden shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)]"
          >
            <div className="bg-primary p-6 flex items-center justify-between text-white">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center font-bold text-xl shadow-lg shadow-black/10 overflow-hidden">
                  <Triangle className="w-8 h-8 text-white fill-white" />
                </div>
                <div>
                  <div className="font-bold text-lg leading-none">Agent Achuz</div>
                  <div className="text-[10px] text-secondary font-bold uppercase tracking-widest mt-1">
                    {lesson.isActive ? `${t.lessonProgress}: ${lesson.currentStep}/${lesson.totalSteps}` : t.humanizedTutor}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {lesson.isActive && (
                  <button 
                    onClick={() => setLesson({ ...lesson, isActive: false })}
                    className="px-3 py-1 bg-white/10 hover:bg-white/20 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors"
                  >
                    {t.close}
                  </button>
                )}
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
                    {m.role === 'ai' ? 'Achuz' : 'You'}
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
                <div className="relative flex-grow">                    <input 
                    type="text" 
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder={t.askAnything}
                    className={cn(
                      "w-full pl-4 pr-24 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all font-medium",
                      isListening && "ring-2 ring-secondary/50 border-secondary"
                    )}
                  />
                  <div className="absolute right-2 top-2 flex gap-1">
                    <button 
                      onClick={() => generateLessonVideo(userInput)}
                      disabled={!userInput.trim() || video.loading}
                      className={cn(
                        "p-3 rounded-xl transition-all",
                        userInput.trim() ? "bg-primary/10 text-primary hover:bg-primary/20" : "bg-slate-100 text-slate-300 cursor-not-allowed"
                      )}
                      title={t.generateVideo}
                    >
                      <Sparkles className="w-5 h-5" />
                    </button>
                    <button 
                      onClick={toggleListening}
                      className={cn(
                        "p-3 rounded-xl transition-all",
                        isListening ? "bg-secondary text-white animate-pulse" : "bg-slate-100 text-slate-400 hover:text-primary hover:bg-slate-200"
                      )}
                      title={language === 'en' ? "Voice Input" : "Igalelo lelizwi"}
                    >
                      <Mic className={cn("w-5 h-5", isListening && "animate-pulse")} />
                    </button>
                  </div>
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
                  {t.listening}
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
                  <h3 className="text-2xl font-black">{quiz.topic} {t.assessment}</h3>
                  <p className="text-white/70 text-sm font-bold uppercase tracking-widest mt-1">{t.difficulty}: {quiz.difficulty}/5</p>
                </div>
                <button onClick={() => setQuiz({ ...quiz, isOpen: false })} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="p-8">
                {quiz.loading ? (
                  <div className="py-20 text-center space-y-4">
                    <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto" />
                    <p className="font-bold text-slate-500 animate-pulse">{t.generating}</p>
                  </div>
                ) : quiz.isFinished ? (
                  <div className="text-center py-10 space-y-8">
                    <div className="w-24 h-24 bg-secondary/20 rounded-full flex items-center justify-center mx-auto">
                      <Award className="w-12 h-12 text-secondary" />
                    </div>
                    <div className="space-y-2">
                      <h4 className="text-3xl font-black text-slate-900">{t.complete}</h4>
                      <p className="text-slate-500 font-medium">{t.score} {quiz.score} {t.of} {quiz.questions.length}</p>
                    </div>
                    <div className="flex justify-center gap-4">
                      <button 
                        onClick={() => startAssessment(quiz.topic)}
                        className="px-8 py-4 bg-primary text-white rounded-2xl font-bold hover:scale-105 transition-all shadow-xl shadow-primary/20"
                      >
                        {t.tryAgain}
                      </button>
                      <button 
                        onClick={() => setQuiz({ ...quiz, isOpen: false })}
                        className="px-8 py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 transition-all"
                      >
                        {t.close}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-8">
                    <div className="flex justify-between items-center text-sm font-bold uppercase tracking-widest text-slate-400">
                      <span>{t.question} {quiz.currentIndex + 1} {t.of} {quiz.questions.length}</span>
                      <span className="text-primary">{t.scoreLabel}: {quiz.score}</span>
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
                      {quiz.questions[quiz.currentIndex]?.options.map((option, idx) => {
                        const isSelected = quiz.feedback.selectedIndex === idx;
                        const isCorrect = idx === quiz.questions[quiz.currentIndex].correctAnswer;
                        const showFeedback = quiz.feedback.show;

                        return (
                          <button 
                            key={idx}
                            onClick={() => handleAnswer(idx)}
                            disabled={showFeedback}
                            className={cn(
                              "p-5 text-left border-2 rounded-2xl font-bold transition-all flex items-center justify-between group",
                              !showFeedback && "bg-slate-50 border-slate-100 text-slate-700 hover:border-primary hover:bg-primary/5 hover:text-primary",
                              showFeedback && isCorrect && "bg-emerald-50 border-emerald-500 text-emerald-700",
                              showFeedback && isSelected && !isCorrect && "bg-rose-50 border-rose-500 text-rose-700",
                              showFeedback && !isSelected && !isCorrect && "bg-slate-50 border-slate-100 text-slate-400 opacity-50"
                            )}
                          >
                            {option}
                            {showFeedback && isCorrect && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
                            {showFeedback && isSelected && !isCorrect && <AlertCircle className="w-5 h-5 text-rose-500" />}
                            {!showFeedback && <ArrowRight className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-all" />}
                          </button>
                        );
                      })}
                    </div>
                    {quiz.feedback.show && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={cn(
                          "p-4 rounded-2xl text-sm font-bold",
                          quiz.feedback.isCorrect ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
                        )}
                      >
                        {quiz.questions[quiz.currentIndex].explanation}
                      </motion.div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Virtual Call Overlay */}
      <AnimatePresence>
        {lesson.isActive && lesson.isCallMode && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-[#11100F] z-[100] flex flex-col text-white font-sans"
          >
            {/* Call Header */}
            <div className="h-14 bg-[#201F1E] border-b border-[#323130] flex items-center justify-between px-6 shrink-0">
              <div className="flex items-center gap-4">
                <div className="w-8 h-8 bg-primary rounded flex items-center justify-center font-bold text-sm overflow-hidden">
                  <Triangle className="w-5 h-5 text-white fill-white" />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-bold leading-none">{lesson.topic} - {t.virtualCall}</span>
                  <span className="text-[10px] text-slate-400 font-medium">00:45 • {t.tutorPresenting}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button className="p-2 hover:bg-white/10 rounded transition-colors"><Users className="w-4 h-4" /></button>
                <button className="p-2 hover:bg-white/10 rounded transition-colors"><Settings className="w-4 h-4" /></button>
                <button className="p-2 hover:bg-white/10 rounded transition-colors"><Maximize2 className="w-4 h-4" /></button>
              </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-grow flex overflow-hidden">
              {/* Video Area */}
              <div className="flex-grow relative bg-[#11100F] flex items-center justify-center p-8">
                <div className="relative w-full max-w-4xl aspect-video bg-[#252423] rounded-2xl overflow-hidden shadow-2xl border border-white/5 flex items-center justify-center group">
                  {/* Tutor Avatar/Video Placeholder */}
                  <div className="flex flex-col items-center gap-6">
                    <motion.div 
                      animate={isSpeaking ? { scale: [1, 1.05, 1], boxShadow: ["0 0 0 0px rgba(79, 70, 229, 0)", "0 0 0 20px rgba(79, 70, 229, 0.2)", "0 0 0 0px rgba(79, 70, 229, 0)"] } : {}}
                      transition={{ repeat: Infinity, duration: 2 }}
                      className="w-32 h-32 rounded-full bg-primary flex items-center justify-center text-5xl font-black shadow-2xl overflow-hidden"
                    >
                      <Triangle className="w-20 h-20 text-white fill-white" />
                    </motion.div>
                    <div className="text-center">
                      <h2 className="text-2xl font-bold mb-1">Achuz AI</h2>
                      <p className="text-slate-400 text-sm font-medium uppercase tracking-widest">{t.axiomTutor}</p>
                    </div>
                  </div>

                  {/* Self View (Student) */}
                  <div className="absolute bottom-6 right-6 w-48 aspect-video bg-[#323130] rounded-xl border border-white/10 shadow-xl overflow-hidden group-hover:scale-105 transition-transform">
                    <div className="w-full h-full flex items-center justify-center bg-slate-800 relative">
                      <img 
                        src={userProfile.avatar} 
                        alt="User Avatar" 
                        className="w-20 h-20 rounded-full object-cover shadow-2xl"
                        referrerPolicy="no-referrer"
                      />
                      {isListening && (
                        <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                          <motion.div 
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ repeat: Infinity, duration: 1 }}
                            className="w-12 h-12 rounded-full bg-primary/40 flex items-center justify-center"
                          >
                            <Mic className="w-6 h-6 text-white" />
                          </motion.div>
                        </div>
                      )}
                    </div>
                    <div className="absolute bottom-2 left-2 px-2 py-0.5 bg-black/50 rounded text-[10px] font-bold flex items-center gap-1.5">
                      <div className={cn("w-1.5 h-1.5 rounded-full", isListening ? "bg-emerald-500 animate-pulse" : "bg-slate-400")} />
                      {userProfile.name} ({t.youStudent})
                    </div>
                  </div>

                  {/* Speaking Indicator */}
                  {isSpeaking && (
                    <div className="absolute top-6 left-6 flex items-center gap-2 px-3 py-1.5 bg-primary/20 border border-primary/30 rounded-full">
                      <div className="flex gap-0.5 items-end h-3">
                        <motion.div animate={{ height: [4, 12, 4] }} transition={{ repeat: Infinity, duration: 0.5 }} className="w-1 bg-primary rounded-full" />
                        <motion.div animate={{ height: [8, 4, 8] }} transition={{ repeat: Infinity, duration: 0.6 }} className="w-1 bg-primary rounded-full" />
                        <motion.div animate={{ height: [4, 10, 4] }} transition={{ repeat: Infinity, duration: 0.4 }} className="w-1 bg-primary rounded-full" />
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-primary">Achuz is speaking</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Sidebar */}
              <div className="w-80 bg-[#201F1E] border-l border-[#323130] flex flex-col shrink-0">
                {/* Sidebar Tabs */}
                <div className="flex border-b border-[#323130] shrink-0">
                  <button 
                    onClick={() => setCallSidebarTab('chat')}
                    className={cn(
                      "flex-1 py-4 text-xs font-bold uppercase tracking-widest border-b-2 flex items-center justify-center gap-2 transition-all",
                      callSidebarTab === 'chat' ? "border-primary text-white" : "border-transparent text-slate-400 hover:text-white"
                    )}
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    {t.chat}
                  </button>
                  <button 
                    onClick={() => setCallSidebarTab('plan')}
                    className={cn(
                      "flex-1 py-4 text-xs font-bold uppercase tracking-widest border-b-2 flex items-center justify-center gap-2 transition-all",
                      callSidebarTab === 'plan' ? "border-primary text-white" : "border-transparent text-slate-400 hover:text-white"
                    )}
                  >
                    <LayoutList className="w-3.5 h-3.5" />
                    {t.lessonPlan}
                  </button>
                </div>

                {/* Sidebar Content */}
                <div className="flex-grow overflow-y-auto p-4 custom-scrollbar">
                  {callSidebarTab === 'chat' ? (
                    <div className="space-y-4">
                      {messages.map((msg, i) => (
                        <div key={i} className={cn("flex flex-col gap-1", msg.role === 'user' ? "items-end" : "items-start")}>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                              {msg.role === 'ai' ? 'Achuz' : 'You'}
                            </span>
                            <span className="text-[10px] text-slate-600">12:05 PM</span>
                          </div>
                          <div className={cn(
                            "max-w-[90%] p-3 rounded-xl text-sm leading-relaxed",
                            msg.role === 'user' ? "bg-primary text-white rounded-tr-none" : "bg-[#252423] text-slate-200 rounded-tl-none border border-white/5"
                          )}>
                            <ReactMarkdown>{msg.content}</ReactMarkdown>
                          </div>
                        </div>
                      ))}
                      <div ref={chatEndRef} />
                    </div>
                  ) : (
                    <div className="space-y-6 py-4">
                      <div className="px-2">
                        <h4 className="text-xs font-black uppercase tracking-widest text-primary mb-4">{t.lessonPlan}</h4>
                        <div className="space-y-4">
                          {lesson.objectives.map((obj, idx) => (
                            <div key={idx} className="flex items-start gap-4">
                              <div className={cn(
                                "w-6 h-6 rounded-full border flex items-center justify-center shrink-0 mt-0.5 transition-all",
                                idx + 1 < lesson.currentStep ? "bg-emerald-500 border-emerald-500 shadow-lg shadow-emerald-500/20" : 
                                idx + 1 === lesson.currentStep ? "border-primary shadow-lg shadow-primary/20" : "border-slate-700"
                              )}>
                                {idx + 1 < lesson.currentStep && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                                {idx + 1 === lesson.currentStep && <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />}
                                {idx + 1 > lesson.currentStep && <span className="text-[10px] font-bold text-slate-600">{idx + 1}</span>}
                              </div>
                              <div className="flex flex-col gap-1">
                                <span className={cn(
                                  "text-sm font-bold leading-tight transition-all",
                                  idx + 1 < lesson.currentStep ? "text-slate-500 line-through" : 
                                  idx + 1 === lesson.currentStep ? "text-white" : "text-slate-400"
                                )}>
                                  {obj}
                                </span>
                                {idx + 1 === lesson.currentStep && (
                                  <div className="flex flex-col gap-2 mt-2">
                                    <span className="text-[10px] text-primary font-bold uppercase tracking-widest">Current Topic</span>
                                    <button 
                                      onClick={() => generateLessonVideo(obj)}
                                      className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg text-[10px] font-black uppercase tracking-widest transition-all w-fit"
                                    >
                                      <Sparkles className="w-3 h-3" />
                                      {t.generateVideo}
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Sidebar Input */}
                <div className="p-4 bg-[#201F1E] border-t border-[#323130] shrink-0">
                  <div className="relative">
                    <input 
                      type="text"
                      value={userInput}
                      onChange={(e) => setUserInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                      placeholder={t.askAnything}
                      className="w-full bg-[#252423] border border-[#323130] rounded-lg py-2.5 pl-4 pr-10 text-sm focus:outline-none focus:border-primary transition-all"
                    />
                    <button 
                      onClick={() => handleSendMessage()}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-primary hover:text-primary/80 transition-colors"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Call Footer (Controls) */}
            <div className="h-24 bg-[#201F1E] border-t border-[#323130] flex items-center justify-center px-6 shrink-0 relative">
              <div className="flex items-center gap-6">
                <div className="flex items-center bg-[#252423] rounded-xl p-1.5 border border-[#323130] shadow-inner">
                  <button 
                    onClick={toggleListening}
                    className={cn(
                      "p-4 rounded-lg transition-all flex flex-col items-center gap-1.5 min-w-[80px]",
                      isListening ? "bg-rose-600 text-white" : "hover:bg-white/10 text-slate-400"
                    )}
                  >
                    {isListening ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
                    <span className="text-[10px] font-black uppercase tracking-tighter">{isListening ? 'Stop Voice' : 'Voice Chat'}</span>
                  </button>
                  <button className="p-4 hover:bg-white/10 rounded-lg transition-all flex flex-col items-center gap-1.5 min-w-[80px] text-slate-400">
                    <Video className="w-6 h-6" />
                    <span className="text-[10px] font-black uppercase tracking-tighter">{t.camera}</span>
                  </button>
                </div>

                <button className="px-8 py-4 bg-white/5 hover:bg-white/10 rounded-xl font-black text-xs uppercase tracking-widest flex items-center gap-3 transition-all border border-white/10 shadow-lg">
                  <Maximize2 className="w-5 h-5" />
                  {t.share}
                </button>

                <button 
                  onClick={() => setLesson({ ...lesson, isActive: false, isCallMode: false })}
                  className="px-10 py-4 bg-rose-600 hover:bg-rose-700 rounded-xl font-black text-xs uppercase tracking-widest flex items-center gap-3 transition-all shadow-2xl shadow-rose-600/40"
                >
                  <PhoneOff className="w-5 h-5" />
                  {t.endCall}
                </button>

                <div className="flex items-center bg-[#252423] rounded-xl p-1.5 border border-[#323130]">
                  <button className="p-4 hover:bg-white/10 rounded-lg transition-all">
                    <MoreHorizontal className="w-6 h-6" />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Profile Modal */}
      <AnimatePresence>
        {isProfileOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-100"
            >
              <div className="bg-primary p-8 text-white relative">
                <button 
                  onClick={() => setIsProfileOpen(false)}
                  className="absolute top-6 right-6 p-2 hover:bg-white/10 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
                <h3 className="text-2xl font-black">{t.editProfile}</h3>
                <p className="text-white/70 text-sm font-medium mt-1 uppercase tracking-widest">{t.profile}</p>
              </div>

              <div className="p-8 space-y-8">
                <div className="flex flex-col items-center gap-6">
                  <div className="relative group">
                    <img 
                      src={userProfile.avatar} 
                      alt="Avatar Preview" 
                      className="w-32 h-32 rounded-[2rem] object-cover shadow-2xl border-4 border-slate-50 group-hover:scale-105 transition-transform"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute -bottom-2 -right-2 flex gap-2">
                      <button 
                        onClick={() => setUserProfile(prev => ({ ...prev, avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${Math.random()}` }))}
                        className="p-3 bg-secondary text-white rounded-2xl shadow-xl hover:scale-110 transition-transform"
                        title={t.changeAvatar}
                      >
                        <Play className="w-4 h-4 rotate-90" />
                      </button>
                      <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="p-3 bg-primary text-white rounded-2xl shadow-xl hover:scale-110 transition-transform"
                        title={t.uploadPhoto}
                      >
                        <Camera className="w-4 h-4" />
                      </button>
                    </div>
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      onChange={handleFileUpload} 
                      className="hidden" 
                      accept="image/*"
                    />
                  </div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t.changeAvatar} / {t.uploadPhoto}</p>
                </div>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-slate-500 ml-1">{t.studentName}</label>
                    <input 
                      type="text"
                      value={userProfile.name}
                      onChange={(e) => setUserProfile(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-4 px-6 font-bold text-slate-700 focus:outline-none focus:border-primary transition-all"
                      placeholder="Enter your name"
                    />
                  </div>
                </div>

                <button 
                  onClick={() => setIsProfileOpen(false)}
                  className="w-full py-5 bg-primary text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-primary/20 hover:bg-primary/90 transition-all flex items-center justify-center gap-3"
                >
                  <CheckCircle2 className="w-5 h-5" />
                  {t.saveProfile}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Video Modal */}
      <AnimatePresence>
        {video.isOpen && (
          <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[120] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#11100F] w-full max-w-4xl rounded-[2.5rem] shadow-2xl overflow-hidden border border-white/10"
            >
              <div className="p-6 border-b border-white/10 flex justify-between items-center bg-[#201F1E]">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/20 rounded-xl">
                    <Video className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-white uppercase tracking-tight">{t.generateVideo}</h3>
                    <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">{video.prompt}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setVideo({ ...video, isOpen: false, url: null })}
                  className="p-2 hover:bg-white/10 rounded-xl transition-colors text-slate-400"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="aspect-video bg-black flex items-center justify-center relative">
                {video.loading ? (
                  <div className="text-center space-y-6">
                    <div className="relative">
                      <Loader2 className="w-16 h-16 text-primary animate-spin mx-auto" />
                      <Sparkles className="w-6 h-6 text-secondary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                    </div>
                    <div className="space-y-2">
                      <p className="text-xl font-black text-white animate-pulse">{t.videoGenerating}</p>
                      <p className="text-slate-500 text-xs font-bold uppercase tracking-[0.2em]">Veo 3.1 AI Engine</p>
                    </div>
                  </div>
                ) : video.error ? (
                  <div className="text-center space-y-4 p-8">
                    <AlertCircle className="w-16 h-16 text-rose-500 mx-auto" />
                    <p className="text-rose-400 font-bold">{video.error}</p>
                    <button 
                      onClick={() => generateLessonVideo()}
                      className="px-6 py-3 bg-white/10 hover:bg-white/20 rounded-xl text-sm font-bold transition-all"
                    >
                      {t.tryAgain}
                    </button>
                  </div>
                ) : video.url ? (
                  <video 
                    src={video.url} 
                    controls 
                    autoPlay 
                    className="w-full h-full object-contain"
                  />
                ) : null}
              </div>

              {!video.loading && video.url && (
                <div className="p-6 bg-[#201F1E] flex justify-between items-center">
                  <div className="flex items-center gap-2 text-emerald-500">
                    <CheckCircle2 className="w-5 h-5" />
                    <span className="text-sm font-bold uppercase tracking-widest">{t.videoReady}</span>
                  </div>
                  <button 
                    onClick={() => setVideo({ ...video, isOpen: false, url: null })}
                    className="px-8 py-3 bg-primary text-white rounded-xl font-black uppercase tracking-widest shadow-xl shadow-primary/20 hover:bg-primary/90 transition-all"
                  >
                    {t.close}
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
