// src/server.ts
import 'reflect-metadata';
import { app } from './app';
// import { initDB } from './config/database';

const PORT = process.env.PORT || 5001;

async function startServer() {
  //   await initDB();

  app.listen(PORT, () => {
    console.log(`Server listening on http://localhost:${PORT}`);
    // console.log(`Swagger docs available at http://localhost:${PORT}/api-docs`);
  });
}

startServer();
