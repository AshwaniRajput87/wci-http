import { createHttpClient } from '../index';

const client = createHttpClient({ errorPrefix: 'DEMO' });

async function run() {
  const data = await client.get(
    'https://jsonplaceholder.typicode.com/todos/1'
  );

  console.log(data);
}

run();
