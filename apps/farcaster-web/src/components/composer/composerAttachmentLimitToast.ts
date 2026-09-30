import { toast } from '~/utils/toast';

const COMPOSER_ATTACHMENT_LIMIT_TOAST_ID = 'composer-attachment-cap';

const getComposerAttachmentLimitMessage = (castEmbedLimit: number) =>
  `You can only have up to ${castEmbedLimit} attachments or embeds`;

const showComposerAttachmentLimitToast = ({
  castEmbedLimit,
}: {
  castEmbedLimit: number;
}) => {
  toast({
    message: getComposerAttachmentLimitMessage(castEmbedLimit),
    type: 'error',
    toastId: COMPOSER_ATTACHMENT_LIMIT_TOAST_ID,
  });
};

export { getComposerAttachmentLimitMessage, showComposerAttachmentLimitToast };
