// src/routes/agent.route.ts

import { Router } from 'express';
import { executeViemAgentHandler } from '../controllers/ViemController';

const router = Router();

// POST /execute
router.post('/execute', executeViemAgentHandler);

export { router as viemRouter };
