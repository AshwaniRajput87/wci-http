export interface Interceptor<T> {
  fulfilled: (value: T) => T | Promise<T>
  rejected?: (error: any) => any
}

export class InterceptorManager<T> {
  private interceptors: (Interceptor<T> | null)[] = []

  public use(
    fulfilled: (value: T) => T | Promise<T>,
    rejected?: (error: any) => any
  ): number {
    this.interceptors.push({
      fulfilled,
      rejected,
    })
    return this.interceptors.length - 1
  }

  public eject(id: number): void {
    if (this.interceptors[id]) {
      this.interceptors[id] = null
    }
  }

  public forEach(fn: (interceptor: Interceptor<T>) => void): void {
    this.interceptors.forEach((interceptor) => {
      if (interceptor) {
        fn(interceptor)
      }
    })
  }

  public count(): number {
    return this.interceptors.filter((interceptor) => interceptor !== null)
      .length
  }
}
