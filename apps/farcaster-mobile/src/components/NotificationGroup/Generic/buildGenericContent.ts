import { ApiGenericNotificationGroup } from 'farcaster-client-data';

export type GenericContent = {
  type: string;
  title?: string;
  description: string;
  primaryCta?: { text: string; target: string };
  secondaryCta?: { text: string; target: string };
};

export function buildGenericContent(
  item: ApiGenericNotificationGroup['previewItems'][0],
): GenericContent {
  const content = item.content;
  const mobileOverride = content.mobileOverride;
  const hideCta = mobileOverride?.hideCta === true;

  return {
    type: item.type,
    title: mobileOverride?.title || content.title,
    description: mobileOverride?.description || content.description,
    primaryCta:
      hideCta || !content.cta
        ? undefined
        : {
            text: mobileOverride?.cta?.text || content.cta.text,
            target: mobileOverride?.cta?.target || content.cta.target,
          },
    secondaryCta: content.secondaryCta
      ? {
          text: content.secondaryCta.text,
          target: content.secondaryCta.target,
        }
      : undefined,
  };
}
