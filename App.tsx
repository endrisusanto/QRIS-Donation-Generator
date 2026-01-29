import React, { useState, useEffect, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Cog6ToothIcon, ArrowDownTrayIcon, ShareIcon, GifIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { generateDynamicQRIS, formatRupiah } from './utils/qris';
import { QRISConfig, PRESET_AMOUNTS, MIN_DONATION } from './types';
import { SettingsModal } from './components/SettingsModal';
import RecentDonations from './components/RecentDonations';
import DonationPopup from './components/DonationPopup';
import GifPicker from './components/GifPicker';
import { useRecentDonations } from './hooks/useRecentDonations';
import { DEFAULT_QRIS_PAYLOAD } from './constants';

const App: React.FC = () => {
  const [amount, setAmount] = useState<number | ''>(50000);
  const [donorName, setDonorName] = useState<string>('');
  const [donorMessage, setDonorMessage] = useState<string>('');
  const [selectedGif, setSelectedGif] = useState<string>('');
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [qrisConfig, setQrisConfig] = useState<QRISConfig | null>(null);
  const [generatedQR, setGeneratedQR] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [qrExpiresAt, setQrExpiresAt] = useState<Date | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);

  const qrRef = useRef<HTMLDivElement>(null);

  const { donations, loading, newDonation, setNewDonation, triggerTestDonation, resetTracking } = useRecentDonations();

  useEffect(() => {
    if (newDonation) {
      console.log('🎉 New donation detected, showing popup:', newDonation);
      setShowSuccessPopup(true);
    }
  }, [newDonation]);


  // Load config from local storage on mount
  useEffect(() => {
    const saved = localStorage.getItem('qris_config');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Validate that the saved QRIS ends with proper checksum format
        if (parsed.rawString && parsed.rawString.includes('6304')) {
          setQrisConfig(parsed);
        } else {
          // Invalid saved config, use default
          console.log('Invalid saved config, using default');
          const defaultConfig = { rawString: DEFAULT_QRIS_PAYLOAD };
          setQrisConfig(defaultConfig);
          localStorage.setItem('qris_config', JSON.stringify(defaultConfig));
        }
      } catch (e) {
        // Parse error, use default
        const defaultConfig = { rawString: DEFAULT_QRIS_PAYLOAD };
        setQrisConfig(defaultConfig);
        localStorage.setItem('qris_config', JSON.stringify(defaultConfig));
      }
    } else {
      // Use default configuration from constants
      const defaultConfig = { rawString: DEFAULT_QRIS_PAYLOAD };
      setQrisConfig(defaultConfig);
      localStorage.setItem('qris_config', JSON.stringify(defaultConfig));
    }
  }, []);

  const handleSaveConfig = (config: QRISConfig) => {
    setQrisConfig(config);
    localStorage.setItem('qris_config', JSON.stringify(config));
    setGeneratedQR(null); // Reset generated QR when config changes
  };

  const handleAmountChange = (val: number | '') => {
    setAmount(val);
    if (generatedQR) setGeneratedQR(null);
  };

  const handleGenerate = () => {
    if (!qrisConfig) {
      setIsSettingsOpen(true);
      return;
    }

    const numAmount = Number(amount);
    if (!numAmount || numAmount < MIN_DONATION) {
      alert(`Minimal donasi adalah ${formatRupiah(MIN_DONATION)}`);
      return;
    }

    // Create session data for transaction matching
    const generatedAt = new Date();
    const expiresAt = new Date(generatedAt.getTime() + 10 * 60 * 1000); // 10 minutes

    console.log('📝 Creating QR session:', {
      generatedAt: generatedAt.toISOString(),
      expiresAt: expiresAt.toISOString(),
      amount: numAmount
    });

    const sessionData = {
      amount: numAmount,
      generatedAt: generatedAt.toISOString(),
      expiresAt: expiresAt.toISOString(),
      donorName,
      donorMessage,
      gifUrl: selectedGif
    };

    // Reset tracking to allow detection of new donations
    resetTracking();

    localStorage.setItem('qris_session', JSON.stringify(sessionData));
    setQrExpiresAt(expiresAt);

    const dynamicQR = generateDynamicQRIS(qrisConfig.rawString, numAmount);
    setGeneratedQR(dynamicQR);
    window.scrollTo(0, 0);
  };

  // Timer countdown effect
  useEffect(() => {
    if (!qrExpiresAt) return;

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const expiry = qrExpiresAt.getTime();
      const remaining = Math.max(0, Math.floor((expiry - now) / 1000));

      setTimeRemaining(remaining);

      if (remaining === 0) {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [qrExpiresAt]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const downloadQR = () => {
    const svg = qrRef.current?.querySelector("svg");
    if (svg) {
      const svgData = new XMLSerializer().serializeToString(svg);
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const img = new Image();
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        if (ctx) {
          ctx.fillStyle = "white";
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0);
          const pngFile = canvas.toDataURL("image/png");
          const downloadLink = document.createElement("a");
          downloadLink.download = `qris-${amount}.png`;
          downloadLink.href = pngFile;
          downloadLink.click();
        }
      };
      img.src = "data:image/svg+xml;base64," + btoa(svgData);
    }
  };

  // Render Content based on state
  const renderMainContent = () => {
    if (generatedQR) {
      // QR Result View
      return (
        <div className="w-full bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden relative">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>
          <div className="p-8 flex flex-col items-center text-center space-y-8">

            <div className="space-y-2">
              <h1 className="text-xl font-bold text-gray-900">Scan QRIS untuk Donasi</h1>
              <p className="text-gray-500 text-sm">Nominal Donasi</p>
              <p className="text-4xl font-black text-gray-900 tracking-tight">{formatRupiah(Number(amount))}</p>

              {/* Donor Info */}
              {(donorName || donorMessage) && (
                <div className="mt-4 bg-blue-50 border border-blue-100 rounded-2xl p-4 text-left space-y-2">
                  {donorName && (
                    <div>
                      <p className="text-xs text-blue-600 font-semibold uppercase tracking-wide">Nama Donatur</p>
                      <p className="text-gray-900 font-bold">{donorName}</p>
                    </div>
                  )}
                  {donorMessage && (
                    <div>
                      <p className="text-xs text-blue-600 font-semibold uppercase tracking-wide">Pesan</p>
                      <p className="text-gray-700 italic">"{donorMessage}"</p>
                    </div>
                  )}
                </div>
              )}

              {/* Timer Display */}
              <div className="pt-2">
                {timeRemaining > 0 ? (
                  <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-full text-sm font-bold animate-pulse">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {formatTime(timeRemaining)}
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-2 bg-red-50 text-red-700 px-4 py-2 rounded-full text-sm font-bold">
                    ⚠️ Expired
                  </div>
                )}
              </div>
            </div>

            <div
              className={`bg-white p-4 rounded-3xl shadow-lg border border-gray-100 transition-all duration-500 ${timeRemaining === 0 ? 'blur-sm grayscale opacity-75' : 'hover:scale-105'}`}
              ref={qrRef}
            >
              <QRCodeSVG
                value={generatedQR}
                size={240}
                level={"M"}
                includeMargin={true}
                className="rounded-2xl"
              />
            </div>

            {timeRemaining > 0 && (
              <button onClick={downloadQR} className="text-sm font-semibold text-gray-500 hover:text-blue-600 flex items-center gap-2 transition-colors py-2 px-4 rounded-xl hover:bg-gray-50">
                <ArrowDownTrayIcon className="h-5 w-5" />
                Simpan QRIS
              </button>
            )}

            <div className="w-full bg-gray-50/50 rounded-2xl p-6 border border-gray-100 text-left space-y-4">
              <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                <span className="flex-none w-6 h-6 rounded-full bg-gray-900 text-white flex items-center justify-center text-xs">?</span>
                Cara Pembayaran
              </h3>
              <ol className="space-y-3 text-sm text-gray-600 list-decimal list-inside marker:font-bold marker:text-gray-400">
                <li>Buka aplikasi e-wallet / banking favoritmu</li>
                <li>Scan QR code di atas</li>
                <li>Periksa nama merchant & nominal</li>
                <li>Selesaikan pembayaran</li>
              </ol>
            </div>

            <button
              onClick={() => setGeneratedQR(null)}
              className="w-full py-4 bg-gray-900 text-white font-bold rounded-2xl hover:bg-black transform transition-all active:scale-[0.98] shadow-xl shadow-gray-200 flex items-center justify-center gap-2 group"
            >
              <span>Buat Donasi Baru</span>
            </button>
          </div>
        </div>
      );
    }

    // Input View
    return (
      <div className="w-full bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-gray-200 to-gray-100"></div>

        {/* Input Section */}
        <div className="p-6 sm:p-8 space-y-8">

          {/* Header inside card for mobile focus */}
          <div className="space-y-1">
            <h2 className="text-2xl font-bold text-gray-900">Buat QRIS Donasi</h2>
            <p className="text-gray-500 text-sm">Masukan nominal untuk membuat kode pembayaran</p>
          </div>

          <div className="space-y-4">
            <label className="block text-sm font-medium text-gray-700">
              Nominal Donasi
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                <span className="text-gray-400 font-bold text-xl">Rp</span>
              </div>
              <input
                type="text"
                value={amount === '' ? '' : amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')}
                onChange={(e) => {
                  const value = e.target.value.replace(/\./g, ''); // Remove dots
                  if (value === '') {
                    handleAmountChange('');
                  } else if (/^\d+$/.test(value)) {
                    handleAmountChange(parseInt(value));
                  }
                }}
                className="block w-full pl-14 pr-4 py-5 text-3xl font-bold text-gray-900 bg-gray-50 border-2 border-transparent focus:border-blue-500 rounded-2xl focus:ring-0 outline-none transition-all placeholder-gray-300"
                placeholder="0"
              />
            </div>
            {/* Preset Buttons */}
            <div className="grid grid-cols-4 gap-2 sm:gap-3">
              {PRESET_AMOUNTS.map((val) => (
                <button
                  key={val}
                  onClick={() => handleAmountChange(val)}
                  className={`py-2 px-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 border ${amount === val
                    ? 'bg-gray-900 text-white border-gray-900 shadow-md transform scale-105'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                >
                  {val / 1000}k
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Nama Donatur <span className="text-gray-400 font-normal">(Opsional)</span></label>
              <input
                type="text"
                value={donorName}
                onChange={(e) => setDonorName(e.target.value)}
                className="block w-full px-4 py-3 text-base text-gray-900 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all"
                placeholder="Nama Anda"
                maxLength={50}
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Pesan <span className="text-gray-400 font-normal">(Opsional)</span></label>
              <textarea
                value={donorMessage}
                onChange={(e) => setDonorMessage(e.target.value)}
                className="block w-full px-4 py-3 text-base text-gray-900 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all resize-none"
                placeholder="Tulis pesan semangat..."
                rows={2}
                maxLength={200}
              />
            </div>

            {/* GIF Picker */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">GIF <span className="text-gray-400 font-normal">(Opsional)</span></label>

              {selectedGif ? (
                <div className="relative rounded-xl overflow-hidden border-2 border-gray-200 bg-gray-50">
                  <img
                    src={selectedGif}
                    alt="Selected GIF"
                    className="w-full h-auto max-h-80 object-contain"
                  />
                  <button
                    onClick={() => setSelectedGif('')}
                    className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-lg"
                  >
                    <XMarkIcon className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowGifPicker(true)}
                  className="w-full px-4 py-3 bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-dashed border-purple-200 rounded-xl hover:border-purple-400 transition-all flex items-center justify-center gap-2 text-purple-600 font-medium"
                >
                  <GifIcon className="h-5 w-5" />
                  Pilih GIF
                </button>
              )}
            </div>
          </div>

          <button
            onClick={handleGenerate}
            className="w-full py-4 bg-gray-900 text-white font-bold rounded-2xl hover:bg-black transform transition-all active:scale-[0.99] shadow-xl shadow-gray-200 flex items-center justify-center gap-2 text-lg"
          >
            Generate QRIS
          </button>

          {!qrisConfig && (
            <div className="flex items-center gap-3 p-3 bg-red-50 text-red-600 rounded-xl text-sm border border-red-100">
              <Cog6ToothIcon className="h-5 w-5 flex-none" />
              <p>Konfigurasi QRIS belum diatur. Silakan klik ikon gear di pojok kanan atas.</p>
            </div>
          )}

        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-gray-900 font-sans selection:bg-blue-100 selection:text-blue-900">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">

        {/* Navbar / Header */}
        <header className="flex justify-between items-center mb-8 lg:mb-12">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-xl shadow-lg shadow-blue-500/10 flex items-center justify-center overflow-hidden border border-gray-100">
              <img src="/favicon.png" alt="Logo" className="w-8 h-8 object-contain" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-gray-900">Endri Susanto</h1>
              <p className="text-xs text-gray-500 font-medium">Saweran & Donasi</p>
            </div>
          </div>
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="p-2.5 bg-white text-gray-500 hover:text-gray-900 hover:bg-gray-50 border border-gray-200 rounded-xl transition-all shadow-sm hover:shadow"
            aria-label="Pengaturan"
          >
            <Cog6ToothIcon className="h-6 w-6" />
          </button>
        </header>

        {/* content Grid */}
        <main className="flex flex-col md:flex-row gap-8 items-start relative">

          {/* Left Column: Generator / Result */}
          <div className="flex-1 w-full min-w-0 order-1 md:order-1">
            {renderMainContent()}

            {/* Footer Message */}
            <div className="mt-12 text-center space-y-2">
              <p className="text-gray-400 text-sm font-medium">Dibuat dengan ❤️ untuk komunitas</p>
            </div>
          </div>

          {/* Right Column: Recent Donations (Desktop: Sticky Sidebar, Mobile: Stacked below) */}
          <div className="w-full md:w-[350px] lg:w-[400px] flex-none order-2 md:order-2 md:sticky md:top-8 transition-all duration-300">
            <RecentDonations
              donations={donations}
              loading={loading}
              onTriggerTest={triggerTestDonation}
              className="h-full"
            />
          </div>

        </main>
      </div>

      {/* Modals */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onSave={handleSaveConfig}
        initialConfig={qrisConfig}
      />

      <DonationPopup
        donation={newDonation}
        onClose={() => {
          setShowSuccessPopup(false);
          setNewDonation(null);
          setGeneratedQR(null); // Reset to new donation form
          setDonorName('');
          setDonorMessage('');
          setSelectedGif('');
          setAmount('');
        }}
      />

      {showGifPicker && (
        <GifPicker
          onSelect={(gifUrl) => setSelectedGif(gifUrl)}
          onClose={() => setShowGifPicker(false)}
        />
      )}
    </div>
  );
};

export default App;