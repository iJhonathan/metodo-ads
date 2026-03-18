# Método ADS — Setup Guide

## 1. Instalar dependencias

```bash
npm install
```

## 2. Configurar Supabase

1. Crear proyecto en [supabase.com](https://supabase.com)
2. Ir a **SQL Editor** y ejecutar el contenido de `supabase/schema.sql`
3. Copiar **Project URL** y **anon public key** desde Settings > API

## 3. Configurar variables de entorno

Crear `.env` en la raíz del proyecto:

```env
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

## 4. Ejecutar en desarrollo

```bash
npm run dev
```

## 5. Desplegar en Vercel

```bash
npm run build
# Conectar repo en vercel.com y agregar las env vars
```

## Estructura del proyecto

```
src/
├── components/
│   ├── layout/        # Sidebar, AppLayout
│   └── ui/            # StatCard, ProjectCard, Modal, etc.
├── contexts/
│   └── AuthContext.jsx
├── lib/
│   └── supabase.js
├── pages/
│   ├── auth/          # Login, Register, Onboarding
│   ├── Dashboard.jsx
│   ├── Projects.jsx
│   ├── Settings.jsx
│   └── Placeholder.jsx
├── App.jsx
└── index.css
```

## Fases de desarrollo

- [x] **Fase 1**: Estructura base, layout, auth, dashboard, proyectos
- [ ] **Fase 2**: Base de Conocimiento, Branding Kit
- [ ] **Fase 3**: Ángulos de Venta (Claude API)
- [ ] **Fase 4**: Fábrica Creativa (Google AI / Gemini)
- [ ] **Fase 5**: Galería, Análisis Visual
- [ ] **Fase 6**: Stripe / Suscripciones
