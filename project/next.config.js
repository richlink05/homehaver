/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
      },
      // 크롤러가 가져온 외부 사이트(분양 홈페이지 등) 썸네일을 표시하기 위해 모든 https 이미지 주소를 허용합니다.
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
};

module.exports = nextConfig;
