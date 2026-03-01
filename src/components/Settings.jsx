import { BarChart3, Download, ShieldCheck, Trash2 } from 'lucide-react';

export default function Settings({
    progress,
    onResetProgress,
    theme,
    setTheme,
    canInstall,
    isInstalled,
    isIos,
    onInstall,
}) {
    const stats = progress.cardStats || {};
    const statsArray = Object.values(stats);
    const mastered = statsArray.filter((item) => item.lastRating === 'good' || item.lastRating === 'easy').length;
    const learning = statsArray.length - mastered;

    const handleReset = () => {
        if (window.confirm('Opravdu chceš smazat celý postup? Tuto akci nejde vrátit.')) {
            onResetProgress();
        }
    };

    return (
        <section className="settings-screen">
            <article className="surface-card settings-card">
                <header className="settings-card__header">
                    <div className="settings-card__icon">
                        <BarChart3 size={19} strokeWidth={2.4} />
                    </div>
                    <h2>Statistiky</h2>
                </header>

                <div className="settings-grid">
                    <div className="settings-stat">
                        <span>Celkem slov</span>
                        <strong>{statsArray.length}</strong>
                    </div>
                    <div className="settings-stat">
                        <span>Zvládnuto</span>
                        <strong>{mastered}</strong>
                    </div>
                    <div className="settings-stat">
                        <span>V procesu</span>
                        <strong>{learning}</strong>
                    </div>
                    <div className="settings-stat">
                        <span>Sessions</span>
                        <strong>{progress.sessionsCompleted || 0}</strong>
                    </div>
                </div>
            </article>

            <article className="surface-card settings-card">
                <header className="settings-card__header">
                    <div className="settings-card__icon">
                        <Download size={19} strokeWidth={2.4} />
                    </div>
                    <h2>Aplikace</h2>
                </header>

                <div className="settings-row">
                    <div>
                        <strong>Motiv</strong>
                        <p>Světlý, tmavý nebo automatický.</p>
                    </div>
                    <div className="theme-switch">
                        {[
                            { id: 'light', label: 'Světlý' },
                            { id: 'dark', label: 'Tmavý' },
                            { id: 'system', label: 'Auto' },
                        ].map((item) => (
                            <button
                                key={item.id}
                                type="button"
                                className={`theme-switch__item ${theme === item.id ? 'is-active' : ''}`}
                                onClick={() => setTheme(item.id)}
                            >
                                {item.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="settings-row">
                    <div>
                        <strong>Instalace PWA</strong>
                        <p>
                            {isInstalled
                                ? 'Aplikace je nainstalovaná.'
                                : canInstall
                                    ? 'Aplikaci můžeš nainstalovat na plochu.'
                                    : isIos
                                        ? 'Na iPadu/iPhonu použij Sdílet → Přidat na plochu.'
                                        : 'Po dalších návštěvách se zobrazí možnost instalace.'}
                        </p>
                    </div>
                    <button
                        type="button"
                        className="button button--secondary settings-install"
                        onClick={onInstall}
                        disabled={!canInstall || isInstalled}
                    >
                        <Download size={16} strokeWidth={2.4} />
                        {isInstalled ? 'Nainstalováno' : 'Instalovat'}
                    </button>
                </div>
            </article>

            <article className="surface-card settings-card settings-card--danger">
                <header className="settings-card__header">
                    <div className="settings-card__icon settings-card__icon--danger">
                        <ShieldCheck size={19} strokeWidth={2.4} />
                    </div>
                    <h2>Správa dat</h2>
                </header>

                <div className="danger-box">
                    <p>Reset smaže historii odpovědí, sílu naučení slov i aktuální streak.</p>
                    <button type="button" className="danger-button" onClick={handleReset}>
                        <Trash2 size={15} strokeWidth={2.5} />
                        Smazat všechna data
                    </button>
                </div>
            </article>
        </section>
    );
}
