import cn from 'classnames';
import { Heart, MessageCircleIcon } from 'lucide-react';
import { FC, memo, useState } from 'react';

import { Image } from '~/components/images/Image';
import { LinkToProfile } from '~/components/links/LinkToProfile';

type AppsCardProps = {
  icon: string;
  title: string;
  description: string;
  tags: string[];
  author: string;
  authorFid?: number;
  authorPfpUrl?: string;
  likeCount: number;
  commentCount: number;
  featured?: boolean;
  isLiked?: boolean;
};

// Web-specific props with different naming convention
type WebAppsCardProps = AppsCardProps & {
  onCardClick?: () => void;
  onAddClick?: () => void;
  onLikeClick?: () => void;
  onCommentClick?: () => void;
  onAuthorClick?: () => void;
};

const HeartIcon: React.FC<{ active: boolean }> = ({ active }) => {
  return (
    <Heart className={active ? 'fill-red-500 text-red-500' : ''} size={16} />
  );
};

const AppsCard: FC<WebAppsCardProps> = memo(
  ({
    icon,
    title,
    description,
    tags,
    author,
    authorFid,
    authorPfpUrl,
    likeCount,
    commentCount,
    featured = false,
    onCardClick,
    onLikeClick,
    onCommentClick,
    onAuthorClick,
    isLiked = false,
  }) => {
    const [imageError, setImageError] = useState(false);

    return (
      <div
        className={cn(
          'flex w-full flex-row items-start gap-4 border-b p-4 border-faint hover:bg-overlay-faint',
          {
            'cursor-pointer': onCardClick,
          },
        )}
        onClick={onCardClick}
      >
        {/* Icon with Add button — fixed size + shrink-0 so long text never pulls layout */}
        <div className="relative h-[60px] w-[60px] shrink-0">
          <div className="flex size-[60px] items-center justify-center overflow-hidden rounded-[12px] bg-[#7C65C1]">
            {!imageError ? (
              <Image
                src={icon}
                alt={title}
                width={60}
                height={60}
                className="size-full object-cover"
                onError={() => setImageError(true)}
              />
            ) : (
              <span className="text-2xl font-bold text-white">
                {title.charAt(0)}
              </span>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          {/* Title and Featured badge */}
          <div className="flex min-w-0 items-center gap-2">
            <h3 className="min-w-0 flex-1 break-words text-[17px] font-semibold text-default">
              {title
                .split(' ')
                .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' ')}
            </h3>
            {featured && (
              <span className="shrink-0 rounded-full bg-[#7C65C11A] px-2 py-0.5 text-xs font-medium text-[#7C65C1]">
                Featured
              </span>
            )}
          </div>

          {/* Description */}
          <p className="line-clamp-2 break-words text-[15px] text-muted">
            {description}
          </p>

          {/* Tags and Author */}
          <div className="flex flex-wrap items-center gap-2">
            {tags.map((tag: string, index: number) => (
              <span
                key={index}
                className="rounded-full px-2 py-1 text-sm font-normal bg-faint text-tertiary"
              >
                {tag
                  .split(' ')
                  .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                  .join(' ')}
              </span>
            ))}
            <span className="text-sm text-tertiary">by</span>
            <div className="flex items-center gap-1.5 text-sm font-normal text-tertiary">
              {authorPfpUrl && (
                <div className="size-4 flex-shrink-0 overflow-hidden rounded-full bg-faint">
                  <Image
                    src={authorPfpUrl}
                    alt={author}
                    width={16}
                    height={16}
                    className="size-full object-cover"
                  />
                </div>
              )}
              {authorFid ? (
                <LinkToProfile
                  user={{ fid: authorFid, username: author }}
                  title={author}
                  className="hover:underline"
                  onClick={(e) => {
                    e.stopPropagation();
                    onAuthorClick?.();
                  }}
                >
                  {author}
                </LinkToProfile>
              ) : (
                <span>{author}</span>
              )}
            </div>
          </div>
        </div>

        {/* Right section - Like and Comment counts */}
        <div className="flex flex-shrink-0 flex-col items-center gap-3 text-tertiary">
          {/* Like button with border */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onLikeClick?.();
            }}
            className="flex flex-row items-center gap-2 hover:opacity-80"
          >
            <HeartIcon active={isLiked} />
            <span className="text-xs text-default">{likeCount}</span>
          </button>

          {/* Comment count */}
          <div
            className="flex cursor-pointer items-center gap-1 text-tertiary hover:opacity-70"
            onClick={(e) => {
              e.stopPropagation();
              onCommentClick?.();
            }}
          >
            <MessageCircleIcon size={16} />
            <span className="text-[15px]">{commentCount}</span>
          </div>
        </div>
      </div>
    );
  },
);

AppsCard.displayName = 'AppsCard';

export { AppsCard };
