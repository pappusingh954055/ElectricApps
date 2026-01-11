export interface SubCategory {
  id?: number;
  categoryid?: string;          // optional for create
  subcategorycode: string;
  subcategoryname: string;
  defaultgst: number;
  description?: string;
  isactive: boolean;
}