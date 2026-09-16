import { MentionData } from '@draft-js-plugins/mention';
import { EntryComponentProps } from '@draft-js-plugins/mention/lib/MentionSuggestions/Entry/Entry';
import { MentionSuggestionsProps } from '@draft-js-plugins/mention/lib/MentionSuggestions/MentionSuggestions';
import {
  DraftHandleValue,
  EditorState,
  genKey,
  Modifier,
  SelectionState,
} from 'draft-js';
import React, { FC } from 'react';

const DefaultEntry: FC<EntryComponentProps> = ({
  mention,
  isFocused,
  searchValue: _searchValue,
  selectMention: _selectMention,
  theme: _theme,
  ...parentProps
}) => {
  return (
    <div
      {...parentProps}
      className="px-4 py-2 hover:bg-overlay-faint"
      aria-selected={isFocused}
    >
      {mention.name}
    </div>
  );
};

const getMentionCharacterPattern = (trigger: string) => {
  if (trigger === '@') {
    return '[a-zA-Z0-9-.]';
  }
  if (trigger === '/') {
    return '[a-zA-Z0-9-]';
  }
  if (trigger === '$') {
    return '[a-zA-Z0-9]';
  }
  return '[^\\s]';
};

const getActiveMentionSearch = ({
  editorState,
  mentionTriggers,
}: {
  editorState: EditorState;
  mentionTriggers: string[];
}):
  | {
      begin: number;
      activeTrigger: string;
      matchingString: string;
      searchKey: string;
    }
  | undefined => {
  const selection = editorState.getSelection();

  if (!selection.isCollapsed() || !selection.getHasFocus()) {
    return undefined;
  }

  const anchorKey = selection.getAnchorKey();
  const anchorOffset = selection.getAnchorOffset();
  const blockText = editorState
    .getCurrentContent()
    .getBlockForKey(anchorKey)
    .getText()
    .slice(0, anchorOffset);

  for (const trigger of mentionTriggers) {
    const escapedTrigger = trigger.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(
      `(^|\\s)(${escapedTrigger})(${getMentionCharacterPattern(trigger)}*)$`,
    );
    const match = blockText.match(regex);

    if (match) {
      const begin = blockText.length - match[2].length - match[3].length;

      return {
        begin,
        activeTrigger: trigger,
        matchingString: match[3],
        searchKey: `${anchorKey}:${begin}:${trigger}`,
      };
    }
  }

  return undefined;
};

const getCurrentSelectionPosition = () => {
  const selection = window.getSelection();

  if (!selection || selection.rangeCount === 0) {
    return undefined;
  }

  const range = selection.getRangeAt(0).cloneRange();
  const rect = range.getBoundingClientRect();
  const fallbackRect = range.getClientRects()[0];
  const selectionRect =
    rect.width === 0 && rect.height === 0 && fallbackRect ? fallbackRect : rect;

  if (selectionRect.width === 0 && selectionRect.height === 0) {
    return undefined;
  }

  return {
    left: selectionRect.left,
    top: selectionRect.bottom,
  };
};

const getSearchText = (
  editorState: EditorState,
  selection: SelectionState,
  triggers: string[],
) => {
  const anchorKey = selection.getAnchorKey();
  const anchorOffset = selection.getAnchorOffset();
  const blockText = editorState
    .getCurrentContent()
    .getBlockForKey(anchorKey)
    .getText()
    .slice(0, anchorOffset);
  const triggerPattern = triggers
    .map((trigger) => trigger.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    .join('|');
  const triggerRegex = new RegExp(`(\\s|^)(${triggerPattern})`, 'g');
  let triggerStartIndex = 0;
  let valueStartIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = triggerRegex.exec(blockText)) !== null) {
    const whitespaceLength = match[1].length;
    const triggerLength = match[2].length;
    triggerStartIndex = match.index + whitespaceLength;
    valueStartIndex = triggerStartIndex + triggerLength;
  }

  return {
    begin: triggerStartIndex,
    end: blockText.length,
    matchingString: blockText.slice(valueStartIndex),
  };
};

const getEntityTypeByTrigger = (trigger: string) =>
  trigger === '@' ? 'mention' : `${trigger}mention`;

