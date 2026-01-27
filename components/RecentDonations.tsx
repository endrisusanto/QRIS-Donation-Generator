import React, { useEffect, useState, useRef } from 'react';
import { formatRupiah } from '../utils/qris';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface Donation {
    id: number;
    app_name: string;
    title: string;
    text: string;
    amount_detected: string;
    created_at: string;
}

const RecentDonations: React.FC = () => {
    const [donations, setDonations] = useState<Donation[]>([]);
    const [loading, setLoading] = useState(true);
    const [newDonation, setNewDonation] = useState<Donation | null>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const lastIdRef = useRef<number>(0);

    // Initialize audio
    useEffect(() => {
        audioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3'); // Success chime sound
    }, []);

    const playSuccessSound = () => {
        if (audioRef.current) {
            audioRef.current.currentTime = 0;
            audioRef.current.play().catch(e => console.log('Audio play failed:', e));
        }
    };

    // Poll for new donations every 5 seconds
    useEffect(() => {
        const fetchDonations = async () => {
            try {
                const response = await fetch('https://notification-listener-backend.endri-susanto.workers.dev/public/donations?limit=10');
                const data = await response.json();

                if (data.success && data.data.length > 0) {
                    const sorted = data.data.sort((a: Donation, b: Donation) => b.id - a.id);
                    setDonations(sorted);

                    // Check for session-matched donations
                    const sessionStr = localStorage.getItem('qris_session');
                    if (sessionStr) {
                        const session = JSON.parse(sessionStr);
                        const sessionAmount = session.amount;
                        const sessionTime = new Date(session.generatedAt).getTime();
                        const expiryTime = new Date(session.expiresAt).getTime();
                        const now = new Date().getTime();

                        // Only check if session is still valid
                        if (now < expiryTime) {
                            const latest = sorted[0];
                            const donationAmount = parseInt(latest.amount_detected);
                            const donationTime = new Date(latest.created_at).getTime();

                            // Match by amount and time (donation must be after QR generation)
                            const amountMatch = donationAmount === sessionAmount;
                            const timeDiff = (donationTime - sessionTime) / 1000; // in seconds
                            // Donation must be AFTER session (positive diff) and within expiry window
                            const timeMatch = timeDiff > 0 && donationTime < expiryTime;

                            console.log('Latest ID:', latest.id, 'Last Ref ID:', lastIdRef.current);
                            console.log('Amount match:', amountMatch, 'Time match:', timeMatch);
                            console.log('Session time:', new Date(sessionTime).toISOString());
                            console.log('Donation time:', new Date(donationTime).toISOString());
                            console.log('Expiry time:', new Date(expiryTime).toISOString());
                            console.log('Time diff (seconds):', timeDiff);

                            // If this is the first load, just set the reference ID
                            if (lastIdRef.current === 0) {
                                lastIdRef.current = latest.id;
                                return;
                            }

                            // Check for new donations that match our session
                            if (latest.id > lastIdRef.current && amountMatch && timeMatch) {
                                console.log('New donation detected for this session!', latest);
                                setNewDonation(latest);
                                playSuccessSound();
                                lastIdRef.current = latest.id;

                                // Clear session after successful match
                                localStorage.removeItem('qris_session');

                                // Auto hide after 8 seconds
                                setTimeout(() => setNewDonation(null), 8000);
                            } else if (latest.id > lastIdRef.current) {
                                // Update lastId even if it doesn't match (to avoid re-checking)
                                lastIdRef.current = latest.id;
                            }
                        }
                    } else {
                        // No active session, just update the list
                        const latest = sorted[0];
                        if (lastIdRef.current === 0) {
                            lastIdRef.current = latest.id;
                        }
                    }
                }
            } catch (error) {
                console.error('Failed to fetch donations:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchDonations();
        const interval = setInterval(fetchDonations, 5000);
        return () => clearInterval(interval);
    }, []);

    if (loading && donations.length === 0) {
        return (
            <div className="w-full max-w-md mt-6 p-4 text-center text-gray-400 text-sm animate-pulse">
                Memuat donasi terbaru...
            </div>
        );
    }

    if (donations.length === 0 && !loading) {
        return null;
    }

    return (
        <>
            {/* New Donation Popup Modal */}
            {newDonation && (
                <div className="fixed inset-0 z-50 flex items-center justify-center px-4 pointer-events-none">
                    <div className="absolute inset-0 bg-black/20 backdrop-blur-sm transition-opacity opacity-100"></div>
                    <div className="bg-white rounded-3xl p-6 shadow-2xl transform transition-all scale-100 pointer-events-auto max-w-sm w-full relative animate-bounce-in border border-green-100">
                        <button
                            onClick={() => setNewDonation(null)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1 bg-gray-50 rounded-full"
                        >
                            <XMarkIcon className="h-5 w-5" />
                        </button>

                        <div className="text-center space-y-4">
                            <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center mx-auto text-3xl animate-pulse">
                                🎉
                            </div>

                            <div className="space-y-1">
                                <h3 className="text-xl font-bold text-gray-900">Pembayaran Diterima!</h3>
                                <p className="text-gray-500 text-sm">Terima kasih atas donasi Anda</p>
                            </div>

                            <div className="bg-green-50 p-4 rounded-2xl border border-green-100">
                                <p className="text-3xl font-extrabold text-green-600">
                                    +{formatRupiah(parseInt(newDonation.amount_detected) || 0)}
                                </p>
                                <div className="flex items-center justify-center gap-2 mt-2 text-sm text-gray-600">
                                    <span className="font-medium">{newDonation.app_name}</span>
                                    <span>•</span>
                                    <span>{new Date(newDonation.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
                                </div>
                            </div>

                            <p className="text-xs text-gray-400 italic">
                                "{newDonation.title || 'Donasi QRIS'}"
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Hidden debug button (double click "Donasi Terbaru" header to test) */}
            <div className="w-full max-w-md mt-8">
                <div
                    className="flex items-center gap-2 mb-4 cursor-pointer select-none"
                    onDoubleClick={() => {
                        console.log('Test triggered');
                        setNewDonation({
                            id: 99999,
                            app_name: 'TEST APP',
                            title: 'Tes Notifikasi',
                            text: 'Pembayaran diterima',
                            amount_detected: '123456',
                            created_at: new Date().toISOString()
                        });
                        playSuccessSound();
                    }}
                >
                    <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
                    <h3 className="text-gray-900 font-bold text-lg">Donasi Terbaru</h3>
                </div>

                <div className="bg-white rounded-2xl border border-gray-100 shadow-lg overflow-hidden divide-y divide-gray-100">
                    {donations.map((d) => (
                        <div key={d.id} className="p-4 flex justify-between items-center hover:bg-gray-50 transition-colors">
                            <div className="flex items-center gap-3">
                                <div className={`h-10 w-10 rounded-full flex items-center justify-center text-xl font-bold text-white
                ${d.app_name?.toLowerCase().includes('dana') ? 'bg-blue-500' :
                                        d.app_name?.toLowerCase().includes('gopay') ? 'bg-green-500' :
                                            d.app_name?.toLowerCase().includes('ovo') ? 'bg-purple-600' : 'bg-gray-400'
                                    }`}
                                >
                                    {d.app_name?.charAt(0) || '?'}
                                </div>
                                <div>
                                    <p className="font-bold text-gray-900 line-clamp-1">{d.title || d.app_name || 'Pembayaran QRIS'}</p>
                                    <p className="text-xs text-gray-500">
                                        {new Date(d.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} • {d.app_name}
                                    </p>
                                </div>
                            </div>
                            <div className="text-right">
                                <span className="block font-bold text-green-600 bg-green-50 px-2 py-1 rounded-lg text-sm">
                                    +{formatRupiah(parseInt(d.amount_detected) || 0)}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </>
    );
};

export default RecentDonations;
