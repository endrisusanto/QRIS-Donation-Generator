import React from 'react';
import { formatRupiah } from '../utils/qris';
import { Donation } from '../types';
import { WalletIcon } from '@heroicons/react/24/outline';

interface RecentDonationsProps {
    donations: Donation[];
    loading: boolean;
    onTriggerTest?: () => void;
    className?: string;
}

const RecentDonations: React.FC<RecentDonationsProps> = ({ donations, loading, onTriggerTest, className = "" }) => {
    return (
        <div className={`w-full h-full flex flex-col ${className}`}>
            {/* Card with fullscreen height */}
            <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden flex flex-col h-[calc(100vh-120px)]">

                {/* Header inside card */}
                <div
                    className="p-6 border-b border-gray-100 flex-none cursor-pointer"
                    onDoubleClick={onTriggerTest}
                >
                    <h3 className="text-gray-900 font-bold text-xl tracking-tight flex items-center gap-2">
                        Donasi Terbaru <span className="animate-pulse text-green-500">●</span>
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">Real-time update dari donatur</p>
                </div>

                {/* Content area - scrollable */}
                <div className="flex-1 overflow-hidden flex flex-col">
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
                        <div className="overflow-y-auto custom-scrollbar p-4 space-y-3">
                            {donations.map((d) => (
                                <div key={d.id} className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex justify-between items-start shadow-sm hover:shadow-md transition-all duration-300 hover:bg-white">
                                    <div className="flex items-start gap-4 flex-1 min-w-0">
                                        <div className="flex-none w-10 h-10 bg-white rounded-full shadow-sm border border-gray-100 flex items-center justify-center overflow-hidden mt-1">
                                            <img src="/favicon.png" alt="Icon" className="w-6 h-6 object-contain opacity-80" />
                                        </div>
                                        <div className="min-w-0 flex-1">

                                            {/* Bank Name Badge */}
                                            <div className="mb-2">
                                                <span className="font-bold text-xs bg-white px-2 py-1 rounded text-gray-800 border border-gray-200 shadow-sm">
                                                    {(d.text && (d.text.match(/via\s+(\w+)/i) || [])[1]) || d.app_name}
                                                </span>
                                            </div>

                                            {/* Donor Name (if exists) */}
                                            {d.donorName && (
                                                <p className="font-bold text-gray-900 text-base mb-1">{d.donorName}</p>
                                            )}

                                            {/* Donor Message Quote (if exists) */}
                                            {d.message && (
                                                <div className="bg-blue-50/50 border-l-4 border-blue-300 pl-3 py-1 mb-2 relative">
                                                    <p className="text-gray-700 text-sm italic leading-relaxed">
                                                        "{d.message}"
                                                    </p>
                                                </div>
                                            )}

                                            {/* GIF (if exists) */}
                                            {d.gifUrl && (
                                                <div className="rounded-xl overflow-hidden mb-2 border border-gray-100 max-w-[200px]">
                                                    <img
                                                        src={d.gifUrl}
                                                        alt="GIF"
                                                        className="w-full h-auto max-h-32 object-contain bg-gray-50"
                                                    />
                                                </div>
                                            )}

                                            {/* Timestamp */}
                                            <p className="text-[11px] text-gray-500 font-medium mb-2">
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
                                            </p>

                                            {/* Original Notification Text */}
                                            <p className="text-gray-600 text-xs leading-snug">
                                                {d.text || d.app_name || 'Pembayaran QRIS'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right ml-2 self-start mt-1">
                                        <span className="block font-bold text-green-600 bg-green-50 px-3 py-1.5 rounded-xl text-sm border border-green-100 whitespace-nowrap">
                                            +{formatRupiah(parseInt(d.amount_detected) || 0)}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default RecentDonations;
