import React, { useEffect, useRef } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { formatRupiah } from '../utils/qris';
import { Donation } from '../types';

interface DonationPopupProps {
    donation: Donation | null;
    onClose: () => void;
}

const DonationPopup: React.FC<DonationPopupProps> = ({ donation, onClose }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationRef = useRef<number>();

    useEffect(() => {
        if (!donation || !canvasRef.current) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        const particles: Array<{
            x: number;
            y: number;
            vx: number;
            vy: number;
            rotation: number;
            rotationSpeed: number;
            size: number;
            color: string;
            opacity: number;
        }> = [];

        const colors = ['#10b981', '#3b82f6', '#f59e0b', '#ec4899'];

        const createBurst = (x: number, y: number, count: number) => {
            for (let i = 0; i < count; i++) {
                const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
                const velocity = 3 + Math.random() * 4;
                particles.push({
                    x,
                    y,
                    vx: Math.cos(angle) * velocity,
                    vy: Math.sin(angle) * velocity - 4,
                    rotation: Math.random() * Math.PI * 2,
                    rotationSpeed: (Math.random() - 0.5) * 0.2,
                    size: 6 + Math.random() * 6,
                    color: colors[Math.floor(Math.random() * colors.length)],
                    opacity: 1
                });
            }
        };

        createBurst(canvas.width / 2, canvas.height / 2, 40);

        const burstInterval = setInterval(() => {
            const x = canvas.width * (0.3 + Math.random() * 0.4);
            const y = canvas.height * (0.2 + Math.random() * 0.3);
            createBurst(x, y, 20);
        }, 1200);

        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            for (let i = particles.length - 1; i >= 0; i--) {
                const p = particles[i];
                p.x += p.vx;
                p.y += p.vy;
                p.vy += 0.25;
                p.rotation += p.rotationSpeed;
                p.opacity -= 0.008;

                if (p.y > canvas.height || p.opacity <= 0) {
                    particles.splice(i, 1);
                    continue;
                }

                ctx.save();
                ctx.translate(p.x, p.y);
                ctx.rotate(p.rotation);
                ctx.globalAlpha = p.opacity;
                ctx.fillStyle = p.color;
                ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size / 2);
                ctx.restore();
            }

            animationRef.current = requestAnimationFrame(animate);
        };

        animate();

        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
            clearInterval(burstInterval);
        };
    }, [donation]);

    if (!donation) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 pointer-events-none">
            <canvas
                ref={canvasRef}
                className="absolute inset-0 pointer-events-none"
                style={{ zIndex: 51 }}
            />

            <div className="absolute inset-0 bg-black/30 backdrop-blur-sm animate-fade-in" />

            <div className="bg-white rounded-3xl p-8 shadow-2xl pointer-events-auto max-w-md w-full relative animate-bounce-in">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-full transition-all"
                >
                    <XMarkIcon className="h-5 w-5" />
                </button>

                <div className="text-center space-y-6">
                    {/* Icon */}
                    {/* Icon or GIF */}
                    {donation.gifUrl ? (
                        <div className="w-full rounded-2xl overflow-hidden mb-4 border-2 border-green-100 shadow-sm">
                            <img
                                src={donation.gifUrl}
                                alt="Celebration GIF"
                                className="w-full h-auto max-h-60 object-contain bg-gray-50"
                            />
                        </div>
                    ) : (
                        <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full">
                            <span className="text-4xl">🎉</span>
                        </div>
                    )}

                    {/* Title */}
                    <div className="space-y-2">
                        <h3 className="text-2xl font-bold text-gray-900">
                            Donasi Diterima!
                        </h3>
                        {donation.donorName && (
                            <p className="text-gray-600">
                                dari <span className="font-semibold text-gray-900">{donation.donorName}</span>
                            </p>
                        )}
                    </div>

                    {/* Amount */}
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-2xl">
                        <p className="text-4xl font-bold text-green-600">
                            +{formatRupiah(parseInt(donation.amount_detected) || 0)}
                        </p>
                        <div className="flex items-center justify-center gap-2 mt-3 text-sm text-gray-500">
                            <span className="font-medium">
                                {(donation.text && (donation.text.match(/via\s+(\w+)/i) || [])[1]) || donation.app_name}
                            </span>
                            <span>•</span>
                            <span>
                                {new Date(donation.created_at).toLocaleTimeString('id-ID', {
                                    hour: '2-digit',
                                    minute: '2-digit'
                                })}
                            </span>
                        </div>
                    </div>

                    {/* Message */}
                    {donation.message && (
                        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4">
                            <p className="text-gray-700 italic text-sm leading-relaxed">
                                "{donation.message}"
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DonationPopup;
