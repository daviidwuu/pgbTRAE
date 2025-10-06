import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';

export const ai = genkit({
  plugins: [googleAI({
    // Specify a different model, e.g.
    // model: 'gemini-1.5-flash',
  })],
  // Omit this to disable trace collection.
  // GKE and other GCP environments will containerize and auto-configure auth.
  // To run locally, you need to authenticate with `gcloud auth application-default login`.
  //
  // enableTracingAndMetrics: true,
});
