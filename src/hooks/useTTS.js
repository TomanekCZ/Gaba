import { useState, useCallback, useRef, useEffect } from 'react';
import { htmlToPlainText } from '../utils/cardText';

/**
 * Multi-strategy TTS hook — prioritized:
 * 1. ElevenLabs API (premium quality, multilingual)
 * 2. Web Speech API (native fallback, offline)
 * 3. Google Translate TTS (last resort)
 *
 * Audio is cached in memory to avoid repeat API calls.
 */

const ELEVENLABS_API_KEY = 'sk_f1a295ed724ec09706b8dbbb0b183c0a646e236cf30ced01';
const ELEVENLABS_URL = 'https://api.elevenlabs.io/v1/text-to-speech';

// ElevenLabs voice IDs — multilingual voices that handle both EN and CZ
const ELEVENLABS_VOICES = {
  'en': 'EXAVITQu4vr4xnSDxMaL',     // Sarah — clear, warm English female
  'en-US': 'EXAVITQu4vr4xnSDxMaL',
  'en-GB': 'pFZP5JQG7iQjIQuC4Bku',   // Lily — British English female
  'cs': 'EXAVITQu4vr4xnSDxMaL',      // Sarah with multilingual_v2 handles Czech
  'cs-CZ': 'EXAVITQu4vr4xnSDxMaL',
  'cz': 'EXAVITQu4vr4xnSDxMaL',
};

const LANG_MAP = {
  'en': 'en-US',
  'en-US': 'en-US',
  'en-GB': 'en-GB',
  'cs': 'cs-CZ',
  'cz': 'cs-CZ',
  'cs-CZ': 'cs-CZ',
};

const GOOGLE_TTS_URL = 'https://translate.google.com/translate_tts';
const GOOGLE_TTS_LANG = {
  'en-US': 'en',
  'en-GB': 'en-GB',
  'cs-CZ': 'cs',
};

// ─── Audio Cache (in-memory for session) ───
const audioCache = new Map();
const MAX_CACHE = 500;

function getCacheKey(text, lang) {
  return `${lang}:${text.toLowerCase().trim()}`;
}

function cacheAudio(key, blob) {
  if (audioCache.size >= MAX_CACHE) {
    // Remove oldest entry
    const firstKey = audioCache.keys().next().value;
    audioCache.delete(firstKey);
  }
  audioCache.set(key, blob);
}

