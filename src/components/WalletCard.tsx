import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors, Spacing, BorderRadius, Typography } from '../styles/theme';

interface WalletCardProps {
    balance: number;
    onRecharge: () => void;
    compact?: boolean;
}

const WalletCard: React.FC<WalletCardProps> = ({ balance, onRecharge, compact = false }) => {
    if (compact) {
        return (
            <View style={styles.compactContainer}>
                <View>
                    <Text style={styles.compactLabel}>Wallet Balance</Text>
                    <Text style={styles.compactBalance}>₹{balance.toFixed(2)}</Text>
                </View>
                <TouchableOpacity style={styles.rechargeButton} onPress={onRecharge}>
                    <Text style={styles.rechargeText}>Recharge</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Text style={styles.label}>Total Balance</Text>
            <Text style={styles.balance}>₹{balance.toFixed(2)}</Text>
            <View style={styles.divider} />
            <View style={styles.footer}>
                <Text style={styles.footerText}>Monthly Subscription active</Text>
                <TouchableOpacity style={styles.fullRechargeButton} onPress={onRecharge}>
                    <Text style={styles.fullRechargeText}>Add Money</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: Colors.primary,
        borderRadius: BorderRadius.lg,
        padding: Spacing.lg,
        marginVertical: Spacing.md,
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 15,
        elevation: 8,
    },
    label: {
        color: 'rgba(255, 255, 255, 0.8)',
        fontSize: 14,
        fontWeight: '500',
        marginBottom: 4,
    },
    balance: {
        color: Colors.white,
        fontSize: 36,
        fontWeight: '800',
        marginBottom: Spacing.md,
    },
    divider: {
        height: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        marginBottom: Spacing.md,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    footerText: {
        color: Colors.white,
        fontSize: 12,
        flex: 1,
    },
    fullRechargeButton: {
        backgroundColor: Colors.white,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: BorderRadius.sm,
    },
    fullRechargeText: {
        color: Colors.primary,
        fontSize: 14,
        fontWeight: '700',
    },
    compactContainer: {
        backgroundColor: Colors.cardBg,
        borderRadius: BorderRadius.md,
        padding: Spacing.md,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderWidth: 1,
        borderColor: Colors.border,
    },
    compactLabel: {
        fontSize: 12,
        color: Colors.textLight,
        marginBottom: 2,
    },
    compactBalance: {
        fontSize: 20,
        fontWeight: '700',
        color: Colors.text,
    },
    rechargeButton: {
        backgroundColor: Colors.secondary,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: BorderRadius.sm,
    },
    rechargeText: {
        color: Colors.primary,
        fontSize: 12,
        fontWeight: '700',
    },
});

export default WalletCard;
