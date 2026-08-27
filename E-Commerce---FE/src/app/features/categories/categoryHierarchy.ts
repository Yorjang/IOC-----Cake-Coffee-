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

const FEATURED_CATEGORY_ORDER = [
  "Bánh ngọt",
  "Bánh sinh nhật",
  "Bánh mặn",
  "Pastry & bánh ăn nhẹ",
  "Cà phê",
  "Trà & đồ uống",
  "Đồ uống đá xay",
  "Combo",
  "Quà tặng và hộp bánh",
].map(normalizeCategoryName);

const featuredCategoryOrder = new Map(
  FEATURED_CATEGORY_ORDER.map((name, index) => [name, index]),
);

export function getFeaturedParentCategories(categories: CatalogCategory[]): CatalogCategory[] {
  return categories
    .filter(category => category.parentId === null && category.isActive)
    .sort((a, b) => {
      const aOrder = featuredCategoryOrder.get(normalizeCategoryName(a.name));
      const bOrder = featuredCategoryOrder.get(normalizeCategoryName(b.name));
      if (aOrder !== undefined && bOrder !== undefined) return aOrder - bOrder;
      if (aOrder !== undefined) return -1;
      if (bOrder !== undefined) return 1;
      return a.sortOrder - b.sortOrder || a.name.localeCompare(b.name, "vi");
    });
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
