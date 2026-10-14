// @id 01M4W0SRCH0000000000000001
// @related 01M4W0SRCH0000000000000002, 01M4W0SRCH0000000000000003
/**
 * src/components/search/search-table.types.ts
 * Types and interfaces for TanStack Table v8 React Search Data Table.
 */

export interface SearchRecordItem {
  tin: string;
  name: string;
  regiDate: string;
  status: string;
  address: string;
  taxOffice: string;
}

export interface SearchTableProps {
  rows?: (string | number | null)[][];
  count?: number | null;
  loading?: boolean;
  pageSize?: number;
  onChangePageSize?: (size: number) => void;
  onSelectTin?: (tin: string) => void;
}
