# 🎨 Design System Visual Guide

## Визуальная концепция

LaTechnique использует дизайн-систему, вдохновленную минималистичным стилем air.inc с фокусом на:
- Чистоту и простоту
- Много негативного пространства (white space)
- Элегантные анимации
- Сдержанное использование цвета

---

## 🎨 Цветовая палитра

### Основные цвета

```
Black (#1b1b1b)     ████████  Основной текст, элементы
White (#fff)        ████████  Фон, текст на темном
Accent (#4c96f7)    ████████  Акцентный цвет, ссылки
Haze (#f5f5f5)      ████████  Светлый фон секций
```

### Брендовые цвета

```
Altitude (#6366f1)  ████████  Indigo - технологичность
Sunflare (#f59e0b)  ████████  Amber - энергия
Ember (#ef4444)     ████████  Red - важность
Aurora (#8b5cf6)    ████████  Violet - креативность
Teal (#14b8a6)      ████████  Teal - свежесть
Canopy (#10b981)    ████████  Emerald - рост
Dust (#a3a3a3)      ████████  Neutral - второстепенное
Soil (#78716c)      ████████  Stone - землистость
```

### Использование цветов

- **Black/White**: Основная типографика и фоны
- **Accent**: Ссылки, активные состояния
- **Haze**: Альтернативные фоны секций
- **Брендовые**: Иконки, акценты, градиенты, фоны орбов

---

## 📐 Сетка и Layout

### 12-колоночная grid система

```
┌─────────────────────────────────────────┐
│ [1][2][3][4][5][6][7][8][9][10][11][12] │
│                                           │
│ Content width: 1150px                     │
│ Page width: 1600px                        │
│ Column gap: 24px                          │
│ Row margin: 24px                          │
└─────────────────────────────────────────┘
```

### Breakpoints

```
Mobile:     320px - 768px   (col-span-12)
Tablet:     768px - 1024px  (col-span-6)
Desktop:    1024px+         (col-span-4)
```

### Spacing Scale

```
xs:   8px   ▮
sm:   12px  ▮▮
md:   16px  ▮▮▮
lg:   24px  ▮▮▮▮
xl:   32px  ▮▮▮▮▮
2xl:  48px  ▮▮▮▮▮▮
3xl:  64px  ▮▮▮▮▮▮▮
4xl:  96px  ▮▮▮▮▮▮▮▮
5xl:  128px ▮▮▮▮▮▮▮▮▮
```

---

## ✍️ Типографика

### Шрифтовая иерархия

```
H1 (Display)
━━━━━━━━━━━━━━━━━━━━
clamp(3rem, 18vw, 300px)
Uppercase, Bold (900)
Line-height: 0.85
Usage: Hero titles only

H2 (Section)
━━━━━━━━━━━━━━━━━━━━
clamp(2rem, 4vw, 2.5rem)
Regular (400)
Line-height: 1.0
Usage: Section headers

H3 (Card)
━━━━━━━━━━━━━━━━━━━━
clamp(1.5rem, 3vw, 2rem)
Medium (500)
Line-height: 1.1
Usage: Card titles

Body
━━━━━━━━━━━━━━━━━━━━
1rem (16px)
Regular (400)
Line-height: 1.5
Usage: Paragraph text

Lead
━━━━━━━━━━━━━━━━━━━━
1.25rem (20px)
Regular (400)
Line-height: 1.6
Usage: Intro paragraphs
```

### Font Stack

```
-apple-system, BlinkMacSystemFont,
'Segoe UI', 'Roboto', 'Oxygen',
'Ubuntu', 'Cantarell', 'Fira Sans',
'Droid Sans', 'Helvetica Neue',
sans-serif
```

---

## 🎭 Компоненты

### Button Variants

```
┌────────────────┐
│    PRIMARY     │  Black bg, white text
└────────────────┘  Hover: subtle radial glow

┌────────────────┐
│   SECONDARY    │  Transparent bg, border
└────────────────┘  Hover: border darkens

┌────────────────┐
│    TERTIARY    │  Transparent bg, no border
└────────────────┘  Hover: light bg overlay
```

### Button Sizes

```
Small:   32px height  │ SM │
Medium:  38px height  │ MD │
Large:   48px height  │ LG │
```

### Card States

```
Default:
┌───────────────┐
│               │
│   Content     │
│               │
└───────────────┘

Hover (with hover=true):
┌───────────────┐
│               │  ← Scale(1.02)
│   Content     │  ← Shadow-lg
│               │
└───────────────┘
```

### Animated Border

```
     Rotating gradient
         ╱╲
        ╱  ╲
┏━━━━━━━━━━━━━━┓
┃              ┃  Conic gradient
┃   Content    ┃  Spin: 10s infinite
┃              ┃
┗━━━━━━━━━━━━━━┛
```

