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
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI } from "@google/genai";
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
}

interface Topic {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  subject: string;
}

interface Question {
  id: string;
  text: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  difficulty: number; // 1-5
}

interface QuizState {
  topic: Topic;
  type: 'quiz' | 'test' | 'exam';
  questions: Question[];
  currentIndex: number;
  score: number;
  difficulty: number;
  isFinished: boolean;
  userAnswers: number[];
}

// --- Constants ---
const TOPICS: Topic[] = [
  { id: 'algebra', title: 'Algebra', description: 'Expressions, factorisation, exponents, and equations.', icon: <Variable className="w-6 h-6" />, subject: 'Mathematics' },
  { id: 'functions', title: 'Functions', description: 'Linear, parabolas, hyperbolas, and graph interpretation.', icon: <LineChart className="w-6 h-6" />, subject: 'Mathematics' },
  { id: 'trigonometry', title: 'Trigonometry', description: 'Similarity, ratios, and special angles in the Cartesian plane.', icon: <Triangle className="w-6 h-6" />, subject: 'Mathematics' },
  { id: 'geometry', title: 'Euclidean Geometry', description: 'Similarity, properties of polygons, and measurement.', icon: <Shapes className="w-6 h-6" />, subject: 'Mathematics' },
  { id: 'statistics', title: 'Statistics', description: 'Univariate data, central tendency, and box-and-whisker.', icon: <BarChart2 className="w-6 h-6" />, subject: 'Mathematics' },
  { id: 'probability', title: 'Probability', description: 'Venn diagrams, rules for events, and mutually exclusive sets.', icon: <Dices className="w-6 h-6" />, subject: 'Mathematics' },
  { id: 'english', title: 'English FAL', description: 'Literature, figure of speech, and transactional writing skills.', icon: <BookOpen className="w-6 h-6" />, subject: 'English' },
  { id: 'accounting', title: 'Accounting', description: 'Sole trader journals, ledgers, and the accounting equation.', icon: <Calculator className="w-6 h-6" />, subject: 'Accounting' },
  { id: 'economics', title: 'Economics', description: 'Scarcity, demand & supply curves, and the circular flow.', icon: <TrendingUp className="w-6 h-6" />, subject: 'Economics' },
];