const addMention = ({
  editorState,
  entityMutability,
  mention,
  mentionPrefix,
  mentionTrigger,
}: {
  editorState: EditorState;
  entityMutability: MentionSuggestionsProps['entityMutability'];
  mention: MentionData;
  mentionPrefix: MentionSuggestionsProps['mentionPrefix'];
  mentionTrigger: string;
}) => {
  const contentStateWithEntity = editorState
    .getCurrentContent()
    .createEntity(getEntityTypeByTrigger(mentionTrigger), entityMutability, {
      mention,
    });
  const entityKey = contentStateWithEntity.getLastCreatedEntityKey();
  const currentSelectionState = editorState.getSelection();
  const { begin, end } = getSearchText(editorState, currentSelectionState, [
    mentionTrigger,
  ]);
  const mentionTextSelection = currentSelectionState.merge({
    anchorOffset: begin,
    focusOffset: end,
  }) as SelectionState;
  const prefix =
    typeof mentionPrefix === 'string'
      ? mentionPrefix
      : mentionPrefix(mentionTrigger);
  let mentionReplacedContent = Modifier.replaceText(
    editorState.getCurrentContent(),
    mentionTextSelection,
    `${prefix}${mention.name}`,
    editorState.getCurrentInlineStyle(),
    entityKey,
  );
  const blockKey = mentionTextSelection.getAnchorKey();
  const blockSize = editorState
    .getCurrentContent()
    .getBlockForKey(blockKey)
    .getLength();

  if (blockSize === end) {
    mentionReplacedContent = Modifier.insertText(
      mentionReplacedContent,
      mentionReplacedContent.getSelectionAfter(),
      ' ',
    );
  }

  const nextEditorState = EditorState.push(
    editorState,
    mentionReplacedContent,
    'insert-fragment',
  );

  return EditorState.forceSelection(
    nextEditorState,
    mentionReplacedContent.getSelectionAfter(),
  );
};

const useLatest = <T,>(value: T) => {
  const ref = React.useRef(value);

  React.useEffect(() => {
    ref.current = value;
  }, [value]);

  return ref;
};

