/**
 * Client-side security monitoring utility
 */
import { reportThreat } from './apiClient';

let clickCount = 0;
let lastClickTime = Date.now();
const SPAM_THRESHOLD = 10; // clicks per second
const SPAM_RESET_TIME = 1000;

export const initSecurityMonitoring = () => {
    if (typeof window === 'undefined') return;

    // Detect Spam Clicks
    window.addEventListener('click', () => {
        const now = Date.now();
        if (now - lastClickTime < SPAM_RESET_TIME) {
            clickCount++;
        } else {
            clickCount = 1;
        }
        lastClickTime = now;

        if (clickCount > SPAM_THRESHOLD) {
            reportThreat('Client-side click spamming detected', {
                clickCount,
                pathname: window.location.pathname
            }).catch(() => { }); // silent fail to not interrupt user
            clickCount = 0; // reset
        }
    });

    // Detect DevTools shortcuts (already handled in some scripts, but good to log)
    window.addEventListener('keydown', (e) => {
        const isDevKey = (e.key === 'F12') ||
            (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C')) ||
            (e.ctrlKey && e.key === 'U');

        if (isDevKey) {
            reportThreat('Client-side DevTools shortcut used', {
                key: e.key,
                ctrlKey: e.ctrlKey,
                shiftKey: e.shiftKey,
                pathname: window.location.pathname
            }).catch(() => { });
        }
    });
};
