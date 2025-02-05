'use server';

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import React from 'react';
import { defaultSort, sorting } from '../lib/constants';
import { getCollectionFilters, getCollectionProductsFiltered } from '../lib/shopify';
import { Product, ShopifyCollectionFilter } from '../lib/shopify/types';

export type ProductCollectionFilterProps = {
  collection: string;
  searchParams: { [key: string]: string | string[] | undefined };
  children: (products: Product[]) => React.ReactNode;
  sort?: string;
};

// Server action to apply product filters
async function applyFilters(formData: FormData) {
  'use server';

  // Grab the original search params, preserve the non-filter ones, and then filter out the filter
  // params which will be populated with what is in the form data.
  const headerData = await headers();
  const referer = headerData.get('referer');
  const params: URLSearchParams =
    referer == null ? new URLSearchParams() : new URL(referer).searchParams;

  const paramKeys = params.keys();
  paramKeys.forEach((k) => {
    if (k.startsWith(FILTER_PREFIX)) {
      params.delete(k);
    }
  });

  // Get the collection name which will be used for redirect
  const collection = formData.get('collection');

  // Get the (unique) filter keys in the form data
  const filterKeys = Array.from(
    new Set(
      formData
        .keys()
        .filter((k) => k.startsWith(FILTER_PREFIX))
        .toArray()
    )
  );

  // Create a list of filter pairs
  const pairs: { key: string; value: string }[] = filterKeys.flatMap((key) => {
    return formData.getAll(key).map((value) => ({ key, value: value.toString() }));
  });

  // Take out the price pairs, and then sort them (min -> max)
  const pricesPairs = pairs.filter((k) => k.key === FILTER_PRICE_KEY);
  const priceValues = pricesPairs.map((p) => parseFloat(p.value)).sort((a, b) => a - b);

  // Filter out the price pairs from the other filters
  const otherFilterPairs = pairs.filter((k) => k.key !== FILTER_PRICE_KEY);

  // Build the query params
  otherFilterPairs.forEach((p) => params.set(p.key, p.value));
  if (pricesPairs.length > 0) {
    params.set(FILTER_PRICE_KEY, priceValues.join(':'));
  }

  // Redirect to the new URL
  return redirect(`/search/${collection}?${params.toString()}`);
}

export async function ProductCollectionFilter(props: ProductCollectionFilterProps) {
  const { sortKey, reverse } = sorting.find((item) => item.slug === props.sort) || defaultSort;

  // Detect the active filters available in the search params
  const activeFilters = Object.keys(props.searchParams)
    .filter((p) => p.startsWith(FILTER_PREFIX))
    .flatMap((p) => {
      const originalValue = props.searchParams[p];
      if (originalValue == null) {
        return [];
      }
      switch (typeof originalValue) {
        case 'string': {
          return { key: p, value: originalValue };
        }
        case 'object': {
          // it's an array!
          return originalValue.map((s) => {
            return { key: p, value: s };
          });
        }
        default:
          return [];
      }
    });

  // Grab all collection filters
  const allCollectionFilters = await getCollectionFilters({
    collection: props.collection,
    filters: []
  });
  const allCollectionFiltersQueryObjects = activeFilters
    .map((filter) => filterInputStringToQueryObject(allCollectionFilters, filter))
    .filter((filter) => filter != null);

  // Apply the filters to the filters themselves, so we only get the relevant filters (e.g. updated counts)
  const activeCollectionFilters = await getCollectionFilters({
    collection: props.collection,
    filters: allCollectionFiltersQueryObjects
  });
  const activeCollectionFiltersQueryObjects = activeFilters
    .map((filter) => filterInputStringToQueryObject(allCollectionFilters, filter))
    .filter((filter) => filter != null);

  // Get the collection products with the applied filters
  const products = await getCollectionProductsFiltered({
    collection: props.collection,
    reverse: reverse,
    sortKey: sortKey,
    filters: activeCollectionFiltersQueryObjects
  });

  const activePriceRange = parsePriceRangeFromFilters(activeCollectionFilters);

  return (
    <div className="flex flex-col gap-2">
      <form action={applyFilters} className="flex flex-col gap-2 border bg-white p-2">
        <input type="hidden" name="collection" value={props.collection} />

        <div className="flex gap-2">
          {activeCollectionFilters.map((filter) => {
            return (
              <div className="flex-1" key={filter.id}>
                {filter.type === 'LIST' ? (
                  <FilterListItem filter={filter} activeFilters={activeFilters} />
                ) : null}
                {filter.type === 'PRICE_RANGE' ? (
                  <FilterPriceItem filter={filter} activePriceRange={activePriceRange} />
                ) : null}
              </div>
            );
          })}
        </div>
        <div>
          <input type="submit" value="Apply Filters" className="rounded bg-black p-2 text-white" />
        </div>
      </form>
      <div>{props.children(products)}</div>
    </div>
  );
}

