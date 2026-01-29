import React, { useState, useEffect } from 'react';
import { XMarkIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';

interface GifPickerProps {
    onSelect: (gifUrl: string) => void;
    onClose: () => void;
}

interface GifObject {
    id: string;
    images: {
        fixed_height: {
            url: string;
        };
        downsized_medium: {
            url: string;
        };
    };
}

const GIPHY_API_KEY = 'SHdHxj0NpOMqzCEueq1puSL0fMN8RTLw';

const GifPicker: React.FC<GifPickerProps> = ({ onSelect, onClose }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [gifs, setGifs] = useState<GifObject[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        // Load trending GIFs on mount
        fetchTrendingGifs();
    }, []);

    const fetchTrendingGifs = async () => {
        setLoading(true);
        try {
            const response = await fetch(
                `https://api.giphy.com/v1/gifs/trending?api_key=${GIPHY_API_KEY}&limit=20&rating=g`
            );
            const data = await response.json();
            setGifs(data.data || []);
        } catch (error) {
            console.error('Error fetching trending GIFs:', error);
        } finally {
            setLoading(false);
        }
    };

    const searchGifs = async (query: string) => {
        if (!query.trim()) {
            fetchTrendingGifs();
            return;
        }

        setLoading(true);
        try {
            const response = await fetch(
                `https://api.giphy.com/v1/gifs/search?api_key=${GIPHY_API_KEY}&q=${encodeURIComponent(query)}&limit=20&rating=g`
            );
            const data = await response.json();
            setGifs(data.data || []);
        } catch (error) {
            console.error('Error searching GIFs:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        searchGifs(searchQuery);
    };

    const handleSelectGif = (gif: GifObject) => {
        onSelect(gif.images.downsized_medium.url);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden">
                {/* Header */}
                <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                    <div>
                        <h3 className="text-xl font-bold text-gray-900">Pilih GIF</h3>
                        <p className="text-sm text-gray-500 mt-1">Powered by GIPHY</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <XMarkIcon className="h-6 w-6 text-gray-500" />
                    </button>
                </div>

                {/* Search */}
                <div className="p-4 border-b border-gray-100">
                    <form onSubmit={handleSearch} className="relative">
                        <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Cari GIF... (contoh: happy, love, thank you)"
                            className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all"
                        />
                    </form>
                </div>

                {/* GIF Grid */}
                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                    {loading ? (
                        <div className="flex items-center justify-center h-64">
                            <div className="w-12 h-12 rounded-full border-4 border-gray-100 border-t-blue-500 animate-spin"></div>
                        </div>
                    ) : gifs.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-64 text-center">
                            <p className="text-gray-500 font-medium">Tidak ada GIF ditemukan</p>
                            <p className="text-sm text-gray-400 mt-1">Coba kata kunci lain</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {gifs.map((gif) => (
                                <button
                                    key={gif.id}
                                    onClick={() => handleSelectGif(gif)}
                                    className="relative aspect-square rounded-xl overflow-hidden hover:ring-4 hover:ring-blue-500 transition-all transform hover:scale-105 bg-gray-100"
                                >
                                    <img
                                        src={gif.images.fixed_height.url}
                                        alt="GIF"
                                        className="w-full h-full object-cover"
                                    />
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-100 text-center">
                    <p className="text-xs text-gray-400">
                        Tekan GIF untuk memilih
                    </p>
                </div>
            </div>
        </div>
    );
};

export default GifPicker;
