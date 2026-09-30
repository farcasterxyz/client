import { ChangeEvent, FC, memo, useCallback } from 'react';

import { SelectInput } from '~/components/forms/SelectInput';
import { DefaultModalContainer } from '~/components/modals/DefaultModalContainer';
import { DefaultModalHeader } from '~/components/modals/DefaultModalHeader';
import { Modal } from '~/components/modals/Modal';
import {
  UserSavedTheme,
  useUserSavedTheme,
} from '~/hooks/theme/useUserSavedTheme';

type ThemeSettingsProps = {
  onClose: () => void;
};

const THEME_CHOICES: Array<{ name: string; value: UserSavedTheme }> = [
  { name: 'System', value: 'system' },
  { name: 'Light', value: 'light' },
  { name: 'Dark', value: 'dark' },
];

const ALLOWED_THEMES = new Set<UserSavedTheme>(
  THEME_CHOICES.map((choice) => choice.value),
);

const ThemeSettings: FC<ThemeSettingsProps> = memo(({ onClose }) => {
  const { userSavedTheme, setUserSavedTheme } = useUserSavedTheme();

  const handleChange = useCallback(
    (event: ChangeEvent<HTMLSelectElement>) => {
      const next = event.target.value as UserSavedTheme;
      if (ALLOWED_THEMES.has(next)) {
        setUserSavedTheme(next);
      }
    },
    [setUserSavedTheme],
  );

  return (
    <Modal>
      <DefaultModalContainer onClose={onClose}>
        <div className="flex size-full items-center justify-center p-4">
          <div
            className="flex w-full max-w-md flex-col rounded-lg bg-app border-default"
            onClick={(e) => {
              e.stopPropagation();
            }}
          >
            <DefaultModalHeader title="Theme" onClose={onClose} />

            <div className="flex flex-col gap-2 p-6">
              <SelectInput
                aria-label="Theme"
                choices={THEME_CHOICES}
                value={userSavedTheme}
                onChange={handleChange}
              />
              <p className="text-sm text-faint">
                System matches your device&apos;s theme setting.
              </p>
            </div>
          </div>
        </div>
      </DefaultModalContainer>
    </Modal>
  );
});

ThemeSettings.displayName = 'ThemeSettings';

export { ThemeSettings };
