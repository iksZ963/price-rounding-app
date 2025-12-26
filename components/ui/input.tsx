import React from 'react';
import { TextInput, StyleSheet, TextInputProps } from 'react-native';

export interface InputProps extends TextInputProps {
  className?: string;
}

export const Input = React.forwardRef<TextInput, InputProps>(
  ({ style, ...props }, ref) => {
    return (
      <TextInput
        ref={ref}
        style={[styles.input, style]}
        placeholderTextColor="#d4d4d8"
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
    backgroundColor: '#ffffff',
    borderColor: '#e4e4e7',
    color: '#18181b',
    paddingVertical: 0,
    textAlignVertical: 'center',
  },
});
