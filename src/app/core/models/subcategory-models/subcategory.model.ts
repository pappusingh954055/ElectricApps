export interface Subcategory {
  id: number;
  categoryId: number;
  categoryName?: string;   // UI helper
  name: string;
  code?: string;
  description?: string;
  isActive: boolean;
}
