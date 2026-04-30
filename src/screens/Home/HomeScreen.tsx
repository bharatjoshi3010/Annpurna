import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, RefreshControl, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../../styles/theme';
import WalletCard from '../../components/WalletCard';
import MealSlotCard from '../../components/MealSlotCard';
import AppButton from '../../components/AppButton';
import { useAuth } from '../../context/AuthContext';
import KYCWarning from '../../components/KYCWarning';
import MealStatusBadge from '../../components/MealStatusBadge';
import UserAvatar from '../../components/UserAvatar';
import { API_BASE_URL } from '../../config';

const PLANS = [
    {
        id: 'basic',
        name: 'Basic',
        fullName: 'The Essential Plan',
        price: '2,999',
        priceNum: 2999,
        tagline: 'Better management of offline mess system in online manner.',
        icon: '📅',
        color: '#000000',
        features: [
            'Offline mess management',
            'Timings notifications',
            'Daily menu viewing'
        ]
    },
    {
        id: 'standard',
        name: 'Standard',
        fullName: 'The Explorer Plan',
        price: '3,749',
        priceNum: 3749,
        tagline: 'Basic features plus one-time meal switching.',
        icon: '📍',
        color: '#000000',
        features: [
            'All Basic features',
            'Meal switch (one-time switch per meal)'
        ]
    },
    {
        id: 'premium',
        name: 'Premium',
        fullName: 'The Freedom Plan',
        price: '3,949',
        priceNum: 3949,
        tagline: 'Basic features + switch + cancellation.',
        icon: '📦',
        color: '#000000',
        isPopular: true,
        features: [
            'All Standard features',
            'Cancellation of any meal before cutoff time'
        ]
    }
];

