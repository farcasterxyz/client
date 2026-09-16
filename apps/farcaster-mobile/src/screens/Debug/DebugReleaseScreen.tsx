import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Updates from 'expo-updates';
import { useUpdates } from 'expo-updates';
import { ButtonV2, Text2 } from 'farcaster-expo';
import React, { useMemo, useState } from 'react';
import { Alert, ScrollView, View } from 'react-native';

import { buildScreen } from '~/components/Screen';
import { isDev } from '~/constants/Env';
import { useTheme } from '~/contexts/ThemeProvider';
import { CommonStackParamList } from '~/types';

type DebugReleaseScreenProps = NativeStackScreenProps<
  CommonStackParamList,
  'DebugRelease'
>;

const DebugReleaseScreen = buildScreen<DebugReleaseScreenProps>(
  { name: 'DebugRelease' },
  () => {
    const t = useTheme();
    const [isCheckingUpdate, setIsCheckingUpdate] = useState(false);
    const [isFetchingUpdate, setIsFetchingUpdate] = useState(false);
    const {
      lastCheckForUpdateTimeSinceRestart,
      checkError,
      downloadError,
      isUpdatePending,
    } = useUpdates();

    const environmentData = useMemo(
      () => [
        { label: 'Environment', value: isDev ? 'Development' : 'Production' },
        { label: '__DEV__', value: __DEV__ ? 'Yes' : 'No' },
        { label: 'Sanity Check', value: '🌂' },
      ],
      [],
    );

    const updateData = useMemo(
      () => [
        { label: 'Update Channel', value: Updates.channel || 'None' },
        { label: 'Update Available', value: isUpdatePending ? 'Yes' : 'No' },
        {
          label: 'Last Check',
          value: lastCheckForUpdateTimeSinceRestart
            ? new Date(lastCheckForUpdateTimeSinceRestart).toLocaleTimeString()
            : 'Never',
        },
        {
          label: 'Update Error',
          value: checkError?.message || downloadError?.message || 'None',
        },
      ],
      [
        isUpdatePending,
        lastCheckForUpdateTimeSinceRestart,
        checkError,
        downloadError,
      ],
    );

    const buildData = useMemo(
      () => [
        {
          label: 'Update ID',
          value: Updates.updateId || 'None',
          truncate: true,
        },
        {
          label: 'Created At',
          value: Updates.createdAt
            ? new Date(Updates.createdAt).toLocaleString()
            : 'Unknown',
        },
        {
          label: 'Using Embedded Assets',
          value: Updates.isUsingEmbeddedAssets ? 'Yes' : 'No',
        },
        {
          label: 'Emergency Launch',
          value: Updates.isEmergencyLaunch ? 'Yes' : 'No',
        },
      ],
      [],
    );

    const handleCheckForUpdates = async () => {
      setIsCheckingUpdate(true);
      try {
        const res = await Updates.checkForUpdateAsync();
        if (res.isAvailable) {
          Alert.alert(
            'Update Available',
            `Version: ${res.manifest.id || 'Unknown'}`,
          );
        } else {
          Alert.alert('Up to Date', 'No updates available');
        }
      } catch (error) {
        Alert.alert('Error', `Failed to check for updates: ${error}`);
      } finally {
        setIsCheckingUpdate(false);
      }
    };

    const handleFetchUpdate = async () => {
      setIsFetchingUpdate(true);
      try {
        const res = await Updates.fetchUpdateAsync();
        Alert.alert(
          'Update Downloaded',
          `Version: ${res.manifest?.id || 'Unknown'}\n\nRestart the app to apply the update.`,
        );
      } catch (error) {
        Alert.alert('Error', `Failed to fetch update: ${error}`);
      } finally {
        setIsFetchingUpdate(false);
      }
    };

    const handleReload = async () => {
      try {
        await Updates.reloadAsync();
      } catch (error) {
        Alert.alert('Error', `Failed to reload: ${error}`);
      }
    };

    return (
      <View style={{ flex: 1, backgroundColor: t.colors.bgDefault }}>
        <ScrollView
          contentContainerStyle={{
            padding: 12,
          }}
        >
          <DetailSection title="Environment" data={environmentData} />
          <DetailSection title="Updates" data={updateData} />
          <DetailSection title="Build Info" data={buildData} />
        </ScrollView>

        <View
          style={[
            {
              backgroundColor: t.colors.bgDefault,
              padding: 12,
              borderTopWidth: 1,
              borderTopColor: t.colors.borderDefault,
              gap: 8,
            },
          ]}
        >
          <ButtonV2
            title="Check for Updates"
            onPress={handleCheckForUpdates}
            width="full"
            loading={isCheckingUpdate}
          />
          <ButtonV2
            title="Fetch Update"
            onPress={handleFetchUpdate}
            width="full"
            variant="secondary"
            loading={isFetchingUpdate}
          />
          <ButtonV2
            title="Reload App"
            onPress={handleReload}
            width="full"
            variant="secondary"
          />
        </View>
      </View>
    );
  },
);

interface DetailRowData {
  label: string;
  value: string;
  truncate?: boolean;
}

interface DetailSectionProps {
  title: string;
  data: DetailRowData[];
}

const DetailSection: React.FC<DetailSectionProps> = ({ title, data }) => {
  const t = useTheme();

  return (
    <View style={{ marginBottom: 24 }}>
      <Text2
        size="lg"
        weight="semibold"
        style={{ marginBottom: 12, paddingHorizontal: 4 }}
      >
        {title}
      </Text2>
      <View
        style={[
          {
            backgroundColor: t.colors.bgNewLightGray,
            borderRadius: 16,
            overflow: 'hidden',
          },
        ]}
      >
        {data.map((item, index) => (
          <DetailRow
            key={item.label}
            {...item}
            isLast={index === data.length - 1}
          />
        ))}
      </View>
    </View>
  );
};

interface DetailRowProps extends DetailRowData {
  isLast: boolean;
}

const DetailRow: React.FC<DetailRowProps> = ({
  label,
  value,
  truncate,
  isLast,
}) => {
  const t = useTheme();

  return (
    <View
      style={[
        {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingHorizontal: 16,
          paddingVertical: 14,
        },
        !isLast && {
          borderBottomWidth: 1,
          borderBottomColor: t.colors.bgDefault,
        },
      ]}
    >
      <Text2 color="secondary" size="base" weight="medium">
        {label}
      </Text2>
      <Text2
        color="primary"
        size="base"
        weight="regular"
        style={[
          { flex: 1, textAlign: 'right', marginLeft: 16 },
          { fontFamily: truncate ? 'Menlo' : undefined },
        ]}
        numberOfLines={truncate ? 1 : undefined}
      >
        {value}
      </Text2>
    </View>
  );
};

export { DebugReleaseScreen };
