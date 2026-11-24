export default function robots() {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/admin/",
          "/delivery/",
          "/profile",
          "/orders",
          "/cart",
          "/checkout",
          "/complete-profile",
          "/track-order/",
        ],
      },
    ],
    sitemap: "https://dailycart.in/sitemap.xml",
  };
}
