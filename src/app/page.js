import HomeClient from "./home-client";

export const instant = false;

export const metadata = {
  title: "Groceries & Everyday Essentials in Chabua",
  description:
    "Shop groceries and everyday essentials with DailyCart, serving Chabua Town and nearby areas within 10 km.",
  alternates: { canonical: "/" },
};

export default function HomePage() {
  return <HomeClient />;
}