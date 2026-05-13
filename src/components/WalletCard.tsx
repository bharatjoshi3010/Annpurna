import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useThemeColors, Spacing, BorderRadius, Shadows } from '../styles/theme';

interface WalletCardProps {
    balance: number;
    onRecharge: () => void;
    compact?: boolean;
}

const WalletCard: React.FC<WalletCardProps> = ({ balance, onRecharge, compact = false }) => {
    const C = useThemeColors();

    if (compact) {
        return (
            <TouchableOpacity
                style={[
                    styles.compactContainer,
                    { backgroundColor: C.surface, borderColor: C.primaryLight },
                ]}
                onPress={onRecharge}
                activeOpacity={0.85}
            >
                <View style={styles.compactLeft}>
                    <Text style={[styles.compactLabel, { color: C.textLight }]}>Wallet Balance</Text>
                    <Text style={[styles.compactBalance, { color: C.text }]}>₹{balance.toFixed(2)}</Text>
                </View>
                <View style={[styles.rechargeBtn, { backgroundColor: C.primaryLight }]}>
                    <Text style={[styles.rechargeText, { color: C.primary }]}>+ Add</Text>
                </View>
            </TouchableOpacity>
        );
    }

    return (
        <View style={styles.container}>
            {/* Decorative circles */}
            <View style={styles.circle1} />
            <View style={styles.circle2} />

            <View style={styles.topRow}>
                <View>
                    <Text style={styles.label}>Meal Wallet</Text>
                    <Text style={styles.balance}>₹{balance.toFixed(2)}</Text>
                </View>
                <View style={styles.walletIcon}>
                    <Text style={styles.walletEmoji}>👛</Text>
                </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.footer}>
                <View>
                    <Text style={styles.footerLabel}>STATUS</Text>
                    <Text style={styles.footerValue}>Active Plan</Text>
                </View>
                <TouchableOpacity style={styles.addBtn} onPress={onRecharge} activeOpacity={0.85}>
                    <Text style={[styles.addBtnText, { color: C.primary }]}>＋ Add Money</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#F97316', // always orange gradient card
        borderRadius: BorderRadius.xl,
        padding: Spacing.lg,
        marginVertical: Spacing.md,
        overflow: 'hidden',
        shadowColor: '#F97316',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.35,
        shadowRadius: 14,
        elevation: 8,
    },
    circle1: {
        position: 'absolute', width: 160, height: 160, borderRadius: 80,
        backgroundColor: 'rgba(255,255,255,0.08)', top: -60, right: -30,
    },
    circle2: {
        position: 'absolute', width: 100, height: 100, borderRadius: 50,
        backgroundColor: 'rgba(255,255,255,0.06)', bottom: -20, left: 20,
    },
    topRow: {
        flexDirection: 'row', justifyContent: 'space-between',
        alignItems: 'flex-start', marginBottom: Spacing.md,
    },
    walletIcon: {
        width: 48, height: 48, borderRadius: 24,
        backgroundColor: 'rgba(255,255,255,0.18)',
        justifyContent: 'center', alignItems: 'center',
    },
    walletEmoji: { fontSize: 22 },
    label: { color: 'rgba(255,255,255,0.75)', fontSize: 12, fontWeight: '600', letterSpacing: 0.5, marginBottom: 6 },
    balance: { color: '#FFFFFF', fontSize: 38, fontWeight: '800', letterSpacing: -1 },
    divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.2)', marginBottom: Spacing.md },
    footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    footerLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 10, fontWeight: '700', letterSpacing: 1 },
    footerValue: { color: '#FFFFFF', fontSize: 13, fontWeight: '700', marginTop: 2 },
    addBtn: {
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 18, paddingVertical: 10, borderRadius: BorderRadius.round,
    },
    addBtnText: { fontSize: 13, fontWeight: '800' },

    // Compact
    compactContainer: {
        borderRadius: BorderRadius.md, padding: Spacing.md,
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        borderWidth: 1.5,
        shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
    },
    compactLeft: {},
    compactLabel: { fontSize: 11, fontWeight: '600', marginBottom: 2 },
    compactBalance: { fontSize: 22, fontWeight: '800' },
    rechargeBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: BorderRadius.round },
    rechargeText: { fontSize: 13, fontWeight: '800' },
});

export default WalletCard;
