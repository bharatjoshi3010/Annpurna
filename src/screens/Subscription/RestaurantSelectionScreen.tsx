/**
 * RestaurantSelectionScreen.tsx
 *
 * Step 2 of subscription onboarding: choose a default restaurant.
 * Each card now has a "VIEW WEEKLY MENU" button that opens a
 * bottom-sheet Modal showing the full 7-day × 3-meal schedule.
 */

import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, FlatList, TouchableOpacity,
    Platform, ActivityIndicator, Alert, Modal, ScrollView,
    SafeAreaView as RNSafeAreaView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing, BorderRadius } from '../../styles/theme';
import Header from '../../components/Header';
import { useAuth } from '../../context/AuthContext';

// ── Constants ────────────────────────────────────────────────────────────────
const BASE_URL = Platform.OS === 'android' ? 'http://10.0.2.2:5000' : 'http://localhost:5000';

const DAY_ORDER = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const MEALS     = ['Breakfast', 'Lunch', 'Dinner'] as const;
const MEAL_EMOJI: Record<string, string> = { Breakfast: '🍳', Lunch: '🍱', Dinner: '🌙' };
const DAY_SHORT: Record<string, string>  = {
    Monday: 'Mon', Tuesday: 'Tue', Wednesday: 'Wed',
    Thursday: 'Thu', Friday: 'Fri', Saturday: 'Sat', Sunday: 'Sun',
};

// ── Types ────────────────────────────────────────────────────────────────────
interface MenuItem { name: string; description?: string }
interface MenuEntry {
    menuType: 'weekly' | 'single';
    dayOfWeek?: string;
    mealType: string;
    items: MenuItem[];
}
interface Restaurant {
    _id: string;
    restaurantName: string;
    name?: string;
    address?: string;
    location?: string;
    kycStatus: string;
}

