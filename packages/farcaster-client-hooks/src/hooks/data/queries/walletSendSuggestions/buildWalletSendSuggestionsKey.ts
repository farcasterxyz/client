import { ApiVerificationProtocol } from 'farcaster-client-data';

const buildWalletSendSuggestionsKey = ({
  protocol,
}: {
  protocol: ApiVerificationProtocol;
}) => ['walletSendSuggestions', protocol];

export { buildWalletSendSuggestionsKey };
