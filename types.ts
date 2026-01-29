export interface QRISConfig {
  rawString: string;
  merchantName?: string;
}

export interface DonationState {
  amount: number;
  generatedQR: string | null;
  error: string | null;
}

export const PRESET_AMOUNTS = [10000, 25000, 50000, 100000];
export const MIN_DONATION = 100;

export interface Donation {
  id: number;
  app_name: string;
  title: string;
  text: string;
  amount_detected: string;
  created_at: string;
  donorName?: string;
  message?: string;
  gifUrl?: string;
}