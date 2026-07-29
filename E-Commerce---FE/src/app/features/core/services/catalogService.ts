import { env } from '../../../../config/env';
import { parseRes } from '../../../../utils/api';

interface CatalogProduct {
  productType?: string;
  [key: string]: any;
}

export async function getCatalogProducts(branchId?: string): Promise<CatalogProduct[]> {
  const query = branchId ? `?branchId=${encodeURIComponent(branchId)}` : '';
  const [productResponse, comboResponse] = await Promise.all([
    fetch(`${env.API_URL}/products${query}`),
    branchId ? fetch(`${env.API_URL}/combos${query}`) : Promise.resolve(null),
  ]);

  const productData = await parseRes(productResponse);
  if (!productResponse.ok) {
    throw new Error(productData?.message ?? 'Không thể tải danh sách sản phẩm.');
  }

  const regularProducts = Array.isArray(productData)
    ? productData.filter((product: CatalogProduct) => product.productType !== 'combo')
    : [];

  if (!comboResponse) return regularProducts;

  const comboData = await parseRes(comboResponse);
  const branchCombos = comboResponse.ok && Array.isArray(comboData) ? comboData : [];
  return [...regularProducts, ...branchCombos];
}
