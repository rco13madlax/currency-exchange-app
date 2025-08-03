/** @type {import('next').NextConfig} */
const nextConfig = {
  // 移除静态导出，使用SSR模式
  // output: 'export', // 注释掉这行
  
  // 禁用图像优化（Cloudflare Pages支持）
  images: {
    unoptimized: true,
  },
  
  // 配置基础路径
  basePath: '',
  
  // 配置尾随斜杠
  trailingSlash: true,
}

module.exports = nextConfig