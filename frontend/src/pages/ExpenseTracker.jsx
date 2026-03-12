import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, TrendingDown, Fuel, Wrench } from 'lucide-react';
import PageLayout from '../components/PageLayout';

const iconMap = { fuel: '⛽', maintenance: '🔧', other: '🚗' };

export default function ExpenseTracker() {
    const [showAdd, setShowAdd] = useState(false);
    const [expType, setExpType] = useState('fuel');
    const [amount, setAmount] = useState('');
    const [desc, setDesc] = useState('');
    const [expenses, setExpenses] = useState([
        { id: 1, type: 'fuel', amount: 1200, description: 'Full tank refill', date: 'Feb 12' },
        { id: 2, type: 'maintenance', amount: 850, description: 'Oil change', date: 'Feb 10' },
        { id: 3, type: 'fuel', amount: 600, description: 'Half tank', date: 'Feb 9' },
        { id: 4, type: 'other', amount: 200, description: 'Car wash', date: 'Feb 8' },
    ]);

    const total = expenses.reduce((s, e) => s + e.amount, 0);
    const fuel = expenses.filter(e => e.type === 'fuel').reduce((s, e) => s + e.amount, 0);
    const maint = expenses.filter(e => e.type === 'maintenance').reduce((s, e) => s + e.amount, 0);

    const handleAdd = () => {
        if (!amount || !desc) return;
        setExpenses([{ id: Date.now(), type: expType, amount: parseFloat(amount), description: desc, date: 'Today' }, ...expenses]);
        setAmount(''); setDesc(''); setShowAdd(false);
    };

    return (
        <PageLayout title="Expenses" subtitle="Track your vehicle costs"
            headerRight={
                <button onClick={() => setShowAdd(v => !v)} className="btn-primary" style={{ padding: '8px 16px', fontSize: 13, gap: 6 }}>
                    <Plus size={14} /> Add
                </button>
            }
        >
            <div style={{ maxWidth: 560, display: 'flex', flexDirection: 'column', gap: 16 }}>

                {/* Add form */}
                <AnimatePresence>
                    {showAdd && (
                        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
                            className="card" style={{ padding: 20, outline: '1.5px solid var(--border2)' }}>
                            <p style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-1)', marginBottom: 12 }}>New Expense</p>
                            <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                                {['fuel', 'maintenance', 'other'].map(t => (
                                    <button key={t} onClick={() => setExpType(t)}
                                        style={{
                                            flex: 1, padding: '9px 0', borderRadius: 10, border: `1.5px solid ${expType === t ? 'var(--primary)' : 'var(--border)'}`,
                                            background: expType === t ? 'var(--surface2)' : 'var(--surface3)', cursor: 'pointer', fontSize: 12, fontWeight: 700, color: expType === t ? 'var(--primary)' : 'var(--text-3)', fontFamily: 'var(--font)', textTransform: 'capitalize'
                                        }}>
                                        {iconMap[t]} {t}
                                    </button>
                                ))}
                            </div>
                            <input className="input" style={{ marginBottom: 8 }} type="number" placeholder="Amount (₹)" value={amount} onChange={e => setAmount(e.target.value)} />
                            <input className="input" style={{ marginBottom: 10 }} type="text" placeholder="Description" value={desc} onChange={e => setDesc(e.target.value)} />
                            <div style={{ display: 'flex', gap: 8 }}>
                                <button onClick={handleAdd} className="btn-primary" style={{ flex: 1 }}>Add Expense</button>
                                <button onClick={() => setShowAdd(false)} className="btn-ghost">Cancel</button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Total hero */}
                <div style={{ borderRadius: 24, padding: 24, background: 'linear-gradient(135deg,#DC2626,#EF4444)', color: '#fff', textAlign: 'center', boxShadow: '0 12px 40px rgba(220,38,38,0.3)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, opacity: 0.85, marginBottom: 6 }}>
                        <TrendingDown size={14} />
                        <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.08em' }}>TOTAL EXPENSES</span>
                    </div>
                    <div style={{ fontSize: 44, fontWeight: 800, letterSpacing: '-0.04em' }}>₹{total.toLocaleString()}</div>
                    <div style={{ fontSize: 13, opacity: 0.8, marginTop: 4 }}>This month</div>
                </div>

                {/* Breakdown mini */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div className="card" style={{ padding: 16, textAlign: 'center' }}>
                        <Fuel size={18} style={{ color: 'var(--orange)', margin: '0 auto 8px' }} />
                        <div style={{ fontWeight: 800, fontSize: 22, color: 'var(--text-1)' }}>₹{fuel}</div>
                        <div className="section-label" style={{ marginTop: 4 }}>Fuel</div>
                    </div>
                    <div className="card" style={{ padding: 16, textAlign: 'center' }}>
                        <Wrench size={18} style={{ color: 'var(--primary)', margin: '0 auto 8px' }} />
                        <div style={{ fontWeight: 800, fontSize: 22, color: 'var(--text-1)' }}>₹{maint}</div>
                        <div className="section-label" style={{ marginTop: 4 }}>Maintenance</div>
                    </div>
                </div>

                {/* List */}
                <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                    <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
                        <p className="section-label">Recent Expenses</p>
                    </div>
                    {expenses.map((exp, i) => (
                        <div key={exp.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 20px', borderBottom: i < expenses.length - 1 ? '1px solid var(--border)' : 'none' }}>
                            <div style={{ fontSize: 24 }}>{iconMap[exp.type]}</div>
                            <div style={{ flex: 1 }}>
                                <p style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-1)' }}>{exp.description}</p>
                                <p style={{ fontSize: 11, color: 'var(--text-4)', marginTop: 2 }}>{exp.date}</p>
                            </div>
                            <span style={{ fontWeight: 700, fontSize: 14, color: '#DC2626' }}>−₹{exp.amount}</span>
                        </div>
                    ))}
                </div>
            </div>
        </PageLayout>
    );
}
