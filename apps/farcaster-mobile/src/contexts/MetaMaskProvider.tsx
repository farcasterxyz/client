// import {
//   MetaMaskProvider as MetaMaskProviderLib,
//   useSDK,
// } from '@metamask/sdk-react-native';
// import React, {
//   createContext,
//   ReactNode,
//   useCallback,
//   useContext,
//   useMemo,
// } from 'react';
// import { toHex } from 'viem';

// import { logInDevOnly } from '~/utils/LogUtils';

// const sdkOptions = {
//   dappMetadata: {
//     name: 'Warpcast',
//     url: 'https://warpcast.com',
//     iconUrl: 'https://yourdapp.com/icon.png',
//     scheme: 'farcaster',
//   },
//   // infuraAPIKey: 'YOUR_INFURA_API_KEY', // Optional, but highly recommended for a better user experience
// };

// export function MetaMaskProvider({ children }: { children: ReactNode }) {
//   return (
//     <MetaMaskProviderLib sdkOptions={sdkOptions}>
//       <MetaMaskProviderInner>{children}</MetaMaskProviderInner>
//     </MetaMaskProviderLib>
//   );
// }

// // Copied
// type SendTransactionArgs = {
//   toAddress: string;
//   data: string;
//   weiValue: string;
//   chainId: string;
//   gasLimit?: string;
//   actionSource?: {
//     url: string;
//   };
// };

// type SignTypedDataV4Args = {
//   message: Record<string, unknown>;
//   types: Record<string, unknown>;
//   primaryType: string;
//   domain?: {
//     chainId?: number;
//     name?: string;
//     salt?: string;
//     verifyingContract?: string;
//     version?: string;
//   };
// };

// export type WrappedResult<T> = Promise<T | 'wallet-not-installed'>;
// export type ConnectResult =
//   | {
//       success: true;
//     }
//   | {
//       success: false;
//       errorReason: 'user_rejected' | 'unknown';
//     };

// export type SendTransactionResult =
//   | {
//       success: true;
//       transactionHash: string;
//     }
//   | {
//       success: false;
//       errorReason: 'user_rejected' | 'unknown';
//     };

// export type SignatureResult =
//   | {
//       success: true;
//       signature: string;
//     }
//   | {
//       success: false;
//       errorReason: 'user_rejected' | 'unknown';
//     };

// type MetaMaskContextValue = {
//   name: string;
//   address: string | undefined;
//   chainId: string | undefined;
//   checkIfInstalled: () => Promise<boolean>;
//   connect: () => Promise<string>;
//   disconnect: () => void;
//   sendTransaction: (
//     args: SendTransactionArgs,
//   ) => WrappedResult<SendTransactionResult>;
//   signTypedDataV4: (
//     chainId: number,
//     typedDataJson: SignTypedDataV4Args,
//   ) => WrappedResult<SignatureResult>;
// };

// const MetaMaskContext = createContext<MetaMaskContextValue>({
//   name: 'MetaMask',
//   address: undefined,
//   chainId: undefined,
//   checkIfInstalled: async () => {
//     throw new Error('No MetaMaskContext.Provider');
//   },
//   connect: async () => {
//     throw new Error('No MetaMaskContext.Provider');
//   },
//   sendTransaction: async () => {
//     throw new Error('No MetaMaskContext.Provider');
//   },
//   signTypedDataV4: async () => {
//     throw new Error('No MetaMaskContext.Provider');
//   },
//   disconnect: () => {
//     throw new Error('No MetaMaskContext.Provider');
//   },
// });

// export const useMetaMask = () => useContext(MetaMaskContext);

// export function MetaMaskProviderInner({ children }: { children: ReactNode }) {
//   const {
//     sdk,
//     provider,
//     chainId,
//     account: address,
//     connected: isConnected,
//   } = useSDK();

//   // const [detectedCustomNetworks, setDetectedCustomNetworks] = useState<
//   //   Record<string, boolean>
//   // >({});

//   const connect = useCallback(async () => {
//     if (!sdk) {
//       throw new Error('MetaMask SDK is not initialized');
//     }

//     logInDevOnly('Connecting to MetaMask');

//     if (address) {
//       logInDevOnly('Already connected');
//       return address;
//     }

//     const addr = (await sdk.connect()) as string;
//     logInDevOnly('Connected to MetaMask');

//     return addr;
//   }, [sdk, address]);