---

## 🌊 Motion & Animations

### Easing

**Единый easing для всех анимаций:**
```
cubic-bezier(0.22, 1, 0.36, 1)
```

Это создает плавное, естественное движение с медленным началом и концом.

### Durations

```
Instant:  0.15s  ▮           (микро-интеракции)
Fast:     0.3s   ▮▮          (hover, click)
Medium:   0.6s   ▮▮▮▮        (cards, modals)
Slow:     0.85s  ▮▮▮▮▮       (page reveals)
Slower:   1s     ▮▮▮▮▮▮      (hero animations)
```

### Animation Patterns

**Fade In:**
```
opacity: 0 → 1
duration: 0.6s
```

**Slide Up:**
```
opacity: 0 → 1
translateY: 20px → 0
duration: 0.6s
```

**Scale In:**
```
opacity: 0 → 1
scale: 0.95 → 1
duration: 0.6s
```

**Stagger:**
```
Child 1: delay 0s
Child 2: delay 0.1s
Child 3: delay 0.2s
Child 4: delay 0.3s
...
```

---

## 🎪 Специальные эффекты

### Orbs Background

```
     ╭──────╮
    ╱ Orb 1  ╲     Aurora color
   │          │    Blur: 120px
    ╲        ╱     Opacity: 30%
     ╰──────╯      Spin: 10s

         ╭──────╮
        ╱ Orb 2  ╲  Canopy color
       │          │ Blur: 120px
        ╲        ╱  Opacity: 25%
         ╰──────╯   Spin: 10s (delay: 2s)

  ╭──────╮
 ╱ Orb 3  ╲         Altitude color
│          │        Blur: 140px
 ╲        ╱         Opacity: 20%
  ╰──────╯          Pulse: 6s (delay: 4s)

+ Radial gradient overlay for blending
```

### Gradient Text

```
┌─────────────────────────────────┐
│                                 │
│  Background: linear-gradient    │
│  (135deg, Accent, Aurora)       │
│  -webkit-background-clip: text  │
│  -webkit-text-fill: transparent │
│                                 │
└─────────────────────────────────┘
```

---

## 📱 Responsive Guidelines

### Mobile First Approach

```
1. Design for mobile (320px)
2. Enhance for tablet (768px)
3. Optimize for desktop (1024px+)
```

### Breakpoint Strategy

```css
/* Mobile: Base styles */
.element {
  font-size: 1rem;
  padding: 1rem;
}

/* Tablet: @media (min-width: 768px) */
@media (min-width: 768px) {
  .element {
    font-size: 1.125rem;
    padding: 1.5rem;
  }
}

/* Desktop: @media (min-width: 1024px) */
@media (min-width: 1024px) {
  .element {
    font-size: 1.25rem;
    padding: 2rem;
  }
}
```

### Grid Responsive Behavior

```
Mobile (< 768px):
┌──────────────┐
│ col-span-12  │  Full width
└──────────────┘

Tablet (768px - 1024px):
┌─────────┬─────────┐
│ col-6   │ col-6   │  Half width
└─────────┴─────────┘

Desktop (1024px+):
┌────┬────┬────┬────┐
│col4│col4│col4│col4│  Quarter width
└────┴────┴────┴────┘
```

---

## ♿ Accessibility

### Focus States

```
:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}
```

### Color Contrast

- **Text on white**: Minimum 4.5:1 ratio
- **Text on colored bg**: Check WCAG AA compliance
- Use tools: https://webaim.org/resources/contrastchecker/

### Keyboard Navigation

- All interactive elements focusable
- Logical tab order
- Skip links for main content
- ARIA labels where needed

---

## 🎯 Best Practices

### Do's ✅

- Использовать CSS variables для цветов
- Применять единый easing для всех анимаций
- Следовать spacing scale
- Тестировать на всех breakpoints
- Использовать semantic HTML

### Don'ts ❌

- Не использовать inline styles (кроме динамических)
- Не создавать новые цвета без необходимости
- Не смешивать разные easing функции
- Не игнорировать accessibility
- Не использовать JavaScript для CSS анимаций

---

## 📊 Performance

### Оптимизация анимаций

```css
/* ✅ Оптимизировано для GPU */
.element {
  transform: translateX(0);
  opacity: 1;
  will-change: transform, opacity;
}

/* ❌ Вызывает reflow */
.element {
  left: 0;
  width: 100px;
}
```

### Loading Strategy

1. **Critical CSS**: Inline в `<head>`
2. **Non-critical CSS**: Lazy load
3. **Images**: Next.js Image component
4. **Fonts**: Self-hosted, preload

---

**Следуйте этим гайдлайнам для создания консистентного, красивого и производительного UI! 🎨**