const HomeScreen = ({ navigation }: any) => {
    const { user, setUser } = useAuth();
    const [mealStatuses, setMealStatuses] = useState<any[]>([]);
    const [refreshing, setRefreshing] = useState(false);

    // Cut-off times (per spec): Breakfast 7:30AM, Lunch 12:30PM, Dinner 6:45PM
    const CUTOFF_DISPLAY: Record<string, string> = {
        Breakfast: '7:30 AM',
        Lunch: '12:30 PM',
        Dinner: '6:45 PM',
    };

    const fetchMealStatuses = async () => {
        if (!user?._id) return;
        try {
            const response = await fetch(`${API_BASE_URL}/api/meals/status/${user._id}`);
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

    // ---------- Cancel Meal ----------
    const handleCancelMeal = () => {
        const cancellable = mealStatuses.filter(m => m.canModify && m.bookingId);
        if (cancellable.length === 0) {
            const anyLocked = mealStatuses.some(m => m.isLocked);
            Alert.alert(
                anyLocked ? '🔒 Cut-off Passed' : 'No Active Meals',
                anyLocked
                    ? `Cut-off times have passed. You can no longer cancel today's meals.`
                    : 'You have no active meal bookings to cancel right now.'
            );
            return;
        }
        Alert.alert(
            'Cancel Meal',
            'Which meal would you like to cancel?',
            [
                ...cancellable.map(meal => ({
                    text: `${meal.mealType}  (before ${CUTOFF_DISPLAY[meal.mealType]})`,
                    style: 'destructive' as const,
                    onPress: () =>
                        Alert.alert(
                            'Confirm Cancellation',
                            `Are you sure you want to cancel your ${meal.mealType}?`,
                            [
                                {
                                    text: 'Yes, Cancel Meal',
                                    style: 'destructive',
                                    onPress: () => executeCancelMeal(meal.bookingId, meal.mealType),
                                },
                                { text: 'No', style: 'cancel' },
                            ]
                        ),
                })),
                { text: 'Dismiss', style: 'cancel' },
            ]
        );
    };

    const executeCancelMeal = async (bookingId: string, mealType: string) => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/meals/cancel`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ bookingId, studentId: user._id }),
            });
            const data = await response.json();
            if (response.ok) {
                if (data.newWalletBalance !== undefined) {
                    setUser((prev: any) => ({ ...prev, walletBalance: data.newWalletBalance }));
                }
                Alert.alert('✅ Cancelled', data.message);
                fetchMealStatuses();
            } else {
                Alert.alert('Cannot Cancel', data.message || 'Failed to cancel meal.');
            }
        } catch {
            Alert.alert('Error', 'Something went wrong. Please try again.');
        }
    };

    // ---------- Change Restaurant ----------
    const handleChangeRestaurant = () => {
        // Meals that still allow switching (cutoff not passed, active booking or default)
        const switchable = mealStatuses.filter(
            m => m.canModify && (m.bookingId || m.isDefault)
        );
        if (switchable.length === 0) {
            const anyLocked = mealStatuses.some(m => m.isLocked);
            Alert.alert(
                anyLocked ? '🔒 Cut-off Passed' : 'No Active Meals',
                anyLocked
                    ? `Cut-off times have passed. You can no longer change restaurants for today's meals.`
                    : 'Book a meal first to change its restaurant.'
            );
            return;
        }
        Alert.alert(
            'Change Restaurant',
            'Which meal would you like to change?',
            [
                ...switchable.map(meal => ({
                    text: `${meal.mealType}  (before ${CUTOFF_DISPLAY[meal.mealType]})`,
                    onPress: () => navigation.navigate('Restaurants', { 
                        mealType: meal.mealType,
                        purpose: 'changeRestaurant',
                        currentRestaurantId: meal.restaurantId
                    }),
                })),
                { text: 'Dismiss', style: 'cancel' },
            ]
        );
    };

    // Direct per-meal cancel — used by Premium plan inline button
    const confirmAndCancelMeal = (bookingId: string, mealType: string, refundAmount: number) => {
        Alert.alert(
            'Cancel This Meal',
            `Are you sure you want to cancel your ${mealType} for today?\n\n₹${refundAmount} will be refunded instantly to your wallet.`,
            [
                { text: 'No', style: 'cancel' },
                {
                    text: 'Yes, Cancel',
                    style: 'destructive',
                    onPress: () => executeCancelMeal(bookingId, mealType)
                }
            ]
        );
    };

    const renderMealSlot = (type: string, time: string) => {
        const mealStatus = mealStatuses.find(s => s.mealType === type);
        const status = mealStatus?.status || 'Select';
        const restaurantName = mealStatus?.restaurantName ||
            (status !== 'Select' && status !== 'Not Consumed' && status !== 'Consumed' ? status : 'Not selected');
        const isLocked = mealStatus?.isLocked || false;
        const isModified = mealStatus?.isModified || false;
        const canModify = mealStatus?.canModify ?? false;
        const canCancel = mealStatus?.canCancel ?? false;
        const planName = (mealStatus?.planName || user?.selectedPlan || 'Basic');
        const planCanChange = mealStatus?.planCanChange ?? false;
        const planCanCancel = mealStatus?.planCanCancel ?? false;
        const refundAmount = mealStatus?.refundAmount || 0;
        const cutoffDisplay = mealStatus?.cutoffDisplay || CUTOFF_DISPLAY[type];
        const menuItems = mealStatus?.menuItems || [];

        const isServing = mealStatus?.isServing || false;

        const hasActiveBooking =
            !!(mealStatus?.bookingId) &&
            status !== 'Cancelled' &&
            status !== 'Consumed' &&
            status !== 'Not Consumed';

        // Switched/modified notice after a one-time switch
        const showModifiedNotice = isModified && !isLocked;

        const cardStatus =
            status === 'Consumed' ? 'taken'
                : status === 'Not Consumed' ? 'missed'
                    : status === 'Serving' ? 'booked'   // still booked, serving window open
                        : status === 'Select' ? 'available'
                            : 'booked';

        return (
            <View key={type} style={styles.mealSlotWrapper}>
                <MealSlotCard
                    type={type}
                    time={time}
                    status={cardStatus}
                    restaurant={restaurantName}
                    locked={isLocked || isModified}
                    menuItems={menuItems}
                    onPress={() => {
                        if (isLocked) {
                            Alert.alert(
                                `🔒 ${type} Locked`,
                                `The cut-off time of ${cutoffDisplay} has passed.\nYou can no longer modify or cancel this meal.`
                            );
                            return;
                        }
                        if (status === 'Select') {
                            navigation.navigate('Restaurants', { mealType: type });
                            return;
                        }
                        if (status === 'Consumed' || status === 'Not Consumed' || status === 'Cancelled') {
                            return;
                        }

                        // Navigate to MealDetailScreen for all active meals
                        navigation.navigate('MealDetail', {
                            mealType: type,
                            restaurantId: mealStatus?.restaurantId,
                            restaurantName: mealStatus?.restaurantName || status,
                            bookingId: mealStatus?.bookingId,
                            planName,
                            planCanChange,
                            planCanCancel,
                            isLocked,
                            isModified,
                            canModify,
                            canCancel,
                            refundAmount,
                            cutoffDisplay,
                            status,
                        });
                    }}
                    statusText={
                        (status === 'Consumed' || status === 'Not Consumed' || status === 'Cancelled')
                            ? status.toUpperCase()
                            : isLocked ? 'LOCKED'
                                : isModified ? 'SWITCHED'
                                    : status
                    }
                />

                {/* 🚨 Serving window open — urge to go now */}
                {isServing && (
                    <View style={styles.servingBanner}>
                        <Text style={styles.servingIcon}>🏃</Text>
                        <View style={styles.servingTextBlock}>
                            <Text style={styles.servingTitle}>Reach fast, food is waiting for you!</Text>
                            <Text style={styles.servingSubtitle}>{type} is being served now at {restaurantName}</Text>
                        </View>
                    </View>
                )}

                {/* Modified/locked notice */}
                {showModifiedNotice && (
                    <View style={styles.switchedBanner}>
                        <Text style={styles.switchedIcon}>✓</Text>
                        <Text style={styles.switchedText}>Restaurant switched. This meal is now locked — no further changes or cancellations.</Text>
                    </View>
                )}
            </View>
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
                        <UserAvatar
                            photoUrl={user?.profilePhoto}
                            name={displayName}
                            size={44}
                            borderWidth={1}
                            borderColor={Colors.border}
                        />
                    </TouchableOpacity>
                </View>

                <MealStatusBadge />

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
        paddingHorizontal: Spacing.md,
        paddingTop: Spacing.sm,
        paddingBottom: 40,
    },

    // ── Header ────────────────────────────────────────────────────────────────
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.md,
        marginTop: Spacing.sm,
    },
    welcomeText: {
        fontSize: 26,
        fontWeight: '800',
        color: Colors.text,
        letterSpacing: -0.5,
    },
    greetingSub: {
        fontSize: 13,
        color: Colors.textLight,
        marginTop: 2,
    },
    profileBadge: {
        borderRadius: 24,
        overflow: 'hidden',
        borderWidth: 2,
        borderColor: Colors.primaryLight,
    },

    // ── Meal slot wrappers ────────────────────────────────────────────────────
    mealSlotWrapper: { marginVertical: 0 },

    // ── Serving & switched banners ────────────────────────────────────────────
    servingBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.warningLight,
        borderRadius: BorderRadius.md,
        borderWidth: 1.5,
        borderColor: Colors.secondary,
        paddingHorizontal: 14,
        paddingVertical: 10,
        marginBottom: 6,
        gap: 10,
    },
    servingIcon: { fontSize: 22 },
    servingTextBlock: { flex: 1 },
    servingTitle: {
        fontSize: 13,
        fontWeight: '800',
        color: Colors.warning,
        lineHeight: 18,
    },
    servingSubtitle: {
        fontSize: 11,
        color: Colors.textSecondary,
        marginTop: 2,
    },
    switchedBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.successLight,
        borderRadius: BorderRadius.sm,
        paddingHorizontal: 12,
        paddingVertical: 8,
        marginBottom: 6,
        gap: 8,
    },
    switchedIcon: { fontSize: 14, color: Colors.success, fontWeight: '900' },
    switchedText: { fontSize: 12, color: Colors.success, flex: 1, lineHeight: 16 },

    // ── Section headers ───────────────────────────────────────────────────────
    section: { marginTop: Spacing.lg },
    sectionHeader: { marginBottom: Spacing.sm },
    sectionTitle: {
        fontSize: 11,
        fontWeight: '800',
        color: Colors.textLight,
        letterSpacing: 1.5,
        textTransform: 'uppercase',
    },
    sectionSubtitle: {
        fontSize: 15,
        fontWeight: '600',
        color: Colors.textSecondary,
        marginTop: 4,
        marginBottom: 16,
    },

    // ── Onboarding banner ─────────────────────────────────────────────────────
    onboardingBanner: {
        backgroundColor: Colors.primaryLight,
        borderRadius: BorderRadius.lg,
        padding: Spacing.lg,
        marginTop: Spacing.lg,
        borderLeftWidth: 4,
        borderLeftColor: Colors.primary,
    },
    bannerInfo: { flex: 1 },
    bannerTitle: {
        fontSize: 11,
        fontWeight: '900',
        color: Colors.primaryDark,
        letterSpacing: 1.5,
        marginBottom: 6,
    },
    bannerDesc: {
        fontSize: 14,
        color: Colors.primaryDark,
        lineHeight: 20,
    },

    // ── Subscription section ──────────────────────────────────────────────────
    subscriptionSection: {
        marginTop: Spacing.xl,
        paddingBottom: 40,
    },

    // ── Active plan card ──────────────────────────────────────────────────────
    activePlanCard: {
        backgroundColor: Colors.primary,
        borderRadius: BorderRadius.xl,
        padding: Spacing.lg,
        minHeight: 130,
        justifyContent: 'center',
        overflow: 'hidden',
    },
    statusBar: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
        gap: 6,
    },
    statusText: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 1.5,
    },
    pulseDot: {
        width: 7,
        height: 7,
        borderRadius: 4,
        backgroundColor: Colors.successLight,
    },
    activePlanName: {
        color: Colors.white,
        fontSize: 34,
        fontWeight: '900',
        letterSpacing: -1,
    },
    activePlanDesc: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 12,
        marginTop: 6,
    },

    // ── Plan tier cards ───────────────────────────────────────────────────────
    tiersContainer: { gap: 14 },
    tierCard: {
        backgroundColor: Colors.surface,
        borderWidth: 1.5,
        borderColor: Colors.border,
        borderRadius: BorderRadius.lg,
        padding: Spacing.md,
        position: 'relative',
        ...Shadows.sm,
    },
    popularBadge: {
        position: 'absolute',
        top: -11,
        right: 16,
        backgroundColor: Colors.primary,
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: BorderRadius.round,
    },
    popularText: {
        color: Colors.white,
        fontSize: 9,
        fontWeight: '900',
        letterSpacing: 0.8,
    },
    tierHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: Spacing.md,
    },
    tierInfo: { flex: 1, paddingRight: 10 },
    tierName: {
        fontSize: 20,
        fontWeight: '900',
        color: Colors.text,
        letterSpacing: -0.4,
    },
    tierTagline: {
        fontSize: 12,
        color: Colors.textSecondary,
        marginTop: 4,
        lineHeight: 17,
    },
    tierIcon: { fontSize: 30 },
    tierFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: Colors.borderLight,
        paddingTop: 12,
    },
    tierPrice: {
        fontSize: 20,
        fontWeight: '900',
        color: Colors.text,
    },
    perMonth: {
        fontSize: 12,
        fontWeight: '400',
        color: Colors.textLight,
    },
    viewBtn: {
        backgroundColor: Colors.primaryLight,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: BorderRadius.round,
    },
    viewBtnText: {
        color: Colors.primary,
        fontSize: 11,
        fontWeight: '800',
        letterSpacing: 0.5,
    },

    // Unused but preserved so old references don't crash
    mealActions: {},
    mealActionBtn: {},
    cancelActionBtn: {},
    mealActionDivider: {},
    mealActionIcon: {},
    mealActionText: {},
    mealActionNote: {},
    mealActionArrow: {},
    quickActions: {},
    actionRow: {},
    actionButton: {},
    actionIconBg: {},
    actionIcon: {},
    actionLabel: {},
} as any);

export default HomeScreen;