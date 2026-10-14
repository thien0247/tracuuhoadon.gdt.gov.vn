// @id 01M4V8A0K2GZZ1186VCPTY99N2
// @related 01M4V0HMNG67WYQGAJ650769V9, 01M4V0FH0TF34QKKRRBVF9H0XA
/**
 * frontend/src/components/search/search-table.types.ts
 * Types and interfaces for TanStack Table v8 Search Data Table.
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
}

export type SearchTableEmits = {
  (e: 'select-tin', tin: string): void;
};
