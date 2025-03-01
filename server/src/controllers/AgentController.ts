// src/controllers/AgentController.ts

import {
  initializeAgent,
  runAutonomousMode,
  runChatMode,
} from '../services/HederaAgentService';

/**
 * POST /execute controller
 */
export async function executeAgentHandler(req: any, res: any) {
  try {
    // Decide which mode to run
    const mode = req.body.mode || 'chat';
    const userPrompt = req.body.prompt || 'Hello, Agent!';

    // Initialize the agent
    const { agent, config } = await initializeAgent();

    if (mode === 'auto') {
      // Autonomous mode
      const autoResponses = await runAutonomousMode(agent, config);
      return res.json({ mode, responses: autoResponses });
    } else {
      // Chat mode (default)
      const chatResponses = await runChatMode(agent, config, userPrompt);
      return res.json({ mode, responses: chatResponses });
    }
  } catch (error: any) {
    console.error('Error in executeAgentHandler:', error.message);
    return res.status(500).json({ error: error.message });
  }
}
