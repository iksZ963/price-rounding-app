import React, { useState } from 'react';
import {
  View,
  Modal,
  Pressable,
  StyleSheet,
} from 'react-native';

interface TooltipProps {
  children: React.ReactNode;
  content: React.ReactNode;
}

export const TooltipProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  return <>{children}</>;
};

export const Tooltip: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  return <>{children}</>;
};

export const TooltipTrigger: React.FC<{
  children: React.ReactNode;
  asChild?: boolean;
}> = ({ children }) => {
  return <>{children}</>;
};

export const TooltipContent: React.FC<{
  children: React.ReactNode;
  side?: string;
  className?: string;
}> = ({ children }) => {
  return null;
};

export const TooltipWrapper: React.FC<TooltipProps> = ({
  children,
  content,
}) => {
  const [visible, setVisible] = useState(false);

  return (
    <>
      <Pressable onPress={() => setVisible(true)}>{children}</Pressable>
      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={() => setVisible(false)}
      >
        <Pressable
          style={styles.overlay}
          onPress={() => setVisible(false)}
        >
          <View style={styles.tooltipContent}>
            {content}
          </View>
        </Pressable>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tooltipContent: {
    maxWidth: 260,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    backgroundColor: '#18181b',
    borderColor: '#3f3f46',
  },
});
