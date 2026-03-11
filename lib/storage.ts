export type Condition = {
  name: string;
  otherNames: string[];
  definition: string;
  types: string[];
  vectorsAndSymptoms: string;
  potentialMechanisms: string[];
};

export type DiagnosisRecord = {
  id: string;
  timestamp: number;
  domain: string;
  sourceType: 'symptoms' | 'document' | 'url';
  sourceText: string;
  conditions: Condition[];
};

export type ReviewRecord = {
  id: string;
  timestamp: number;
  title: string;
  content: string;
  referencedConditions: string[];
};

const DIAGNOSES_KEY = 'pathonomial_diagnoses';
const REVIEWS_KEY = 'pathonomial_reviews';

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export function saveDiagnosis(record: DiagnosisRecord): void {
  const existing = getDiagnoses();
  existing.unshift(record);
  localStorage.setItem(DIAGNOSES_KEY, JSON.stringify(existing));
}

export function getDiagnoses(): DiagnosisRecord[] {
  if (typeof window === 'undefined') return [];
  const raw = localStorage.getItem(DIAGNOSES_KEY);
  return raw ? JSON.parse(raw) : [];
}

export function getAllConditions(): { condition: Condition; diagnosis: DiagnosisRecord }[] {
  const diagnoses = getDiagnoses();
  const results: { condition: Condition; diagnosis: DiagnosisRecord }[] = [];
  for (const d of diagnoses) {
    for (const c of d.conditions) {
      results.push({ condition: c, diagnosis: d });
    }
  }
  return results;
}

export function saveReview(record: ReviewRecord): void {
  const existing = getReviews();
  existing.unshift(record);
  localStorage.setItem(REVIEWS_KEY, JSON.stringify(existing));
}

export function getReviews(): ReviewRecord[] {
  if (typeof window === 'undefined') return [];
  const raw = localStorage.getItem(REVIEWS_KEY);
  return raw ? JSON.parse(raw) : [];
}
