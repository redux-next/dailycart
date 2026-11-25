
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { doc, getDoc } from "firebase/firestore";

import { db } from "../lib/firebase";
import ProductActions from "./product-actions";
import LoadingImage from "./loading-image";
import { getProductImage } from "../lib/product-image";

export default function ProductDetailClient({ productId }) {
  const [product, setProduct] = useState(null);
  const [selectedImageUrl, setSelectedImageUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadProduct() {
      try {
        setLoading(true);
        setError("");

        const productRef = doc(
          db,
          "products",
          `product-${productId}`
        );

        const snapshot = await getDoc(productRef);

        if (!active) return;

        if (!snapshot.exists()) {
          setProduct(null);
          setError("Product not found.");
          return;
        }

        setProduct({
          ...snapshot.data(),
          image: getProductImage(snapshot.data()),
          id: snapshot.data().id ?? productId,
        });
      } catch (err) {
        console.error("Product loading error:", err);

        if (active) {
          setError("Unable to load this product. Please try again.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadProduct();

    return () => {
      active = false;
    };
  }, [productId]);

  if (loading) {
    return (
      <main className="product-page">
        <div className="flex min-h-[50vh] items-center justify-center">
          <div className="h-9 w-9 rounded-full border-4 border-green-200 border-t-green-600 animate-spin" />
        </div>
      </main>
    );
  }

  if (error || !product) {
    return (
      <main className="product-page">
        <div className="mx-auto max-w-xl py-20 text-center">
          <h1 className="text-2xl font-bold text-gray-900">
            {error || "Product not found"}
          </h1>

          <p className="mt-3 text-sm text-gray-500">
            This product may have been removed or is currently unavailable.
          </p>

          <Link
            href="/"
            className="mt-6 inline-flex rounded-xl bg-green-600 px-6 py-3 text-sm font-semibold text-white hover:bg-green-700"
          >
            Back to shopping
          </Link>
        </div>
      </main>
    );
  }

  const productImages = Array.isArray(product.images)
    ? product.images.filter(
        (image) => typeof image?.url === "string" && image.url
      )
    : [];
  if (
    product.image &&
    !productImages.some((image) => image.url === product.image)
  ) {
    productImages.unshift({
      url: product.image,
      isPrimary: true,
      position: 0,
    });
  }
  const primaryImage =
    productImages.find((image) => image.url === product.image) ||
    productImages.find((image) => image.isPrimary) ||
    productImages[0];
  const activeImage =
    productImages.find((image) => image.url === selectedImageUrl) ||
    primaryImage;

  return (
    <main className="product-page">
      <nav className="product-breadcrumbs" aria-label="Breadcrumb">
        <Link href="/">Home</Link>

        <span aria-hidden="true">/</span>

        <span>{product.category}</span>

        <span aria-hidden="true">/</span>

        <span aria-current="page">{product.name}</span>
      </nav>

      <article className="product-detail-card">
        <div className="product-detail-media">
          <div className="product-detail-image">
            <LoadingImage
              src={activeImage?.url || product.image}
              alt={product.name}
              priority
              sizes="(max-width: 700px) 100vw, 50vw"
            />

            {product.badge && (
              <span className="product-badge">
                {product.badge}
              </span>
            )}
          </div>

          {productImages.length > 1 && (
            <div className="product-image-thumbnails" aria-label="More product images">
              {productImages.map((image, index) => (
                <button
                  type="button"
                  key={`${image.publicId || image.url}-${index}`}
                  onClick={() => setSelectedImageUrl(image.url)}
                  aria-label={`View product image ${index + 1}`}
                  aria-pressed={activeImage?.url === image.url}
                  className={`product-image-thumbnail ${
                    activeImage?.url === image.url ? "is-selected" : ""
                  }`}
                >
                  <LoadingImage
                    src={image.url}
                    alt=""
                    sizes="72px"
                    objectFit="cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="product-detail-copy">
          <p className="product-detail-category">
            {product.category}
          </p>

          <h1>{product.name}</h1>

          <p className="product-detail-description">
            {product.detail}
          </p>

          <div className="product-detail-price">
            <strong>₹{product.price}</strong>

            {product.originalPrice != null && (
              <del>₹{product.originalPrice}</del>
            )}

            <span>Inclusive of all taxes</span>
          </div>

          <ProductActions product={product} />

          <div className="product-delivery-note">
            <span
              className="product-delivery-icon"
              aria-hidden="true"
            >
              ↗
            </span>

            <span>
              <strong>Fast local delivery</strong>

              <small>
                Usually at your door in 10 minutes
              </small>
            </span>
          </div>

          <p className="product-id">
            Product ID: {product.id}
          </p>
        </div>
      </article>

      <section
        className="product-information"
        aria-labelledby="product-information-title"
      >
        <h2 id="product-information-title">
          Product information
        </h2>

        <dl>
          <div>
            <dt>Category</dt>
            <dd>{product.category}</dd>
          </div>

          <div>
            <dt>Pack size</dt>
            <dd>{product.detail}</dd>
          </div>

          <div>
            <dt>Availability</dt>
            <dd>In stock</dd>
          </div>
        </dl>
      </section>
    </main>
  );
}
