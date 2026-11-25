function isValidCloudinaryImage(image, existingUrls, cloudName) {
  if (
    !image ||
    typeof image.url !== "string" ||
    typeof image.isPrimary !== "boolean"
  ) {
    return false;
  }

  if (image.publicId == null) return existingUrls.has(image.url);

  if (
    typeof image.publicId !== "string" ||
    image.publicId.length > 255 ||
    !/^[a-zA-Z0-9_./-]+$/.test(image.publicId) ||
    image.publicId.split("/").some((part) => !part || part === "." || part === "..")
  ) {
    return false;
  }

  try {
    const imageUrl = new URL(image.url);
    const prefix = `/${cloudName}/image/upload/`;
    if (
      imageUrl.protocol !== "https:" ||
      imageUrl.hostname !== "res.cloudinary.com" ||
      !imageUrl.pathname.startsWith(prefix)
    ) {
      return false;
    }

    const pathParts = imageUrl.pathname.slice(prefix.length).split("/");
    if (pathParts[0]?.includes(",")) pathParts.shift();
    if (/^v\d+$/.test(pathParts[0] || "")) pathParts.shift();

    const urlPublicId = decodeURIComponent(pathParts.join("/")).replace(/\.[a-zA-Z0-9]+$/, "");
    return urlPublicId === image.publicId;
  } catch {
    return false;
  }
}

export function validateAdminProduct(body, existing, cloudName) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { error: "Invalid product details." };
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const detail = typeof body.detail === "string" ? body.detail.trim() : "";
  const category = typeof body.category === "string" ? body.category.trim() : "";
  const badge = typeof body.badge === "string" ? body.badge.trim() : "";
  const hasPrice =
    typeof body.price === "number" ||
    (typeof body.price === "string" && body.price.trim() !== "");
  const hasStock =
    typeof body.stock === "number" ||
    (typeof body.stock === "string" && body.stock.trim() !== "");
  const price = Number(body.price);
  const stock = Number(body.stock);
  const originalPriceIsBlank =
    body.originalPrice === "" || body.originalPrice == null;
  const originalPrice =
    originalPriceIsBlank
      ? null
      : Number(body.originalPrice);

  if (
    !name ||
    name.length > 120 ||
    detail.length > 300 ||
    !category ||
    category.length > 80
  ) {
    return {
      error: "Enter a product name and category. Keep product details within the allowed length.",
    };
  }

  if (
    !hasPrice ||
    !hasStock ||
    !Number.isFinite(price) ||
    price < 0 ||
    price > 1_000_000 ||
    !Number.isSafeInteger(stock) ||
    stock < 0 ||
    (!originalPriceIsBlank &&
      (typeof body.originalPrice !== "number" &&
        typeof body.originalPrice !== "string" ||
        !Number.isFinite(originalPrice) ||
        originalPrice < 0 ||
        originalPrice > 1_000_000))
  ) {
    return {
      error: "Enter a valid price, original price and whole-number stock quantity.",
    };
  }

  if (
    badge.length > 40 ||
    !Array.isArray(body.images) ||
    body.images.length > 12
  ) {
    return {
      error: "Use up to 12 product images and keep the badge within 40 characters.",
    };
  }

  const existingUrls = new Set(
    [
      existing?.image,
      ...(Array.isArray(existing?.images)
        ? existing.images.map((image) => image?.url)
        : []),
    ].filter((url) => typeof url === "string")
  );
  const images = body.images.map((image) => ({
    url: image?.url,
    publicId: image?.publicId ?? null,
    isPrimary: image?.isPrimary === true,
  }));
  const publicIds = images.map((image) => image.publicId).filter(Boolean);

  if (
    images.some(
      (image) => !isValidCloudinaryImage(image, existingUrls, cloudName)
    ) ||
    new Set(publicIds).size !== publicIds.length ||
    new Set(images.map((image) => image.url)).size !== images.length ||
    (images.length > 0 &&
      images.filter((image) => image.isPrimary).length !== 1)
  ) {
    return {
      error: "One or more product images are invalid or duplicated.",
    };
  }

  const primaryImage = images.find((image) => image.isPrimary);

  return {
    product: {
      ...(existing || {}),
      name,
      detail,
      category,
      price,
      originalPrice,
      badge,
      stock,
      image: primaryImage?.url || "",
      images: images.map((image, position) => ({ ...image, position })),
    },
  };
}