// --- Main Component ---
export default function App() {
  const [isAgentOpen, setIsAgentOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'ai', content: "Hello! I'm Axiom. I can help you with Grade 10 Maths, English, Accounting, and Economics based on the WC CAPS curriculum. What would you like to learn today?" }
  ]);
  const [userInput, setUserInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Quiz State
  const [activeQuiz, setActiveQuiz] = useState<QuizState | null>(null);
  const [isLoadingQuestion, setIsLoadingQuestion] = useState(false);

  // Calculator State
  const [calcType, setCalcType] = useState<'simple' | 'compound'>('simple');
  const [principal, setPrincipal] = useState<number | ''>('');
  const [rate, setRate] = useState<number | ''>('');
  const [time, setTime] = useState<number | ''>('');
  const [result, setResult] = useState({ interest: 0, total: 0 });

  useEffect(() => {
    calculateInterest();
  }, [principal, rate, time, calcType]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const calculateInterest = () => {
    const P = Number(principal) || 0;
    const r = (Number(rate) || 0) / 100;
    const t = Number(time) || 0;

    let A = 0;
    let I = 0;

    if (calcType === 'simple') {
      I = P * r * t;
      A = P + I;
    } else {
      A = P * Math.pow(1 + r, t);
      I = A - P;
    }

    setResult({ interest: I, total: A });
  };

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
          systemInstruction: "You are Axiom AI, a highly skilled tutor for Grade 10 students in the Western Cape, South Africa. You specialize in the CAPS curriculum for Mathematics, English FAL, Accounting, and Economics. Provide clear, step-by-step explanations, use local examples where relevant (e.g., South African Rand, local business contexts), and be encouraging. Keep responses concise but thorough. Use Markdown for formatting math and lists."
        }
      });

      const response = await model;
      const aiResponse = response.text || "I'm sorry, I couldn't process that. Please try again.";
      
      setMessages(prev => [...prev, { role: 'ai', content: aiResponse }]);
    } catch (error) {
      console.error("Gemini Error:", error);
      setMessages(prev => [...prev, { role: 'ai', content: "Oops! I'm having trouble connecting. Please check your connection and try again." }]);
    } finally {
      setIsTyping(false);
    }
  };

  const startAssessment = async (topic: Topic, type: 'quiz' | 'test' | 'exam') => {
    const initialQuiz: QuizState = {
      topic,
      type,
      questions: [],
      currentIndex: 0,
      score: 0,
      difficulty: 2, // Start at moderate
      isFinished: false,
      userAnswers: []
    };
    setActiveQuiz(initialQuiz);
    generateNextQuestion(initialQuiz);
  };

  const generateNextQuestion = async (currentQuiz: QuizState) => {
    setIsLoadingQuestion(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
      const prompt = `Generate a Grade 10 ${currentQuiz.topic.subject} multiple-choice question on the topic "${currentQuiz.topic.title}" for the WC CAPS curriculum. 
      Difficulty level: ${currentQuiz.difficulty}/5.
      Return the response in JSON format:
      {
        "text": "The question text",
        "options": ["Option A", "Option B", "Option C", "Option D"],
        "correctAnswer": 0, // index of correct option
        "explanation": "Brief explanation of why it's correct"
      }`;

      const result = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          responseMimeType: "application/json"
        }
      });

      const questionData = JSON.parse(result.text || '{}');
      const newQuestion: Question = {
        id: Math.random().toString(36).substr(2, 9),
        ...questionData,
        difficulty: currentQuiz.difficulty
      };

      setActiveQuiz(prev => {
        if (!prev) return null;
        return {
          ...prev,
          questions: [...prev.questions, newQuestion]
        };
      });
    } catch (error) {
      console.error("Error generating question:", error);
    } finally {
      setIsLoadingQuestion(false);
    }
  };

  const handleAnswer = (answerIndex: number) => {
    if (!activeQuiz) return;

    const currentQuestion = activeQuiz.questions[activeQuiz.currentIndex];
    const isCorrect = answerIndex === currentQuestion.correctAnswer;
    
    // Adaptive logic: increase difficulty if correct, decrease if wrong
    let nextDifficulty = activeQuiz.difficulty;
    if (isCorrect) {
      nextDifficulty = Math.min(5, nextDifficulty + 1);
    } else {
      nextDifficulty = Math.max(1, nextDifficulty - 1);
    }

    const maxQuestions = activeQuiz.type === 'quiz' ? 5 : activeQuiz.type === 'test' ? 10 : 15;
    const isLast = activeQuiz.currentIndex === maxQuestions - 1;

    const updatedQuiz = {
      ...activeQuiz,
      score: isCorrect ? activeQuiz.score + 1 : activeQuiz.score,
      userAnswers: [...activeQuiz.userAnswers, answerIndex],
      difficulty: nextDifficulty,
      currentIndex: activeQuiz.currentIndex + 1,
      isFinished: isLast
    };

    setActiveQuiz(updatedQuiz);

    if (!isLast) {
      generateNextQuestion(updatedQuiz);
    }
  };

  const openModule = (topic: Topic) => {
    setIsAgentOpen(true);
    const prompt = `Tell me more about ${topic.title} in Grade 10 ${topic.subject}. What are the key concepts I need to know for the CAPS curriculum?`;
    handleSendMessage(prompt);
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 w-full bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white font-bold text-xl">A</div>
            <span className="font-extrabold text-xl tracking-tight">AXIOM.AI</span>
          </div>
          <nav className="hidden md:flex items-center gap-8">
            <a href="#home" className="text-sm font-medium text-primary hover:text-secondary transition-colors">Dashboard</a>
            <a href="#curriculum" className="text-sm font-medium text-muted hover:text-secondary transition-colors">Curriculum</a>
            <a href="#calculator" className="text-sm font-medium text-muted hover:text-secondary transition-colors">Financial Calc</a>
            <a href="#" className="text-sm font-medium text-muted hover:text-secondary transition-colors">Analysis</a>
          </nav>
          <button className="md:hidden p-2 text-muted">
            <Menu className="w-6 h-6" />
          </button>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section id="home" className="relative pt-20 pb-32 overflow-hidden">
          <div className="absolute inset-0 hero-visual -z-10" />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="status-badge">
                <span className="status-dot" />
                <span>AI Tutor Active • Grade 10 WC CAPS</span>
              </div>
              <h1 className="text-5xl md:text-7xl font-extrabold text-primary mb-6 tracking-tight">
                Master Your <span className="text-secondary">Grade 10</span> Subjects
              </h1>
              <p className="text-lg md:text-xl text-muted max-w-2xl mx-auto mb-10 leading-relaxed">
                Your personalized AI agent for Maths, English FAL, Accounting, and Economics. 
                Tailored specifically for the Western Cape CAPS curriculum.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <button 
                  onClick={() => setIsAgentOpen(true)}
                  className="btn-primary w-full sm:w-auto"
                >
                  Start Learning
                </button>
                <button 
                  onClick={() => startAssessment(TOPICS[0], 'exam')}
                  className="inline-flex items-center justify-center px-8 py-3 rounded-xl border border-slate-200 bg-white text-primary font-semibold hover:bg-slate-50 transition-colors w-full sm:w-auto"
                >
                  Take Mock Exam
                </button>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Curriculum Modules */}
        <section id="curriculum" className="py-24 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-end justify-between mb-12">
              <div>
                <h2 className="text-3xl font-bold text-primary mb-2">Curriculum Modules</h2>
                <p className="text-muted">Select a topic to start a focused tutoring session.</p>
              </div>
              <div className="hidden sm:block">
                <span className="text-xs font-bold uppercase tracking-widest text-muted">WCED CAPS 2026</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {TOPICS.map((topic, idx) => (
                <motion.div
                  key={topic.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.05 }}
                  onClick={() => openModule(topic)}
                  className="topic-card group"
                >
                  <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center text-secondary mb-4 group-hover:bg-secondary group-hover:text-white transition-colors">
                    {topic.icon}
                  </div>
                  <h3 className="text-lg font-bold text-primary mb-2">{topic.title}</h3>
                  <p className="text-sm text-muted leading-relaxed mb-4">{topic.description}</p>
                  <div className="flex flex-wrap gap-2 mt-auto">
                    <button 
                      onClick={(e) => { e.stopPropagation(); startAssessment(topic, 'quiz'); }}
                      className="px-3 py-1.5 bg-secondary/10 text-secondary text-xs font-bold rounded-lg hover:bg-secondary hover:text-white transition-colors"
                    >
                      Quick Quiz
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); startAssessment(topic, 'test'); }}
                      className="px-3 py-1.5 bg-slate-100 text-slate-600 text-xs font-bold rounded-lg hover:bg-slate-200 transition-colors"
                    >
                      Module Test
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Financial Calculator */}
        <section id="calculator" className="py-24 bg-slate-50">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-white rounded-3xl p-8 md:p-12 shadow-xl border border-slate-100">
              <div className="flex items-center gap-3 mb-8">
                <div className="p-3 bg-accent/10 text-accent rounded-2xl">
                  <Calculator className="w-6 h-6" />
                </div>
                <h2 className="text-2xl font-bold text-primary">Financial Calculator</h2>
              </div>

              <div className="flex p-1 bg-slate-100 rounded-xl mb-10 w-fit mx-auto">
                <button 
                  onClick={() => setCalcType('simple')}
                  className={cn(
                    "px-6 py-2 text-sm font-semibold rounded-lg transition-all",
                    calcType === 'simple' ? "bg-white text-primary shadow-sm" : "text-muted hover:text-primary"
                  )}
                >
                  Simple Interest
                </button>
                <button 
                  onClick={() => setCalcType('compound')}
                  className={cn(
                    "px-6 py-2 text-sm font-semibold rounded-lg transition-all",
                    calcType === 'compound' ? "bg-white text-primary shadow-sm" : "text-muted hover:text-primary"
                  )}
                >
                  Compound Interest
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-primary">Principal Amount (P)</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted font-medium">R</span>
                      <input 
                        type="number" 
                        value={principal}
                        onChange={(e) => setPrincipal(e.target.value === '' ? '' : Number(e.target.value))}
                        placeholder="e.g. 1000"
                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-secondary/20 focus:border-secondary outline-none transition-all"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-primary">Interest Rate (% per year)</label>
                    <div className="relative">
                      <input 
                        type="number" 
                        value={rate}
                        onChange={(e) => setRate(e.target.value === '' ? '' : Number(e.target.value))}
                        placeholder="e.g. 5"
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-secondary/20 focus:border-secondary outline-none transition-all"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted font-medium">%</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-primary">Duration (Years)</label>
                    <input 
                      type="number" 
                      value={time}
                      onChange={(e) => setTime(e.target.value === '' ? '' : Number(e.target.value))}
                      placeholder="e.g. 3"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-secondary/20 focus:border-secondary outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="bg-slate-900 rounded-2xl p-8 text-white flex flex-col justify-center gap-8">
                  <div className="space-y-1">
                    <div className="text-slate-400 text-sm font-medium">Interest Earned</div>
                    <div className="text-3xl font-bold text-accent">R {result.interest.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                  </div>
                  <div className="h-px bg-slate-800" />
                  <div className="space-y-1">
                    <div className="text-slate-400 text-sm font-medium">Total Amount (A)</div>
                    <div className="text-4xl font-extrabold">R {result.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                  </div>
                  <div className="mt-4 flex items-start gap-2 text-xs text-slate-500 leading-relaxed">
                    <Info className="w-4 h-4 flex-shrink-0" />
                    <p>
                      {calcType === 'simple' 
                        ? "Formula: A = P(1 + i × n). Simple interest is calculated only on the principal amount."
                        : "Formula: A = P(1 + i)ⁿ. Compound interest is calculated on the principal and accumulated interest."}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-primary rounded flex items-center justify-center text-white font-bold text-sm">A</div>
            <span className="font-bold text-lg tracking-tight">AXIOM.AI</span>
          </div>
          <p className="text-sm text-muted">© 2026 Axiom AI. Built for Grade 10 Students in South Africa.</p>
          <div className="flex items-center gap-6">
            <a href="#" className="text-sm text-muted hover:text-primary transition-colors">Privacy</a>
            <a href="#" className="text-sm text-muted hover:text-primary transition-colors">Terms</a>
            <a href="#" className="text-sm text-muted hover:text-primary transition-colors">CAPS Guide</a>
          </div>
        </div>
      </footer>

      {/* Quiz Modal */}
      <AnimatePresence>
        {activeQuiz && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-primary/40 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <div>
                  <h3 className="font-bold text-primary">{activeQuiz.topic.title} {activeQuiz.type.toUpperCase()}</h3>
                  <p className="text-xs text-muted">Adaptive Difficulty: {activeQuiz.difficulty}/5</p>
                </div>
                <button onClick={() => setActiveQuiz(null)} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8">
                {activeQuiz.isFinished ? (
                  <div className="text-center py-12">
                    <div className="w-20 h-20 bg-secondary/10 text-secondary rounded-full flex items-center justify-center mx-auto mb-6">
                      <TrendingUp className="w-10 h-10" />
                    </div>
                    <h2 className="text-3xl font-bold text-primary mb-2">Assessment Complete!</h2>
                    <p className="text-lg text-muted mb-8">You scored {activeQuiz.score} out of {activeQuiz.questions.length}</p>
                    <div className="space-y-4 text-left max-w-md mx-auto">
                      {activeQuiz.questions.map((q, i) => (
                        <div key={i} className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                          <div className="flex items-center gap-2 mb-2">
                            <span className={cn(
                              "w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white",
                              activeQuiz.userAnswers[i] === q.correctAnswer ? "bg-green-500" : "bg-red-500"
                            )}>
                              {i + 1}
                            </span>
                            <span className="text-sm font-semibold">{q.text}</span>
                          </div>
                          <p className="text-xs text-muted pl-7">{q.explanation}</p>
                        </div>
                      ))}
                    </div>
                    <button 
                      onClick={() => setActiveQuiz(null)}
                      className="btn-primary mt-10"
                    >
                      Back to Dashboard
                    </button>
                  </div>
                ) : isLoadingQuestion || activeQuiz.questions.length <= activeQuiz.currentIndex ? (
                  <div className="flex flex-col items-center justify-center py-24 gap-4">
                    <div className="w-12 h-12 border-4 border-secondary border-t-transparent rounded-full animate-spin" />
                    <p className="text-muted font-medium">Generating adaptive question...</p>
                  </div>
                ) : (
                  <div className="space-y-8">
                    <div className="flex items-center justify-between text-xs font-bold text-muted uppercase tracking-widest">
                      <span>Question {activeQuiz.currentIndex + 1}</span>
                      <span>{activeQuiz.questions.length - activeQuiz.currentIndex} Remaining</span>
                    </div>
                    <h2 className="text-2xl font-bold text-primary leading-tight">
                      {activeQuiz.questions[activeQuiz.currentIndex].text}
                    </h2>
                    <div className="grid grid-cols-1 gap-4">
                      {activeQuiz.questions[activeQuiz.currentIndex].options.map((option, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleAnswer(idx)}
                          className="group flex items-center gap-4 p-5 bg-white border-2 border-slate-100 rounded-2xl text-left hover:border-secondary hover:bg-secondary/5 transition-all"
                        >
                          <span className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-sm font-bold text-muted group-hover:bg-secondary group-hover:text-white transition-colors">
                            {String.fromCharCode(65 + idx)}
                          </span>
                          <span className="font-medium text-slate-700">{option}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {!activeQuiz.isFinished && (
                <div className="p-4 bg-slate-50 border-t border-slate-100">
                  <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                    <motion.div 
                      className="h-full bg-secondary"
                      initial={{ width: 0 }}
                      animate={{ width: `${((activeQuiz.currentIndex) / (activeQuiz.type === 'quiz' ? 5 : activeQuiz.type === 'test' ? 10 : 15)) * 100}%` }}
                    />
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* AI Agent Panel */}
      <AnimatePresence>
        {isAgentOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 100, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.95 }}
            className="agent-panel"
          >
            <div className="bg-primary p-4 flex items-center justify-between text-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center font-bold text-lg">A</div>
                <div>
                  <div className="font-bold text-sm">Agent Axiom</div>
                  <div className="text-[10px] text-secondary font-bold uppercase tracking-widest">Expert Tutor</div>
                </div>
              </div>
              <button 
                onClick={() => setIsAgentOpen(false)}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="chat-messages">
              {messages.map((m, i) => (
                <div key={i} className={cn("message", m.role === 'ai' ? "ai" : "user")}>
                  {m.role === 'ai' ? (
                    <div className="markdown-body">
                      <ReactMarkdown>{m.content}</ReactMarkdown>
                    </div>
                  ) : (
                    m.content
                  )}
                </div>
              ))}
              {isTyping && (
                <div className="message ai italic text-muted flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-muted rounded-full animate-bounce" />
                  <span className="w-1.5 h-1.5 bg-muted rounded-full animate-bounce [animation-delay:0.2s]" />
                  <span className="w-1.5 h-1.5 bg-muted rounded-full animate-bounce [animation-delay:0.4s]" />
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50">
              <div className="flex items-center gap-2 bg-white p-2 rounded-xl border border-slate-200 shadow-sm">
                <button className="p-2 text-muted hover:text-secondary transition-colors">
                  <Mic className="w-5 h-5" />
                </button>
                <input 
                  type="text" 
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Ask a question..."
                  className="flex-1 bg-transparent outline-none text-sm px-2"
                />
                <button 
                  onClick={() => handleSendMessage()}
                  disabled={!userInput.trim() || isTyping}
                  className="p-2 bg-secondary text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
              <p className="text-[10px] text-center text-muted mt-3">
                Axiom AI can make mistakes. Verify important information.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Action Button (if agent closed) */}
      {!isAgentOpen && (
        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          onClick={() => setIsAgentOpen(true)}
          className="fixed bottom-6 right-6 w-14 h-14 bg-secondary text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-transform z-40"
        >
          <div className="font-bold text-xl">A</div>
        </motion.button>
      )}
    </div>
  );
}
