import React, { useState, useEffect, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Cog6ToothIcon, ArrowDownTrayIcon, ShareIcon } from '@heroicons/react/24/outline';
import { generateDynamicQRIS, formatRupiah } from './utils/qris';
import { QRISConfig, PRESET_AMOUNTS, MIN_DONATION } from './types';
import { SettingsModal } from './components/SettingsModal';
import RecentDonations from './components/RecentDonations';
import { DEFAULT_QRIS_PAYLOAD } from './constants';

const App: React.FC = () => {
  const [amount, setAmount] = useState<number | ''>(50000);
  const [donorName, setDonorName] = useState<string>('');
  const [donorMessage, setDonorMessage] = useState<string>('');
  const [qrisConfig, setQrisConfig] = useState<QRISConfig | null>(null);
  const [generatedQR, setGeneratedQR] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [qrExpiresAt, setQrExpiresAt] = useState<Date | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [hasDonations, setHasDonations] = useState<boolean>(false);
  const qrRef = useRef<HTMLDivElement>(null);

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
    const sessionData = {
      amount: numAmount,
      generatedAt: generatedAt.toISOString(),
      expiresAt: expiresAt.toISOString(),
      donorName,
      donorMessage
    };

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

  // Result View
  if (generatedQR) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center py-8 px-4 sm:px-6 lg:px-8">
        {/* Main Content - Dynamically centered or side-by-side */}
        <div className={`w-full max-w-6xl flex flex-col gap-6 ${hasDonations ? 'lg:flex-row' : 'lg:items-center'}`}>
          {/* QR Card */}
          <div className={`w-full ${hasDonations ? 'lg:flex-1' : 'lg:max-w-md'}`}>
            <div className="w-full bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
              <div className="p-8 flex flex-col items-center text-center space-y-6">

                <div className="space-y-1">
                  <h1 className="text-xl font-bold text-gray-900">Scan QRIS untuk Donasi</h1>
                  <p className="text-gray-500 text-sm">Nominal:</p>
                  <p className="text-3xl font-extrabold text-gray-900">{formatRupiah(Number(amount))}</p>

                  {/* Timer Display */}
                  {timeRemaining > 0 ? (
                    <div className="mt-3 inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-full text-sm font-semibold">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Berlaku: {formatTime(timeRemaining)}
                    </div>
                  ) : (
                    <div className="mt-3 inline-flex items-center gap-2 bg-red-50 text-red-700 px-4 py-2 rounded-full text-sm font-semibold">
                      ⚠️ QR Code Expired
                    </div>
                  )}
                </div>

                <div
                  className={`bg-white p-4 rounded-2xl shadow-sm border border-gray-200 transition-all duration-500 ${timeRemaining === 0 ? 'blur-md opacity-50' : ''}`}
                  ref={qrRef}
                >
                  <QRCodeSVG
                    value={generatedQR}
                    size={220}
                    level={"M"}
                    includeMargin={true}
                    className="rounded-lg"
                  />
                </div>

                {timeRemaining > 0 && (
                  <div className="flex gap-4 text-sm text-gray-500">
                    <button onClick={downloadQR} className="hover:text-blue-600 flex items-center gap-1 transition-colors">
                      <ArrowDownTrayIcon className="h-4 w-4" /> Simpan Gambar
                    </button>
                  </div>
                )}

                <div className="w-full text-left bg-gray-50 rounded-xl p-5 border border-gray-100">
                  <h3 className="font-semibold text-gray-900 mb-3 text-sm">Cara Pembayaran:</h3>
                  <ul className="space-y-3 text-sm text-gray-600">
                    <li className="flex gap-3 items-start">
                      <span className="flex-none bg-gray-200 text-gray-700 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold mt-0.5">1</span>
                      <span>Buka aplikasi mobile banking atau e-wallet Anda</span>
                    </li>
                    <li className="flex gap-3 items-start">
                      <span className="flex-none bg-gray-200 text-gray-700 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold mt-0.5">2</span>
                      <span>Pilih menu QRIS atau Scan QR</span>
                    </li>
                    <li className="flex gap-3 items-start">
                      <span className="flex-none bg-gray-200 text-gray-700 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold mt-0.5">3</span>
                      <span>Scan QR code di atas</span>
                    </li>
                    <li className="flex gap-3 items-start">
                      <span className="flex-none bg-gray-200 text-gray-700 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold mt-0.5">4</span>
                      <span>Konfirmasi pembayaran</span>
                    </li>
                  </ul>
                </div>

                <button
                  onClick={() => setGeneratedQR(null)}
                  className="w-full py-3 bg-white border border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all flex items-center justify-center gap-2 shadow-sm"
                >
                  ← Donasi Lagi
                </button>
              </div>
            </div>
          </div>

          {/* Right Side - Recent Donations (Desktop) */}
          {hasDonations && (
            <div className="hidden lg:block lg:w-96">
              <RecentDonations onDonationsChange={setHasDonations} />
            </div>
          )}
        </div>

        {/* Recent Donations (Mobile) */}
        <div className="w-full max-w-6xl lg:hidden mt-8">
          <RecentDonations onDonationsChange={setHasDonations} />
        </div>
      </div>
    );
  }

  // Input View
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center py-8 px-4 sm:px-6 lg:px-8">

      {/* Header - Dynamic width matching card */}
      <div className={`w-full flex flex-col gap-6 mb-6 ${hasDonations ? 'max-w-6xl' : 'max-w-6xl lg:items-center'}`}>
        <div className={`w-full ${hasDonations ? '' : 'lg:max-w-md'} flex justify-between items-center`}>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">QRIS Donasi</h1>
            <p className="text-sm text-gray-500">Buat kode QRIS dengan nominal kustom</p>
          </div>
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all"
            title="Pengaturan QRIS"
          >
            <Cog6ToothIcon className="h-6 w-6" />
          </button>
        </div>
      </div>

      {/* Main Content - Dynamically centered or side-by-side */}
      <div className={`w-full max-w-6xl flex flex-col gap-6 ${hasDonations ? 'lg:flex-row' : 'lg:items-center'}`}>
        {/* Main Form */}
        <div className={`w-full ${hasDonations ? 'lg:flex-1' : 'lg:max-w-md'}`}>
          {/* Main Card */}
          <div className="w-full bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">

            {/* Input Section */}
            <div className="p-6 sm:p-8 space-y-6">

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">
                  Nominal Donasi
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <span className="text-gray-400 font-bold text-lg">Rp</span>
                  </div>
                  <input
                    type="number"
                    min={MIN_DONATION}
                    value={amount}
                    onChange={(e) => handleAmountChange(e.target.value === '' ? '' : parseInt(e.target.value))}
                    className="block w-full pl-12 pr-4 py-4 text-2xl font-bold text-gray-900 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all placeholder-gray-300"
                    placeholder="0"
                  />
                </div>
                <p className="mt-2 text-xs text-gray-400 text-right">
                  Minimal donasi {formatRupiah(MIN_DONATION)}
                </p>
              </div>

              {/* Donor Name Input */}
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">
                  Nama Donatur (Opsional)
                </label>
                <input
                  type="text"
                  value={donorName}
                  onChange={(e) => setDonorName(e.target.value)}
                  className="block w-full px-4 py-3 text-base text-gray-900 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all placeholder-gray-300"
                  placeholder="Nama Anda"
                  maxLength={50}
                />
              </div>

              {/* Donor Message Input */}
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">
                  Pesan / Catatan (Opsional)
                </label>
                <textarea
                  value={donorMessage}
                  onChange={(e) => setDonorMessage(e.target.value)}
                  className="block w-full px-4 py-3 text-base text-gray-900 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all placeholder-gray-300 resize-none"
                  placeholder="Tulis pesan Anda..."
                  rows={3}
                  maxLength={200}
                />
                <p className="mt-1 text-xs text-gray-400 text-right">
                  {donorMessage.length}/200 karakter
                </p>
              </div>

              {/* Preset Buttons */}
              <div className="grid grid-cols-2 gap-3">
                {PRESET_AMOUNTS.map((val) => (
                  <button
                    key={val}
                    onClick={() => handleAmountChange(val)}
                    className={`py-3 px-4 rounded-xl text-sm font-semibold transition-all duration-200 ${amount === val
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-200 transform scale-[1.02]'
                      : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300'
                      }`}
                  >
                    {formatRupiah(val)}
                  </button>
                ))}
              </div>

              {/* Generate Button */}
              <button
                onClick={handleGenerate}
                className="w-full py-4 bg-gray-900 text-white font-bold rounded-2xl hover:bg-black transform transition-all active:scale-[0.98] shadow-lg shadow-gray-200 flex items-center justify-center gap-2"
              >
                Generate QRIS
              </button>

              {!qrisConfig && (
                <p className="text-center text-xs text-red-500 bg-red-50 p-2 rounded-lg">
                  ⚠️ Anda belum mengatur kode QRIS dasar. Klik ikon gear di atas.
                </p>
              )}

            </div>
          </div>

          {/* Footer Message - Mobile only */}
          <div className="mt-6 text-center space-y-2 lg:hidden">
            <p className="text-gray-500 font-medium">Terima kasih atas dukungan Anda 🙏</p>
            <p className="text-xs text-gray-400">Pastikan nama merchant sesuai saat melakukan pembayaran.</p>
          </div>
        </div>

        {/* Right Side - Recent Donations (Desktop) */}
        {hasDonations && (
          <div className="hidden lg:block lg:w-96">
            <RecentDonations onDonationsChange={setHasDonations} />
          </div>
        )}
      </div>

      {/* Recent Donations (Mobile) */}
      <div className="w-full max-w-6xl lg:hidden mt-8">
        <RecentDonations onDonationsChange={setHasDonations} />
      </div>

      {/* Footer Message */}
      <div className="mt-8 text-center space-y-2 mb-8">
        <p className="text-gray-500 font-medium">Terima kasih atas dukungan Anda 🙏</p>
        <p className="text-xs text-gray-400">Pastikan nama merchant sesuai saat melakukan pembayaran.</p>
      </div>

      {/* Modals */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onSave={handleSaveConfig}
        initialConfig={qrisConfig}
      />
    </div>
  );
};

export default App;