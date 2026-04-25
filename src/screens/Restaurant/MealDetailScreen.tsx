import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    Platform, ActivityIndicator, Alert, Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing, BorderRadius, Typography } from '../../styles/theme';
import Header from '../../components/Header';
import { useAuth } from '../../context/AuthContext';
import { API_BASE_URL as BASE_URL } from '../../config';

const MEAL_EMOJI: Record<string, string> = {
    Breakfast: '🌅',
    Lunch:     '☀️',
    Dinner:    '🌙',
};

const PLAN_LABEL: Record<string, string> = {
    Basic:    'Basic',
    Standard: 'Standard',
    Premium:  'Premium',
};

// ─── Component ────────────────────────────────────────────────────────────────
const MealDetailScreen = ({ navigation, route }: any) => {
    const { user, setUser } = useAuth();
    const {
        mealType,
        restaurantId,
        restaurantName,
        bookingId,
        planName: routePlanName,
        planCanChange,
        planCanCancel,
        isLocked,
        isModified,
        canModify,
        canCancel,
        refundAmount,
        cutoffDisplay,
        status,
    } = route.params || {};

    const [menuItems, setMenuItems] = useState<any[]>([]);
    const [loadingMenu, setLoadingMenu] = useState(true);
    const [cancelling, setCancelling] = useState(false);

    const plan = routePlanName || user?.selectedPlan || 'Basic';

    useEffect(() => {
        if (restaurantId && mealType) fetchMenu();
    }, [restaurantId, mealType]);

    const fetchMenu = async () => {
        try {
            const res = await fetch(`${BASE_URL}/api/meals/restaurants-for-meal/${mealType}`);
            const data = await res.json();
            if (res.ok) {
                const match = data.find((r: any) => r._id === restaurantId || r._id?.toString() === restaurantId?.toString());
                setMenuItems(match?.menuItems || []);
            }
        } catch {
            setMenuItems([]);
        } finally {
            setLoadingMenu(false);
        }
    };

    // ── Change Restaurant ──────────────────────────────────────────────────────
    const handleChangeRestaurant = () => {
        if (!planCanChange) {
            Alert.alert(
                '🔒 Plan Upgrade Required',
                'Upgrade your plan. This feature is not available in your current subscription.',
                [{ text: 'OK' }]
            );
            return;
        }
        if (isLocked) {
            Alert.alert(
                '⏰ Cutoff Time Exceeded',
                `Cutoff time exceeded. You can no longer modify this meal.`,
                [{ text: 'OK' }]
            );
            return;
        }
        if (isModified) {
            Alert.alert(
                '🔒 Already Modified',
                'You have already changed the restaurant for this meal. No further modifications are allowed.',
                [{ text: 'OK' }]
            );
            return;
        }
        navigation.navigate('Restaurants', {
            mealType,
            purpose: 'changeRestaurant',
            bookingId,
            currentRestaurantId: restaurantId,
        });
    };

    // ── Cancel Meal ────────────────────────────────────────────────────────────
    const handleCancelMeal = () => {
        if (!planCanCancel) {
            Alert.alert(
                '🔒 Plan Upgrade Required',
                'Upgrade your plan. This feature is not available in your current subscription.',
                [{ text: 'OK' }]
            );
            return;
        }
        if (isLocked) {
            Alert.alert(
                '⏰ Cutoff Time Exceeded',
                `Cutoff time exceeded. You can no longer modify this meal.`,
                [{ text: 'OK' }]
            );
            return;
        }
        if (isModified) {
            Alert.alert(
                '🔒 Meal Locked',
                'This meal has been modified (restaurant changed). No further cancellations are allowed.',
                [{ text: 'OK' }]
            );
            return;
        }

        Alert.alert(
            'Cancel Meal',
            `Are you sure you want to cancel your ${mealType}?\n\n₹${refundAmount} will be refunded instantly to your wallet.`,
            [
                { text: 'No, Keep Meal', style: 'cancel' },
                {
                    text: 'Yes, Cancel',
                    style: 'destructive',
                    onPress: executeCancelMeal,
                },
            ]
        );
    };

    const executeCancelMeal = async () => {
        // Guard: bookingId must exist (meal must be an actual DB booking, not a default-slot)
        if (!bookingId) {
            Alert.alert(
                'Cannot Cancel',
                'This meal slot does not have an active booking yet. Please refresh your dashboard.'
            );
            return;
        }
        if (!user?._id) {
            Alert.alert('Error', 'You must be logged in to cancel a meal.');
            return;
        }

        setCancelling(true);
        try {
            const res = await fetch(`${BASE_URL}/api/meals/cancel`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ bookingId, studentId: user._id }),
            });
            const data = await res.json();
            if (res.ok) {
                // Update wallet in local user context
                if (data.newWalletBalance !== undefined) {
                    setUser((prev: any) => ({ ...prev, walletBalance: data.newWalletBalance }));
                }
                Alert.alert(
                    '✅ Meal Cancelled',
                    data.message || `${mealType} cancelled. ₹${refundAmount} refunded to wallet.`,
                    [{ text: 'OK', onPress: () => navigation.goBack() }]
                );
            } else {
                Alert.alert('Cannot Cancel', data.message || 'Failed to cancel meal.');
            }
        } catch {
            Alert.alert('Network Error', 'Something went wrong. Please try again.');
        } finally {
            setCancelling(false);
        }
    };

    // ── Derived flags ─────────────────────────────────────────────────────────
    const isCancelled = status === 'Cancelled';
    const isConsumed  = status === 'Consumed' || status === 'Not Consumed';
    const mealDone    = isCancelled || isConsumed;

    const changeDisabled = !canModify || mealDone;
    const cancelDisabled = !canCancel || mealDone;

    // ─── Render ───────────────────────────────────────────────────────────────
    return (
        <SafeAreaView style={styles.container}>
            <Header
                title={`${MEAL_EMOJI[mealType] || '🍽'} ${mealType}`}
                showBack
                onBackPress={() => navigation.goBack()}
            />

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

                {/* Restaurant Info Card */}
                <View style={styles.restaurantCard}>
                    <View style={styles.restRow}>
                        <View style={styles.restIconBg}>
                            <Text style={styles.restIcon}>🏪</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.restLabel}>YOUR RESTAURANT</Text>
                            <Text style={styles.restName}>{restaurantName || '—'}</Text>
                        </View>
                        {isModified && (
                            <View style={styles.modifiedBadge}>
                                <Text style={styles.modifiedBadgeText}>MODIFIED</Text>
                            </View>
                        )}
                    </View>

                    {/* Status badge */}
                    <View style={[styles.statusRow, isCancelled && styles.statusCancelled]}>
                        <View style={[styles.statusDot, {
                            backgroundColor: isCancelled ? '#E53935'
                                           : isConsumed  ? '#78909C'
                                           : isLocked    ? '#FFA000'
                                           : '#43A047'
                        }]} />
                        <Text style={[styles.statusLabel, isCancelled && { color: '#E53935' }]}>
                            {isCancelled ? 'Cancelled'
                            : isConsumed  ? status
                            : isLocked    ? `Locked — cutoff was ${cutoffDisplay}`
                            : isModified  ? 'Modified — locked'
                            :               'Active'}
                        </Text>
                    </View>

                    {/* Plan badge */}
                    <View style={styles.planBadgeRow}>
                        <Text style={styles.planBadgeLabel}>Your Plan: </Text>
                        <View style={[styles.planBadge, {
                            backgroundColor: plan === 'Premium' ? '#FFF8E1'
                                           : plan === 'Standard' ? '#E3F2FD'
                                           :                        '#F5F5F5'
                        }]}>
                            <Text style={[styles.planBadgeText, {
                                color: plan === 'Premium' ? '#F57F17'
                                     : plan === 'Standard' ? '#1565C0'
                                     :                        '#424242'
                            }]}>{PLAN_LABEL[plan] || plan}</Text>
                        </View>
                    </View>
                </View>

                {/* Action Buttons */}
                {!mealDone && (
                    <View style={styles.actionsCard}>
                        <Text style={styles.actionsTitle}>MEAL ACTIONS</Text>

                        {/* Change Restaurant */}
                        <TouchableOpacity
                            style={[styles.actionBtn, changeDisabled && styles.actionBtnDisabled]}
                            onPress={handleChangeRestaurant}
                            activeOpacity={changeDisabled ? 1 : 0.75}
                        >
                            <View style={[styles.actionIconWrap, { backgroundColor: '#E3F2FD' }]}>
                                <Text style={styles.actionBtnIcon}>🔄</Text>
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={[styles.actionBtnText, changeDisabled && styles.textDisabled]}>
                                    Change Restaurant
                                </Text>
                                <Text style={styles.actionBtnSub}>
                                    {!planCanChange
                                        ? 'Available on Standard & Premium plans'
                                        : isLocked
                                        ? `Cutoff passed (${cutoffDisplay})`
                                        : isModified
                                        ? 'Already changed — locked'
                                        : `Before ${cutoffDisplay} · one-time`}
                                </Text>
                            </View>
                            {!changeDisabled && <Text style={styles.chevron}>›</Text>}
                            {!planCanChange && <View style={styles.lockBadge}><Text style={styles.lockIcon}>🔒</Text></View>}
                        </TouchableOpacity>

                        <View style={styles.divider} />

                        {/* Cancel Meal */}
                        <TouchableOpacity
                            style={[styles.actionBtn, cancelDisabled && styles.actionBtnDisabled]}
                            onPress={handleCancelMeal}
                            activeOpacity={cancelDisabled ? 1 : 0.75}
                            disabled={cancelling}
                        >
                            <View style={[styles.actionIconWrap, { backgroundColor: '#FFEBEE' }]}>
                                <Text style={styles.actionBtnIcon}>{cancelling ? '⏳' : '🚫'}</Text>
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={[styles.actionBtnText, cancelDisabled && styles.textDisabled, !cancelDisabled && { color: '#E53935' }]}>
                                    {cancelling ? 'Cancelling...' : 'Cancel Meal'}
                                </Text>
                                <Text style={styles.actionBtnSub}>
                                    {!planCanCancel
                                        ? 'Available on Premium plan only'
                                        : isLocked
                                        ? `Cutoff passed (${cutoffDisplay})`
                                        : isModified
                                        ? 'Locked after restaurant change'
                                        : `Refund ₹${refundAmount} to wallet · before ${cutoffDisplay}`}
                                </Text>
                            </View>
                            {!planCanCancel && <View style={styles.lockBadge}><Text style={styles.lockIcon}>🔒</Text></View>}
                        </TouchableOpacity>
                    </View>
                )}

                {/* Menu for this meal */}
                <View style={styles.menuSection}>
                    <Text style={styles.menuTitle}>TODAY'S MENU · {mealType.toUpperCase()}</Text>

                    {loadingMenu ? (
                        <ActivityIndicator color={Colors.primary} style={{ marginTop: 20 }} />
                    ) : menuItems.length === 0 ? (
                        <View style={styles.emptyMenu}>
                            <Text style={styles.emptyMenuIcon}>🍽</Text>
                            <Text style={styles.emptyMenuText}>No menu listed for {mealType} yet.</Text>
                        </View>
                    ) : (
                        menuItems.map((item: any, idx: number) => (
                            <View key={`${item.name}-${idx}`} style={styles.menuItem}>
                                <View style={styles.menuItemImageWrap}>
                                    {item.image ? (
                                        <Image source={{ uri: item.image }} style={styles.menuItemImage} />
                                    ) : (
                                        <Text style={styles.menuItemEmoji}>🍲</Text>
                                    )}
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.menuItemName}>{item.name}</Text>
                                    <Text style={styles.menuItemSub}>Freshly Prepared</Text>
                                </View>
                                <View style={styles.vegDot} />
                            </View>
                        ))
                    )}
                </View>

            </ScrollView>
        </SafeAreaView>
    );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F7F8FA',
    },
    scroll: {
        padding: Spacing.md,
        paddingBottom: 40,
        gap: 16,
    },

    // Restaurant card
    restaurantCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 3,
    },
    restRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    restIconBg: {
        width: 48,
        height: 48,
        borderRadius: 12,
        backgroundColor: '#FFF3E0',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 14,
    },
    restIcon: { fontSize: 22 },
    restLabel: {
        fontSize: 10,
        fontWeight: '700',
        letterSpacing: 1.5,
        color: '#999',
        marginBottom: 3,
    },
    restName: {
        fontSize: 18,
        fontWeight: '800',
        color: '#1A1A1A',
    },
    modifiedBadge: {
        backgroundColor: '#FFF9C4',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 6,
    },
    modifiedBadgeText: {
        fontSize: 10,
        fontWeight: '800',
        color: '#F57F17',
        letterSpacing: 0.5,
    },
    statusRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F1FFF4',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 8,
        marginBottom: 12,
    },
    statusCancelled: {
        backgroundColor: '#FFF5F5',
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: 8,
    },
    statusLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: '#2E7D32',
    },
    planBadgeRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    planBadgeLabel: {
        fontSize: 13,
        color: '#666',
    },
    planBadge: {
        paddingHorizontal: 10,
        paddingVertical: 3,
        borderRadius: 6,
    },
    planBadgeText: {
        fontSize: 12,
        fontWeight: '700',
    },

    // Actions card
    actionsCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        paddingVertical: 6,
        paddingHorizontal: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 3,
        overflow: 'hidden',
    },
    actionsTitle: {
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 1.5,
        color: '#999',
        marginLeft: 16,
        marginTop: 14,
        marginBottom: 8,
    },
    actionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 14,
    },
    actionBtnDisabled: {
        opacity: 0.55,
    },
    actionIconWrap: {
        width: 42,
        height: 42,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 14,
    },
    actionBtnIcon: { fontSize: 20 },
    actionBtnText: {
        fontSize: 15,
        fontWeight: '700',
        color: '#1A1A1A',
        marginBottom: 2,
    },
    textDisabled: { color: '#999' },
    actionBtnSub: {
        fontSize: 12,
        color: '#999',
        lineHeight: 16,
    },
    chevron: {
        fontSize: 22,
        color: '#CCC',
        marginLeft: 8,
    },
    lockBadge: {
        backgroundColor: '#F5F5F5',
        borderRadius: 8,
        padding: 6,
        marginLeft: 8,
    },
    lockIcon: { fontSize: 14 },
    divider: {
        height: 1,
        backgroundColor: '#F0F0F0',
        marginHorizontal: 16,
    },

    // Menu section
    menuSection: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 3,
    },
    menuTitle: {
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 1.5,
        color: '#999',
        marginBottom: 14,
    },
    emptyMenu: {
        alignItems: 'center',
        paddingVertical: 30,
    },
    emptyMenuIcon: { fontSize: 36, marginBottom: 8 },
    emptyMenuText: {
        fontSize: 14,
        color: '#999',
        fontStyle: 'italic',
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#F5F5F5',
    },
    menuItemImageWrap: {
        width: 56,
        height: 56,
        borderRadius: 10,
        backgroundColor: '#F9F9F9',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 14,
        overflow: 'hidden',
    },
    menuItemImage: { width: '100%', height: '100%' },
    menuItemEmoji: { fontSize: 26 },
    menuItemName: {
        fontSize: 15,
        fontWeight: '600',
        color: '#1A1A1A',
        marginBottom: 2,
    },
    menuItemSub: {
        fontSize: 12,
        color: '#999',
    },
    vegDot: {
        width: 10,
        height: 10,
        borderRadius: 2,
        borderWidth: 1.5,
        borderColor: '#43A047',
        backgroundColor: '#43A047',
        marginLeft: 10,
    },
});

export default MealDetailScreen;
