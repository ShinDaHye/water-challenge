import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 같은 네트워크의 다른 PC에서 dev 서버(HMR 포함)에 접속할 수 있도록 허용
  allowedDevOrigins: ["172.20.10.2", "10.131.157.199"],
};

export default nextConfig;
