import { useState, useEffect, useCallback, useRef } from 'react';
import { htmlToPlainText } from '../utils/cardText';

export function useTTS() {
    const [voicesLoaded, setVoicesLoaded] = useState(false);
    const voicesRef = useRef([]);

    useEffect(() => {
        if (!('speechSynthesis' in window)) {
            return undefined;
        }

        const loadVoices = () => {
            const availableVoices = window.speechSynthesis.getVoices();
            if (availableVoices.length > 0) {
                voicesRef.current = availableVoices;
                setVoicesLoaded(true);
            }
        };

        loadVoices();

        if (typeof window.speechSynthesis.addEventListener === 'function') {
            window.speechSynthesis.addEventListener('voiceschanged', loadVoices);
            return () => {
                window.speechSynthesis.removeEventListener('voiceschanged', loadVoices);
                window.speechSynthesis.cancel();
            };
        }

        window.speechSynthesis.onvoiceschanged = loadVoices;
        return () => {
            window.speechSynthesis.onvoiceschanged = null;
            window.speechSynthesis.cancel();
        };
    }, []);

    const speak = useCallback((htmlText, lang) => {
        const cleanText = htmlToPlainText(htmlText);
        
        if (!cleanText || !('speechSynthesis' in window)) return;

        // 2. Stop any currently playing audio
        window.speechSynthesis.cancel();

        // 3. Configure the utterance with 2026 UX standards for language learning
        const utterance = new SpeechSynthesisUtterance(cleanText);
        utterance.lang = lang;
        utterance.rate = 0.9; // Slightly slower for better pronunciation clarity
        utterance.pitch = 1.0;

        const shortLang = lang.split('-')[0];
        const voices = voicesRef.current;
        
        // 4. Smart voice selection prioritizing premium/enhanced high-quality native voices
        const preferredVoices = voices.filter(v => 
            v.lang.startsWith(shortLang) || 
            v.lang.replace('_', '-').toLowerCase().startsWith(shortLang.toLowerCase())
        );
        
        if (preferredVoices.length > 0) {
            // Sort to prioritize highest quality voices
            preferredVoices.sort((a, b) => {
                const aName = a.name.toLowerCase();
                const bName = b.name.toLowerCase();
                const aIsPremium = aName.includes('premium') || aName.includes('enhanced') || aName.includes('google') || aName.includes('natural');
                const bIsPremium = bName.includes('premium') || bName.includes('enhanced') || bName.includes('google') || bName.includes('natural');
                if (aIsPremium && !bIsPremium) return -1;
                if (!aIsPremium && bIsPremium) return 1;
                return 0;
            });
            utterance.voice = preferredVoices[0];
        }

        window.speechSynthesis.speak(utterance);
    }, []);

    return { speak, voicesLoaded };
}
