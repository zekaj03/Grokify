
export enum ProductStatus {
  ACTIVE = 'active',
  DRAFT = 'draft',
  ARCHIVED = 'archived'
}

export enum OptimizationTone {
  PROFESSIONAL = 'professional', // Sachlich
  CASUAL = 'casual', // Locker
  LUXURY = 'luxury' // Premium
}

export interface GoogleMerchantData {
  gtin?: string;
  mpn?: string;
  googleProductCategory?: string; // ID or path
  condition?: 'new' | 'refurbished' | 'used';
  customLabel0?: string;
  gender?: 'male' | 'female' | 'unisex';
  ageGroup?: 'adult' | 'kids' | 'toddler' | 'infant';
  identifierExists?: boolean;
}

export interface Product {
  id: string;
  title: string;
  description: string; // Added description
  sku: string;
  price: number;
  compareAtPrice?: number;
  currency: string;
  status: ProductStatus;
  inventory: number;
  imageUrl: string;
  images: string[]; // Multiple images
  tags: string[];
  vendor: string;
  productType: string;
  seoScore: number;
  handle: string; // URL slug
  metafields: {
    articleNumber?: string; // ART-XXXX
    seoTitle?: string;
    seoDescription?: string;
    google?: GoogleMerchantData;
  };
}

export interface StatMetric {
  label: string;
  value: string | number;
  trend: number; // Percentage
  icon: string; // Icon name
  color: 'indigo' | 'emerald' | 'amber' | 'rose';
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface Collection {
  id: string;
  title: string;
  type: 'custom' | 'smart';
  productsCount: number;
  image?: string;
}

export type ViewState = 'dashboard' | 'products' | 'optimizer' | 'seo' | 'marketing' | 'collections' | 'autopilot' | 'intelligence' | 'duplicates' | 'backup' | 'media';