'use client';

import { useState, useEffect, useMemo } from 'react';
import { getDiagnoses, getReviews, saveReview, generateId, type Condition, type DiagnosisRecord, type ReviewRecord } from '@/lib/storage';
import { BookOpen, ChevronRight, Search, Calendar, Tag, FileText, Loader2, CheckSquare, Square, FlaskConical } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Nav from '@/components/nav';

type Tab = 'conditions' | 'reviews';

export default function ArchivePage() {
  const [diagnoses, setDiagnoses] = useState<DiagnosisRecord[]>([]);
  const [reviews, setReviews] = useState<ReviewRecord[]>([]);
  const [tab, setTab] = useState<Tab>('conditions');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCondition, setSelectedCondition] = useState<Condition | null>(null);
  const [selectedReview, setSelectedReview] = useState<ReviewRecord | null>(null);

  // Review generation
  const [selectedForReview, setSelectedForReview] = useState<Set<string>>(new Set());
  const [isGeneratingReview, setIsGeneratingReview] = useState(false);
  const [reviewContext, setReviewContext] = useState('');
  const [showReviewPanel, setShowReviewPanel] = useState(false);

  useEffect(() => {
    setDiagnoses(getDiagnoses());
    setReviews(getReviews());
  }, []);

  const allConditions = useMemo(() => {
    const results: { condition: Condition; diagnosis: DiagnosisRecord }[] = [];
    for (const d of diagnoses) {
      for (const c of d.conditions) {
        results.push({ condition: c, diagnosis: d });
      }
    }
    return results;
  }, [diagnoses]);

  const filteredConditions = useMemo(() => {
    if (!searchQuery.trim()) return allConditions;
    const q = searchQuery.toLowerCase();
    return allConditions.filter(({ condition }) =>
      condition.name.toLowerCase().includes(q) ||
      condition.definition.toLowerCase().includes(q) ||
      condition.otherNames.some(n => n.toLowerCase().includes(q))
    );
  }, [allConditions, searchQuery]);

  const filteredReviews = useMemo(() => {
    if (!searchQuery.trim()) return reviews;
    const q = searchQuery.toLowerCase();
    return reviews.filter(r =>
      r.title.toLowerCase().includes(q) ||
      r.content.toLowerCase().includes(q)
    );
  }, [reviews, searchQuery]);

  const toggleConditionForReview = (name: string) => {
    setSelectedForReview(prev => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const handleGenerateReview = async () => {
    const conditionsToReview = allConditions
      .filter(({ condition }) => selectedForReview.has(condition.name))
      .map(({ condition }) => condition);

    if (conditionsToReview.length === 0) return;

    setIsGeneratingReview(true);
    try {
      const res = await fetch('/api/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conditions: conditionsToReview, context: reviewContext }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      const record: ReviewRecord = {
        id: generateId(),
        timestamp: Date.now(),
        title: data.title,
        content: data.content,
        referencedConditions: conditionsToReview.map(c => c.name),
      };
      saveReview(record);
      setReviews(getReviews());
      setSelectedForReview(new Set());
      setShowReviewPanel(false);
      setReviewContext('');
      setTab('reviews');
      setSelectedReview(record);
    } catch (err: any) {
      alert(err.message || 'Review generation failed.');
    } finally {
      setIsGeneratingReview(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Nav />
      <div className="flex-1 flex flex-col items-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-5xl space-y-8">

          {/* Header */}
          <header className="space-y-4">
            <h1 className="text-4xl font-serif text-slate-900 tracking-tight">Archive</h1>
            <p className="text-slate-500">
              {allConditions.length} condition{allConditions.length !== 1 ? 's' : ''} catalogued across {diagnoses.length} diagnosis session{diagnoses.length !== 1 ? 's' : ''}.
              {reviews.length > 0 && ` ${reviews.length} review${reviews.length !== 1 ? 's' : ''} published.`}
            </p>
          </header>

          {/* Controls */}
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex bg-slate-100 p-1 rounded-lg">
              {([
                { key: 'conditions' as const, label: `Conditions (${allConditions.length})`, icon: Tag },
                { key: 'reviews' as const, label: `Reviews (${reviews.length})`, icon: FileText },
              ]).map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => { setTab(key); setSelectedCondition(null); setSelectedReview(null); }}
                  className={`flex items-center gap-1.5 py-2 px-4 text-sm font-medium rounded-md transition-all ${
                    tab === key
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </button>
              ))}
            </div>

            <div className="flex gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search archive..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-colors"
                />
              </div>
              {tab === 'conditions' && (
                <button
                  onClick={() => setShowReviewPanel(!showReviewPanel)}
                  className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg border transition-colors ${
                    showReviewPanel
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-slate-400'
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  Write Review
                </button>
              )}
            </div>
          </div>

          {/* Review generation panel */}
          <AnimatePresence>
            {showReviewPanel && tab === 'conditions' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
                  <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                    <FlaskConical className="w-4 h-4" />
                    Generate Journal Review
                  </h3>
                  <p className="text-sm text-slate-500">
                    Select conditions below, then generate a Nature-style review article synthesizing them.
                    {selectedForReview.size > 0 && (
                      <span className="font-medium text-slate-700"> {selectedForReview.size} selected.</span>
                    )}
                  </p>
                  <textarea
                    rows={2}
                    placeholder="Optional: provide context or a focus for the review (e.g., 'Focus on how these conditions interact in emerging markets')"
                    value={reviewContext}
                    onChange={(e) => setReviewContext(e.target.value)}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-colors resize-none placeholder:text-slate-400"
                  />
                  <button
                    onClick={handleGenerateReview}
                    disabled={selectedForReview.size === 0 || isGeneratingReview}
                    className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white py-2.5 px-4 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isGeneratingReview ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Generating review...
                      </>
                    ) : (
                      <>
                        <FileText className="w-4 h-4" />
                        Generate Review ({selectedForReview.size} conditions)
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Content */}
          <AnimatePresence mode="wait">
            {/* Conditions Tab */}
            {tab === 'conditions' && !selectedCondition && (
              <motion.div
                key="conditions-list"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {filteredConditions.length === 0 ? (
                  <EmptyState
                    icon={BookOpen}
                    title={searchQuery ? 'No matching conditions' : 'No conditions yet'}
                    description={searchQuery ? 'Try a different search term.' : 'Run a diagnosis to start building your archive.'}
                  />
                ) : (
                  <div className="grid gap-3">
                    {filteredConditions.map(({ condition, diagnosis }, idx) => (
                      <div key={`${diagnosis.id}-${condition.name}-${idx}`} className="flex items-center gap-3">
                        {showReviewPanel && (
                          <button
                            onClick={() => toggleConditionForReview(condition.name)}
                            className="flex-shrink-0 text-slate-400 hover:text-slate-900 transition-colors"
                          >
                            {selectedForReview.has(condition.name) ? (
                              <CheckSquare className="w-5 h-5 text-slate-900" />
                            ) : (
                              <Square className="w-5 h-5" />
                            )}
                          </button>
                        )}
                        <button
                          onClick={() => setSelectedCondition(condition)}
                          className="flex-1 group flex items-center justify-between p-5 bg-white border border-slate-200 rounded-xl hover:border-slate-400 hover:shadow-md transition-all text-left"
                        >
                          <div className="min-w-0">
                            <h4 className="text-lg font-serif font-medium text-slate-900 group-hover:text-slate-700 transition-colors">
                              {condition.name}
                            </h4>
                            <p className="text-sm text-slate-500 mt-1 line-clamp-1">{condition.definition}</p>
                            <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {new Date(diagnosis.timestamp).toLocaleDateString()}
                              </span>
                              <span className="flex items-center gap-1">
                                <Tag className="w-3 h-3" />
                                {diagnosis.domain}
                              </span>
                              <span className="capitalize">{diagnosis.sourceType}</span>
                            </div>
                          </div>
                          <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-slate-600 transition-colors flex-shrink-0" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {/* Condition Detail */}
            {tab === 'conditions' && selectedCondition && (
              <motion.div
                key="condition-detail"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden"
              >
                <div className="p-6 sm:p-8 border-b border-slate-100 bg-slate-50/50">
                  <button
                    onClick={() => setSelectedCondition(null)}
                    className="text-xs font-semibold text-slate-500 uppercase tracking-wider hover:text-slate-900 flex items-center gap-1 mb-4 transition-colors"
                  >
                    <ChevronRight className="w-4 h-4 rotate-180" />
                    Back to Archive
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
                <div className="p-6 sm:p-8 space-y-8">
                  <section>
                    <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Definition</h3>
                    <p className="text-slate-800 leading-relaxed">{selectedCondition.definition}</p>
                  </section>
                  <div className="h-px w-full bg-slate-100"></div>
                  <section>
                    <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Vectors and Symptoms</h3>
                    <p className="text-slate-800 leading-relaxed">{selectedCondition.vectorsAndSymptoms}</p>
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

            {/* Reviews Tab */}
            {tab === 'reviews' && !selectedReview && (
              <motion.div
                key="reviews-list"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {filteredReviews.length === 0 ? (
                  <EmptyState
                    icon={FileText}
                    title={searchQuery ? 'No matching reviews' : 'No reviews yet'}
                    description={searchQuery ? 'Try a different search term.' : 'Select conditions from the archive and generate a journal-style review.'}
                  />
                ) : (
                  <div className="grid gap-3">
                    {filteredReviews.map((review) => (
                      <button
                        key={review.id}
                        onClick={() => setSelectedReview(review)}
                        className="group flex items-center justify-between p-5 bg-white border border-slate-200 rounded-xl hover:border-slate-400 hover:shadow-md transition-all text-left"
                      >
                        <div className="min-w-0">
                          <h4 className="text-lg font-serif font-medium text-slate-900 group-hover:text-slate-700 transition-colors">
                            {review.title}
                          </h4>
                          <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {new Date(review.timestamp).toLocaleDateString()}
                            </span>
                            <span>{review.referencedConditions.length} conditions referenced</span>
                          </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-slate-600 transition-colors flex-shrink-0" />
                      </button>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {/* Review Detail */}
            {tab === 'reviews' && selectedReview && (
              <motion.div
                key="review-detail"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden"
              >
                <div className="p-6 sm:p-8 border-b border-slate-100 bg-slate-50/50">
                  <button
                    onClick={() => setSelectedReview(null)}
                    className="text-xs font-semibold text-slate-500 uppercase tracking-wider hover:text-slate-900 flex items-center gap-1 mb-4 transition-colors"
                  >
                    <ChevronRight className="w-4 h-4 rotate-180" />
                    Back to Reviews
                  </button>
                  <h2 className="text-2xl sm:text-3xl font-serif font-medium text-slate-900 mb-2">
                    {selectedReview.title}
                  </h2>
                  <div className="flex items-center gap-3 text-xs text-slate-400 mt-2">
                    <span>{new Date(selectedReview.timestamp).toLocaleDateString()}</span>
                    <span>References: {selectedReview.referencedConditions.join(', ')}</span>
                  </div>
                </div>
                <div className="p-6 sm:p-8 prose prose-slate prose-sm max-w-none">
                  {selectedReview.content.split('\n').map((paragraph, i) => {
                    if (paragraph.startsWith('# ')) {
                      return <h1 key={i} className="text-2xl font-serif font-medium text-slate-900 mt-8 mb-4">{paragraph.slice(2)}</h1>;
                    }
                    if (paragraph.startsWith('## ')) {
                      return <h2 key={i} className="text-xl font-serif font-medium text-slate-900 mt-6 mb-3">{paragraph.slice(3)}</h2>;
                    }
                    if (paragraph.startsWith('### ')) {
                      return <h3 key={i} className="text-lg font-serif font-medium text-slate-900 mt-4 mb-2">{paragraph.slice(4)}</h3>;
                    }
                    if (paragraph.trim() === '') return <div key={i} className="h-2" />;
                    return <p key={i} className="text-slate-800 leading-relaxed mb-3">{paragraph}</p>;
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function EmptyState({ icon: Icon, title, description }: { icon: any; title: string; description: string }) {
  return (
    <div className="flex flex-col items-center justify-center text-center p-16 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
      <Icon className="w-12 h-12 text-slate-300 mb-4" />
      <h3 className="text-lg font-medium text-slate-900 mb-2">{title}</h3>
      <p className="text-sm text-slate-500 max-w-sm">{description}</p>
    </div>
  );
}
