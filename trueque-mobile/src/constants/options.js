export const MUNICIPIOS = ['Pasto', 'Ipiales', 'Túquerres'];

export const CORREGIMIENTOS_BY_MUNICIPIO = {
  Pasto: ['Catambuco', 'Genoy', 'Mapachico', 'Morasurco'],
  Ipiales: ['Las Lajas', 'San Juan', 'Yaramal', 'Sucumbíos'],
  'Túquerres': ['Santander', 'Yascual', 'Gualmatán', 'La Chorrera'],
};

export const TIPOS_SUELO = [
  'Franco',
  'Arcilloso',
  'Arenoso',
  'Limoso',
  'Franco-arcilloso',
  'Franco-arenoso',
];

export const CONDICIONES_CLIMATICAS = ['Húmedo', 'Seco', 'Templado', 'Frío', 'Cálido', 'Lluvioso'];

export const SISTEMAS_PRODUCTIVOS = [
  'Agroecológico',
  'Silvopastoril',
  'Prácticas ancestrales',
  'Convencional',
  'Mixto',
  'Forestal',
];

export const LIDERAZGO_OPTIONS = ['Mujeres', 'Jóvenes'];

export const PRACTICE_VALUES = ['Agroecológico', 'Silvopastoril', 'Prácticas ancestrales'];

export const APORTE_CATEGORIES = [
  {
    label: 'Semillas',
    value: 'semillas',
    unit: 'kg',
    placeholder: 'Ej: Fríjol cargamanto, Maíz amarillo',
    color: '#DBEAFE',
    textColor: '#1D4ED8',
  },
  {
    label: 'Verduras y hortalizas',
    value: 'verduras_hortalizas',
    unit: 'kg',
    placeholder: 'Ej: Lechuga, Zanahoria, Cebolla',
    color: '#DCFCE7',
    textColor: '#166534',
  },
  {
    label: 'Frutas',
    value: 'frutas',
    unit: 'kg',
    placeholder: 'Ej: Manzana, Lulo, Mora',
    color: '#FCE7F3',
    textColor: '#BE185D',
  },
  {
    label: 'Tubérculos',
    value: 'tuberculos',
    unit: 'kg',
    placeholder: 'Ej: Papa criolla, Ulluco, Yuca',
    color: '#FEF3C7',
    textColor: '#B45309',
  },
  {
    label: 'Procesados',
    value: 'procesados',
    unit: 'unidades',
    placeholder: 'Ej: Queso, Mermelada, Yogur',
    color: '#EDE9FE',
    textColor: '#6D28D9',
  },
  {
    label: 'Animales',
    value: 'animales',
    unit: 'unidades',
    placeholder: 'Ej: Gallinas, Cerdos, Conejos',
    color: '#FFEDD5',
    textColor: '#C2410C',
  },
];

export const HISTORICO_YEARS = ['2026', '2025', '2024', '2023', '2022'];

export const TIE_BREAKERS = [
  { label: 'Diversidad', value: 'diversity' },
  { label: 'Volumen', value: 'volume' },
  { label: 'Prácticas sostenibles', value: 'practices' },
  { label: 'Liderazgo (mujeres/jóvenes)', value: 'leadership' },
];

export const REGISTRO_TITLES = {
  pre: 'Pre‑registro de participantes',
  diaTrueque: 'Registro día del trueque',
};

export const REGISTRO_STEPS = {
  pre: [
    { number: 1, label: 'Cédula' },
    { number: 2, label: 'Perfil' },
    { number: 3, label: 'Aportes' },
  ],
  diaTrueque: [
    { number: 1, label: 'Cédula' },
    { number: 2, label: 'Resumen' },
    { number: 3, label: 'Aportes' },
  ],
};

export const getCategoryConfig = (value) =>
  APORTE_CATEGORIES.find((item) => item.value === value) || APORTE_CATEGORIES[0];

export const getCategoryLabel = (value) => getCategoryConfig(value)?.label || value;

export const getCategoryAppearance = (value) => getCategoryConfig(value);

export const getCategoryUnit = (value) => getCategoryConfig(value)?.unit || 'kg';

export const getCategoryPlaceholder = (value) =>
  getCategoryConfig(value)?.placeholder || 'Ej: Fríjol cargamanto, Manzana, Papa criolla';
