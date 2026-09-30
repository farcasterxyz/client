import { ComponentType, createElement, lazy } from 'react';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type PreloadableComponent<T extends ComponentType<any>> = T & {
  preload: () => Promise<void>;
};

// https://dev.to/blankhq/preloading-blog-post-content-f8a
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const lazyWithPreload = <T extends ComponentType<any>>(
  factory: () => Promise<{ default: T }>,
) => {
  let LoadedComponent: T | undefined;
  let factoryPromise: Promise<void> | undefined;

  const LazyComponent = lazy(factory);

  const loadComponent = () =>
    factory().then((module) => {
      LoadedComponent = module.default;
    });

  const Component = ((props) =>
    createElement(
      LoadedComponent || LazyComponent,
      props,
    )) as PreloadableComponent<T>;

  Component.preload = () => factoryPromise || loadComponent();

  return Component;
};

export { lazyWithPreload };
