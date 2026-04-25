import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, SafeAreaView, TouchableOpacity, Platform, RefreshControl, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Colors, Spacing, Typography, BorderRadius } from '../../styles/theme';
import Header from '../../components/Header';
import WalletCard from '../../components/WalletCard';
import { useAuth } from '../../context/AuthContext';

const WalletScreen = ({ navigation }: any) => {
    const { user } = useAuth();
    const [transactions, setTransactions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchTransactions = async () => {
        if (!user?._id) return;
        try {
            const baseUrl = Platform.OS === 'android' ? 'http://10.0.2.2:5000' : 'http://localhost:5000';
            const response = await fetch(`${baseUrl}/api/payment/history/${user._id}`);
            const data = await response.json();
            if (response.ok) {
                setTransactions(data);
            }
        } catch (error) {
            console.error('Error fetching transactions:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchTransactions();
        }, [user?._id])
    );

    const onRefresh = () => {
        setRefreshing(true);
        fetchTransactions();
    };

    const formatDate = (dateString: string) => {
        const options: Intl.DateTimeFormatOptions = {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        };
        return new Date(dateString).toLocaleDateString('en-US', options);
    };

    return (
        <SafeAreaView style={styles.container}>
            <Header title="My Wallet" />

            <View style={styles.content}>
                <WalletCard
                    balance={user?.walletBalance || 0}
                    onRecharge={() => navigation.navigate('AddMoney')}
                />

                <View style={styles.transactionSection}>
                    <View style={styles.sectionHeader}>
                        <Text style={Typography.h3}>History</Text>
                        <TouchableOpacity onPress={onRefresh}>
                            <Text style={styles.viewAll}>Refresh</Text>
                        </TouchableOpacity>
                    </View>

                    {loading ? (
                        <ActivityIndicator color={Colors.primary} style={{ marginTop: 20 }} />
                    ) : transactions.length === 0 ? (
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyText}>No transaction history yet.</Text>
                        </View>
                    ) : (
                        <FlatList
                            data={transactions}
                            keyExtractor={(item) => item._id}
                            showsVerticalScrollIndicator={false}
                            refreshControl={
                                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                            }
                            renderItem={({ item }) => (
                                <View style={styles.transactionItem}>
                                    <View style={styles.iconContainer}>
                                        <Text style={styles.txnEmoji}>
                                            {item.type === 'credit' ? '💰' : '🍽️'}
                                        </Text>
                                    </View>
                                    <View style={styles.txnInfo}>
                                        <Text style={styles.txnTitle}>{item.description || (item.type === 'credit' ? 'Wallet Top-up' : 'Meal Payment')}</Text>
                                        <Text style={styles.txnDate}>{formatDate(item.createdAt)}</Text>
                                    </View>
                                    <View style={{ alignItems: 'flex-end' }}>
                                        <Text style={[
                                            styles.txnAmount,
                                            { color: item.type === 'credit' ? Colors.success : Colors.text }
                                        ]}>
                                            {item.type === 'credit' ? '+' : '-'}₹{Math.abs(item.amount)}
                                        </Text>
                                        <Text style={[styles.statusText, { color: item.status === 'success' ? Colors.success : Colors.error }]}>
                                            {item.status}
                                        </Text>
                                    </View>
                                </View>
                            )}
                            ItemSeparatorComponent={() => <View style={styles.separator} />}
                        />
                    )}
                </View>

                <TouchableOpacity
                    style={styles.rechargeButton}
                    onPress={() => navigation.navigate('AddMoney')}
                >
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
    statusText: {
        fontSize: 10,
        fontWeight: '700',
        textTransform: 'uppercase',
        marginTop: 2,
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
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: 40,
    },
    emptyText: {
        color: Colors.textLight,
        fontSize: 14,
        fontStyle: 'italic',
    },
});

export default WalletScreen;
