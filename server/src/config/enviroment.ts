// src/config/environment.ts

import * as dotenv from 'dotenv';

dotenv.config();

/**
 * Validate that necessary env vars are set before continuing.
 * This can be called at the start of the application (in app.ts or server.ts).
 */
export function validateEnvironment(): void {
  const requiredVars = [
    'OPENAI_API_KEY',
    'HEDERA_ACCOUNT_ID',
    'HEDERA_PRIVATE_KEY',
    'ETHEREUM_PRIVATE_KEY',
  ];
  const missingVars = requiredVars.filter((v) => !process.env[v]);

  if (missingVars.length > 0) {
    console.error('Error: Missing required environment variables:');
    missingVars.forEach((v) => console.error(`  - ${v}`));
    process.exit(1);
  }
}
