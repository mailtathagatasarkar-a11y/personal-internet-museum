import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The museum is one static page: exported to out/ and served as files.
  output: "export",
  // The museum has no chrome to spare; the dev indicator sits on the readout.
  devIndicators: false,
};

export default nextConfig;
