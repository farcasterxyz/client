import '~/snap-theme-scope.css';

import { useQuery } from '@tanstack/react-query';
import {
  useFarcasterApiClient,
  useInvalidateSnapBlocklist,
} from 'farcaster-client-hooks';
import { Code2, Database, Info, MessageSquare, X } from 'lucide-react';
import {
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { DefaultButton } from '~/components/forms/buttons/DefaultButton';
import { Textarea } from '~/components/forms/Textarea';
import { Logo } from '~/components/Logo';
import { DefaultModalContainer } from '~/components/modals/DefaultModalContainer';
import { Modal } from '~/components/modals/Modal';
import {
  buildNestedKvEntries,
  ConversationTranscript,
  JsonTree,
  type JsonValue,
  SourceCodeBlock,
} from '~/components/Snap/SnapDetailsViews';
import { useIsAdmin } from '~/hooks/data/useIsAdmin';
import { trackError } from '~/utils/errorUtils';
import { toast } from '~/utils/toast';

type SnapAdminInspectorProps = {
  snapUrl: string;
  disabled?: boolean;
};

type Tab = 'kv' | 'conversation' | 'source';

const isSourceInspectionEnabled = true;

const tabs: Array<{
  id: Tab;
  label: string;
  icon: ReactNode;
  disabled?: boolean;
}> = [
  {
    id: 'kv',
    label: 'Data',
    icon: <Database size={14} />,
  },
  {
    id: 'conversation',
    label: 'Chat',
    icon: <MessageSquare size={14} />,
  },
  {
    id: 'source',
    label: 'Source',
    icon: <Code2 size={14} />,
    disabled: !isSourceInspectionEnabled,
  },
];

function getSnapBuildId(snapUrl: string): string | null {
  try {
    const url = new URL(snapUrl);
    if (
      url.hostname !== 'farcaster.xyz' &&
      !url.hostname.endsWith('.farcaster.xyz')
    ) {
      return null;
    }

    const [first, second] = url.pathname.split('/').filter(Boolean);
    const buildId = first === 'd' ? second : first;

    return buildId && /^[\w-]+$/.test(buildId) ? buildId : null;
  } catch {
    return null;
  }
}

function getNormalizedSnapUrl(snapUrl: string): string | null {
  try {
    const parsed = new URL(snapUrl);
    parsed.search = '';
    parsed.hash = '';
    return `${parsed.origin}${parsed.pathname}`;
  } catch {
    return null;
  }
}

function LoadingBlock({ label }: { label: string }) {
  return <div className="text-sm text-muted">{label}</div>;
}

function ErrorBlock({ label }: { label: string }) {
  return <div className="text-sm text-danger">{label}</div>;
}

function ConversationDetails({
  messages,
}: {
  messages: Array<{ index: number; user: string; agent: string }>;
}) {
  if (messages.length === 0) {
    return <div className="text-sm text-muted">No messages yet</div>;
  }

  return <ConversationTranscript messages={messages} />;
}

function KvDetails({ value }: { value: Record<string, JsonValue> }) {
  if (Object.keys(value).length === 0) {
    return <div className="text-sm text-muted">No data stored yet</div>;
  }

  return (
    <div className="font-mono overflow-x-auto text-sm leading-6 text-default">
      <JsonTree value={value} defaultOpen />
    </div>
  );
}

function formatConversationMessages(
  messages: Array<{ index: number; user: string; agent: string }>,
) {
  return messages
    .map((message) => `User:\n${message.user}\n\nAgent:\n${message.agent}`)
    .join('\n\n---\n\n');
}

function BlockSnapUrlModal({
  snapUrl,
  normalizedSnapUrl,
  onCancel,
}: {
  snapUrl: string;
  normalizedSnapUrl: string;
  onCancel: () => void;
}) {
  const { apiClient } = useFarcasterApiClient();
  const invalidateSnapBlocklist = useInvalidateSnapBlocklist();
  const [reason, setReason] = useState('');
  const [isPending, setIsPending] = useState(false);

  const blockSnapUrl = useCallback(async () => {
    const trimmedReason = reason.trim();
    if (!trimmedReason || isPending) {
      return;
    }

    setIsPending(true);
    try {
      await apiClient.adminBlockSnapUrl({
        snapUrl,
        reason: trimmedReason,
      });
      await invalidateSnapBlocklist();
      toast({ message: 'Snap URL blocked', type: 'success' });
      onCancel();
    } catch (error) {
      trackError(error);
      toast({ message: 'Failed to block Snap URL', type: 'error' });
    } finally {
      setIsPending(false);
    }
  }, [
    apiClient,
    invalidateSnapBlocklist,
    isPending,
    onCancel,
    reason,
    snapUrl,
  ]);

  return (
    <Modal>
      <DefaultModalContainer onClose={onCancel}>
        <div className="flex size-full flex-col items-center justify-center p-4">
          <div
            className="flex w-[min(420px,calc(100vw-32px))] flex-col rounded-lg border p-4 bg-app border-default"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-lg font-semibold text-default">
              Block Snap URL
            </div>
            <div className="font-mono mt-2 break-all rounded-md border px-3 py-2 text-xs text-muted bg-faint border-default">
              {normalizedSnapUrl}
            </div>
            <label className="mt-4 text-sm font-semibold text-default">
              Reason
            </label>
            <Textarea
              className="mt-2"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Enter reason..."
              rows={3}
              hideResizeHandle
            />
            <div className="mt-4 flex justify-end gap-2">
              <DefaultButton variant="secondary" onClick={onCancel}>
                Cancel
              </DefaultButton>
              <DefaultButton
                disabled={reason.trim().length === 0 || isPending}
                onClick={blockSnapUrl}
              >
                Block
              </DefaultButton>
            </div>
          </div>
        </div>
      </DefaultModalContainer>
    </Modal>
  );
}

export function SnapAdminInspector({
  snapUrl,
  disabled = false,
}: SnapAdminInspectorProps) {
  const isAdmin = useIsAdmin();
  const { apiClient } = useFarcasterApiClient();
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('kv');
  const [copiedValue, setCopiedValue] = useState<
    'snapUrl' | 'buildId' | Tab | null
  >(null);
  const [blockModalOpen, setBlockModalOpen] = useState(false);
  const buildId = useMemo(() => getSnapBuildId(snapUrl), [snapUrl]);
  const normalizedSnapUrl = useMemo(
    () => getNormalizedSnapUrl(snapUrl),
    [snapUrl],
  );

  const sourceQuery = useQuery({
    queryKey: ['snapAdminSource', buildId],
    queryFn: async () => {
      if (!buildId) {
        throw new Error('Missing build id');
      }
      const response = await apiClient.getSnapAgentBuildSource({ buildId });
      return response.data.result.source;
    },
    enabled: isAdmin && isSourceInspectionEnabled && open && !!buildId,
  });

  const conversationQuery = useQuery({
    queryKey: ['snapAdminConversation', buildId],
    queryFn: async () => {
      if (!buildId) {
        throw new Error('Missing build id');
      }
      const response = await apiClient.getSnapAgentBuildConversation({
        buildId,
      });
      return response.data.result.messages;
    },
    enabled: open && !!buildId,
  });

  const kvQuery = useQuery({
    queryKey: ['snapAdminKv', buildId],
    queryFn: async () => {
      if (!buildId) {
        throw new Error('Missing build id');
      }
      const response = await apiClient.getSnapAgentBuildKv({
        buildId,
        limit: 250,
      });
      return {
        entries: response.data.result.entries,
        next: response.data.next,
      };
    },
    enabled: open && !!buildId,
  });

  const nestedKvEntries = useMemo(
    () => buildNestedKvEntries(kvQuery.data?.entries ?? []),
    [kvQuery.data?.entries],
  );

  const copyValue = useCallback(
    async (value: string, valueName: 'snapUrl' | 'buildId' | Tab) => {
      await navigator.clipboard.writeText(value);
      setCopiedValue(valueName);
      window.setTimeout(() => setCopiedValue(null), 1200);
    },
    [],
  );

  useEffect(() => {
    if (!isAdmin && activeTab === 'source') {
      setActiveTab('kv');
    }
  }, [activeTab, isAdmin]);

  const visibleTabs = tabs
    .filter((tab) => tab.id !== 'source' || isAdmin)
    .map((tab) => ({
      ...tab,
      disabled: tab.disabled || !buildId,
    }));

  const activeQuery =
    activeTab === 'source'
      ? sourceQuery
      : activeTab === 'conversation'
        ? conversationQuery
        : activeTab === 'kv'
          ? kvQuery
          : null;

  const activeCopyValue = useMemo(() => {
    if (activeTab === 'source') {
      return sourceQuery.data;
    }
    if (activeTab === 'conversation') {
      return formatConversationMessages(conversationQuery.data ?? []);
    }
    return JSON.stringify(nestedKvEntries, null, 2);
  }, [activeTab, conversationQuery.data, nestedKvEntries, sourceQuery.data]);

  const activeCopyLabel =
    activeTab === 'source'
      ? 'Copy source'
      : activeTab === 'conversation'
        ? 'Copy chat'
        : 'Copy JSON';

  const canCopyActiveTab =
    !activeQuery?.isLoading && !activeQuery?.isError && !!activeCopyValue;

  useEffect(() => {
    if (disabled) {
      setOpen(false);
    }
  }, [disabled]);

  if (!isAdmin || disabled) {
    return null;
  }

  return (
    <>
      <button
        type="button"
        className="hover:bg-action-primary/90 absolute right-0 top-7 z-10 flex size-7 -translate-y-1/2 translate-x-1/2 items-center justify-center rounded-full shadow-sm bg-action-primary text-light"
        title="Open Snap details"
        aria-label="Open Snap details"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen(true);
        }}
      >
        <Info size={14} />
      </button>

      {open ? (
        <Modal>
          <DefaultModalContainer onClose={() => setOpen(false)}>
            <div
              className="snap-theme-scope mx-auto mt-[8vh] flex max-h-[84vh] w-[min(810px,calc(100vw-32px))] flex-col rounded-xl border shadow-xl bg-app border-default"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start gap-4 border-b p-4 border-default">
                {buildId ? (
                  <div className="mt-1 flex size-8 shrink-0 items-center justify-center text-default">
                    <Logo size="sm" fill="#6A3CFF" />
                  </div>
                ) : null}
                <div className="min-w-0 flex-1">
                  <div className="text-base font-semibold text-default">
                    Snap details
                  </div>
                  <button
                    type="button"
                    className="font-mono mt-1 block max-w-full break-all text-left text-xs text-muted hover:text-default"
                    title="Copy snap URL"
                    onClick={() => copyValue(snapUrl, 'snapUrl')}
                  >
                    {snapUrl}
                    {copiedValue === 'snapUrl' ? (
                      <span className="ml-2 font-sans text-[10px] font-semibold uppercase text-default">
                        Copied
                      </span>
                    ) : null}
                  </button>
                  {normalizedSnapUrl ? (
                    <div className="mt-3 flex">
                      <DefaultButton
                        size="sm"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setBlockModalOpen(true);
                        }}
                      >
                        Block Snap URL
                      </DefaultButton>
                    </div>
                  ) : null}
                </div>
                {buildId ? (
                  <div className="flex max-w-[300px] flex-col items-end justify-between self-stretch text-right">
                    <div className="text-[10px] font-semibold uppercase tracking-wide text-muted">
                      Snap Build ID
                    </div>
                    <button
                      type="button"
                      className="font-mono break-all text-right text-xs text-muted hover:text-default"
                      title="Copy snap build ID"
                      onClick={() => copyValue(buildId, 'buildId')}
                    >
                      {buildId}
                      {copiedValue === 'buildId' ? (
                        <span className="ml-2 font-sans text-[10px] font-semibold uppercase text-default">
                          Copied
                        </span>
                      ) : null}
                    </button>
                  </div>
                ) : null}
                <div className="flex shrink-0">
                  <button
                    type="button"
                    className="flex size-8 items-center justify-center rounded-full text-muted hover:bg-overlay-faint hover:text-default"
                    onClick={() => setOpen(false)}
                    aria-label="Close"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>

              {buildId ? (
                <>
                  <div className="flex items-center justify-between gap-3 border-b px-4 py-3 border-default">
                    <div className="flex gap-2">
                      {visibleTabs.map((tab) => (
                        <button
                          key={tab.id}
                          type="button"
                          className={`flex h-9 items-center gap-1.5 rounded-md px-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-40 ${
                            activeTab === tab.id
                              ? 'bg-faint text-default'
                              : 'text-muted hover:bg-overlay-faint hover:text-default'
                          }`}
                          disabled={tab.disabled}
                          title={
                            tab.disabled
                              ? 'Unavailable for this snap'
                              : undefined
                          }
                          onClick={() => setActiveTab(tab.id)}
                        >
                          {tab.icon}
                          {tab.label}
                        </button>
                      ))}
                    </div>
                    <button
                      type="button"
                      className="text-action hover:text-action-hover text-xs font-semibold disabled:text-muted"
                      disabled={!canCopyActiveTab}
                      onClick={() =>
                        copyValue(activeCopyValue ?? '', activeTab)
                      }
                    >
                      {copiedValue === activeTab ? 'Copied' : activeCopyLabel}
                    </button>
                  </div>

                  <div className="min-h-0 flex-1 overflow-auto p-4">
                    {activeQuery?.isLoading ? (
                      <LoadingBlock label="Loading..." />
                    ) : activeQuery?.isError ? (
                      <ErrorBlock label="Could not load these snap details." />
                    ) : activeTab === 'source' ? (
                      <SourceCodeBlock value={sourceQuery.data ?? ''} />
                    ) : activeTab === 'conversation' ? (
                      <ConversationDetails
                        messages={conversationQuery.data ?? []}
                      />
                    ) : (
                      <KvDetails value={nestedKvEntries} />
                    )}
                  </div>
                </>
              ) : null}
            </div>
          </DefaultModalContainer>
        </Modal>
      ) : null}
      {blockModalOpen && normalizedSnapUrl ? (
        <BlockSnapUrlModal
          snapUrl={snapUrl}
          normalizedSnapUrl={normalizedSnapUrl}
          onCancel={() => setBlockModalOpen(false)}
        />
      ) : null}
    </>
  );
}
