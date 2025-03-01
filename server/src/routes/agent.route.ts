// src/routes/agent.route.ts

import { Router } from 'express';
import { executeAgentHandler } from '../controllers/AgentController';

const router = Router();

// POST /execute
router.post('/execute', executeAgentHandler);

export { router as agentRouter };
