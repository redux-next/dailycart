"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { useAuth } from "./auth-provider";

const CartContext = createContext(null);
const guestCartStorageKey = "QuickBite-cart-guest";
const legacyCartStorageKey = "QuickBite-cart";

function validateCart(savedCart) {
  if (
    !savedCart ||
    typeof savedCart !== "object" ||
    Array.isArray(savedCart)
  ) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(savedCart).filter(
      ([id, quantity]) =>
        typeof id === "string" &&
        id.trim().length > 0 &&
        id.length <= 128 &&
        !["__proto__", "constructor", "prototype"].includes(id) &&
        Number.isSafeInteger(quantity) &&
        quantity > 0
    )
  );
}


async function readResponse(response, fallbackMessage) {
  const responseText = await response.text();

  if (!responseText) {
    throw new Error(
      `Server returned an empty response (HTTP ${response.status}).`
    );
  }

  let result;

  try {
    result = JSON.parse(responseText);
  } catch (error) {
    console.error("Invalid API response:", {
      status: response.status,
      body: responseText.slice(0, 500),
    });

    throw new Error(
      `Server returned an invalid response (HTTP ${response.status}).`
    );
  }

  if (
    !result ||
    typeof result !== "object" ||
    !response.ok ||
    result.success !== true
  ) {
    throw new Error(result?.message || fallbackMessage);
  }

  return result;
}


export function CartProvider({ children }) {
  const { user, loading: authLoading } = useAuth();
  const [cart, setCart] = useState({});
  const [isLoaded, setIsLoaded] = useState(false);
  const [cartOwner, setCartOwner] = useState(null);
  const [syncError, setSyncError] = useState("");
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [saveAttempt, setSaveAttempt] = useState(0);
  const saveQueue = useRef(Promise.resolve());

  useEffect(() => {
    let active = true;

    if (authLoading) {
      return () => {
        active = false;
      };
    }

    async function loadCart() {
      if (user) {
        try {
          const token = await user.getIdToken();
          const response = await fetch("/api/cart", {
            cache: "no-store",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          const result = await readResponse(
            response,
            "Unable to load your saved cart."
          );

          if (!active) return;

          setCart(validateCart(result.cart));
          setCartOwner(user.uid);
          setIsLoaded(true);
          setSyncError("");
          return;
        } catch (error) {
          console.error("Unable to load the account cart:", error);

          if (active) {
            setSyncError(
              "Unable to load your saved cart. Please retry."
            );
          }

          return;
        }
      }

      try {
        window.localStorage.removeItem(legacyCartStorageKey);
        const savedCart = window.localStorage.getItem(
          guestCartStorageKey
        );
        let guestCart = {};

        if (savedCart) {
          try {
            guestCart = validateCart(JSON.parse(savedCart));
          } catch (error) {
            console.error("Unable to parse the guest cart:", error);
            window.localStorage.removeItem(guestCartStorageKey);
          }
        }

        if (!active) return;

        setCart(guestCart);
        setCartOwner("guest");
        setIsLoaded(true);
        setSyncError("");
      } catch (error) {
        console.error("Unable to load the guest cart:", error);

        if (active) {
          setSyncError(
            "Unable to load your saved cart. Please retry."
          );
        }
      }
    }

    loadCart();

    return () => {
      active = false;
    };
  }, [user, authLoading, loadAttempt]);

  useEffect(() => {
    const owner = user?.uid || "guest";
    const effectiveLoaded =
      isLoaded &&
      cartOwner === owner &&
      !authLoading;

    if (!effectiveLoaded) {
      return;
    }

    if (!user) {
      try {
        window.localStorage.setItem(
          guestCartStorageKey,
          JSON.stringify(cart)
        );
        window.queueMicrotask(() => setSyncError(""));
      } catch (error) {
        console.error("Unable to save the guest cart:", error);
        window.queueMicrotask(() =>
          setSyncError("Unable to save your cart. Please retry.")
        );
      }

      return;
    }

    let active = true;
    const cartToSave = cart;
    const timerId = window.setTimeout(() => {
      saveQueue.current = saveQueue.current
        .then(async () => {
          const token = await user.getIdToken();
          const response = await fetch("/api/cart", {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ cart: cartToSave }),
          });

          await readResponse(
            response,
            "Unable to save your account cart."
          );
        })
        .then(() => {
          if (active) setSyncError("");
        })
        .catch((error) => {
          console.error("Unable to save the account cart:", error);

          if (active) {
            setSyncError(
              "Unable to save your account cart. Please retry."
            );
          }
        });
    }, 250);

    return () => {
      active = false;
      window.clearTimeout(timerId);
    };
  }, [
    cart,
    isLoaded,
    cartOwner,
    user,
    authLoading,
    saveAttempt,
  ]);

  const changeQuantity = useCallback((productId, amount) => {
    const id = String(productId);

    if (!id || !Number.isSafeInteger(amount) || amount === 0) {
      return;
    }

    setCart((currentCart) => {
      const nextQuantity = (currentCart[id] || 0) + amount;
      const nextCart = { ...currentCart };

      if (nextQuantity <= 0) {
        delete nextCart[id];
      } else {
        nextCart[id] = nextQuantity;
      }

      return nextCart;
    });
  }, []);

  const clearCart = useCallback(() => {
    setCart({});
  }, []);

  const retryCartSync = useCallback(() => {
    if (isLoaded) {
      setSaveAttempt((attempt) => attempt + 1);
    } else {
      setLoadAttempt((attempt) => attempt + 1);
    }
  }, [isLoaded]);

  const value = useMemo(
    () => {
      const effectiveOwner = user?.uid || "guest";
      const effectiveCart =
        !authLoading && isLoaded && cartOwner === effectiveOwner
          ? cart
          : {};
      const effectiveIsLoaded =
        !authLoading && isLoaded && cartOwner === effectiveOwner;

      return {
        cart: effectiveCart,
        changeQuantity,
        clearCart,
        isLoaded: effectiveIsLoaded,
      };
    },
    [
      cart,
      cartOwner,
      authLoading,
      isLoaded,
      user,
      changeQuantity,
      clearCart,
    ]
  );

  return (
    <CartContext.Provider value={value}>
      {syncError && (
        <div className="cart-sync-notice" role="alert">
          <span>{syncError}</span>
          <button type="button" onClick={retryCartSync}>
            Retry
          </button>
        </div>
      )}
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error("useCart must be used within a CartProvider.");
  }

  return context;
}
