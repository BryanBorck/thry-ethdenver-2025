// src/app.ts
import express from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import router from './routes';
import { validateEnvironment } from './config/enviroment';

validateEnvironment();

const app = express();

app.use(cors());
app.use(express.json());

// Swagger docs (public)
// app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Protected API routes
app.use('/', router);

export { app };
