import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { createGunzip } from 'zlib';
import { pipeline } from 'stream';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const execAsync = promisify(exec);
const streamPipeline = promisify(pipeline);

// Configuration
const DATA_DIR = path.join(process.cwd(), 'data');
const PUBLIC_PODCAST_DIR = path.join(process.cwd(), 'public', 'podcasts');
const PYTHON_SCRIPT = path.join(process.cwd(), 'lib', 'analytics.py');

// Ensure directories exist
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(PUBLIC_PODCAST_DIR)) fs.mkdirSync(PUBLIC_PODCAST_DIR, { recursive: true });

// --- WAV Helper Functions (Ported from existing route.ts) ---
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

async function saveWavFile(outputPath: string, pcmData: Buffer) {
  const header = createWavHeader(pcmData.length);
  const wavBuffer = Buffer.concat([header, pcmData]);
  fs.writeFileSync(outputPath, wavBuffer);
  console.log(`Saved audio to ${outputPath} (${wavBuffer.length} bytes)`);
}
// ------------------------------------------------------------

async function downloadFile(url: string, destPath: string) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to download ${url}: ${response.statusText}`);
  if (!response.body) throw new Error(`No body for ${url}`);

  // @ts-ignore - native fetch stream compatible with pipeline
  await streamPipeline(response.body, fs.createWriteStream(destPath));
}

async function decompressFile(sourcePath: string, destPath: string) {
  await streamPipeline(
    fs.createReadStream(sourcePath),
    createGunzip(),
    fs.createWriteStream(destPath)
  );
}

async function generatePodcastScript(metrics: any, dateStr: string, ai: GoogleGenAI, prevMetrics?: any): Promise<string> {
  console.log('Generating podcast script with Gemini 2.0 Flash...');

  let prompt = `
    Based on the following Zcash metrics for ${dateStr}, generate a 5-7 minute professional analyst podcast dialogue between two hosts, Neo and Trinity.
    Neo: Lead Analyst (Deep, insightful, technical).
    Trinity: Co-host (Inquisitive, clarifies points, adds market context).
    Tone: Professional, Analytical, Insightful. Not hype.
    Topics: Privacy flows, Whale activity, Network health, Anomalies.
    
    IMPORTANT: Strictly spoken dialogue only. No sound effects, no music cues, no [applause], no [intro music], no [fade out]. Only write what the hosts say.
    Structure the response as a pure script with "Neo:" and "Trinity:" prefixes.
    
    Current Metrics (${dateStr}):
    ${JSON.stringify(metrics, null, 2)}
  `;

  if (prevMetrics) {
    prompt += `
    
    Previous Day Metrics (for comparison/trend analysis):
    ${JSON.stringify(prevMetrics, null, 2)}
    
    Instruction: Compare today's metrics with the previous day's metrics. Highlight significant changes (e.g., spikes in shielded transactions, drop in hashrate, large whale movements). Discuss trends.
    `;
  }

  const response = await ai.models.generateContent({
    model: "gemini-flash-latest",
    contents: prompt,
  });

  const script = response.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!script) throw new Error("Failed to generate script from Gemini.");

  return script;
}

async function generateAudio(script: string, dateStr: string, ai: GoogleGenAI): Promise<string> {
  console.log('Converting script to audio with Gemini 2.5 Flash TTS...');

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: script,
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

  const audioData = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (!audioData) throw new Error('Failed to generate audio from Gemini TTS');

  const audioBuffer = Buffer.from(audioData, 'base64');
  const outputPath = path.join(PUBLIC_PODCAST_DIR, `zcash_daily_podcast_${dateStr}.wav`); // Using WAV as raw output from header function

  await saveWavFile(outputPath, audioBuffer);

  return outputPath;
}

async function runPipeline(specificDate?: string) {
  try {
    console.log('Starting Daily Zcash Pipeline...');

    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENAI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY or GOOGLE_GENAI_API_KEY is not set in environment variables.");
    }
    const ai = new GoogleGenAI({ apiKey });

    // 1. Calculate Date (Yesterday if not specified)
    const today = new Date();
    const targetDate = specificDate ? new Date(specificDate.slice(0, 4) + '-' + specificDate.slice(4, 6) + '-' + specificDate.slice(6, 8)) : new Date(today);
    if (!specificDate) targetDate.setDate(today.getDate() - 1); // Yesterday

    const yyyy = targetDate.getFullYear();
    const mm = String(targetDate.getMonth() + 1).padStart(2, '0');
    const dd = String(targetDate.getDate()).padStart(2, '0');
    const dateStr = `${yyyy}${mm}${dd}`;
    
    // Calculate previous date
    const prevDate = new Date(targetDate);
    prevDate.setDate(prevDate.getDate() - 1);
    const prevYyyy = prevDate.getFullYear();
    const prevMm = String(prevDate.getMonth() + 1).padStart(2, '0');
    const prevDd = String(prevDate.getDate()).padStart(2, '0');
    const prevDateStr = `${prevYyyy}${prevMm}${prevDd}`;

    console.log(`Processing for date: ${dateStr} (Previous: ${prevDateStr})`);

    // 2. Download Files
    const files = ['blocks', 'transactions', 'inputs', 'outputs'];
    const baseUrl = 'https://gz.blockchair.com/zcash';
    const key = process.env.BLOCKCHAIR_KEY;
    
    if (!key) {
        throw new Error("BLOCKCHAIR_KEY is not set in environment variables.");
    }

    for (const type of files) {
      const fileName = `blockchair_zcash_${type}_${dateStr}.tsv.gz`;
      const url = `${baseUrl}/${type}/${fileName}?key=${key}`;
      const compressedPath = path.join(DATA_DIR, fileName);
      const decompressedPath = path.join(process.cwd(), `blockchair_zcash_${type}_${dateStr}.tsv`); // Root for python script compatibility

      // Check if decompressed file already exists to save bandwidth during dev
      if (fs.existsSync(decompressedPath)) {
        console.log(`File ${decompressedPath} already exists. Skipping download.`);
        continue;
      }

      console.log(`Downloading ${type}...`);
      try {
        await downloadFile(url, compressedPath);
        console.log(`Decompressing ${type}...`);
        await decompressFile(compressedPath, decompressedPath);
      } catch (e) {
        console.error(`Error handling ${type}:`, e);
        throw e;
      }
    }

    // 3. Run Analytics (Python)
    console.log('Running analytics engine...');
    await execAsync(`./.venv/bin/python ${PYTHON_SCRIPT} ${dateStr}`);

    // 4. Read Metrics
    const metricsDir = path.join(process.cwd(), 'data', 'metrics');
    const metricsPath = path.join(metricsDir, `metrics_${dateStr}.json`);
    const prevMetricsPath = path.join(metricsDir, `metrics_${prevDateStr}.json`);

    if (!fs.existsSync(metricsPath)) throw new Error(`Metrics file was not generated at ${metricsPath}.`);
    const metrics = JSON.parse(fs.readFileSync(metricsPath, 'utf-8'));
    
    let prevMetrics = null;
    if (fs.existsSync(prevMetricsPath)) {
        console.log(`Found previous day metrics: ${prevMetricsPath}`);
        try {
            prevMetrics = JSON.parse(fs.readFileSync(prevMetricsPath, 'utf-8'));
        } catch (e) {
            console.warn("Failed to parse previous metrics:", e);
        }
    } else {
        console.log("No previous day metrics found for comparison.");
    }

    // Cleanup Data Files
    console.log('Cleaning up data files...');
    for (const type of files) {
        const compressedFile = path.join(DATA_DIR, `blockchair_zcash_${type}_${dateStr}.tsv.gz`);
        const decompressedFile = path.join(process.cwd(), `blockchair_zcash_${type}_${dateStr}.tsv`);

        if (fs.existsSync(compressedFile)) {
            fs.unlinkSync(compressedFile);
            console.log(`Deleted ${compressedFile}`);
        }
        if (fs.existsSync(decompressedFile)) {
            fs.unlinkSync(decompressedFile);
            console.log(`Deleted ${decompressedFile}`);
        }
    }

    // 5. Generate Script
    const script = await generatePodcastScript(metrics, dateStr, ai, prevMetrics);

    // 6. Generate Audio
    await generateAudio(script, dateStr, ai);

    console.log('Pipeline completed successfully.');

  } catch (error) {
    console.error('Pipeline failed:', error);
    process.exit(1);
  }
}

// CLI execution check
import { fileURLToPath } from 'url';

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const dateArg = args[0]; // Optional YYYYMMDD
  runPipeline(dateArg);
}

export { runPipeline };

