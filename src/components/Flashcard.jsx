import { AnimatePresence, motion } from 'framer-motion';
import { BookOpenText, Volume2, Waves } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTTS } from '../hooks/useTTS';
import { usePronunciation } from '../hooks/usePronunciation';
import { htmlToPlainText } from '../utils/cardText';

function getMeaningList(card) {
    if (Array.isArray(card.meanings) && card.meanings.length) {
        return card.meanings.map((meaning) => htmlToPlainText(meaning)).filter(Boolean);
    }

    const fallback = htmlToPlainText(card.cz || '');
    return fallback ? [fallback] : [];
}

function getCardSides(card, lesson) {
    if (lesson.direction === 'en-to-cz') {
        return {
            prompt: htmlToPlainText(card.en || card.cz),
            answer: htmlToPlainText(card.cz || card.en),
            promptLabel: 'Anglicky',
            answerLabel: 'Význam',
            promptLang: 'en-US',
            answerLang: 'cs-CZ',
        };
    }

    return {
        prompt: htmlToPlainText(card.cz || card.en),
        answer: htmlToPlainText(card.en || card.cz),
        promptLabel: 'Česky',
        answerLabel: 'Anglicky',
        promptLang: 'cs-CZ',
        answerLang: 'en-US',
    };
}

export default function Flashcard({ card, lesson, showAnswer }) {
    const [showDetail, setShowDetail] = useState(false);
    const { speak } = useTTS();
    const { prompt, answer, promptLabel, answerLabel, promptLang, answerLang } = getCardSides(card, lesson);
    const meanings = getMeaningList(card);
    const answerText = meanings.length ? meanings.join('. ') : answer;
    const context = htmlToPlainText(card.context);
    const contextCz = htmlToPlainText(card.contextCz);
    const englishTerm = promptLang.startsWith('en') ? prompt : answerLang.startsWith('en') ? answer : '';
    const { pronunciation } = usePronunciation(englishTerm, englishTerm ? 'en' : '');
    const phonetic = htmlToPlainText(card.phonetic || pronunciation || '');
    const hasDetail = Boolean(phonetic || context || contextCz);

    useEffect(() => {
        if (!showAnswer) {
            setShowDetail(false);
        }
    }, [showAnswer, card.id]);

    const handleSpeak = (event, text, lang) => {
        event.stopPropagation();
        speak(text, lang);
    };

    return (
        <motion.article
            key={card.id}
            className={`card-surface ${showAnswer ? 'is-revealed' : ''}`}
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
        >
            <div className="card-surface__chrome">
                <div className="card-surface__eyebrow">
                    <span>{promptLabel}</span>
                    {card.reviewRound ? <em>Návrat {card.reviewRound}</em> : null}
                </div>

                <button
                    type="button"
                    className="icon-button"
                    onClick={(event) => handleSpeak(event, prompt, promptLang)}
                    aria-label="Přehrát výslovnost"
                >
                    <Volume2 size={18} strokeWidth={2.5} />
                </button>
            </div>

            <div className="card-surface__body">
                <motion.h2
                    className="card-surface__word"
                    animate={{ scale: showAnswer ? 0.95 : 1, y: showAnswer ? -4 : 0 }}
                    transition={{ duration: 0.18, ease: 'easeOut' }}
                >
                    {prompt || 'Bez textu'}
                </motion.h2>
                {phonetic && !showAnswer ? <p className="card-surface__phonetic">{phonetic}</p> : null}
            </div>

            <AnimatePresence initial={false}>
                {showAnswer ? (
                    <motion.div
                        className="card-reveal"
                        initial={{ opacity: 0, y: 14 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 14 }}
                        transition={{ duration: 0.2, ease: 'easeOut' }}
                    >
                        <div className="card-reveal__header">
                            <span>{answerLabel}</span>
                            <div className="card-reveal__actions">
                                {hasDetail ? (
                                    <button
                                        type="button"
                                        className={`detail-toggle ${showDetail ? 'is-active' : ''}`}
                                        onClick={(event) => {
                                            event.stopPropagation();
                                            setShowDetail((current) => !current);
                                        }}
                                    >
                                        <BookOpenText size={15} strokeWidth={2.4} />
                                        Detail
                                    </button>
                                ) : null}
                                <button
                                    type="button"
                                    className="icon-button icon-button--soft"
                                    onClick={(event) => handleSpeak(event, answerText, answerLang)}
                                    aria-label="Přehrát odpověď"
                                >
                                    <Volume2 size={16} strokeWidth={2.5} />
                                </button>
                            </div>
                        </div>

                        {meanings.length ? (
                            <ul className="card-meanings">
                                {meanings.map((meaning, index) => (
                                    <li key={`${card.id}-meaning-${index}`}>{meaning}</li>
                                ))}
                            </ul>
                        ) : (
                            <p className="card-reveal__answer">{answer || 'Bez textu'}</p>
                        )}

                        <AnimatePresence initial={false}>
                            {showDetail && hasDetail ? (
                                <motion.div
                                    className="card-detail-sheet"
                                    initial={{ opacity: 0, height: 0, y: 8 }}
                                    animate={{ opacity: 1, height: 'auto', y: 0 }}
                                    exit={{ opacity: 0, height: 0, y: 8 }}
                                    transition={{ duration: 0.2, ease: 'easeOut' }}
                                >
                                    {phonetic ? (
                                        <div className="detail-row">
                                            <div className="detail-row__label">
                                                <Waves size={15} strokeWidth={2.4} />
                                                Výslovnost
                                            </div>
                                            <strong>{phonetic}</strong>
                                        </div>
                                    ) : null}

                                    {context || contextCz ? (
                                        <div className="detail-example">
                                            <div className="detail-row__label">Příklad</div>
                                            {context ? <p>{context}</p> : null}
                                            {contextCz ? <p className="card-context__translation">{contextCz}</p> : null}
                                        </div>
                                    ) : null}
                                </motion.div>
                            ) : null}
                        </AnimatePresence>
                    </motion.div>
                ) : null}
            </AnimatePresence>

            {!showAnswer ? <div className="card-surface__hint">Ťukni pro odhalení</div> : null}
        </motion.article>
    );
}
