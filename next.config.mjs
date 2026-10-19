/** @type {import('next').NextConfig} */
const nextConfig = {
  // Os arquivos JSON de conteúdo precisam ir junto no bundle do servidor.
  outputFileTracingIncludes: { "/**/*": ["./data/**/*"] },
};

export default nextConfig;
