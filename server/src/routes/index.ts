import { Router } from 'express';
import { agentRouter } from './agent.route';
import { viemRouter } from './viem.route';

const router = Router();

router.use('/', agentRouter);
router.use('/viem', viemRouter);

export default router;
