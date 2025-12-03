import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("login", "routes/login.tsx"),
  route("signup", "routes/signup.tsx"),
  route("dashboard", "routes/dashboard.tsx"),
  route("users", "routes/users.tsx"),
  route("home-content", "routes/home-content.tsx"),
  route("products", "routes/products.tsx"),
  route("product-categories", "routes/product-categories.tsx"),
  route("gift-products", "routes/gift-products.tsx"),
  route("contact-requests", "routes/contact-requests.tsx"),
  route("gallery", "routes/gallery.tsx"),
  route("website-settings", "routes/website-settings.tsx"),
  route("news", "routes/news.tsx"),
  route("orders", "routes/orders.tsx"),
] satisfies RouteConfig;
