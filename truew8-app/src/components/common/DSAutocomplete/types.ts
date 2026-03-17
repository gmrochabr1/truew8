export type NestedKeyOf<_T> = string;

export interface DSAutocompleteProps<T> {
  items?: T[];
  loadItems?: (searchText: string) => Promise<T[]>;
  idField: keyof T | NestedKeyOf<T>;
  displayField: keyof T | NestedKeyOf<T>;
  value?: string | string[];
  selectedItems?: T[];
  onChange: (value: string | string[], selectedItems?: T | T[], isFromList?: boolean) => void;
  multiple?: boolean;
  allowFreeText?: boolean;
  placeholder?: string;
  label?: string;
  disabled?: boolean;
  required?: boolean;
  error?: string | null;
  helperText?: string;
  debounceTime?: number;
  initialDisplayValue?: string;
  testID?: string;
}
