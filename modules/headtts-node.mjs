import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { cpus } from 'os';
import { Worker } from 'worker_threads';
import * as utils from './utils.mjs';

console.log("🚀 HeadTTS is starting...");

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Setup path handling
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load configuration
const configPath = path.join(__dirname, '../headtts-node.json');
const configJson = fs.readFileSync(configPath, 'utf-8');
const config = JSON.parse(configJson);

// Disable WebSocket mode (not supported on Vercel)
config.server.websocket = false;
config.server.rest = true;

// Validate config
if (config.tts.threads < 1 || config.tts.threads > cpus().length) {
  throw new Error(`'threads' must be between 1 and ${cpus().length}`);
}

// Trace setup
const isTraceMessages = (config.trace & utils.traceMask.messages);

// Initialize worker pool
const queue = [];
let threadId = 0;
let restId = 0;

const workers = new Array(config.tts.threads);
const statuses = new Array(config.tts.threads);
const mapRest = new Map();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const workerPath = path.join(__dirname, 'worker-tts.mjs');

for (let i = 0; i < config.tts.threads; i++) {
  const worker = new Worker(workerPath, { type: 'module' });

  workers[i] = worker;
  statuses[i] = 0;

  worker.on('message', (message) => {
    if (message.rest) {
      const res = mapRest.get(message.rest);
      if (res) {
        mapRest.delete(message.rest);
        if (message.type === 'error') {
          res.statusCode = 422;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: message.data }));
        } else if (message.type === 'audio') {
          message.data.audio = Buffer.from(message.data.audio).toString('base64');
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(message.data));
        }
      }
    }

    if (queue.length) {
      const next = queue.shift();
      worker.postMessage(next);
    } else {
      statuses[i] = 0;
    }
  });

  // Initialize worker
  const workerInitData = {};
  [
    "transformersModule", "model", "dtype", "device", "styleDim", "frameRate",
    "languages", "dictionaryPath", "voicePath", "voices", "audioSampleRate",
    "deltaStart", "deltaEnd", "trace"
  ].forEach(key => workerInitData[key] = config.tts[key]);

  worker.postMessage({ type: 'connect', data: workerInitData });
}

// 🟢 Export handler function for Vercel
export default async function handler(req, res) {
  // Only handle POST /v1/synthesize
  if (req.method === 'OPTIONS') {
    // CORS preflight
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.statusCode = 200;
    return res.end();
  }

  console.log("req.method = " + req.method);
  console.log("req.url = " + req.url);
  if (req.method !== 'POST' || req.url !== '/api/v1/synthesize') {
    res.statusCode = 404;
    return res.end('Not Found');
  }

  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');

  // Read request body
  let body = '';
  for await (const chunk of req) {
    body += chunk;
  }

  try {
    const data = JSON.parse(body);

    // Validate input
    if (!data.input) {
      res.statusCode = 400;
      return res.end(JSON.stringify({ error: "Missing 'input'" }));
    }

    // Queue task
    const id = ++restId;
    mapRest.set(id, res);

    const message = {
      type: 'synthesize',
      id: id,
      data: {
        input: data.input,
        voice: data.voice || config.tts.defaults.voice,
        language: data.language || config.tts.defaults.language,
        speed: data.speed || config.tts.defaults.speed,
        audioEncoding: data.audioEncoding || config.tts.defaults.audioEncoding
      },
      rest: id
    };

    queue.push(message);

    // Assign to idle worker
    for (let i = 0; i < config.tts.threads; i++) {
      threadId = (threadId + 1) % config.tts.threads;
      if (statuses[threadId] === 0) {
        const task = queue.shift();
        workers[threadId].postMessage(task);
        statuses[threadId] = 1;
        break;
      }
    }
  } catch (err) {
    console.error("Invalid JSON:", err.message);
    res.statusCode = 400;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: err.message }));
  }
}
