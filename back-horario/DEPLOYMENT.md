# Despliegue: Vercel + Railway

Esta guía despliega el front estático en Vercel y los servicios Node.js y MySQL en Railway. El gateway es el único servicio de backend que debe tener dominio público; los demás se comunican por la red privada de Railway.

## 1. Crear los servicios en Railway

Conecta el repositorio a un proyecto de Railway y crea estos servicios desde **Empty Service**, configurando la raíz del servicio para que Railway use su Dockerfile:

| Nombre sugerido | Root Directory |
| --- | --- |
| `gateway` | `/back-horario/api-gateway` |
| `auth` | `/back-horario/auth-service` |
| `attendance` | `/back-horario/attendance-service` |
| `contractors` | `/back-horario/contractors-services` |
| `schedules` | `/back-horario/schedules-services` |

Agrega además un servicio MySQL de Railway y mantenlo privado. Railway permite importar Compose, pero algunas opciones de Compose pueden no estar soportadas; con servicios separados se configuran explícitamente los directorios, variables y comandos de migración.

## 2. Crear las bases de datos

Cada servicio Prisma necesita su propia base de datos. Ejecuta una vez en el MySQL de Railway el SQL de `mysql/init/01-create-databases.sql`. Esto crea:

- `indeportes_auth`
- `indeportes_attendance`
- `indeportes_contractors`
- `indeportes_schedules`

En Railway, asigna a cada servicio Prisma su variable `DATABASE_URL`, construida con las variables privadas del servicio MySQL. Por ejemplo, para `auth`:

```text
mysql://${{mysql.MYSQLUSER}}:${{mysql.MYSQLPASSWORD}}@${{mysql.MYSQLHOST}}:${{mysql.MYSQLPORT}}/indeportes_auth
```

Usa el nombre de servicio `mysql` o reemplázalo por el nombre que le asignes. Cambia el nombre de la base al configurar `attendance`, `contractors` y `schedules`. Si la contraseña contiene caracteres reservados de URL, usa una contraseña URL-safe o codifica esos caracteres.

## 3. Variables de los servicios

Define un `PORT` en cada servicio para mantener los puertos internos actuales:

| Servicio | `PORT` |
| --- | ---: |
| `gateway` | `10111` |
| `attendance` | `10112` |
| `auth` | `10113` |
| `contractors` | `10114` |
| `schedules` | `10115` |

Usa el mismo `JWT_SECRET` de al menos 32 bytes en `auth`, `attendance` y `schedules`. Créalo como variable compartida o referencia el mismo secreto en Railway; no lo pongas en el repositorio.

En `gateway`, configura las URLs privadas:

```text
AUTH_SERVICE_URL=http://${{auth.RAILWAY_PRIVATE_DOMAIN}}:10113
ATTENDANCE_SERVICE_URL=http://${{attendance.RAILWAY_PRIVATE_DOMAIN}}:10112
CONTRACTORS_SERVICE_URL=http://${{contractors.RAILWAY_PRIVATE_DOMAIN}}:10114
SCHEDULES_SERVICE_URL=http://${{schedules.RAILWAY_PRIVATE_DOMAIN}}:10115
ALLOWED_ORIGINS=https://TU-PROYECTO.vercel.app
```

Cuando Vercel asigne el dominio final, reemplaza `TU-PROYECTO` por el dominio exacto. Si agregas dominio personalizado o necesitas probar un preview de Vercel, agrega también ese origen separado por coma.

## 4. Ejecutar migraciones remotas

En cada uno de los servicios `auth`, `attendance` y `schedules`, configura el **Pre-deploy Command** en Railway como:

```text
npm run db:deploy
```

Las imágenes de estos servicios incluyen Prisma CLI, el esquema y la carpeta de migraciones para que este comando pueda crear las tablas antes de iniciar el servicio. No uses `prisma migrate dev` en Railway.

## 5. Exponer el gateway

Genera un dominio público únicamente para `gateway` y apunta su puerto de destino a `10111`. Configura `/health` como healthcheck. Los servicios internos y MySQL no necesitan dominio público.

## 6. Desplegar el front en Vercel

Importa el mismo repositorio en Vercel y configura:

- **Root Directory:** `front`
- **Build Command:** `npm run build`
- **Output Directory:** `dist`
- **Environment Variable:** `VITE_API_URL=https://DOMINIO-PUBLICO-DEL-GATEWAY`

La URL no debe terminar en `/`. Vercel incorpora variables `VITE_*` durante la build, así que vuelve a desplegar después de cambiarlas. El proxy de `vite.config.ts` se usa solo al desarrollar en local.

## Orden recomendado

1. Crear MySQL y las cuatro bases.
2. Crear los servicios internos y sus variables.
3. Crear `gateway`, configurar URLs privadas, `ALLOWED_ORIGINS` y dominio público.
4. Configurar y desplegar `front` en Vercel con `VITE_API_URL`.
5. Probar login, creación/listado de horarios y asistencia.

