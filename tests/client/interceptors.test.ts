import { WciHttp } from '../../src/client/WciHttp';
import { HttpResponse, WciHttpConfig } from '../../src/types/http.types';
import { WciHttpError } from '../../src/errors/WciHttpError';
import { createHttpErrorCodes } from '../../src/errors/httpErrorCodes';

import { vi, describe, it, expect, beforeEach, afterEach, jest } from 'vitest'; // Import all necessary Vitest globals

// Temporarily mock dispatchRequest for testing interceptor chain without actual network calls
// Mocks must be at the top level of the file for Vitest's hoisting
vi.mock('../../src/client/dispatchRequest', () => {
  return {
    dispatchRequest: vi.fn(), // Export a mock function named dispatchRequest
  };
});

// Now import the mocked dispatchRequest from the mocked module
import { dispatchRequest } from '../../src/client/dispatchRequest';

const httpErrorCodes = createHttpErrorCodes();

describe('Interceptor Chaining (Axios Parity)', () => {
  let wciHttp: WciHttp;
  let mockDispatchRequest: jest.Mock; // Declare mockDispatchRequest here, it will be assigned in beforeEach

  beforeEach(() => {
    wciHttp = new WciHttp();
    // Assign the imported mocked dispatchRequest to our local mock variable
    mockDispatchRequest = dispatchRequest as jest.Mock; // 'dispatchRequest' comes from the vi.mock import

    // Reset the mock before each test to ensure isolation
    mockDispatchRequest.mockReset();

    // Set its default implementation
    mockDispatchRequest.mockImplementation((config: WciHttpConfig) => {
      // Default successful response
      return Promise.resolve({
        data: { message: 'success' },
        status: 200,
        statusText: 'OK',
        headers: { 'content-type': 'application/json' },
        config: config,
        request: {},
      } as HttpResponse);
    });
  });

  afterEach(() => {
    // Vitest automatically handles clearing mocks between tests defined with vi.mock
    // No explicit restore needed for the module mock, but clearing implementation is good.
    // mockDispatchRequest.mockRestore(); // If we needed to restore the original unmocked implementation
  });

  // Helper to create a simple interceptor
  const createInterceptor = (
    name: string,
    fulfilledFn?: (val: any) => any,
    rejectedFn?: (err: any) => any,
    runWhenFn?: (config: WciHttpConfig) => boolean,
  ) => ({
    fulfilled: fulfilledFn ? (val: any) => { /* console.log(`${name} fulfilled`); */ return fulfilledFn(val); } : undefined,
    rejected: rejectedFn ? (err: any) => { /* console.log(`${name} rejected`); */ return rejectedFn(err); } : undefined,
    runWhen: runWhenFn,
  });

  it('should execute request interceptor fulfilled handlers in order (LIFO)', async () => {
    const order: string[] = [];
    wciHttp.interceptors.request.use(createInterceptor('req1', (config) => { order.push('req1'); return config; }).fulfilled);
    wciHttp.interceptors.request.use(createInterceptor('req2', (config) => { order.push('req2'); return config; }).fulfilled);

    await wciHttp.request({ url: '/test' });

    expect(order).toEqual(['req2', 'req1']);
    expect(mockDispatchRequest).toHaveBeenCalledTimes(1);
  });

  it('should execute response interceptor fulfilled handlers in order (FIFO)', async () => {
    const order: string[] = [];
    wciHttp.interceptors.response.use(createInterceptor('res1', (response) => { order.push('res1'); return response; }).fulfilled);
    wciHttp.interceptors.response.use(createInterceptor('res2', (response) => { order.push('res2'); return response; }).fulfilled);

    await wciHttp.request({ url: '/test' });

    expect(order).toEqual(['res1', 'res2']);
    expect(mockDispatchRequest).toHaveBeenCalledTimes(1);
  });

  it('should execute response interceptor rejected handlers in order (FIFO) when adapter rejects', async () => {
    mockDispatchRequest.mockImplementationOnce(() =>
      Promise.reject(
        new WciHttpError({ code: httpErrorCodes.NETWORK_ERROR, message: 'Network Fail', config: { url: '/test' } })
      )
    );

    const order: string[] = [];
    wciHttp.interceptors.response.use(createInterceptor('res1', undefined, (error) => { order.push('res1 rejected'); return Promise.reject(error); }).rejected);
    wciHttp.interceptors.response.use(createInterceptor('res2', undefined, (error) => { order.push('res2 rejected'); return Promise.reject(error); }).rejected);

    await expect(wciHttp.request({ url: '/test' })).rejects.toBeInstanceOf(WciHttpError);
    expect(order).toEqual(['res1 rejected', 'res2 rejected']);
    expect(mockDispatchRequest).toHaveBeenCalledTimes(1);
  });

  it('should execute request interceptor rejected handlers in order (FIFO) when an earlier request interceptor rejects', async () => {
    const order: string[] = [];
    wciHttp.interceptors.request.use(createInterceptor('req1', (config) => {
        order.push('req1 fulfilled');
        return Promise.reject(new WciHttpError({ code: 'CUSTOM_REJECT', message: 'Req1 rejects', config }));
    }).fulfilled);
    wciHttp.interceptors.request.use(createInterceptor('req2', undefined, (error) => {
        order.push('req2 rejected');
        return Promise.reject(error);
    }).rejected);
    wciHttp.interceptors.request.use(createInterceptor('req3', undefined, (error) => {
        order.push('req3 rejected');
        return Promise.reject(error);
    }).rejected);

    await expect(wciHttp.request({ url: '/test' })).rejects.toBeInstanceOf(WciHttpError);
    expect(order).toEqual(['req3 rejected', 'req2 rejected', 'req1 fulfilled']);
    expect(mockDispatchRequest).not.toHaveBeenCalled(); // Request never reaches dispatch
  });


  it('should let a rejected handler return a resolved value, continuing as fulfilled', async () => {
    mockDispatchRequest.mockImplementationOnce(() =>
      Promise.reject(
        new WciHttpError({ code: httpErrorCodes.NETWORK_ERROR, message: 'Network Fail', config: { url: '/test' } })
      )
    );

    const order: string[] = [];
    wciHttp.interceptors.response.use(createInterceptor('res1', undefined, (error) => {
      order.push('res1 rejected');
      // Resolve the error
      return Promise.resolve({
        data: { message: 'recovered from error' },
        status: 200,
        statusText: 'OK (intercepted)',
        headers: { 'content-type': 'application/json' },
        config: error.config,
        request: {},
      } as HttpResponse);
    }).rejected);
    wciHttp.interceptors.response.use(createInterceptor('res2', (response) => {
      order.push('res2 fulfilled');
      return response;
    }).fulfilled); // This fulfilled handler should now run

    const response = await wciHttp.request({ url: '/test' });

    expect(order).toEqual(['res1 rejected', 'res2 fulfilled']);
    expect(response.data).toEqual({ message: 'recovered from error' });
    expect(mockDispatchRequest).toHaveBeenCalledTimes(1);
  });

  it('should handle async interceptor functions', async () => {
    const order: string[] = [];
    wciHttp.interceptors.request.use(createInterceptor('async req', async (config) => {
      await new Promise(resolve => setTimeout(resolve, 10));
      order.push('async req');
      return { ...config, headers: { ...config.headers, 'X-Async': 'true' } };
    }).fulfilled);

    wciHttp.interceptors.response.use(createInterceptor('async res', async (response) => {
      await new Promise(resolve => setTimeout(resolve, 10));
      order.push('async res');
      return { ...response, data: { ...response.data, processed: true } };
    }).fulfilled);

    const response = await wciHttp.request({ url: '/test' });

    expect(order).toEqual(['async req', 'async res']);
    expect(response.config.headers).toHaveProperty('X-Async', 'true');
    expect(response.data).toHaveProperty('processed', true);
  });

  it('should handle runWhen condition for fulfilled handlers (request)', async () => {
    const order: string[] = [];
    wciHttp.interceptors.request.use(createInterceptor('cond req', (config) => { order.push('cond req'); return config; }).fulfilled, undefined, (config) => config.url === '/test');
    wciHttp.interceptors.request.use(createInterceptor('uncond req', (config) => { order.push('uncond req'); return config; }).fulfilled);

    await wciHttp.request({ url: '/test' });
    expect(order).toEqual(['uncond req', 'cond req']); // LIFO request execution

    order.length = 0; // Clear order
    await wciHttp.request({ url: '/other' });
    expect(order).toEqual(['uncond req']); // Only uncond should run
  });

  it('should handle runWhen condition for fulfilled handlers (response)', async () => {
    const order: string[] = [];
    wciHttp.interceptors.response.use(createInterceptor('cond res', (response) => { order.push('cond res'); return response; }).fulfilled, undefined, (config) => config.url === '/test');
    wciHttp.interceptors.response.use(createInterceptor('uncond res', (response) => { order.push('uncond res'); return response; }).fulfilled);

    await wciHttp.request({ url: '/test' });
    expect(order).toEqual(['cond res', 'uncond res']); // Both should run

    order.length = 0; // Clear order
    await wciHttp.request({ url: '/other' });
    expect(order).toEqual(['uncond res']); // Only uncond should run
  });


  it('should handle runWhen condition for rejected handlers (request)', async () => {
    const order: string[] = [];
    wciHttp.interceptors.request.use(createInterceptor('req1', (config) => {
        order.push('req1 fulfilled');
        return Promise.reject(new WciHttpError({ code: 'CUSTOM_REJECT', message: 'Req1 rejects', config: { url: '/test' } }));
    }).fulfilled);
    wciHttp.interceptors.request.use(createInterceptor('cond rej', undefined, (error) => { order.push('cond rej'); return Promise.reject(error); }).rejected, undefined, (config) => config.url === '/test');
    wciHttp.interceptors.request.use(createInterceptor('uncond rej', undefined, (error) => { order.push('uncond rej'); return Promise.reject(error); }).rejected);

    await expect(wciHttp.request({ url: '/test' })).rejects.toBeInstanceOf(WciHttpError);
    expect(order).toEqual(['uncond rej', 'cond rej', 'req1 fulfilled']);

    order.length = 0;
    wciHttp = new WciHttp(); // Reset interceptors for next test
    wciHttp.interceptors.request.use(createInterceptor('req1', (config) => {
        order.push('req1 fulfilled');
        return Promise.reject(new WciHttpError({ code: 'CUSTOM_REJECT', message: 'Req1 rejects', config: { url: '/other' } }));
    }).fulfilled);
    wciHttp.interceptors.request.use(createInterceptor('cond rej', undefined, (error) => { order.push('cond rej'); return Promise.reject(error); }).rejected, undefined, (config) => config.url === '/test');
    wciHttp.interceptors.request.use(createInterceptor('uncond rej', undefined, (error) => { order.push('uncond rej'); return Promise.reject(error); }).rejected);

    await expect(wciHttp.request({ url: '/other' })).rejects.toBeInstanceOf(WciHttpError);
    expect(order).toEqual(['uncond rej', 'req1 fulfilled']); // LIFO request order with conditional skip
  });

  it('should handle runWhen condition for rejected handlers (response)', async () => {
    mockDispatchRequest.mockImplementationOnce(() =>
      Promise.reject(new WciHttpError({ code: httpErrorCodes.NETWORK_ERROR, message: 'Network Fail', config: { url: '/test' } }))
    );

    const order: string[] = [];
    wciHttp.interceptors.response.use(createInterceptor('cond res rej', undefined, (error) => { order.push('cond res rej'); return Promise.reject(error); }).rejected, undefined, (config) => config.url === '/test');
    wciHttp.interceptors.response.use(createInterceptor('uncond res rej', undefined, (error) => { order.push('uncond res rej'); return Promise.reject(error); }).rejected);

    await expect(wciHttp.request({ url: '/test' })).rejects.toBeInstanceOf(WciHttpError);
    expect(order).toEqual(['cond res rej', 'uncond res rej']); // Both should run

    mockDispatchRequest.mockImplementationOnce(() =>
      Promise.reject(new WciHttpError({ code: httpErrorCodes.NETWORK_ERROR, message: 'Network Fail', config: { url: '/other' } }))
    );
    order.length = 0; // Clear order
    wciHttp = new WciHttp(); // Reset interceptors for next test
    wciHttp.interceptors.response.use(createInterceptor('cond res rej', undefined, (error) => { order.push('cond res rej'); return Promise.reject(error); }).rejected, undefined, (config) => config.url === '/test');
    wciHttp.interceptors.response.use(createInterceptor('uncond res rej', undefined, (error) => { order.push('uncond res rej'); return Promise.reject(error); }).rejected);

    await expect(wciHttp.request({ url: '/other' })).rejects.toBeInstanceOf(WciHttpError);
    expect(order).toEqual(['uncond res rej']); // 'cond res rej' should be skipped
  });

  it('should apply config.requestInterceptors before instance ones', async () => {
    const order: string[] = [];
    wciHttp.interceptors.request.use(createInterceptor('instance req', (config) => { order.push('instance req'); return config; }).fulfilled);

    await wciHttp.request({
      url: '/test',
      requestInterceptors: [
        createInterceptor('config req', (config) => { order.push('config req'); return config; }).fulfilled,
      ],
    });
    expect(order).toEqual(['config req', 'instance req']); // config interceptor registered in request config should run before instance ones
  });

  it('should apply instance.responseInterceptors before config ones', async () => {
    const order: string[] = [];
    wciHttp.interceptors.response.use(createInterceptor('instance res', (response) => { order.push('instance res'); return response; }).fulfilled);

    await wciHttp.request({
      url: '/test',
      responseInterceptors: [
        createInterceptor('config res', (response) => { order.push('config res'); return response; }).fulfilled,
      ],
    });
    expect(order).toEqual(['instance res', 'config res']);
  });

});
