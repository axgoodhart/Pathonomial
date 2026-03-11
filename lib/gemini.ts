import { GoogleGenAI, Type } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export const conditionSchema = {
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
};

export const SYSTEM_INSTRUCTION = "You are a clinical diagnostician for systems-level entities. You write in a highly academic, medical, and detached tone, similar to the ICD or DSM, but applied to systemic domains like the Economy or Electoral Politics. You invent conditions that perfectly encapsulate the systemic dysfunction described by the user.";

export { ai, Type };
