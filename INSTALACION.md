# 🚀 Guía de Instalación Rápida - MoviPass Backend

## Paso 1: Instalar Dependencias

```powershell
npm install
```

## Paso 2: Configurar Variables de Entorno

Edita el archivo `.env` y agrega tus credenciales:

```env
# Database
DATABASE_URL="postgresql://postgres:password@localhost:5432/MoviPass?schema=public"

# JWT
JWT_SECRET=tu-secreto-jwt-super-seguro-cambiar-en-produccion

# Brevo (para emails)
BREVO_API_KEY=tu-api-key-de-brevo
BREVO_FROM_EMAIL=noreply@movipass.com
BREVO_FROM_NAME=MoviPass

# PayPal
PAYPAL_MODE=sandbox
PAYPAL_CLIENT_ID=tu-paypal-client-id
PAYPAL_CLIENT_SECRET=tu-paypal-client-secret

# Frontend URL
FRONTEND_URL=http://localhost:5173
```

**IMPORTANTE**: Si no tienes credenciales de Brevo o PayPal, puedes usar valores de ejemplo temporalmente. El sistema funcionará pero no enviará emails ni procesará pagos reales.

## Paso 3: Iniciar Base de Datos

```powershell
# Iniciar PostgreSQL en Docker
docker-compose up -d

# Espera 10 segundos para que PostgreSQL esté listo
Start-Sleep -Seconds 10
```

## Paso 4: Configurar Prisma

```powershell
# Generar el cliente de Prisma
npm run prisma:generate

# Crear las tablas en la base de datos
npm run prisma:migrate

# Poblar con datos de prueba
npm run prisma:seed
```

## Paso 5: Iniciar el Servidor

```powershell
# Modo desarrollo (con hot-reload)
npm run dev
```

El servidor estará disponible en: **http://localhost:3000**

## ✅ Verificar que funciona

Abre tu navegador o Postman y accede a:

```
GET http://localhost:3000/health
```

Deberías ver:
```json
{
  "status": "OK",
  "timestamp": "2024-..."
}
```

## 🔑 Credenciales de Prueba

Después de ejecutar el seed, tendrás estos usuarios:

### SuperAdmin
- Email: `superadmin@movipass.com`
- Password: `Admin123!`

### Admin (Trans Chimborazo)
- Email: `admin@transchimborazo.com`
- Password: `Admin123!`

### Oficinista
- Email: `oficinista@transchimborazo.com`
- Password: `Oficina123!`

### Chofer
- Email: `chofer@transchimborazo.com`
- Password: `Chofer123!`

### Cliente
- Email: `cliente@test.com`
- Password: `Cliente123!`

## 📝 Probar Login

```powershell
# Con PowerShell
$body = @{
    email = "admin@transchimborazo.com"
    password = "Admin123!"
} | ConvertTo-Json

Invoke-RestMethod -Uri http://localhost:3000/api/auth/login -Method POST -Body $body -ContentType "application/json"
```

## 🛠️ Comandos Útiles

```powershell
# Ver logs de Docker
docker-compose logs -f

# Abrir Prisma Studio (interfaz visual de la BD)
npm run prisma:studio

# Detener Docker
docker-compose down

# Limpiar y reiniciar todo
docker-compose down -v
npm run prisma:migrate
npm run prisma:seed
```

## 🐛 Solución de Problemas

### Error: "Cannot connect to database"
- Verifica que Docker esté corriendo: `docker ps`
- Reinicia el contenedor: `docker-compose restart`

### Error: "Port 3000 already in use"
- Cambia el puerto en `.env`: `PORT=3001`

### Error: "JWT_SECRET is required"
- Asegúrate de tener el archivo `.env` con todas las variables

### Error con Prisma
```powershell
# Regenerar cliente
npm run prisma:generate

# Resetear la base de datos
npm run prisma:migrate reset
```

## 📚 Documentación Completa

Lee el `README.md` para ver:
- Arquitectura completa
- Todos los endpoints
- Ejemplos de uso
- Guía de desarrollo

## 🎯 Próximos Pasos

1. Probar los endpoints con Postman o Thunder Client
2. Crear una cooperativa
3. Agregar buses
4. Crear rutas y frecuencias
5. Generar viajes
6. Vender tickets

¡Disfruta desarrollando con MoviPass! 🚌✨
