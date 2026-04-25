/**
 * RestaurantSelectionScreen.tsx — Step 2 of subscription.
 * KEY FIX: Modal rendered OUTSIDE SafeAreaView to avoid Android clipping.
 */

import React, { useState, useEffect, useRef } from 'react';
import {
    View, Text, StyleSheet, FlatList, TouchableOpacity,
    Platform, ActivityIndicator, Alert, Modal, ScrollView, Image, Dimensions,
} from 'react-native';

const SCREEN_HEIGHT = Dimensions.get('window').height;
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing, BorderRadius } from '../../styles/theme';
import Header from '../../components/Header';
import { useAuth } from '../../context/AuthContext';
import { API_BASE_URL as BASE_URL } from '../../config';

const DAY_ORDER  = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
const MEALS      = ['Breakfast','Lunch','Dinner'] as const;
const MEAL_EMOJI: Record<string,string> = { Breakfast:'🍳', Lunch:'🍱', Dinner:'🌙' };
const DAY_SHORT : Record<string,string> = {
    Monday:'Mon', Tuesday:'Tue', Wednesday:'Wed',
    Thursday:'Thu', Friday:'Fri', Saturday:'Sat', Sunday:'Sun',
};

interface FoodItem  { name: string; description?: string; image?: string }
interface MenuEntry {
    menuType: 'weekly' | 'single';
    dayOfWeek?: string;
    date?: string;
    mealType: string;
    items: FoodItem[];
}
interface Restaurant {
    _id: string;
    restaurantName?: string;
    name?: string;
    address?: string;
    location?: string;
    kycStatus: string;
}

