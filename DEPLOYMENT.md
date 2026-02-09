# Деплой на Vercel

## Быстрый деплой

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/latechnique)

## Ручной деплой

### 1. Установите Vercel CLI

```bash
npm i -g vercel
```

### 2. Войдите в аккаунт

```bash
vercel login
```

### 3. Деплой проекта

```bash
# Preview deployment
vercel

# Production deployment
vercel --prod
```

## Настройка переменных окружения

### Через Dashboard

1. Откройте [Vercel Dashboard](https://vercel.com/dashboard)
2. Выберите проект
3. Settings → Environment Variables
4. Добавьте переменные из `.env.example`

### Через CLI

```bash
# Добавить переменную
vercel env add VARIABLE_NAME

# Добавить из файла
vercel env pull .env.local
```

## Настройка домена

### Custom Domain

1. Settings → Domains
2. Добавьте ваш домен
3. Настройте DNS записи:
   - Type: `A` → Value: `76.76.21.21`
   - Type: `CNAME` → Value: `cname.vercel-dns.com`

### SSL Certificate

Vercel автоматически выпускает SSL сертификат для всех доменов.

## Build Settings

```json
{
  "buildCommand": "next build",
  "outputDirectory": ".next",
  "installCommand": "npm install",
  "devCommand": "next dev"
}
```

## Environment Variables

```bash
# Production
NEXT_PUBLIC_APP_URL=https://latechnique.com

# Supabase
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...

# Redis
UPSTASH_REDIS_REST_URL=...
UPSTASH_REDIS_REST_TOKEN=...

# APIs
APIFY_API_TOKEN=...
VK_SERVICE_KEY=...
YOUTUBE_API_KEY=...
YOOKASSA_SHOP_ID=...
YOOKASSA_SECRET_KEY=...
```

## Deployment Checklist

- [ ] Создан репозиторий на GitHub
- [ ] Подключен проект к Vercel
- [ ] Добавлены все environment variables
- [ ] Настроен кастомный домен
- [ ] Проверен SSL сертификат
- [ ] Протестированы все функции
- [ ] Настроен analytics
- [ ] Настроен error tracking (Sentry)

## Автоматический деплой

Vercel автоматически деплоит:
- **Production**: при пуше в `main` branch
- **Preview**: при создании pull request

## Rollback

```bash
# Откатиться к предыдущей версии
vercel rollback
```

## Monitoring

- Analytics: https://vercel.com/analytics
- Logs: https://vercel.com/logs
- Performance: https://vercel.com/speed-insights

## Troubleshooting

### Build failed

```bash
# Проверьте локально
npm run build

# Очистите кэш
vercel --force
```

### Environment variables not working

1. Проверьте, что переменные добавлены в Vercel Dashboard
2. Убедитесь, что используете правильный prefix (`NEXT_PUBLIC_` для client-side)
3. Пересоберите проект после добавления переменных

### Domain not working

1. Проверьте DNS настройки
2. Подождите до 48 часов для распространения DNS
3. Очистите DNS кэш: `ipconfig /flushdns` (Windows) или `sudo dscacheutil -flushcache` (Mac)

## Support

- [Vercel Documentation](https://vercel.com/docs)
- [Vercel Support](https://vercel.com/support)
- [Community Forum](https://github.com/vercel/vercel/discussions)
