import React from 'react';
import { TextInput, StyleSheet, TextInputProps, useColorScheme } from 'react-native';

export interface InputProps extends TextInputProps {
  className?: string;
}

export const Input = React.forwardRef<TextInput, InputProps>(
  ({ style, ...props }, ref) => {
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';

    return (
      <TextInput
        ref={ref}
        style={[
          styles.input,
          isDark ? styles.inputDark : styles.inputLight,
          style,
        ]}
        placeholderTextColor={isDark ? '#52525b' : '#d4d4d8'}
        {...props}
      />
    );
  }
);

Input.displayName = 'Input';

const styles = StyleSheet.create({
  input: {
    height: 40,
    borderWidth: 2,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
    fontWeight: '600',
  },
  inputLight: {
    backgroundColor: '#ffffff',
    borderColor: '#e4e4e7',
    color: '#18181b',
  },
  inputDark: {
    backgroundColor: '#27272a',
    borderColor: '#3f3f46',
    color: '#ffffff',
  },
});
