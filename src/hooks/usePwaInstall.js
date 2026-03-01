import { useCallback, useEffect, useMemo, useState } from 'react';

export function usePwaInstall() {
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [isInstalled, setIsInstalled] = useState(() =>
        typeof window !== 'undefined'
            ? window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true
            : false
    );

    useEffect(() => {
        const handleBeforeInstallPrompt = (event) => {
            setDeferredPrompt(event);
        };

        const handleInstalled = () => {
            setDeferredPrompt(null);
            setIsInstalled(true);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        window.addEventListener('appinstalled', handleInstalled);

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
            window.removeEventListener('appinstalled', handleInstalled);
        };
    }, []);

    const install = useCallback(async () => {
        if (!deferredPrompt) {
            return false;
        }

        deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        setDeferredPrompt(null);
        return choice?.outcome === 'accepted';
    }, [deferredPrompt]);

    const isIos = useMemo(() => {
        if (typeof window === 'undefined') {
            return false;
        }

        return /iphone|ipad|ipod/i.test(window.navigator.userAgent);
    }, []);

    return {
        canInstall: Boolean(deferredPrompt),
        isInstalled,
        isIos,
        install,
    };
}
