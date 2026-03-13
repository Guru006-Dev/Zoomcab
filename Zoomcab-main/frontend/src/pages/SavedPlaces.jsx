import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Plus, Trash2, Edit2, Check, X } from 'lucide-react';
import PageLayout from '../components/PageLayout';
import useSavedPlaces from '../hooks/useSavedPlaces';

export default function SavedPlaces() {
    const { places, savePlace, addCustomPlace, removePlace } = useSavedPlaces();
    const [editingId, setEditingId] = useState(null);
    const [editAddress, setEditAddress] = useState('');
    const [showAdd, setShowAdd] = useState(false);
    const [newName, setNewName] = useState('');
    const [newAddr, setNewAddr] = useState('');

    const handleSave = (id) => {
        if (editAddress.trim()) { savePlace(id, editAddress, null, null); setEditingId(null); }
    };
    const handleAdd = () => {
        if (newName.trim() && newAddr.trim()) { addCustomPlace(newName, newAddr, null, null); setNewName(''); setNewAddr(''); setShowAdd(false); }
    };

    return (
        <PageLayout title="Saved Places" subtitle="Quick access to your favourite spots"
            headerRight={
                <button onClick={() => setShowAdd(true)} className="btn-primary" style={{ padding: '8px 16px', fontSize: 13, gap: 6 }}>
                    <Plus size={14} /> Add Place
                </button>
            }
        >
            <div style={{ maxWidth: 580, display: 'flex', flexDirection: 'column', gap: 12 }}>
                <AnimatePresence>
                    {showAdd && (
                        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                            className="card" style={{ padding: 20, outline: '1.5px solid var(--border2)' }}>
                            <p style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-1)', marginBottom: 12 }}>New Place</p>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                <input className="input" placeholder="Place name (e.g., Gym)" value={newName} onChange={e => setNewName(e.target.value)} />
                                <input className="input" placeholder="Address" value={newAddr} onChange={e => setNewAddr(e.target.value)} />
                                <div style={{ display: 'flex', gap: 8 }}>
                                    <button onClick={handleAdd} className="btn-primary" style={{ flex: 1 }}>Add Place</button>
                                    <button onClick={() => setShowAdd(false)} className="btn-ghost">Cancel</button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {places.map((place, i) => {
                    const isEditing = editingId === place.id;
                    const canDelete = place.id.startsWith('custom_');
                    return (
                        <motion.div key={place.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}
                            className="card" style={{ padding: 16, display: 'flex', alignItems: 'center', gap: 14 }}>
                            <div style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--surface2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>
                                {place.icon || <MapPin size={18} style={{ color: 'var(--primary)' }} />}
                            </div>
                            <div style={{ flex: 1 }}>
                                <p style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-1)' }}>{place.name}</p>
                                {isEditing ? (
                                    <input className="input" style={{ marginTop: 6 }} placeholder="Enter address" value={editAddress} onChange={e => setEditAddress(e.target.value)} autoFocus />
                                ) : (
                                    <p style={{ fontSize: 12, color: 'var(--text-4)', marginTop: 2 }}>{place.address || 'Tap edit to set address'}</p>
                                )}
                            </div>
                            <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                                {isEditing ? (
                                    <>
                                        <button onClick={() => handleSave(place.id)} className="btn-primary" style={{ padding: '7px 12px', fontSize: 12 }}><Check size={13} /></button>
                                        <button onClick={() => setEditingId(null)} className="btn-ghost" style={{ padding: '7px 12px' }}><X size={13} /></button>
                                    </>
                                ) : (
                                    <>
                                        <button onClick={() => { setEditingId(place.id); setEditAddress(place.address || ''); }}
                                            style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--surface3)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-3)' }}>
                                            <Edit2 size={13} />
                                        </button>
                                        {canDelete && (
                                            <button onClick={() => removePlace(place.id)}
                                                style={{ width: 32, height: 32, borderRadius: 8, background: '#FEF2F2', border: '1px solid #FECACA', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#DC2626' }}>
                                                <Trash2 size={13} />
                                            </button>
                                        )}
                                    </>
                                )}
                            </div>
                        </motion.div>
                    );
                })}
            </div>
        </PageLayout>
    );
}
