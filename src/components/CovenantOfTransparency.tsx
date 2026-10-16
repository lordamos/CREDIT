import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, 
  ShieldCheck, 
  Compass, 
  Eye, 
  Scale, 
  Hammer, 
  HeartHandshake, 
  CheckCircle2, 
  Printer, 
  Share2, 
  Layers, 
  ChevronRight,
  SunMedium,
  Building,
  AlertTriangle,
  HelpCircle,
  FileText
} from 'lucide-react';

interface Props {
  signatoryName?: string;
  onAcknowledge?: () => void;
  isAcknowledged?: boolean;
}

export function CovenantOfTransparency({ 
  signatoryName = "Darwin Nicholas Hayle",
  onAcknowledge,
  isAcknowledged = true 
}: Props) {
  const [activeTab, setActiveTab] = useState<'all' | 'intent' | 'architect-judge' | 'container'>('all');
  const [selectedResponse, setSelectedResponse] = useState<'liar' | 'technician' | 'architect'>('architect');
  const [acknowledged, setAcknowledged] = useState(isAcknowledged);
  const [printed, setPrinted] = useState(false);

  const handlePrint = () => {
    setPrinted(true);
    window.print();
    setTimeout(() => setPrinted(false), 2000);
  };

  const handleSign = () => {
    setAcknowledged(true);
    if (onAcknowledge) onAcknowledge();
  };

  return (
    <div className="relative space-y-8 select-text">
      
      {/* ============================================================== */}
      {/* 1. HERO COVENANT SACRED HEADER */}
      {/* ============================================================== */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#121118]/90 via-[#0c0c12]/95 to-[#08080a] border border-amber-500/25 p-8 md:p-10 shadow-2xl shadow-amber-500/5">
        
        {/* Ambient gold/indigo luminous flares */}
        <div className="pointer-events-none absolute -top-24 -right-24 w-96 h-96 rounded-full bg-amber-500/10 blur-[90px]" />
        <div className="pointer-events-none absolute -bottom-24 -left-24 w-96 h-96 rounded-full bg-indigo-600/10 blur-[90px]" />

        <div className="relative z-10 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-extrabold uppercase tracking-widest shadow-inner">
              <Compass className="w-3.5 h-3.5 text-amber-400" />
              <span>Sacred Governance Protocol · The "Why" and the "Wow"</span>
            </div>

            <div className="flex items-center gap-2">
              <button 
                onClick={handlePrint}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] text-xs font-semibold text-slate-300 hover:text-white transition"
              >
                <Printer className="w-3.5 h-3.5 text-amber-400" />
                <span>{printed ? 'Printed' : 'Print Covenant'}</span>
              </button>
            </div>
          </div>

          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-white leading-tight">
            The Covenant of Transparency
          </h1>

          <p className="text-slate-300 text-base md:text-lg max-w-3xl leading-relaxed font-normal">
            Transparency is the light you shine into the hidden corners of your life. It is not just about answering questions when asked; it is about <span className="text-amber-300 font-semibold underline decoration-amber-500/50 underline-offset-4">providing the data before the question arises</span>.
          </p>

          {/* Core Mandate Banner */}
          <div className="pt-2">
            <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-indigo-600/10 to-transparent border-l-4 border-amber-500 border-y border-r border-white/[0.06] flex items-start gap-3.5">
              <SunMedium className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div className="text-xs md:text-sm text-slate-200 leading-relaxed">
                <span className="font-bold text-amber-200">The Structural Mandate: </span>
                When your partner or client shows vulnerability, your duty is to catch it with both hands. You do not punish the truth; you reward it with the space to fix the problem.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 2. THE THREE SACRED PILLARS OF TRANSPARENCY */}
      {/* ============================================================== */}
      <div className="grid md:grid-cols-3 gap-6">

        {/* PILLAR I */}
        <div className="relative rounded-2xl bg-gradient-to-b from-[#14141d]/90 to-[#0e0e15]/80 border border-white/[0.08] p-6 shadow-xl flex flex-col justify-between">
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Eye className="w-5 h-5" />
            </div>
            <div className="text-xs font-bold text-amber-400 uppercase tracking-wider">Pillar I · Illumination</div>
            <h3 className="text-lg font-bold text-white">Shining Light into Hidden Corners</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Passive truth waits to be interrogated. Active transparency illuminates the room before shadows take root. When you provide the data proactively, you dissolve suspicion and preserve emotional equity.
            </p>
          </div>
          <div className="mt-4 pt-4 border-t border-white/[0.06] text-[11px] text-slate-400 italic">
            "Providing the data before the question arises."
          </div>
        </div>

        {/* PILLAR II */}
        <div className="relative rounded-2xl bg-gradient-to-b from-[#14141d]/90 to-[#0e0e15]/80 border border-white/[0.08] p-6 shadow-xl flex flex-col justify-between">
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <HeartHandshake className="w-5 h-5" />
            </div>
            <div className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Pillar II · Discernment</div>
            <h3 className="text-lg font-bold text-white">Answering the Intent, Not Just Words</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Transparency understands the heart behind the inquiry. A technician retreats into legalistic literalism. A Transparent Architect addresses the financial and emotional reality of the relationship.
            </p>
          </div>
          <div className="mt-4 pt-4 border-t border-white/[0.06] text-[11px] text-slate-400 italic">
            "You answer the intent, not just the literal words."
          </div>
        </div>

        {/* PILLAR III */}
        <div className="relative rounded-2xl bg-gradient-to-b from-[#14141d]/90 to-[#0e0e15]/80 border border-white/[0.08] p-6 shadow-xl flex flex-col justify-between">
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Pillar III · Safe Container</div>
            <h3 className="text-lg font-bold text-white">The Container Dictates the Truth</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Truth cannot survive in an environment of prosecution. If you judge, people will hide. When you build a container of architectural safety, truth becomes the raw material for compound growth.
            </p>
          </div>
          <div className="mt-4 pt-4 border-t border-white/[0.06] text-[11px] text-slate-400 italic">
            "If you are an Architect, your partner will build."
          </div>
        </div>

      </div>

      {/* ============================================================== */}
      {/* 3. CASE STUDY: THE MALL INQUIRY (TRIAD OF RESPONSE) */}
      {/* ============================================================== */}
      <div className="rounded-3xl bg-[#111118]/90 border border-white/[0.08] p-6 md:p-8 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/[0.06] pb-6">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-full border border-indigo-500/20">
              Diagnostic Case Study
            </span>
            <h2 className="text-xl md:text-2xl font-bold text-white mt-2">
              The Three Responses: Knowing What Is Actually Being Asked
            </h2>
            <p className="text-xs md:text-sm text-slate-400 mt-1">
              Context: You are low on household cash. Your partner asks: <span className="text-white font-medium italic">"Did you go to the mall today?"</span>
            </p>
          </div>

          {/* Selector pills */}
          <div className="flex items-center gap-1.5 bg-black/40 p-1.5 rounded-2xl border border-white/[0.06]">
            <button
              onClick={() => setSelectedResponse('liar')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                selectedResponse === 'liar' 
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-sm' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              1. The Liar
            </button>
            <button
              onClick={() => setSelectedResponse('technician')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                selectedResponse === 'technician' 
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              2. The Technician
            </button>
            <button
              onClick={() => setSelectedResponse('architect')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                selectedResponse === 'architect' 
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              3. The Architect
            </button>
          </div>
        </div>

        {/* Dynamic Card Display */}
        <AnimatePresence mode="wait">
          {selectedResponse === 'liar' && (
            <motion.div
              key="liar"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="rounded-2xl bg-rose-500/[0.04] border border-rose-500/20 p-6 space-y-4"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold uppercase tracking-widest text-rose-400">Level 1 · Deception</span>
                <span className="text-xs text-rose-300/80 font-mono">Structural Failure</span>
              </div>
              <div className="text-2xl font-bold text-white font-serif italic">
                "No."
              </div>
              <p className="text-xs md:text-sm text-slate-300 leading-relaxed">
                A liar answers with flat deceit. The reality of the spending is hidden. Trust is not merely breached; it is dismantled. When the truth inevitably surfaces on the bank statement, the relationship enters bankruptcy.
              </p>
              <div className="text-[11px] text-rose-400 font-semibold flex items-center gap-2">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Result: Destroys safety. Forces future interrogations and surveillance.</span>
              </div>
            </motion.div>
          )}

          {selectedResponse === 'technician' && (
            <motion.div
              key="technician"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="rounded-2xl bg-amber-500/[0.04] border border-amber-500/20 p-6 space-y-4"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold uppercase tracking-widest text-amber-400">Level 2 · Legalistic Literalism</span>
                <span className="text-xs text-amber-300/80 font-mono">Technical Truth · Intent Evasion</span>
              </div>
              <div className="text-2xl font-bold text-white font-serif italic">
                "I didn't go to the mall."
              </div>
              <p className="text-xs md:text-sm text-slate-300 leading-relaxed">
                A technician uses literal words as armor. You didn't physically enter the mall, but you bought $300 worth of clothes from your phone. You answered the dictionary definition while deliberately circumventing the partner's actual fear: <span className="text-amber-200 italic">"Is our money safe? Did we overspend?"</span>
              </p>
              <div className="text-[11px] text-amber-400 font-semibold flex items-center gap-2">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Result: Creates cynical communication where both sides speak like opposing defense attorneys.</span>
              </div>
            </motion.div>
          )}

          {selectedResponse === 'architect' && (
            <motion.div
              key="architect"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="rounded-2xl bg-emerald-500/[0.06] border border-emerald-500/30 p-6 space-y-4 shadow-lg shadow-emerald-500/5"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold uppercase tracking-widest text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Level 3 · The Transparent Architect</span>
                </span>
                <span className="text-xs text-emerald-300/80 font-mono">Covenant Integrity</span>
              </div>
              <div className="text-2xl font-bold text-white font-serif italic text-emerald-200">
                "No, I didn't go to the mall, but I did spend money online."
              </div>
              <p className="text-xs md:text-sm text-slate-200 leading-relaxed">
                A Transparent Architect answers the <strong className="text-white">intent</strong>, not just the literal words. You recognize what your partner was truly asking: <span className="text-emerald-300 italic">Did we spend cash that we do not have?</span> By giving the data before they have to dig for it, you eliminate suspicion and stand shoulder-to-shoulder facing the ledger together.
              </p>
              <div className="text-[11px] text-emerald-400 font-semibold flex items-center gap-2 pt-1 border-t border-emerald-500/20">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Result: Elevates trust. Turns a potential financial interrogation into a collaborative design problem.</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ============================================================== */}
      {/* 4. THE ARCHITECT VS. THE JUDGE COMPARISON MATRIX */}
      {/* ============================================================== */}
      <div className="space-y-4">
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20">
            Structural Identity Shift
          </span>
          <h2 className="text-2xl md:text-3xl font-extrabold text-white mt-2">
            The Architect vs. The Judge
          </h2>
          <p className="text-xs md:text-sm text-slate-400 mt-1 max-w-2xl">
            When you establish a Covenant of Truth, you stop being the Judge and start being the Architect.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 pt-2">
          
          {/* THE JUDGE */}
          <div className="rounded-3xl bg-[#111116] border border-rose-500/20 p-6 md:p-8 space-y-5 relative overflow-hidden">
            <div className="flex items-center justify-between border-b border-rose-500/20 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400">
                  <Scale className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">The Judge</h3>
                  <p className="text-[10px] uppercase font-bold text-rose-400 tracking-wider">The Punitive Mindset</p>
                </div>
              </div>
              <span className="text-xs px-2.5 py-1 rounded-full bg-rose-500/15 text-rose-300 font-extrabold uppercase text-[10px] border border-rose-500/30">
                Prosecution
              </span>
            </div>

            <ul className="space-y-3.5 text-xs text-slate-300">
              <li className="flex items-start gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400 mt-1.5 shrink-0" />
                <span><strong className="text-white">Interested in guilt, punishment, and the past:</strong> Fixates on assigning blame rather than engineering structural recovery.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400 mt-1.5 shrink-0" />
                <span><strong className="text-white">Punishes vulnerability:</strong> When the truth is confessed, responds with anger, cold withdrawal, or retribution.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400 mt-1.5 shrink-0" />
                <span><strong className="text-white">Destroys container safety:</strong> Communicates that openness is dangerous and will be used as future ammunition.</span>
              </li>
            </ul>

            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-center">
              <div className="text-xs font-bold text-rose-300 uppercase tracking-widest">The Ultimate Consequence</div>
              <div className="text-lg font-extrabold text-white mt-1">"If you are a Judge, your partner will hide."</div>
            </div>
          </div>

          {/* THE ARCHITECT */}
          <div className="rounded-3xl bg-gradient-to-br from-[#12161f] to-[#0e111a] border border-emerald-500/30 p-6 md:p-8 space-y-5 relative overflow-hidden shadow-xl shadow-emerald-500/5">
            <div className="flex items-center justify-between border-b border-emerald-500/20 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                  <Hammer className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">The Architect</h3>
                  <p className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider">The Builder Mindset</p>
                </div>
              </div>
              <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-300 font-extrabold uppercase text-[10px] border border-emerald-500/30">
                Co-Creation
              </span>
            </div>

            <ul className="space-y-3.5 text-xs text-slate-200">
              <li className="flex items-start gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                <span><strong className="text-white">Interested in design, stability, and the future:</strong> Replaces cross-examination with structural remodeling.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                <span><strong className="text-white">Rewards truth with space to solve:</strong> Catches vulnerability with both hands. "Okay, here is where we went wrong, and here is how we fix it together."</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                <span><strong className="text-white">Addresses real human fractures:</strong> Whether a broken hair clip, a playground push, an unpaid debt, or hidden spending.</span>
              </li>
            </ul>

            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-center">
              <div className="text-xs font-bold text-emerald-300 uppercase tracking-widest">The Ultimate Consequence</div>
              <div className="text-lg font-extrabold text-white mt-1">"If you are an Architect, your partner will build."</div>
            </div>
          </div>

        </div>
      </div>

      {/* ============================================================== */}
      {/* 5. THE SACRED CONTAINER MANIFESTO */}
      {/* ============================================================== */}
      <div className="relative rounded-3xl bg-gradient-to-r from-amber-500/15 via-[#18161f] to-indigo-600/15 border-2 border-amber-500/40 p-8 md:p-12 text-center space-y-6 shadow-2xl">
        
        <div className="w-12 h-12 mx-auto rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-300">
          <Sparkles className="w-6 h-6" />
        </div>

        <div className="max-w-3xl mx-auto space-y-4">
          <div className="text-xs font-extrabold uppercase tracking-widest text-amber-400">
            The Fundamental Law of Governance
          </div>
          <blockquote className="text-xl md:text-3xl font-serif font-bold text-white leading-relaxed">
            "Truth is established not by what you say, but by the safety of the container you create. If you are a Judge, your partner will hide. If you are an Architect, your partner will build."
          </blockquote>
          <p className="text-xs md:text-sm text-slate-300 max-w-xl mx-auto leading-relaxed">
            In credit consulting, corporate debt negotiation, and personal relationships alike: We do not punish truth. We reward truth with the architectural space and tools to build enduring freedom.
          </p>
        </div>

        {/* Affirmation / Signature Block */}
        <div className="pt-4 max-w-md mx-auto">
          {acknowledged ? (
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-center space-y-1.5">
              <div className="inline-flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider">
                <CheckCircle2 className="w-4 h-4" />
                <span>Covenant Sealed & Verified</span>
              </div>
              <div className="text-sm font-bold text-white">{signatoryName}</div>
              <div className="text-[11px] text-slate-400 font-mono">
                Stewardship Timestamp: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
              </div>
            </div>
          ) : (
            <button
              onClick={handleSign}
              className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-600 to-amber-500 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-extrabold text-sm shadow-xl shadow-amber-500/20 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Affirm & Seal The Covenant of Transparency</span>
            </button>
          )}
        </div>
      </div>

    </div>
  );
}
