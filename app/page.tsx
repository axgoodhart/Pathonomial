'use client';

import { useState } from 'react';
import { Loader2, Search, BookOpen, ChevronRight, Activity, AlertCircle, FileText, Link as LinkIcon, FlaskConical } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { saveDiagnosis, generateId, type Condition, type DiagnosisRecord } from '@/lib/storage';
import Nav from '@/components/nav';

type Pathway = {
  pathwayName: string;
  summary: string;
  conditions: Condition[];
};

type SourceMode = 'symptoms' | 'document' | 'url';

export default function Pathonomial() {
  const [sourceMode, setSourceMode] = useState<SourceMode>('symptoms');
  const [symptoms, setSymptoms] = useState('');
  const [documentText, setDocumentText] = useState('');
  const [urlInput, setUrlInput] = useState('');
  const [domain, setDomain] = useState<'Economy' | 'Electoral Politics'>('Economy');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [statusText, setStatusText] = useState('');
  const [conditions, setConditions] = useState<Condition[] | null>(null);
  const [pathways, setPathways] = useState<Pathway[] | null>(null);
  const [selectedCondition, setSelectedCondition] = useState<Condition | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSymptomDiagnose = async () => {
    if (!symptoms.trim()) return;
    setIsAnalyzing(true);
    setStatusText('Running differential diagnosis...');
    setError(null);
    setConditions(null);
    setPathways(null);
    setSelectedCondition(null);

    try {
      const res = await fetch('/api/diagnose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symptoms, domain }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setConditions(data.conditions);

      saveDiagnosis({
        id: generateId(),
        timestamp: Date.now(),
        domain,
        sourceType: 'symptoms',
        sourceText: symptoms,
        conditions: data.conditions,
      });
    } catch (err: any) {
      setError(err.message || 'Diagnosis failed.');
    } finally {
      setIsAnalyzing(false);
      setStatusText('');
    }
  };

  const handleSourceIngest = async () => {
    let sourceText = '';

    if (sourceMode === 'document') {
      sourceText = documentText.trim();
    } else if (sourceMode === 'url') {
      if (!urlInput.trim()) return;
      setIsAnalyzing(true);
      setStatusText('Fetching source material...');
      setError(null);
      setConditions(null);
      setPathways(null);
      setSelectedCondition(null);

      try {
        // Use a simple fetch to get the URL content via a proxy or directly
        // For now, we ask the AI to work with the URL as context
        sourceText = `[Source URL: ${urlInput}] Please analyze the current state and recent developments related to this source.`;
      } catch (err: any) {
        setError('Failed to fetch URL content.');
        setIsAnalyzing(false);
        return;
      }
    }

    if (!sourceText) return;

    setIsAnalyzing(true);
    setStatusText('Identifying diagnostic pathways...');
    setError(null);
    setConditions(null);
    setPathways(null);
    setSelectedCondition(null);

    try {
      const res = await fetch('/api/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sourceText, domain }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setPathways(data.pathways);

      // Save all conditions from all pathways
      const allConditions = data.pathways.flatMap((p: Pathway) => p.conditions);
      saveDiagnosis({
        id: generateId(),
        timestamp: Date.now(),
        domain,
        sourceType: sourceMode,
        sourceText: sourceMode === 'url' ? urlInput : documentText.slice(0, 500),
        conditions: allConditions,
      });
    } catch (err: any) {
      setError(err.message || 'Source analysis failed.');
    } finally {
      setIsAnalyzing(false);
      setStatusText('');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (sourceMode === 'symptoms') {
      handleSymptomDiagnose();
    } else {
      handleSourceIngest();
    }
  };

  const inputValue = sourceMode === 'symptoms' ? symptoms : sourceMode === 'document' ? documentText : urlInput;
  const hasInput = inputValue.trim().length > 0;

  return (
    <div className="min-h-screen flex flex-col">
      <Nav />
      <div className="flex-1 flex flex-col items-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-5xl space-y-12">

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

                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* Source Mode Toggle */}
                  <div className="space-y-2">
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Input Mode
                    </label>
                    <div className="flex bg-slate-100 p-1 rounded-lg">
                      {([
                        { key: 'symptoms' as const, label: 'Symptoms', icon: Activity },
                        { key: 'document' as const, label: 'Document', icon: FileText },
                        { key: 'url' as const, label: 'URL', icon: LinkIcon },
                      ]).map(({ key, label, icon: Icon }) => (
                        <button
                          key={key}
                          type="button"
                          onClick={() => setSourceMode(key)}
                          className={`flex-1 py-2 px-3 text-sm font-medium rounded-md transition-all flex items-center justify-center gap-1.5 ${
                            sourceMode === key
                              ? 'bg-white text-slate-900 shadow-sm'
                              : 'text-slate-500 hover:text-slate-700'
                          }`}
                        >
                          <Icon className="w-3.5 h-3.5" />
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Domain */}
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

                  {/* Input Area */}
                  <div className="space-y-2">
                    <label htmlFor="input" className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      {sourceMode === 'symptoms' ? 'Observed Symptoms' : sourceMode === 'document' ? 'Source Document' : 'Source URL'}
                    </label>
                    {sourceMode === 'url' ? (
                      <input
                        id="input"
                        type="url"
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-colors placeholder:text-slate-400"
                        placeholder="https://example.com/article..."
                        value={urlInput}
                        onChange={(e) => setUrlInput(e.target.value)}
                        required
                      />
                    ) : (
                      <textarea
                        id="input"
                        rows={sourceMode === 'document' ? 8 : 5}
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-colors resize-none placeholder:text-slate-400"
                        placeholder={
                          sourceMode === 'symptoms'
                            ? 'e.g., companies keep raising prices and lowering quality and no one can really do anything about it...'
                            : 'Paste an article, report, or any source document here...'
                        }
                        value={sourceMode === 'symptoms' ? symptoms : documentText}
                        onChange={(e) => sourceMode === 'symptoms' ? setSymptoms(e.target.value) : setDocumentText(e.target.value)}
                        required
                      />
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={isAnalyzing || !hasInput}
                    className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white py-3 px-4 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isAnalyzing ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        {statusText || 'Analyzing...'}
                      </>
                    ) : sourceMode === 'symptoms' ? (
                      <>
                        <Search className="w-5 h-5" />
                        Diagnose Condition
                      </>
                    ) : (
                      <>
                        <FlaskConical className="w-5 h-5" />
                        Explore Pathways
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
                {!conditions && !pathways && !isAnalyzing && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="h-full flex flex-col items-center justify-center text-center p-12 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50"
                  >
                    <BookOpen className="w-12 h-12 text-slate-300 mb-4" />
                    <h3 className="text-lg font-medium text-slate-900 mb-2">Awaiting Input</h3>
                    <p className="text-sm text-slate-500 max-w-sm">
                      Enter symptoms for a direct diagnosis, or feed in a document or URL
                      to autonomously explore multiple diagnostic pathways.
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
                    <p className="text-sm font-mono text-slate-500 animate-pulse">{statusText || 'Consulting reference materials...'}</p>
                  </motion.div>
                )}

                {/* Standard diagnosis results */}
                {conditions && !selectedCondition && !pathways && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-4"
                  >
                    <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-6">
                      Differential Diagnosis ({conditions.length} Results)
                    </h3>
                    <ConditionList conditions={conditions} onSelect={setSelectedCondition} />
                  </motion.div>
                )}

                {/* Autonomous pathway results */}
                {pathways && !selectedCondition && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6"
                  >
                    <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
                      Autonomous Exploration — {pathways.length} Diagnostic Pathways
                    </h3>
                    {pathways.map((pathway, pIdx) => (
                      <div key={pIdx} className="space-y-3">
                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                          <h4 className="text-lg font-serif font-medium text-slate-900 flex items-center gap-2">
                            <FlaskConical className="w-4 h-4 text-slate-400" />
                            Pathway {pIdx + 1}: {pathway.pathwayName}
                          </h4>
                          <p className="text-sm text-slate-500 mt-1">{pathway.summary}</p>
                        </div>
                        <ConditionList conditions={pathway.conditions} onSelect={setSelectedCondition} />
                      </div>
                    ))}
                  </motion.div>
                )}

                {/* Condition Detail View */}
                {selectedCondition && (
                  <ConditionDetail
                    condition={selectedCondition}
                    onBack={() => setSelectedCondition(null)}
                  />
                )}
              </AnimatePresence>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

function ConditionList({ conditions, onSelect }: { conditions: Condition[]; onSelect: (c: Condition) => void }) {
  return (
    <div className="grid gap-3">
      {conditions.map((condition, idx) => (
        <button
          key={idx}
          onClick={() => onSelect(condition)}
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
          <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-slate-600 transition-colors flex-shrink-0" />
        </button>
      ))}
    </div>
  );
}

function ConditionDetail({ condition, onBack }: { condition: Condition; onBack: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden"
    >
      <div className="p-6 sm:p-8 border-b border-slate-100 bg-slate-50/50">
        <button
          onClick={onBack}
          className="text-xs font-semibold text-slate-500 uppercase tracking-wider hover:text-slate-900 flex items-center gap-1 mb-4 transition-colors"
        >
          <ChevronRight className="w-4 h-4 rotate-180" />
          Back to Results
        </button>
        <h2 className="text-3xl sm:text-4xl font-serif font-medium text-slate-900 mb-2">
          {condition.name}
        </h2>
        {condition.otherNames.length > 0 && (
          <p className="text-sm text-slate-500 font-mono">
            <span className="font-semibold">Other names:</span> {condition.otherNames.join(', ')}
          </p>
        )}
      </div>

      <div className="p-6 sm:p-8 space-y-8">
        <section>
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Definition</h3>
          <p className="text-slate-800 leading-relaxed">{condition.definition}</p>
        </section>

        <div className="h-px w-full bg-slate-100"></div>

        <section>
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Vectors and Symptoms</h3>
          <p className="text-slate-800 leading-relaxed">{condition.vectorsAndSymptoms}</p>
        </section>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
          <section>
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Types</h3>
            <ul className="space-y-2">
              {condition.types.map((type, i) => (
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
              {condition.potentialMechanisms.map((mech, i) => (
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
  );
}
