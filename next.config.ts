import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
};

const withSerwist = withSerwistInit({
  swSrc: "app/sw.ts",
  swDest: "public/sw.js",
  disable: process.env.NODE_ENV !== "production",
  globPublicPatterns: ["manifest.webmanifest", "icons/**/*"],
});

export default withSerwist(nextConfig);
