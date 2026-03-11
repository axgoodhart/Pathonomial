import { NextRequest, NextResponse } from 'next/server';
import { ai, conditionSchema, SYSTEM_INSTRUCTION } from '@/lib/gemini';

export async function POST(req: NextRequest) {
  try {
    const { symptoms, domain } = await req.json();

    if (!symptoms?.trim()) {
      return NextResponse.json({ error: 'Symptoms are required.' }, { status: 400 });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Analyze the following symptoms in the domain of ${domain}: "${symptoms}". Generate 2 to 4 fictional, clinical-sounding conditions that diagnose these systemic issues. Consider a unique blend of real-world market indicators, sentiments, competitive or anticompetitive behaviors, etc. based on the prompt, and consider allegories for them in medicinal literature. Use creative portmanteaus and refashioning of domain vocabulary, without forgery of real condition descriptions. Provide a different lens of clarity on the issues.`,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: conditionSchema,
      }
    });

    if (!response.text) {
      return NextResponse.json({ error: 'No response from the diagnostic model.' }, { status: 500 });
    }

    const data = JSON.parse(response.text);
    return NextResponse.json(data);
  } catch (err: any) {
    console.error('Diagnose error:', err);
    return NextResponse.json({ error: err.message || 'Diagnosis failed.' }, { status: 500 });
  }
}
