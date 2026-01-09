export interface Category {
  id: number;
  name: string;
  code?: string;
  defaultGst?: number;
  description?: string;
  isActive: boolean;
}
