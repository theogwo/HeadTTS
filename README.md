# HeadTTS

> [!IMPORTANT]
> This project is **UNDER CONSTRUCTION** and not yet fully tested.
Specifications and used technologies and libraries may change without notice.

**HeadTTS** is an JavaScript text-to-speech (TTS) solution
that provides word-level timestamps and visemes as well as the audio.
Inference can run entirely in a browser (via WebGPU/WASM), or alternatively
on a Node.js WebSocket/RESTful server (CPU-based).

- **Pros**: Free. Doesn't require a server. WebGPU support.
Uses neural voices with
[Kokoro](https://huggingface.co/onnx-community/Kokoro-82M-v1.0-ONNX-timestamped)
TTS model. Fully compatible with the
[TalkingHead](https://github.com/met4citizen/TalkingHead) project.
MIT licensed, doesn't use eSpeak NG or any other GPL-licensed
module.

- **Cons**: WebGPU is only supported by default in Chrome and Edge
desktop browsers. No WebGPU support in Node.js yet, so inference on
server (CPU) is rather slow. English is currently the only supported language.

If you're using a Chrome or Edge desktop browser, check out the
in-browser [DEMO](https://met4citizen.github.io/HeadTTS/)!

The project uses [websockets/ws](https://github.com/websockets/ws) (MIT License),
[hugginface/transformers.js](https://github.com/huggingface/transformers.js/)
(Apache 2.0 License) and
[onnx-community/Kokoro-82M-v1.0-ONNX-timestamped](https://huggingface.co/onnx-community/Kokoro-82M-v1.0-ONNX-timestamped)
(Apache 2.0 License) as runtime dependencies. For information on
language modules and dictionaries, see Appendix B. Using
[jest](https://jestjs.io) for testing.

---

# JS Browser Module: `headtts.mjs`

The HeadTTS JavaScript module enables in-browser text-to-speech
using Module Web Workers and WebGPU/WASM inference. Alternatively, it can
connect to and use the HeadTTS Node.js WebSocket/RESTful server.

## Create instance and connect

```javascript
import { HeadTTS } from "./modules/headtts.mjs";

const headtts = new HeadTTS({
  endpoints: ["ws://127.0.0.1:8882", "webgpu"], // Endpoints in order of priority
  languages: ['en-us'], // Language modules to pre-load (in-browser)
  voices: ["af_bella", "am_fenrir"] // Voices to pre-load (in-browser)
});

try {
  await headtts.connect();
} catch(error) {
  console.error(error);
}
```

Available options for the constructor and `connect`:

Name | Description | Default value
--- | --- | ---
`endpoints` | List of WebSocket/RESTful servers or backends `webgpu` or `wasm`, in order of priority. If one fails, the next is used.  | `["webgpu",`<br>` "wasm"]`
`audioCtx` | Audio context for creating audio buffers. If `null`, a new one is created. | `null`
`transformersModule` | URL of the `transformers.js` module to load. | `"https://cdn.jsdelivr.net/npm/`<br>`@huggingface/transformers@3.4.2`<br>`/dist/transformers.min.js"`
`model` | Kokoro text-to-speech ONNX model (timestamped) used for in-browser inference. | `"onnx-community/`<br>`Kokoro-82M-v1.0-ONNX-timestamped"`
`dtypeWebgpu` | Data type precision for WebGPU inference: `"fp32"` (recommended), `"fp16"`, `"q8"`, `"q4"`, or `"q4f16"`.  | `"fp32"`
`dtypeWasm` | Data type precision for WASM inference: `"fp32"`, `"fp16"`, `"q8"`, `"q4"`, or `"q4f16"`. | `"q4"`
`styleDim` | Style embedding dimension for inference. | `256`
`audioSampleRate` | Audio sample rate in Hz for inference. | `24000`
`frameRate` | Frame rate in FPS for inference. | `40`
`languages` | Language modules to be pre-loaded. | [`"en-us"`]
`dictionaryURL` | URL to language dictionaries. Set to `null` to disable dictionaries. | `"../dictionaries"`
`voiceURL` | URL for loading voices. | `"https://huggingface.co/`<br>`onnx-community/`<br>`Kokoro-82M-v1.0-ONNX/`<br>`resolve/main/voices"`
`voices` | Voices to preload (e.g., `["af_bella", "am_fenrir"]`).  | `[]`
`splitSentences` | Whether to split text into sentences. | `true`
`splitLength` | Maximum length (in characters) of each text chunk. | `500`
`deltaStart` | Adjustment (in ms) to viseme start times. | `-10`
`deltaEnd` | Adjustment (in ms) to viseme end times. | `10`
`defaultVoice` | Default voice to use. | `"af_bella"`
`defaultLanguage` | Default language to use. | `"en-us"`
`defaultSpeed` | Speaking speed. Range: 0.25–4. | `1`
`defaultAudioEncoding` | Default audio format: `"wav"` or `"pcm"` (PCM 16-bit LE). | `"wav"`
`trace` | Bitmask for debugging subsystems (`0`=none, `255`=all):<br><ul><li>Bit 0 (1): Connection</li><li>Bit 1 (2): Messages</li><li>Bit 2 (4): Events</li><li>Bit 3 (8): G2P</li><li>Bit 4 (16): Language modules</li></ul> | `0`

Note: Model related options apply only to browser-based inference.
If inference is performed on a server, server-specific
settings will apply instead.

## Events

Event handler | Description
--- | ---
`onstart` | Triggered when the first message is added and all message queues were previously empty.
`onmessage` | Handles incoming messages of type `audio` or `error`. For details, see the API section.
`onend` | Triggered when all message queues become empty.
`onerror` | Handles system or class-level errors. If this handler is not set, such errors are thrown as exceptions. **Note:** Errors related to TTS conversion are sent to the `onmessage` handler (if defined) as messages of type `error`.

An example of using the `onmessage` event handler with the
[TalkingHead](https://github.com/met4citizen/TalkingHead) instance `head`.

```javascript
// Speak and lipsync
headtts.onmessage = (message) => {
  if ( message.type === "audio" ) {
    try {
      head.speakAudio( message.data, {}, (word) => {
        console.log(word);
      });
    } catch(error) {
      console.log(error);
    }
  } else if ( message.type === "error" ) {
    console.error("Received error message, error=", message.data.error);
  }
}
```

## Synthesize speech

Setup the used voice:

```javascript
headtts.setup({
  voice: "af_bella",
  language: "en-us",
  speed: 1,
  audioEncoding: "wav"
});
```

Synthesize speech:

```javascript
headtts.synthesize({
  input: "Test sentence."
});
```

Using events with `synthesize` is often the best approach
for real-time use cases. However, you can alternatively
use `await` to wait for all the related audio messages to arrive:

```javascript
try {
  const messages = await headtts.synthesize({
    input: "Some long text..."
  });
  console.log(messages); // [{type: 'audio', data: {…}, ref: 1}, {…}, ...]
} catch(error) {
  console.error(error);
}
```

## JS Class Methods

Method | Description
--- | ---
`connect( settings=null, onprogress=null, onerror=null )` | Connects to the specified set of `endpoints` set in constructor or within the optinal `settings` object. If the `settings` parameter is provided, it forces a reconnection. The `onprogress` callback handles `ProgressEvent` events, while the `onerror` callback handles system-level error events. Returns a promise. **Note:** When connecting to a RESTful server, the method sends a hello message and considers the connection established only if a text response starting with `HeadTTS` is received.
`clear()` | Clears all work queues and resolves all promises.
`setup( data, onerror=null )` | Adds a new setup request to the work queue. See the API section for the supported `data` properties. Returns a promise.
`synthesize( data, onmessage=null, onerror=null )` | Adds a new synthesize request to the work queue. If event handlers are provided, they override other handlers. See the API section for supported `data` properties. Returns a promise that resolves with a sorted array of related `audio` or `error` messages.

---

# NodeJS WebSocket/RESTful Server: `headtts-node.mjs`

## Install

The HeadTTS project is not yet added to NPM, so use git clone
and install:

```bash
git clone https://github.com/met4citizen/HeadTTS
cd HeadTTS
npm install
```

## Start server

```bash
node ./modules/headtts-node.mjs
```

Command line options:

Option|Description|Default
---|---|---
`--config [file]` | JSON configuration file name. | `./headtts-node.json`
`--trace [0-255]` | Bitmask for debugging subsystems (`0`=none, `255`=all):<br><ul><li>Bit 0 (1): Connection</li><li>Bit 1 (2): Messages</li><li>Bit 2 (4): Events</li><li>Bit 3 (8): G2P</li><li>Bit 4 (16): Language modules</li></ul> | `0`

JSON configuration file properties:

Property|Description|Default
---|---|---
`server.port` | The port number the server listens on. | `8882`
`server.certFile` | Path to the certificate file. | `null`
`server.keyFile` | Path to the certificate key file. | `null`
`server.websocket` | Enable the WebSocket server. | `true`
`server.rest` | Enable the RESTful API server. | `true`
`server.connectionTimeout` | Timeout duration for idle connections in milliseconds. | `20000`
`server.corsOrigin` | Value for the `Access-Control-Allow-Origin` header. If `null`, CORS will not be enabled. | `*`
`tts.threads` | Number of text-to-speech worker threads, ranging from 1 to the number of CPU cores. | `1`
`tts.transformersModule` | Name of the transformers.js module to use. | `"@huggingface/transformers"`
`tts.model` | The timestamped Kokoro TTS ONNX model. | `"onnx-community/`<br>`Kokoro-82M-v1.0-ONNX-timestamped"`
`tts.dtype` | The data type precision used for inference. Available options: `"fp32"`, `"fp16"`, `"q8"`, `"q4"`, or `"q4f16"`.  | `"fp32"`
`tts.device` | Computation backend to use. Currently, the only available option for Node.js server is `"cpu"`.  | `"cpu"`
`tts.styleDim` | The embedding dimension for style. | `256`
`tts.audioSampleRate` | Audio sample rate in Hertz (Hz). | `24000`
`tts.frameRate` | Frame rate in frames per second (FPS). | `40`
`tts.languages` | A list of languages to preload. | [`"en-us"`]
`tts.dictionaryPath` | Path to the language modules. If `null`, dictionaries will not be used. | `"./dictionaries"`
`tts.voicePath` | Path to the voice files. | `"./voices"`
`tts.voices` | Array of voices to preload, e.g., `["af_bella","am_fenrir"]`. | `[]`
`tts.deltaStart` | Adjustment (in ms) to viseme start times. | `-10`
`tts.deltaEnd` | Adjustment (in ms) to viseme end times. | `10`
`tts.defaults.voice` | Default voice to use. | `"af_bella"`
`tts.defaults.language` | Default language to use. Supported options: `"en-us"`. | `"en-us"`
`tts.defaults.speed` | Speaking speed. Range: 0.25–4. | `1`
`tts.defaults.audioEncoding` | Default audio encoding format. Supported options are `"wav"` and `"pcm"` (PCM 16bit LE). | `"wav"`
`trace` | Bitmask for debugging subsystems (`0`=none, `255`=all):<br><ul><li>Bit 0 (1): Connection</li><li>Bit 1 (2): Messages</li><li>Bit 2 (4): Events</li><li>Bit 3 (8): G2P</li><li>Bit 4 (16): Language modules</li></ul>  | `0`

---

# Appendix A: Server API reference

## WebSocket API

> [!NOTE]  
> Every WebSocket request must have a unique identifier, `id`. The server uses
a Web Worker thread pool, and because work is done in parallel,
the order of responses may vary. Therefore, each response includes
a `ref` property that identifies the original request, allowing
the order to be restored if necessary. The JS client class handles this
automatically.

### Request: `setup`

```javascript
{
  type: "setup",
  id: 12, // Unique request identifier.
  data: {
    voice: "af_bella", // Voice name (optional)
    language: "en-us", // Language (optional)
    speed: 1, // Speed (optional)
    audioEncoding: 'wav' // "wav" or "pcm" (PCM 16bit LE) (optional)
  }
}
```

### Request: `synthesize`

```javascript
{
  type: "synthesize",
  id: 13, // Unique request identifier.
  data: {
    input: "This is an example."
  }
}
```

*TODO: Add support for other data formats.*

The response message for `synthesize` request is either `error` or `audio`.

### Response: `error`

```javascript
{
  type: "error",
  ref: 13, // Original request id
  data: {
    error: "Error loading voice 'af_bella'."
  }
}
```

### Response: `audio`

Returns an audio object metadata that can be passed on the TalkingHead
`speakAudio` method once the audio content itself has been added.

```javascript
{
  type: "audio",
  ref: 13,
  data: {
    words: ["This ","is ","an ","example."],
    wtimes: [443, 678, 780, 864],
    wdurations: [192 ,91 ,52 ,868],
    visemes: ["TH", "I", "SS", "I", "SS", "aa", "nn", "SS", "aa", "PP", "PP", "E", "DD"],
    vtimes: [443, 494, 550, 678, 729, 780, 801, 989, 1126, 1175, 1225, 1275, 1354],
    vdurations: [61, 66, 85, 61, 40, 31, 31, 69, 59, 60, 60, 89, 378],
    audioEncoding: "wav"
  }
}
```

The actual audio content will be delivered after this message as
binary data (see the next response message).

### Response: Binary (ArrayBuffer)

Binary data as an [ArrayBuffer](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/ArrayBuffer)
related to the previous `audio` message. Depending on the set audio encoding,
either a WAV file (`wav`) or a chunk of raw PCM 16bit LE samples (`pcm`).

## RESTful API

RESTful server API is a more simple alternative for WebSocket API.

### POST `/v1/synthesize`

JSON | Description
---|---
`input` | Input to synthesize. For a string of text, maximum 500 characters.
`voice` | Voice name.
`language` | Language code.
`speed` | Speed of speech.
`audioEncoding` | Either "wav" for WAV file or "pcm" for raw PCM 16bit LE audio.

OK response:

JSON|Description
---|---
`audio` | AudioBuffer for `"wav"` audio encoding, ArrayBuffer of raw PCM 16bit LE samples for `"pcm"` audio encoding.
`words` | Array of words.
`wtimes` | Array of word starting times for `words` in milliseconds.
`wdurations` | Array of word durations for `words` in milliseconds.
`visemes` | Array of Oculus viseme IDs: `'aa'`, `'E'`, `'I'`, `'O'`, `'U'`, `'PP'`, `'SS'`, `'TH'`, `'CH'`, `'FF'`, `'kk'`, `'nn'`, `'RR'`, `'DD'`, `'sil'`.
`vtimes` | Array of viseme starting times for `visemes` in milliseconds.
`vdurations` | Array of viseme durations for `visemes` in milliseconds.
`audioEncoding` | Audio encoding: `"wav"` or `"pcm"`.

Error response:

JSON|Description
---|---
`error` | Error message string

---

# Appendix B: Language modules and dictionaries

### American English, `en-us`

The American English language module is based on the
[CMU Pronunciation Dictionary](http://www.speech.cs.cmu.edu/cgi-bin/cmudict)
from Carnegie Mellon University, containing over 134,000 words and their
pronunciations. The original dataset is provided under a simplified
BSD license, allowing free use for any research or commercial purpose.

In the [Kokoro](https://github.com/hexgrad/kokoro) TTS model,
the American English language data was trained using the
[Misaki](https://github.com/hexgrad/misaki) G2P engine (en).
Therefore, the original [ARPAbet](https://en.wikipedia.org/wiki/ARPABET)
phonemes in the CMU dictionary have been converted to
[IPA](https://en.wikipedia.org/wiki/International_Phonetic_Alphabet)
and then to Misaki-compatible phonemes by applying the following mapping:

- `ɚ` → [ `ɜ`, `ɹ` ], `ˈɝ` → [ `ˈɜ`, `ɹ` ], `ˌɝ` → [ `ˌɜ`, `ɹ` ]
- `tʃ` → [ `ʧ` ], `dʒ` → [ `ʤ` ]
- `eɪ` → [ `A` ], `ˈeɪ` → [ `ˈA` ], `ˌeɪ` → [ `ˌA` ]
- `aɪ` → [ `I` ], `ˈaɪ` → [ `ˈI` ], `ˌaɪ` → [ `ˌI` ]
- `aʊ` → [ `W` ], `ˈaʊ` → [ `ˈW` ], `ˌaʊ` → [ `ˌW` ]
- `ɔɪ` → [ `Y` ], `ˈɔɪ` → [ `ˈY` ], `ˌɔɪ` → [ `ˌY` ]
- `oʊ` → [ `O` ], `ˈoʊ` → [ `ˈO` ], `ˌoʊ` → [ `ˌO` ]
- `əʊ` → [ `Q` ], `ˈəʊ` → [ `ˈQ` ], `ˌəʊ` → [ `ˌQ` ]

Note: During the dataset conversion, some vowels were reduced to reflect
casual speech since HeadTTS is primarily designed for conversational use.

The final dictionary is a plain text file with around 125,000 lines (2,8MB).
Lines starting with `;;;` are comments. Each other line represents
one word and its pronunciations. The word and its different possible
pronunciations are separated by a tab character `\t`.

```text
MERCHANDISE	mˈɜɹʧəndˌIz
```

Out-of-dictionary (OOD) words are converted using a rule-based algorithm based
on NRL Report 7948, *Automatic Translation of English Text to Phonetics
by Means of Letter-to-Sound Rules* (Elovitz et al., 1976). The report is
available [here](https://apps.dtic.mil/sti/pdfs/ADA021929.pdf).

You can find the list of supported English voices and samples
[here](https://huggingface.co/onnx-community/Kokoro-82M-v1.0-ONNX-timestamped#voicessamples).


### Finnish, `fi`

> [!IMPORTANT]  
> Finnish language is not officially supported as the Kokoro model
doesn't support it.

The phonemization of the Finnish language module is done by
an in-built algorithm. The algorithm doesn't require a pronunciation
dictionary, but it uses a compound word dictionary to get the secondary
stress marks right for compound words.

The dictionary used for compound words is based on
[The Dictionary of Contemporary Finnish](https://en.kotus.fi/dictionaries/#Dictionary-of-Contemporary-Finnish)
maintained by the Institute for the Languages of Finland. The original
dataset contains more than 100,000 entries and is open-sourced
under the CC BY 4.0 license.

The pre-processed compound word dictionary is a plain text file with
around 50,000 entries in 10,000 lines (~350kB). Lines starting
with `;;;` are comments. Each other line represents the first part
of a compound word and the first four letters of all possible
next words, all separated by a tab character `\t`.

```text
ALUMIINI	FOLI	KATT	OKSI	PAPE	SEOS	VENE	VUOK
```

As of now, the Kokoro model doesn't offer Finnish voices. You can use
the `fi` language code with the voices of other languages, but
the pronunciation will sound rather weird.

---

# Appendix C: Latency

**Summary for HeadTTS:** In-browser TTS on WebGPU is 3x times faster than
real-time and approximately 10x faster than WASM. CPU inference on
a Node.js server performs surprisingly well, but increasing the thread
pool size worsens performance, so we need to wait for WebGPU support.
Quantization makes no significant difference, so I recommend using 32-bit
floating point precision (fp32) for the best audio quality unless
memory consumption becomes a concern.

Unofficial latency results using my own test app:

TTS Engine | Setup |`FIL`|`FBL`|`RTF`
---|---|---|---|---
HeadTTS, in-browser | Chrome, WebGPU/fp32 | 9.4s | 958ms | 0.30
HeadTTS, in-browser | Edge, WebGPU/fp32 | 8.7s | 913ms | 0.28
HeadTTS, in-browser | Chrome, WASM/q4 | 88.4s | 8752ms | 2.87
HeadTTS, in-browser | Edge, WASM/q4 | 44.8s | 4437ms | 1.46
HeadTTS, server | WebSocket, CPU/fp32, 1 thread | 6.8s | 712ms | 0.22
HeadTTS, server | WebSocket, CPU/fp32, 4 threads | 6.0s | 2341ms | 0.20
HeadTTS, server | REST, CPU/fp32, 1 thread | 7.0s | 793ms | 0.23
HeadTTS, server | REST, CPU/fp32, 4 threads | 6.5s | 2638ms | 0.21
ElevenLabs | WebSocket | 4.8s | 977ms | 0.20
ElevenLabs | REST | 11.3s | 1097ms | 0.46
ElevenLabs | REST, Flash_v2_5 | 4.8s | 581ms | 0.22
Microsoft Azure TTS | Speech SDK, WebSocket | 1.1s | 274ms | 0.04
Google TTS | REST | 0.79s | 67ms | 0.03


`FIL`: *Finish latency*. Total time from sending text input to receiving
the full audio.

`FBL`: *First byte/part/sentence latency*. Time from sending the text input
to receiving the first playable byte/part/sentence of audio.
Note: This measure is not comparable across all models, since some
solutions use streaming, some not.

`RTF`: *Real-time factor* = Time to generate full audio / Duration of the full
audio. If RTF < 1, synthesis is faster than real-time (i.e., good).

All test cases use WAV or raw PCM 16bit LE format and the "List 1" of the
[Harvard Sentences](https://www.cs.columbia.edu/~hgs/audio/harvard.html):

```text
The birch canoe slid on the smooth planks.
Glue the sheet to the dark blue background.
It's easy to tell the depth of a well.
These days a chicken leg is a rare dish.
Rice is often served in round bowls.
The juice of lemons makes fine punch.
The box was thrown beside the parked truck.
The hogs were fed chopped corn and garbage.
Four hours of steady work faced us.
A large size in stockings is hard to sell.
```

**Test setup**: Macbook Air M2 laptop, 8 cores, 16GB memory,
macOS Sequoia 15.3.2, Metal2 GPU 10 cores, 300 Mbit/s internet connection.
The latest Google Chrome/Edge desktop browsers.
