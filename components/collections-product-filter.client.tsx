'use client';

import React from 'react';
import {
  CollectionProductsFilterAvailable,
  CollectionProductsFilterPrice,
  CollectionProductsFilterProductType,
  CollectionProductsFilterProductVendor,
  CollectionProductsFilterTag
} from '../lib/shopify/types';

export type FilterSelectionProps = {
  filtersOld: {
    collectionProductsFilterPrice: CollectionProductsFilterPrice;
    collectionProductsFilterAvailable: CollectionProductsFilterAvailable;
    collectionProductsFilterProductType: CollectionProductsFilterProductType;
    collectionProductsFilterProductVendor: CollectionProductsFilterProductVendor;
    collectionProductsFilterTag: CollectionProductsFilterTag;
  };
};

export function FilterSelection(props: FilterSelectionProps) {
  const [collectionProductsFilterPrice, setCollectionProductsFilterPrice] = React.useState(
    props.filtersOld.collectionProductsFilterPrice
  );
  const [collectionProductsFilterAvailable, setCollectionProductsFilterAvailable] = React.useState(
    props.filtersOld.collectionProductsFilterAvailable
  );

  const onSubmit = React.useCallback(() => {
    const params = {
      available: collectionProductsFilterAvailable.available ? 'true' : 'false',
      minPrice: collectionProductsFilterPrice.price?.min ?? null,
      maxPrice: collectionProductsFilterPrice.price?.max ?? null
    };
    const query = Object.entries(params)
      .map(([key, value]) => {
        return value == null ? null : `${key}=${value}`;
      })
      .filter((v) => v != null)
      .join('&');
    window.location.replace(`?${query}`);
  }, [collectionProductsFilterAvailable, collectionProductsFilterPrice]);

  function numericOrEmptyInputValue(value: number) {
    return isNaN(value) ? '' : value;
  }

  const onChangeMinPrice = React.useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setCollectionProductsFilterPrice((prev) => {
      return {
        price: {
          ...prev.price,
          min: getValue(e.target.value)
        }
      };
    });
  }, []);

  const onChangeMaxPrice = React.useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setCollectionProductsFilterPrice((prev) => {
      return {
        price: {
          ...prev.price,
          max: getValue(e.target.value)
        }
      };
    });
  }, []);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        Price:
        <input
          className="border"
          type="number"
          placeholder="min"
          value={numericOrEmptyInputValue(collectionProductsFilterPrice.price?.min ?? 0)}
          onChange={onChangeMinPrice}
        />
        <input
          className="border"
          type="number"
          placeholder="max"
          value={numericOrEmptyInputValue(collectionProductsFilterPrice.price?.max ?? 0)}
          onChange={onChangeMaxPrice}
        />
      </div>
      <div>
        Available:
        <input
          type="checkbox"
          checked={collectionProductsFilterAvailable.available}
          onChange={(e) => setCollectionProductsFilterAvailable({ available: e.target.checked })}
        />
      </div>
      <div>
        <button onClick={onSubmit} className="bg-black p-2 text-white">
          Apply filters
        </button>
      </div>
    </div>
  );
}

function getValue(value: string): number | undefined {
  try {
    const v = parseFloat(value);
    if (isNaN(v)) {
      return undefined;
    }
    return v;
  } catch (err) {
    return undefined;
  }
}
