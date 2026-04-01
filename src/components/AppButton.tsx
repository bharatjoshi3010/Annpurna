import React from 'react';
import {
    TouchableOpacity,
    Text,
    StyleSheet,
    ViewStyle,
    TextStyle,
    ActivityIndicator,
} from 'react-native';
import { Colors, Spacing, BorderRadius } from '../styles/theme';

interface AppButtonProps {
    title: string;
    onPress: () => void;
    variant?: 'primary' | 'secondary' | 'outline';
    style?: ViewStyle;
    textStyle?: TextStyle;
    loading?: boolean;
    disabled?: boolean;
}

const AppButton: React.FC<AppButtonProps> = ({
    title,
    onPress,
    variant = 'primary',
    style,
    textStyle,
    loading = false,
    disabled = false,
}) => {
    const getButtonStyle = () => {
        switch (variant) {
            case 'secondary':
                return styles.secondaryButton;
            case 'outline':
                return styles.outlineButton;
            default:
                return styles.primaryButton;
        }
    };

    const getTextStyle = () => {
        switch (variant) {
            case 'outline':
                return styles.outlineText;
            default:
                return styles.buttonText;
        }
    };

    return (
        <TouchableOpacity
            style={[styles.button, getButtonStyle(), style, (disabled || loading) && styles.disabled]}
            onPress={onPress}
            disabled={disabled || loading}
            activeOpacity={0.8}
        >
            {loading ? (
                <ActivityIndicator color={variant === 'outline' ? Colors.primary : Colors.white} />
            ) : (
                <Text style={[getTextStyle(), textStyle]}>{title}</Text>
            )}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    button: {
        height: 54,
        borderRadius: BorderRadius.md,
        justifyContent: 'center',
        alignItems: 'center',
        marginVertical: Spacing.sm,
        width: '100%',
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 3,
    },
    primaryButton: {
        backgroundColor: Colors.primary,
    },
    secondaryButton: {
        backgroundColor: Colors.secondary,
    },
    outlineButton: {
        backgroundColor: 'transparent',
        borderWidth: 1.5,
        borderColor: Colors.primary,
        shadowOpacity: 0,
        elevation: 0,
    },
    buttonText: {
        color: Colors.white,
        fontSize: 16,
        fontWeight: '600',
    },
    outlineText: {
        color: Colors.primary,
        fontSize: 16,
        fontWeight: '600',
    },
    disabled: {
        opacity: 0.6,
    },
});

export default AppButton;
