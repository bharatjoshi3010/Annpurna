import React from 'react';
import {
    TouchableOpacity, Text, StyleSheet,
    ViewStyle, TextStyle, ActivityIndicator, View,
} from 'react-native';
import { Colors, BorderRadius, Shadows } from '../styles/theme';

interface AppButtonProps {
    title: string;
    onPress: () => void;
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
    size?: 'sm' | 'md' | 'lg';
    style?: ViewStyle;
    textStyle?: TextStyle;
    loading?: boolean;
    disabled?: boolean;
    icon?: string;
}

const AppButton: React.FC<AppButtonProps> = ({
    title, onPress, variant = 'primary', size = 'md',
    style, textStyle, loading = false, disabled = false, icon,
}) => {
    const btnStyle = [
        styles.base,
        styles[`size_${size}`],
        styles[`variant_${variant}`],
        (disabled || loading) && styles.disabled,
        style,
    ];
    const txtStyle = [
        styles.text,
        styles[`text_${size}`],
        styles[`textVariant_${variant}`],
        textStyle,
    ];

    return (
        <TouchableOpacity style={btnStyle} onPress={onPress} disabled={disabled || loading} activeOpacity={0.82}>
            {loading ? (
                <ActivityIndicator color={variant === 'outline' || variant === 'ghost' ? Colors.primary : Colors.white} />
            ) : (
                <View style={styles.row}>
                    {icon ? <Text style={styles.icon}>{icon}</Text> : null}
                    <Text style={txtStyle}>{title}</Text>
                </View>
            )}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    base: {
        borderRadius: BorderRadius.md,
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
    },
    row: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    icon: { fontSize: 16 },

    // Sizes
    size_sm: { height: 40, paddingHorizontal: 16 },
    size_md: { height: 52, paddingHorizontal: 20, marginVertical: 4 },
    size_lg: { height: 60, paddingHorizontal: 24, marginVertical: 6 },

    // Variants
    variant_primary: {
        backgroundColor: Colors.primary,
        ...Shadows.primary,
    },
    variant_secondary: {
        backgroundColor: Colors.primaryLight,
    },
    variant_outline: {
        backgroundColor: 'transparent',
        borderWidth: 1.5,
        borderColor: Colors.primary,
    },
    variant_ghost: {
        backgroundColor: 'transparent',
    },
    variant_danger: {
        backgroundColor: Colors.error,
        ...Shadows.md,
    },

    // Text colours
    text: { fontWeight: '700', letterSpacing: 0.1 },
    text_sm:  { fontSize: 13 },
    text_md:  { fontSize: 15 },
    text_lg:  { fontSize: 17 },
    textVariant_primary:   { color: Colors.white },
    textVariant_secondary: { color: Colors.primary },
    textVariant_outline:   { color: Colors.primary },
    textVariant_ghost:     { color: Colors.primary },
    textVariant_danger:    { color: Colors.white },

    disabled: { opacity: 0.5 },
} as any);

export default AppButton;
