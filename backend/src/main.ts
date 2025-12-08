import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 1. Prefijo Global para la API
  // Todas las rutas empezarán con /api/v1 (ej: /api/v1/health)
  app.setGlobalPrefix('api/v1');

  // 2. Validación Global (DTOs)
  // Asegura que los datos entrantes cumplan con las reglas definidas en los DTOs
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true, // Elimina propiedades no definidas en el DTO
    forbidNonWhitelisted: true, // Lanza error si envían propiedades extra
    transform: true, // Convierte tipos automáticamente (ej. string '1' a number 1)
  }));

  // 3. Configuración CORS
  // Permite que el frontend (React) se comunique con este backend
  app.enableCors({
    origin: '*', // En producción, restringir al dominio del frontend
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  const PORT = process.env.PORT || 3000;
  await app.listen(PORT);
  console.log(`🚀 Backend server running on: http://localhost:${PORT}/api/v1`);
}
bootstrap();