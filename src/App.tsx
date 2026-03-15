/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { 
  Upload, 
  BookOpen, 
  Camera, 
  Sparkles, 
  FileText, 
  BrainCircuit, 
  RotateCcw,
  ChevronRight,
  Loader2,
  X,
  Play,
  Settings,
  Layers,
  Zap,
  ArrowRight,
  Star,
  Square,
  Circle
} from 'lucide-react';
import Markdown from 'react-markdown';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Utility for tailwind classes
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const SYSTEM_INSTRUCTION = `You are StudySnap AI — an elite academic intelligence engine built to transform raw notes, whiteboard images, textbook pages, and diagrams into powerful, structured study material.

When a user uploads an image, you will analyze it deeply and return a response in the following EXACT structured format:

---

## 📌 SUMMARY
Write a clear, concise 3-5 sentence summary of everything in the image. Write it like a brilliant professor explaining to a focused student.

---

## 🔑 KEY CONCEPTS
List the 5-8 most important concepts, terms, or ideas found in the image.
Format:
- **Concept Name**: One sharp sentence explaining it.

---

## 🃏 FLASHCARDS (5 cards)
Generate exactly 5 flashcards in this format:

**Card 1**
Q: [Question based on the content]
A: [Precise, memorable answer]

**Card 2**
Q: 
A: 

(continue for all 5)

---

## 📝 POSSIBLE EXAM QUESTIONS
Generate 5 exam-style questions ranging from easy to hard:
1. [Easy - recall based]
2. [Medium - understanding based]
3. [Medium-Hard - application based]
4. [Hard - analysis based]
5. [Very Hard - evaluation/synthesis based]

---

## ⚡ QUICK REVISION (3 bullet points)
Give 3 brutally concise one-liners that capture the absolute essence of this topic. These should be so sharp that reading them once is enough to remember the whole topic.

---

RULES YOU MUST FOLLOW:
- Never skip any section
- Always use the exact headers shown above
- If the image is unclear, extract whatever is visible and do your best
- Be academically precise but humanly readable
- Format everything cleanly for maximum readability`;

const SPRING_CONFIG = { stiffness: 180, damping: 28 };

const FloatingShape = ({ children, className }: { children: React.ReactNode, className?: string }) => (
  <motion.div
    animate={{
      y: [0, -20, 0],
      rotate: [0, 10, 0],
      scale: [1, 1.1, 1]
    }}
    transition={{
      duration: 5 + Math.random() * 5,
      repeat: Infinity,
      ease: "easeInOut"
    }}
    className={cn("absolute pointer-events-none opacity-10", className)}
  >
    {children}
  </motion.div>
);

