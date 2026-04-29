# 🏥 SGH — Sistema de Gestión Hospitalaria

Proyecto académico desarrollado con metodología SCRUM.

## Stack tecnológico

| Capa | Tecnología |
|------|-----------|
| Frontend | React.js + Vite + Tailwind CSS |
| Backend | Node.js + Express |
| Base de Datos | MySQL + Sequelize |
| Autenticación | JWT + Bcrypt |
| Testing | Jest + Supertest |

## Estructura de ramas

```
main        → producción / entrega final
develop     → integración de features
feature/login    → HU2, HU26, HU30
feature/register → HU1, HU25
feature/account  → HU31
```

## Instalación y ejecución

### Backend
```bash
cd SGH\backend
npm install
cp .env.example .env   # Configura tus variables
npx sequelize db:migrate
npx sequelize db:seed:all
npm run dev
```

### Frontend
```bash
cd SGH\frontend
npm install
npm run dev
```

## Usuario admin por defecto (seeder)
- **Email:** admin@hospital.com
- **Password:** Admin123!



## Sprint 1 — Historias de usuario cubiertas
- ✅ HU1: Registro de paciente
- ✅ HU2: Inicio de sesión
- ✅ HU3: Cierre de sesión
- ✅ HU25: Almacenamiento en base de datos
- ✅ HU26: Validación de credenciales
- ✅ HU30: Bloqueo por intentos fallidos
- ✅ HU31: Visualización básica de usuarios (admin)