function filterInputStringToQueryObject(
  allFilters: ShopifyCollectionFilter[],
  filter: ActiveFilter
): object | null {
  const filterGroup = allFilters.find((f) => f.id === filter.key);
  if (filterGroup == null) {
    return null;
  }

  switch (filterGroup.type) {
    case 'PRICE_RANGE':
      let data: PriceRange = JSON.parse(filterGroup.values[0]?.input ?? '{}'); // TODO cleanup this init
      const [min, max] = filter.value.split(':');
      if (min != null && min != '') {
        data.price.min = parseFloat(min);
      }
      if (max != null && max != '') {
        data.price.max = parseFloat(max);
      }
      return data;
    case 'LIST': {
      const filterValue = filterGroup.values.find((v) => v.id === filter.value);
      if (filterValue == null) {
        return null;
      }
      const data = JSON.parse(filterValue.input);
      if (typeof data !== 'object') {
        return null;
      }
      return data;
    }
    case 'BOOLEAN':
      return null; // TODO
  }
}

function FilterListItem(props: {
  filter: ShopifyCollectionFilter;
  activeFilters: { key: string; value: string }[];
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="font-bold">{props.filter.label}</div>
      {props.filter.values.map((filterValue, index) => {
        const id = `${props.filter.id}-${index}`;
        return (
          <div
            key={filterValue.id}
            className={`flex items-center gap-2 ${filterValue.count === 0 ? 'text-slate-400 line-through' : ''}`}
          >
            <input
              id={id}
              name={props.filter.id}
              type="checkbox"
              defaultChecked={props.activeFilters.some(
                (activeFilter) =>
                  activeFilter.key === props.filter.id && activeFilter.value === filterValue.id
              )}
              value={filterValue.id}
            />
            <label htmlFor={id}>{filterValue.label}</label>
            {filterValue.count > 0 ? (
              <span className="text-slate-400">({filterValue.count})</span>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

function FilterPriceItem(props: {
  filter: ShopifyCollectionFilter;
  activePriceRange: PriceRange | null;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="font-bold">{props.filter.label}</div>
      <div className="flex items-center gap-2">
        <input
          name={props.filter.id}
          className="border p-2"
          type="number"
          placeholder="Min"
          defaultValue={props.activePriceRange?.price.min ?? ''}
        />
        <input
          name={props.filter.id}
          className="border p-2"
          type="number"
          placeholder="Max"
          defaultValue={props.activePriceRange?.price.max ?? ''}
        />
      </div>
    </div>
  );
}

const FILTER_PREFIX = 'filter.';
const FILTER_PRICE_KEY = 'filter.v.price';

type ActiveFilter = { key: string; value: string };

type PriceRange = {
  price: {
    min?: number;
    max?: number;
  };
};

function isPriceRange(u: unknown): u is PriceRange {
  const maybe = u as PriceRange;
  return u != null && typeof u === 'object' && maybe.price != null; // TODO improve this
}

function parsePriceRangeFromFilters(availableFilters: ShopifyCollectionFilter[]) {
  const input = availableFilters
    .find((filter) => filter.type === 'PRICE_RANGE')
    ?.values.at(0)?.input;
  if (input == null) {
    return null;
  }
  const range = JSON.parse(input);
  if (!isPriceRange(range)) {
    return null;
  }
  return range;
}
