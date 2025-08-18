# InstaPod - AI Podcast Generator

Generate unique podcast episodes from a single prompt using Google's Gemini AI. Features Neo and Trinity as your AI hosts in an engaging conversational format.

## Features

- **Modern UI**: Clean, minimalist design optimized for mobile
- **AI-Powered**: Uses Google Gemini for transcript and speech generation
- **Multi-Speaker**: Features Neo (Charon voice) and Trinity (Leda voice) as hosts
- **Audio Playback**: Built-in audio player with download functionality
- **Real-time Generation**: Create podcasts on-demand from any topic
- **Payment Integration**: Secure payments via Base network (0.1 USDC per episode)

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
   - Make sure you have access to Gemini 2.0 Flash and Gemini 2.5 Flash TTS models

4. **Run the Development Server**
   ```bash
   npm run dev
   ```

5. **Open the App**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Usage

1. Enter a topic or prompt in the text area (e.g., "A debate on the ethics of artificial intelligence in art creation")
2. Click "Generate (0.1 USDC)" to start the process
3. Approve the payment transaction in your wallet (0.1 USDC)
4. Wait for podcast generation (30-60 seconds)
5. Listen to the generated audio using the built-in player
6. Download the episode as a WAV file

## Technology Stack

- **Frontend**: Next.js 15, React 18, Tailwind CSS
- **Backend**: Next.js API Routes
- **AI**: Google Gemini 2.0 Flash (transcript), Gemini 2.5 Flash TTS (audio)
- **Audio**: WAV format with multi-speaker voice synthesis
- **Payments**: Base Account SDK for secure USDC transactions

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

- Generated audio files are stored in `public/podcasts/`
- Each podcast is approximately 100 words and takes 30-60 seconds to generate
- The app uses a modern, minimalist design optimized for mobile devices
- Built on the MiniKit framework for Farcaster integration