import React from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';

import { Text } from '~/components/Text';

type SpaceEndedModalProps = {
  open: boolean;
  onClose: () => void;
  title?: string;
  body?: string;
  buttonText?: string;
};

const SpaceEndedModal: React.FC<SpaceEndedModalProps> = ({
  open,
  onClose,
  title = 'Space ended',
  body = 'This Space ended automatically because no host spoke for 10 minutes.',
  buttonText = 'Close',
}) => {
  return (
    <Modal
      visible={open}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.body}>{body}</Text>
          <Pressable onPress={onClose} style={styles.button}>
            <Text style={styles.buttonText}>{buttonText}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'flex-end',
    padding: 20,
  },
  card: {
    width: '100%',
    borderRadius: 20,
    backgroundColor: '#101010',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  title: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  body: {
    color: 'rgba(255,255,255,0.82)',
    marginTop: 8,
    fontSize: 14,
    lineHeight: 20,
  },
  button: {
    marginTop: 16,
    borderRadius: 999,
    backgroundColor: '#7c65c1',
    paddingVertical: 12,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
});

export { SpaceEndedModal };
