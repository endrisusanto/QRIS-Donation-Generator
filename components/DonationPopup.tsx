import React from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { formatRupiah } from '../utils/qris';
import { Donation } from '../types';

interface DonationPopupProps {
    donation: Donation | null;
    onClose: () => void;
}

const DonationPopup: React.FC<DonationPopupProps> = ({ donation, onClose }) => {
    if (!donation) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 pointer-events-none">
            {/* Overlay */}
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity opacity-100" />

            {/* Modal */}
            <div className="bg-white rounded-3xl p-8 shadow-2xl transform transition-all scale-100 pointer-events-auto max-w-sm w-full relative animate-bounce-in border border-white/20 ring-1 ring-black/5">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                    <XMarkIcon className="h-5 w-5" />
                </button>

                <div className="text-center space-y-6">
                    {/* Success Icon */}
                    <div className="relative inline-block">
                        <div className="absolute inset-0 bg-green-200 blur-xl opacity-20 rounded-full animate-pulse"></div>
                        <div className="h-20 w-20 bg-gradient-to-tr from-green-100 to-green-50 rounded-full flex items-center justify-center mx-auto text-4xl shadow-inner border border-green-100 relative z-10">
                            🎉
                        </div>
                    </div>

                    <div className="space-y-2">
                        <h3 className="text-2xl font-black text-gray-900 tracking-tight">Donasi Masuk!</h3>

                        {donation.donorName ? (
                            <p className="text-gray-600 font-medium">
                                Dari <span className="text-gray-900 font-bold">{donation.donorName}</span>
                            </p>
                        ) : (
                            <p className="text-gray-500 text-sm">Terima kasih atas donasi Anda</p>
                        )}
                    </div>

                    <div className="bg-gradient-to-b from-green-50 to-white p-6 rounded-3xl border border-green-100 shadow-sm">
                        <p className="text-4xl font-black text-green-600 tracking-tight">
                            +{formatRupiah(parseInt(donation.amount_detected) || 0)}
                        </p>
                        <div className="flex items-center justify-center gap-2 mt-3 text-sm font-medium text-gray-500">
                            <span className="bg-white px-2 py-1 rounded-lg border border-green-100 shadow-sm text-green-700 text-xs">
                                {(donation.text && (donation.text.match(/via\s+(\w+)/i) || [])[1]) || donation.app_name}
                            </span>
                            <span className="text-gray-300">•</span>
                            <span>{new Date(donation.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                    </div>

                    {donation.message ? (
                        <div className="bg-yellow-50 p-4 rounded-2xl border border-yellow-100 relative">
                            {/* Quote decoration */}
                            <span className="absolute -top-3 left-4 bg-white text-lg px-1 text-yellow-500">❝</span>
                            <p className="text-gray-700 italic font-medium leading-relaxed">
                                {donation.message}
                            </p>
                        </div>
                    ) : (
                        <p className="text-xs text-gray-400 font-medium bg-gray-50 py-2 px-3 rounded-xl inline-block">
                            "{donation.title || 'Donasi QRIS'}"
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DonationPopup;
