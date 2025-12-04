# Zcash Daily Intelligence Pipeline

This repository contains an automated pipeline to generate daily Zcash intelligence podcasts.

## Prerequisites

1.  **Node.js**: v18+
2.  **Python**: v3.8+ with `pip`.
3.  **API Keys**:
    *   Google Gemini API Key (for script generation and TTS) - Set as `GEMINI_API_KEY` in environment variables.
    *   Blockchair (Key provided in script: `202001ZjMvj8R3BF`)

## Setup

1.  **Install Node dependencies:**
    ```bash
    npm install
    ```

2.  **Install Python dependencies:**
    ```bash
    pip install -r requirements.txt
    ```
    *Note: If on a managed system without pip, use a virtual environment:*
    ```bash
    python3 -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt
    ```

3.  **Environment Variables:**
    Create a `.env` file in the root directory:
    ```bash
    GEMINI_API_KEY=your_google_gemini_api_key_here
    ```

## Usage

### 1. Manual Run (Test)

To run the pipeline for "yesterday" (or a specific date):

```bash
# Run for yesterday
npm run daily-job

# Run for a specific date (YYYYMMDD)
npm run daily-job 20251203
```

### 2. Scheduler

To start the daily scheduler (runs at 12:00 PM UTC):

```bash
npm run scheduler
```

## Architecture

*   **`scripts/daily-pipeline.ts`**: The main orchestrator.
    *   Downloads .tsv.gz files from Blockchair.
    *   Decompresses them.
    *   Runs `lib/analytics.py`.
    *   Generates script (Google Gemini 2.0 Flash).
    *   Generates audio (Google Gemini 2.5 Flash TTS).
    *   Saves WAV to `public/podcasts/`.
*   **`lib/analytics.py`**: Python Pandas script for Zcash metrics.
*   **`app/daily/page.tsx`**: Next.js frontend page to listen to the daily report.
*   **`scripts/scheduler.ts`**: Node-cron job.

## Output

*   **Metrics**: `metrics_YYYYMMDD.json` (Root directory)
*   **Data**: `data/` (Downloaded TSV files)
*   **Podcasts**: `public/podcasts/zcash_daily_podcast_YYYYMMDD.wav`
