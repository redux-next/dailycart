export const businessContact = {
  email:
    process.env.NEXT_PUBLIC_DAILYCART_SUPPORT_EMAIL?.trim() || "",
  phone:
    process.env.NEXT_PUBLIC_DAILYCART_SUPPORT_PHONE?.trim() || "",
  address:
    process.env.NEXT_PUBLIC_DAILYCART_BUSINESS_ADDRESS?.trim() || "",
  hours:
    process.env.NEXT_PUBLIC_DAILYCART_SUPPORT_HOURS?.trim() || "",
  social: {
    instagram:
      process.env.NEXT_PUBLIC_DAILYCART_INSTAGRAM_URL?.trim() || "",
    facebook:
      process.env.NEXT_PUBLIC_DAILYCART_FACEBOOK_URL?.trim() || "",
  },
};
