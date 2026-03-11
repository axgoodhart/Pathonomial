'use client';

import { useState } from 'react';
import { GoogleGenAI, Type } from '@google/genai';
import { Loader2, Search, BookOpen, ChevronRight, Activity, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const ai = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY });

type Condition = {
  name: string;
  otherNames: string[];
  definition: string;
  types: string[];
  vectorsAndSymptoms: string;
  potentialMechanisms: string[];
};

export default function Pathonomial() {
  const [symptoms, setSymptoms] = useState('');
  const [domain, setDomain] = useState<'Economy' | 'Electoral Politics'>('Economy');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [conditions, setConditions] = useState<Condition[] | null>(null);
  const [selectedCondition, setSelectedCondition] = useState<Condition | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!symptoms.trim()) return;

    setIsAnalyzing(true);
    setError(null);
    setConditions(null);
    setSelectedCondition(null);

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Analyze the following symptoms in the domain of ${domain}: "${symptoms}". Generate 2 to 4 fictional, clinical-sounding conditions that diagnose these systemic issues. Consider a unique blend of real-world market indicators, sentiments, competitive or anticompetitive behaviors, etc. based on the prompt, and consider allegories for them in medicinal literature. Use creative portmanteaus and refashioning of domain vocabulary, without forgery of real condition descriptions. Provide a different lens of clarity on the issues.`,
        config: {
          systemInstruction: "You are a clinical diagnostician for systems-level entities. You write in a highly academic, medical, and detached tone, similar to the ICD or DSM, but applied to systemic domains like the Economy or Electoral Politics. You invent conditions that perfectly encapsulate the systemic dysfunction described by the user.",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              conditions: {
                type: Type.ARRAY,
                description: "A list of 2 to 4 diagnosed conditions based on the symptoms.",
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: {
                      type: Type.STRING,
                      description: "The name of the condition, a creative portmanteau or refashioning of domain vocabulary."
                    },
                    otherNames: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                      description: "Alternative names for the condition."
                    },
                    definition: {
                      type: Type.STRING,
                      description: "A detailed definition of the condition, written in a clinical, academic tone."
                    },
                    types: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                      description: "Various types or classifications of the condition."
                    },
                    vectorsAndSymptoms: {
                      type: Type.STRING,
                      description: "How the condition arises, its vectors, and its symptoms."
                    },
                    potentialMechanisms: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                      description: "Potential underlying mechanisms causing the condition."
                    }
                  },
                  required: ["name", "otherNames", "definition", "types", "vectorsAndSymptoms", "potentialMechanisms"]
                }
              }
            },
            required: ["conditions"]
          }
        }
      });

      if (response.text) {
        const data = JSON.parse(response.text);
        setConditions(data.conditions);
      } else {
        throw new Error("No response from the diagnostic model.");
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An error occurred during diagnosis.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-4xl space-y-12">
        
        {/* Header */}
        <header className="text-center space-y-4">
          <div className="inline-flex items-center justify-center p-3 bg-white border border-gray-200 rounded-full shadow-sm mb-4">
            <BookOpen className="w-8 h-8 text-slate-800" />
          </div>
          <h1 className="text-5xl md:text-6xl font-serif text-slate-900 tracking-tight">
            Pathonomial
          </h1>
          <p className="text-lg text-slate-500 max-w-2xl mx-auto font-sans">
            The Diagnostic and Statistical Manual of Systemic Pathologies.
            <br className="hidden sm:block" />
            A reference portal for the diagnosis of pathologies in systems-level entities.
          </p>
        </header>

        {/* Main Interface */}
        <main className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Input */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200/60">
              <h2 className="text-xl font-serif font-medium text-slate-900 mb-4 flex items-center gap-2">
                <Activity className="w-5 h-5 text-slate-400" />
                Symptom Checker
              </h2>
              
              <form onSubmit={handleAnalyze} className="space-y-5">
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Domain
                  </label>
                  <div className="flex bg-slate-100 p-1 rounded-lg">
                    {(['Economy', 'Electoral Politics'] as const).map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setDomain(d)}
                        className={`flex-1 py-2 px-3 text-sm font-medium rounded-md transition-all ${
                          domain === d 
                            ? 'bg-white text-slate-900 shadow-sm' 
                            : 'text-slate-500 hover:text-slate-700'
                        }`}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="symptoms" className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Observed Symptoms
                  </label>
                  <textarea
                    id="symptoms"
                    rows={5}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-colors resize-none placeholder:text-slate-400"
                    placeholder="e.g., companies keep raising prices and lowering quality and no one can really do anything about it..."
                    value={symptoms}
                    onChange={(e) => setSymptoms(e.target.value)}
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={isAnalyzing || !symptoms.trim()}
                  className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white py-3 px-4 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Analyzing Pathology...
                    </>
                  ) : (
                    <>
                      <Search className="w-5 h-5" />
                      Diagnose Condition
                    </>
                  )}
                </button>
              </form>

              {error && (
                <div className="mt-4 p-3 bg-red-50 border border-red-100 rounded-lg flex items-start gap-2 text-red-600 text-sm">
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <p>{error}</p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Results */}
          <div className="lg:col-span-7">
            <AnimatePresence mode="wait">
              {!conditions && !isAnalyzing && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="h-full flex flex-col items-center justify-center text-center p-12 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50"
                >
                  <BookOpen className="w-12 h-12 text-slate-300 mb-4" />
                  <h3 className="text-lg font-medium text-slate-900 mb-2">Awaiting Symptoms</h3>
                  <p className="text-sm text-slate-500 max-w-sm">
                    Enter the observed systemic behaviors in the symptom checker to receive a differential diagnosis.
                  </p>
                </motion.div>
              )}

              {isAnalyzing && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="h-full flex flex-col items-center justify-center p-12 space-y-4"
                >
                  <div className="relative">
                    <div className="w-16 h-16 border-4 border-slate-200 rounded-full"></div>
                    <div className="w-16 h-16 border-4 border-slate-900 rounded-full border-t-transparent animate-spin absolute top-0 left-0"></div>
                  </div>
                  <p className="text-sm font-mono text-slate-500 animate-pulse">Consulting reference materials...</p>
                </motion.div>
              )}

              {conditions && !selectedCondition && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-6">
                    Differential Diagnosis ({conditions.length} Results)
                  </h3>
                  <div className="grid gap-3">
                    {conditions.map((condition, idx) => (
                      <button
                        key={idx}
                        onClick={() => setSelectedCondition(condition)}
                        className="group flex items-center justify-between p-5 bg-white border border-slate-200 rounded-xl hover:border-slate-400 hover:shadow-md transition-all text-left"
                      >
                        <div>
                          <h4 className="text-xl font-serif font-medium text-slate-900 group-hover:text-slate-700 transition-colors">
                            {condition.name}
                          </h4>
                          <p className="text-sm text-slate-500 mt-1 line-clamp-1">
                            {condition.definition}
                          </p>
                        </div>
                        <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-slate-600 transition-colors" />
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}

              {selectedCondition && (
                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden"
                >
                  <div className="p-6 sm:p-8 border-b border-slate-100 bg-slate-50/50 flex items-start justify-between">
                    <div>
                      <button 
                        onClick={() => setSelectedCondition(null)}
                        className="text-xs font-semibold text-slate-500 uppercase tracking-wider hover:text-slate-900 flex items-center gap-1 mb-4 transition-colors"
                      >
                        <ChevronRight className="w-4 h-4 rotate-180" />
                        Back to Results
                      </button>
                      <h2 className="text-3xl sm:text-4xl font-serif font-medium text-slate-900 mb-2">
                        {selectedCondition.name}
                      </h2>
                      {selectedCondition.otherNames.length > 0 && (
                        <p className="text-sm text-slate-500 font-mono">
                          <span className="font-semibold">Other names:</span> {selectedCondition.otherNames.join(', ')}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="p-6 sm:p-8 space-y-8">
                    <section>
                      <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Definition</h3>
                      <p className="text-slate-800 leading-relaxed">
                        {selectedCondition.definition}
                      </p>
                    </section>

                    <div className="h-px w-full bg-slate-100"></div>

                    <section>
                      <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Vectors and Symptoms</h3>
                      <p className="text-slate-800 leading-relaxed">
                        {selectedCondition.vectorsAndSymptoms}
                      </p>
                    </section>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                      <section>
                        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Types</h3>
                        <ul className="space-y-2">
                          {selectedCondition.types.map((type, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-300 mt-1.5 flex-shrink-0"></span>
                              {type}
                            </li>
                          ))}
                        </ul>
                      </section>

                      <section>
                        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Potential Mechanisms</h3>
                        <ul className="space-y-2">
                          {selectedCondition.potentialMechanisms.map((mech, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-300 mt-1.5 flex-shrink-0"></span>
                              {mech}
                            </li>
                          ))}
                        </ul>
                      </section>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </main>
      </div>
    </div>
  );
}
