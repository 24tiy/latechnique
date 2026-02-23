import type { Metadata } from 'next';
import '@/styles/globals.css';

export const metadata: Metadata = {
  title: 'LaTechnique — Анализ статистики социальных сетей',
  description:
    'Профессиональный анализ статистики постов из TikTok, Instagram, YouTube, VK, Telegram и Likee. Загрузите CSV или вставьте ссылки вручную.',
  keywords: ['анализ постов', 'статистика социальных сетей', 'TikTok аналитика'],
  authors: [{ name: 'LaTechnique' }],
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
  },
  openGraph: {
    title: 'LaTechnique — Анализ статистики социальных сетей',
    description: 'Профессиональный анализ статистики постов из 6 социальных платформ',
    type: 'website',
    locale: 'ru_RU',
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Dancing+Script:wght@700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
