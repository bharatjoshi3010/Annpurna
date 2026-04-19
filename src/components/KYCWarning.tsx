import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Spacing, BorderRadius } from '../styles/theme';
import { useAuth } from '../context/AuthContext';

const KYCWarning = () => {
    const { user } = useAuth();

    if (!user || user.kycStatus === 'approved') {
        return null;
    }

    const isPending = user.kycStatus === 'pending';
    const isRejected = user.kycStatus === 'rejected';

    return (
        <View style={[
            styles.container, 
            isRejected ? styles.rejectedBg : styles.pendingBg
        ]}>
            <View style={styles.iconContainer}>
                <Text style={styles.emojiIcon}>{isRejected ? "⚠️" : "⏳"}</Text>
            </View>
            <View style={styles.textContainer}>
                <Text style={[
                    styles.title, 
                    isRejected ? styles.rejectedText : styles.pendingText
                ]}>
                    KYC Status: {user.kycStatus.toUpperCase()}
                </Text>
                <Text style={[
                    styles.message, 
                    isRejected ? styles.rejectedText : styles.pendingText
                ]}>
                    {isPending 
                        ? "Your account verification is in progress. Some features may be limited." 
                        : "Your verification was rejected. Please contact support or update your details."}
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
    pendingBg: {
        backgroundColor: '#FEF3C7',
        borderColor: '#FDE68A',
    },
    rejectedBg: {
        backgroundColor: '#FEE2E2',
        borderColor: '#FECACA',
    },
    iconContainer: {
        marginRight: Spacing.sm,
        justifyContent: 'center',
    },
    emojiIcon: {
        fontSize: 22,
    },
    textContainer: {
        flex: 1,
    },
    title: {
        fontSize: 14,
        fontWeight: '700',
        marginBottom: 2,
    },
    message: {
        fontSize: 12,
        lineHeight: 16,
        opacity: 0.9,
    },
    pendingText: {
        color: '#92400E',
    },
    rejectedText: {
        color: '#B91C1C',
    },
});

export default KYCWarning;