// ── Weekly Menu Sheet (full-screen modal) ─────────────────────────────────────
const WeeklyMenuSheet = ({
    visible, restaurant, onClose,
}: { visible: boolean; restaurant: Restaurant | null; onClose: () => void }) => {
    const [entries,   setEntries]   = useState<MenuEntry[]>([]);
    const [loading,   setLoading]   = useState(false);
    const [activeDay, setActiveDay] = useState('Monday');

    useEffect(() => {
        if (visible && restaurant?._id) {
            setEntries([]);
            setActiveDay('Monday');
            loadMenu(restaurant._id);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [visible, restaurant?._id]);

    const loadMenu = async (id: string) => {
        setLoading(true);
        try {
            const res  = await fetch(`${BASE_URL}/api/menu/${id}`);
            const data = await res.json();
            if (res.ok && Array.isArray(data)) {
                setEntries(data);
            } else {
                setEntries([]);
                Alert.alert('Menu Error', data?.message || `Error ${res.status}`);
            }
        } catch (e: any) {
            setEntries([]);
            Alert.alert('Network Error', 'Could not load menu.');
        } finally {
            setLoading(false);
        }
    };

    // Build: day → meal → items[]
    const byDay: Record<string, Record<string, FoodItem[]>> = {};
    entries.forEach(e => {
        let day = e.dayOfWeek;
        if (!day && e.date) {
            const d = new Date(e.date);
            day = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][d.getDay()];
        }
        if (!day) return;
        if (!byDay[day]) byDay[day] = {};
        byDay[day][e.mealType] = e.items;
    });

    const hasMenu = DAY_ORDER.some(d => byDay[d]);
    const todayMeals = byDay[activeDay] || {};

    if (!restaurant) return null;

    return (
        <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
            <View style={ms.overlay}>
                <View style={ms.sheet}>
                    {/* Handle */}
                    <View style={ms.handle} />

                    {/* Header */}
                    <View style={ms.header}>
                        <View style={{ flex: 1 }}>
                            <Text style={ms.restName} numberOfLines={1}>
                                {restaurant.restaurantName || restaurant.name || 'Restaurant'}
                            </Text>
                            <Text style={ms.subtitle}>Weekly Schedule</Text>
                        </View>
                        <TouchableOpacity onPress={onClose} style={ms.closeBtn} hitSlop={{ top:10, bottom:10, left:10, right:10 }}>
                            <Text style={ms.closeTxt}>✕</Text>
                        </TouchableOpacity>
                    </View>

                    {loading ? (
                        <View style={ms.center}>
                            <ActivityIndicator size="large" color={Colors.primary} />
                            <Text style={ms.loadTxt}>Loading menu…</Text>
                        </View>
                    ) : !hasMenu ? (
                        <View style={ms.center}>
                            <Text style={{ fontSize: 40 }}>🍽️</Text>
                            <Text style={ms.emptyTitle}>No Menu Uploaded</Text>
                            <Text style={ms.emptyDesc}>
                                This restaurant hasn't set their weekly schedule yet.
                            </Text>
                        </View>
                    ) : (
                        <View style={ms.contentArea}>
                            {/* Day tabs — fixed height, does NOT flex */}
                            <ScrollView
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                contentContainerStyle={ms.tabs}
                                style={ms.tabsRow}
                            >
                                {DAY_ORDER.map(day => {
                                    const active = activeDay === day;
                                    const has    = !!byDay[day];
                                    return (
                                        <TouchableOpacity
                                            key={day}
                                            onPress={() => setActiveDay(day)}
                                            style={[ms.tab, active && ms.tabActive, !has && ms.tabDim]}
                                        >
                                            <Text style={[ms.tabTxt, active && ms.tabTxtActive]}>
                                                {DAY_SHORT[day]}
                                            </Text>
                                            {has && <View style={[ms.tabDot, { backgroundColor: active ? '#FFF' : Colors.primary }]} />}
                                        </TouchableOpacity>
                                    );
                                })}
                            </ScrollView>

                            {/* Meal sections — takes all remaining space and scrolls */}
                            <ScrollView
                                style={ms.mealScroll}
                                showsVerticalScrollIndicator={false}
                                contentContainerStyle={ms.mealScrollContent}
                            >
                                {MEALS.map(meal => {
                                    const items: FoodItem[] = todayMeals[meal] || [];
                                    return (
                                        <View key={meal} style={ms.mealBox}>
                                            <View style={ms.mealHead}>
                                                <Text style={ms.mealEmoji}>{MEAL_EMOJI[meal]}</Text>
                                                <Text style={ms.mealTitle}>{meal}</Text>
                                                {items.length === 0 && (
                                                    <View style={ms.badge}>
                                                        <Text style={ms.badgeTxt}>Not set</Text>
                                                    </View>
                                                )}
                                            </View>
                                            {items.length > 0 ? (
                                                items.map((item, idx) => (
                                                    <View key={idx} style={ms.itemRow}>
                                                        {item.image ? (
                                                            <Image source={{ uri: item.image }} style={ms.itemImg} />
                                                        ) : (
                                                            <View style={ms.itemDot} />
                                                        )}
                                                        <View style={{ flex: 1 }}>
                                                            <Text style={ms.itemName}>{item.name}</Text>
                                                            {item.description ? <Text style={ms.itemDesc}>{item.description}</Text> : null}
                                                        </View>
                                                    </View>
                                                ))
                                            ) : (
                                                <Text style={ms.noItem}>Nothing listed for this meal</Text>
                                            )}
                                        </View>
                                    );
                                })}
                            </ScrollView>
                        </View>
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
    const [menuForRest, setMenuForRest] = useState<Restaurant | null>(null);

    useEffect(() => { fetchRestaurants(); }, []);

    const fetchRestaurants = async () => {
        try {
            const res  = await fetch(`${BASE_URL}/api/auth/restaurants`);
            const data = await res.json();
            if (res.ok) setRestaurants(data.filter((r: Restaurant) => r.kycStatus === 'approved'));
            else Alert.alert('Error', 'Could not load restaurants.');
        } catch { Alert.alert('Network Error', 'Check your connection.'); }
        finally  { setLoading(false); }
    };

    const handleConfirm = async () => {
        if (!selectedId) {
            Alert.alert('Select a Restaurant', 'Please choose your default mess first.');
            return;
        }
        setSubmitting(true);
        try {
            const res  = await fetch(`${BASE_URL}/api/payment/subscribe`, {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify({
                    studentId:           user._id,
                    planName:            plan.name,
                    price:               plan.priceNum,
                    defaultRestaurantId: selectedId,
                }),
            });
            const data = await res.json();
            if (res.ok) {
                setUser(data.student);
                Alert.alert('✅ Subscribed!', 'Your default mess is now set.', [
                    { text: 'Go to Dashboard', onPress: () => navigation.navigate('Main') },
                ]);
            } else {
                Alert.alert('Error', data.message || 'Subscription failed');
            }
        } catch { Alert.alert('Error', 'Network error. Please try again.'); }
        finally  { setSubmitting(false); }
    };

    const renderItem = ({ item }: { item: Restaurant }) => {
        const sel = selectedId === item._id;
        const name = item.restaurantName || item.name || 'Restaurant';
        return (
            <View style={[s.card, sel && s.cardSel]}>
                <View style={s.cardTop}>
                    <View style={{ flex: 1 }}>
                        <Text style={s.restName}>{name}</Text>
                        {item.address  ? <Text style={s.restSub}>📍 {item.address}</Text>  : null}
                        {item.location ? <Text style={s.restSub}>🗺️  {item.location}</Text> : null}
                    </View>
                    {sel && <View style={s.checkCircle}><Text style={{ color: '#FFF', fontSize: 14, fontWeight: '900' }}>✓</Text></View>}
                </View>

                <View style={s.cardActions}>
                    {/* View full weekly menu */}
                    <TouchableOpacity
                        style={s.menuBtn}
                        onPress={() => setMenuForRest(item)}
                    >
                        <Text style={s.menuBtnTxt}>📋 View Weekly Menu</Text>
                    </TouchableOpacity>

                    {/* Select / Deselect */}
                    <TouchableOpacity
                        style={[s.selBtn, sel && s.selBtnActive]}
                        onPress={() => setSelectedId(sel ? null : item._id)}
                    >
                        <Text style={[s.selBtnTxt, sel && s.selBtnTxtActive]}>
                            {sel ? 'Selected ✓' : 'Select'}
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    return (
        <>
            {/* ── Main content ── */}
            <SafeAreaView style={s.container} edges={['top']}>
                <Header title="SELECT DEFAULT MESS" showBack onBackPress={() => navigation.goBack()} />

                <View style={s.body}>
                    <Text style={s.stepLabel}>STEP 2 OF 2</Text>
                    <Text style={s.stepTitle}>Choose Your Default Mess</Text>
                    <Text style={s.stepDesc}>
                        Tap a card to explore the weekly menu before choosing.
                    </Text>
                </View>

                {loading ? (
                    <ActivityIndicator size="large" color={Colors.primary} style={{ flex: 1 }} />
                ) : (
                    <FlatList
                        data={restaurants}
                        keyExtractor={r => r._id}
                        renderItem={renderItem}
                        contentContainerStyle={s.list}
                        showsVerticalScrollIndicator={false}
                        ListEmptyComponent={
                            <View style={{ alignItems: 'center', paddingVertical: 60 }}>
                                <Text style={{ fontSize: 36 }}>🏪</Text>
                                <Text style={{ fontSize: 15, color: '#666', marginTop: 12 }}>No approved restaurants</Text>
                            </View>
                        }
                    />
                )}

                <View style={s.footer}>
                    <TouchableOpacity
                        style={[s.confirmBtn, !selectedId && s.confirmDisabled]}
                        onPress={handleConfirm}
                        disabled={submitting || !selectedId}
                    >
                        <Text style={s.confirmTxt}>
                            {submitting ? 'Activating…' : 'FINALIZE SUBSCRIPTION →'}
                        </Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>

            {/* ── Modal OUTSIDE SafeAreaView so Android doesn't clip it ── */}
            <WeeklyMenuSheet
                visible={!!menuForRest}
                restaurant={menuForRest}
                onClose={() => setMenuForRest(null)}
            />
        </>
    );
};

// ── Styles — main screen ──────────────────────────────────────────────────────
const s = StyleSheet.create({
    container:       { flex: 1, backgroundColor: '#FFF' },
    body:            { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
    stepLabel:       { fontSize: 10, fontWeight: '900', letterSpacing: 2, color: Colors.primary, marginBottom: 4 },
    stepTitle:       { fontSize: 20, fontWeight: '900', color: '#000', marginBottom: 6 },
    stepDesc:        { fontSize: 14, color: '#777', lineHeight: 20 },
    list:            { paddingHorizontal: 16, paddingBottom: 16 },

    card:            { backgroundColor: '#FFF', borderRadius: 12, borderWidth: 1.5, borderColor: '#EEE', padding: 16, marginBottom: 14, shadowColor: '#000', shadowOffset: { width:0, height:2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
    cardSel:         { borderColor: '#000', borderWidth: 2, backgroundColor: '#FAFAFA' },
    cardTop:         { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 14 },
    restName:        { fontSize: 17, fontWeight: '900', color: '#000', marginBottom: 4 },
    restSub:         { fontSize: 12, color: '#888', marginTop: 2 },
    checkCircle:     { width: 28, height: 28, borderRadius: 14, backgroundColor: '#000', alignItems: 'center', justifyContent: 'center', marginLeft: 8 },
    cardActions:     { flexDirection: 'row', gap: 10, borderTopWidth: 1, borderTopColor: '#F0F0F0', paddingTop: 12 },
    menuBtn:         { flex: 1, backgroundColor: '#F5F5F5', borderRadius: 8, paddingVertical: 9, alignItems: 'center' },
    menuBtnTxt:      { fontSize: 12, fontWeight: '700', color: '#444' },
    selBtn:          { flex: 1, backgroundColor: '#FFF', borderWidth: 1.5, borderColor: '#DDD', borderRadius: 8, paddingVertical: 9, alignItems: 'center' },
    selBtnActive:    { backgroundColor: '#000', borderColor: '#000' },
    selBtnTxt:       { fontSize: 12, fontWeight: '800', color: '#666', letterSpacing: 0.5 },
    selBtnTxtActive: { color: '#FFF' },

    footer:          { paddingHorizontal: 16, paddingBottom: 20, paddingTop: 8 },
    confirmBtn:      { backgroundColor: '#000', borderRadius: 10, paddingVertical: 18, alignItems: 'center' },
    confirmDisabled: { backgroundColor: '#CCC' },
    confirmTxt:      { color: '#FFF', fontSize: 14, fontWeight: '900', letterSpacing: 1.5 },
});

// ── Styles — modal sheet ──────────────────────────────────────────────────────
const ms = StyleSheet.create({
    overlay:          { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' },
    // Sheet: always opens at 62% of screen height, can grow up to 90%
    sheet:            { backgroundColor: '#FFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '90%', minHeight: SCREEN_HEIGHT * 0.62, flexShrink: 1 },
    handle:           { width: 40, height: 4, borderRadius: 2, backgroundColor: '#DDD', alignSelf: 'center', marginTop: 12, marginBottom: 4 },
    header:           { flexDirection: 'row', alignItems: 'flex-start', padding: 16, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
    restName:         { fontSize: 18, fontWeight: '900', color: '#000' },
    subtitle:         { fontSize: 12, color: '#888', marginTop: 2 },
    closeBtn:         { width: 32, height: 32, borderRadius: 16, backgroundColor: '#F5F5F5', alignItems: 'center', justifyContent: 'center', marginLeft: 8 },
    closeTxt:         { fontSize: 14, color: '#444', fontWeight: '700' },
    center:           { padding: 60, alignItems: 'center' },
    loadTxt:          { marginTop: 12, color: '#888', fontSize: 14 },
    emptyTitle:       { fontSize: 17, fontWeight: '800', color: '#444', marginTop: 12 },
    emptyDesc:        { fontSize: 13, color: '#888', textAlign: 'center', marginTop: 6, lineHeight: 20 },
    // contentArea fills whatever height remains inside the sheet after the header
    contentArea:      { flex: 1 },
    // The horizontal tabs row — fixed, does not grow
    tabsRow:          { flexGrow: 0, flexShrink: 0 },
    tabs:             { paddingHorizontal: 12, paddingVertical: 10, gap: 8 },
    tab:              { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: '#F3F3F3', alignItems: 'center' },
    tabActive:        { backgroundColor: Colors.primary },
    tabDim:           { opacity: 0.45 },
    tabTxt:           { fontSize: 12, fontWeight: '700', color: '#555' },
    tabTxtActive:     { color: '#FFF' },
    tabDot:           { width: 4, height: 4, borderRadius: 2, marginTop: 3 },
    // mealScroll takes all remaining space in contentArea so it scrolls properly
    mealScroll:       { flex: 1 },
    mealScrollContent:{ padding: 16, paddingBottom: 40 },
    mealBox:          { backgroundColor: '#FAFAFA', borderRadius: 12, padding: 14, marginBottom: 12 },
    mealHead:         { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 8 },
    mealEmoji:        { fontSize: 20 },
    mealTitle:        { fontSize: 15, fontWeight: '800', color: '#000', flex: 1 },
    badge:            { backgroundColor: '#FFF3E0', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
    badgeTxt:         { fontSize: 10, color: '#E65100', fontWeight: '700' },
    itemRow:          { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
    itemImg:          { width: 46, height: 46, borderRadius: 8, backgroundColor: '#EEE' },
    itemDot:          { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.primary, marginTop: 2 },
    itemName:         { fontSize: 14, fontWeight: '600', color: '#222' },
    itemDesc:         { fontSize: 12, color: '#888', marginTop: 1 },
    noItem:           { fontSize: 13, color: '#BBB', fontStyle: 'italic', paddingLeft: 4 },
});

export default RestaurantSelectionScreen;
