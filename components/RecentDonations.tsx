import React from 'react';
import { formatRupiah } from '../utils/qris';
import { Donation } from '../types';
import { SparklesIcon, WalletIcon } from '@heroicons/react/24/outline'; // Assuming these exist or substitute

interface RecentDonationsProps {
    donations: Donation[];
    loading: boolean;
    onTriggerTest?: () => void;
    className?: string;
}

const RecentDonations: React.FC<RecentDonationsProps> = ({ donations, loading, onTriggerTest, className = "" }) => {
    return (
        <div className={`w-full flex flex-col h-full ${className}`}>
            <div
                className="flex items-center justify-between mb-6 cursor-pointer group"
                onDoubleClick={onTriggerTest}
            >
                <div>
                    <h3 className="text-gray-900 font-bold text-xl tracking-tight flex items-center gap-2">
                        Donasi Terbaru <span className="animate-pulse text-green-500">●</span>
                    </h3>
                    <p className="text-sm text-gray-500">Real-time update dari donatur</p>
                </div>
            </div>

            <div className="flex-1 bg-white/50 backdrop-blur-sm rounded-3xl border border-gray-100/50 shadow-sm overflow-hidden flex flex-col min-h-[300px] md:min-h-0">
                {loading && donations.length === 0 ? (
                    <div className="flex flex-col items-center justify-center flex-1 p-8 text-center space-y-4">
                        <div className="w-12 h-12 rounded-full border-4 border-gray-100 border-t-blue-500 animate-spin"></div>
                        <p className="text-gray-400 font-medium text-sm">Menghubungkan ke server...</p>
                    </div>
                ) : donations.length === 0 ? (
                    <div className="flex flex-col items-center justify-center flex-1 p-8 text-center space-y-4">
                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center">
                            <WalletIcon className="w-8 h-8 text-gray-300" />
                        </div>
                        <div>
                            <p className="text-gray-900 font-semibold">Belum ada donasi</p>
                            <p className="text-gray-500 text-sm mt-1">Jadilah pendukung pertama!</p>
                        </div>
                    </div>
                ) : (
                    <div className="overflow-y-auto custom-scrollbar p-2 space-y-2 h-full">
                        {donations.map((d) => (
                            <div key={d.id} className="p-4 bg-white rounded-2xl border border-gray-100 flex justify-between items-center shadow-sm hover:shadow-md transition-all duration-300 hover:scale-[1.02]">
                                <div className="flex items-start gap-4 flex-1 min-w-0">
                                    <div className="flex-none w-10 h-10 bg-white rounded-full shadow-sm border border-gray-100 flex items-center justify-center overflow-hidden mt-1">
                                        <img src="/favicon.png" alt="Icon" className="w-6 h-6 object-contain opacity-80" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        {d.donorName ? (
                                            <p className="font-bold text-gray-900 break-words whitespace-normal">{d.donorName}</p>
                                        ) : (
                                            <p className="font-bold text-gray-900 break-words whitespace-normal leading-snug">{d.text || d.app_name || 'Pembayaran QRIS'}</p>
                                        )}

                                        {d.message && (
                                            <p className="text-xs text-gray-600 italic break-words whitespace-normal mt-1">"{d.message}"</p>
                                        )}

                                        <div className="flex flex-wrap items-center gap-2 text-[10px] sm:text-xs text-gray-500 mt-2">
                                            <span className="font-medium bg-gray-100 px-2 py-0.5 rounded text-gray-700">
                                                {(d.text && (d.text.match(/via\s+(\w+)/i) || [])[1]) || d.app_name}
                                            </span>

                                            <span>
                                                {new Date(d.created_at).toLocaleString('id-ID', {
                                                    timeZone: 'Asia/Jakarta',
                                                    day: '2-digit',
                                                    month: 'short',
                                                    year: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                    second: '2-digit',
                                                    hour12: false
                                                }).replace(/\./g, ':')} WIB
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className="block font-bold text-green-600 bg-green-50 px-3 py-1.5 rounded-xl text-sm border border-green-100">
                                        +{formatRupiah(parseInt(d.amount_detected) || 0)}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default RecentDonations;
