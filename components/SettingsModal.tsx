import React, { useState, useEffect } from 'react';
import { QRISConfig } from '../types';
import { SETTINGS_PASSWORD } from '../constants';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (config: QRISConfig) => void;
  initialConfig: QRISConfig | null;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, onSave, initialConfig }) => {
  const [rawString, setRawString] = useState('');
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      // Reset auth state and values when modal opens
      setIsAuthenticated(false);
      setPassword('');
      setError('');
      if (initialConfig) {
        setRawString(initialConfig.rawString);
      }
    }
  }, [isOpen, initialConfig]);

  if (!isOpen) return null;

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === SETTINGS_PASSWORD) {
      setIsAuthenticated(true);
      setError('');
    } else {
      setError('Password salah!');
    }
  };

  const handleConfigSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ rawString });
    onClose();
  };

  if (!isAuthenticated) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm px-4">
        <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden">
          <div className="bg-gray-800 p-4">
            <h2 className="text-white text-lg font-bold">Akses Admin</h2>
            <p className="text-gray-400 text-xs">Masukkan password untuk mengubah pengaturan</p>
          </div>
          <form onSubmit={handlePasswordSubmit} className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                type="password"
                autoFocus
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                placeholder="••••••••"
              />
              {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
            </div>
            
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-black shadow-md transition-colors"
              >
                Masuk
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="bg-blue-600 p-4">
          <h2 className="text-white text-lg font-bold">Pengaturan QRIS</h2>
          <p className="text-blue-100 text-sm">Masukkan kode QRIS statis Anda</p>
        </div>
        <form onSubmit={handleConfigSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              QRIS Payload String
            </label>
            <textarea
              required
              value={rawString}
              onChange={(e) => setRawString(e.target.value)}
              placeholder="000201010211265700..."
              className="w-full h-32 p-3 text-xs font-mono border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
            />
            <p className="mt-2 text-xs text-gray-500">
              Salin kode text dari QRIS statis Anda (GoPay, Dana, ShopeePay, dll) dan tempel di sini.
            </p>
          </div>
          
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 shadow-md transition-colors"
            >
              Simpan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};