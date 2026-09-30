import { getLocales } from 'expo-localization';
import { Text2, useTheme } from 'farcaster-expo';
import React from 'react';

const [{ languageTag = 'en-US' } = { languageTag: 'en-US' }] = getLocales();

function cleanDateTimeString({
  dateTimeString,
}: {
  dateTimeString: string;
}): string {
  // Remove seconds from time (e.g., "3:45:12 PM" → "3:45 PM")
  let formattedDateTime = dateTimeString.replace(
    /(\d{1,2}:\d{2}):\d{2}(\s?[AP]M)/i,
    '$1$2',
  );

  // Replace "/2025" at end with "/25"
  formattedDateTime = formattedDateTime.replace(/\/2025$/, '/25');
  formattedDateTime = formattedDateTime.replace(/\/2026$/, '/26');
  formattedDateTime = formattedDateTime.replace(/\/2027$/, '/27');

  return formattedDateTime;
}

export function ArticleDate({
  articlePublishedAt,
}: {
  articlePublishedAt: number;
}) {
  const t = useTheme();

  const niceArticleTimestamp = React.useMemo(() => {
    const d = new Date(articlePublishedAt);
    if (Number.isNaN(d.getTime())) {
      return '';
    }

    // compare by local calendar day
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thatDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const diffDays = Math.round(
      (today.getTime() - thatDay.getTime()) / 86400000,
    );

    if (diffDays === 0) {
      return 'Today';
    }
    if (diffDays === 1) {
      return 'Yesterday';
    }

    const raw = d.toLocaleDateString(languageTag);

    return cleanDateTimeString({ dateTimeString: raw });
  }, [articlePublishedAt]);

  const color = t.dark ? 'secondary' : 'quaternary';

  return (
    <Text2 weight="medium" size="sm" color={color}>
      {niceArticleTimestamp}
    </Text2>
  );
}
