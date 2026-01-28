import { useState, useEffect, useRef } from 'react';
import { Donation } from '../types';

export const useRecentDonations = () => {
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
                    const filteredData = data.data.filter((d: Donation) =>
                        d.text && d.text.toLowerCase().startsWith('kamu berhasil menerima')
                    );

                    let sorted = filteredData.sort((a: Donation, b: Donation) => b.id - a.id);

                    // Merge with local metadata
                    const metadataStr = localStorage.getItem('donation_metadata');
                    const metadata = metadataStr ? JSON.parse(metadataStr) : {};

                    sorted = sorted.map((d: Donation) => {
                        if (metadata[d.id]) {
                            return { ...d, ...metadata[d.id] };
                        }
                        return d;
                    });

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

                            // If this is the first load, just set the reference ID
                            if (lastIdRef.current === 0) {
                                lastIdRef.current = latest.id;
                                return;
                            }

                            // Check for new donations that match our session
                            if (latest.id > lastIdRef.current && amountMatch && timeMatch) {
                                console.log('New donation detected for this session!', latest);

                                // Enrich with session data
                                const enrichedDonation = {
                                    ...latest,
                                    donorName: session.donorName,
                                    message: session.donorMessage
                                };

                                setNewDonation(enrichedDonation);
                                playSuccessSound();
                                lastIdRef.current = latest.id;

                                // Save metadata for persistence
                                if (session.donorName || session.donorMessage) {
                                    const newMetadata = {
                                        ...metadata,
                                        [latest.id]: {
                                            donorName: session.donorName,
                                            message: session.donorMessage
                                        }
                                    };
                                    localStorage.setItem('donation_metadata', JSON.stringify(newMetadata));

                                    // Update state immediately to reflect changes without waiting for next poll
                                    setDonations(prev => prev.map(d => d.id === latest.id ? enrichedDonation : d));
                                }

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

    const triggerTestDonation = () => {
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
    };

    return {
        donations,
        loading,
        newDonation,
        setNewDonation,
        triggerTestDonation
    };
};
