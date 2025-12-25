import { httpClientReady } from '../src/index'

test('http client setup works', () => {
  expect(httpClientReady).toBe(true)
})
