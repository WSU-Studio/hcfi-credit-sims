export type SimulationWizardLabels = {
  title: string;
  subtitle: string;
  stepDealer: string;
  stepModel: string;
  stepSpec: string;
  stepPrice: string;
  stepResult: string;
  back: string;
  stepOf: string;
  changeModel: string;
  leadAssetLoading: string;
  leadAssetError: string;
  leadAssetRetry: string;
  errorTitle: string;
  errorRetryHint: string;
  errorRetrySecondaryHint: string;
};

export const DEALER_QUOTATION_LABELS: SimulationWizardLabels = {
  title: 'Quotation / Simulasi Kredit',
  subtitle: 'Buat penawaran kredit untuk pelanggan — dealer & cabang sudah terisi otomatis',
  stepDealer: 'Dealer',
  stepModel: 'Model',
  stepSpec: 'Spesifikasi',
  stepPrice: 'Harga',
  stepResult: 'Hasil',
  back: 'Kembali',
  stepOf: 'Langkah {current} dari {total}',
  changeModel: 'Ganti Model',
  leadAssetLoading: 'Menyiapkan data quotation...',
  leadAssetError: 'Gagal menyiapkan quotation. Silakan coba lagi.',
  leadAssetRetry: 'Coba Lagi',
  errorTitle: 'Terjadi Kesalahan',
  errorRetryHint: 'Periksa koneksi internet Anda lalu coba lagi.',
  errorRetrySecondaryHint: 'Jika masalah berlanjut, hubungi tim support.',
};

export const PRE_SIMULATION_LABELS: SimulationWizardLabels = {
  title: 'Pre-Simulasi Event',
  subtitle:
    'Siapkan simulasi kredit untuk event/motorshow — hasilnya bisa dibagikan sebagai link & QR code',
  stepDealer: 'Dealer',
  stepModel: 'Model',
  stepSpec: 'Spesifikasi',
  stepPrice: 'Harga',
  stepResult: 'Hasil',
  back: 'Kembali',
  stepOf: 'Langkah {current} dari {total}',
  changeModel: 'Ganti Model',
  leadAssetLoading: 'Menyiapkan pre-simulasi...',
  leadAssetError: 'Gagal menyiapkan pre-simulasi. Silakan coba lagi.',
  leadAssetRetry: 'Coba Lagi',
  errorTitle: 'Terjadi Kesalahan',
  errorRetryHint: 'Periksa koneksi internet Anda lalu coba lagi.',
  errorRetrySecondaryHint: 'Jika masalah berlanjut, hubungi tim support.',
};

export function formatStepOf(
  template: string,
  current: number,
  total: number
): string {
  return template
    .replace('{current}', String(current))
    .replace('{total}', String(total));
}
