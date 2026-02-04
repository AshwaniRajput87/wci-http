import { WciHttpConfig } from '../types/http.types';
export interface Interceptor<V> {
  fulfilled?: (value: V) => V | Promise<V>;
  rejected?: (error: any) => any;
  runWhen?: (config: WciHttpConfig) => boolean;
}

export class InterceptorManager<V> {
  private handlers: (Interceptor<V> | null)[] = [];

  public use(
    fulfilled?: (value: V) => V | Promise<V>,
    rejected?: (error: any) => any,
    runWhen?: (config: WciHttpConfig) => boolean,
  ): number {
    this.handlers.push({
      fulfilled,
      rejected,
      runWhen,
    });
    return this.handlers.length - 1;
  }

  public eject(id: number): void {
    if (this.handlers[id]) {
      this.handlers[id] = null;
    }
  }

  public forEach(
    fn: (interceptor: Interceptor<V>) => void,
  ): void {
    this.handlers.forEach((handler) => {
      if (handler) {
        fn(handler);
      }
    });
  }

  public getHandlers(): (Interceptor<V> | null)[] {
    return this.handlers;
  }

  public count(): number {
    return this.handlers.filter((handler) => handler !== null).length;
  }
}
