# Примеры использования компонентов

## Button

### Базовое использование

```tsx
import { Button } from '@/components/design-system/Button';

// Primary button
<Button variant="primary">Click me</Button>

// Secondary button
<Button variant="secondary">Click me</Button>

// Tertiary button
<Button variant="tertiary">Click me</Button>
```

### Размеры

```tsx
// Small
<Button size="sm">Small</Button>

// Medium (default)
<Button size="md">Medium</Button>

// Large
<Button size="lg">Large</Button>
```

### Как ссылка

```tsx
// Renders as Next.js Link
<Button href="/dashboard">Go to Dashboard</Button>

// External link
<Button href="https://example.com">External</Button>
```

### С иконками

```tsx
import { ArrowRight, Download } from 'lucide-react';

<Button variant="primary">
  Download
  <Download className="w-4 h-4" />
</Button>

<Button variant="secondary">
  Learn More
  <ArrowRight className="w-4 h-4" />
</Button>
```

### Disabled состояние

```tsx
<Button disabled>Disabled Button</Button>
```

---

## Card

### Базовое использование

```tsx
import { Card } from '@/components/design-system/Card';

<Card>
  <h3>Card Title</h3>
  <p>Card content goes here</p>
</Card>
```

### С padding

```tsx
// No padding
<Card padding="none">Content</Card>

// Small padding
<Card padding="sm">Content</Card>

// Medium padding (default)
<Card padding="md">Content</Card>

// Large padding
<Card padding="lg">Content</Card>
```

### С hover эффектом

```tsx
<Card hover>
  <h3>Hover me!</h3>
  <p>This card will scale on hover</p>
</Card>
```

### Полный пример

```tsx
<Card hover padding="lg" className="h-full">
  <div className="flex flex-col gap-4">
    <div className="w-12 h-12 rounded-lg bg-altitude/10 flex items-center justify-center">
      <Icon className="w-6 h-6 text-altitude" />
    </div>
    <h3 className="h4">Feature Title</h3>
    <p className="body-small text-muted">Feature description</p>
  </div>
</Card>
```

---

## AnimatedBorder

### Базовое использование

```tsx
import { AnimatedBorder } from '@/components/design-system/AnimatedBorder';
import { Card } from '@/components/design-system/Card';

<AnimatedBorder>
  <Card padding="lg">
    <h3>Premium Card</h3>
    <p>This card has an animated gradient border</p>
  </Card>
</AnimatedBorder>
```

### В Pricing секции

```tsx
<AnimatedBorder>
  <Card padding="lg" className="h-full bg-white">
    <PricingTier tier={premiumTier} />
  </Card>
</AnimatedBorder>
```

---

## OrbsBackground

### Базовое использование

```tsx
import { OrbsBackground } from '@/components/design-system/OrbsBackground';

<section className="relative min-h-screen">
  <OrbsBackground />
  <div className="relative z-10">
    <h1>Your content here</h1>
  </div>
</section>
```

### С кастомными цветами

```tsx
// Default colors: ['aurora', 'canopy', 'altitude']
<OrbsBackground />

// Custom colors
<OrbsBackground colors={['ember', 'sunflare', 'teal']} />

// Single color theme
<OrbsBackground colors={['aurora', 'aurora', 'altitude']} />
```

### В Hero секции

```tsx
<section className="relative min-h-screen flex items-center">
  <OrbsBackground colors={['aurora', 'canopy', 'altitude']} />
  
  <div className="container relative z-10">
    <h1 className="h1">Hero Title</h1>
    <p className="lead">Hero description</p>
  </div>
</section>
```

---

## Header

### Базовое использование

```tsx
import { Header } from '@/components/design-system/Header';

export default function Layout({ children }) {
  return (
    <>
      <Header />
      <main>{children}</main>
    </>
  );
}
```

### Кастомизация навигации

Отредактируйте `components/design-system/Header.tsx` для изменения навигации:

```tsx
<nav className="hidden md:flex items-center gap-8">
  <Link href="#features">Возможности</Link>
  <Link href="#pricing">Тарифы</Link>
  <Link href="#contact">Контакты</Link>
</nav>
```

---

## Grid System

### 12-колоночная сетка

```tsx
<div className="grid-container">
  <div className="col-span-12">Full width</div>
  <div className="col-span-6">Half width</div>
  <div className="col-span-6">Half width</div>
  <div className="col-span-4">One third</div>
  <div className="col-span-4">One third</div>
  <div className="col-span-4">One third</div>
</div>
```

### Responsive columns

```tsx
<div className="grid-container">
  <div className="col-span-12 md:col-span-6 lg:col-span-4">
    Responsive: full on mobile, half on tablet, third on desktop
  </div>
</div>
```

### С gap

```tsx
<div className="grid-container gap-lg">
  <div className="col-span-6">Content 1</div>
  <div className="col-span-6">Content 2</div>
</div>
```

---

## Typography

### Headings

```tsx
<h1 className="h1">Display Title</h1>
<h2 className="h2">Section Title</h2>
<h3 className="h3">Card Title</h3>
<h4 className="h4">Subheading</h4>
```

### Body Text

```tsx
<p className="body">Regular paragraph text</p>
<p className="body-large">Large body text</p>
<p className="body-small">Small body text</p>
<p className="body-xs">Extra small text</p>
```

### Special Styles

```tsx
<p className="lead">Intro paragraph with larger text</p>
<span className="label">UI LABEL</span>
<p className="caption">Caption text</p>
```

### Gradient Text

```tsx
<h1 className="h1">
  Regular Text
  <span className="text-gradient">Gradient Text</span>
</h1>
```

---

## Animations

### Fade In

```tsx
<div className="animate-fadeIn">
  Content fades in
</div>
```

### Slide Up

```tsx
<div className="animate-slideUp">
  Content slides up
</div>
```

### Staggered Children

```tsx
<div className="animate-stagger">
  <div>Item 1 (0s delay)</div>
  <div>Item 2 (0.1s delay)</div>
  <div>Item 3 (0.2s delay)</div>
</div>
```

### Inline Delays

```tsx
<div
  className="animate-slideUp"
  style={{ animationDelay: '0.3s' }}
>
  Delayed content
</div>
```

---

## Utilities

### Text Utilities

```tsx
<p className="text-muted">Muted text (60% opacity)</p>
<p className="text-gradient">Gradient text</p>
<p className="text-balance">Balanced text wrapping</p>
<p className="truncate">Text with ellipsis...</p>
```

### Layout Utilities

```tsx
<div className="flex items-center justify-between">
  Flexbox layout
</div>

<div className="section">
  Section with padding
</div>

<div className="container">
  Centered container
</div>
```

---

## Color Classes

```tsx
// Background colors
<div className="bg-haze">Light background</div>
<div className="bg-altitude">Brand color background</div>

// Text colors
<p className="text-altitude">Brand color text</p>
<p className="text-muted">Muted text</p>

// Border colors
<div className="border border-black/10">Border</div>
```

---

## Spacing

```tsx
// Padding
<div className="p-4">Padding all sides</div>
<div className="px-4 py-2">Padding x and y</div>

// Margin
<div className="m-4">Margin all sides</div>
<div className="mb-8">Margin bottom</div>

// Gap
<div className="flex gap-4">Flex with gap</div>
<div className="grid gap-6">Grid with gap</div>
```
