import { Product, ProductStatus, StatMetric, Collection } from '../types';

export const MOCK_PRODUCTS: Product[] = [
  {
    id: 'prod_1',
    title: 'Alpenluft Premium Diffuser - Zirbenholz Edition',
    description: '<p>Holen Sie sich die Frische der Schweizer Alpen nach Hause. Dieser handgefertigte Diffuser aus echtem Bündner Zirbenholz sorgt nicht nur für einen angenehmen Duft, sondern auch für ein natürliches Raumklima.</p>',
    sku: 'DIF-001-CH',
    price: 129.90,
    compareAtPrice: 149.90,
    currency: 'CHF',
    status: ProductStatus.ACTIVE,
    inventory: 45,
    imageUrl: 'https://picsum.photos/400/400?random=1',
    images: ['https://picsum.photos/400/400?random=1', 'https://picsum.photos/400/400?random=11'],
    tags: ['Wohnen', 'Wellness', 'Swiss Made', 'Holz'],
    vendor: 'AlpenManufaktur',
    productType: 'Home & Garden',
    handle: 'alpenluft-diffuser-zirbenholz',
    seoScore: 85,
    metafields: {
      articleNumber: 'ART-1001',
      seoTitle: 'Zirbenholz Diffuser kaufen | Original Schweizer Qualität',
      seoDescription: 'Handgefertigter Aroma-Diffuser aus echtem Bündner Zirbenholz. Natürliches Raumklima für Ihr Zuhause. Jetzt online bestellen.',
      google: {
        gtin: '7640123456789',
        googleProductCategory: '568', // Home Fragrance Accessories
        condition: 'new',
        identifierExists: true
      }
    }
  },
  {
    id: 'prod_2',
    title: 'Gletscherwasser Gesichtscreme',
    description: 'Belebende Feuchtigkeitspflege mit reinem Gletscherwasser.',
    sku: 'COS-GLA-50',
    price: 49.50,
    currency: 'CHF',
    status: ProductStatus.ACTIVE,
    inventory: 12,
    imageUrl: 'https://picsum.photos/400/400?random=2',
    images: ['https://picsum.photos/400/400?random=2'],
    tags: ['Kosmetik', 'Gesichtspflege', 'Bio'],
    vendor: 'SwissPure',
    productType: 'Health & Beauty',
    handle: 'gletscherwasser-gesichtscreme',
    seoScore: 62,
    metafields: {
      articleNumber: 'ART-1002',
      seoTitle: 'Gesichtscreme Gletscherwasser',
      seoDescription: '', // Missing for SEO demo
      google: {
        identifierExists: false,
        customLabel0: 'Best Seller'
      }
    }
  },
  {
    id: 'prod_3',
    title: 'Fondue-Set "Heidi" Keramik',
    description: 'Klassisches Caquelon für gemütliche Abende.',
    sku: 'KIT-FON-04',
    price: 89.00,
    currency: 'CHF',
    status: ProductStatus.DRAFT,
    inventory: 100,
    imageUrl: 'https://picsum.photos/400/400?random=3',
    images: ['https://picsum.photos/400/400?random=3'],
    tags: ['Küche', 'Winter', 'Klassiker'],
    vendor: 'HaushaltPro',
    productType: 'Kitchenware',
    handle: 'fondue-set-heidi',
    seoScore: 45,
    metafields: {
        seoTitle: 'Fondue Set',
        google: {
            identifierExists: false
        }
    }
  },
  {
    id: 'prod_4',
    title: 'Merino Wandersocken Pro',
    description: 'Atmungsaktive Socken für lange Wanderungen.',
    sku: 'CLO-SOC-M',
    price: 24.90,
    currency: 'CHF',
    status: ProductStatus.ACTIVE,
    inventory: 230,
    imageUrl: 'https://picsum.photos/400/400?random=4',
    images: ['https://picsum.photos/400/400?random=4'],
    tags: ['Sport', 'Outdoor', 'Kleidung'],
    vendor: 'AlpenSport',
    productType: 'Apparel',
    handle: 'merino-wandersocken',
    seoScore: 92,
    metafields: {
      articleNumber: 'ART-1004',
      seoTitle: 'Merino Wandersocken kaufen',
      seoDescription: 'Beste Qualität für Ihre Füsse.'
    }
  },
  {
    id: 'prod_5',
    title: 'Schokolade Geschenkbox "Grand Cru"',
    description: 'Feinste Pralinen Auswahl.',
    sku: 'FOO-CHO-BX',
    price: 55.00,
    currency: 'CHF',
    status: ProductStatus.ARCHIVED,
    inventory: 0,
    imageUrl: 'https://picsum.photos/400/400?random=5',
    images: ['https://picsum.photos/400/400?random=5'],
    tags: ['Lebensmittel', 'Geschenk', 'Süsswaren'],
    vendor: 'ChocoArt',
    productType: 'Food',
    handle: 'schokolade-box-grand-cru',
    seoScore: 78,
    metafields: {
      articleNumber: 'ART-1005'
    }
  }
];

export const MOCK_COLLECTIONS: Collection[] = [
  { id: 'col_1', title: 'Winter Sale 2024', type: 'smart', productsCount: 145, image: 'https://picsum.photos/200/200?random=1' },
  { id: 'col_2', title: 'Neuheiten', type: 'smart', productsCount: 24, image: 'https://picsum.photos/200/200?random=2' },
  { id: 'col_3', title: 'Swiss Made', type: 'custom', productsCount: 56, image: 'https://picsum.photos/200/200?random=3' },
  { id: 'col_4', title: 'Geschenkideen', type: 'custom', productsCount: 33, image: 'https://picsum.photos/200/200?random=4' },
];

export const MOCK_STATS: StatMetric[] = [
  {
    label: 'Gesamtumsatz (MTD)',
    value: 'CHF 12\'450',
    trend: 12.5,
    icon: 'DollarSign',
    color: 'emerald'
  },
  {
    label: 'Aktive Produkte',
    value: '1\'240',
    trend: 3.2,
    icon: 'Package',
    color: 'indigo'
  },
  {
    label: 'SEO Score (Ø)',
    value: '72/100',
    trend: -1.5,
    icon: 'Search',
    color: 'amber'
  },
  {
    label: 'KI-Optimierungen',
    value: '85',
    trend: 24.0,
    icon: 'Zap',
    color: 'rose'
  }
];