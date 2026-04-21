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

const PLANS = [
    {
        id: 'basic',
        name: 'Basic',
        fullName: 'The Essential Plan',
        price: '2,999',
        priceNum: 2999,
        tagline: 'Traditional mess with a digital safety net.',
        icon: '📅',
        color: '#000000',
        features: ['5-Day Absence Rule', 'Weekend Pause Facility', 'Fixed Partner Restaurant']
    },
    {
        id: 'silver',
        name: 'Silver',
        fullName: 'The Explorer Plan',
        price: '3,499',
        priceNum: 3499,
        tagline: 'Focuses on variety and location flexibility.',
        icon: '📍',
        color: '#000000',
        features: ['Any Network Restaurant', '30-Min Cutoff Switching', 'Taste Matching Suggestions']
    },
    {
        id: 'gold',
        name: 'Gold',
        fullName: 'The Freedom Plan',
        price: '3,999',
        priceNum: 3999,
        tagline: 'Complete control over your dining experience.',
        icon: '📦',
        color: '#000000',
        isPopular: true,
        features: ['Full Cancellation Refund', 'Unlimited Switching', 'Takeaway Packing Toggle', 'Priority QR Access']
    }
];

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
        const isLocked = mealStatus?.isLocked || false;

        return (
            <MealSlotCard
                type={type}
                time={time}
                status={status === 'Consumed' ? 'taken' : (status === 'Not Consumed' ? 'missed' : (status === 'Select' ? 'available' : 'booked'))}
                restaurant={restaurantName}
                locked={isLocked}
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

    const isActive = user?.subscriptionStatus === 'active';

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
                        <Text style={Typography.body}>{isActive ? 'Your healthy meal is waiting!' : 'Join a plan to start your journey'}</Text>
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

                {!isActive && (
                    <View style={styles.onboardingBanner}>
                        <View style={styles.bannerInfo}>
                            <Text style={styles.bannerTitle}>UNLIMITED MEALS AWAIT</Text>
                            <Text style={styles.bannerDesc}>Unlock your personal meal dashboard by selecting a subscription tier below.</Text>
                        </View>
                    </View>
                )}

                {isActive && (
                    <>
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
                    </>
                )}

                <View style={styles.subscriptionSection}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>SUBSCRIPTION TIERS</Text>
                        <Text style={styles.sectionSubtitle}>Select your access level</Text>
                    </View>

                    {user?.selectedPlan ? (
                        <TouchableOpacity 
                            style={styles.activePlanCard}
                            onPress={() => navigation.navigate('PlanDetail', { plan: PLANS.find(p => p.name === user.selectedPlan) || PLANS[0] })}
                        >
                            <View style={styles.statusBar}>
                                <Text style={styles.statusText}>ACTIVE SESSION</Text>
                                <View style={styles.pulseDot} />
                            </View>
                            <Text style={styles.activePlanName}>{user.selectedPlan.toUpperCase()}</Text>
                            <Text style={styles.activePlanDesc}>Tap to view benefits & manage features</Text>
                        </TouchableOpacity>
                    ) : (
                        <View style={styles.tiersContainer}>
                            {PLANS.map(plan => (
                                <TouchableOpacity 
                                    key={plan.id} 
                                    style={styles.tierCard}
                                    onPress={() => navigation.navigate('PlanDetail', { plan })}
                                >
                                    {plan.isPopular && (
                                        <View style={styles.popularBadge}>
                                            <Text style={styles.popularText}>MOST POPULAR</Text>
                                        </View>
                                    )}
                                    <View style={styles.tierHeader}>
                                        <View style={styles.tierInfo}>
                                            <Text style={styles.tierName}>{plan.name.toUpperCase()}</Text>
                                            <Text style={styles.tierTagline}>{plan.tagline}</Text>
                                        </View>
                                        <Text style={styles.tierIcon}>{plan.icon}</Text>
                                    </View>
                                    <View style={styles.tierFooter}>
                                        <Text style={styles.tierPrice}>₹{plan.price}<Text style={styles.perMonth}>/mo</Text></Text>
                                        <View style={styles.viewBtn}>
                                            <Text style={styles.viewBtnText}>VIEW DETAILS</Text>
                                        </View>
                                    </View>
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}
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
    subscriptionSection: {
        marginTop: Spacing.xl,
        paddingBottom: 40,
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: '900',
        color: '#000',
        letterSpacing: 2,
    },
    sectionSubtitle: {
        fontSize: 16,
        fontWeight: '400',
        color: '#666',
        marginTop: 2,
        marginBottom: 20,
    },
    activePlanCard: {
        backgroundColor: '#000',
        borderRadius: 2,
        padding: 24,
        minHeight: 140,
        justifyContent: 'center',
    },
    statusBar: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    statusText: {
        color: '#FFF',
        fontSize: 10,
        fontWeight: '900',
        letterSpacing: 1.5,
        marginRight: 8,
    },
    pulseDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#4CAF50',
    },
    activePlanName: {
        color: '#FFF',
        fontSize: 32,
        fontWeight: '900',
        letterSpacing: -1,
    },
    activePlanDesc: {
        color: '#AAA',
        fontSize: 12,
        marginTop: 8,
    },
    tiersContainer: {
        gap: 20,
    },
    tierCard: {
        backgroundColor: '#FFF',
        borderWidth: 2,
        borderColor: '#000',
        borderRadius: 2,
        padding: 20,
        position: 'relative',
    },
    popularBadge: {
        position: 'absolute',
        top: -12,
        right: 20,
        backgroundColor: '#000',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 2,
    },
    popularText: {
        color: '#FFF',
        fontSize: 10,
        fontWeight: '900',
        letterSpacing: 1,
    },
    tierHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 24,
    },
    tierInfo: {
        flex: 1,
        paddingRight: 10,
    },
    tierName: {
        fontSize: 24,
        fontWeight: '900',
        color: '#000',
        letterSpacing: -0.5,
    },
    tierTagline: {
        fontSize: 13,
        color: '#666',
        marginTop: 4,
        lineHeight: 18,
    },
    tierIcon: {
        fontSize: 32,
    },
    tierFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: '#EEE',
        paddingTop: 16,
    },
    tierPrice: {
        fontSize: 20,
        fontWeight: '900',
        color: '#000',
    },
    perMonth: {
        fontSize: 12,
        fontWeight: '400',
        color: '#666',
    },
    viewBtn: {
        backgroundColor: '#000',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 2,
    },
    viewBtnText: {
        color: '#FFF',
        fontSize: 11,
        fontWeight: '900',
        letterSpacing: 1,
    },
    onboardingBanner: {
        backgroundColor: '#F5F5F5',
        borderRadius: 2,
        padding: 24,
        marginTop: 24,
        borderLeftWidth: 4,
        borderLeftColor: '#000',
    },
    bannerInfo: {
        flex: 1,
    },
    bannerTitle: {
        fontSize: 12,
        fontWeight: '900',
        color: '#000',
        letterSpacing: 1,
        marginBottom: 8,
    },
    bannerDesc: {
        fontSize: 14,
        color: '#666',
        lineHeight: 20,
    },
});

export default HomeScreen;
