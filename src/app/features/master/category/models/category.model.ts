export interface Category {
  id?: any;          // optional for create
  categoryname: string;
  categorycode: string;
  defaultgst: number;
  description?: string;
  isActive: boolean;
}

export interface CategoryDropdown {
  id: any;
  name: any;
}