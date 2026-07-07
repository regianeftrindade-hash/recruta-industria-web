/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    proxyClientMaxBodySize: "30mb",
  },
  turbopack: {
    root: __dirname,
  },
  async redirects() {
    return [
      {
        source: "/professional/dashboard/painel",
        destination: "/professional/dashboard",
        permanent: false,
      },
      {
        source: "/pagamento",
        destination: "/professional/pagamento",
        permanent: false,
      },
      {
        source: "/professional/checkout",
        destination: "/professional/pagamento",
        permanent: false,
      },
      {
        source: "/professional/upgrade",
        destination: "/professional/pagamento",
        permanent: false,
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Cache-Control", value: "no-store, must-revalidate" },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
