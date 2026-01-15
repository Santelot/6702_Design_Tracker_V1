# 🤖 FRC Design Tracker

**Angular 18+ Application for FRC Robot Weight Management**

Una aplicación moderna y elegante para rastrear el peso de tu robot FRC en tiempo real, con soporte para múltiples subsistemas, cálculo automático de pesos y catálogos de materiales/fasteners.

![Dark UI with Glassmorphism](https://img.shields.io/badge/UI-Dark%20Mode-purple)
![Angular 18](https://img.shields.io/badge/Angular-18+-red)
![Supabase](https://img.shields.io/badge/Backend-Supabase-green)
![Tailwind CSS](https://img.shields.io/badge/Styling-Tailwind%20CSS-blue)

---

## ✨ Características

### 📊 Dashboard
- Barra de progreso de peso con indicadores de warning/danger
- Stats cards con peso total, restante, subsistemas y componentes
- Breakdown por subsistema con progress bars
- Distribución por categoría con visualización de porcentaje

### 🔧 Subsistemas
- Vista detallada por subsistema
- Tabla de componentes con edición inline
- Filtro por categoría
- **Cálculo automático de peso** basado en geometría y material
- Selección de material con dropdown
- Cantidad editable directamente

### ⚙️ Settings
- Configuración del proyecto (límite de peso, safety factor)
- CRUD de materiales personalizados
- CRUD de perfiles/templates de cálculo
- CRUD de fasteners
- Crear nuevos subsistemas

### 🛒 Shopping List
- Lista automática de fasteners a comprar
- Calcula lo necesario vs en stock
- Costo estimado total
- Links a proveedores

### 📦 Inventory
- Vista completa de inventario
- Filtros por subsistema y status
- Tracking de stock

---

## 🚀 Instalación

### Opción A: Proyecto Nuevo

```bash
# 1. Crea una carpeta para el proyecto
mkdir frc-design-tracker
cd frc-design-tracker

# 2. Copia todos los archivos de este paquete

# 3. Instala dependencias
npm install

# 4. Ejecuta el servidor de desarrollo
npm start
```

### Opción B: Integrar en Proyecto Angular Existente

1. **Instala las dependencias necesarias:**
```bash
npm install @supabase/supabase-js tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

2. **Copia los siguientes archivos/carpetas:**
   - `src/app/models/` → Tu proyecto
   - `src/app/services/supabase.service.ts` → Tu proyecto
   - `src/app/components/` → Tu proyecto
   - Actualiza `src/app/app.component.ts`

3. **Configura Tailwind** (si no lo tienes):
   - Copia `tailwind.config.js`
   - Añade las directivas de Tailwind a tu `styles.css`

4. **Actualiza tu `index.html`** para incluir las fuentes de Google:
```html
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
```

---

## 🗄️ Configuración de Supabase

La aplicación ya está configurada con las credenciales de tu proyecto Supabase:

```typescript
// src/app/services/supabase.service.ts
const SUPABASE_URL = 'https://ymounjmyaomvibndsrwz.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
```

### Ejecutar el Schema SQL

Asegúrate de haber ejecutado el schema SQL (`frc_weight_tracker_schema.sql`) en tu Supabase SQL Editor antes de usar la aplicación.

---

## 📁 Estructura del Proyecto

```
src/
├── app/
│   ├── components/
│   │   ├── dashboard/           # Vista principal del dashboard
│   │   ├── inventory/           # Vista de inventario
│   │   ├── settings/            # Configuración del proyecto
│   │   ├── shared/              # Componentes reutilizables
│   │   │   └── glass-card.component.ts  # GlassCard, StatCard, Button, Modal
│   │   ├── shopping-list/       # Lista de compras
│   │   ├── sidebar/             # Navegación lateral
│   │   └── subsystem-view/      # Vista detallada de subsistema
│   ├── models/
│   │   └── index.ts             # Interfaces TypeScript
│   ├── services/
│   │   └── supabase.service.ts  # Servicio de conexión a Supabase
│   ├── app.component.ts         # Componente principal
│   ├── app.config.ts            # Configuración de Angular
│   └── app.routes.ts            # Rutas (vacío por ahora)
├── styles.css                   # Estilos globales + Tailwind
├── index.html                   # HTML principal
└── main.ts                      # Bootstrap de la aplicación
```

---

## 🎨 Tecnologías

- **Angular 18+** con Standalone Components y Signals
- **Supabase** para base de datos PostgreSQL
- **Tailwind CSS 3.4** para estilos
- **TypeScript 5.4** con strict mode
- **Glassmorphism UI** con efectos de blur y gradientes

---

## 📝 Uso

### Crear un Subsistema
1. Ve a **Settings** → **Subsystems**
2. Click en **Add Subsystem**
3. Ingresa nombre, color y budget opcional

### Agregar Componentes
1. Selecciona un subsistema en el sidebar
2. Click en **Add Component**
3. Selecciona categoría, perfil y material
4. El peso se calcula automáticamente basado en las dimensiones

### Cálculo Automático de Peso
La aplicación soporta 4 métodos de cálculo:
- **Fixed**: Peso fijo (para COTS)
- **Linear**: Por longitud (tubing)
- **Area**: Por superficie (placas)
- **Volume**: Por volumen (piezas 3D)

---

## 🔧 Personalización

### Cambiar Colores
Edita `tailwind.config.js` para modificar la paleta de colores.

### Añadir Nuevos Materiales
Ve a Settings → Materials y agrega materiales personalizados con su densidad.

### Crear Perfiles Personalizados
Ve a Settings → Profiles para crear templates de cálculo.

---

## 📄 Licencia

MIT License - Libre para uso personal y comercial.

---

## 🤝 Contribuciones

¡Las contribuciones son bienvenidas! Si encuentras bugs o tienes sugerencias, abre un issue o PR.

---

**Hecho con 💜 para la comunidad FRC**
