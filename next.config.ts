import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // livekit-server-sdk 需要 node 运行时，禁止被打进 edge bundle
  serverExternalPackages: ["livekit-server-sdk"],
};

export default nextConfig;
