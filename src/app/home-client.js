
"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getIdTokenResult } from "firebase/auth";
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";

import { db } from "../lib/firebase";
import { useCart } from "../components/cart-provider";
import { useAuth } from "../components/auth-provider";
import DeliveryDashboardClient from "../components/delivery-dashboard-client";
import DeleteAccountButton from "../components/delete-account-button";
import LoadingImage from "../components/loading-image";
import StorefrontLoading from "../components/storefront-loading";
import { useCatalog } from "../hooks/use-catalog";
import { PublicFooter } from "../components/public-site-chrome";

function Icon({ name, size = 20 }) {
  const shared = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": true,
  };

  if (name === "search") {
    return (
      <svg {...shared}>
        <circle cx="10.8" cy="10.8" r="6.8" />
        <path d="m16 16 4.5 4.5" />
      </svg>
    );
  }

  if (name === "pin") {
    return (
      <svg {...shared}>
        <path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0Z" />
        <circle cx="12" cy="10" r="2.2" />
      </svg>
    );
  }

  if (name === "chevron") {
    return (
      <svg {...shared}>
        <path d="m7 10 5 5 5-5" />
      </svg>
    );
  }

  if (name === "cart") {
    return (
      <svg {...shared}>
        <path d="M3 4h2l2.2 11.2a2 2 0 0 0 2 1.6h7.6a2 2 0 0 0 1.9-1.4L20 9H6" />
        <circle cx="10" cy="20" r="1" />
        <circle cx="17" cy="20" r="1" />
      </svg>
    );
  }

  if (name === "home") {
    return (
      <svg {...shared}>
        <path d="m3 10 9-7 9 7" />
        <path d="M5 9v11h14V9" />
        <path d="M9 20v-7h6v7" />
      </svg>
    );
  }

  if (name === "grid") {
    return (
      <svg {...shared}>
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    );
  }

  if (name === "package") {
    return (
      <svg {...shared}>
        <path d="m12 3 9 5v8l-9 5-9-5V8l9-5Z" />
        <path d="m3 8 9 5 9-5" />
        <path d="M12 13v8" />
        <path d="m7.5 5.5 9 5" />
      </svg>
    );
  }

  if (name === "plus") {
    return (
      <svg {...shared}>
        <path d="M12 5v14M5 12h14" />
      </svg>
    );
  }

  if (name === "minus") {
    return (
      <svg {...shared}>
        <path d="M5 12h14" />
      </svg>
    );
  }

  if (name === "clock") {
    return (
      <svg {...shared}>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </svg>
    );
  }

  return (
    <svg {...shared}>
      <path d="M5 12h14m-6-6 6 6-6 6" />
    </svg>
  );
}

function formatOrderDate(timestamp) {
  if (!timestamp) return "Placed recently";

  const date =
    typeof timestamp.toDate === "function"
      ? timestamp.toDate()
      : new Date(timestamp);

  if (Number.isNaN(date.getTime())) return "Placed recently";

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });
}

