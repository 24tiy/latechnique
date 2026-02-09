import type { Metadata } from 'next';
import '@/styles/globals.css';

export const metadata: Metadata = {
  title: 'LaTechnique — Анализ статистики социальных сетей',
  description:
    'Профессиональный анализ статистики постов из TikTok, Instagram, YouTube, VK, Telegram и Likee. Загрузите CSV или вставьте ссылки вручную.',
  keywords: [
    'анализ постов',
    'статистика социальных сетей',
    'TikTok аналитика',
    'Instagram статистика',
    'YouTube метрики',
  ],
  authors: [{ name: 'LaTechnique' }],
  openGraph: {
    title: 'LaTechnique — Анализ статистики социальных сетей',
    description:
      'Профессиональный анализ статистики постов из 6 социальных платформ',
    type: 'website',
    locale: 'ru_RU',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}
