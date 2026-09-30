import {
  ApiLocation,
  ApiProfileToken,
  ApiProfileTokenData,
} from 'farcaster-client-data';

export const hasProfileToken = (profileToken?: ApiProfileToken): boolean => {
  return !!profileToken?.tokenUri && profileToken.tokenUri !== '';
};

export const getProfileTokenData = (
  profileToken?: ApiProfileToken,
): ApiProfileTokenData | undefined => {
  if (hasProfileToken(profileToken) && profileToken?.token) {
    return profileToken.token;
  }
  return undefined;
};

export const hasProfileLocation = (location?: ApiLocation): boolean => {
  return (
    !!location?.placeId &&
    location.placeId !== '' &&
    !!location.description &&
    location.description !== ''
  );
};
