export interface Category {
  id?: string;          // optional for create
  CategoryName: string;
  CategoryCode: string;
  DefaultGst: number;
  Description?: string;
  IsActive: boolean;
}