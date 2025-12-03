export interface VariantOption {
  label: string;
  image_url?: string | null;
  price?: number | null; // optional price override (per litre)
}

export interface MeasurementOption {
  label: string;
  price?: number | null; // optional price override (per litre)
}

