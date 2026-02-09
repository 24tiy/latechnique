# 🚀 Быстрая установка и запуск

## Шаг 1: Клонирование репозитория

```bash
git clone https://github.com/yourusername/latechnique.git
cd latechnique
```

## Шаг 2: Установка зависимостей

```bash
npm install
```

Это установит:
- Next.js 14
- React 18
- TypeScript
- Tailwind CSS
- Lucide React (иконки)
- clsx & tailwind-merge

## Шаг 3: Настройка окружения

```bash
# Скопируйте файл с примером переменных
cp .env.example .env.local
```

Для **Этапа 1** (текущего) переменные окружения не требуются!

## Шаг 4: Запуск dev сервера

```bash
npm run dev
```

Откройте браузер на http://localhost:3000

## 🎉 Готово!

Вы должны увидеть landing page с:
- ✅ Hero секцией с анимированным фоном
- ✅ Features секцией с 6 карточками
- ✅ HowItWorks секцией с пошаговым гайдом
- ✅ Pricing секцией с 3 тарифами
- ✅ Footer с навигацией

---

## 📱 Проверка responsive дизайна

### Desktop (1920px)
```
Браузер → DevTools (F12) → Responsive mode → 1920x1080
```

### Tablet (768px)
```
Браузер → DevTools (F12) → Responsive mode → iPad
```

### Mobile (375px)
```
Браузер → DevTools (F12) → Responsive mode → iPhone SE
```

---

## 🛠 Доступные команды

```bash
# Разработка
npm run dev          # Запуск dev сервера на :3000

# Production
npm run build        # Сборка для production
npm run start        # Запуск production сервера

# Проверка кода
npm run lint         # ESLint проверка
```

---

## 📁 Структура проекта

```
latechnique/
├── app/
│   ├── page.tsx              # 🏠 Landing page
│   └── layout.tsx            # Root layout
│
├── components/
│   ├── design-system/        # 🎨 Базовые компоненты
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── AnimatedBorder.tsx
│   │   ├── OrbsBackground.tsx
│   │   └── Header.tsx
│   │
│   └── landing/              # 📄 Landing компоненты
│       ├── Hero.tsx
│       ├── Features.tsx
│       ├── HowItWorks.tsx
│       ├── Pricing.tsx
│       └── Footer.tsx
│
├── styles/                   # 🎨 Дизайн-система
│   ├── tokens.css            # CSS переменные
│   ├── typography.css        # Типографика
│   ├── layout.css            # Grid система
│   ├── components.css        # Стили компонентов
│   └── globals.css           # Глобальные стили
│
├── lib/
│   └── utils.ts              # 🔧 Утилиты
│
└── types/
    └── index.ts              # 📝 TypeScript типы
```

---

## 🎨 Тестирование компонентов

### 1. Протестируйте Button

Откройте `app/page.tsx` и добавьте:

```tsx
import { Button } from '@/components/design-system/Button';

<Button variant="primary" size="lg">Test Button</Button>
```

### 2. Протестируйте Card

```tsx
import { Card } from '@/components/design-system/Card';

<Card hover padding="lg">
  <h3 className="h3">Test Card</h3>
  <p className="body">This is a test card with hover effect</p>
</Card>
```

### 3. Протестируйте AnimatedBorder

```tsx
import { AnimatedBorder } from '@/components/design-system/AnimatedBorder';
import { Card } from '@/components/design-system/Card';

<AnimatedBorder>
  <Card padding="lg">
    <h3>Premium Card</h3>
  </Card>
</AnimatedBorder>
```

### 4. Протестируйте OrbsBackground

```tsx
import { OrbsBackground } from '@/components/design-system/OrbsBackground';

<section className="relative min-h-screen">
  <OrbsBackground colors={['aurora', 'canopy', 'altitude']} />
  <div className="relative z-10 container">
    <h1 className="h1">Test</h1>
  </div>
</section>
```

---

## 🐛 Troubleshooting

### Ошибка: "Cannot find module '@/...'"

**Решение:** Проверьте `tsconfig.json`, должно быть:

```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

### Ошибка: CSS не применяются

**Решение:** Убедитесь, что в `app/layout.tsx` импортирован globals.css:

```tsx
import '@/styles/globals.css';
```

### Анимации не работают

**Решение:** Проверьте, что все CSS файлы импортированы в правильном порядке в `globals.css`:

```css
@import './tokens.css';
@import './typography.css';
@import './layout.css';
@import './components.css';
```

### Компоненты не рендерятся

**Решение:** Проверьте наличие 'use client' directive в компонентах, использующих hooks:

```tsx
'use client';

import { useState } from 'react';
```

---

## 📚 Следующие шаги

После успешного запуска Этапа 1:

1. **Изучите** [COMPONENTS.md](./COMPONENTS.md) для примеров использования
2. **Прочитайте** [CONTRIBUTING.md](./CONTRIBUTING.md) перед внесением изменений
3. **Ознакомьтесь** с [README.md](./README.md) для полной документации
4. **Начните** работу над Этапом 2 (Auth + Dashboard)

---

## 💡 Tips

- Используйте **CSS variables** для кастомизации цветов
- Следуйте **12-колоночной grid** системе
- Применяйте **готовые utility классы** где возможно
- Проверяйте **responsive** на всех breakpoints
- Тестируйте **анимации** на медленных устройствах

---

## 🆘 Нужна помощь?

- 📖 [Полная документация](./README.md)
- 🎨 [Примеры компонентов](./COMPONENTS.md)
- 🤝 [Гайд для контрибьюторов](./CONTRIBUTING.md)
- 🚀 [Деплой на Vercel](./DEPLOYMENT.md)

**Контакты:**
- Email: support@latechnique.com
- Telegram: @latechnique_support
- GitHub Issues: [Создать issue](https://github.com/yourusername/latechnique/issues)

---

**Happy coding! 🚀**
