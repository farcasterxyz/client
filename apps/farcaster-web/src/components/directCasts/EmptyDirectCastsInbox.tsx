import React from 'react';

import { Image } from '~/components/images/Image';

import emptyDirectCastsDark from './emptyDirectCastsDark.png';
import emptyDirectCastsLight from './emptyDirectCastsLight.png';

export function EmptyDirectCastsInbox({
  message = 'No direct casts',
}: {
  message?: string;
}) {
  return (
    <div className="flex flex-col items-center pb-[28px] pt-[20px]">
      <div className="mb-[20px]">
        <Image
          loading="eager"
          src={emptyDirectCastsLight}
          alt="empty direct casts"
          className="w-[178px] dark:hidden"
        />
        <Image
          loading="eager"
          src={emptyDirectCastsDark}
          alt="empty direct casts"
          className="hidden w-[178px] dark:block"
        />
      </div>
      <div>{message}</div>
    </div>
  );
}
