import { ApiGetDomainManifestStateQueryParams } from 'farcaster-client-data';
import { useDomainManifestState } from 'farcaster-client-hooks';
import {
  BugPlayIcon,
  FileTextIcon,
  Layers,
  SignatureIcon,
  ViewIcon,
} from 'lucide-react';
import React from 'react';

import { useExternalNavigate } from '~/hooks/navigation/useExternalNavigate';
import { useNavigate } from '~/hooks/navigation/useNavigate';
import { RouteName } from '~/types';

type ToolName = 'manifest' | 'docs' | 'embed' | 'preview' | 'snaps' | 'manage';

type SearchParams =
  | { domain: string | undefined }
  | { url: string | undefined }
  | undefined;

type DeveloperToolButtonProps = {
  toolName: ToolName;
  searchParams?: SearchParams;
};

interface Requirements {
  hasAssociatedManifest: boolean;
}

const toolConfigs: Record<
  ToolName,
  {
    title: string;
    description: string;
    icon: React.ReactNode;
    requirements?: Requirements;
  }
> = {
  manifest: {
    title: 'Manifests',
    description: 'Sign, manage, publish Mini Apps',
    icon: <SignatureIcon />,
  },
  docs: {
    title: 'Mini App Docs',
    description: 'Get started building Mini Apps',
    icon: <FileTextIcon />,
  },
  embed: {
    title: 'Embed Tool',
    description: 'See how your Mini App will look',
    icon: <ViewIcon />,
  },
  preview: {
    title: 'Preview Tool',
    description: 'Preview a URL as a Mini App',
    icon: <BugPlayIcon />,
  },
  snaps: {
    title: 'Emulator',
    description:
      'Interactive snap emulator: load URL, tap buttons, signed POST',
    icon: <Layers />,
  },
  manage: {
    title: 'Manage Tool',
    description: 'Manage your Mini App manifest',
    icon: <ViewIcon />,
    requirements: {
      hasAssociatedManifest: true,
    },
  },
};

export const DeveloperToolButton: React.FC<DeveloperToolButtonProps> =
  React.memo(({ toolName, searchParams }) => {
    const { data } = useDomainManifestState({
      ...(searchParams as ApiGetDomainManifestStateQueryParams),
    });
    const navigate = useNavigate();
    const externalNavigate = useExternalNavigate();
    const config = toolConfigs[toolName];
    const associatedManifestId = data?.associatedHostedManifest?.id;

    const handleClick = () => {
      if (toolName === 'docs') {
        externalNavigate({
          to: 'https://miniapps.farcaster.xyz',
          openInNewTab: true,
        });
        return;
      }

      let route: RouteName | undefined;
      const routeParams = Object.fromEntries(
        Object.entries(searchParams ?? {}).filter(
          ([, value]) => value !== undefined,
        ),
      ) as Record<string, string>;
      switch (toolName) {
        case 'manifest':
          route = 'developersMiniAppManifest';
          break;
        case 'preview':
          route = 'developersMiniAppPreview';
          break;
        case 'snaps':
          route = 'developersSnaps';
          break;
        case 'embed':
          route = 'developersMiniAppEmbed';
          break;
        case 'manage':
          route = 'developersHostedManifests';
          if (associatedManifestId) {
            routeParams.id = associatedManifestId;
          }
          break;
      }
      if (!route) {
        return;
      }
      navigate({
        to: route,
        params: {},
        searchParams:
          Object.keys(routeParams).length > 0 ? routeParams : undefined,
      });
    };

    if (config.requirements?.hasAssociatedManifest && !associatedManifestId) {
      return null;
    }

    return (
      <div
        className="flex w-full cursor-pointer flex-row items-center gap-2 rounded-lg p-[14px] bg-app hover:bg-light-purple active:bg-notification-purple"
        onClick={handleClick}
      >
        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg border bg-[#F0F0FE] text-[#4A88F7]">
          {config.icon}
        </div>
        <div className="flex flex-col">
          <div className="font-semibold">{config.title}</div>
          <div className="text-sm text-muted">{config.description}</div>
        </div>
      </div>
    );
  });

DeveloperToolButton.displayName = 'DeveloperToolButton';