// ── Weekly Menu Bottom Sheet ─────────────────────────────────────────────────
const WeeklyMenuSheet = ({
    visible, restaurant, onClose,
}: {
    visible: boolean;
    restaurant: Restaurant | null;
    onClose: () => void;
}) => {
    const [menuEntries, setMenuEntries] = useState<MenuEntry[]>([]);
    const [loading,     setLoading]     = useState(false);
    const [activeDay,   setActiveDay]   = useState('Monday');

    useEffect(() => {
        if (visible && restaurant) {
            loadMenu();
            setActiveDay('Monday');
        }
    }, [visible, restaurant]);

    const loadMenu = async () => {
        if (!restaurant) return;
        setLoading(true);
        try {
            // Fetch ALL entries (no date param) which returns full weekly + single menus
            const res  = await fetch(`${BASE_URL}/api/menu/${restaurant._id}`);
            const data = await res.json();
            if (res.ok) setMenuEntries(Array.isArray(data) ? data : []);
        } catch {
            Alert.alert('Error', 'Could not load menu. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Group weekly entries: day → mealType → items
    const weeklyByDay: Record<string, Record<string, MenuItem[]>> = {};
    menuEntries
        .filter(e => e.menuType === 'weekly' && e.dayOfWeek)
        .forEach(e => {
            if (!weeklyByDay[e.dayOfWeek!]) weeklyByDay[e.dayOfWeek!] = {};
            weeklyByDay[e.dayOfWeek!][e.mealType] = e.items;
        });

    const activeMeals = weeklyByDay[activeDay] || {};
    const hasAnyMenu  = DAY_ORDER.some(d => weeklyByDay[d]);

    if (!restaurant) return null;

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={onClose}
        >
            <View style={mStyles.overlay}>
                <View style={mStyles.sheet}>
                    {/* Handle bar */}
                    <View style={mStyles.handle} />

                    {/* Sheet header */}
                    <View style={mStyles.sheetHeader}>
                        <View style={{ flex: 1 }}>
                            <Text style={mStyles.sheetRestName}>
                                {restaurant.restaurantName || restaurant.name}
                            </Text>
                            <Text style={mStyles.sheetSubtitle}>Weekly Menu Schedule</Text>
                        </View>
                        <TouchableOpacity onPress={onClose} style={mStyles.closeBtn}>
                            <Text style={mStyles.closeBtnText}>✕</Text>
                        </TouchableOpacity>
                    </View>

                    {loading ? (
                        <View style={mStyles.loader}>
                            <ActivityIndicator size="large" color={Colors.primary} />
                            <Text style={mStyles.loaderText}>Loading menu…</Text>
                        </View>
                    ) : !hasAnyMenu ? (
                        <View style={mStyles.emptyWrap}>
                            <Text style={mStyles.emptyIcon}>🍽️</Text>
                            <Text style={mStyles.emptyTitle}>No Weekly Menu Set</Text>
                            <Text style={mStyles.emptyDesc}>
                                This restaurant hasn't uploaded their weekly schedule yet.
                            </Text>
                        </View>
                    ) : (
                        <>
                            {/* Day tabs */}
                            <ScrollView
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                contentContainerStyle={mStyles.dayTabs}
                            >
                                {DAY_ORDER.map(day => {
                                    const hasMeals = !!weeklyByDay[day];
                                    return (
                                        <TouchableOpacity
                                            key={day}
                                            onPress={() => setActiveDay(day)}
                                            style={[
                                                mStyles.dayTab,
                                                activeDay === day && mStyles.dayTabActive,
                                                !hasMeals && mStyles.dayTabEmpty,
                                            ]}
                                        >
                                            <Text style={[
                                                mStyles.dayTabText,
                                                activeDay === day && mStyles.dayTabTextActive,
                                                !hasMeals && mStyles.dayTabTextEmpty,
                                            ]}>
                                                {DAY_SHORT[day]}
                                            </Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </ScrollView>

                            {/* Meals for active day */}
                            <ScrollView
                                style={{ flex: 1 }}
                                showsVerticalScrollIndicator={false}
                                contentContainerStyle={mStyles.mealsContent}
                            >
                                {MEALS.map(mealType => {
                                    const items = activeMeals[mealType] || [];
                                    return (
                                        <View key={mealType} style={mStyles.mealSection}>
                                            <View style={mStyles.mealHeader}>
                                                <Text style={mStyles.mealEmoji}>{MEAL_EMOJI[mealType]}</Text>
                                                <Text style={mStyles.mealTitle}>{mealType}</Text>
                                                {items.length === 0 && (
                                                    <View style={mStyles.noMenuBadge}>
                                                        <Text style={mStyles.noMenuBadgeText}>No menu set</Text>
                                                    </View>
                                                )}
                                            </View>
                                            {items.length > 0 ? (
                                                items.map((item, idx) => (
                                                    <View key={idx} style={mStyles.menuItemRow}>
                                                        <View style={mStyles.itemDot} />
                                                        <View style={{ flex: 1 }}>
                                                            <Text style={mStyles.itemName}>{item.name}</Text>
                                                            {item.description ? (
                                                                <Text style={mStyles.itemDesc}>{item.description}</Text>
                                                            ) : null}
                                                        </View>
                                                    </View>
                                                ))
                                            ) : (
                                                <Text style={mStyles.noMenuText}>
                                                    Not available on this day
                                                </Text>
                                            )}
                                        </View>
                                    );
                                })}
                                <View style={{ height: 30 }} />
                            </ScrollView>
                        </>
                    )}
                </View>
            </View>
        </Modal>
    );
};

// ── Main Screen ───────────────────────────────────────────────────────────────
const RestaurantSelectionScreen = ({ route, navigation }: any) => {
    const { plan } = route.params;
    const { user, setUser } = useAuth();
    const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
    const [loading,     setLoading]     = useState(true);
    const [submitting,  setSubmitting]  = useState(false);
    const [selectedId,  setSelectedId]  = useState<string | null>(null);
    const [menuSheet,   setMenuSheet]   = useState<Restaurant | null>(null);

    useEffect(() => { fetchRestaurants(); }, []);

    const fetchRestaurants = async () => {
        try {
            const response = await fetch(`${BASE_URL}/api/auth/restaurants`);
            const data = await response.json();
            if (response.ok) {
                setRestaurants(data.filter((r: Restaurant) => r.kycStatus === 'approved'));
            } else {
                Alert.alert('Error', 'Could not load restaurants. Please try again.');
            }
        } catch {
            Alert.alert('Network Error', 'Check your connection and try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleConfirmSelection = async () => {
        if (!selectedId) {
            Alert.alert('Selection Required', 'Please select a default restaurant to continue.');
            return;
        }
        setSubmitting(true);
        try {
            const response = await fetch(`${BASE_URL}/api/payment/subscribe`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    studentId:           user._id,
                    planName:            plan.name,
                    price:               plan.priceNum,
                    defaultRestaurantId: selectedId,
                }),
            });
            const data = await response.json();
            if (response.ok) {
                setUser(data.student);
                Alert.alert(
                    '✅ SUCCESS',
                    'Subscription activated! Your default mess is now set.',
                    [{ text: 'GO TO DASHBOARD', onPress: () => navigation.navigate('Main') }]
                );
            } else {
                Alert.alert('ERROR', data.message || 'Subscription failed');
            }
        } catch {
            Alert.alert('ERROR', 'Network error occurred. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    const renderRestaurantItem = ({ item }: { item: Restaurant }) => {
        const isSelected = selectedId === item._id;
        return (
            <TouchableOpacity
                style={[styles.restaurantCard, isSelected && styles.selectedCard]}
                onPress={() => setSelectedId(item._id)}
                activeOpacity={0.85}
            >
                <View style={styles.cardHeader}>
                    <View style={styles.resInfo}>
                        <Text style={styles.resName}>{item.restaurantName || item.name}</Text>
                        {item.address ? <Text style={styles.resAddress}>📍 {item.address}</Text> : null}
                        {item.location ? <Text style={styles.resLocation}>🗺  {item.location}</Text> : null}
                    </View>
                    <View style={styles.cardRight}>
                        {isSelected && (
                            <View style={styles.selectedBadge}>
                                <Text style={styles.selectedBadgeText}>✓</Text>
                            </View>
                        )}
                    </View>
                </View>

                {/* Action buttons row */}
                <View style={styles.cardActions}>
                    <TouchableOpacity
                        style={[styles.actionBtn, styles.menuBtn]}
                        onPress={() => setMenuSheet(item)}
                    >
                        <Text style={styles.menuBtnText}>📋  VIEW WEEKLY MENU</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.actionBtn, isSelected ? styles.unselectBtn : styles.selectBtn]}
                        onPress={() => setSelectedId(isSelected ? null : item._id)}
                    >
                        <Text style={isSelected ? styles.unselectBtnText : styles.selectBtnText}>
                            {isSelected ? 'DESELECT' : 'SELECT'}
                        </Text>
                    </TouchableOpacity>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <Header
                title="SELECT DEFAULT MESS"
                showBack
                onBackPress={() => navigation.goBack()}
            />

            <View style={styles.content}>
                <View style={styles.stepHeader}>
                    <Text style={styles.stepBadge}>STEP 2 OF 2</Text>
                    <Text style={styles.stepTitle}>Choose Your Default Mess</Text>
                    <Text style={styles.stepDesc}>
                        Tap a restaurant to select it as your default. View their weekly menu before choosing.
                    </Text>
                </View>

                {loading ? (
                    <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 50 }} />
                ) : (
                    <FlatList
                        data={restaurants}
                        keyExtractor={item => item._id}
                        renderItem={renderRestaurantItem}
                        contentContainerStyle={styles.listContent}
                        showsVerticalScrollIndicator={false}
                        ListEmptyComponent={
                            <View style={styles.emptyState}>
                                <Text style={styles.emptyIcon}>🏪</Text>
                                <Text style={styles.emptyTitle}>No restaurants available</Text>
                                <Text style={styles.emptyDesc}>Please check back soon.</Text>
                            </View>
                        }
                    />
                )}

                <TouchableOpacity
                    style={[styles.confirmBtn, !selectedId && styles.disabledBtn]}
                    onPress={handleConfirmSelection}
                    disabled={submitting || !selectedId}
                >
                    <Text style={styles.confirmBtnText}>
                        {submitting ? 'ACTIVATING PLAN…' : 'FINALIZE SUBSCRIPTION →'}
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Weekly menu bottom sheet */}
            <WeeklyMenuSheet
                visible={!!menuSheet}
                restaurant={menuSheet}
                onClose={() => setMenuSheet(null)}
            />
        </SafeAreaView>
    );
};

// ── Styles — Main Screen ──────────────────────────────────────────────────────
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFF' },
    content:   { flex: 1, paddingHorizontal: 20, paddingTop: 16 },
    stepHeader: { marginBottom: 20 },
    stepBadge: {
        fontSize: 10, fontWeight: '900', letterSpacing: 2,
        color: Colors.primary, marginBottom: 4,
    },
    stepTitle: { fontSize: 20, fontWeight: '900', color: '#000', marginBottom: 6 },
    stepDesc:  { fontSize: 14, color: '#666', lineHeight: 20 },
    listContent: { paddingBottom: 16 },

    restaurantCard: {
        backgroundColor: '#FFF',
        borderRadius: 12,
        borderWidth: 1.5,
        borderColor: '#EEE',
        padding: 16,
        marginBottom: 14,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 6,
        elevation: 2,
    },
    selectedCard: {
        borderColor: '#000',
        borderWidth: 2,
        backgroundColor: '#FAFAFA',
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems:     'flex-start',
        marginBottom:   14,
    },
    resInfo: { flex: 1 },
    resName: { fontSize: 17, fontWeight: '900', color: '#000' },
    resAddress: { fontSize: 12, color: '#888', marginTop: 4 },
    resLocation: { fontSize: 12, color: '#888', marginTop: 2 },
    cardRight: { marginLeft: 8 },
    selectedBadge: {
        width: 28, height: 28, borderRadius: 14,
        backgroundColor: '#000',
        alignItems: 'center', justifyContent: 'center',
    },
    selectedBadgeText: { color: '#FFF', fontSize: 14, fontWeight: '900' },

    cardActions: {
        flexDirection: 'row',
        gap: 10,
        borderTopWidth: 1,
        borderTopColor: '#F0F0F0',
        paddingTop: 12,
    },
    actionBtn: {
        flex: 1, paddingVertical: 9, borderRadius: 8,
        alignItems: 'center', justifyContent: 'center',
    },
    menuBtn:          { backgroundColor: '#F5F5F5' },
    menuBtnText:      { fontSize: 11, fontWeight: '800', color: '#444', letterSpacing: 0.5 },
    selectBtn:        { backgroundColor: '#000' },
    selectBtnText:    { fontSize: 11, fontWeight: '900', color: '#FFF', letterSpacing: 1 },
    unselectBtn:      { backgroundColor: '#FFF', borderWidth: 1.5, borderColor: '#CCC' },
    unselectBtnText:  { fontSize: 11, fontWeight: '800', color: '#666', letterSpacing: 1 },

    emptyState: { alignItems: 'center', paddingVertical: 60 },
    emptyIcon:  { fontSize: 40, marginBottom: 12 },
    emptyTitle: { fontSize: 16, fontWeight: '700', color: '#444' },
    emptyDesc:  { fontSize: 13, color: '#AAA', marginTop: 4 },

    confirmBtn: {
        backgroundColor: '#000', paddingVertical: 18,
        borderRadius: 10, alignItems: 'center', marginTop: 8, marginBottom: 16,
    },
    disabledBtn:     { backgroundColor: '#CCC' },
    confirmBtnText:  { color: '#FFF', fontSize: 14, fontWeight: '900', letterSpacing: 1.5 },
});

// ── Styles — Weekly Menu Sheet ────────────────────────────────────────────────
const mStyles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    sheet: {
        backgroundColor: '#FFF',
        borderTopLeftRadius:  24,
        borderTopRightRadius: 24,
        maxHeight: '88%',
        paddingBottom: 20,
    },
    handle: {
        width: 40, height: 4, borderRadius: 2,
        backgroundColor: '#DDD',
        alignSelf: 'center', marginTop: 12, marginBottom: 8,
    },
    sheetHeader: {
        flexDirection: 'row', alignItems: 'flex-start',
        paddingHorizontal: 20, paddingVertical: 12,
        borderBottomWidth: 1, borderBottomColor: '#F0F0F0',
    },
    sheetRestName: { fontSize: 18, fontWeight: '900', color: '#000' },
    sheetSubtitle: { fontSize: 12, color: '#888', marginTop: 2, fontWeight: '600' },
    closeBtn: {
        width: 32, height: 32, borderRadius: 16,
        backgroundColor: '#F5F5F5',
        alignItems: 'center', justifyContent: 'center',
        marginTop: 2,
    },
    closeBtnText: { fontSize: 14, color: '#444', fontWeight: '700' },

    loader:     { padding: 60, alignItems: 'center' },
    loaderText: { marginTop: 12, color: '#888', fontSize: 14 },

    emptyWrap:  { padding: 60, alignItems: 'center' },
    emptyIcon:  { fontSize: 40, marginBottom: 12 },
    emptyTitle: { fontSize: 17, fontWeight: '800', color: '#444', marginBottom: 6 },
    emptyDesc:  { fontSize: 13, color: '#888', textAlign: 'center', lineHeight: 20 },

    // Day tabs
    dayTabs: {
        paddingHorizontal: 16, paddingVertical: 12, gap: 8, flexDirection: 'row',
    },
    dayTab: {
        paddingHorizontal: 14, paddingVertical: 7,
        borderRadius: 20, backgroundColor: '#F5F5F5',
    },
    dayTabActive:   { backgroundColor: '#000' },
    dayTabEmpty:    { opacity: 0.4 },
    dayTabText:     { fontSize: 12, fontWeight: '700', color: '#444' },
    dayTabTextActive: { color: '#FFF' },
    dayTabTextEmpty:  { color: '#999' },

    mealsContent: { paddingHorizontal: 20, paddingBottom: 24 },

    mealSection: {
        marginBottom: 20,
        backgroundColor: '#FAFAFA',
        borderRadius: 12,
        padding: 14,
    },
    mealHeader: {
        flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 8,
    },
    mealEmoji: { fontSize: 20 },
    mealTitle: { fontSize: 15, fontWeight: '800', color: '#000', flex: 1 },
    noMenuBadge: {
        backgroundColor: '#FFF3E0', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6,
    },
    noMenuBadgeText: { fontSize: 10, color: '#E65100', fontWeight: '700' },

    menuItemRow: {
        flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 8,
    },
    itemDot: {
        width: 6, height: 6, borderRadius: 3,
        backgroundColor: Colors.primary, marginTop: 6,
    },
    itemName: { fontSize: 14, fontWeight: '600', color: '#222' },
    itemDesc: { fontSize: 12, color: '#888', marginTop: 2 },

    noMenuText: { fontSize: 13, color: '#BBB', fontStyle: 'italic', paddingLeft: 4 },
});

export default RestaurantSelectionScreen;
