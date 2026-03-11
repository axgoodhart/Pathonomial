import { NextRequest, NextResponse } from 'next/server';
import { ai, conditionSchema, SYSTEM_INSTRUCTION, Type } from '@/lib/gemini';

const pathwaySchema = {
  type: Type.OBJECT,
  properties: {
    pathways: {
      type: Type.ARRAY,
      description: "2 to 4 distinct diagnostic pathways identified from the source material.",
      items: {
        type: Type.OBJECT,
        properties: {
          pathwayName: {
            type: Type.STRING,
            description: "A short clinical name for this diagnostic pathway."
          },
          summary: {
            type: Type.STRING,
            description: "A brief summary of the systemic dysfunction this pathway examines."
          },
          extractedSymptoms: {
            type: Type.STRING,
            description: "The specific symptoms and signals extracted from the source material for this pathway."
          }
        },
        required: ["pathwayName", "summary", "extractedSymptoms"]
      }
    }
  },
  required: ["pathways"]
};

export async function POST(req: NextRequest) {
  try {
    const { sourceText, domain } = await req.json();

    if (!sourceText?.trim()) {
      return NextResponse.json({ error: 'Source text is required.' }, { status: 400 });
    }

    // Step 1: Autonomously identify diagnostic pathways from the source
    const pathwayResponse = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `You are analyzing the following source material in the domain of ${domain}. Identify 2 to 4 distinct diagnostic pathways — independent angles of systemic dysfunction that this material reveals. For each pathway, extract the specific symptoms and signals from the text.\n\nSource material:\n"""\n${sourceText.slice(0, 8000)}\n"""`,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: pathwaySchema,
      }
    });

    if (!pathwayResponse.text) {
      return NextResponse.json({ error: 'Failed to identify diagnostic pathways.' }, { status: 500 });
    }

    const { pathways } = JSON.parse(pathwayResponse.text);

    // Step 2: For each pathway, generate full condition diagnoses in parallel
    const diagnosisPromises = pathways.map((pathway: any) =>
      ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Diagnostic Pathway: "${pathway.pathwayName}"\nPathway Summary: ${pathway.summary}\nExtracted Symptoms in the domain of ${domain}: "${pathway.extractedSymptoms}"\n\nGenerate 2 to 4 fictional, clinical-sounding conditions that diagnose the systemic issues identified in this pathway. Consider a unique blend of real-world indicators, sentiments, and behaviors, and consider allegories for them in medicinal literature. Use creative portmanteaus and refashioning of domain vocabulary, without forgery of real condition descriptions.`,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          responseMimeType: "application/json",
          responseSchema: conditionSchema,
        }
      })
    );

    const diagnosisResponses = await Promise.all(diagnosisPromises);

    const results = pathways.map((pathway: any, idx: number) => {
      const text = diagnosisResponses[idx].text;
      const conditions = text ? JSON.parse(text).conditions : [];
      return {
        pathwayName: pathway.pathwayName,
        summary: pathway.summary,
        conditions,
      };
    });

    return NextResponse.json({ pathways: results });
  } catch (err: any) {
    console.error('Ingest error:', err);
    return NextResponse.json({ error: err.message || 'Source ingestion failed.' }, { status: 500 });
  }
}
