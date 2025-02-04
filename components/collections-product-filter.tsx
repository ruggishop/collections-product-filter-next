import React from 'react';
import { getCollectionFilters, getCollectionProductsFiltered } from '../lib/shopify';
import {
  CollectionProductsFilterAvailable,
  CollectionProductsFilterPrice,
  CollectionProductsFilterProductType,
  CollectionProductsFilterProductVendor,
  CollectionProductsFilterTag,
  Product
} from '../lib/shopify/types';
import { FilterSelection } from './collections-product-filter.client';

export type ProductCollectionFilterProps = {
  collection: string;
  searchParams: { [key: string]: string | string[] | undefined };
  children: (products: Product[]) => React.ReactNode;
};

export async function ProductCollectionFilter(props: ProductCollectionFilterProps) {
  const minPrice =
    props.searchParams['minPrice'] != null
      ? parseFloat(`${props.searchParams['minPrice']}`)
      : undefined;
  const maxPrice =
    props.searchParams['maxPrice'] != null
      ? parseFloat(`${props.searchParams['maxPrice']}`)
      : undefined;
  const available = props.searchParams['available'];

  const collectionProductsFilterPrice: CollectionProductsFilterPrice = {
    price: {
      min: isNaN(minPrice ?? 0) ? undefined : minPrice,
      max: isNaN(maxPrice ?? 0) ? undefined : maxPrice
    }
  };
  const collectionProductsFilterAvailable: CollectionProductsFilterAvailable = {
    available: available !== 'false'
  };
  const collectionProductsFilterProductType: CollectionProductsFilterProductType = {};
  const collectionProductsFilterProductVendor: CollectionProductsFilterProductVendor = {};
  const collectionProductsFilterTag: CollectionProductsFilterTag = {};

  const filters = [
    collectionProductsFilterPrice,
    collectionProductsFilterAvailable,
    collectionProductsFilterProductType,
    collectionProductsFilterProductVendor,
    collectionProductsFilterTag
  ];

  const products = await getCollectionProductsFiltered({
    collection: props.collection,
    reverse: false,
    filters: filters
  });

  const flt = await getCollectionFilters({ collection: props.collection });
  console.log('FLT', flt);

  return (
    <div className="flex flex-col gap-2 rounded border border-red-500 bg-white p-4 shadow-lg">
      <div className="flex flex-col gap-2">
        <div>Cool filters</div>
        {flt.map((f) => {
          return (
            <div key={f.id} className="border">
              <div>{f.label}</div>
              <div>{f.type}</div>
              {f.values.map((v) => {
                const parsed: object = JSON.parse(v.input);
                return (
                  <div key={v.id}>
                    {Object.keys(parsed).map((k) => {
                      return <div key={k}>{k}</div>;
                    })}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
      <div>
        <div>Filter</div>
        <FilterSelection
          filtersOld={{
            collectionProductsFilterPrice,
            collectionProductsFilterAvailable,
            collectionProductsFilterProductType,
            collectionProductsFilterProductVendor,
            collectionProductsFilterTag
          }}
        />
      </div>
      <div>
        <div>Products</div>
        <div className="flex flex-col gap-2">{props.children(products)}</div>
      </div>
    </div>
  );
}
