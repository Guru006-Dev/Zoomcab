import { Link } from 'react-router-dom';

export default function NotFound() {
    return (
        <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, padding: 24, textAlign: 'center', background: 'var(--bg)', fontFamily: 'var(--font)' }}>
            <h1 style={{ fontSize: 36, fontWeight: 800, color: 'var(--text-1)' }}>Page not found</h1>
            <p style={{ color: 'var(--text-3)' }}>There is nothing at this address.</p>
            <Link to="/login" className="btn-primary">Back to sign in</Link>
        </main>
    );
}
