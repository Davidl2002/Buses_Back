# Script de instalacion automatica para MoviPass Backend
# Ejecutar con: .\setup.ps1

Write-Host ""
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host "   MoviPass Backend - Instalacion            " -ForegroundColor Cyan
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host ""

# Verificar Node.js
Write-Host "Verificando Node.js..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "Node.js instalado: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "Error: Node.js no esta instalado" -ForegroundColor Red
    Write-Host "   Descargalo de: https://nodejs.org" -ForegroundColor Yellow
    exit 1
}

# Verificar Docker
Write-Host "Verificando Docker..." -ForegroundColor Yellow
try {
    $dockerVersion = docker --version
    Write-Host "Docker instalado: $dockerVersion" -ForegroundColor Green
} catch {
    Write-Host "Error: Docker no esta instalado" -ForegroundColor Red
    Write-Host "   Descargalo de: https://www.docker.com/products/docker-desktop" -ForegroundColor Yellow
    exit 1
}

# Paso 1: Instalar dependencias
Write-Host ""
Write-Host "Paso 1/5: Instalando dependencias..." -ForegroundColor Cyan
npm install

if ($LASTEXITCODE -ne 0) {
    Write-Host "Error al instalar dependencias" -ForegroundColor Red
    exit 1
}
Write-Host "Dependencias instaladas" -ForegroundColor Green

# Paso 2: Configurar .env
Write-Host ""
Write-Host "Paso 2/5: Configurando variables de entorno..." -ForegroundColor Cyan
if (-not (Test-Path ".env")) {
    Copy-Item ".env.example" ".env"
    Write-Host "Archivo .env creado" -ForegroundColor Green
    Write-Host "IMPORTANTE: Edita el archivo .env con tus credenciales" -ForegroundColor Yellow
} else {
    Write-Host "Archivo .env ya existe" -ForegroundColor Green
}

# Paso 3: Iniciar Docker
Write-Host ""
Write-Host "Paso 3/5: Iniciando PostgreSQL en Docker..." -ForegroundColor Cyan
docker-compose up -d

if ($LASTEXITCODE -ne 0) {
    Write-Host "Error al iniciar Docker" -ForegroundColor Red
    exit 1
}

Write-Host "Esperando 15 segundos para que PostgreSQL este listo..." -ForegroundColor Yellow
Start-Sleep -Seconds 15
Write-Host "PostgreSQL iniciado" -ForegroundColor Green

# Paso 4: Configurar Prisma
Write-Host ""
Write-Host "Paso 4/5: Configurando base de datos con Prisma..." -ForegroundColor Cyan

Write-Host "   Generando cliente Prisma..." -ForegroundColor Yellow
npm run prisma:generate
if ($LASTEXITCODE -ne 0) {
    Write-Host "Error al generar cliente Prisma" -ForegroundColor Red
    exit 1
}

Write-Host "   Ejecutando migraciones..." -ForegroundColor Yellow
npm run prisma:migrate
if ($LASTEXITCODE -ne 0) {
    Write-Host "Error al ejecutar migraciones" -ForegroundColor Red
    exit 1
}

Write-Host "   Poblando base de datos con datos de prueba..." -ForegroundColor Yellow
npm run prisma:seed
if ($LASTEXITCODE -ne 0) {
    Write-Host "Error al poblar base de datos" -ForegroundColor Red
    exit 1
}

Write-Host "Base de datos configurada" -ForegroundColor Green

# Paso 5: Resumen
Write-Host ""
Write-Host "Instalacion Completada!" -ForegroundColor Green
Write-Host ""

Write-Host "Para iniciar el servidor, ejecuta:" -ForegroundColor Cyan
Write-Host "   npm run dev" -ForegroundColor White
Write-Host ""

Write-Host "Credenciales de prueba:" -ForegroundColor Cyan
Write-Host ""
Write-Host "   SuperAdmin:" -ForegroundColor Yellow
Write-Host "   - Email:    superadmin@movipass.com" -ForegroundColor White
Write-Host "   - Password: Admin123!" -ForegroundColor White
Write-Host ""
Write-Host "   Admin:" -ForegroundColor Yellow
Write-Host "   - Email:    admin@transchimborazo.com" -ForegroundColor White
Write-Host "   - Password: Admin123!" -ForegroundColor White
Write-Host ""
Write-Host "   Cliente:" -ForegroundColor Yellow
Write-Host "   - Email:    cliente@test.com" -ForegroundColor White
Write-Host "   - Password: Cliente123!" -ForegroundColor White
Write-Host ""

Write-Host "Documentacion:" -ForegroundColor Cyan
Write-Host "   - README.md         Documentacion completa" -ForegroundColor White
Write-Host "   - INSTALACION.md    Guia de instalacion" -ForegroundColor White
Write-Host "   - EJEMPLOS_API.md   Ejemplos de uso" -ForegroundColor White
Write-Host ""

Write-Host "URLs utiles:" -ForegroundColor Cyan
Write-Host "   - API:          http://localhost:3000" -ForegroundColor White
Write-Host "   - Health Check: http://localhost:3000/health" -ForegroundColor White
Write-Host "   - Prisma Studio: npm run prisma:studio" -ForegroundColor White
Write-Host ""

Write-Host "Listo para comenzar!" -ForegroundColor Green
Write-Host ""
