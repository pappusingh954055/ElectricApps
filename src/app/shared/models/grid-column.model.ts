export interface GridColumn {
  /** Property name from DTO (API response) */
  field: string;

  /** Column header text */
  header: string;

  /** Allow server-side sorting */
  sortable?: boolean;


  cell?: (row: any) => string | number | null;

  /** Optional width */
  width?: number;

  visible?: boolean;

  /** Optional column type (text, number, boolean, date) */
  type?: 'text' | 'number' | 'boolean' | 'date';
}
