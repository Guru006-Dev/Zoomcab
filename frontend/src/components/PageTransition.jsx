import { useLocation } from 'react-router-dom';

/** Fades each new page in. The animation is switched off for reduced motion. */
export default function PageTransition({ children }) {
    const { pathname } = useLocation();
    return <div key={pathname} className="page-fade">{children}</div>;
}
