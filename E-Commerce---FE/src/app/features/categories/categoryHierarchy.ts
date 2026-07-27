export interface CatalogCategory {
  id: string;
  parentId: string | null;
  name: string;
  img: string;
  sortOrder: number;
  isActive: boolean;
}

const normalizeCategoryName = (name: string) =>
  name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("vi").trim();

export function getFeaturedParentCategories(categories: CatalogCategory[]): CatalogCategory[] {
  return categories
    .filter(category => category.parentId === null && category.isActive)
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

export function getCategoryChildren(
  selectedCategoryName: string,
  categories: CatalogCategory[],
): CatalogCategory[] {
  const normalizedName = normalizeCategoryName(selectedCategoryName);
  const parent = categories.find(
    category => normalizeCategoryName(category.name) === normalizedName,
  );
  if (!parent) return [];

  return categories
    .filter(category => category.parentId === parent.id && category.isActive)
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

export function isProductInCategoryGroup(
  product: any,
  selectedCategoryName: string,
  categories: CatalogCategory[],
): boolean {
  const acceptedCategoryNames = [
    selectedCategoryName,
    ...getCategoryChildren(selectedCategoryName, categories).map(category => category.name),
  ].map(normalizeCategoryName);
  const productCategoryName = String(product?.[2] ?? product?.raw?.category?.name ?? "");

  return acceptedCategoryNames.includes(normalizeCategoryName(productCategoryName));
}
