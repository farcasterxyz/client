/**
 * `viewNamePredicate` for Datadog RUM. The SDK names each view after the
 * active leaf route, so dynamically-named navigators leak raw route names:
 * the notifications tab view named its screens after server-driven tab ids
 * (`aggressive`/`moderate`/`none`/…), surfacing as bogus RUM view names. Such
 * routes opt into a stable name via the `rumViewName` param (see
 * NotificationsScreenContent); everything else keeps its tracked name.
 *
 * The lowercase look-alikes are NOT spelling splits to merge: `Feeds`
 * (preferences) ≠ home `Feed`, `Channel` (detail) ≠ the `channels` tab.
 */

// Never reaches RUM itself — the default paramsTrackingPredicate drops params.
type RumNamedRouteParams = { rumViewName?: string };

function getRumViewName(
  route: { name: string; params?: RumNamedRouteParams },
  trackedName: string,
): string | null {
  return route.params?.rumViewName ?? trackedName;
}

export { getRumViewName };
