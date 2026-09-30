import { ApiSyncChannelMessage, AuthToken } from 'farcaster-client-data';
import { KeyTransport } from 'farcaster-cryptography';
import { useCallback } from 'react';

const useDecryptAuthToken = () => {
  return useCallback(
    async ({
      channelId,
      message,
      transport,
    }: {
      channelId: string;
      message: ApiSyncChannelMessage;
      transport: KeyTransport;
    }) => {
      const base64Data = await transport!.handleSyncMessage({
        ...message,
        channelId,
      });
      const authData = JSON.parse(
        Buffer.from(base64Data as string, 'base64').toString('utf8'),
      );

      if (!authData.message) {
        return {
          authToken: authData as AuthToken,
        };
      }

      return {
        authToken: authData.authToken as AuthToken,
        message: authData.message as string,
        signature: authData.signature as string,
      };
    },
    [],
  );
};

export { useDecryptAuthToken };
