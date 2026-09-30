# Data Layer

Farcaster Mobile uses [React Query](https://react-query.tanstack.com/) to manage fetching, caching, and updating data.

## The Query Client

At [the top of the React tree](https://github.com/merkle-manufactory/mobile/blob/dca17c954ff2a07725cda03ff860dd957dccb496/src/components/App.tsx#L17-L26), we inject a [`QueryClient`](https://react-query.tanstack.com/reference/QueryClient) via the [`QueryClientProvider`](https://react-query.tanstack.com/reference/QueryClientProvider). The client allows us to configure and interact with the cache, and the provider allows us to easily access the client via the [`useQueryClient`](https://react-query.tanstack.com/reference/useQueryClient#_top) hook.

## Underlying Data Structure

We typically shouldn't need to interact with the cache directly, but it can be helpful to have a general idea of how React Query organizes data. All of our app's data (e.g. API response payloads) and associated metadata are stored in a map that keys off of strings/arrays that identify each unique request signature (i.e. a given endpoint and set of parameters). For example, consider the [`useActivity`](https://github.com/merkle-manufactory/mobile/blob/3d8dffa7bd9ee0891bc895d3d3dbab0c1196bee8/src/hooks/useActivity.ts#L23-L30) hook, whose query key is an array of the hook name and the merkle root being passed as a parameter:

```javascript
[
  'useActivity',
  '0x7ec32bb102cff72dd7aad9fa5f6b0c24a8d2cf46e7aed3c15b7e1a0f734ccf47',
];
```

## Suspense

At the time of writing, [our query client](https://github.com/merkle-manufactory/mobile/blob/3d8dffa7bd9ee0891bc895d3d3dbab0c1196bee8/src/components/App.tsx#L9-L15) is using all the out-of-the-box default settings, but [enables suspense](https://react-query.tanstack.com/guides/suspense). Suspense is [a _technically_ experimental React primitive](https://reactjs.org/docs/concurrent-mode-suspense.html#what-is-suspense-exactly) that simplifies state management around asynchronous operations and allows us to write more declarative code. The React docs explain the how and why of suspense in detail, but we will attempt to give a tl;dr below...

Suspense is a mechanism that allows us to defer rendering of UI while we wait for one or more asyncronous operations. Data-fetching libraries that utilize suspense will typically provide querying APIs that expect a function that returns a promise. Behind the scenes, when a component/hook renders, it will first check to see if the desired data exists in the in-memory cache. If so, the hook will synchronously return with the desired data. If the data does not exist in the cache, the library will invoke the given function and throw the resulting promise like an error. At this point, the nearest instance of `Suspense` will catch the promise, then render the fallback UI (e.g. a loading indicator) until the promise resolves, at which point it will re-render with its original children. This time when the hook runs, it will be able to return immediately with the now-cached data, rather than throwing a promise.

To see how this works in practice, consider the following example. It is using React Query without suspense enabled.

```jsx
const WidgetList = () => {
  const { data, error, isError, isLoading } = useWidgets();

  if (isLoading) {
    return <LoadingIndicator />;
  }

  if (isError) {
    return <Error error={error} />;
  }
  return (
    <>
      {widgets.map((widget) => (
        <Widget key={widget.id} widget={widget} />
      ))}
    </>
  );
};
```

The above component will display a loading indicator while it fetches a list of widgets, then render the widgets once the response has been received. It works fine, but our component needs to perform conditional logic to decide what to render. The logic is manageable now, but imagine if we needed to make several API requests. Now imagine if we had several list components – `WidgetList`, `GadgetList`, `DoodadList`. For DUX and reusability reasons, we may want each of those components to define their own data requirements, _but_ we also want the parent component to defer rendering until all of its children have fetched their data. Logic around state management would very quickly grow in complexity.

Let's try to rewrite this example to use suspense. First, we need to ensure that any component performing an async operation is wrapped in `Suspense`. Note that the `Suspense` does not need to be a direct ancestor of the data-fetching component, it just needs exist higher in the React tree. With React Native apps, it is common to wrap suspense around each screen and provide a fullscreen loading indicator. That's [what we currently do](https://github.com/merkle-manufactory/mobile/blob/3d8dffa7bd9ee0891bc895d3d3dbab0c1196bee8/src/components/Screen.tsx#L9-L28) by default, but it should be noted that `Suspense` can be nested. That means if one screen requires more granular control over how we defer rendering of UI, we can wrap `Suspense` around nested components and the nearest suspense ancestor will take precedence for each async operation.

You'll notice in our screen example that we also include a [`QueryErrorResetBoundary`](https://react-query.tanstack.com/reference/QueryErrorResetBoundary). React Query will display the `fallbackRender` component in the event of an error, then retry the failed request when `resetErrorBoundary` is invoked.

```jsx
const Screen = ({ children }) => (
  <Suspense fallback={<LoadingIndicator />}>
    <QueryErrorResetBoundary>
      {({ reset }) => (
        <ErrorBoundary onReset={reset} fallbackRender={Error}>
          {children}
        </ErrorBoundary>
      )}
    </QueryErrorResetBoundary>
  </Suspense>
);
```

The error-handling may be a little hard to grok at first, but this is the kind of thing we'll typically write once and rarely look at again.

Now let's revisit the `WidgetList`.

```jsx
const WidgetList = () => {
  const widgets = useWidgets();

  return (
    <>
      {widgets.map((widget) => (
        <Widget key={widget.id} widget={widget} />
      ))}
    </>
  );
};
```

Notice that we no longer need any conditionals in our component. What's more is that we could also have `GadgetList` and `DoodadList` components with the same simple logic living as siblings to one another and the parent would naturally manage loading state and handle errors with no additional code. If we wanted each widget to have its own loader we could achieve that as well by wrapping them in suspense and error boundaries.

## Fetching Data

To fetch data with React Query, we will typically want to reach for [`useQuery`](https://react-query.tanstack.com/reference/useQuery) or [`useQueries`](react-query.tanstack.com/reference/useQueries) to perform multiple requests in parallel. [`useFeed`](https://github.com/merkle-manufactory/mobile/blob/3d8dffa7bd9ee0891bc895d3d3dbab0c1196bee8/src/hooks/useFeed.ts#L26-L34), which is used by the [`HomeScreen`](https://github.com/merkle-manufactory/mobile/blob/3d8dffa7bd9ee0891bc895d3d3dbab0c1196bee8/src/screens/Feed/FeedScreen.tsx#L13), is one example of how this works. Note that the key for this request includes the viewer address, so if we change the current viewer (via the [`CurrentUserProvider`](https://github.com/merkle-manufactory/mobile/blob/3d8dffa7bd9ee0891bc895d3d3dbab0c1196bee8/src/contexts/CurrentUserProvider.tsx)), the feed should naturally refetch without any invalidation on our part. This happens because when the `useFeed` hook re-renders (as a result of the `CurrentUserContext` changing), it will not find the desired data in the cache and will throw a promise as it fetches the new viewer's feed.

In some cases we may want to imperatively fetch data. Pull to refresh is a good example of this. In these cases, we will want to use the query client's [`fetchQuery`](https://react-query.tanstack.com/reference/QueryClient#queryclientfetchquery) function. We can see this demonstrated by [`useRefreshFeed`](https://github.com/merkle-manufactory/mobile/blob/3d8dffa7bd9ee0891bc895d3d3dbab0c1196bee8/src/hooks/useFeed.ts#L36-L39), which then invokes [`usePullToRefresh`](https://github.com/merkle-manufactory/mobile/blob/3d8dffa7bd9ee0891bc895d3d3dbab0c1196bee8/src/hooks/usePullToRefresh.tsx#L7-L31).

## Mutating Data

_Coming soon..._
