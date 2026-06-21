export const DISCOUNT_TYPES = {
  FIXED: 'FIXED',
  PERCENT: 'PERCENT',
} as const;

export type DiscountType = (typeof DISCOUNT_TYPES)[keyof typeof DISCOUNT_TYPES];

/** Aligns with PriceStep max discount cap */
export const MAX_DISCOUNT_PERCENT = 0.25;

export type DealerPromotionRecord = {
  id: string;
  vendorCode: string;
  vendorName: string | null;
  assetCode: string;
  assetName: string | null;
  discountType: string;
  discountValue: number;
  maxDiscount: number | null;
  validFrom: Date | null;
  validTo: Date | null;
  isActive: boolean;
  notes: string | null;
};

export function isPromotionCurrentlyValid(
  promo: Pick<DealerPromotionRecord, 'isActive' | 'validFrom' | 'validTo'>,
  at: Date = new Date()
): boolean {
  if (!promo.isActive) return false;
  if (promo.validFrom && at < promo.validFrom) return false;
  if (promo.validTo && at > promo.validTo) return false;
  return true;
}

export function calculatePromotionDiscount(
  otrPrice: number,
  promo: Pick<DealerPromotionRecord, 'discountType' | 'discountValue' | 'maxDiscount'>
): number {
  if (otrPrice <= 0) return 0;

  let discount = 0;
  if (promo.discountType === DISCOUNT_TYPES.PERCENT) {
    discount = Math.floor(otrPrice * (promo.discountValue / 100));
    if (promo.maxDiscount != null && discount > promo.maxDiscount) {
      discount = Math.floor(promo.maxDiscount);
    }
  } else {
    discount = Math.floor(promo.discountValue);
  }

  const maxAllowed = Math.floor(otrPrice * MAX_DISCOUNT_PERCENT);
  return Math.min(Math.max(0, discount), maxAllowed);
}

export function formatDiscountLabel(
  promo: Pick<DealerPromotionRecord, 'discountType' | 'discountValue' | 'maxDiscount'>
): string {
  if (promo.discountType === DISCOUNT_TYPES.PERCENT) {
    const base = `${promo.discountValue}%`;
    if (promo.maxDiscount != null) {
      return `${base} (max ${formatIdr(promo.maxDiscount)})`;
    }
    return base;
  }
  return formatIdr(promo.discountValue);
}

export function formatIdr(value: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(value);
}

export type DealerPromotionInput = {
  assetCode: string;
  assetName?: string | null;
  discountType: string;
  discountValue: number;
  maxDiscount?: number | null;
  validFrom?: string | null;
  validTo?: string | null;
  isActive?: boolean;
  notes?: string | null;
};

export function parseDealerPromotionInput(
  body: Record<string, unknown>
): DealerPromotionInput | { error: string } {
  const assetCode =
    typeof body.assetCode === 'string' ? body.assetCode.trim() : '';
  if (!assetCode) {
    return { error: 'Model mobil wajib dipilih' };
  }

  const discountType =
    typeof body.discountType === 'string' ? body.discountType.trim() : '';
  if (
    discountType !== DISCOUNT_TYPES.FIXED &&
    discountType !== DISCOUNT_TYPES.PERCENT
  ) {
    return { error: 'Tipe diskon tidak valid' };
  }

  const discountValue = Number(body.discountValue);
  if (!Number.isFinite(discountValue) || discountValue < 0) {
    return { error: 'Nilai diskon tidak valid' };
  }

  if (discountType === DISCOUNT_TYPES.PERCENT) {
    if (discountValue > MAX_DISCOUNT_PERCENT * 100) {
      return {
        error: `Diskon persen maksimal ${MAX_DISCOUNT_PERCENT * 100}%`,
      };
    }
  }

  let maxDiscount: number | null = null;
  if (body.maxDiscount !== undefined && body.maxDiscount !== null && body.maxDiscount !== '') {
    const parsed = Number(body.maxDiscount);
    if (!Number.isFinite(parsed) || parsed < 0) {
      return { error: 'Maksimal diskon tidak valid' };
    }
    maxDiscount = parsed;
  }

  const parseDate = (key: string): Date | null => {
    const v = body[key];
    if (v === undefined || v === null || v === '') return null;
    if (typeof v !== 'string') return null;
    const d = new Date(v);
    return Number.isNaN(d.getTime()) ? null : d;
  };

  const validFrom = parseDate('validFrom');
  const validTo = parseDate('validTo');
  if (validFrom && validTo && validFrom > validTo) {
    return { error: 'Tanggal mulai tidak boleh setelah tanggal berakhir' };
  }

  const assetName =
    typeof body.assetName === 'string' ? body.assetName.trim() || null : null;
  const notes =
    typeof body.notes === 'string' ? body.notes.trim() || null : null;

  return {
    assetCode,
    assetName,
    discountType,
    discountValue,
    maxDiscount,
    validFrom: body.validFrom === null ? null : (body.validFrom as string | undefined),
    validTo: body.validTo === null ? null : (body.validTo as string | undefined),
    isActive: body.isActive !== undefined ? Boolean(body.isActive) : true,
    notes,
  };
}

export function toPromotionDates(input: DealerPromotionInput): {
  validFrom: Date | null;
  validTo: Date | null;
} {
  const parse = (v?: string | null) => {
    if (!v) return null;
    const d = new Date(v);
    return Number.isNaN(d.getTime()) ? null : d;
  };
  return {
    validFrom: parse(input.validFrom),
    validTo: parse(input.validTo),
  };
}
