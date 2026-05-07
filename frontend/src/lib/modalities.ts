export type ModalityId = 'presencial' | 'semipresencial' | 'en-linea' | 'hibrida';

export interface ModalityDef {
  id: ModalityId;
  name: string;
  careerNames: string[];
}

export const MODALITIES: ModalityDef[] = [
  {
    id: 'presencial',
    name: 'Presencial',
    careerNames: [
      'Desarrollo de Software',
      'Diseño Gráfico',
      'Entrenamiento Deportivo',
      'Educación Inicial',
      'Mecánica Automotriz',
    ],
  },
  {
    id: 'semipresencial',
    name: 'Semipresencial',
    careerNames: [
      'Educación Básica',
      'Electrónica',
      'Gastronomía',
      'Redes y Telecomunicaciones',
    ],
  },
  {
    id: 'en-linea',
    name: 'En Línea',
    careerNames: [
      'Desarrollo de Software',
      'Contabilidad y Asesoría Tributaria',
      'Educación Inclusiva',
      'Marketing y Comercio Electrónico',
    ],
  },
  {
    id: 'hibrida',
    name: 'Híbrida',
    careerNames: ['Talento Humano'],
  },
];

export interface CareerLite {
  id: number | string;
  name: string;
}

export function filterCareersByModality<T extends CareerLite>(
  careers: T[],
  modalityId: ModalityId | ''
): T[] {
  if (!modalityId) return careers;
  const m = MODALITIES.find(x => x.id === modalityId);
  if (!m) return careers;
  return careers.filter(c => m.careerNames.includes(c.name));
}

export function getModalityName(id: string): string {
  return MODALITIES.find(m => m.id === id)?.name ?? id;
}

export function userInModality(user: { modalities?: string[] | null }, modalityId: ModalityId): boolean {
  return Array.isArray(user.modalities) && user.modalities.includes(modalityId);
}
