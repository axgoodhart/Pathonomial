import { NextRequest, NextResponse } from 'next/server';
import { ai, Type } from '@/lib/gemini';

const reviewSchema = {
  type: Type.OBJECT,
  properties: {
    title: {
      type: Type.STRING,
      description: "The title of the review article, written in the style of a Nature or Lancet publication."
    },
    content: {
      type: Type.STRING,
      description: "The full body of the review article in markdown format. Should include Abstract, Introduction, sections for each condition group, Discussion, and Conclusion. Reference the conditions by name throughout."
    }
  },
  required: ["title", "content"]
};

export async function POST(req: NextRequest) {
  try {
    const { conditions, context } = await req.json();

    if (!conditions?.length) {
      return NextResponse.json({ error: 'At least one condition is required.' }, { status: 400 });
    }

    const conditionSummaries = conditions.map((c: any, i: number) =>
      `${i + 1}. **${c.name}** (also known as: ${c.otherNames?.join(', ') || 'N/A'})\n   Definition: ${c.definition}\n   Types: ${c.types?.join(', ')}\n   Vectors & Symptoms: ${c.vectorsAndSymptoms}\n   Mechanisms: ${c.potentialMechanisms?.join('; ')}`
    ).join('\n\n');

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `You are writing a review article for a prestigious academic journal (Nature, The Lancet, etc.) that surveys the following diagnosed systemic conditions. The article should synthesize these conditions into a coherent narrative, identify common threads, discuss implications, and propose areas for further investigation.\n\n${context ? `Context for this review: ${context}\n\n` : ''}Conditions to review:\n${conditionSummaries}\n\nWrite the full review article in markdown. Include an Abstract, Introduction, detailed analysis sections, Discussion of cross-cutting themes, and a Conclusion. Reference each condition by its clinical name. Maintain a detached, academic tone throughout.`,
      config: {
        systemInstruction: "You are a senior editor and researcher at a prestigious academic journal that publishes reviews of systemic pathologies. Your prose is precise, authoritative, and rich with cross-references between conditions. You write in the style of review articles found in Nature, The Lancet, or the Annual Review of Political Economy.",
        responseMimeType: "application/json",
        responseSchema: reviewSchema,
      }
    });

    if (!response.text) {
      return NextResponse.json({ error: 'Failed to generate review.' }, { status: 500 });
    }

    const data = JSON.parse(response.text);
    return NextResponse.json(data);
  } catch (err: any) {
    console.error('Review error:', err);
    return NextResponse.json({ error: err.message || 'Review generation failed.' }, { status: 500 });
  }
}
