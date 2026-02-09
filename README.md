# LaTechnique.com

> Профессиональный анализ статистики постов из социальных сетей

## 🎯 О проекте

LaTechnique.com — это SaaS-платформа для парсинга и анализа статистики постов из TikTok, Instagram, YouTube, VK, Telegram и Likee.

**Основные возможности:**
- Массовая загрузка до 1000 ссылок через CSV/XLSX или вручную
- Детальная статистика: просмотры, лайки, комментарии, репосты, избранное
- Автоматический расчет Engagement Rate (ER%)
- Экспорт результатов в CSV/XLSX
- История запросов (30 дней)
- Бесплатные 3 ссылки, затем 100₽/ссылка

## 🚀 Быстрый старт

### Требования

- Node.js 18+ 
- npm или yarn
- Git

### Установка

```bash
# Клонируйте репозиторий
git clone https://github.com/yourusername/latechnique.git
cd latechnique

# Установите зависимости
npm install

# Запустите dev сервер
npm run dev
```

Откройте [http://localhost:3000](http://localhost:3000) в браузере.

## 📁 Структура проекта

```
latechnique/
├── app/                      # Next.js App Router
│   ├── page.tsx             # Landing page
│   └── layout.tsx           # Root layout
├── components/
│   ├── design-system/       # Базовые компоненты
│   │   ├── Header.tsx
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── AnimatedBorder.tsx
│   │   └── OrbsBackground.tsx
│   └── landing/             # Landing компоненты
│       ├── Hero.tsx
│       ├── Features.tsx
│       ├── HowItWorks.tsx
│       ├── Pricing.tsx
│       └── Footer.tsx
├── lib/
│   └── utils.ts             # Утилитарные функции
├── styles/                  # Дизайн-система
│   ├── tokens.css           # CSS переменные
│   ├── typography.css       # Типографика
│   ├── layout.css           # Grid система
│   ├── components.css       # Стили компонентов
│   └── globals.css          # Глобальные стили
├── types/
│   └── index.ts             # TypeScript типы
└── public/                  # Статические файлы
```

## 🎨 Дизайн-система

Проект использует дизайн-систему, вдохновленную [air.inc](https://air.inc):

### Принципы

1. **Минимализм** — много воздуха, четкая типографика, мало цвета
2. **Motion** — плавные transitions с единым easing `cubic-bezier(.22, 1, .36, 1)`
3. **Секционная темизация** — каждая секция может переопределять цвета через CSS variables
4. **Responsive** — mobile-first подход, 12-колоночная grid
5. **Performance** — CSS-only анимации, no JavaScript motion libs

### CSS Tokens

Все токены дизайна находятся в `styles/tokens.css`:

```css
:root {
  /* Layout */
  --page-width: 1600px;
  --content-width: 1150px;
  
  /* Colors */
  --black: #1b1b1b;
  --white: #fff;
  --accent: #4c96f7;
  --haze: #f5f5f5;
  
  /* Brand Colors */
  --altitude: #6366f1;    /* indigo */
  --sunflare: #f59e0b;    /* amber */
  --aurora: #8b5cf6;      /* violet */
  --canopy: #10b981;      /* emerald */
  
  /* Motion */
  --ease: cubic-bezier(.22, 1, .36, 1);
  --duration-fast: 0.3s;
  --duration-medium: 0.6s;
}
```

### Типографика

Используйте готовые классы из `styles/typography.css`:

```tsx
<h1 className="h1">Hero Title</h1>
<h2 className="h2">Section Title</h2>
<p className="body">Regular text</p>
<p className="lead">Intro paragraph</p>
```

### Grid System

12-колоночная grid система с автоматическим responsive:

```tsx
<div className="grid-container">
  <div className="col-span-6">Half width</div>
  <div className="col-span-6">Half width</div>
</div>
```

## 🧩 Компоненты

### Button

```tsx
import { Button } from '@/components/design-system/Button';

<Button variant="primary" size="lg" href="/register">
  Начать бесплатно
</Button>
```

**Props:**
- `variant`: 'primary' | 'secondary' | 'tertiary'
- `size`: 'sm' | 'md' | 'lg'
- `href`: string (optional, renders as Link)
- `onClick`: function (optional)
- `disabled`: boolean

### Card

```tsx
import { Card } from '@/components/design-system/Card';

<Card hover padding="lg">
  <h3 className="h3">Card Title</h3>
  <p className="body">Card content</p>
</Card>
```

**Props:**
- `hover`: boolean (enables scale animation)
- `padding`: 'none' | 'sm' | 'md' | 'lg'

### AnimatedBorder

```tsx
import { AnimatedBorder } from '@/components/design-system/AnimatedBorder';

<AnimatedBorder>
  <Card>Premium content</Card>
</AnimatedBorder>
```

### OrbsBackground

```tsx
import { OrbsBackground } from '@/components/design-system/OrbsBackground';

<section className="relative">
  <OrbsBackground colors={['aurora', 'canopy', 'altitude']} />
  <div className="relative z-10">Content</div>
</section>
```

## 📝 Скрипты

```bash
# Разработка
npm run dev

# Production build
npm run build

# Запуск production сервера
npm run start

# Линтинг
npm run lint

# Статический экспорт (для GitHub Pages)
npm run export

# Локальный просмотр статического сайта
npm run serve
```

## 🌐 Деплой

### GitHub Pages (рекомендуется для Этапа 1)

Проект настроен для автоматического деплоя на GitHub Pages:

**Быстрый старт:**
1. Settings → Pages → Source: "GitHub Actions"
2. Push в main → автоматический деплой
3. Сайт доступен на: `https://username.github.io/latechnique/`

📖 **Подробная инструкция:** [GITHUB_PAGES.md](./GITHUB_PAGES.md)  
⚡ **Быстрый гайд:** [QUICK_DEPLOY.md](./QUICK_DEPLOY.md)

### Vercel (для будущих этапов с API)

После добавления API routes (Этап 4), рекомендуется мигрировать на Vercel:

```bash
npm i -g vercel
vercel
```

📖 **Инструкция:** [DEPLOYMENT.md](./DEPLOYMENT.md)

## 🛠 Технологии

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + Custom CSS
- **UI Components**: Custom design system
- **Icons**: Lucide React
- **Utils**: clsx, tailwind-merge

## 🎯 Roadmap

### ✅ Phase 1: Design System + Landing (Текущий этап)
- [x] CSS Design Tokens
- [x] Typography System
- [x] Grid Layout System
- [x] Base Components (Button, Card, etc.)
- [x] Landing Page (Hero, Features, Pricing, HowItWorks)

### 🔜 Phase 2: Auth + Dashboard
- [ ] Supabase setup (database + auth)
- [ ] Login/Register pages
- [ ] Protected routes
- [ ] Dashboard layout

### 🔜 Phase 3: Upload + Parser
- [ ] File upload (CSV/XLSX)
- [ ] URL parsing & validation
- [ ] Progress tracking

### 🔜 Phase 4: API + Worker
- [ ] API routes
- [ ] Background worker
- [ ] Redis caching
- [ ] Social platform integrations

### 🔜 Phase 5: Results + History
- [ ] Results table
- [ ] Export functionality
- [ ] History page

### 🔜 Phase 6: Payment
- [ ] ЮKassa integration
- [ ] Credits system

## 📄 Лицензия

Copyright © 2025 LaTechnique. Все права защищены.

## 🤝 Поддержка

Если у вас возникли вопросы или проблемы:
- Email: support@latechnique.com
- Telegram: @latechnique_support
- GitHub Issues: [создать issue](https://github.com/yourusername/latechnique/issues)

---

Made with ❤️ by LaTechnique Team
