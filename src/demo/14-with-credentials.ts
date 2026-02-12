/**
 * DEMO 14: WITH CREDENTIALS SUPPORT
 *
 * Shows how withCredentials influences fetch credentials mode.
 */
import { WciHttp } from '../client/WciHttp';

const loggingFetcher: typeof fetch = async (input, init) => {
  console.log(`[adapter] credentials mode: ${init?.credentials}`);
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  });
};

async function runCase(title: string, config: any) {
  console.log('\n================================================================');
  console.log(`|| ${title} ||`);
  console.log('================================================================');
  const client = new WciHttp(config.instanceConfig);
  await client.get('/with-credentials-demo', {
    ...config.requestConfig,
    fetcher: loggingFetcher,
  });
}

export async function run() {
  await runCase('Default request (same-origin)', {
    requestConfig: {},
  });

  await runCase('withCredentials true (include)', {
    requestConfig: { withCredentials: true },
  });

  await runCase('Instance default withCredentials true', {
    instanceConfig: { withCredentials: true, fetcher: loggingFetcher },
    requestConfig: {},
  });

  await runCase('Override to false (same-origin)', {
    instanceConfig: { withCredentials: true, fetcher: loggingFetcher },
    requestConfig: { withCredentials: false },
  });
}
