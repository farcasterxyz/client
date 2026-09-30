# Navigation

Farcaster Mobile uses [React Navigation](https://reactnavigation.org/) for managing navigation.

## Navigator

The [`Navigation`](https://github.com/merkle-manufactory/mobile/blob/f115f63a0a5ff8143eb849218945d462fbc1a986/src/navigation/Navigation.tsx#L19-L45) component returns a [`NavigationContainer`](https://reactnavigation.org/docs/navigation-container/). This `NavigationContainer` is the entry point for navigation within the app and is responsible for managing the app's navigation state. Depending on the user's authentication status, the `StackNavigator` will either register a set of signed-out screens or (at the time of writing) a single [`BottomTabNavigator`](https://reactnavigation.org/docs/upgrading-from-5.x/#bottom-tab-navigator), which is the main tab navigator for the signed-in user experience. It is worth noting here that [navigators can be nested](https://reactnavigation.org/docs/nesting-navigators) and that at some point in the future, the authenticated path will likely return [some modal screens as siblings](https://reactnavigation.org/docs/modal/#creating-a-stack-with-modal-screens) to the `BottomTabNavigator`.

The [`BottomTabNavigator`](https://github.com/merkle-manufactory/mobile/blob/main/src/navigation/BottomTabNavigator.tsx) defines icons, labels, and a `StackNavigator` for each of the app's main tabs. Each of these stacks then registers the screens that the user can push onto that stack. For example, in [`HomeStack`](https://github.com/merkle-manufactory/mobile/blob/main/src/navigation/HomeStack.tsx), we register the `HomeScreen` and `ActivityScreen`. We can additionally provide options for all of our navigators and screens to control how they behave. For example, on top-level screens we do not want to show the header.

## Adding a New Screen

To add a screen to an existing stack, we will need to do the following:

- Find the relevant `ParamList` type (e.g. `HomeStackParamList`) in [`types`](https://github.com/merkle-manufactory/mobile/blob/main/src/types.tsx). Add the route name as a key with the parameters that screen will expect to receive as a value. If the screen expects no parameters, the value should be `undefined`.
- In `src/screens`, create a folder and file for the new screen. Follow the patterns established in other screens (e.g. [`ActivityScreen`](https://github.com/merkle-manufactory/mobile/blob/main/src/screens/Activity/ActivityScreen.tsx)), creating a new `NativeStackScreenProps` type with the relevant param list and route name, then calling [`buildScreen`](https://github.com/merkle-manufactory/mobile/blob/f115f63a0a5ff8143eb849218945d462fbc1a986/src/components/Screen.tsx#L31-L36) and providing the new params type as a generic. This will add typing for the props of the component passed to `buildScreen`. See [`ActivityScreen`](https://github.com/merkle-manufactory/mobile/blob/main/src/screens/Activity/ActivityScreen.tsx) as an example.
- Find where the relevant stack is defined (e.g. [`HomeStack`](https://github.com/merkle-manufactory/mobile/blob/main/src/navigation/HomeStack.tsx)) and add a new screen with the route name specified in [`types`](https://github.com/merkle-manufactory/mobile/blob/main/src/types.tsx) and the new screen as a component.

## Moving Between Screens

To eliminate boilerplate and ensure type safety when navigating between screens, we have wrapped some of the frequently-used [`StackActions`](https://reactnavigation.org/docs/stack-actions/) and [`CommonActions`](https://reactnavigation.org/docs/navigation-actions/):

- [`usePush`](https://github.com/merkle-manufactory/mobile/blob/main/src/hooks/usePush.ts)
- [`usePop`](https://github.com/merkle-manufactory/mobile/blob/main/src/hooks/usePop.ts)
- [`usePopToTop`](https://github.com/merkle-manufactory/mobile/blob/main/src/hooks/usePopToTop.ts)
- [`useNavigate`](https://github.com/merkle-manufactory/mobile/blob/main/src/hooks/useNavigate.ts)
- [`useGoBack`](https://github.com/merkle-manufactory/mobile/blob/main/src/hooks/useGoBack.ts)

For example, we can push (in a type-safe way!) the `ActivityScreen` onto the current stack (assuming that `ActivityScreen` is registered as a screen on the current stack) in the following way:

```jsx
const ListActivity = ({ hash }) => {
  const push = usePush();

  return (
    {/*...*/}
    <AtomsButton  onPress={() => {
      push('Activity', { hash });
    }}>
      View Activity
    </AtomsButton>
    {/*...*/}
  )
}
```
