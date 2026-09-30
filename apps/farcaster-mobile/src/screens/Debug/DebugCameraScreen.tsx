import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { CameraType, CameraView, useCameraPermissions } from 'expo-camera';
import { AtomsButton } from 'farcaster-expo';
import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

import { buildScreen } from '~/components/Screen';
import { Text } from '~/components/Text';
import { useTheme } from '~/contexts/ThemeProvider';
import { useIsAdmin } from '~/hooks/data/useIsAdmin';
import { CommonStackParamList } from '~/types';

type DebugCameraScreenProps = NativeStackScreenProps<
  CommonStackParamList,
  'DebugCamera'
>;

const DebugCameraScreen = buildScreen<DebugCameraScreenProps>(
  { name: 'DebugCamera' },
  () => {
    const isAdmin = useIsAdmin();

    if (!isAdmin) {
      return <></>;
    }

    return <DebugCameraScreenContent />;
  },
);

const DebugCameraScreenContent: React.FC = () => {
  const t = useTheme();

  const [facing, setFacing] = React.useState<CameraType>('back');
  const [permission, requestPermission] = useCameraPermissions();

  if (!permission) {
    return <View />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={[t.textCenter]}>
          We need your permission to show the camera
        </Text>
        <AtomsButton onPress={requestPermission} size="l" hierarchy="primary">
          Grant permission
        </AtomsButton>
      </View>
    );
  }

  function toggleCameraFacing() {
    setFacing((current) => (current === 'back' ? 'front' : 'back'));
  }

  return (
    <View style={styles.container}>
      <CameraView style={styles.camera} facing={facing}>
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.button} onPress={toggleCameraFacing}>
            <Text style={styles.text}>Flip Camera</Text>
          </TouchableOpacity>
        </View>
      </CameraView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
  },
  camera: {
    flex: 1,
  },
  buttonContainer: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: 'transparent',
    margin: 64,
  },
  button: {
    flex: 1,
    alignSelf: 'flex-end',
    alignItems: 'center',
  },
  text: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
});

DebugCameraScreen.displayName = 'DebugWalletConnectScreen';

export { DebugCameraScreen };