const ComposerMentionSuggestions: FC<MentionSuggestionsProps> = ({
  ariaProps,
  callbacks,
  entityMutability,
  entryComponent: Entry = DefaultEntry,
  mentionPrefix,
  mentionTriggers,
  onAddMention,
  onOpenChange,
  onSearchChange,
  open,
  suggestions,
  store,
  theme,
}) => {
  const keyRef = React.useRef(genKey());
  const activeSearchKeyRef = React.useRef<string | undefined>(undefined);
  const activeTriggerRef = React.useRef<string | undefined>(undefined);
  const escapedSearchKeyRef = React.useRef<string | undefined>(undefined);
  const lastSearchValueRef = React.useRef<string | undefined>(undefined);
  const [focusedOptionIndex, setFocusedOptionIndex] = React.useState(0);
  const [position, setPosition] = React.useState<
    { left: number; top: number } | undefined
  >(undefined);

  const openDropdown = React.useCallback(
    (activeSearchKey: string) => {
      const descendant = `mention-option-${keyRef.current}-${focusedOptionIndex}`;
      ariaProps.ariaActiveDescendantID = descendant;
      ariaProps.ariaOwneeID = `mentions-list-${keyRef.current}`;
      ariaProps.ariaHasPopup = 'true';
      ariaProps.ariaExpanded = true;
      activeSearchKeyRef.current = activeSearchKey;
      store.setIsOpened(true);
      onOpenChange(true);
    },
    [ariaProps, focusedOptionIndex, onOpenChange, store],
  );

  const closeDropdown = React.useCallback(() => {
    callbacks.handleReturn = undefined;
    callbacks.keyBindingFn = undefined;
    ariaProps.ariaHasPopup = 'false';
    ariaProps.ariaExpanded = false;
    ariaProps.ariaActiveDescendantID = undefined;
    ariaProps.ariaOwneeID = undefined;
    activeSearchKeyRef.current = undefined;
    activeTriggerRef.current = undefined;
    store.setIsOpened(false);
    onOpenChange(false);
  }, [ariaProps, callbacks, onOpenChange, store]);

  const onMentionFocus = React.useCallback(
    (index: number) => {
      ariaProps.ariaActiveDescendantID = `mention-option-${keyRef.current}-${index}`;
      setFocusedOptionIndex(index);
    },
    [ariaProps],
  );

  const onMentionSelect = React.useCallback(
    (mention: MentionData | null) => {
      const activeTrigger = activeTriggerRef.current;

      if (!mention || !activeTrigger) {
        return;
      }

      onAddMention?.(mention);
      closeDropdown();
      const currentEditorState = store.getEditorState?.();

      if (!currentEditorState) {
        return;
      }

      const nextEditorState = addMention({
        editorState: currentEditorState,
        entityMutability,
        mention,
        mentionPrefix,
        mentionTrigger: activeTrigger,
      });
      store.setEditorState?.(nextEditorState);
    },
    [closeDropdown, entityMutability, mentionPrefix, onAddMention, store],
  );

  const commitSelection = React.useCallback((): DraftHandleValue => {
    const mention = suggestions[focusedOptionIndex];

    if (!store.getIsOpened() || !mention) {
      return 'not-handled';
    }

    onMentionSelect(mention);

    return 'handled';
  }, [focusedOptionIndex, onMentionSelect, store, suggestions]);

  const onEditorStateChange = React.useCallback(
    (editorState: EditorState) => {
      const activeSearch = getActiveMentionSearch({
        editorState,
        mentionTriggers,
      });

      if (!activeSearch) {
        escapedSearchKeyRef.current = undefined;
        closeDropdown();
        return editorState;
      }

      const { activeTrigger, matchingString, searchKey } = activeSearch;

      if (
        activeTriggerRef.current !== activeTrigger ||
        lastSearchValueRef.current !== matchingString ||
        activeSearchKeyRef.current !== searchKey
      ) {
        activeTriggerRef.current = activeTrigger;
        lastSearchValueRef.current = matchingString;
        onSearchChange({
          trigger: activeTrigger,
          value: matchingString,
        });
        setFocusedOptionIndex(0);
      }

      if (escapedSearchKeyRef.current !== searchKey) {
        escapedSearchKeyRef.current = undefined;
        setPosition(getCurrentSelectionPosition());
        openDropdown(searchKey);
      }

      return editorState;
    },
    [closeDropdown, mentionTriggers, onSearchChange, openDropdown],
  );

  const onEditorStateChangeRef = useLatest(onEditorStateChange);

  React.useEffect(() => {
    const onChange = (editorState: EditorState) =>
      onEditorStateChangeRef.current(editorState);
    callbacks.onChange = onChange;

    return () => {
      if (callbacks.onChange === onChange) {
        callbacks.onChange = undefined;
      }
    };
  }, [callbacks, onEditorStateChangeRef]);

  React.useEffect(() => {
    if (focusedOptionIndex < suggestions.length) {
      return;
    }

    setFocusedOptionIndex(Math.max(suggestions.length - 1, 0));
  }, [focusedOptionIndex, suggestions.length]);

  const commitSelectionRef = useLatest(commitSelection);
  const onMentionFocusRef = useLatest(onMentionFocus);
  const stopPropagation = React.useCallback((event: React.SyntheticEvent) => {
    event.stopPropagation();
  }, []);

  React.useEffect(() => {
    if (!open) {
      return;
    }

    const handleReturn = () => commitSelectionRef.current();
    const keyBindingFn = (keyboardEvent: React.KeyboardEvent) => {
      if (keyboardEvent.key === 'ArrowDown') {
        keyboardEvent.preventDefault();
        const nextIndex =
          focusedOptionIndex + 1 >= suggestions.length
            ? 0
            : focusedOptionIndex + 1;
        onMentionFocusRef.current(nextIndex);
      }

      if (keyboardEvent.key === 'ArrowUp') {
        keyboardEvent.preventDefault();
        const nextIndex =
          focusedOptionIndex - 1 < 0
            ? suggestions.length - 1
            : focusedOptionIndex - 1;
        onMentionFocusRef.current(nextIndex);
      }

      if (keyboardEvent.key === 'Escape') {
        keyboardEvent.preventDefault();
        escapedSearchKeyRef.current = activeSearchKeyRef.current;
        closeDropdown();
      }

      if (keyboardEvent.key === 'Tab') {
        keyboardEvent.preventDefault();
        commitSelectionRef.current();
      }

      return undefined;
    };

    callbacks.handleReturn = handleReturn;
    callbacks.keyBindingFn = keyBindingFn;

    return () => {
      if (callbacks.handleReturn === handleReturn) {
        callbacks.handleReturn = undefined;
      }
      if (callbacks.keyBindingFn === keyBindingFn) {
        callbacks.keyBindingFn = undefined;
      }
    };
  }, [
    callbacks,
    closeDropdown,
    commitSelectionRef,
    focusedOptionIndex,
    onMentionFocusRef,
    open,
    suggestions.length,
  ]);

  React.useLayoutEffect(() => {
    if (!open || suggestions.length === 0) {
      return;
    }

    setPosition(
      (currentPosition) => currentPosition ?? getCurrentSelectionPosition(),
    );
  }, [open, suggestions.length]);

  if (!open || suggestions.length === 0 || !position) {
    return null;
  }

  return (
    <div
      className={theme.mentionSuggestionsPopup}
      id={`mentions-list-${keyRef.current}`}
      role="listbox"
      onClick={stopPropagation}
      onPointerDown={stopPropagation}
      style={{
        left: position.left,
        position: 'fixed',
        top: position.top,
      }}
    >
      {suggestions.map((mention, index) => {
        const isFocused = focusedOptionIndex === index;
        const mentionKey =
          mention.id !== null && mention.id !== undefined
            ? mention.id
            : mention.name;

        return (
          <div
            key={mentionKey}
            onPointerDown={(event: React.PointerEvent) => {
              event.preventDefault();
              event.stopPropagation();
              onMentionSelect(mention);
            }}
          >
            <Entry
              className={
                isFocused
                  ? theme.mentionSuggestionsEntryFocused
                  : theme.mentionSuggestionsEntry
              }
              onMouseDown={(event) => {
                event.preventDefault();
                event.stopPropagation();
              }}
              onMouseUp={(event) => {
                event.stopPropagation();
              }}
              onMouseEnter={() => onMentionFocus(index)}
              role="option"
              id={`mention-option-${keyRef.current}-${index}`}
              aria-selected={isFocused ? 'true' : undefined}
              theme={theme}
              mention={mention}
              isFocused={isFocused}
              searchValue={lastSearchValueRef.current}
              selectMention={onMentionSelect}
            />
          </div>
        );
      })}
    </div>
  );
};

export { ComposerMentionSuggestions };
