"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import { useAuth } from "../../../components/auth-provider";
import { cloudinaryImageUrl } from "../../../lib/cloudinary-image-url";

const MAX_IMAGES = 12;
const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;
const ACCEPTED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
]);

function imagesForProduct(product) {
  const storedImages = Array.isArray(product.images)
    ? [...product.images].sort((left, right) => (left.position || 0) - (right.position || 0))
    : [];
  const images = storedImages.length
    ? storedImages
    : product.image
      ? [{ url: product.image, publicId: null, isPrimary: true, position: 0 }]
      : [];
  const primaryUrl =
    product.image || images.find((image) => image.isPrimary)?.url;

  return images.map((image, index) => ({
    url: image.url,
    publicId: image.publicId || null,
    isPrimary: image.url === primaryUrl || (!primaryUrl && index === 0),
    position: index,
    filename: image.publicId?.split("/").at(-1) || "Existing image",
  }));
}

function emptyForm() {
  return {
    name: "",
    detail: "",
    category: "",
    price: "",
    originalPrice: "",
    badge: "",
    stock: "0",
  };
}

export default function AdminProductsClient() {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [productsError, setProductsError] = useState("");
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [images, setImages] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const [libraryOpen, setLibraryOpen] = useState(false);
  const [libraryAssets, setLibraryAssets] = useState([]);
  const [librarySelection, setLibrarySelection] = useState([]);
  const [librarySearch, setLibrarySearch] = useState("");
  const [libraryQuery, setLibraryQuery] = useState("");
  const [libraryCursor, setLibraryCursor] = useState(null);
  const [libraryLoading, setLibraryLoading] = useState(false);
  const [libraryError, setLibraryError] = useState("");
  const [uploadQueue, setUploadQueue] = useState([]);

  const categoryOptions = useMemo(
    () => [...new Set([
      ...categories.map((category) => category.name),
      ...products.map((product) => product.category),
    ].filter(Boolean))].sort(),
    [categories, products]
  );

  const apiRequest = useCallback(async (url, options = {}) => {
    if (!user) throw new Error("Please sign in again.");

    const token = await user.getIdToken();
    const response = await fetch(url, {
      ...options,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(options.body instanceof FormData
          ? {}
          : { "Content-Type": "application/json" }),
        ...options.headers,
      },
    });
    const result = await response.json().catch(() => ({}));

    if (!response.ok || result.success === false) {
      throw new Error(result.message || "The request failed. Please retry.");
    }

    return result;
  }, [user]);

  const loadProducts = useCallback(async () => {
    setProductsLoading(true);
    setProductsError("");

    try {
      const result = await apiRequest("/api/admin/products");
      setProducts(result.products || []);
      setCategories(result.categories || []);
    } catch (loadError) {
      setProductsError(loadError.message);
    } finally {
      setProductsLoading(false);
    }
  }, [apiRequest]);

  useEffect(() => {
    if (!authLoading && isAdmin) loadProducts();
  }, [authLoading, isAdmin, loadProducts]);

  function chooseProduct(product) {
    setEditingId(product.id);
    setForm({
      name: product.name || "",
      detail: product.detail || "",
      category: product.category || "",
      price: product.price ?? "",
      originalPrice: product.originalPrice ?? "",
      badge: product.badge || "",
      stock: product.stock ?? "",
    });
    setImages(imagesForProduct(product));
    setNotice("");
    setError("");
    setUploadQueue([]);
  }

  function startNewProduct() {
    setEditingId(null);
    setForm(emptyForm());
    setImages([]);
    setNotice("");
    setError("");
    setUploadQueue([]);
  }

  function updateForm(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  function setPrimaryImage(imageIndex) {
    setImages((current) =>
      current.map((image, index) => ({
        ...image,
        isPrimary: index === imageIndex,
      }))
    );
  }

  function moveImage(imageIndex, direction) {
    setImages((current) => {
      const target = imageIndex + direction;
      if (target < 0 || target >= current.length) return current;

      const reordered = [...current];
      [reordered[imageIndex], reordered[target]] = [
        reordered[target],
        reordered[imageIndex],
      ];
      return reordered.map((image, position) => ({ ...image, position }));
    });
  }

  function removeImage(imageIndex) {
    setImages((current) => {
      const remaining = current.filter((_, index) => index !== imageIndex);
      if (remaining.length && !remaining.some((image) => image.isPrimary)) {
        remaining[0] = { ...remaining[0], isPrimary: true };
      }
      return remaining.map((image, position) => ({ ...image, position }));
    });
  }

  async function loadLibraryPage(search, cursor, append = false) {
    setLibraryLoading(true);
    setLibraryError("");

    try {
      const query = new URLSearchParams({ search });
      if (cursor) query.set("next_cursor", cursor);
      const result = await apiRequest(`/api/admin/cloudinary?${query}`);
      setLibraryAssets((current) =>
        append ? [...current, ...result.assets] : result.assets
      );
      setLibraryCursor(result.nextCursor || null);
    } catch (loadError) {
      setLibraryError(loadError.message);
    } finally {
      setLibraryLoading(false);
    }
  }

  function openLibrary() {
    setLibraryOpen(true);
    setLibrarySearch("");
    setLibraryQuery("");
    setLibraryAssets([]);
    setLibrarySelection(images);
    setLibraryCursor(null);
    loadLibraryPage("", null);
  }

  function searchLibrary(event) {
    event.preventDefault();
    const nextQuery = librarySearch.trim();
    setLibraryQuery(nextQuery);
    setLibraryAssets([]);
    setLibraryCursor(null);
    loadLibraryPage(nextQuery, null);
  }

  function toggleLibraryAsset(asset) {
    setLibrarySelection((current) => {
      const selected = current.some(
        (image) => image.publicId === asset.publicId
      );
      if (selected) {
        return current.filter((image) => image.publicId !== asset.publicId);
      }

      const distinctImages = current.filter(
        (image) => image.publicId !== asset.publicId && image.url !== asset.url
      );
      if (distinctImages.length >= MAX_IMAGES) {
        setLibraryError(`A product can have up to ${MAX_IMAGES} images.`);
        return current;
      }

      return [
        ...distinctImages,
        {
          ...asset,
          isPrimary: distinctImages.length === 0,
          position: distinctImages.length,
        },
      ];
    });
    setLibraryError("");
  }

  function attachLibraryImages() {
    const nextImages = librarySelection
      .filter(
        (image, index, list) =>
          list.findIndex(
            (candidate) =>
              (image.publicId && candidate.publicId === image.publicId) ||
              candidate.url === image.url
          ) === index
      )
      .slice(0, MAX_IMAGES)
      .map((image, position) => ({
        ...image,
        url: cloudinaryImageUrl(image.url),
        isPrimary: image.isPrimary,
        position,
      }));

    if (nextImages.length && !nextImages.some((image) => image.isPrimary)) {
      nextImages[0].isPrimary = true;
    }
    setImages(nextImages);
    setLibraryOpen(false);
  }

  function uploadFile(file, queueId) {
    return new Promise((resolve, reject) => {
      const data = new FormData();
      data.append("file", file);

      user.getIdToken().then((token) => {
        const request = new XMLHttpRequest();
        request.open("POST", "/api/admin/cloudinary/upload");
        request.setRequestHeader("Authorization", `Bearer ${token}`);
        request.timeout = 70000;

        request.upload.onprogress = (event) => {
          if (!event.lengthComputable) return;
          setUploadQueue((current) =>
            current.map((item) =>
              item.id === queueId
                ? { ...item, progress: Math.round((event.loaded / event.total) * 100) }
                : item
            )
          );
        };

        request.onload = () => {
          let result;
          try {
            result = JSON.parse(request.responseText);
          } catch {
            reject(new Error("Upload returned an unreadable response."));
            return;
          }

          if (request.status < 200 || request.status >= 300 || !result.success) {
            reject(new Error(result.message || "Upload failed. Please retry."));
            return;
          }
          resolve(result.asset);
        };
        request.onerror = () => reject(new Error("Network error while uploading. Please retry."));
        request.ontimeout = () => reject(new Error("Upload timed out. Please retry."));
        request.send(data);
      }).catch(reject);
    });
  }

  async function retryUpload(item) {
    setUploadQueue((current) =>
      current.map((upload) =>
        upload.id === item.id
          ? { ...upload, status: "uploading", progress: 0, error: "" }
          : upload
      )
    );

    try {
      const asset = await uploadFile(item.file, item.id);
      const image = {
        ...asset,
        url: cloudinaryImageUrl(asset.url),
        isPrimary: images.length === 0,
        position: images.length,
      };

      setImages((current) => {
        if (
          current.length >= MAX_IMAGES ||
          current.some(
            (selected) =>
              selected.publicId === image.publicId ||
              selected.url === image.url
          )
        ) {
          return current;
        }

        return [
          ...current,
          { ...image, isPrimary: current.length === 0 },
        ];
      });
      setUploadQueue((current) =>
        current.map((upload) =>
          upload.id === item.id
            ? { ...upload, status: "complete", progress: 100, image }
            : upload
        )
      );
    } catch (uploadError) {
      setUploadQueue((current) =>
        current.map((upload) =>
          upload.id === item.id
            ? { ...upload, status: "error", error: uploadError.message }
            : upload
        )
      );
    }
  }

  async function handleUpload(event) {
    const files = Array.from(event.target.files || []);
    event.target.value = "";
    setError("");

    const validFiles = files.filter((file) => {
      if (!ACCEPTED_IMAGE_TYPES.has(file.type) || file.size <= 0 || file.size > MAX_UPLOAD_BYTES) {
        setUploadQueue((current) => [
          ...current,
          {
            id: `${Date.now()}-${Math.random()}`,
            name: file.name,
            status: "error",
            progress: 0,
            error: "Use a JPG, PNG, WebP or AVIF image up to 8 MB.",
          },
        ]);
        return false;
      }
      return true;
    });

    const freeSlots = MAX_IMAGES - images.length;
    if (validFiles.length > freeSlots) {
      setError(`There is room for ${freeSlots} more image${freeSlots === 1 ? "" : "s"}.`);
    }

    for (const file of validFiles.slice(0, freeSlots)) {
      const queueId = `${Date.now()}-${Math.random()}`;
      setUploadQueue((current) => [
        ...current,
        {
          id: queueId,
          name: file.name,
          file,
          status: "uploading",
          progress: 0,
        },
      ]);

      try {
        const asset = await uploadFile(file, queueId);
        const image = {
          ...asset,
          url: cloudinaryImageUrl(asset.url),
          isPrimary: images.length === 0 && !images.some((item) => item.isPrimary),
          position: images.length,
        };

        setImages((current) => {
          if (
            current.length >= MAX_IMAGES ||
            current.some(
              (item) => item.publicId === image.publicId || item.url === image.url
            )
          ) {
            return current;
          }

          return [
            ...current,
            { ...image, isPrimary: current.length === 0 },
          ];
        });
        setUploadQueue((current) =>
          current.map((item) =>
            item.id === queueId
              ? { ...item, status: "complete", progress: 100, image }
              : item
          )
        );
      } catch (uploadError) {
        setUploadQueue((current) =>
          current.map((item) =>
            item.id === queueId
              ? { ...item, status: "error", error: uploadError.message }
              : item
          )
        );
      }
    }
  }

  async function saveProduct(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");

    const payload = {
      ...form,
      price: form.price,
      originalPrice: form.originalPrice,
      stock: form.stock,
      images: images.map((image, position) => ({
        url: image.url,
        publicId: image.publicId || null,
        isPrimary: image.isPrimary,
        position,
      })),
    };

    try {
      const result = await apiRequest(
        editingId
          ? `/api/admin/products/${editingId}`
          : "/api/admin/products",
        {
          method: editingId ? "PATCH" : "POST",
          body: JSON.stringify(payload),
        }
      );

      setNotice(editingId ? "Product updated." : `Product #${result.productId} created.`);
      await loadProducts();
      if (!editingId) {
        setEditingId(result.productId);
        setForm({ ...form });
      }
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setSaving(false);
    }
  }

  if (authLoading || (!isAdmin && user)) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f6f8f4]">
        <p className="text-sm text-gray-500">Checking admin access…</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f6f8f4] px-4 py-6 sm:px-7 sm:py-9">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <Link href="/" className="text-sm font-bold text-green-800 hover:underline">
              ← DailyCart
            </Link>
            <p className="mt-4 text-xs font-bold uppercase tracking-[0.18em] text-green-700">
              Admin · Catalogue
            </p>
            <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
              Product management
            </h1>
            <p className="mt-2 text-sm text-gray-500">
              Create products and manage their Cloudinary images.
            </p>
          </div>
          <button
            type="button"
            onClick={startNewProduct}
            className="rounded-xl bg-green-700 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-green-800"
          >
            + Add product
          </button>
        </header>

        <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
          <section className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:p-6">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-extrabold text-gray-900">Products</h2>
                <p className="mt-1 text-xs text-gray-500">
                  {products.length} in the catalogue
                </p>
              </div>
              <button
                type="button"
                onClick={loadProducts}
                className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50"
              >
                Refresh
              </button>
            </div>

            {productsLoading ? (
              <div className="space-y-3" aria-label="Loading products">
                {[0, 1, 2, 3].map((item) => (
                  <div key={item} className="h-[68px] animate-pulse rounded-xl bg-gray-100" />
                ))}
              </div>
            ) : productsError ? (
              <div className="rounded-xl bg-red-50 p-4 text-sm text-red-800">
                <p>{productsError}</p>
                <button type="button" onClick={loadProducts} className="mt-3 font-bold underline">
                  Try again
                </button>
              </div>
            ) : products.length === 0 ? (
              <p className="rounded-xl bg-gray-50 p-5 text-sm text-gray-500">
                No products yet. Add your first product to get started.
              </p>
            ) : (
              <div className="max-h-[70vh] space-y-2 overflow-y-auto pr-1">
                {products.map((product) => {
                  const image = product.image || product.images?.[0]?.url;
                  return (
                    <button
                      type="button"
                      key={product.id}
                      onClick={() => chooseProduct(product)}
                      className={`flex w-full items-center gap-3 rounded-xl border p-2.5 text-left transition ${
                        editingId === product.id
                          ? "border-green-500 bg-green-50"
                          : "border-gray-100 hover:border-green-200 hover:bg-gray-50"
                      }`}
                    >
                      <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-gray-100">
                        {image && (
                          <Image
                            src={cloudinaryImageUrl(image, 120)}
                            alt=""
                            fill
                            sizes="48px"
                            className="object-cover"
                          />
                        )}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-bold text-gray-900">
                          {product.name}
                        </span>
                        <span className="mt-0.5 block text-xs text-gray-500">
                          #{product.id} · {product.category || "Uncategorized"}
                        </span>
                      </span>
                      <span className="text-xs font-bold text-gray-600">
                        ₹{Number(product.price || 0).toLocaleString("en-IN")}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </section>

          <form
            onSubmit={saveProduct}
            className="space-y-6 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:p-6"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-green-700">
                  {editingId ? `Editing product #${editingId}` : "New listing"}
                </p>
                <h2 className="mt-1 text-xl font-extrabold text-gray-900">
                  {editingId ? form.name || "Edit product" : "Add product"}
                </h2>
              </div>
              {editingId && (
                <button
                  type="button"
                  onClick={startNewProduct}
                  className="text-xs font-bold text-green-700 hover:underline"
                >
                  Create another
                </button>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="sm:col-span-2">
                <span className="mb-1.5 block text-xs font-bold text-gray-700">Product name</span>
                <input
                  required
                  maxLength={120}
                  name="name"
                  value={form.name}
                  onChange={updateForm}
                  className="w-full rounded-xl border border-gray-200 px-3.5 py-3 text-sm outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
                />
              </label>
              <label className="sm:col-span-2">
                <span className="mb-1.5 block text-xs font-bold text-gray-700">Description / pack size</span>
                <input
                  maxLength={300}
                  name="detail"
                  value={form.detail}
                  onChange={updateForm}
                  className="w-full rounded-xl border border-gray-200 px-3.5 py-3 text-sm outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
                />
              </label>
              <label>
                <span className="mb-1.5 block text-xs font-bold text-gray-700">Category</span>
                <select
                  required
                  name="category"
                  value={form.category}
                  onChange={updateForm}
                  disabled={categoryOptions.length === 0}
                  className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-3 text-sm outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100 disabled:bg-gray-100"
                >
                  <option value="">Choose category</option>
                  {categoryOptions.map((category) => <option key={category} value={category}>{category}</option>)}
                </select>
                {categoryOptions.length === 0 && (
                  <span className="mt-1 block text-xs text-red-700">
                    No categories are configured in the catalogue.
                  </span>
                )}
              </label>
              <label>
                <span className="mb-1.5 block text-xs font-bold text-gray-700">Badge</span>
                <input
                  maxLength={40}
                  name="badge"
                  value={form.badge}
                  onChange={updateForm}
                  className="w-full rounded-xl border border-gray-200 px-3.5 py-3 text-sm outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
                />
              </label>
              <label>
                <span className="mb-1.5 block text-xs font-bold text-gray-700">Price (₹)</span>
                <input
                  required
                  min="0"
                  step="0.01"
                  type="number"
                  name="price"
                  value={form.price}
                  onChange={updateForm}
                  className="w-full rounded-xl border border-gray-200 px-3.5 py-3 text-sm outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
                />
              </label>
              <label>
                <span className="mb-1.5 block text-xs font-bold text-gray-700">Original price (₹)</span>
                <input
                  required
                  min="0"
                  step="0.01"
                  type="number"
                  name="originalPrice"
                  value={form.originalPrice}
                  onChange={updateForm}
                  className="w-full rounded-xl border border-gray-200 px-3.5 py-3 text-sm outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
                />
              </label>
              <label>
                <span className="mb-1.5 block text-xs font-bold text-gray-700">
                  Available stock{editingId && form.stock === "" ? " (set before saving)" : ""}
                </span>
                <input
                  min="0"
                  step="1"
                  type="number"
                  name="stock"
                  value={form.stock}
                  onChange={updateForm}
                  className="w-full rounded-xl border border-gray-200 px-3.5 py-3 text-sm outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
                />
              </label>
            </div>

            <section aria-labelledby="product-images-heading" className="border-t border-gray-100 pt-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 id="product-images-heading" className="font-extrabold text-gray-900">
                    Product Images
                  </h3>
                  <p className="mt-1 text-xs text-gray-500">
                    {images.length} of {MAX_IMAGES} images · choose a primary image
                  </p>
                </div>
                <button
                  type="button"
                  onClick={openLibrary}
                  className="rounded-xl border border-green-200 bg-green-50 px-3.5 py-2.5 text-xs font-bold text-green-800 hover:bg-green-100"
                >
                  Browse Cloudinary Images
                </button>
              </div>

              <label className="mt-4 flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-gray-300 bg-gray-50 px-4 py-4 text-center text-sm font-bold text-gray-700 transition hover:border-green-400 hover:bg-green-50">
                <span aria-hidden="true">↑</span>
                Upload new images
                <span className="font-normal text-gray-500">· JPG, PNG, WebP, AVIF · max 8 MB each</span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/avif"
                  multiple
                  disabled={images.length >= MAX_IMAGES}
                  onChange={handleUpload}
                  className="sr-only"
                />
              </label>

              {images.length ? (
                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {images.map((image, index) => (
                    <div key={`${image.publicId || image.url}-${index}`} className="overflow-hidden rounded-xl border border-gray-200 bg-white">
                      <div className="relative aspect-square bg-gray-100">
                        <Image
                          src={cloudinaryImageUrl(image.url, 400)}
                          alt={image.filename || `Product image ${index + 1}`}
                          fill
                          sizes="(max-width: 640px) 45vw, 220px"
                          className="object-cover"
                        />
                        {image.isPrimary && (
                          <span className="absolute left-2 top-2 rounded-full bg-green-700 px-2.5 py-1 text-[10px] font-bold text-white shadow">
                            PRIMARY
                          </span>
                        )}
                      </div>
                      <div className="p-2.5">
                        <p className="truncate text-[11px] font-semibold text-gray-700" title={image.filename}>
                          {image.filename || image.publicId || "Product image"}
                        </p>
                        <div className="mt-2 flex items-center justify-between gap-1">
                          {!image.isPrimary && (
                            <button type="button" onClick={() => setPrimaryImage(index)} className="text-[11px] font-bold text-green-700 hover:underline">
                              Make primary
                            </button>
                          )}
                          <div className="ml-auto flex gap-1">
                            <button type="button" onClick={() => moveImage(index, -1)} disabled={index === 0} aria-label="Move image earlier" className="rounded-md border px-2 py-1 text-xs disabled:opacity-40">↑</button>
                            <button type="button" onClick={() => moveImage(index, 1)} disabled={index === images.length - 1} aria-label="Move image later" className="rounded-md border px-2 py-1 text-xs disabled:opacity-40">↓</button>
                            <button type="button" onClick={() => removeImage(index)} aria-label="Remove image" className="rounded-md border border-red-100 px-2 py-1 text-xs text-red-700 hover:bg-red-50">×</button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-4 rounded-xl bg-gray-50 px-4 py-5 text-center text-sm text-gray-500">
                  No images selected. Customers will see an image-unavailable fallback.
                </p>
              )}

              {uploadQueue.length > 0 && (
                <ul className="mt-4 space-y-2" aria-label="Image upload status">
                  {uploadQueue.map((item) => (
                    <li key={item.id} className="flex items-center gap-3 rounded-lg bg-gray-50 p-3 text-xs">
                      {item.image?.url && (
                        <span className="relative h-10 w-10 shrink-0 overflow-hidden rounded-md">
                          <Image src={cloudinaryImageUrl(item.image.url, 100)} alt="" fill sizes="40px" className="object-cover" />
                        </span>
                      )}
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-semibold text-gray-700">{item.name}</span>
                        {item.status === "uploading" && (
                          <span className="mt-1 block h-1.5 overflow-hidden rounded-full bg-gray-200">
                            <span className="block h-full bg-green-600 transition-all" style={{ width: `${item.progress}%` }} />
                          </span>
                        )}
                        {item.error && <span className="mt-1 block text-red-700">{item.error}</span>}
                      </span>
                      <span className={item.status === "error" ? "text-red-700" : "font-bold text-green-700"}>
                        {item.status === "complete" ? "Uploaded" : item.status === "error" ? "Failed" : `${item.progress}%`}
                      </span>
                      {item.status === "error" && item.file && (
                        <button
                          type="button"
                          onClick={() => retryUpload(item)}
                          className="font-bold text-red-700 underline"
                        >
                          Retry
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {(error || notice) && (
              <p role={error ? "alert" : "status"} className={`rounded-xl px-4 py-3 text-sm ${error ? "bg-red-50 text-red-800" : "bg-green-50 text-green-800"}`}>
                {error || notice}
              </p>
            )}
            <button
              type="submit"
              disabled={saving}
              className="w-full rounded-xl bg-green-700 px-5 py-3.5 text-sm font-bold text-white shadow-sm transition hover:bg-green-800 disabled:cursor-wait disabled:opacity-60"
            >
              {saving ? "Saving product…" : editingId ? "Save changes" : "Create product"}
            </button>
          </form>
        </div>
      </div>

      {libraryOpen && (
        <div className="fixed inset-0 z-[1200] flex items-end justify-center bg-gray-950/55 sm:items-center sm:p-6">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="cloudinary-dialog-title"
            className="flex max-h-[94dvh] w-full max-w-5xl flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl"
          >
            <header className="flex items-start justify-between gap-4 border-b border-gray-100 px-5 py-4 sm:px-7 sm:py-5">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-green-700">Connected media library</p>
                <h2 id="cloudinary-dialog-title" className="mt-1 text-xl font-extrabold text-gray-900">Choose Cloudinary images</h2>
                <p className="mt-1 text-xs text-gray-500">Select up to {MAX_IMAGES} images for this product.</p>
              </div>
              <button type="button" onClick={() => setLibraryOpen(false)} aria-label="Close image library" className="rounded-full border border-gray-200 px-3 py-1.5 text-lg text-gray-600 hover:bg-gray-50">×</button>
            </header>

            <form onSubmit={searchLibrary} className="flex gap-2 border-b border-gray-100 px-5 py-4 sm:px-7">
              <input
                type="search"
                value={librarySearch}
                onChange={(event) => setLibrarySearch(event.target.value)}
                placeholder="Search filename or public ID"
                maxLength={100}
                className="min-w-0 flex-1 rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
              />
              <button type="submit" disabled={libraryLoading} className="rounded-xl bg-gray-900 px-4 py-3 text-sm font-bold text-white hover:bg-gray-800 disabled:opacity-50">Search</button>
            </form>

            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-7">
              {libraryLoading && libraryAssets.length === 0 ? (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5" aria-label="Loading Cloudinary images">
                  {Array.from({ length: 10 }, (_, index) => (
                    <div key={index} className="aspect-square animate-pulse rounded-xl bg-gray-100" />
                  ))}
                </div>
              ) : libraryError && libraryAssets.length === 0 ? (
                <div className="rounded-2xl bg-red-50 p-6 text-center">
                  <p className="text-sm text-red-800">{libraryError}</p>
                  <button type="button" onClick={() => loadLibraryPage(libraryQuery, null)} className="mt-3 text-sm font-bold text-red-800 underline">Retry</button>
                </div>
              ) : libraryAssets.length === 0 ? (
                <div className="rounded-2xl bg-gray-50 px-4 py-12 text-center">
                  <p className="text-3xl" aria-hidden="true">▧</p>
                  <h3 className="mt-3 font-bold text-gray-900">No images found</h3>
                  <p className="mt-1 text-sm text-gray-500">Try another search or upload a new product image.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                  {libraryAssets.map((asset) => {
                    const selected = librarySelection.some((image) => image.publicId === asset.publicId);
                    return (
                      <button
                        type="button"
                        key={asset.publicId}
                        onClick={() => toggleLibraryAsset(asset)}
                        aria-pressed={selected}
                        className={`overflow-hidden rounded-xl border-2 text-left transition ${
                          selected ? "border-green-600 ring-2 ring-green-100" : "border-gray-100 hover:border-green-300"
                        }`}
                      >
                        <span className="relative block aspect-square bg-gray-100">
                          <Image src={cloudinaryImageUrl(asset.url, 400)} alt={asset.filename} fill sizes="(max-width: 640px) 45vw, 180px" className="object-cover" />
                          <span className={`absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                            selected ? "bg-green-700 text-white" : "border border-gray-300 bg-white/90 text-transparent"
                          }`}>✓</span>
                        </span>
                        <span className="block truncate px-2.5 py-2 text-[11px] font-semibold text-gray-700" title={asset.filename}>{asset.filename}</span>
                      </button>
                    );
                  })}
                </div>
              )}
              {libraryError && libraryAssets.length > 0 && (
                <div role="alert" className="mt-3 flex flex-wrap items-center gap-3 text-sm text-red-700">
                  <span>{libraryError}</span>
                  {libraryCursor && (
                    <button
                      type="button"
                      onClick={() => loadLibraryPage(libraryQuery, libraryCursor, true)}
                      className="font-bold underline"
                    >
                      Retry
                    </button>
                  )}
                </div>
              )}
              {libraryCursor && (
                <div className="py-5 text-center">
                  <button
                    type="button"
                    disabled={libraryLoading}
                    onClick={() => loadLibraryPage(libraryQuery, libraryCursor, true)}
                    className="rounded-xl border border-gray-200 px-5 py-3 text-sm font-bold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                  >
                    {libraryLoading ? "Loading…" : "Load more images"}
                  </button>
                </div>
              )}
            </div>

            <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 px-5 py-4 sm:px-7">
              <span className="text-sm text-gray-500">{librarySelection.length} selected</span>
              <div className="flex gap-2">
                <button type="button" onClick={() => setLibraryOpen(false)} className="rounded-xl border border-gray-200 px-4 py-3 text-sm font-bold text-gray-700">Cancel</button>
                <button type="button" onClick={attachLibraryImages} className="rounded-xl bg-green-700 px-5 py-3 text-sm font-bold text-white hover:bg-green-800">
                  Attach selected images
                </button>
              </div>
            </footer>
          </section>
        </div>
      )}
    </main>
  );
}
