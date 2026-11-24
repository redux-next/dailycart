export default function sitemap() {
  const lastModified = new Date("2026-11-24");

  return [
    {
      url: "https://dailycart.in",
      lastModified,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: "https://dailycart.in/privacy-policy",
      lastModified,
      changeFrequency: "yearly",
      priority: 0.7,
    },
    {
      url: "https://dailycart.in/delete-account",
      lastModified,
      changeFrequency: "yearly",
      priority: 0.8,
    },
    {
      url: "https://dailycart.in/about",
      lastModified,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: "https://dailycart.in/contact",
      lastModified,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: "https://dailycart.in/terms-and-conditions",
      lastModified,
      changeFrequency: "yearly",
      priority: 0.7,
    },
    {
      url: "https://dailycart.in/terms",
      lastModified,
      changeFrequency: "yearly",
      priority: 0.6,
    },
    {
      url: "https://dailycart.in/return-refund-policy",
      lastModified,
      changeFrequency: "yearly",
      priority: 0.7,
    },
    {
      url: "https://dailycart.in/shipping-delivery-policy",
      lastModified,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: "https://dailycart.in/help",
      lastModified,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: "https://dailycart.in/faqs",
      lastModified,
      changeFrequency: "monthly",
      priority: 0.7,
    },
  ];
}
