import React, { createContext, useContext, useMemo, useState } from 'react';

import { SearchIcon } from '@/components';

/**
 * The search context in which a <SearchInput /> sets the search
 * terms and the <SearchFilter /> filters a dataset based on it.
 */
export interface SearchContextType {
  term: string;
  setTerm: (term: string) => void;
}

export const SearchContext = createContext<SearchContextType>({
  term: '',
  setTerm: () => {},
});

export interface SearchProps<T> {
  dataset: T[];
  filterFn: (term: string, data: T[]) => T[];

  children?: React.ReactNode | ((data: T[]) => React.ReactNode);
}

/**
 * Search a dataset based on a search term provided by the context.
 */
export function SearchFilter<T>({ dataset, filterFn, children }: SearchProps<T>) {
  const { term } = useContext(SearchContext);

  const data = useMemo(() => {
    return filterFn(term, dataset);
  }, [filterFn, term, dataset]);

  if (children instanceof Function) {
    return children(data);
  } else {
    return <SearchFilter.Data.Provider value={data}>{children}</SearchFilter.Data.Provider>;
  }
}

export interface SearchInputProps {
  placeholder?: string;
}

/**
 * An <input /> field that updates the search data.
 * @param placeholder A placeholder to show in the input.
 * @param value The value of the search input (updates the terms too).
 */
export function SearchInput({ placeholder }: SearchInputProps) {
  const { term, setTerm } = useContext(SearchContext);

  return (
    <div className="relative">
      <input
        data-testid="search-input"
        type="text"
        placeholder={placeholder}
        className="input input-bordered w-full h-[40px] border-none bg-secondary text-secondary-content pl-10 focus:outline-hidden focus-visible:ring-1 focus-visible:ring-primary"
        value={term}
        onChange={e => setTerm(e.target.value)}
      />
      <SearchIcon className="h-6 w-6 absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary-content/50" />
    </div>
  );
}

/**
 * Provider the state for the Search and SearchInput.
 * @param defaultValue The default search value (if any).
 * @param children
 * @constructor
 */
export function SearchProvider({
  defaultValue = '',
  children,
}: React.PropsWithChildren<{ defaultValue?: string }>) {
  const [term, setTerm] = useState(defaultValue);

  return <SearchContext.Provider value={{ term, setTerm }}>{children}</SearchContext.Provider>;
}

SearchFilter.Data = createContext<any[]>([]);
