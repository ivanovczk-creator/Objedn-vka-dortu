import { CakeShape, FillingType, Location, SpongeType, SurfaceType } from "./types";

export const LOCATIONS: Location[] = [
  {
    id: 'petrvald',
    name: 'Petřvald',
    address: 'Šenovská 1',
    phone: '778 157 857',
    type: 'store'
  },
  {
    id: 'karvina',
    name: 'Karviná',
    address: 'Tř. Těreškovové 2233/28',
    phone: '778 157 867',
    type: 'store'
  },
  {
    id: 'ostrava',
    name: 'Ostrava Zábřeh',
    address: 'Výškovická 116A',
    phone: '775 271 101',
    type: 'store'
  },
  {
    id: 'pist',
    name: 'Píšť (Výrobna)',
    address: 'Opavská 218/101',
    phone: '602 323 788',
    type: 'factory'
  }
];

export const SHAPES = Object.values(CakeShape);
export const FILLINGS = Object.values(FillingType);
export const SPONGES = Object.values(SpongeType);
export const SURFACES = Object.values(SurfaceType);

export const CAKE_COLORS = [
  { name: 'Bílá', hex: '#FFFFFF' },
  { name: 'Šedá', hex: '#9CA3AF' },
  { name: 'Černá', hex: '#000000' },
  { name: 'Růžová', hex: '#F472B6' },
  { name: 'Červená', hex: '#EF4444' },
  { name: 'Hnědá', hex: '#854d0e' },
  { name: 'Oranžová', hex: '#F97316' },
  { name: 'Modrá', hex: '#3B82F6' },
  { name: 'Fialová', hex: '#A855F7' },
  { name: 'Zelená', hex: '#22C55E' },
  { name: 'Žlutá', hex: '#EAB308' },
];

export const SHAVINGS_OPTIONS = ["Bílá", "Hnědá", "Růžová"];
export const DRIP_OPTIONS = ["Tmavá čokoláda", "Bílá čokoláda"];

// Sizes in cm (strings to match type definition)
// Round: 14, 16, 18, 22, 24, 26
export const ROUND_SIZES = ["26", "24", "22", "18", "16", "14"]; 

// Square: 16, 20, 24, 28
export const SQUARE_SIZES = ["28", "24", "20", "16"];

// Rectangle options
export const RECTANGLE_SIZES = ["60x40", "40x30", "Jiné"];

// Heart sizes: 24, 18, 16
export const HEART_SIZES = ["24", "18", "16"];