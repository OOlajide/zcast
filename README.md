# InstaPod - AI Podcast Generator

Generate unique podcast episodes from a single prompt. Features Neo and Trinity as your AI hosts in an engaging conversational format.

## Features

- **Modern UI**: Clean, minimalist design optimized for mobile
- **AI-Powered**: Uses Google Gemini for transcript and speech generation
- **Multi-Speaker**: Features Neo and Trinity as hosts
- **Audio Playback**: Built-in audio player with download functionality
- **Real-time Generation**: Create podcasts on-demand from any topic

## Setup

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Configure Environment Variables**
   Create a `.env.local` file in your project root:
   ```
   GEMINI_API_KEY=your_gemini_api_key_here
   NEXT_PUBLIC_URL=http://localhost:3000
   ```

3. **Get Google AI API Key**
   - Visit [Google AI Studio](https://aistudio.google.com/)
   - Create a new project and generate an API key

4. **Run the Development Server**
   ```bash
   npm run dev
   ```

5. **Open the App**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Usage

1. Enter a topic or prompt in the text area (e.g., "history of bitcoin")
2. Click "Generate" to start the process
3. Wait for podcast generation
4. Listen to the generated audio using the built-in player

## Technology Stack

- **Frontend**: Next.js 15, React 18, Tailwind CSS
- **Backend**: Next.js API Routes
- **AI**: Google Gemini 2.0 Flash (transcript), Gemini 2.5 Flash TTS (audio)
- **Audio**: WAV format with multi-speaker voice synthesis

## API Endpoints

- `POST /api/generate-podcast` - Generate podcast from prompt
  - Body: `{ "prompt": "your topic here" }`
  - Returns: `{ "audioUrl": "/podcasts/podcast-timestamp.wav", "transcript": "..." }`

## File Structure

```
app/
├── api/generate-podcast/route.ts  # Podcast generation API
├── page.tsx                       # Main UI component
├── layout.tsx                     # App layout and metadata
└── globals.css                    # Global styles

public/
└── podcasts/                      # Generated audio files
```

## Deployment

Deploy to Vercel:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-username/instapod)

Make sure to add your `GEMINI_API_KEY` environment variable in your deployment settings.

## Notes

- Built on the MiniKit framework for Farcaster integration