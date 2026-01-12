export interface GridColumn {
    field: string;
    header: string;
    sortable?: boolean;
    cell?: (row: any) => string | number;
    isAction?: boolean; // 👈 NEW
}