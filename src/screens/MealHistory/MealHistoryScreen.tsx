import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList, Platform, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Colors, Spacing, Typography, BorderRadius } from '../../styles/theme';
import Header from '../../components/Header';
import { useAuth } from '../../context/AuthContext';

const MealHistoryScreen = () => {
    const { user } = useAuth();
    const [history, setHistory] = useState<any[]>([]);
    const [refreshing, setRefreshing] = useState(false);

    const fetchHistory = async () => {
        if (!user?._id) return;
        try {
            const baseUrl = Platform.OS === 'android' ? 'http://10.0.2.2:5000' : 'http://localhost:5000';
            const response = await fetch(`${baseUrl}/api/meals/student/${user._id}`);
            const data = await response.json();
            if (response.ok) {
                setHistory(data);
            }
        } catch (error) {
            console.error('Error fetching history:', error);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchHistory();
        }, [user?._id])
    );

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchHistory();
        setRefreshing(false);
    };

    const renderHistoryItem = ({ item }: { item: any }) => {
        const date = new Date(item.date).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });

        const getStatusColor = () => {
            switch (item.status) {
                case 'consumed': return Colors.success;
                case 'booked': return Colors.primary;
                case 'cancelled': return Colors.error;
                default: return Colors.textLight;
            }
        };

        return (
            <View style={styles.historyCard}>
                <View style={styles.cardHeader}>
                    <Text style={styles.dateText}>{date}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor() + '20' }]}>
                        <Text style={[styles.statusText, { color: getStatusColor() }]}>
                            {item.status.toUpperCase()}
                        </Text>
                    </View>
                </View>
                <View style={styles.cardContent}>
                    <View>
                        <Text style={styles.restaurantName}>{item.restaurant?.restaurantName || 'Deleted Restaurant'}</Text>
                        <Text style={styles.mealType}>{item.mealType}</Text>
                    </View>
                    <Text style={styles.timeText}>{new Date(item.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <Header title="Meal History" />
            <FlatList
                data={history}
                keyExtractor={(item) => item._id}
                renderItem={renderHistoryItem}
                contentContainerStyle={styles.listContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />
                }
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>No meal history found.</Text>
                    </View>
                }
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    listContent: {
        padding: Spacing.md,
    },
    historyCard: {
        backgroundColor: Colors.white,
        borderRadius: BorderRadius.md,
        padding: Spacing.md,
        marginBottom: Spacing.md,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
        paddingBottom: 8,
        marginBottom: 12,
    },
    dateText: {
        fontSize: 14,
        fontWeight: '700',
        color: Colors.text,
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
    },
    statusText: {
        fontSize: 10,
        fontWeight: '700',
    },
    cardContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    restaurantName: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.text,
    },
    mealType: {
        fontSize: 12,
        color: Colors.textLight,
        marginTop: 2,
    },
    timeText: {
        fontSize: 12,
        color: Colors.textLight,
        fontWeight: '500',
    },
    emptyContainer: {
        marginTop: 100,
        alignItems: 'center',
    },
    emptyText: {
        fontSize: 16,
        color: Colors.textLight,
    },
});

export default MealHistoryScreen;
