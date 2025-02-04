'use client';

import React from 'react';
import { ShopifyCollectionFilter } from '../lib/shopify/types';

export type ActiveFilter = { key: string; value: string };

export type ProductFiltersProps = {
  filters: ShopifyCollectionFilter[];
  activeFilters: ActiveFilter[];
  sort?: string;
};

export type PriceRange = {
  price: {
    min?: number;
    max?: number;
  };
};

function isPriceRange(u: unknown): u is PriceRange {
  const maybe = u as PriceRange;
  return u != null && typeof u === 'object' && maybe.price != null; // TODO improve this
}

export function ProductFilters(props: ProductFiltersProps) {
  const [activeFilters, setActiveFilters] = React.useState<ActiveFilter[]>(props.activeFilters);

  const [activePriceRange, setActivePriceRange] = React.useState<PriceRange | null>(null);

  React.useEffect(() => {
    function getPriceRange() {
      const input = props.filters.find((f) => f.type === 'PRICE_RANGE')?.values.at(0)?.input;
      if (input == null) {
        return null;
      }
      const range = JSON.parse(input);
      if (!isPriceRange(range)) {
        return null;
      }
      return range;
    }
    setActivePriceRange(getPriceRange());
  }, [props.filters]);

  const onChangeList = React.useCallback(
    (key: string, value: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
      setActiveFilters((current) =>
        e.target.checked
          ? current.concat({ key, value })
          : current.filter((v) => (v.key === key && v.value === value ? false : true))
      );
    },
    []
  );

  const query = React.useMemo(() => {
    const filterParams: string[] = activeFilters.map((f) => `${f.key}=${f.value}`);
    const sort: string[] = props.sort != null ? [`sort=${props.sort}`] : [];
    return [...filterParams, ...sort].join('&');
  }, [activeFilters]);

  const submit = React.useCallback(() => {
    window.location.replace(`?${query}`);
  }, [query]);

  const onChangePriceRangeMin = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      function getValue() {
        const value = parseFloat(e.target.value);
        if (isNaN(value)) {
          return undefined;
        }
        return value;
      }
      const newPriceRange: PriceRange = {
        ...activePriceRange,
        price: {
          ...activePriceRange?.price,
          min: getValue()
        }
      };
      setActivePriceRange(newPriceRange);
      setActiveFilters((current) => {
        return current
          .filter((f) => f.key !== 'filter.v.price')
          .concat({
            key: 'filter.v.price',
            value: `${newPriceRange.price.min ?? ''}:${newPriceRange.price.max ?? ''}`
          });
      });
    },
    [activePriceRange]
  );
  const onChangePriceRangeMax = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      function getValue() {
        const value = parseFloat(e.target.value);
        if (isNaN(value)) {
          return undefined;
        }
        return value;
      }
      const newPriceRange: PriceRange = {
        ...activePriceRange,
        price: {
          ...activePriceRange?.price,
          max: getValue()
        }
      };
      setActivePriceRange(newPriceRange);
      setActiveFilters((current) => {
        return current
          .filter((f) => f.key !== 'filter.v.price')
          .concat({
            key: 'filter.v.price',
            value: `${newPriceRange.price.min ?? ''}:${newPriceRange.price.max ?? ''}`
          });
      });
    },
    [activePriceRange]
  );

  return (
    <div className="flex flex-col gap-4 rounded-lg border bg-slate-100 p-2">
      <button
        type="submit"
        value="Apply filters"
        className="rounded-lg bg-black p-2 text-white"
        onClick={submit}
      >
        Apply filters
      </button>
      <div className="flex gap-2">
        {props.filters.map((filter) => {
          return (
            <div key={filter.id} className="flex flex-1 flex-col gap-2 rounded-lg bg-white p-4">
              <div className="font-bold">{filter.label}</div>
              {filter.type === 'LIST'
                ? filter.values.map((filterValue) => {
                    return (
                      <div
                        key={filterValue.id}
                        className={`flex items-center gap-2 ${filterValue.count === 0 ? 'text-slate-400 line-through' : ''}`}
                      >
                        <input
                          type="checkbox"
                          checked={activeFilters.some(
                            (activeFilter) =>
                              activeFilter.key === filter.id &&
                              activeFilter.value === filterValue.id
                          )}
                          onChange={onChangeList(filter.id, filterValue.id)}
                        />
                        <span>{filterValue.label}</span>
                        {filterValue.count > 0 ? (
                          <span className="text-slate-400">({filterValue.count})</span>
                        ) : null}
                      </div>
                    );
                  })
                : null}
              {filter.type === 'PRICE_RANGE' ? (
                <div className="flex gap-2">
                  <input
                    className="border p-2"
                    type="number"
                    placeholder="Min"
                    value={activePriceRange?.price.min ?? ''}
                    onChange={onChangePriceRangeMin}
                  />
                  <input
                    className="border p-2"
                    type="number"
                    placeholder="Max"
                    value={activePriceRange?.price.max ?? ''}
                    onChange={onChangePriceRangeMax}
                  />
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
