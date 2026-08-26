// Patch global.base64FromArrayBuffer
import 'react-native-quick-base64';

// Patch `global.Buffer` and `global.crypto`
import { install } from 'react-native-quick-crypto';
install();

// More standard implementation of URL
import 'react-native-url-polyfill/auto';
