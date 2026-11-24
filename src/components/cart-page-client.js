
"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useRouter } from "next/navigation";

import { useCart } from "./cart-provider";
import { useCatalog } from "../hooks/use-catalog";
import LoadingImage from "./loading-image";

function formatPrice(value) {
  return `₹${Number(value || 0).toLocaleString("en-IN")}`;
}

export default function CartPageClient() {
  const router = useRouter();

  const {
    cart,
    changeQuantity,
    isLoaded: cartLoaded,
  } = useCart();

  const {
    products = [],
    loading: catalogLoading,
    error: catalogError,
  } = useCatalog();

  const cartItems = useMemo(() => {
    return products
      .filter((product) => Number(cart[String(product.id)]) > 0)
      .map((product) => ({
        ...product,
        quantity: cart[String(product.id)],
      }));
  }, [products, cart]);

  const missingItems = useMemo(() => {
    return Object.entries(cart).filter(
      ([id, quantity]) =>
        quantity > 0 &&
        !products.some(
          (product) => String(product.id) === id
        )
    );
  }, [cart, products]);

  const itemCount = Object.values(cart).reduce(
    (sum, quantity) => sum + quantity,
    0
  );

  const subtotal = cartItems.reduce(
    (sum, product) =>
      sum + Number(product.price || 0) * product.quantity,
    0
  );

  const deliveryFee =
    subtotal === 0 || subtotal >= 299 ? 0 : 19;

  const handlingFee = subtotal === 0 ? 0 : 4;

  const total = subtotal + deliveryFee + handlingFee;

  const isLoading = !cartLoaded || catalogLoading;

  const canCheckout =
    !isLoading &&
    itemCount > 0 &&
    cartItems.length > 0 &&
    missingItems.length === 0 &&
    !catalogError;

  function removeItem(productId) {
    const quantity = cart[String(productId)] || 0;

    if (quantity > 0) {
      changeQuantity(productId, -quantity);
    }
  }

  function proceedToCheckout() {
    if (!canCheckout) return;

    router.push("/checkout");
  }

  return (
    <main className="min-h-screen bg-[#f7faf7] px-3 py-5 sm:px-6 sm:py-8 lg:px-10">
      <div className="mx-auto max-w-6xl">

        {/* Header */}
        <header className="mb-6 flex items-center justify-between sm:mb-8">
          <Link
            href="/"
            className="text-xl font-extrabold tracking-tight text-gray-900 sm:text-2xl"
          >
            DailyCart<span className="text-green-600">.</span>
          </Link>

          <Link
            href="/"
            className="text-xs font-semibold text-green-700 transition hover:text-green-800 sm:text-sm"
          >
            ← Continue shopping
          </Link>
        </header>

        {/* Page heading */}
        <div className="mb-5 sm:mb-8">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-green-700 sm:text-xs">
            YOUR SHOPPING BAG
          </p>

          <h1 className="mt-1.5 text-2xl font-extrabold text-gray-900 sm:mt-2 sm:text-4xl">
            Your basket
          </h1>

          <p className="mt-1 text-xs text-gray-500 sm:mt-2 sm:text-sm">
            {itemCount} {itemCount === 1 ? "item" : "items"} in your basket
          </p>
        </div>

        {/* Loading */}
        {isLoading ? (
          <div className="flex min-h-64 items-center justify-center rounded-2xl bg-white sm:min-h-72 sm:rounded-3xl">
            <div className="text-center">
              <div className="mx-auto h-9 w-9 animate-spin rounded-full border-4 border-green-200 border-t-green-600 sm:h-10 sm:w-10" />

              <p className="mt-3 text-xs text-gray-500 sm:mt-4 sm:text-sm">
                Loading your basket...
              </p>
            </div>
          </div>
        ) : catalogError ? (
          /* Catalogue error */
          <div className="rounded-2xl border border-red-100 bg-white p-5 text-center sm:rounded-3xl sm:p-8">
            <div className="text-3xl sm:text-4xl">⚠️</div>

            <h2 className="mt-3 font-bold text-red-700 sm:mt-4">
              Couldn&apos;t load your products
            </h2>

            <p className="mt-2 text-xs text-gray-500 sm:text-sm">
              {String(catalogError)}
            </p>

            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-4 rounded-xl bg-green-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-green-700"
            >
              Try again
            </button>
          </div>
        ) : cartItems.length === 0 && missingItems.length === 0 ? (
          /* Empty cart */
          <section className="rounded-2xl border border-gray-100 bg-white px-5 py-12 text-center shadow-sm sm:rounded-3xl sm:px-6 sm:py-16">
            <div className="text-5xl sm:text-6xl">🧺</div>

            <h2 className="mt-4 text-xl font-bold text-gray-900 sm:mt-6 sm:text-2xl">
              Your basket is empty
            </h2>

            <p className="mx-auto mt-2 max-w-sm text-xs leading-6 text-gray-500 sm:mt-3 sm:text-sm">
              Looks like you haven&apos;t added anything yet.
              Discover fresh groceries and everyday essentials.
            </p>

            <Link
              href="/"
              className="mt-6 inline-flex rounded-xl bg-green-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-green-700 sm:mt-7 sm:px-7 sm:py-3.5"
            >
              Start shopping
            </Link>
          </section>
        ) : (
          <div className="grid items-start gap-4 sm:gap-7 lg:grid-cols-[1fr_360px]">

            {/* Cart products */}
            <section className="min-w-0 space-y-3 sm:space-y-4">
              {cartItems.map((product) => (
                <article
                  key={product.id}
                  className="flex gap-3 rounded-xl border border-gray-100 bg-white p-3 shadow-sm transition hover:shadow-md sm:gap-6 sm:rounded-2xl sm:p-5"
                >
                  {/* Product image */}
                  <Link
                    href={`/products/${product.id}`}
                    className="group relative block h-[84px] w-[84px] shrink-0 overflow-hidden rounded-xl border border-green-100 bg-[#f0f8f0] sm:h-32 sm:w-32 sm:rounded-2xl"
                  >
                    <div className="absolute inset-1.5 overflow-hidden rounded-lg bg-white sm:inset-2 sm:rounded-xl">
                      <LoadingImage
                        src={product.image}
                        alt={product.name}
                        sizes="128px"
                        objectFit="contain"
                        className="p-1.5 transition-transform duration-300 group-hover:scale-105 sm:p-2"
                      />
                    </div>
                  </Link>

                  {/* Product details */}
                  <div className="flex min-w-0 flex-1 flex-col justify-between">
                    <div className="min-w-0">
                      <p className="text-[10px] font-medium text-green-700 sm:text-xs">
                        {product.category}
                      </p>

                      <Link href={`/products/${product.id}`}>
                        <h2 className="mt-0.5 line-clamp-2 text-sm font-bold leading-5 text-gray-900 transition hover:text-green-700 sm:mt-1 sm:text-base sm:leading-normal">
                          {product.name}
                        </h2>
                      </Link>

                      <p className="mt-0.5 hidden text-xs text-gray-500 sm:mt-1 sm:block">
                        {product.detail}
                      </p>

                      <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 sm:mt-2">
                        <p className="text-sm font-bold text-gray-900 sm:text-base">
                          {formatPrice(product.price)}
                        </p>

                        <span className="text-[10px] text-gray-400 sm:hidden">
                          Total: {formatPrice(
                            Number(product.price || 0) * product.quantity
                          )}
                        </span>
                      </div>
                    </div>

                    {/* Quantity controls */}
                    <div className="mt-2 flex flex-wrap items-center justify-between gap-2 sm:mt-4 sm:gap-3">
                      <div className="flex items-center overflow-hidden rounded-lg border border-gray-200">
                        <button
                          type="button"
                          onClick={() =>
                            changeQuantity(product.id, -1)
                          }
                          aria-label={`Decrease ${product.name} quantity`}
                          className="px-2.5 py-1.5 text-sm font-bold text-gray-700 transition hover:bg-gray-100 sm:px-3 sm:py-2 sm:text-base"
                        >
                          −
                        </button>

                        <span className="min-w-7 text-center text-xs font-bold sm:min-w-9 sm:text-sm">
                          {product.quantity}
                        </span>

                        <button
                          type="button"
                          onClick={() =>
                            changeQuantity(product.id, 1)
                          }
                          aria-label={`Increase ${product.name} quantity`}
                          className="px-2.5 py-1.5 text-sm font-bold text-gray-700 transition hover:bg-gray-100 sm:px-3 sm:py-2 sm:text-base"
                        >
                          +
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => removeItem(product.id)}
                        className="text-[10px] font-semibold text-red-500 transition hover:text-red-700 sm:text-xs"
                      >
                        Remove
                      </button>
                    </div>
                  </div>

                  {/* Item total - desktop */}
                  <div className="hidden text-right text-sm font-bold text-gray-900 sm:block">
                    {formatPrice(
                      Number(product.price || 0) * product.quantity
                    )}
                  </div>
                </article>
              ))}

              {/* Unavailable products */}
              {missingItems.map(([id]) => (
                <div
                  key={id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3 sm:rounded-2xl sm:gap-4 sm:p-4"
                >
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      Unavailable product
                    </p>

                    <p className="mt-1 text-[10px] text-gray-600 sm:text-xs">
                      This product is no longer in the catalogue.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => removeItem(id)}
                    className="shrink-0 text-xs font-bold text-red-600 sm:text-sm"
                  >
                    Remove
                  </button>
                </div>
              ))}

              <Link
                href="/"
                className="inline-flex pt-1 text-xs font-semibold text-green-700 transition hover:text-green-800 sm:pt-2 sm:text-sm"
              >
                ← Add more products
              </Link>
            </section>

            {/* Bill summary */}
            <aside className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm sm:rounded-2xl sm:p-6 lg:sticky lg:top-6">
              <h2 className="text-base font-extrabold text-gray-900 sm:text-lg">
                Bill details
              </h2>

              <div className="mt-4 space-y-3 border-b border-dashed border-gray-200 pb-4 text-xs sm:mt-6 sm:space-y-4 sm:pb-5 sm:text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Item total</span>

                  <span className="font-semibold text-gray-900">
                    {formatPrice(subtotal)}
                  </span>
                </div>

                <div className="flex justify-between text-gray-600">
                  <span>Delivery fee</span>

                  {deliveryFee === 0 ? (
                    <span className="font-bold text-green-600">
                      FREE
                    </span>
                  ) : (
                    <span className="font-semibold text-gray-900">
                      {formatPrice(deliveryFee)}
                    </span>
                  )}
                </div>

                <div className="flex justify-between text-gray-600">
                  <span>Handling fee</span>

                  <span className="font-semibold text-gray-900">
                    {formatPrice(handlingFee)}
                  </span>
                </div>
              </div>

              <div className="flex justify-between py-4 text-sm font-extrabold text-gray-900 sm:py-5 sm:text-base">
                <span>Grand total</span>
                <span>{formatPrice(total)}</span>
              </div>

              {subtotal > 0 && subtotal < 299 && (
                <p className="mb-4 rounded-lg bg-green-50 p-3 text-[10px] leading-5 text-green-800 sm:mb-5 sm:rounded-xl sm:text-xs">
                  Add {formatPrice(299 - subtotal)} more to unlock free delivery.
                </p>
              )}

              {missingItems.length > 0 && (
                <p className="mb-3 text-[10px] text-amber-700 sm:mb-4 sm:text-xs">
                  Remove unavailable products before continuing.
                </p>
              )}

              {/* Checkout */}
              <button
                type="button"
                onClick={proceedToCheckout}
                disabled={!canCheckout}
                className="w-full rounded-xl bg-green-600 px-4 py-3.5 text-xs font-bold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-600 sm:px-5 sm:py-4 sm:text-sm"
              >
                Proceed to checkout →
              </button>

              <div className="mt-4 space-y-1.5 text-center text-[10px] text-gray-400 sm:mt-5 sm:space-y-2 sm:text-xs">
                <p>🔒 Secure shopping experience</p>
                <p>Your cart is saved on this device.</p>
              </div>
            </aside>
          </div>
        )}
      </div>
    </main>
  );
}
