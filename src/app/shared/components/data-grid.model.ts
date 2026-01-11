export interface GridColumn {
    columnDef: string;
    header: string;
    cell?: (row: any) => string;
}