//   const sendTransaction = useCallback(
//     async (
//       args: SendTransactionArgs,
//       isRetry = false,
//     ): WrappedResult<SendTransactionResult> => {
//       const address = await provider?.getSelectedAddress();
//       if (!address) {
//         throw new Error('MetaMask is not connected');
//       }

//       logInDevOnly('[MetaMaskProvider] sending transaction');

//       const chainId = await provider?.getChainId();

//       if (chainId !== toHex(Number(args.chainId))) {
//         await sdk?.connectWith({
//           method: 'wallet_switchEthereumChain',
//           params: [{ chainId: toHex(Number(args.chainId)) }],
//         });
//       }

//       try {
//         const transactionHash = (await provider?.request({
//           method: 'eth_sendTransaction',
//           params: [
//             {
//               to: args.toAddress,
//               from: address,
//               value: toHex(BigInt(args.weiValue)),
//               data: args.data,
//               maxFeePerGas: args.gasLimit
//                 ? toHex(BigInt(args.gasLimit))
//                 : undefined,
//             },
//           ],
//         })) as string;

//         logInDevOnly(
//           `[MetaMaskProvider] transaction result: ${JSON.stringify(transactionHash)}`,
//         );

//         return {
//           success: true,
//           transactionHash,
//         } as const;
//       } catch (e) {
//         logInDevOnly(`[MetaMaskProvider] error sending transaction: ${e}`);

//         const message = (e as Error).message ?? '';
//         if (message.startsWith('User rejected the transaction')) {
//           return {
//             success: false,
//             errorReason: 'user_rejected',
//           };
//         }

//         if (
//           !isRetry &&
//           message.startsWith(
//             'The selected account or chain has changed. Please try again.',
//           )
//         ) {
//           // this leave the MM controlled Alert up, they need to remove
//           return await sendTransaction(args, true);
//         }

//         return {
//           success: false,
//           errorReason: 'unknown',
//         };
//       }
//     },
//     [provider, sdk],
//   );

//   const signTypedDataV4 = useCallback(
//     async (
//       chainId: number,
//       typedData: SignTypedDataV4Args,
//       isRetry = false,
//     ): WrappedResult<SignatureResult> => {
//       const address = await provider?.getSelectedAddress();
//       if (!address) {
//         throw new Error('MetaMask is not connected');
//       }

//       logInDevOnly('[MetaMaskProvider] requesting eth_signTypedData_v4');

//       const currentChainId = await provider?.getChainId();

//       if (currentChainId !== toHex(chainId)) {
//         await sdk?.connectWith({
//           method: 'wallet_switchEthereumChain',
//           params: [{ chainId: toHex(chainId) }],
//         });
//       }

//       try {
//         const signature = (await provider?.request({
//           method: 'eth_signTypedData_v4',
//           params: [address, JSON.stringify(typedData)],
//         })) as string;

//         logInDevOnly(
//           `[MetaMaskProvider] eth_signTypedData_v4 result: ${JSON.stringify(signature)}`,
//         );

//         return {
//           success: true,
//           signature,
//         } as const;
//       } catch (e) {
//         logInDevOnly(`[MetaMaskProvider] eth_signTypedData_v4 error: ${e}`);

//         const message = (e as Error).message ?? '';
//         if (message.startsWith('User rejected the request')) {
//           return {
//             success: false,
//             errorReason: 'user_rejected',
//           };
//         }

//         if (
//           !isRetry &&
//           message.startsWith(
//             'The selected account or chain has changed. Please try again.',
//           )
//         ) {
//           // this leave the MM controlled Alert up, they need to remove
//           return await signTypedDataV4(chainId, typedData, true);
//         }

//         return {
//           success: false,
//           errorReason: 'unknown',
//         };
//       }
//     },
//     [provider, sdk],
//   );

//   const disconnect = useCallback(async () => {
//     await sdk?.terminate();
//   }, [sdk]);

//   const checkIfInstalled = useCallback(async () => {
//     return true;
//   }, []);

//   const contextValue = useMemo(
//     () => ({
//       name: 'MetaMask',
//       address,
//       chainId,
//       isConnected,
//       connect,
//       sendTransaction,
//       signTypedDataV4,
//       disconnect,
//       checkIfInstalled,
//     }),
//     [
//       address,
//       chainId,
//       isConnected,
//       connect,
//       sendTransaction,
//       signTypedDataV4,
//       disconnect,
//       checkIfInstalled,
//     ],
//   );

//   return (
//     <MetaMaskContext.Provider value={contextValue}>
//       {children}
//     </MetaMaskContext.Provider>
//   );
// }