export default function Home() {
  const router = useRouter();

  const [activeCategory, setActiveCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [authError, setAuthError] = useState("");
  const [customerProfile, setCustomerProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [recentOrderState, setRecentOrderState] = useState({
    userId: null,
    orders: [],
    error: "",
  });

  // Independently verify the delivery role from Firebase.
  const [verifiedDeliveryRole, setVerifiedDeliveryRole] =
    useState(false);
  const [roleCheckLoading, setRoleCheckLoading] = useState(true);

  const {
    products,
    categories,
    loading: catalogLoading,
    error: catalogError,
  } = useCatalog();

  const {
    cart,
    changeQuantity,
    isLoaded: isCartLoaded,
  } = useCart();

  const {
    user,
    loading: authLoading,
    isAdmin,
    isDeliveryBoy,
    loginWithGoogle,
    logout,
  } = useAuth();

  // Verify the actual Firebase custom claim.
  useEffect(() => {
    let active = true;

    async function verifyDeliveryRole() {
      setRoleCheckLoading(true);
      setVerifiedDeliveryRole(false);

      if (!user) {
        if (active) {
          setRoleCheckLoading(false);
        }
        return;
      }

      try {
        const tokenResult = await getIdTokenResult(user, true);

        if (active) {
          const isDelivery =
            tokenResult.claims?.deliveryBoy === true;

          setVerifiedDeliveryRole(isDelivery);

          console.log("DailyCart role verification:", {
            uid: user.uid,
            email: user.email,
            deliveryBoy: isDelivery,
          });
        }
      } catch (error) {
        console.error(
          "Delivery role verification failed:",
          error
        );

        if (active) {
          setVerifiedDeliveryRole(false);
        }
      } finally {
        if (active) {
          setRoleCheckLoading(false);
        }
      }
    }

    verifyDeliveryRole();

    return () => {
      active = false;
    };
  }, [user]);

  // Load the customer's saved Firestore profile.
  useEffect(() => {
    let cancelled = false;

    async function loadCustomerProfile() {
      if (!user?.uid) {
        setCustomerProfile(null);
        setProfileLoading(false);
        return;
      }

      setProfileLoading(true);

      try {
        const profileRef = doc(db, "users", user.uid);
        const profileSnapshot = await getDoc(profileRef);

        if (!cancelled) {
          setCustomerProfile(
            profileSnapshot.exists()
              ? profileSnapshot.data()
              : null
          );
        }
      } catch (error) {
        console.error("Unable to load customer profile:", error);

        if (!cancelled) {
          setCustomerProfile(null);
        }
      } finally {
        if (!cancelled) {
          setProfileLoading(false);
        }
      }
    }

    loadCustomerProfile();

    return () => {
      cancelled = true;
    };
  }, [user?.uid]);

  useEffect(() => {
    let active = true;

    if (!user?.uid || isAdmin || isDeliveryBoy) {
      return () => {
        active = false;
      };
    }

    const ordersQuery = query(
      collection(db, "orders"),
      where("userId", "==", user.uid)
    );

    const unsubscribe = onSnapshot(
      ordersQuery,
      (snapshot) => {
        if (!active) return;

        const loadedOrders = snapshot.docs.map((item) => ({
          id: item.id,
          ...item.data(),
        }));

        loadedOrders.sort((a, b) => {
          const dateA = a.createdAt?.toMillis?.() || 0;
          const dateB = b.createdAt?.toMillis?.() || 0;
          return dateB - dateA;
        });

        setRecentOrderState({
          userId: user.uid,
          orders: loadedOrders.slice(0, 2),
          error: "",
        });
      },
      (error) => {
        console.error("Recent orders loading error:", error);

        if (active) {
          setRecentOrderState({
            userId: user.uid,
            orders: [],
            error: "We couldn't load your recent orders. Please try again.",
          });
        }
      }
    );

    return () => {
      active = false;
      unsubscribe();
    };
  }, [isAdmin, isDeliveryBoy, user?.uid]);

  const filteredProducts = products.filter((product) => {
    const matchesCategory =
      activeCategory === "All" ||
      product.category === activeCategory;

    const searchText =
      `${product.name} ${product.detail} ${product.category}`.toLowerCase();

    return (
      matchesCategory &&
      searchText.includes(search.trim().toLowerCase())
    );
  });

  const cartItems = products.filter(
    (product) => cart[String(product.id)]
  );

  const itemCount = Object.values(cart).reduce(
    (total, quantity) => total + quantity,
    0
  );

  const subtotal = cartItems.reduce(
    (total, product) =>
      total + product.price * cart[String(product.id)],
    0
  );

  const deliveryFee =
    subtotal === 0 || subtotal >= 299 ? 0 : 19;

  const handlingFee = subtotal === 0 ? 0 : 4;

  const total = subtotal + deliveryFee + handlingFee;
  const customerName =
    customerProfile?.name || user?.displayName || "";
  const customerFirstName = customerName.trim().split(/\s+/)[0];
  const isCustomer = Boolean(user && !isAdmin && !isDeliveryBoy);
  const recentOrders = recentOrderState.userId === user?.uid
    ? recentOrderState.orders
    : [];
  const recentOrdersLoading =
    isCustomer && recentOrderState.userId !== user.uid;
  const recentOrdersError =
    recentOrderState.userId === user?.uid ? recentOrderState.error : "";

  async function handleGoogleSignIn() {
    try {
      setAuthError("");
      await loginWithGoogle();
      setAccountMenuOpen(false);
    } catch (error) {
      console.error("Google sign-in error:", error);

      if (error.code === "auth/popup-closed-by-user") {
        setAuthError("Sign-in was cancelled.");
      } else if (error.code === "auth/unauthorized-domain") {
        setAuthError(
          "This domain is not authorized in Firebase."
        );
      } else {
        setAuthError(
          error.message || "Unable to sign in. Please try again."
        );
      }
    }
  }

  async function handleLogout() {
    try {
      await logout();
      setAccountMenuOpen(false);
      setAuthError("");
    } catch (error) {
      console.error("Sign-out error:", error);
      setAuthError("Unable to sign out. Please try again.");
    }
  }

  function showCheckoutNotice() {
    if (!isCartLoaded || itemCount === 0) return;

    router.push("/checkout");
  }

  function scrollToProducts() {
    document
      .getElementById("products")
      ?.scrollIntoView({ behavior: "smooth" });
  }

  function submitSearch(event) {
    event.preventDefault();
    setActiveCategory("All");
    scrollToProducts();
  }

  // Wait for Firebase authentication and role verification.
  if (authLoading || (user && roleCheckLoading)) {
    return <StorefrontLoading />;
  }

  // Only a verified delivery account gets the delivery dashboard.
  if (user && verifiedDeliveryRole) {
    return <DeliveryDashboardClient />;
  }

  return (
    <main className="storefront">
      <div className="announcement hidden sm:flex">
        <span className="announcement-sparkle">✳</span>
        A little less waiting, a lot more living.
        <span className="announcement-right">
          Chabua Town · Under 10 km delivery
        </span>
      </div>


      <header className="site-header">
        {/* Brand */}
        <Link
          className="brand"
          href="#top"
          aria-label="DailyCart home"
        >
          <div className="brand-logo-frame">
            <Image
              src="/dailycart_login_logo.png"
              alt="DailyCart"
              fill
              priority
              sizes="(max-width: 380px) 112px, (max-width: 700px) 140px, (max-width: 1024px) 145px, 180px"
              style={{ objectFit: "contain", objectPosition: "center" }}
            />
          </div>
        </Link>

        {/* Search */}
        <form
          className="search-box"
          role="search"
          onSubmit={submitSearch}
        >
          <Icon name="search" size={20} />

          <input
            type="search"
            placeholder="Search fruits, milk, snacks..."
            aria-label="Search groceries"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />

          <button
            className="search-submit-button"
            type="submit"
            aria-label="Search products"
          >
            Search
          </button>
        </form>

        {/* Account */}
        <div className="header-account-wrap">
          <button
            className="account-button"
            type="button"
            aria-label="Your account"
            aria-expanded={accountMenuOpen}
            onClick={() => {
              setAccountMenuOpen((previous) => !previous);
              setAuthError("");
            }}
          >
            <span className="account-avatar">
              {user?.displayName?.charAt(0)?.toUpperCase() || "A"}
            </span>

            <span className="account-label">
              {user
                ? user.displayName?.split(" ")[0] || "Account"
                : "Sign in"}
            </span>

            <Icon name="chevron" size={15} />
          </button>

          {accountMenuOpen && (
            <div className="account-dropdown" role="dialog" aria-label="Account menu">
              {user ? (
                <>
                  <div
                    style={{
                      display: "flex",
                      gap: "12px",
                      alignItems: "center",
                    }}
                  >
                    {user.photoURL ? (
                      <Image
                        src={user.photoURL}
                        alt=""
                        width={42}
                        height={42}
                        referrerPolicy="no-referrer"
                        style={{
                          borderRadius: "50%",
                          objectFit: "cover",
                        }}
                      />
                    ) : (
                      <span className="account-avatar">
                        {user.displayName?.charAt(0)?.toUpperCase() || "A"}
                      </span>
                    )}

                    <div style={{ minWidth: 0 }}>
                      <strong style={{ display: "block" }}>
                        {user.displayName || "DailyCart customer"}
                      </strong>
                      <span
                        style={{
                          display: "block",
                          fontSize: "12px",
                          color: "#777",
                          overflowWrap: "anywhere",
                        }}
                      >
                        {user.email}
                      </span>
                    </div>
                  </div>

                  <div
                    style={{
                      marginTop: "14px",
                      padding: "11px",
                      borderRadius: "10px",
                      background: "#f5f8f3",
                      fontSize: "12px",
                      lineHeight: 1.5,
                    }}
                  >
                    <strong style={{ display: "block", marginBottom: "4px" }}>
                      Delivery address
                    </strong>
                    <span style={{ color: "#626b61", display: "block" }}>
                      {profileLoading
                        ? "Loading your saved address..."
                        : customerProfile?.address
                          ? `${customerProfile.address}${customerProfile.pincode
                            ? `, ${customerProfile.pincode}`
                            : ""
                          }`
                          : "No delivery address saved yet."}
                    </span>

                    {customerProfile?.location?.latitude != null &&
                      customerProfile?.location?.longitude != null && (
                        <a
                          href={`https://www.google.com/maps?q=${customerProfile.location.latitude},${customerProfile.location.longitude}`}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            display: "inline-block",
                            marginTop: "7px",
                            color: "#278044",
                            fontWeight: 700,
                          }}
                        >
                          View saved GPS location ↗
                        </a>
                      )}

                    <Link
                      href="/complete-profile"
                      onClick={() => setAccountMenuOpen(false)}
                      style={{
                        display: "block",
                        marginTop: "8px",
                        color: "#278044",
                        fontWeight: 700,
                      }}
                    >
                      Update address and profile →
                    </Link>
                  </div>

                  <Link
                    href="/orders"
                    onClick={() => setAccountMenuOpen(false)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      width: "100%",
                      padding: "12px",
                      marginTop: "12px",
                      border: "1px solid #e5e7eb",
                      borderRadius: "10px",
                      color: "#202820",
                      fontSize: "14px",
                      fontWeight: 700,
                      textDecoration: "none",
                    }}
                  >
                    <span style={{ fontSize: "19px" }}>📦</span>
                    My Orders
                    <span style={{ marginLeft: "auto", color: "#278044" }}>→</span>
                  </Link>

                  <hr style={{ margin: "16px 0", borderColor: "#eee" }} />

                  <button
                    type="button"
                    onClick={handleLogout}
                    style={{
                      width: "100%",
                      padding: "11px",
                      border: "1px solid #e5e7eb",
                      borderRadius: "9px",
                      background: "#fff",
                      cursor: "pointer",
                      fontWeight: 600,
                    }}
                  >
                    Sign out
                  </button>

                  {!isAdmin && !isDeliveryBoy && (
                    <DeleteAccountButton className="delete-account-button" />
                  )}
                </>
              ) : (
                <>
                  <strong style={{ display: "block", marginBottom: "6px" }}>
                    Welcome to DailyCart!
                  </strong>
                  <p style={{ fontSize: "13px", color: "#777", marginBottom: "15px" }}>
                    Sign in to manage your account and delivery addresses.
                  </p>
                  <button
                    type="button"
                    onClick={handleGoogleSignIn}
                    disabled={authLoading}
                    style={{
                      width: "100%",
                      padding: "12px",
                      border: "1px solid #e5e7eb",
                      borderRadius: "9px",
                      background: "#fff",
                      cursor: "pointer",
                      fontWeight: 600,
                    }}
                  >
                    Continue with Google
                  </button>
                </>
              )}

              {authError && (
                <p
                  role="alert"
                  style={{ color: "#dc2626", fontSize: "12px", marginTop: "12px" }}
                >
                  {authError}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Cart */}
        <Link
          href="/cart"
          className="header-cart"
          aria-label={`My Cart, ${itemCount} items`}
        >
          <Icon name="cart" size={20} />
          <span className="cart-label">My Cart</span>

          {itemCount > 0 && (
            <span className="header-cart-count">{itemCount}</span>
          )}
        </Link>
      </header>


      <div className="header-rule" />

      <div className="page-shell" id="top">
        <section className="dashboard-welcome" aria-labelledby="welcome-title">
          <div className="dashboard-welcome-copy">
            <p className="dashboard-eyebrow">
              {user ? "YOUR DAILYCART DASHBOARD" : "WELCOME TO DAILYCART"}
            </p>
            <h1 id="welcome-title">
              {user
                ? `Good to see you${customerFirstName ? `, ${customerFirstName}` : ""}.`
                : "Shop fresh, every day."}
            </h1>
            <p>Everyday groceries and essentials, made easy.</p>
          </div>

          <Link
            href={user ? "/profile" : "/login"}
            className="dashboard-address"
            aria-label={
              user
                ? "View your saved delivery address"
                : "Sign in to add a delivery address"
            }
          >
            <span className="dashboard-address-icon">
              <Icon name="pin" size={19} />
            </span>
            <span className="dashboard-address-copy">
              <span>Delivering to</span>
              <strong>
                {!user
                  ? "Set your address"
                  : profileLoading
                    ? "Loading saved address…"
                    : customerProfile?.address
                      ? `${customerProfile.address}${
                          customerProfile.pincode
                            ? `, ${customerProfile.pincode}`
                            : ""
                        }`
                      : "Add your delivery address"}
              </strong>
            </span>
            <span className="dashboard-address-arrow" aria-hidden="true">
              <Icon name="arrow" size={16} />
            </span>
          </Link>
        </section>

        <section className="dashboard-promo" aria-labelledby="promo-title">
          <Image
            src="https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1500&q=90"
            alt=""
            fill
            priority
            sizes="(max-width: 700px) 100vw, 1180px"
            style={{
              objectFit: "cover",
              objectPosition: "center 52%",
            }}
          />
          <div className="dashboard-promo-shade" />
          <div className="dashboard-promo-copy">
            <span>FRESH PICKS · CHABUA TOWN</span>
            <h2 id="promo-title">Good food, right around the corner.</h2>
            <p>Fresh finds for your everyday table, delivered with care.</p>
            <button
              className="dashboard-promo-button"
              type="button"
              onClick={scrollToProducts}
            >
              Shop today&apos;s picks
              <Icon name="arrow" size={17} />
            </button>
          </div>
          <span className="dashboard-promo-stamp">Freshness, delivered</span>
        </section>

        <section
          className="dashboard-benefits"
          aria-label="DailyCart benefits"
        >
          <span><Icon name="clock" size={15} /> Under 10 km delivery</span>
          <span><Icon name="grid" size={15} /> Fresh everyday picks</span>
          <span>Free delivery over ₹299</span>
        </section>

        <nav className="dashboard-quick-links" aria-label="Customer shortcuts">
          <Link href="#products" className="dashboard-shortcut">
            <span className="dashboard-shortcut-icon">
              <Icon name="cart" size={20} />
            </span>
            <span>
              <strong>Shop groceries</strong>
              <small>Browse everyday essentials</small>
            </span>
            <Icon name="arrow" size={16} />
          </Link>
          <Link href="#categories" className="dashboard-shortcut">
            <span className="dashboard-shortcut-icon">
              <Icon name="grid" size={20} />
            </span>
            <span>
              <strong>Categories</strong>
              <small>Find your favourites</small>
            </span>
            <Icon name="arrow" size={16} />
          </Link>
          <Link href="/orders" className="dashboard-shortcut">
            <span className="dashboard-shortcut-icon">
              <Icon name="package" size={20} />
            </span>
            <span>
              <strong>My orders</strong>
              <small>Track your deliveries</small>
            </span>
            <Icon name="arrow" size={16} />
          </Link>
          <Link href="/profile" className="dashboard-shortcut">
            <span className="dashboard-shortcut-icon">
              <Icon name="pin" size={20} />
            </span>
            <span>
              <strong>My account</strong>
              <small>Profile &amp; address</small>
            </span>
            <Icon name="arrow" size={16} />
          </Link>
        </nav>

        {isCustomer && (
          <section className="dashboard-recent-orders" aria-labelledby="recent-orders-title">
            <div className="dashboard-section-heading">
              <div>
                <p className="dashboard-eyebrow">YOUR SHOPPING</p>
                <h2 id="recent-orders-title">Recent orders</h2>
              </div>
              <Link href="/orders">View all orders <span aria-hidden="true">→</span></Link>
            </div>

            {recentOrdersLoading && (
              <p className="dashboard-orders-message" role="status">
                Loading your recent orders…
              </p>
            )}

            {recentOrdersError && (
              <div className="dashboard-orders-message is-error" role="alert">
                <span>{recentOrdersError}</span>
                <Link href="/orders">Open My Orders</Link>
              </div>
            )}

            {!recentOrdersLoading &&
              !recentOrdersError &&
              recentOrders.length === 0 && (
                <div className="dashboard-orders-empty">
                  <p>Your recent orders will appear here.</p>
                  <Link href="#products">Start shopping <span aria-hidden="true">→</span></Link>
                </div>
              )}

            {!recentOrdersLoading && !recentOrdersError && recentOrders.length > 0 && (
              <div className="dashboard-order-list">
                {recentOrders.map((order) => {
                  const status = String(order.orderStatus || "Processing")
                    .replaceAll("_", " ")
                    .replaceAll("-", " ");
                  const itemCountForOrder = Array.isArray(order.items)
                    ? order.items.length
                    : 0;
                  const orderTotal = Number(order.pricing?.total || 0);

                  return (
                    <article className="dashboard-order-card" key={order.id}>
                      <div className="dashboard-order-main">
                        <span className="dashboard-order-icon" aria-hidden="true">
                          <Icon name="package" size={19} />
                        </span>
                        <div className="dashboard-order-copy">
                          <strong>Order {order.orderId || order.id}</strong>
                          <span>
                            {formatOrderDate(order.createdAt)} ·{" "}
                            {itemCountForOrder}{" "}
                            {itemCountForOrder === 1 ? "item" : "items"}
                          </span>
                        </div>
                      </div>
                      <span className="dashboard-order-status">{status}</span>
                      <strong className="dashboard-order-total">
                        ₹{orderTotal.toLocaleString("en-IN")}
                      </strong>
                      <Link
                        href={`/track-order/${encodeURIComponent(order.id)}`}
                        className="dashboard-order-track"
                      >
                        Track order <span aria-hidden="true">→</span>
                      </Link>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        )}

        <section
          className="category-section"
          id="categories"
          aria-labelledby="category-title"
        >
          <div className="section-heading category-heading">
            <div>
              <p className="eyebrow">THE GOOD STUFF, SORTED</p>
              <h2 id="category-title">Shop by category</h2>
            </div>

            <span className="category-hint">
              A little bit of everything, all in one place.
            </span>
          </div>

          <div
            className="category-list"
            role="tablist"
            aria-label="Grocery categories"
          >
            {categories.map((category) => (
              <button
                className={`category-item${activeCategory === category.name
                    ? " is-active"
                    : ""
                  }`}
                key={category.id}
                type="button"
                role="tab"
                aria-selected={activeCategory === category.name}
                onClick={() =>
                  setActiveCategory(category.name)
                }
              >
                <span
                  className="category-emoji"
                  aria-hidden="true"
                >
                  {category.emoji}
                </span>

                <span>{category.name}</span>
              </button>
            ))}
          </div>
        </section>

        <div className="shopping-layout" id="products">
          <section
            className="product-section"
            aria-labelledby="products-title"
          >
            <div className="section-heading product-heading">
              <div>
                <p className="eyebrow">A GOOD DAY STARTS HERE</p>
                <h2 id="products-title">
                  {search
                    ? "Search results"
                    : activeCategory === "All"
                      ? "Everyday favourites"
                      : activeCategory}
                </h2>
              </div>

              <span className="product-count">
                {catalogLoading
                  ? "Loading..."
                  : `${filteredProducts.length} lovely finds`}
              </span>
            </div>

            {catalogLoading ? (
              <div className="empty-search">
                <span>🥬</span>
                <h3>Loading fresh finds...</h3>
                <p>
                  Getting the good stuff from our store.
                </p>
              </div>
            ) : catalogError ? (
              <div className="empty-search">
                <span>⚠️</span>
                <h3>Couldn&apos;t load products</h3>
                <p>{catalogError}</p>

                <button
                  type="button"
                  onClick={() => window.location.reload()}
                >
                  Try again
                </button>
              </div>
            ) : filteredProducts.length > 0 ? (
              <div className="product-grid">
                {filteredProducts.map((product) => (
                  <article
                    className="product-card"
                    key={product.id}
                  >
                    <div className="product-image-wrap">
                      <Link
                        className="product-image-link"
                        href={`/products/${product.id}`}
                        prefetch
                        aria-label={`View ${product.name}`}
                      >
                        <LoadingImage
                          src={product.image}
                          alt={product.name}
                          sizes="(max-width: 600px) 44vw, (max-width: 1000px) 28vw, 20vw"
                        />
                      </Link>

                      <span className="product-badge">
                        {product.badge}
                      </span>

                      {cart[product.id] > 0 && (
                        <span className="in-cart-label">
                          {cart[product.id]} in bag
                        </span>
                      )}
                    </div>

                    <div className="product-info">
                      <Link
                        className="product-info-link"
                        href={`/products/${product.id}`}
                        prefetch
                      >
                        <p className="product-detail">
                          {product.detail}
                        </p>

                        <h3>{product.name}</h3>
                      </Link>

                      <div className="product-buy-row">
                        <div className="price-block">
                          <strong>₹{product.price}</strong>
                          <del>₹{product.originalPrice}</del>
                        </div>

                        {cart[product.id] ? (
                          <div
                            className="quantity-control"
                            aria-label={`${product.name} quantity`}
                          >
                            <button
                              type="button"
                              onClick={() =>
                                changeQuantity(product.id, -1)
                              }
                              aria-label={`Remove one ${product.name}`}
                            >
                              <Icon name="minus" size={15} />
                            </button>

                            <span aria-live="polite">
                              {cart[product.id]}
                            </span>

                            <button
                              type="button"
                              onClick={() =>
                                changeQuantity(product.id, 1)
                              }
                              aria-label={`Add one ${product.name}`}
                            >
                              <Icon name="plus" size={15} />
                            </button>
                          </div>
                        ) : (
                          <button
                            className="add-button"
                            type="button"
                            onClick={() =>
                              changeQuantity(product.id, 1)
                            }
                            aria-label={`Add ${product.name} to cart`}
                          >
                            Add
                            <Icon name="plus" size={15} />
                          </button>
                        )}
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="empty-search">
                <span>🥬</span>
                <h3>Nothing in the basket just yet</h3>
                <p>
                  Try another search, or browse all the good stuff.
                </p>

                <button
                  type="button"
                  onClick={() => {
                    setSearch("");
                    setActiveCategory("All");
                  }}
                >
                  See everything
                </button>
              </div>
            )}
          </section>

          <aside
            className="cart-panel"
            aria-labelledby="cart-title"
          >
            <div className="cart-panel-heading">
              <div>
                <p className="eyebrow">THE BEST PART</p>
                <h2 id="cart-title">
                  Your basket <span>({itemCount})</span>
                </h2>
              </div>

              <span className="basket-art">✳</span>
            </div>

            {!isCartLoaded ? (
              <div
                className="cart-loading-skeleton"
                aria-label="Loading basket"
              >
                <span className="loading-skeleton cart-skeleton-row" />
                <span className="loading-skeleton cart-skeleton-row" />
                <span className="loading-skeleton cart-skeleton-total" />
              </div>
            ) : cartItems.length > 0 ? (
              <>
                <div className="cart-items">
                  {cartItems.map((product) => (
                    <div
                      className="cart-item"
                      key={product.id}
                    >
                      <div className="cart-item-image">
                        <LoadingImage
                          src={product.image}
                          alt=""
                          sizes="52px"
                        />
                      </div>

                      <div className="cart-item-copy">
                        <strong>{product.name}</strong>
                        <span>
                          ₹{product.price} × {cart[String(product.id)]}
                        </span>
                      </div>

                      <div className="cart-item-total">
                        ₹{product.price * cart[String(product.id)]}
                      </div>

                      <div className="cart-mini-quantity">
                        <button
                          type="button"
                          onClick={() =>
                            changeQuantity(product.id, -1)
                          }
                          aria-label={`Remove one ${product.name}`}
                        >
                          <Icon name="minus" size={13} />
                        </button>

                        <span>{cart[String(product.id)]}</span>

                        <button
                          type="button"
                          onClick={() =>
                            changeQuantity(product.id, 1)
                          }
                          aria-label={`Add one ${product.name}`}
                        >
                          <Icon name="plus" size={13} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="cart-note">
                  <span>✦</span>
                  {subtotal >= 299
                    ? "You unlocked free delivery!"
                    : `Add ₹${299 - subtotal} more for free delivery`}
                </div>

                <div className="bill-lines">
                  <div>
                    <span>Item total</span>
                    <span>₹{subtotal}</span>
                  </div>

                  <div>
                    <span>Delivery fee</span>
                    <span>
                      {deliveryFee === 0 ? (
                        <em>FREE</em>
                      ) : (
                        `₹${deliveryFee}`
                      )}
                    </span>
                  </div>

                  <div>
                    <span>Handling</span>
                    <span>₹{handlingFee}</span>
                  </div>
                </div>

                <div className="cart-total">
                  <strong>To pay</strong>
                  <strong>₹{total}</strong>
                </div>

                <button
                  className="checkout-button"
                  type="button"
                  onClick={showCheckoutNotice}
                  disabled={!isCartLoaded}
                >
                  Continue to checkout
                  <Icon name="arrow" size={17} />
                </button>

                <p className="checkout-caption">
                  Fast delivery, happy fridge.
                </p>
              </>
            ) : (
              <div className="empty-cart">
                <span className="empty-cart-illustration">
                  🧺
                </span>

                <h3>
                  Your basket is taking a little break
                </h3>

                <p>
                  Add a few favourites and we’ll bring them right
                  over.
                </p>

                <button
                  type="button"
                  onClick={scrollToProducts}
                >
                  Find your favourites
                  <Icon name="arrow" size={15} />
                </button>
              </div>
            )}
          </aside>
        </div>

      </div>

      <PublicFooter />
    </main>
  );
}
