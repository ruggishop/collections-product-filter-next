import productFragment from '../fragments/product';
import seoFragment from '../fragments/seo';

const collectionFragment = /* GraphQL */ `
  fragment collection on Collection {
    handle
    title
    description
    seo {
      ...seo
    }
    updatedAt
  }
  ${seoFragment}
`;

export const getCollectionQuery = /* GraphQL */ `
  query getCollection($handle: String!) {
    collection(handle: $handle) {
      ...collection
    }
  }
  ${collectionFragment}
`;

export const getCollectionsQuery = /* GraphQL */ `
  query getCollections {
    collections(first: 100, sortKey: TITLE) {
      edges {
        node {
          ...collection
        }
      }
    }
  }
  ${collectionFragment}
`;

export const getCollectionProductsQuery = /* GraphQL */ `
  query getCollectionProducts(
    $handle: String!
    $sortKey: ProductCollectionSortKeys
    $reverse: Boolean
  ) {
    collection(handle: $handle) {
      products(sortKey: $sortKey, reverse: $reverse, first: 100) {
        edges {
          node {
            ...product
          }
        }
      }
    }
  }
  ${productFragment}
`;

export const getCollectionProductsFilteredQuery = /* GraphQL */ `
  query getCollectionProductsFiltered(
    $handle: String!
    $sortKey: ProductCollectionSortKeys
    $reverse: Boolean
    $filters: [ProductFilter!]
  ) {
    collection(handle: $handle) {
      products(sortKey: $sortKey, reverse: $reverse, filters: $filters, first: 100) {
        nodes {
          ...product
        }
      }
    }
  }
  ${productFragment}
`;

export const getCollectionFiltersQuery = /* GraphQL */ `
  query getCollectionProductsFilters($handle: String!, $filters: [ProductFilter!]) {
    collection(handle: $handle) {
      products(first: 0, filters: $filters) {
        filters {
          type
          label
          id
          presentation
          values {
            count
            id
            label
            input
          }
        }
      }
    }
  }
`;
