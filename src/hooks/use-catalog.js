"use client";

import { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  query,
  orderBy,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { getProductImage } from "../lib/product-image";

export function useCatalog() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadCatalog() {
      try {
        setLoading(true);
        setError("");

        const [productSnapshot, categorySnapshot] = await Promise.all([
          getDocs(collection(db, "products")),
          getDocs(
            query(collection(db, "categories"), orderBy("sortOrder", "asc"))
          ),
        ]);

        const loadedProducts = productSnapshot.docs
          .map((item) => {
            const product = item.data();
            return { ...product, image: getProductImage(product) };
          })
          .sort((a, b) => a.id - b.id);

        const loadedCategories = categorySnapshot.docs.map((item) => ({
          id: item.id,
          ...item.data(),
        }));

        if (active) {
          setProducts(loadedProducts);
          setCategories([
            { id: "all", name: "All", emoji: "🛍️" },
            ...loadedCategories,
          ]);
        }
      } catch (err) {
        console.error("Firestore catalog error:", err);

        if (active) {
          setError("Unable to load products. Please refresh the page.");
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadCatalog();

    return () => {
      active = false;
    };
  }, []);

  return { products, categories, loading, error };
}