// ─── ElevenLabs TTS ───
async function speakWithElevenLabs(text, langCode) {
  const voiceId = ELEVENLABS_VOICES[langCode] || ELEVENLABS_VOICES['en'];
  const cacheKey = getCacheKey(text, `el-${langCode}`);

  // Check cache first
  if (audioCache.has(cacheKey)) {
    const audio = new Audio(URL.createObjectURL(audioCache.get(cacheKey)));
    await new Promise((resolve, reject) => {
      audio.onended = resolve;
      audio.onerror = reject;
      audio.play().catch(reject);
    });
    return 'done';
  }

  const response = await fetch(`${ELEVENLABS_URL}/${voiceId}`, {
    method: 'POST',
    headers: {
      'xi-api-key': ELEVENLABS_API_KEY,
      'Content-Type': 'application/json',
      'Accept': 'audio/mpeg',
    },
    body: JSON.stringify({
      text,
      model_id: 'eleven_multilingual_v2',
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.75,
        style: 0.0,
        use_speaker_boost: true,
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`ElevenLabs API error: ${response.status}`);
  }

  const blob = await response.blob();
  cacheAudio(cacheKey, blob);

  const audio = new Audio(URL.createObjectURL(blob));
  await new Promise((resolve, reject) => {
    audio.onended = resolve;
    audio.onerror = reject;
    audio.play().catch(reject);
  });

  return 'done';
}

// ─── Web Speech API (fallback) ───
const VOICE_PREFERENCES = {
  'en-US': [/samantha/i, /karen/i, /google.*us/i, /microsoft.*aria/i, /en.*us/i, /english/i],
  'en-GB': [/daniel/i, /google.*uk/i, /en.*gb/i, /british/i],
  'cs-CZ': [/zuzana/i, /iveta/i, /google.*čeština/i, /czech/i, /cs/i],
};

let cachedVoices = null;

function loadVoices() {
  if (cachedVoices?.length > 0) return Promise.resolve(cachedVoices);
  return new Promise((resolve) => {
    const synth = window.speechSynthesis;
    if (!synth) { resolve([]); return; }
    const check = () => {
      const voices = synth.getVoices();
      if (voices.length > 0) { cachedVoices = voices; resolve(voices); return true; }
      return false;
    };
    if (check()) return;
    synth.addEventListener('voiceschanged', () => check(), { once: true });
    setTimeout(() => { if (!check()) resolve([]); }, 1500);
  });
}

function findBestVoice(voices, langCode) {
  const prefs = VOICE_PREFERENCES[langCode] || [];
  const langVoices = voices.filter(v =>
    v.lang === langCode || v.lang.replace('_', '-') === langCode || v.lang.startsWith(langCode.split('-')[0])
  );
  if (!langVoices.length) return null;
  for (const p of prefs) { const m = langVoices.find(v => p.test(v.name)); if (m) return m; }
  return langVoices.find(v => v.localService) || langVoices[0];
}

function speakWithWebAPI(text, langCode) {
  return new Promise(async (resolve, reject) => {
    const synth = window.speechSynthesis;
    if (!synth) { reject(new Error('No speech synthesis')); return; }
    const voices = await loadVoices();
    const voice = findBestVoice(voices, langCode);
    if (!voice) { reject(new Error(`No voice for ${langCode}`)); return; }
    synth.cancel();
    const utt = new SpeechSynthesisUtterance(text);
    utt.voice = voice;
    utt.lang = langCode;
    utt.rate = langCode.startsWith('cs') ? 0.9 : 0.92;
    utt.pitch = 1.0;
    utt.volume = 1.0;
    const timer = setInterval(() => {
      if (!synth.speaking) clearInterval(timer);
      else { synth.pause(); synth.resume(); }
    }, 10000);
    utt.onend = () => { clearInterval(timer); resolve('done'); };
    utt.onerror = (e) => {
      clearInterval(timer);
      (e.error === 'canceled' || e.error === 'interrupted') ? resolve('canceled') : reject(e);
    };
    synth.speak(utt);
  });
}

// ─── Google TTS (last resort) ───
function speakWithGoogleTTS(text, langCode) {
  return new Promise((resolve, reject) => {
    const gl = GOOGLE_TTS_LANG[langCode] || langCode.split('-')[0] || 'en';
    const audio = new Audio(`${GOOGLE_TTS_URL}?ie=UTF-8&tl=${gl}&client=tw-ob&q=${encodeURIComponent(text)}`);
    audio.onended = () => resolve('done');
    audio.onerror = reject;
    audio.play().catch(reject);
  });
}

// ─── Main Hook ───
export function useTTS() {
  const [speaking, setSpeaking] = useState(false);
  const [voicesReady, setVoicesReady] = useState(false);
  const cancelRef = useRef(false);
  const audioRef = useRef(null);

  useEffect(() => {
    loadVoices().then((v) => setVoicesReady(v.length > 0));
  }, []);

  const stop = useCallback(() => {
    cancelRef.current = true;
    setSpeaking(false);
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
  }, []);

  const speak = useCallback(async (htmlText, lang) => {
    const text = htmlToPlainText(htmlText);
    if (!text) return;
    const langCode = LANG_MAP[lang] || 'en-US';

    stop();
    cancelRef.current = false;
    setSpeaking(true);

    try {
      // Strategy 1: ElevenLabs (best quality)
      await speakWithElevenLabs(text, langCode);
    } catch (e1) {
      if (cancelRef.current) return;
      console.warn('ElevenLabs failed, trying Web Speech API:', e1.message);
      try {
        // Strategy 2: Web Speech API
        await speakWithWebAPI(text, langCode);
      } catch (e2) {
        if (cancelRef.current) return;
        console.warn('Web Speech failed, trying Google TTS:', e2.message);
        try {
          // Strategy 3: Google TTS
          await speakWithGoogleTTS(text, langCode);
        } catch (e3) {
          console.warn('All TTS engines failed:', e3);
        }
      }
    } finally {
      if (!cancelRef.current) setSpeaking(false);
    }
  }, [stop]);

  return { speak, stop, speaking, voicesReady };
}
