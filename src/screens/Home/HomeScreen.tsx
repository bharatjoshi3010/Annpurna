import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Colors, Spacing, Typography } from '../../styles/theme';
import WalletCard from '../../components/WalletCard';
import MealSlotCard from '../../components/MealSlotCard';
import AppButton from '../../components/AppButton';
import { useAuth } from '../../context/AuthContext';
import KYCWarning from '../../components/KYCWarning';

const HomeScreen = ({ navigation }: any) => {
    const { user } = useAuth();
    const [mealStatuses, setMealStatuses] = useState<any[]>([]);
    const [refreshing, setRefreshing] = useState(false);
    
    const fetchMealStatuses = async () => {
        if (!user?._id) return;
        try {
            const baseUrl = Platform.OS === 'android' ? 'http://10.0.2.2:5000' : 'http://localhost:5000';
            const response = await fetch(`${baseUrl}/api/meals/status/${user._id}`);
            const data = await response.json();
            if (response.ok) {
                setMealStatuses(data);
            }
        } catch (error) {
            console.error('Error fetching meal statuses:', error);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchMealStatuses();
        }, [user?._id])
    );

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchMealStatuses();
        setRefreshing(false);
    };

    // Fallback to "Guest" or a field based on role. Student has 'name', Restaurant has 'ownerName'.
    const displayName = user?.name || user?.ownerName || 'Guest';

    const renderMealSlot = (type: string, time: string) => {
        const mealStatus = mealStatuses.find(s => s.mealType === type);
        const status = mealStatus?.status || 'Select';
        const restaurantName = mealStatus?.restaurantName || (status !== 'Select' && status !== 'Not Consumed' && status !== 'Consumed' ? status : 'Not selected');
        
        return (
            <MealSlotCard
                type={type}
                time={time}
                status={status === 'Consumed' ? 'taken' : (status === 'Not Consumed' ? 'missed' : (status === 'Select' ? 'available' : 'booked'))}
                restaurant={restaurantName}
                onPress={() => {
                    if (status === 'Select') {
                        navigation.navigate('Restaurants', { mealType: type });
                    } else if (status === 'Consumed' || status === 'Not Consumed') {
                        // Maybe show history or details?
                    } else {
                        // Already booked, show menu or change
                        navigation.navigate('Menu', { 
                            mealType: type, 
                            restaurantId: mealStatus?.restaurantId,
                            restaurantName: mealStatus?.restaurantName || status
                        });
                    }
                }}
                statusText={status} // Pass the status text to be displayed
            />
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView 
                showsVerticalScrollIndicator={false} 
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />
                }
            >
                <KYCWarning />
                <View style={styles.header}>
                    <View>
                        <Text style={styles.welcomeText}>Hello, {displayName}!</Text>
                        <Text style={Typography.body}>Time for your next meal?</Text>
                    </View>
                    <TouchableOpacity
                        style={styles.profileBadge}
                        onPress={() => navigation.navigate('Profile')}
                    >
                        <Text style={styles.profileIcon}>👤</Text>
                    </TouchableOpacity>
                </View>

                <WalletCard
                    balance={user?.walletBalance || 0}
                    onRecharge={() => navigation.navigate('AddMoney')}
                />

                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={Typography.h2}>Today's Meals</Text>
                    </View>

                    {renderMealSlot('Breakfast', '08:00 AM - 10:30 AM')}
                    {renderMealSlot('Lunch', '12:30 PM - 03:30 PM')}
                    {renderMealSlot('Dinner', '07:30 PM - 10:30 PM')}
                </View>

                <View style={styles.quickActions}>
                    <View style={styles.actionRow}>
                        <TouchableOpacity
                            style={styles.actionButton}
                            onPress={() => navigation.navigate('Restaurants')}
                        >
                            <View style={[styles.actionIconBg, { backgroundColor: '#E3F2FD' }]}>
                                <Text style={styles.actionIcon}>🏪</Text>
                            </View>
                            <Text style={styles.actionLabel}>Change Restaurant</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.actionButton}>
                            <View style={[styles.actionIconBg, { backgroundColor: '#FFF3E0' }]}>
                                <Text style={styles.actionIcon}>🚫</Text>
                            </View>
                            <Text style={styles.actionLabel}>Cancel Meal</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.actionButton}
                            onPress={() => navigation.navigate('Restaurants', { purpose: 'viewMenu' })}
                        >
                            <View style={[styles.actionIconBg, { backgroundColor: '#F3E5F5' }]}>
                                <Text style={styles.actionIcon}>📜</Text>
                            </View>
                            <Text style={styles.actionLabel}>View Menu</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={styles.subscriptionInfo}>
                    <Text style={styles.subLabel}>Current Plan</Text>
                    <View style={styles.subCard}>
                        <Text style={styles.subTitle}>{user?.selectedPlan || 'No Active Plan'}</Text>
                        <Text style={styles.subExpiry}>{user?.selectedPlan ? 'Monthly Subscription active' : 'Choose a plan to get started'}</Text>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    scrollContent: {
        padding: Spacing.md,
        paddingBottom: Spacing.xl,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.lg,
        marginTop: Spacing.sm,
    },
    welcomeText: {
        fontSize: 24,
        fontWeight: '800',
        color: Colors.text,
    },
    profileBadge: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: Colors.white,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: Colors.border,
    },
    profileIcon: {
        fontSize: 20,
    },
    section: {
        marginTop: Spacing.lg,
    },
    sectionHeader: {
        marginBottom: Spacing.sm,
    },
    quickActions: {
        marginTop: Spacing.xl,
    },
    actionRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    actionButton: {
        width: '30%',
        alignItems: 'center',
    },
    actionIconBg: {
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    actionIcon: {
        fontSize: 24,
    },
    actionLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: Colors.text,
        textAlign: 'center',
    },
    subscriptionInfo: {
        marginTop: Spacing.xl,
    },
    subLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.textLight,
        marginBottom: 8,
    },
    subCard: {
        padding: Spacing.md,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: Colors.secondary,
        backgroundColor: '#FFFCFA',
    },
    subTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: Colors.primary,
    },
    subExpiry: {
        fontSize: 12,
        color: Colors.textLight,
        marginTop: 4,
    },
});

export default HomeScreen;
