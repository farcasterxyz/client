import { lazyWithPreload, PreloadableComponent } from './helpers';
type ComposerComponent =
  typeof import('~/components/composer/Composer').Composer;

export const LoginQRCode = lazyWithPreload(() =>
  import('~/components/login/LoginQRCode').then((res) => ({
    default: res.LoginQRCode,
  })),
);

export const Composer: PreloadableComponent<ComposerComponent> =
  lazyWithPreload(() =>
    import('~/components/composer/Composer').then((res) => ({
      default: res.Composer,
    })),
  );

// Frames v1 deprecated: FarcasterFrameAttachment removed

export const PayUserDialog = lazyWithPreload(() =>
  import('~/components/payUser/PayUserDialog').then((res) => ({
    default: res.PayUserDialog,
  })),
);
