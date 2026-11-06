import React, { Fragment, createContext } from 'react';
import { createPortal } from 'react-dom';

/**
 * Validates whether the provided value is an integer. Throws an error if the value is not an integer.
 *
 * @param value - The value to validate as an integer.
 * @param field - The name of the field being validated.
 * @throws An error if the value is invalid.
 */
function validateIsInteger(value: number, field: string) {
  if (!Number.isInteger(value)) {
    throw new Error(`${field} must be a finite integer, but got ${value}`);
  }
}

export interface PaginationProps<T> extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  'children' | 'onChange'
> {
  pageSize: number;
  defaultPage?: number;
  selectedPage?: number;
  dataset: T[];

  onChange?: (data: T[], page: number) => void;
  children?: React.ReactNode | ((data: T[], page: number) => React.ReactNode);

  navigator?: boolean | React.RefObject<HTMLElement | null>;
}

/**
 * Creates an array of page indices based on the total number of items, page
 * size, current page, and maximum number of visible pages. The array may
 * include the string '...' to represent skipped page ranges.
 *
 * @param nbPages - The total number pages.
 * @param [current=0] - The current page index (zero-based). Default is 0.
 * @param [max=8] - The maximum number of visible page indices. Default is 8.
 * @return An array of page indices (zero-based) and/or '...' to represent
 *         skipped pages.
 */
export function createArrayOfPageIndex(nbPages: number, current = 0, max = 8): (number | '...')[] {
  validateIsInteger(nbPages, 'nbPages');
  validateIsInteger(current, 'current');
  validateIsInteger(max, 'max');
  if (max <= 4) {
    throw new Error('max cannot be less than 5');
  }

  current = Math.max(Math.min(nbPages - 1, current), 0);

  const toShow = Math.min(nbPages, max);
  if (nbPages <= max) {
    return [...Array(nbPages).keys()];
  } else if (current <= toShow / 2) {
    return [...Array(toShow - 2).keys(), '...', nbPages - 1];
  } else if (current >= nbPages - 1 - toShow / 2) {
    return [
      0,
      '...',
      ...Array(toShow - 2)
        .keys()
        .map(x => x + nbPages - toShow / 2 - 2), // -2 to account for 0, and last.
    ];
  } else {
    let start = current - Math.floor(toShow / 2 - 1) + 1;
    let end = current + toShow / 2 - 1;
    return [
      0,
      '...',
      ...Array(end - start)
        .keys()
        .map(x => x + start),
      '...',
      nbPages - 1,
    ];
  }
}

export function Pagination<T>({
  pageSize,
  defaultPage = 0,
  selectedPage,
  dataset,
  onChange,
  children,
  navigator = true,
  ...props
}: PaginationProps<T>) {
  const [pageInner, setPageInner] = React.useState(defaultPage);

  React.useEffect(() => {
    if (selectedPage !== undefined) {
      setPageInner(selectedPage);
    }
  }, [selectedPage]);

  // Call onChange whenever pageInner changes
  React.useEffect(() => {
    onChange?.(dataset.slice(pageInner * pageSize, (pageInner + 1) * pageSize), pageInner);
  }, [pageInner, pageSize, dataset, onChange]);

  // If the dataset prop changes, reset the page to the first one.
  React.useEffect(() => setPageInner(0), [dataset]);

  const [portal, setPortal] = React.useState<HTMLElement | null>(null);
  React.useEffect(() => {
    if (navigator !== true && navigator !== false) {
      setPortal(navigator?.current);
    }
  }, [navigator]);

  let navigatorEl: React.ReactNode | undefined = (
    <Navigator
      nbPages={Math.ceil(dataset.length / pageSize)}
      page={pageInner}
      onChange={setPageInner}
    />
  );

  if (portal && navigatorEl) {
    navigatorEl = createPortal(navigatorEl, portal);
  }

  if (navigator === false || (navigator !== true && !portal)) {
    navigatorEl = undefined;
  }

  const data = dataset.slice(pageInner * pageSize, (pageInner + 1) * pageSize);
  const RootEl = Object.keys(props).length > 0 ? (<div />).type : Fragment;
  return (
    <RootEl {...props}>
      {children instanceof Function ? (
        children(data, pageInner)
      ) : (
        <Pagination.Index.Provider value={pageInner}>
          <Pagination.Data.Provider value={data}>{children}</Pagination.Data.Provider>
        </Pagination.Index.Provider>
      )}

      {dataset.length > pageSize && navigator && navigatorEl}
    </RootEl>
  );
}

interface NavigatorProps {
  /**
   * Total number of pages.
   */
  nbPages: number;

  /**
   * Current page.
   */
  page?: number;

  /**
   * Called when the page changes.
   * @param p
   */
  onChange: (p: number) => void;
}

export const Navigator: React.FC<NavigatorProps> = ({
  nbPages,
  page = 0,
  onChange,
}: NavigatorProps) => {
  validateIsInteger(nbPages, 'nbPages');
  validateIsInteger(page, 'page');

  if (nbPages < 0) {
    throw new Error('nbItems cannot be less than 5');
  }

  page = Math.min(Math.max(page, 0), nbPages);
  const pages = createArrayOfPageIndex(nbPages, page);

  return (
    <nav
      className="flex items-center justify-end gap-2 mt-4"
      aria-label="Pagination"
      role="navigation"
    >
      <button
        onClick={() => onChange(Math.max(0, page - 1))}
        disabled={page == 0}
        aria-label="Previous page"
        className="p-2 hover:bg-[#0000001A] dark:hover:bg-[#FFFFFF1A] text-black dark:text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        ‹
      </button>

      {pages.map((p, i) => {
        if (p === '...') {
          return (
            <span key={`ellipsis-${i}`} className="text-black dark:text-white">
              ...
            </span>
          );
        } else if (p === page) {
          return (
            <button
              key={`page-${p}`}
              aria-label={`Page ${p + 1}`}
              aria-current="page"
              className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors bg-[#0000001A] dark:bg-[#FFFFFF1A] text-black dark:text-white"
            >
              {p + 1}
            </button>
          );
        } else {
          return (
            <button
              key={`page-${p}`}
              onClick={() => onChange(p)}
              aria-label={`Page ${p + 1}`}
              className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors hover:bg-[#0000001A] dark:hover:bg-[#FFFFFF1A] text-black dark:text-white"
            >
              {p + 1}
            </button>
          );
        }
      })}

      <button
        onClick={() => onChange(Math.min(nbPages - 1, page + 1))}
        disabled={page === nbPages - 1}
        aria-label="Next page"
        className="p-2 hover:bg-[#0000001A] dark:hover:bg-[#FFFFFF1A] text-black dark:text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        ›
      </button>
    </nav>
  );
};

Pagination.Index = createContext<number>(-1);
// Unfortunately, we cannot set the type of the context for Data to T, as T is
// unknown here.
Pagination.Data = createContext<any[]>([]);
