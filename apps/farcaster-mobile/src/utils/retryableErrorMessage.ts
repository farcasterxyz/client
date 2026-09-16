import { isFarcasterApiError } from 'farcaster-client-data';

const isConnectionError = (error: unknown) => {
  return (
    isFarcasterApiError(error) &&
    (error.isNetworkError || error.isOffline || error.hasTimedOut)
  );
};

const getRetryableErrorDescription = (error: unknown) => {
  if (isFarcasterApiError(error)) {
    if (isConnectionError(error)) {
      return '';
    }

    switch (error.endpointName) {
      case 'getCastLikes':
        return 'We were unable to retrieve the likes.';
      case 'getCastRecasters':
        return 'We were unable to retrieve the recasters.';
      case 'getClientConfig':
        return 'We were unable to retrieve the client config.';
      case 'getDirectCastConversationMessages':
        return 'We were unable to load the messages.';
      case 'getDirectCastKeys':
        return 'We were unable to retrieve the public keys.';
      case 'getFname':
        return 'We were unable to retrieve the fname';
      case 'getFollowers':
        return 'We were unable to retrieve the users.';
      case 'getFollowing':
        return 'We were unable to retrieve the users.';
      case 'getHealth':
        return 'We were unable to retrieve the health status.';
      case 'getIsUserInvited':
        return 'We were unable to retrieve the invite status.';
      case 'getNotificationsInGroup':
        return 'We were unable to retrieve the notifications.';
      case 'getNotificationActorsInGroup':
        return 'We were unable to retrieve the notification details.';
      case 'getOnboardingState':
        return 'We were unable to retrieve your session.';
      case 'getOnboardingStateAndAuthToken':
        return 'We were unable to retrieve your session.';
      case 'getThread':
        return 'We were unable to retrieve the thread.';
      case 'getUnseen':
        return 'We were unable to retrieve the unseen notifications.';
      case 'getUser':
        return 'We were unable to retrieve the user.';
      case 'getUserCasts':
        return 'We were unable to retrieve the casts.';
      case 'getUserPreferences':
        return 'We were unable to retrieve the user preferences.';
      case 'getVerifications':
        return 'We were unable to retrieve the verifications.';
      case 'searchUsers':
        return 'We were unable to retrieve the users.';
    }
  }

  if (typeof error === 'string') {
    return error;
  }

  return 'We encountered an unexpected error.';
};

export { getRetryableErrorDescription, isConnectionError };