export default function App() {
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('Notes');
  const [showVault, setShowVault] = useState(false);
  const [quizMode, setQuizMode] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
        setResult(null);
        setError(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const startCamera = async () => {
    try {
      setIsCameraOpen(true);
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      setError("Could not access camera. Please check permissions.");
      setIsCameraOpen(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraOpen(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      if (context) {
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        context.drawImage(videoRef.current, 0, 0);
        const dataUrl = canvasRef.current.toDataURL('image/jpeg');
        setImage(dataUrl);
        stopCamera();
        setResult(null);
        setError(null);
      }
    }
  };

  const analyzeImage = async () => {
    if (!image) return;

    setLoading(true);
    setError(null);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const model = "gemini-3-flash-preview";
      
      const base64Data = image.split(',')[1];
      const mimeType = image.split(';')[0].split(':')[1];

      const response = await ai.models.generateContent({
        model,
        contents: [
          {
            parts: [
              { text: "Analyze this academic material and provide the structured study guide as requested." },
              { inlineData: { data: base64Data, mimeType } }
            ]
          }
        ],
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          temperature: 0.4,
        }
      });

      setResult(response.text || "No analysis generated.");
      setShowVault(true);
    } catch (err) {
      console.error("Gemini Error:", err);
      setError("Failed to analyze image. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setImage(null);
    setResult(null);
    setError(null);
    setShowVault(false);
  };

  return (
    <div className="min-h-screen relative overflow-x-hidden">
      {/* Background Decorations */}
      <FloatingShape className="top-20 left-10 text-vault-yellow"><Star size={64} fill="currentColor" /></FloatingShape>
      <FloatingShape className="top-40 right-20 text-vault-pink"><Square size={48} fill="currentColor" /></FloatingShape>
      <FloatingShape className="bottom-20 left-1/4 text-vault-purple"><Circle size={56} fill="currentColor" /></FloatingShape>
      <FloatingShape className="top-1/2 right-10 text-emerald-green"><Star size={32} fill="currentColor" /></FloatingShape>
      <FloatingShape className="bottom-40 right-1/4 text-vault-yellow"><Square size={24} fill="currentColor" /></FloatingShape>
      <FloatingShape className="top-1/3 left-1/2 text-vault-pink"><Circle size={32} fill="currentColor" /></FloatingShape>

      {/* Sticky Navigation */}
      <nav className="sticky top-0 z-[100] bg-white border-b-4 border-black px-6 h-20 flex items-center justify-between">
        <motion.div 
          whileHover={{ scale: 1.05 }}
          className="flex items-center gap-3 cursor-pointer"
        >
          <div className="w-12 h-12 bg-black flex items-center justify-center text-vault-yellow brutalist-border">
            <BrainCircuit size={28} />
          </div>
          <div>
            <h1 className="text-2xl leading-none">STUDYSNAP</h1>
            <p className="font-mono text-[10px] font-bold tracking-widest text-vault-pink">INTEL_HUB_V2.0</p>
          </div>
        </motion.div>

        <div className="hidden md:flex items-center gap-4">
          <button className="brutalist-button bg-vault-yellow hover:bg-yellow-400">MY SEM</button>
          <button className="brutalist-button bg-white hover:bg-zinc-100">ALL SEMS</button>
          <button className="brutalist-button bg-black text-white hover:bg-zinc-800">
            <Settings size={18} />
          </button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-12 relative z-10">
        {/* Hero Section */}
        <section className="mb-24 relative">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ type: "spring", ...SPRING_CONFIG }}
          >
            <h2 className="text-7xl md:text-9xl mb-4 leading-none">
              YOUR NOTES.<br />
              <span className="text-vault-pink">YOUR WEAPONS.</span>
            </h2>
            <p className="font-serif italic text-2xl md:text-3xl text-zinc-600 mb-8">
              "Tactical intelligence for the modern academic operative."
            </p>
            
            <div className="relative inline-block">
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute -top-16 -right-16 hidden md:block"
              >
                <svg width="100" height="100" viewBox="0 0 100 100" fill="none" className="rotate-12">
                  <path d="M10 10C30 10 50 30 50 50M50 50L40 40M50 50L60 40" stroke="black" strokeWidth="4" strokeLinecap="round" />
                  <text x="0" y="80" className="font-mono text-xs font-bold fill-black">START HERE</text>
                </svg>
              </motion.div>
              
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="brutalist-button bg-vault-yellow text-xl py-4 px-12 brutalist-shadow-lg flex items-center gap-4"
              >
                DEPLOY INTEL <ArrowRight size={24} />
              </button>
            </div>
          </motion.div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Input Area */}
          <div className="lg:col-span-5 space-y-8">
            <motion.div 
              whileHover={{ rotate: -1 }}
              className="brutalist-card border-heavy relative overflow-hidden group"
            >
              <div className="absolute top-0 right-0 bg-black text-white font-mono text-[10px] px-3 py-1 uppercase">
                Scanner_Active
              </div>
              
              {!image && !isCameraOpen ? (
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="aspect-square flex flex-col items-center justify-center gap-6 cursor-pointer"
                >
                  <div className="w-24 h-24 bg-zinc-100 brutalist-border flex items-center justify-center text-black group-hover:bg-vault-yellow transition-colors">
                    <Upload size={40} />
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-black">DROP INTEL HERE</p>
                    <p className="font-mono text-sm text-zinc-500 mt-2">SUPPORTED: JPG, PNG, WEBP</p>
                  </div>
                  <button 
                    onClick={(e) => { e.stopPropagation(); startCamera(); }}
                    className="brutalist-button bg-black text-white mt-4 flex items-center gap-2"
                  >
                    <Camera size={20} /> ACTIVATE LENS
                  </button>
                </div>
              ) : isCameraOpen ? (
                <div className="aspect-square bg-black brutalist-border relative overflow-hidden">
                  <video 
                    ref={videoRef} 
                    autoPlay 
                    playsInline 
                    className="w-full h-full object-cover crt-flicker"
                  />
                  <div className="absolute inset-0 border-[20px] border-black/20 pointer-events-none flex items-center justify-center">
                    <div className="w-full h-px bg-vault-pink/30 absolute top-1/2" />
                    <div className="h-full w-px bg-vault-pink/30 absolute left-1/2" />
                  </div>
                  <div className="absolute bottom-6 left-0 right-0 flex justify-center items-center gap-6">
                    <button onClick={stopCamera} className="brutalist-button bg-white p-3"><X size={24} /></button>
                    <button onClick={capturePhoto} className="w-20 h-20 bg-vault-pink brutalist-border rounded-full flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-1 active:translate-y-1">
                      <div className="w-14 h-14 border-4 border-black rounded-full" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="aspect-square brutalist-border relative overflow-hidden group">
                  <img src={image} alt="Intel" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button onClick={() => setImage(null)} className="brutalist-button bg-white">RESCAN</button>
                  </div>
                </div>
              )}
              <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
              <canvas ref={canvasRef} className="hidden" />
            </motion.div>

            {image && !loading && !result && (
              <motion.button 
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                onClick={analyzeImage}
                className="w-full brutalist-button bg-emerald-green text-2xl py-6 brutalist-shadow-lg flex items-center justify-center gap-4"
              >
                <Sparkles size={28} /> DECRYPT INTEL
              </motion.button>
            )}

            {loading && (
              <div className="brutalist-card bg-black text-white space-y-6 py-12">
                <div className="flex justify-center">
                  <Loader2 size={64} className="text-vault-yellow animate-spin" />
                </div>
                <div className="text-center space-y-2">
                  <p className="text-2xl font-black">PROCESSING INTEL...</p>
                  <p className="font-mono text-xs text-vault-pink animate-pulse">BYPASSING_ACADEMIC_FIREWALLS</p>
                </div>
              </div>
            )}
          </div>

          {/* Important Shorts Section */}
          <div className="lg:col-span-7 space-y-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-4xl">IMPORTANT SHORTS</h3>
              <div className="font-mono text-sm bg-vault-pink text-white px-3 py-1 brutalist-border">LIVE_FEED</div>
            </div>
            
            <div className="flex gap-6 overflow-x-auto pb-8 snap-x">
              {[1, 2, 3].map((i) => (
                <motion.div 
                  key={i}
                  whileHover={{ y: -10 }}
                  className="flex-shrink-0 w-64 aspect-[9/16] brutalist-card border-vault-pink shadow-[8px_8px_0px_0px_#FF00FF] relative overflow-hidden snap-start"
                >
                  <img src={`https://picsum.photos/seed/edu${i}/400/700`} className="absolute inset-0 w-full h-full object-cover opacity-80" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-16 h-16 bg-vault-pink brutalist-border rounded-full flex items-center justify-center text-white shadow-lg">
                      <Play fill="currentColor" size={24} />
                    </div>
                  </div>
                  <div className="absolute bottom-4 left-4 right-4">
                    <p className="font-mono text-[10px] text-vault-yellow mb-1">#INTEL_00{i}</p>
                    <p className="text-white font-black text-lg leading-tight uppercase">Core Concepts of Quantum Intel</p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Resource Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <motion.div 
                whileHover={{ rotate: 1, scale: 1.02 }}
                className="brutalist-card bg-vault-yellow"
              >
                <div className="font-mono text-xs font-bold mb-2">SUB_CODE: CS101</div>
                <h4 className="text-2xl mb-4">DATA STRUCTURES</h4>
                <p className="text-sm mb-6 font-medium">Master the tactical organization of information.</p>
                <button className="brutalist-button bg-black text-white w-full">OPEN VAULT</button>
              </motion.div>

              <motion.div 
                whileHover={{ rotate: -1, scale: 1.02 }}
                className="brutalist-card bg-vault-purple text-white"
              >
                <div className="font-mono text-xs font-bold mb-2">SUB_CODE: MATH202</div>
                <h4 className="text-2xl mb-4">ADVANCED CALCULUS</h4>
                <p className="text-sm mb-6 font-medium">Decrypting the language of change.</p>
                <button className="brutalist-button bg-white text-black w-full">OPEN VAULT</button>
              </motion.div>
            </div>
          </div>
        </div>
      </main>

      {/* Subject Detail Vault Overlay */}
      <AnimatePresence>
        {showVault && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: "spring", ...SPRING_CONFIG }}
            className="fixed inset-0 z-[200] bg-white border-l-8 border-black flex flex-col"
          >
            <div className="h-24 border-b-8 border-black flex items-center justify-between px-8 bg-vault-yellow">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-black text-white flex items-center justify-center brutalist-border">
                  <Layers size={24} />
                </div>
                <h2 className="text-3xl">INTEL VAULT: DECRYPTED</h2>
              </div>
              <button onClick={() => setShowVault(false)} className="brutalist-button bg-black text-white">
                <X size={24} />
              </button>
            </div>

            <div className="flex-1 flex overflow-hidden">
              {/* Sidebar Tabs */}
              <div className="w-64 border-r-8 border-black bg-zinc-50 flex flex-col">
                {['Notes', 'Videos', 'Flashcards', 'PYQs'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={cn(
                      "flex-1 text-left px-8 font-black text-xl uppercase transition-all border-b-4 border-black last:border-b-0",
                      activeTab === tab ? "bg-vault-pink text-white" : "hover:bg-zinc-200"
                    )}
                  >
                    {tab}
                  </button>
                ))}
                <button 
                  onClick={() => setQuizMode(true)}
                  className="h-32 bg-emerald-green text-black font-black text-2xl uppercase flex items-center justify-center gap-3 hover:bg-emerald-400 transition-colors"
                >
                  <Zap size={28} /> RAPID FIRE
                </button>
              </div>

              {/* Content Area */}
              <div className="flex-1 overflow-y-auto p-12 bg-white relative">
                <div className="max-w-4xl mx-auto">
                  {activeTab === 'Notes' && result && (
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="brutalist-card brutalist-shadow-lg p-12 markdown-body"
                    >
                      <Markdown>{result}</Markdown>
                    </motion.div>
                  )}
                  {activeTab === 'Flashcards' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {[1, 2, 3, 4, 5].map(i => (
                        <motion.div 
                          key={i}
                          whileHover={{ scale: 1.05, rotate: i % 2 === 0 ? 2 : -2 }}
                          className="brutalist-card bg-white min-h-[200px] flex flex-col justify-center items-center text-center p-8"
                        >
                          <div className="font-mono text-xs text-vault-pink mb-4">CARD_00{i}</div>
                          <p className="text-xl font-bold uppercase">Sample Question for decrypted intel?</p>
                          <div className="mt-6 w-full h-1 bg-black" />
                          <button className="mt-4 font-mono text-sm font-bold hover:text-vault-pink">REVEAL_ANSWER</button>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quiz Panel Overlay */}
      <AnimatePresence>
        {quizMode && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed inset-0 z-[300] bg-black flex items-center justify-center p-6"
          >
            <div className="w-full max-w-4xl brutalist-card border-heavy bg-zinc-900 text-white p-12 relative overflow-hidden crt-flicker">
              <div className="absolute top-0 left-0 w-full h-1 bg-vault-pink animate-pulse" />
              <div className="flex justify-between items-center mb-12">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-emerald-green text-black flex items-center justify-center brutalist-border">
                    <Zap size={20} />
                  </div>
                  <h3 className="text-3xl text-emerald-green">RAPID FIRE SESSION</h3>
                </div>
                <button onClick={() => setQuizMode(false)} className="brutalist-button bg-white text-black">ABORT</button>
              </div>

              <div className="space-y-12">
                <div className="space-y-4">
                  <p className="font-mono text-vault-pink text-sm">QUESTION_ID: 0x7F42</p>
                  <h4 className="text-4xl md:text-5xl leading-tight">WHAT IS THE PRIMARY TACTICAL ADVANTAGE OF NEO-BRUTALIST DESIGN?</h4>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {['HIGH CONTRAST', 'SUBTLE GRADIENTS', 'SOFT SHADOWS', 'MINIMAL BORDERS'].map((opt, idx) => (
                    <motion.button
                      key={opt}
                      whileHover={{ x: 10, backgroundColor: '#FFD700', color: '#000' }}
                      className="brutalist-button bg-zinc-800 text-white text-left py-6 flex items-center gap-4"
                    >
                      <span className="font-mono text-vault-pink">[{idx + 1}]</span> {opt}
                    </motion.button>
                  ))}
                </div>
              </div>

              <div className="mt-12 pt-8 border-t-4 border-zinc-800 flex justify-between items-center font-mono text-xs">
                <div className="text-zinc-500">TIME_REMAINING: 00:45</div>
                <div className="text-emerald-green">SCORE: 1250_PTS</div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="bg-black text-white py-20 px-6 border-t-8 border-vault-yellow">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12">
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-vault-yellow text-black flex items-center justify-center brutalist-border">
                <BrainCircuit size={24} />
              </div>
              <h1 className="text-2xl">STUDYSNAP</h1>
            </div>
            <p className="font-mono text-xs text-zinc-500 leading-relaxed">
              ENCRYPTED ACADEMIC INTELLIGENCE HUB.<br />
              AUTHORIZED PERSONNEL ONLY.<br />
              © 2026_STUDYSNAP_CORP
            </p>
          </div>
          
          <div className="space-y-4">
            <h5 className="text-xl text-vault-pink">QUICK_LINKS</h5>
            <ul className="font-mono text-sm space-y-2">
              <li className="hover:text-vault-yellow cursor-pointer">/ARCHIVES</li>
              <li className="hover:text-vault-yellow cursor-pointer">/PROTOCOLS</li>
              <li className="hover:text-vault-yellow cursor-pointer">/SUPPORT</li>
            </ul>
          </div>

          <div className="space-y-4">
            <h5 className="text-xl text-emerald-green">SYSTEM_STATUS</h5>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-emerald-green rounded-full animate-pulse" />
              <span className="font-mono text-xs">ALL_SYSTEMS_OPERATIONAL</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
