declare module 'expo-modules-core' {
  export type AnyEventListener = (...args: any[]) => any;
  export type EventMap = Record<string, AnyEventListener>;

  export interface EventSubscription {
    remove(): void;
  }

  export class CodedError extends Error {}
  export class EventEmitter<TEvents extends EventMap = EventMap> {
    addListener<TEventName extends keyof TEvents>(
      eventName: TEventName,
      listener: TEvents[TEventName],
    ): EventSubscription;
    removeAllListeners(eventName?: keyof TEvents): void;
  }

  export function requireNativeModule<TModule = any>(_moduleName: string): TModule;
}

declare module 'expo-modules-core/types' {
  export type AnyEventListener = (...args: any[]) => any;
  export type EventMap = Record<string, AnyEventListener>;

  export interface EventSubscription {
    remove(): void;
  }

  export interface EventEmitter<TEvents extends EventMap = EventMap> {
    addListener<TEventName extends keyof TEvents>(
      eventName: TEventName,
      listener: TEvents[TEventName],
    ): EventSubscription;
    removeAllListeners(eventName?: keyof TEvents): void;
  }
}
