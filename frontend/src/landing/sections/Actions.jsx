import { GithubLogo, Play, ArrowRight } from '@phosphor-icons/react';

export const REPO = 'https://github.com/Guru006-Dev/Zoomcab';
const DEMO = import.meta.env.VITE_DEMO_URL;

export default function Actions({ onWatch }) {
    return (
        <div className="lp-actions">
            {DEMO && (
                <a className="lp-button lp-primary" href={DEMO}>
                    Try the live demo <ArrowRight size={18} aria-hidden />
                </a>
            )}
            <a className={`lp-button ${DEMO ? '' : 'lp-primary'}`} href={REPO}>
                <GithubLogo size={18} aria-hidden /> View the code
            </a>
            <button type="button" className="lp-button" onClick={onWatch}>
                <Play size={18} aria-hidden /> Watch a match
            </button>
        </div>
    );
}
