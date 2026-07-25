export interface JudgmentResult {
  score: number;
  label: 'underripe' | 'ripe' | 'overripe';
  confidence: number;
  explanation: string[];
  audioFeatures?: any;
}

export async function submitAudioForJudgment(audioBlob: Blob): Promise<JudgmentResult> {
  const formData = new FormData();
  formData.append('audio', audioBlob, 'slap.webm');

  // Point this to your local backend initially
  const response = await fetch('http://localhost:8000/api/judge', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error('Failed to get judgment');
  }

  return response.json();
}