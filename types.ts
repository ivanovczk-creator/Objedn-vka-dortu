export enum CakeShape {
  ROUND = 'Kulatý',
  RECTANGLE = 'Obdélník',
  SQUARE = 'Čtverec',
  HEART = 'Srdíčko',
}

export enum FillingType {
  RASPBERRY = 'Malinová',
  CHOCOLATE = 'Čokoládová',
  CHERRY = 'Višňová',
  BLUEBERRY = 'Borůvková',
  PISTACHIO = 'Pistáciová',
  WALNUT = 'Ořechová',
  APRICOT = 'Meruňková',
  MANGO_PASSION = 'Mango-maracuja',
  VANILLA = 'Vanilková',
}

export enum SpongeType {
  CHOCOLATE = 'Čokoládový',
  VANILLA = 'Vanilkový',
  WALNUT = 'Ořechový',
  MOSS = 'Mechový',
  RED_VELVET = 'Red-Velvet',
}

export enum SurfaceType {
  CREAM = 'Krémový',
  CREAM_DRIP = 'Krémový a stékaná čokoláda',
  MARZIPAN = 'Marcipánový',
  CHOCO_SHAVINGS = 'Čoko-hobliny',
  EDIBLE_PRINT = 'Jedlý tisk',
  OTHER = 'Jiné',
}

export interface Location {
  id: string;
  name: string;
  address: string;
  phone: string;
  type: 'store' | 'factory';
}

export interface CakeImage {
  id: string;
  file: File;
  previewUrl: string;
}

export interface CakeOrder {
  images: CakeImage[];
  tiers: 1 | 2 | 3;
  tierSizes: string[]; // Strings to handle '24', '40x30', 'Custom'
  customSizeNote?: string; // For rectangle 'Jiné'
  shape: CakeShape;
  filling: FillingType;
  sponge: SpongeType;
  
  // Surface details
  surface: SurfaceType;
  surfaceOtherNote?: string;
  marzipanColor?: string; // For Marzipan
  creamColor?: string; // For Cream and Cream Drip
  dripType?: string; // For Cream Drip (Dark/White)
  shavingsType?: string; // For Choco Shavings (White/Brown/Pink)
  ediblePrintImage?: CakeImage; // For Edible Print

  inscription: string; 
  specifications: string;
  quantity: number;
  pickupDate: Date | null;
  pickupLocationId: string;
  
  // Contact Info
  customerName: string;
  customerPhone: string;
  customerEmail: string;
}

export const CZECH_HOLIDAYS = [
  "01-01", "01-05", "08-05", "05-07", "06-07", "28-09", "28-10", "17-11", "24-12", "25-12", "26-12"
];