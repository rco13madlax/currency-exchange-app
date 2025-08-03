/** @type {import('next').NextConfig} */
const nextConfig = {
  // 启用静态导出
  output: 'export',
  
  // 禁用图像优化（静态导出不支持）
  images: {
    unoptimized: true,
  },
  
  // 配置基础路径
  basePath: '',
  
  // 配置尾随斜杠
  trailingSlash: true,
}

module.exports = nextConfig