# Zcast - Daily Zcash Intelligence

Zcast is an automated intelligence pipeline that generates a daily professional podcast analyzing Zcash network metrics, privacy usage, and blockchain anomalies.

## Overview

Every day, the system:
1.  **Ingests Data**: Downloads raw Zcash blockchain data (blocks, transactions, inputs, outputs) from Blockchair.
2.  **Analyzes Metrics**: Runs a Python analytics engine to compute key indicators like Net Privacy Flow, Shielded Transaction counts, and Network Throughput.
3.  **Generates Script**: The metrics from the analytics script are fed to Google Gemini Flash 2.5 to write a professional analyst script.
4.  **Synthesizes Audio**: Uses Google Gemini Flash 2.5 TTS to voice the script as "Cipher", an AI crypto analyst.
5.  **Publishes**: Makes the episode available via a Next.js web interface.

## Prerequisites

- Node.js 18+
- Python 3.10+
- Google Gemini API Key

## Setup

1.  **Install Node Dependencies**
    ```bash
    npm install
    ```

2.  **Setup Python Environment**
    ```bash
    python3 -m venv .venv
    source .venv/bin/activate
    pip install -r requirements.txt
    ```

3.  **Configure Environment**
    Create a `.env` file:
    ```env
    GEMINI_API_KEY=your_api_key_here
    BLOCKCHAIR_KEY=your_blockchair_api_key
    ```

## Usage

### Running the Pipeline

To generate the podcast for yesterday (default):
```bash
npm run daily-job
```

To generate for a specific date (e.g., Dec 3rd, 2025):
```bash
npm run daily-job 20251203
```

### Viewing the Dashboard

Start the web interface to listen to episodes and view metrics:
```bash
npm run dev
```
Visit [http://localhost:3000](http://localhost:3000).

## Architecture

- **Pipeline**: `scripts/daily-pipeline.ts` (Orchestrator)
- **Analytics**: `lib/analytics.py` (Python data processing)
- **Frontend**: Next.js 15 (React 18)
- **AI Models**:
    - Script: Gemini Flash 2.5
    - Audio: Gemini Flash 2.5 TTS

## Data Source
Blockchain data provided by [Blockchair](https://blockchair.com/).
