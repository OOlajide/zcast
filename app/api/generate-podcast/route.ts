import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { put } from '@vercel/blob';

// Set maximum duration for this function
export const maxDuration = 60; // 60 seconds (maximum for Hobby plan)

function createWavHeader(pcmDataLength: number, channels = 1, sampleRate = 24000, bitsPerSample = 16): Buffer {
  const header = Buffer.alloc(44);
  
  // RIFF header
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + pcmDataLength, 4); // File size - 8 bytes
  header.write('WAVE', 8);
  
  // Format chunk
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16); // Format chunk size
  header.writeUInt16LE(1, 20); // Audio format (PCM)
  header.writeUInt16LE(channels, 22); // Number of channels
  header.writeUInt32LE(sampleRate, 24); // Sample rate
  header.writeUInt32LE(sampleRate * channels * (bitsPerSample / 8), 28); // Byte rate
  header.writeUInt16LE(channels * (bitsPerSample / 8), 32); // Block align
  header.writeUInt16LE(bitsPerSample, 34); // Bits per sample
  
  // Data chunk
  header.write('data', 36);
  header.writeUInt32LE(pcmDataLength, 40); // Data size
  
  return header;
}

async function convertPcmToWavAndSave(
  filename: string,
  pcmData: Buffer,
  channels = 1,
  sampleRate = 24000,
  bitsPerSample = 16,
): Promise<string> {
  try {
    // Create WAV header manually (like Google's wav.FileWriter does internally)
    const header = createWavHeader(pcmData.length, channels, sampleRate, bitsPerSample);
    
    // Combine header + PCM data = complete WAV file
    const wavBuffer = Buffer.concat([header, pcmData]);
    
    console.log('WAV file created, size:', wavBuffer.length, 'bytes');
    console.log('Header size:', header.length, 'PCM data size:', pcmData.length);
    
    // Upload to Vercel Blob
    const blob = await put(filename, wavBuffer, {
      access: 'public',
      contentType: 'audio/wav',
    });
    
    return blob.url;
  } catch (error) {
    throw error;
  }
}

export async function POST(request: NextRequest) {
  try {
    const { prompt } = await request.json();

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json({ error: 'Valid prompt is required' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'GEMINI_API_KEY is not configured' }, { status: 500 });
    }

    const ai = new GoogleGenAI({ apiKey });

    // First, generate the transcript
    const transcriptResponse = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: `Generate a short transcript on ${prompt}, around 100 words that reads like it was clipped from a podcast. The podcast host name is Neo and co-host name is Trinity.`,
    });

    const transcript = transcriptResponse.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!transcript) {
      throw new Error('Failed to generate transcript');
    }

    // Then, generate the audio
    const audioResponse = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: transcript,
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          multiSpeakerVoiceConfig: {
            speakerVoiceConfigs: [
              {
                speaker: "Neo",
                voiceConfig: {
                  prebuiltVoiceConfig: { voiceName: "Charon" },
                }
              },
              {
                speaker: "Trinity",
                voiceConfig: {
                  prebuiltVoiceConfig: { voiceName: "Leda" },
                }
              }
            ]
          }
        }
      }
    });

    const audioData = audioResponse.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    
    if (!audioData) {
      throw new Error('Failed to generate audio');
    }

    const audioBuffer = Buffer.from(audioData, 'base64');

    // Generate unique filename
    const timestamp = Date.now();
    const filename = `podcasts/podcast-${timestamp}.wav`;

    // Convert PCM to WAV and save to Vercel Blob (following Google's example)
    const audioUrl = await convertPcmToWavAndSave(filename, audioBuffer);

    return NextResponse.json({ 
      audioUrl,
      transcript
    });

  } catch (error) {
    console.error('Error generating podcast:', error);
    return NextResponse.json(
      { error: 'Failed to generate podcast. Please try again.' },
      { status: 500 }
    );
  }
}
