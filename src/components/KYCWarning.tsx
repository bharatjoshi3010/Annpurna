import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useThemeColors, Spacing, BorderRadius } from '../styles/theme';
import { useAuth } from '../context/AuthContext';

const KYCWarning = () => {
    const { user } = useAuth();
    const C = useThemeColors();

    if (!user || user.kycStatus === 'approved') return null;

    const isRejected = user.kycStatus === 'rejected';

    // Dark-friendly warning/error tints
    const bgColor      = isRejected ? C.errorLight   : C.warningLight;
    const borderColor  = isRejected ? C.error        : C.warning;
    const textColor    = isRejected ? C.error        : C.warning;

    return (
        <View style={[styles.container, { backgroundColor: bgColor, borderColor }]}>
            <View style={styles.iconContainer}>
                <Text style={styles.emojiIcon}>{isRejected ? '⚠️' : '⏳'}</Text>
            </View>
            <View style={styles.textContainer}>
                <Text style={[styles.title, { color: textColor }]}>
                    KYC Status: {user.kycStatus.toUpperCase()}
                </Text>
                <Text style={[styles.message, { color: textColor }]}>
                    {user.kycStatus === 'pending'
                        ? 'Your account verification is in progress. Some features may be limited.'
                        : 'Your verification was rejected. Please contact support or update your details.'}
                </Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        padding: Spacing.md,
        borderRadius: BorderRadius.lg,
        borderWidth: 1,
        marginBottom: Spacing.md,
    },
    iconContainer: { marginRight: Spacing.sm, justifyContent: 'center' },
    emojiIcon: { fontSize: 22 },
    textContainer: { flex: 1 },
    title: { fontSize: 14, fontWeight: '700', marginBottom: 2 },
    message: { fontSize: 12, lineHeight: 16, opacity: 0.9 },
});

export default KYCWarning;
