import React from 'react';
import { Modal, View, StyleSheet, Dimensions, TouchableWithoutFeedback } from 'react-native';
import CreateCustomActivity from './CreateCustomActivity';

/**
 * Modal component to display the CreateCustomActivity form
 * @param {Object} props - Component props
 * @param {boolean} props.visible - Whether the modal is visible
 * @param {Function} props.onClose - Function to call when modal is closed
 * @param {Function} props.onSave - Function to call when activity is saved
 */
export default function ActivityModal({ visible, onClose, onSave }) {
  // Handle touch outside modal to dismiss
  const handleOutsidePress = () => {
    onClose();
  };
  
  // Prevent touch events on the modal content from closing the modal
  const handleModalPress = (e) => {
    e.stopPropagation();
  };
  
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={handleOutsidePress}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback onPress={handleModalPress}>
            <View style={styles.modalContent}>
              <CreateCustomActivity onClose={onClose} onSave={onSave} />
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: height * 0.9,
    width: width,
    overflow: 'hidden',
  },
}); 