import React from 'react';
import { View, Text, StyleSheet, FlatList, SafeAreaView, TouchableOpacity } from 'react-native';
import { Colors, Spacing, Typography, BorderRadius } from '../../styles/theme';
import Header from '../../components/Header';
import WalletCard from '../../components/WalletCard';

const TRANSACTIONS = [
    { id: '1', title: 'Meal at The Green Plate', amount: -150, date: 'Mar 12, 12:45 PM', type: 'debit' },
    { id: '2', title: 'Wallet Recharge', amount: 1000, date: 'Mar 10, 09:20 AM', type: 'credit' },
    { id: '3', title: 'Meal at Sunrise Café', amount: -120, date: 'Mar 09, 08:30 AM', type: 'debit' },
    { id: '4', title: 'Meal at Spicy Junction', amount: -110, date: 'Mar 08, 07:45 PM', type: 'debit' },
    { id: '5', title: 'Weekly Plan Cashback', amount: 50, date: 'Mar 07, 10:00 AM', type: 'credit' },
];

const WalletScreen = ({ navigation }: any) => {
    return (
        <SafeAreaView style={styles.container}>
            <Header title="My Wallet" />

            <View style={styles.content}>
                <WalletCard
                    balance={1250.50}
                    onRecharge={() => { }}
                />

                <View style={styles.transactionSection}>
                    <View style={styles.sectionHeader}>
                        <Text style={Typography.h3}>Recent Transactions</Text>
                        <TouchableOpacity>
                            <Text style={styles.viewAll}>See All</Text>
                        </TouchableOpacity>
                    </View>

                    <FlatList
                        data={TRANSACTIONS}
                        keyExtractor={(item) => item.id}
                        showsVerticalScrollIndicator={false}
                        renderItem={({ item }) => (
                            <View style={styles.transactionItem}>
                                <View style={styles.iconContainer}>
                                    <Text style={styles.txnEmoji}>
                                        {item.type === 'credit' ? '💰' : '🍽️'}
                                    </Text>
                                </View>
                                <View style={styles.txnInfo}>
                                    <Text style={styles.txnTitle}>{item.title}</Text>
                                    <Text style={styles.txnDate}>{item.date}</Text>
                                </View>
                                <Text style={[
                                    styles.txnAmount,
                                    { color: item.type === 'credit' ? Colors.success : Colors.text }
                                ]}>
                                    {item.type === 'credit' ? '+' : '-'}{Math.abs(item.amount)}
                                </Text>
                            </View>
                        )}
                        ItemSeparatorComponent={() => <View style={styles.separator} />}
                    />
                </View>

                <TouchableOpacity style={styles.rechargeButton}>
                    <Text style={styles.rechargeButtonText}>Add Money to Wallet</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    content: {
        flex: 1,
        padding: Spacing.md,
    },
    transactionSection: {
        flex: 1,
        marginTop: Spacing.lg,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.md,
    },
    viewAll: {
        color: Colors.primary,
        fontSize: 14,
        fontWeight: '600',
    },
    transactionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#F5F5F5',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: Spacing.md,
    },
    txnEmoji: {
        fontSize: 20,
    },
    txnInfo: {
        flex: 1,
    },
    txnTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.text,
    },
    txnDate: {
        fontSize: 12,
        color: Colors.textLight,
        marginTop: 2,
    },
    txnAmount: {
        fontSize: 16,
        fontWeight: '700',
    },
    separator: {
        height: 1,
        backgroundColor: Colors.border,
        opacity: 0.5,
    },
    rechargeButton: {
        backgroundColor: Colors.primary,
        height: 54,
        borderRadius: BorderRadius.md,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: Spacing.md,
        marginBottom: Spacing.sm,
    },
    rechargeButtonText: {
        color: Colors.white,
        fontSize: 16,
        fontWeight: '700',
    },
});

export default WalletScreen;
