# Contributing to LaTechnique

Спасибо за интерес к проекту! Мы ценим ваш вклад.

## 🚀 Как начать

1. **Fork** репозиторий
2. **Clone** ваш fork локально
3. Создайте **feature branch** от `develop`
4. Внесите изменения
5. **Commit** с понятным сообщением
6. **Push** в ваш fork
7. Создайте **Pull Request**

```bash
git clone https://github.com/yourusername/latechnique.git
cd latechnique
git checkout develop
git checkout -b feature/amazing-feature
# Make changes
git commit -m "feat: add amazing feature"
git push origin feature/amazing-feature
```

## 📋 Code Style

### TypeScript

- ✅ **Используйте** TypeScript strict mode
- ✅ **Типизируйте** все props и state
- ❌ **Избегайте** `any` типов
- ✅ **Используйте** interface для объектов, type для unions/primitives

```tsx
// ✅ Good
interface ButtonProps {
  variant: 'primary' | 'secondary';
  children: React.ReactNode;
}

// ❌ Bad
const Button = (props: any) => { ... }
```

### React

- ✅ **Используйте** функциональные компоненты + hooks
- ✅ **Именуйте** компоненты в PascalCase
- ✅ **Деструктурируйте** props
- ✅ **Используйте** React.FC типы

```tsx
// ✅ Good
export const Button: React.FC<ButtonProps> = ({ variant, children }) => {
  return <button className={variant}>{children}</button>;
};

// ❌ Bad
export default function button(props) {
  return <button>{props.children}</button>;
}
```

### CSS

- ✅ **Используйте** CSS variables для темизации
- ✅ **Следуйте** BEM-like naming
- ✅ **Используйте** готовые utility классы
- ❌ **Избегайте** inline styles (кроме динамических значений)

```css
/* ✅ Good */
.btn {
  padding: var(--spacing-md);
  transition: all var(--duration-fast) var(--ease);
}

/* ❌ Bad */
.button1 {
  padding: 16px;
  transition: all 0.3s ease;
}
```

### Naming Conventions

- **Components**: `PascalCase` (e.g., `Button.tsx`)
- **Functions**: `camelCase` (e.g., `handleClick`)
- **Constants**: `SCREAMING_SNAKE_CASE` (e.g., `MAX_ITEMS`)
- **CSS Classes**: `kebab-case` (e.g., `btn-primary`)
- **Files**: `kebab-case` (e.g., `utils.ts`, `auth-context.tsx`)

## 📝 Commit Convention

Используем [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- `feat`: Новая функциональность
- `fix`: Исправление бага
- `docs`: Изменения в документации
- `style`: Форматирование, отступы (не CSS)
- `refactor`: Рефакторинг кода
- `perf`: Оптимизация производительности
- `test`: Добавление тестов
- `chore`: Рутинные задачи (обновление зависимостей)

### Examples

```bash
feat(button): add loading state
fix(header): correct mobile menu overflow
docs(readme): update installation steps
style: format code with prettier
refactor(utils): simplify date formatting
perf(images): add lazy loading
test(button): add unit tests
chore: update dependencies
```

## 🎨 Design Guidelines

### Следуйте дизайн-системе

1. **Используйте** токены из `styles/tokens.css`
2. **Следуйте** типографической системе
3. **Используйте** grid систему для layout
4. **Применяйте** единый easing `var(--ease)`

### Accessibility

- ✅ Используйте semantic HTML
- ✅ Добавляйте ARIA labels где необходимо
- ✅ Обеспечьте keyboard navigation
- ✅ Проверяйте контрастность цветов

```tsx
// ✅ Good
<button aria-label="Close menu" onClick={handleClose}>
  <X className="w-4 h-4" />
</button>

// ❌ Bad
<div onClick={handleClose}>
  <X />
</div>
```

## 🧪 Testing

### Before submitting PR

- [ ] Проект собирается без ошибок (`npm run build`)
- [ ] Нет TypeScript ошибок (`npm run lint`)
- [ ] Компоненты работают на mobile/tablet/desktop
- [ ] Код соответствует style guide
- [ ] Добавлена документация (если нужно)

## 📦 Pull Request Process

1. **Обновите** `develop` branch перед созданием PR
2. **Опишите** изменения в PR description
3. **Укажите** связанные issues (если есть)
4. **Добавьте** скриншоты для UI изменений
5. **Дождитесь** code review

### PR Template

```markdown
## Описание
Краткое описание изменений

## Тип изменения
- [ ] Bug fix
- [ ] New feature
- [ ] Refactoring
- [ ] Documentation

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] No TypeScript errors
- [ ] Build passes
- [ ] Works on mobile/tablet/desktop

## Скриншоты (если есть UI изменения)
```

## 🐛 Reporting Bugs

Используйте [GitHub Issues](https://github.com/yourusername/latechnique/issues):

### Bug Report Template

```markdown
**Описание бага**
Четкое описание проблемы

**Как воспроизвести**
1. Перейти в '...'
2. Кликнуть на '....'
3. Увидеть ошибку

**Ожидаемое поведение**
Что должно было произойти

**Скриншоты**
При необходимости

**Окружение**
- OS: [e.g. macOS, Windows]
- Browser: [e.g. Chrome, Safari]
- Version: [e.g. 22]
```

## 💡 Feature Requests

### Feature Request Template

```markdown
**Описание фичи**
Четкое описание функциональности

**Проблема**
Какую проблему это решает?

**Предлагаемое решение**
Как должно работать?

**Альтернативы**
Рассматривали ли другие варианты?

**Дополнительно**
Любой контекст, скриншоты, примеры
```

## 📚 Resources

- [Project Documentation](./README.md)
- [Component Examples](./COMPONENTS.md)
- [Deployment Guide](./DEPLOYMENT.md)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [React Documentation](https://react.dev/)
- [Next.js Documentation](https://nextjs.org/docs)

## 🤝 Code of Conduct

- Будьте уважительны к другим контрибьюторам
- Конструктивная критика приветствуется
- Помогайте новичкам
- Следуйте best practices

## ❓ Questions?

Если у вас есть вопросы:
- Откройте [Discussion](https://github.com/yourusername/latechnique/discussions)
- Напишите в [Telegram](https://t.me/latechnique_dev)
- Email: dev@latechnique.com

---

Спасибо за ваш вклад в LaTechnique! 🚀
