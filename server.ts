import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import { MsEdgeTTS, OUTPUT_FORMAT } from 'msedge-tts';
import path from 'path';
import fs from 'fs';

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '1mb' }));

// List of supported voices
const SUPPORTED_VOICES: Record<string, { id: string; name: string; gender: string }> = {
  'hi-IN-MadhurNeural': {
    id: 'hi-IN-MadhurNeural',
    name: 'Madhur (मधुर)',
    gender: 'Male',
  },
  'hi-IN-SwaraNeural': {
    id: 'hi-IN-SwaraNeural',
    name: 'Swara (स्वरा)',
    gender: 'Female',
  },
};

// TTS Synthesis endpoint using Microsoft Edge Neural TTS in-memory
app.post('/api/tts', async (req: Request, res: Response) => {
  try {
    const { text, voice = 'hi-IN-MadhurNeural', rate = '+0%', pitch = '+0Hz' } = req.body;

    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      res.status(400).json({ error: 'Text is required and cannot be empty.' });
      return;
    }

    const cleanText = text.trim();
    if (cleanText.length > 5000) {
      res.status(400).json({ error: 'Text exceeds maximum limit of 5,000 characters.' });
      return;
    }

    const voiceId = SUPPORTED_VOICES[voice] ? voice : 'hi-IN-MadhurNeural';

    // Initialize Edge TTS
    const tts = new MsEdgeTTS();
    await tts.setMetadata(voiceId, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);

    // Rate and pitch options
    const options: { rate?: string; pitch?: string } = {};
    if (rate && typeof rate === 'string') options.rate = rate;
    if (pitch && typeof pitch === 'string') options.pitch = pitch;

    const { audioStream } = await tts.toStream(cleanText, options);

    const chunks: Buffer[] = [];
    audioStream.on('data', (chunk: Buffer) => {
      chunks.push(chunk);
    });

    audioStream.on('close', () => {
      const audioBuffer = Buffer.concat(chunks);
      if (audioBuffer.length === 0) {
        res.status(502).json({ error: 'TTS engine produced empty audio. Please try again.' });
        return;
      }

      res.setHeader('Content-Type', 'audio/mpeg');
      res.setHeader('Content-Length', audioBuffer.length);
      res.setHeader(
        'Content-Disposition',
        `inline; filename="hindi_speech_${voiceId.includes('Madhur') ? 'madhur' : 'swara'}.mp3"`
      );
      res.setHeader('Cache-Control', 'no-cache');
      res.end(audioBuffer);
    });

    audioStream.on('error', (err: unknown) => {
      console.error('Edge TTS stream error:', err);
      if (!res.headersSent) {
        res.status(500).json({
          error: 'Failed to synthesize speech via Edge TTS.',
          details: err instanceof Error ? err.message : String(err),
        });
      }
    });
  } catch (error) {
    console.error('Server error during TTS synthesis:', error);
    if (!res.headersSent) {
      res.status(500).json({
        error: 'Internal server error while processing TTS request.',
        details: error instanceof Error ? error.message : String(error),
      });
    }
  }
});

// Endpoint to fetch Python app.py source code
app.get('/api/python-code', (_req: Request, res: Response) => {
  try {
    const appPyPath = path.resolve(__dirname, 'app.py');
    if (fs.existsSync(appPyPath)) {
      const code = fs.readFileSync(appPyPath, 'utf8');
      res.json({ code, filename: 'app.py' });
    } else {
      res.status(404).json({ error: 'app.py not found.' });
    }
  } catch (err) {
    res.status(500).json({ error: 'Failed to read app.py' });
  }
});

// Endpoint to download app.py directly
app.get('/api/download-app-py', (_req: Request, res: Response) => {
  try {
    const appPyPath = path.resolve(__dirname, 'app.py');
    res.download(appPyPath, 'app.py');
  } catch (err) {
    res.status(500).json({ error: 'Failed to download app.py' });
  }
});

async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
