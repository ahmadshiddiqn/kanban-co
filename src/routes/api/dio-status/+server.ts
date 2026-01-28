import { exec } from 'child_process';
import { promisify } from 'util';
import { json } from '@sveltejs/kit';

const execAsync = promisify(exec);

export async function GET() {
  try {
    const { stdout } = await execAsync('clawdbot sessions list --json');
    const data = JSON.parse(stdout);

    const session = data.sessions[0];
    const ageMs = session?.ageMs || 0;
    const ageMinutes = ageMs / 60000;

    // Determine status based on session age
    let status = 'idle';
    let state = 'sleeping';

    if (ageMs < 60000) { // < 1 minute
      status = 'working';
      state = 'active';
    } else if (ageMs < 300000) { // < 5 minutes
      status = 'idle';
      state = 'thinking';
    } else {
      status = 'idle';
      state = 'sleeping';
    }

    return json({
      status,
      state,
      sessionAgeMs: ageMs,
      sessionAgeMinutes: Math.round(ageMinutes * 100) / 100,
      lastActivity: new Date(Date.now() - ageMs).toISOString(),
      model: session?.model || 'unknown',
      tokensUsed: session?.totalTokens || 0
    });
  } catch (error) {
    return json({
      error: 'Failed to get Clawdbot status',
      message: error.message
    }, { status: 500 });
  }
}
