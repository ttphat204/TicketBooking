import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './interfaces/http/swagger';
import orderRoutes from './interfaces/http/routes/order.routes';
import concertRoutes from './interfaces/http/routes/concert.routes';
import { poolPromise } from './infrastructure/database/mssql';
import { ExpiredOrderWorker } from './infrastructure/workers/expired-order-worker';

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
// app.use(helmet()); // Removed to allow inline scripts in index.html
app.use(express.json());

// Swagger Documentation
app.use('/swagger', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Routes
app.use('/api/orders', orderRoutes);
app.use('/api/concerts', concertRoutes);

import path from 'path';
app.use(express.static(path.join(process.cwd(), 'public')));

// Start server after ensuring database connection
poolPromise
  .then(() => {
    app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
      
      // Start Background Workers
      const expiredOrderWorker = new ExpiredOrderWorker();
      expiredOrderWorker.start(30000); // Check every 30 seconds
    });
  })
  .catch((err) => {
    console.error('Failed to start server due to database connection error');
    process.exit(1);
  });
