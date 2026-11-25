export function getProductImage(product) {
  if (typeof product?.image === "string" && product.image) {
    return product.image;
  }

  if (!Array.isArray(product?.images)) return "";

  const primaryImage = product.images.find(
    (image) => image?.isPrimary && typeof image.url === "string"
  );
  const firstImage = product.images.find(
    (image) => typeof image?.url === "string"
  );

  return primaryImage?.url || firstImage?.url || "";
}
