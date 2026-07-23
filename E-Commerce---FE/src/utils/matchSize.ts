export const matchSize = (product: any, selectedSize: string) => {
  if (!product.variants) return null;
  return product.variants.find((v: any) => v.size.toLowerCase().startsWith(selectedSize.toLowerCase()));
};
