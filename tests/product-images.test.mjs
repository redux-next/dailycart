import assert from "node:assert/strict";
import test from "node:test";

import { cloudinaryImageUrl } from "../src/lib/cloudinary-image-url.js";
import { getProductImage } from "../src/lib/product-image.js";
import { validateAdminProduct } from "../src/lib/admin-product-validation.js";

test("Cloudinary delivery URLs add automatic format, quality, and bounded size", () => {
  const url = "https://res.cloudinary.com/dailycart/image/upload/v7/products/apples.jpg";

  assert.equal(
    cloudinaryImageUrl(url, 400),
    "https://res.cloudinary.com/dailycart/image/upload/f_auto,q_auto,w_400,c_limit/v7/products/apples.jpg"
  );
  assert.equal(
    cloudinaryImageUrl(cloudinaryImageUrl(url, 400), 400),
    cloudinaryImageUrl(url, 400)
  );
  assert.equal(
    cloudinaryImageUrl("https://images.example.com/apples.jpg"),
    "https://images.example.com/apples.jpg"
  );
});

test("product image resolution prefers the compatible primary image and falls back", () => {
  const additional = "https://res.cloudinary.com/dailycart/image/upload/v1/other.jpg";
  const primary = "https://res.cloudinary.com/dailycart/image/upload/v1/main.jpg";

  assert.equal(
    getProductImage({
      image: "",
      images: [
        { url: additional, position: 0 },
        { url: primary, isPrimary: true, position: 1 },
      ],
    }),
    primary
  );
  assert.equal(getProductImage({ image: "https://legacy.example.com/item.jpg" }), "https://legacy.example.com/item.jpg");
  assert.equal(getProductImage({}), "");
});

test("product validation stores a single primary image and stable image ordering", () => {
  const images = [
    {
      url: "https://res.cloudinary.com/dailycart/image/upload/f_auto,q_auto,w_1200,c_limit/v7/products/apples.jpg",
      publicId: "products/apples",
      isPrimary: true,
    },
    {
      url: "https://res.cloudinary.com/dailycart/image/upload/f_auto,q_auto,w_1200,c_limit/v8/products/pears.webp",
      publicId: "products/pears",
      isPrimary: false,
    },
  ];

  const result = validateAdminProduct(
    {
      name: "Apples",
      detail: "1 kg",
      category: "Fruits & veg",
      price: "42",
      originalPrice: "",
      stock: "12",
      images,
    },
    null,
    "dailycart"
  );

  assert.equal(result.error, undefined);
  assert.equal(result.product.image, images[0].url);
  assert.deepEqual(
    result.product.images.map(({ position, isPrimary }) => ({ position, isPrimary })),
    [
      { position: 0, isPrimary: true },
      { position: 1, isPrimary: false },
    ]
  );
});

test("product validation rejects duplicate and foreign Cloudinary asset identifiers", () => {
  const validImage = {
    url: "https://res.cloudinary.com/dailycart/image/upload/v1/products/apples.jpg",
    publicId: "products/apples",
    isPrimary: true,
  };
  const product = {
    name: "Apples",
    detail: "",
    category: "Fruits & veg",
    price: 42,
    stock: 12,
    images: [validImage, { ...validImage, isPrimary: false }],
  };

  assert.match(
    validateAdminProduct(product, null, "dailycart").error,
    /invalid or duplicated/
  );
  assert.match(
    validateAdminProduct(
      {
        ...product,
        images: [
          {
            ...validImage,
            url: validImage.url.replace("dailycart", "another-cloud"),
          },
        ],
      },
      null,
      "dailycart"
    ).error,
    /invalid or duplicated/
  );
});

test("editing preserves an existing legacy image unless it is explicitly removed", () => {
  const legacyImage = "https://images.example.com/legacy-product.jpg";
  const existing = {
    id: 8,
    image: legacyImage,
    stock: 30,
    legacyField: "preserved",
  };
  const result = validateAdminProduct(
    {
      name: "Updated",
      detail: "",
      category: "Pantry",
      price: 10,
      stock: 30,
      images: [{ url: legacyImage, isPrimary: true }],
    },
    existing,
    "dailycart"
  );

  assert.equal(result.error, undefined);
  assert.equal(result.product.image, legacyImage);
  assert.equal(result.product.legacyField, "preserved");
});
