import { useState, Suspense, lazy } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff } from 'lucide-react';
import { login, register } from '../api';
import ZoomcabLogo from '../assets/ChatGPT Image Feb 21, 2026, 09_27_37 PM.png';

const Spline = lazy(() => import('@splinetool/react-spline'));

// ── pick which scene to use ──────────────────────────────────
const SPLINE_URL = 'https://prod.spline.design/gBTs5cDHY25P5EZz/scene.splinecode';

// ── blurred shimmer shown while Spline loads ─────────────────
function SplineLoader() {
    return (
        <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(135deg,#4840CC,#5B4FE8,#8B7CF6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
            {/* animated logo pulse */}
            <motion.div
                animate={{ scale: [1, 1.12, 1], opacity: [0.6, 1, 0.6] }}
                transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
                style={{ textAlign: 'center' }}
            >
                <div style={{ fontSize: 52, marginBottom: 12 }}>⚡</div>
                <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, fontFamily: 'var(--font)', letterSpacing: '0.12em' }}>
                    LOADING 3D…
                </div>
            </motion.div>
        </div>
    );
}

export default function Login() {
    const navigate = useNavigate();

    // Auth State
    const [mode, setMode] = useState('login'); // 'login' | 'signup'
    const [role, setRole] = useState('rider');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPass, setConfirmPass] = useState('');
    const [showPass, setShowPass] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const switchMode = (m) => {
        setMode(m);
        setError('');
        setSuccess('');
        setUsername('');
        setPassword('');
        setConfirmPass('');
    };

    // Make the Spline WebGL canvas background transparent
    const handleSplineLoad = (splineApp) => {
        try {
            if (splineApp?.renderer) {
                splineApp.renderer.setClearColor(0x000000, 0);
                splineApp.renderer.setClearAlpha(0);
            }
        } catch (e) { /* fail silently */ }
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const data = await login(username, password, role);
            // Some login endpoints return `data`, some return `data.data`. Handling safely:
            const token = data.data?.token || data.token;
            const resRole = data.data?.user?.role || role;

            localStorage.setItem('token', token);
            localStorage.setItem('role', resRole);
            localStorage.setItem('username', username);
            navigate(resRole === 'driver' ? '/driver' : '/home');
        } catch (err) {
            setError(err.response?.data?.error || err.response?.data?.message || 'Invalid credentials.');
        } finally {
            setLoading(false);
        }
    };

    const handleSignup = async (e) => {
        e.preventDefault();
        setError(''); setSuccess('');
        if (password !== confirmPass) { setError('Passwords do not match.'); return; }
        if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }
        setLoading(true);
        try {
            await register(username, password, role);
            setSuccess('Account created! You can now sign in.');
            setTimeout(() => switchMode('login'), 1800);
        } catch (err) {
            const errorMsg = err.response?.data?.error || '';
            if (errorMsg.includes('UNIQUE constraint failed') || errorMsg.includes('SQLITE_CONSTRAINT')) {
                setError('That username is already taken. Please choose another one.');
            } else {
                setError(errorMsg || 'Failed to create account. Please try again.');
            }
        } finally { setLoading(false); }
    };

    return (
        <div style={{
            display: 'flex', minHeight: '100vh',
            background: 'var(--bg)', fontFamily: 'var(--font)',
        }}>

            {/* ══════════════════════════════════════════════════
                LEFT — City map + Spline 3D scene
            ══════════════════════════════════════════════════ */}
            <div style={{
                flex: 1, position: 'relative', overflow: 'hidden',
                display: 'none',
                background: 'linear-gradient(135deg, #1a0e3d 0%, #2d1b69 40%, #4c2d9e 75%, #6d4fc2 100%)',
            }}
                className="spline-panel"
            >
                {/* ── Layer 1: Spline 3D scene (oversized to push watermark out of bounds) ── */}
                <div style={{
                    position: 'absolute',
                    top: -80, bottom: -80, left: -180, right: -180,
                    zIndex: 1,
                    pointerEvents: 'none', background: 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                    <Suspense fallback={<SplineLoader />}>
                        <Spline
                            scene={SPLINE_URL}
                            onLoad={handleSplineLoad}
                            style={{ width: '100%', height: '100%', background: 'transparent' }}
                        />
                    </Suspense>
                </div>

                {/* ── Layer 2: right-edge fade into form panel ── */}
                <div style={{
                    position: 'absolute', inset: 0, zIndex: 2, pointerEvents: 'none',
                    background: 'linear-gradient(to right, transparent 60%, var(--surface) 100%)',
                }} />

                {/* ── Layer 3: Branding badge ── */}
                <div style={{
                    position: 'absolute', top: 28, left: 28, zIndex: 3,
                    display: 'flex', alignItems: 'center',
                }}>
                    <img
                        src={ZoomcabLogo}
                        alt="ZoomCab Logo"
                        style={{
                            width: 140,
                            objectFit: 'contain',
                        }}
                    />
                </div>

                {/* ── Layer 3: Tagline bottom-left ── */}
                <div style={{
                    position: 'absolute', bottom: 36, left: 32, zIndex: 3,
                }}>
                    <p style={{ fontWeight: 800, fontSize: 22, lineHeight: 1.3, color: '#fff' }}>
                        Next-Gen<br />Urban Mobility
                    </p>
                    <p style={{ fontSize: 13, marginTop: 6, color: 'rgba(255,255,255,0.65)' }}>
                        Your city. Your ride. In seconds.
                    </p>
                </div>


            </div>

            {/* ══════════════════════════════════════════════════
                RIGHT — Login form
            ══════════════════════════════════════════════════ */}
            <div style={{
                width: '100%', maxWidth: 480,
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                padding: '48px 40px',
                background: 'var(--surface)',
                boxShadow: '-4px 0 40px rgba(91,79,232,0.06)',
                position: 'relative', zIndex: 1,
            }}>

                {/* Brand (shown only when the 3D panel is hidden, i.e. mobile) */}
                <div className="brand-mobile" style={{ textAlign: 'center', marginBottom: 36 }}>
                    <img
                        src={ZoomcabLogo}
                        alt="ZoomCab Logo"
                        style={{
                            width: 160,
                            objectFit: 'contain',
                            margin: '0 auto 10px',
                        }}
                    />
                    <p style={{ fontSize: 14, color: 'var(--text-4)' }}>Next-gen urban mobility</p>
                </div>

                {/* Login / Signup toggle tabs */}
                <div style={{
                    display: 'flex', background: 'var(--surface3)', borderRadius: 14,
                    padding: 4, gap: 4, marginBottom: 24, width: '100%',
                }}>
                    {[['login', '⚡ Sign In'], ['signup', '🚀 Sign Up']].map(([m, label]) => (
                        <button key={m} onClick={() => switchMode(m)} style={{
                            flex: 1, padding: '10px 0', borderRadius: 11, border: 'none', cursor: 'pointer',
                            fontFamily: 'var(--font)', fontWeight: 700, fontSize: 14, transition: 'all 0.25s',
                            background: mode === m ? 'var(--surface)' : 'transparent',
                            color: mode === m ? 'var(--primary)' : 'var(--text-4)',
                            boxShadow: mode === m ? 'var(--shadow-sm)' : 'none',
                        }}>{label}</button>
                    ))}
                </div>

                {/* Role toggle */}
                <div style={{
                    display: 'flex', background: 'var(--surface3)', borderRadius: 14,
                    padding: 4, gap: 4, marginBottom: 24, width: '100%',
                }}>
                    {['rider', 'driver'].map(r => (
                        <button
                            key={r} onClick={() => setRole(r)}
                            style={{
                                flex: 1, padding: '9px 0', borderRadius: 11, border: 'none', cursor: 'pointer',
                                fontFamily: 'var(--font)', fontWeight: 700, fontSize: 13,
                                textTransform: 'capitalize', transition: 'all 0.25s',
                                background: role === r ? (r === 'rider' ? 'rgba(91,79,232,0.12)' : 'rgba(34,197,94,0.12)') : 'transparent',
                                color: role === r ? (r === 'rider' ? '#5B4FE8' : '#16A34A') : 'var(--text-4)',
                            }}
                        >
                            {r === 'rider' ? '🧑‍💼 Rider' : '🚗 Driver'}
                        </button>
                    ))}
                </div>

                {/* Heading */}
                <AnimatePresence mode="wait">
                    <motion.div key={mode + role}
                        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                        style={{ textAlign: 'center', marginBottom: 20, width: '100%' }}
                    >
                        <h2 style={{ fontWeight: 800, fontSize: 21, color: 'var(--text-1)', letterSpacing: '-0.02em' }}>
                            {mode === 'signup'
                                ? (role === 'driver' ? 'Join as a Driver' : 'Create your account')
                                : (role === 'driver' ? 'Start your shift' : 'Welcome back')}
                        </h2>
                        <p style={{ fontSize: 13, color: 'var(--text-4)', marginTop: 4 }}>
                            {mode === 'signup'
                                ? `Register as a ${role} and get started`
                                : (role === 'driver' ? 'Log in to your dashboard' : 'Sign in to book a ride')}
                        </p>
                    </motion.div>
                </AnimatePresence>

                {/* Form */}
                <form onSubmit={mode === 'login' ? handleLogin : handleSignup} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 13 }}>
                    {/* Username */}
                    <div>
                        <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-4)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                            Username
                        </label>
                        <input
                            className="input"
                            type="text"
                            placeholder="Enter your username"
                            value={username}
                            onChange={e => setUsername(e.target.value)}
                            required
                            autoComplete="username"
                        />
                    </div>

                    {/* Password */}
                    <div>
                        <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-4)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                            Password
                        </label>
                        <div style={{ position: 'relative' }}>
                            <input
                                className="input"
                                type={showPass ? 'text' : 'password'}
                                placeholder="Enter your password"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                required
                                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                                style={{ paddingRight: 44 }}
                            />
                            <button type="button" onClick={() => setShowPass(v => !v)}
                                style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-4)', display: 'flex', alignItems: 'center' }}>
                                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                    </div>

                    {/* Confirm password — signup only */}
                    <AnimatePresence>
                        {mode === 'signup' && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                style={{ overflow: 'hidden' }}
                            >
                                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-4)', marginBottom: 6, marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                                    Confirm Password
                                </label>
                                <input className="input" type={showPass ? 'text' : 'password'}
                                    placeholder="Re-enter your password"
                                    value={confirmPass} onChange={e => setConfirmPass(e.target.value)}
                                    required autoComplete="new-password" style={{ width: '100%', boxSizing: 'border-box' }} />
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Error */}
                    <AnimatePresence>
                        {error && (
                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                                style={{ padding: '10px 14px', borderRadius: 10, background: '#FEF2F2', border: '1px solid #FECACA', color: '#DC2626', fontSize: 13, fontWeight: 600 }}>
                                {error}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Success */}
                    <AnimatePresence>
                        {success && (
                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                                style={{ padding: '10px 14px', borderRadius: 10, background: '#F0FDF4', border: '1px solid #86EFAC', color: '#16A34A', fontSize: 13, fontWeight: 600 }}>
                                ✅ {success}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* CTA */}
                    <motion.button
                        type="submit"
                        className="btn-primary"
                        disabled={loading}
                        whileHover={!loading ? { scale: 1.01 } : {}}
                        whileTap={!loading ? { scale: 0.98 } : {}}
                        style={{ marginTop: 6, padding: '15px 24px', fontSize: 15, borderRadius: 14, width: '100%', justifyContent: 'center' }}
                    >
                        {loading
                            ? <><div style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', animation: 'spin 0.8s linear infinite' }} /> {mode === 'signup' ? 'Creating…' : 'Signing in…'}</>
                            : mode === 'signup'
                                ? (role === 'driver' ? '🚗 Create Driver Account' : '🧑‍💼 Create Rider Account')
                                : (role === 'driver' ? '🚗 Start Shift' : '⚡ Sign In')
                        }
                    </motion.button>
                </form>

                {/* Demo hint — only on login */}
                {mode === 'login' && (
                    <div style={{ marginTop: 22, padding: '12px 16px', borderRadius: 12, background: 'var(--surface2)', border: '1px solid var(--border2)', width: '100%' }}>
                        <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Demo accounts</p>
                        <div style={{ display: 'flex', gap: 16, fontSize: 12, color: 'var(--text-3)' }}>
                            <span>🧑‍💼 <b>rider1</b> / test123</span>
                            <span>🚗 <b>driver1</b> / test123</span>
                        </div>
                    </div>
                )}
            </div>

            {/* ── Responsive styles ── */}
            <style>{`
                @media (min-width: 768px) {
                    .spline-panel { display: block !important; }
                    .brand-mobile { display: none !important; }
                }
                @media (max-width: 767px) {
                    .spline-panel { display: none !important; }
                    .brand-mobile { display: block !important; }
                }
            `}</style>
        </div>
    );
}
