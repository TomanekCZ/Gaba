import { useEffect, useState } from 'react';

const CACHE_STORAGE_KEY = 'gaba-pronunciation-cache-v1';
const MAX_CACHE_ENTRIES = 2000;

function loadCache() {
    try {
        const raw = localStorage.getItem(CACHE_STORAGE_KEY);
        if (!raw) {
            return {};
        }

        const parsed = JSON.parse(raw);
        return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
    } catch (error) {
        console.warn('Failed to load pronunciation cache:', error);
        return {};
    }
}

function persistCache(cache) {
    try {
        const entries = Object.entries(cache);
        const trimmedEntries = entries.slice(-MAX_CACHE_ENTRIES);
        localStorage.setItem(CACHE_STORAGE_KEY, JSON.stringify(Object.fromEntries(trimmedEntries)));
    } catch (error) {
        console.warn('Failed to save pronunciation cache:', error);
    }
}

function normalizeTerm(term) {
    return String(term || '')
        .toLowerCase()
        .replace(/<[^>]*>/g, ' ')
        .replace(/[^\p{L}\p{N}'\-\s]/gu, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function pickPhonetic(data) {
    if (!Array.isArray(data) || !data.length) {
        return '';
    }

    const firstEntry = data[0];
    const phonetics = Array.isArray(firstEntry?.phonetics) ? firstEntry.phonetics : [];

    const preferred = phonetics.find((item) => item?.text && String(item.text).trim());
    if (preferred?.text) {
        return String(preferred.text).trim();
    }

    if (firstEntry?.phonetic && String(firstEntry.phonetic).trim()) {
        return String(firstEntry.phonetic).trim();
    }

    return '';
}

export function usePronunciation(term, language = 'en') {
    const [pronunciation, setPronunciation] = useState('');
    const [status, setStatus] = useState('idle');

    useEffect(() => {
        if (!term || language !== 'en') {
            setPronunciation('');
            setStatus('idle');
            return;
        }

        const normalized = normalizeTerm(term);
        if (!normalized) {
            setPronunciation('');
            setStatus('idle');
            return;
        }

        const cache = loadCache();
        if (typeof cache[normalized] === 'string') {
            setPronunciation(cache[normalized]);
            setStatus(cache[normalized] ? 'ready' : 'empty');
            return;
        }

        const controller = new AbortController();
        setStatus('loading');

        fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(normalized)}`, {
            signal: controller.signal,
        })
            .then((response) => (response.ok ? response.json() : null))
            .then((json) => {
                const found = pickPhonetic(json);
                const nextCache = {
                    ...cache,
                    [normalized]: found || '',
                };
                persistCache(nextCache);
                setPronunciation(found);
                setStatus(found ? 'ready' : 'empty');
            })
            .catch((error) => {
                if (error?.name === 'AbortError') {
                    return;
                }
                setPronunciation('');
                setStatus('error');
            });

        return () => {
            controller.abort();
        };
    }, [term, language]);

    return { pronunciation, status };
}
