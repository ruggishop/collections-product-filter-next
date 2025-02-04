import React from 'react';
import { defaultSort, sorting } from '../lib/constants';
import { getCollectionFilters, getCollectionProductsFiltered } from '../lib/shopify';
import { Product, ShopifyCollectionFilter } from '../lib/shopify/types';
import { ActiveFilter, PriceRange, ProductFilters } from './collections-product-filter.client';

export type ProductCollectionFilterProps = {
  collection: string;
  searchParams: { [key: string]: string | string[] | undefined };
  children: (products: Product[]) => React.ReactNode;
  sort?: string;
};

export async function ProductCollectionFilter(props: ProductCollectionFilterProps) {
  const { sortKey, reverse } = sorting.find((item) => item.slug === props.sort) || defaultSort;

  const activeFilters = Object.keys(props.searchParams)
    .filter((p) => p.startsWith('filter.'))
    .flatMap((p) => {
      const raw = props.searchParams[p];
      if (raw == null) {
        return [];
      }
      switch (typeof raw) {
        case 'string': {
          return { key: p, value: raw };
        }
        case 'object': {
          return raw.map((s) => {
            return { key: p, value: s };
          });
        }
        default:
          return [];
      }
    });

  const allCollectionFilters = await getCollectionFilters({
    collection: props.collection,
    filters: []
  });

  const allCollectionFilterInputs = activeFilters
    .map((filter) => filterInputStringToQueryObject(allCollectionFilters, filter))
    .filter((filter) => filter != null);

  const filteredCollectionFilters = await getCollectionFilters({
    collection: props.collection,
    filters: allCollectionFilterInputs
  });

  const filteredFilterInputs = activeFilters
    .map((filter) => filterInputStringToQueryObject(allCollectionFilters, filter))
    .filter((filter) => filter != null);

  const products = await getCollectionProductsFiltered({
    collection: props.collection,
    reverse: reverse,
    sortKey: sortKey,
    filters: filteredFilterInputs
  });

  return (
    <div className="flex flex-col gap-2 rounded border bg-white p-4 shadow-lg">
      <div className="flex flex-col gap-2">
        <ProductFilters
          filters={filteredCollectionFilters}
          activeFilters={activeFilters}
          sort={props.sort}
        />
      </div>
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
