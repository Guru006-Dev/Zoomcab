import { useState } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Calendar, Download, Star } from 'lucide-react';
import PageLayout from '../components/PageLayout';
import RatingModal from '../components/RatingModal';

const rides = [
    { id: 1, date: 'Today', time: '10:30 AM', vehicle: 'Zoom Sedan', price: 145, from: 'Home', to: 'Office', status: 'Completed', driver: 'John Doe', payment: 'Card' },
    { id: 2, date: 'Yesterday', time: '6:15 PM', vehicle: 'Zoom Auto', price: 65, from: 'Office', to: 'Gym', status: 'Completed', driver: 'Jane Smith', payment: 'Cash' },
    { id: 3, date: '10 Feb', time: '9:00 AM', vehicle: 'Zoom SUV', price: 220, from: 'Airport', to: 'Home', status: 'Cancelled', driver: 'Mike Johnson', payment: 'Card' },
    { id: 4, date: '05 Feb', time: '3:00 PM', vehicle: 'Zoom Sedan', price: 180, from: 'Mall', to: 'Home', status: 'Completed', driver: 'Sarah Lee', payment: 'UPI' },
];

export default function MyRides() {
    const [ratingOpen, setRatingOpen] = useState(false);
    const [selectedRide, setSelectedRide] = useState(null);

    const downloadReceipt = (ride) => {
        const txt = `ZOOMCAB RECEIPT\nRide #${ride.id} | ${ride.date} ${ride.time}\nFrom: ${ride.from}\nTo: ${ride.to}\nVehicle: ${ride.vehicle}\nDriver: ${ride.driver}\nAmount: ₹${ride.price}\nPayment: ${ride.payment}\n\nThank you for riding ZoomCab!`;
        const a = document.createElement('a');
        a.href = URL.createObjectURL(new Blob([txt], { type: 'text/plain' }));
        a.download = `Receipt-${ride.id}.txt`;
        a.click();
    };

    return (
        <PageLayout title="My Rides" subtitle="Your journey history">
            <div style={{ maxWidth: 720, display: 'flex', flexDirection: 'column', gap: 12 }}>
                {rides.map((ride, i) => (
                    <motion.div
                        key={ride.id}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.06 }}
                        className="card"
                        style={{ padding: 20 }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                            <div>
                                <h3 style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-1)' }}>{ride.vehicle}</h3>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                                    <Calendar size={13} style={{ color: 'var(--text-4)' }} />
                                    <span style={{ fontSize: 12, color: 'var(--text-4)' }}>{ride.date} · {ride.time}</span>
                                </div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <div style={{ fontWeight: 800, fontSize: 18, color: 'var(--primary)' }}>₹{ride.price}</div>
                                <span className={`badge ${ride.status === 'Completed' ? 'badge-success' : 'badge-danger'}`} style={{ marginTop: 4 }}>
                                    {ride.status}
                                </span>
                            </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14, paddingLeft: 4 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--success)', flexShrink: 0 }} />
                                <span style={{ fontSize: 13, color: 'var(--text-2)' }}><strong>From:</strong> {ride.from}</span>
                            </div>
                            <div style={{ marginLeft: 3, height: 14, borderLeft: '2px dashed var(--border)', width: 1 }} />
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--primary)', flexShrink: 0 }} />
                                <span style={{ fontSize: 13, color: 'var(--text-2)' }}><strong>To:</strong> {ride.to}</span>
                            </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 14, borderTop: '1px solid var(--border)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span style={{ fontSize: 12, color: 'var(--text-4)' }}>Driver: <strong style={{ color: 'var(--text-2)' }}>{ride.driver}</strong></span>
                                <span style={{ fontSize: 12, color: 'var(--text-4)' }}>· {ride.payment}</span>
                            </div>
                            {ride.status === 'Completed' && (
                                <div style={{ display: 'flex', gap: 8 }}>
                                    <button
                                        onClick={() => downloadReceipt(ride)}
                                        className="btn-ghost"
                                        style={{ padding: '6px 12px', fontSize: 12, gap: 4 }}
                                    >
                                        <Download size={13} /> Receipt
                                    </button>
                                    <button
                                        onClick={() => { setSelectedRide(ride); setRatingOpen(true); }}
                                        className="btn-ghost"
                                        style={{ padding: '6px 12px', fontSize: 12, gap: 4, color: 'var(--primary)', borderColor: 'var(--border2)', background: 'var(--surface2)' }}
                                    >
                                        <Star size={13} /> Rate
                                    </button>
                                </div>
                            )}
                        </div>
                    </motion.div>
                ))}
            </div>
            <RatingModal isOpen={ratingOpen} onClose={() => setRatingOpen(false)} driverName={selectedRide?.driver} onSubmit={() => setRatingOpen(false)} />
        </PageLayout>
    );
}
