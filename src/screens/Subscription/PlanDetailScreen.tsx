import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform, Switch, Alert, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing, Typography } from '../../styles/theme';
import { useAuth } from '../../context/AuthContext';
import { API_BASE_URL } from '../../config';

const { width } = Dimensions.get('window');

const FeatureItem = ({ icon, title, desc }: { icon: string; title: string; desc: string }) => (
    <View style={styles.featureItem}>
        <Text style={styles.featureIcon}>{icon}</Text>
        <View style={styles.featureTextContent}>
            <Text style={styles.featureTitle}>{title.toUpperCase()}</Text>
            <Text style={styles.featureDesc}>{desc}</Text>
        </View>
    </View>
);

const PlanDetailScreen = ({ route, navigation }: any) => {
    const { plan } = route.params;
    const { user, setUser } = useAuth();
    const [loading, setLoading] = useState(false);
    
    // Subscribed state logic (mocking for UI demo if not actually in DB yet)
    const isSubscribed = user?.selectedPlan === plan.name;
    
    // Gold screen specific states
    const [takeaway, setTakeaway] = useState(false);
    
    // Silver countdown mock
    const [timeLeft, setTimeLeft] = useState(1800); // 30 mins
    useEffect(() => {
        if (plan.id === 'silver' && isSubscribed) {
            const timer = setInterval(() => setTimeLeft(prev => prev > 0 ? prev - 1 : 0), 1000);
            return () => clearInterval(timer);
        }
    }, [plan.id, isSubscribed]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };

    const handleSubscribe = async () => {
        const price = plan.priceNum;
        
        if ((user?.walletBalance || 0) < price) {
            const deficit = price - (user?.walletBalance || 0);
            Alert.alert(
                'INSUFFICIENT FUNDS',
                `You need ₹${deficit} more to subscribe to the ${plan.name} plan.`,
                [
                    { text: 'CANCEL', style: 'cancel' },
                    { text: 'ADD MONEY', onPress: () => navigation.navigate('AddMoney', { amount: deficit }) }
                ]
            );
            return;
        }

        // Before finalizing, user must choose their default restaurant
        navigation.navigate('RestaurantSelection', { plan });
    };

    const handleCancelSubscription = async () => {
        // Step 1 — fetch refund preview before asking for confirmation
        setLoading(true);
        let refundPreview: any = null;
        try {
            const res = await fetch(`${API_BASE_URL}/api/payment/refund-preview/${user._id}`);
            if (res.ok) refundPreview = (await res.json()).refund;
        } catch {
            // ignore preview failure, still allow cancellation
        } finally {
            setLoading(false);
        }

        // Build breakdown message
        const breakdownMsg = refundPreview
            ? `\n📊 Refund Breakdown:\n` +
              `  Subscription paid:       ₹${refundPreview.subscriptionPrice}\n` +
              `  Breakfast ×${refundPreview.mealBreakdown.Breakfast}:           -₹${refundPreview.mealBreakdown.Breakfast * 26}\n` +
              `  Lunch ×${refundPreview.mealBreakdown.Lunch}:              -₹${refundPreview.mealBreakdown.Lunch * 40}\n` +
              `  Dinner ×${refundPreview.mealBreakdown.Dinner}:             -₹${refundPreview.mealBreakdown.Dinner * 40}\n` +
              `  Early cancellation fee:  -₹${refundPreview.earlyCancellationCharge}\n` +
              `  ─────────────────────────\n` +
              `  💰 Refund to wallet:      ₹${refundPreview.refundAmount}`
            : '\n(Could not load refund preview)';

        Alert.alert(
            'CANCEL SUBSCRIPTION',
            `Are you sure you want to cancel?\n${breakdownMsg}\n\nThe refund will be credited to your wallet immediately.`,
            [
                { text: 'KEEP PLAN', style: 'cancel' },
                {
                    text: 'YES, CANCEL',
                    style: 'destructive',
                    onPress: async () => {
                        setLoading(true);
                        try {
                            const response = await fetch(`${API_BASE_URL}/api/payment/cancel-subscription`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ studentId: user._id })
                            });
                            const data = await response.json();
                            if (response.ok) {
                                setUser(data.student);
                                const r = data.refund;
                                Alert.alert(
                                    '✅ SUBSCRIPTION CANCELLED',
                                    `₹${r.refundAmount} has been credited to your wallet.\n\nNew wallet balance: ₹${r.newWalletBalance}`
                                );
                            } else {
                                Alert.alert('ERROR', data.message || 'Could not cancel at this time.');
                            }
                        } catch {
                            Alert.alert('ERROR', 'Something went wrong. Please try again.');
                        } finally {
                            setLoading(false);
                        }
                    }
                }
            ]
        );
    };

    const renderBasicContent = () => (
        <View style={styles.detailContainer}>
            <Text style={styles.detailLabel}>REQUEST LEAVE</Text>
            <Text style={styles.detailDesc}>Pause your plan for 5+ days to save credits.</Text>
            <View style={styles.calendarMock}>
                <View style={styles.calendarHeader}>
                    <Text style={styles.monthText}>OCTOBER 2026</Text>
                </View>
                <View style={styles.calendarGrid}>
                    {[...Array(31)].map((_, i) => (
                        <View 
                            key={i} 
                            style={[
                                styles.dayBox, 
                                i >= 15 && i <= 20 && styles.selectedDay
                            ]}
                        >
                            <Text style={[styles.dayText, i >= 15 && i <= 20 && styles.selectedDayText]}>{i + 1}</Text>
                        </View>
                    ))}
                </View>
            </View>
            <TouchableOpacity style={styles.actionBtn}>
                <Text style={styles.actionBtnText}>CONFIRM PAUSE</Text>
            </TouchableOpacity>
        </View>
    );

    const renderSilverContent = () => (
        <View style={styles.detailContainer}>
            <View style={styles.switcherHeader}>
                <View>
                    <Text style={styles.detailLabel}>RESTAURANT SWITCHER</Text>
                    <Text style={styles.detailDesc}>Choose your lunch location</Text>
                </View>
                <View style={styles.timerBox}>
                    <Text style={styles.timeLeft}>{formatTime(timeLeft)}</Text>
                    <Text style={styles.timerLabel}>REMAINING</Text>
                </View>
            </View>
            
            <View style={styles.mapMock}>
                <View style={styles.mapMarker}>
                    <Text style={styles.markerEmoji}>📍</Text>
                    <View style={styles.markerLabel}><Text style={styles.markerText}>DEFAULT</Text></View>
                </View>
                <View style={[styles.mapMarker, { top: 100, left: 200 }]}>
                    <Text style={styles.markerEmoji}>🏠</Text>
                    <View style={[styles.markerLabel, { backgroundColor: '#000' }]}><Text style={[styles.markerText, { color: '#FFF' }]}>SWITCH TO</Text></View>
                </View>
            </View>
            
            <View style={styles.tasteInsight}>
                <Text style={styles.insightIcon}>✨</Text>
                <Text style={styles.insightText}>Your default has <Text style={styles.bold}>Dal</Text>, but Partner B has <Text style={styles.bold}>Butter Chicken</Text> — Switch now?</Text>
            </View>
        </View>
    );

    const renderGoldContent = () => (
        <View style={styles.detailContainer}>
            <View style={styles.goldHeader}>
                <Text style={styles.detailLabel}>PREMIUM DASHBOARD</Text>
                <TouchableOpacity style={styles.cancelBtn}>
                    <Text style={styles.cancelBtnText}>CANCEL MEAL</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.toggleRow}>
                <View>
                    <Text style={styles.toggleTitle}>TAKEAWAY PACKING</Text>
                    <Text style={styles.toggleSub}>Ready for pickup on arrival</Text>
                </View>
                <Switch 
                    value={takeaway} 
                    onValueChange={setTakeaway}
                    trackColor={{ false: '#EEE', true: '#000' }}
                    thumbColor={takeaway ? '#FFF' : '#FFF'}
                />
            </View>

            <View style={styles.qrContainer}>
                <Text style={styles.qrLabel}>PRIORITY ACCESS QR</Text>
                <View style={styles.qrMock}>
                    <View style={styles.qrInner}>
                        <View style={styles.qrBlock} />
                        <Text style={styles.qrPriorityText}>GOLD PRIORITY</Text>
                    </View>
                </View>
                <Text style={styles.qrDesc}>Scan this at the 'Priority Lane' to skip the queue.</Text>
            </View>
        </View>
    );

    const renderSelectionContent = () => (
        <View style={styles.selectionContainer}>
            <View style={styles.featuresList}>
                {plan.id === 'basic' && (
                    <>
                        <FeatureItem icon="📅" title="5-Day Absence Rule" desc="Advance notify for 5+ days and save your credits." />
                        <FeatureItem icon="⏸️" title="The Weekend Pause" desc="Save Sat/Sun credits for next month's renewal." />
                    </>
                )}
                {plan.id === 'silver' && (
                    <>
                        <FeatureItem icon="📍" title="30-Min Cutoff" desc="Switch your mess before the buzzer sounds." />
                        <FeatureItem icon="✨" title="Taste Matching" desc="Intelligent suggestions based on today's specials." />
                    </>
                )}
                {plan.id === 'gold' && (
                    <>
                        <FeatureItem icon="🔄" title="Unlimited Switching" desc="No limits. Change your mess anytime before cutoff." />
                        <FeatureItem icon="🚫" title="Full Cancellation" desc="Can't make it? Get refund/credit for skipped meals." />
                        <FeatureItem icon="📦" title="Takeaway Packing" desc="Not eating in? Have it packed and ready." />
                        <FeatureItem icon="⚡" title="Priority Lane" desc="Minimize waiting time with Priority QR scan." />
                    </>
                )}
            </View>

            <TouchableOpacity 
                style={styles.subscribeBtn} 
                onPress={handleSubscribe}
                disabled={loading}
            >
                <Text style={styles.subscribeBtnText}>{loading ? 'PROCESSING...' : 'SUBSCRIBE NOW'}</Text>
            </TouchableOpacity>
        </View>
    );

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.navigation}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Text style={styles.backIcon}>←</Text>
                </TouchableOpacity>
                <Text style={styles.navTitle}>DETAILS</Text>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.hero}>
                    <Text style={styles.heroName}>{plan.name.toUpperCase()}</Text>
                    <Text style={styles.heroFullName}>{plan.fullName.toUpperCase()}</Text>
                    <View style={styles.priceTag}>
                        <Text style={styles.heroPrice}>₹{plan.price}</Text>
                        <Text style={styles.heroPerMonth}>/MONTH</Text>
                    </View>
                </View>

                {isSubscribed ? (
                    <>
                        {plan.id === 'basic' && renderBasicContent()}
                        {plan.id === 'silver' && renderSilverContent()}
                        {plan.id === 'gold' && renderGoldContent()}
                    </>
                ) : (
                    renderSelectionContent()
                )}

                {isSubscribed && (
                    <TouchableOpacity 
                        style={styles.cancelSubBtn} 
                        onPress={handleCancelSubscription}
                        disabled={loading}
                    >
                        <Text style={styles.cancelSubBtnText}>{loading ? 'WAIT...' : 'CANCEL SUBSCRIPTION'}</Text>
                    </TouchableOpacity>
                )}

                <View style={[styles.brandingFooter, isSubscribed && {marginTop: 20}]}>
                    <Text style={styles.brandingText}>BORING EDUCATION</Text>
                    <Text style={styles.brandingSub}>PREPAID MEAL NETWORK</Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFF',
    },
    navigation: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        height: 60,
    },
    backBtn: {
        width: 40,
        height: 40,
        justifyContent: 'center',
    },
    backIcon: {
        fontSize: 24,
        color: '#000',
    },
    navTitle: {
        fontSize: 10,
        fontWeight: '900',
        letterSpacing: 2,
        color: '#000',
        flex: 1,
        textAlign: 'center',
        marginRight: 40,
    },
    hero: {
        paddingHorizontal: 24,
        paddingTop: 20,
        paddingBottom: 40,
        borderBottomWidth: 1,
        borderBottomColor: '#EEE',
    },
    heroName: {
        fontSize: 64,
        fontWeight: '900',
        letterSpacing: -2,
        color: '#000',
    },
    heroFullName: {
        fontSize: 14,
        fontWeight: '700',
        color: '#666',
        letterSpacing: 1,
        marginTop: -5,
    },
    priceTag: {
        flexDirection: 'row',
        alignItems: 'baseline',
        marginTop: 20,
    },
    heroPrice: {
        fontSize: 24,
        fontWeight: '900',
        color: '#000',
    },
    heroPerMonth: {
        fontSize: 12,
        fontWeight: '400',
        color: '#666',
        marginLeft: 4,
    },
    selectionContainer: {
        padding: 24,
    },
    featuresList: {
        gap: 30,
        marginBottom: 60,
    },
    featureItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    featureIcon: {
        fontSize: 24,
        marginRight: 16,
        marginTop: 2,
    },
    featureTextContent: {
        flex: 1,
    },
    featureTitle: {
        fontSize: 14,
        fontWeight: '900',
        color: '#000',
        marginBottom: 4,
    },
    featureDesc: {
        fontSize: 13,
        color: '#666',
        lineHeight: 18,
    },
    subscribeBtn: {
        backgroundColor: '#000',
        paddingVertical: 20,
        borderRadius: 2,
        alignItems: 'center',
    },
    subscribeBtnText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '900',
        letterSpacing: 2,
    },
    detailContainer: {
        padding: 24,
    },
    detailLabel: {
        fontSize: 12,
        fontWeight: '900',
        letterSpacing: 1.5,
        color: '#000',
        marginBottom: 8,
    },
    detailDesc: {
        fontSize: 13,
        color: '#666',
        marginBottom: 20,
    },
    calendarMock: {
        backgroundColor: '#F9F9F9',
        padding: 15,
        borderRadius: 2,
        borderWidth: 1,
        borderColor: '#EEE',
    },
    calendarHeader: {
        alignItems: 'center',
        paddingBottom: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#EEE',
        marginBottom: 15,
    },
    monthText: {
        fontSize: 10,
        fontWeight: '900',
        letterSpacing: 1,
    },
    calendarGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'flex-start',
    },
    dayBox: {
        width: (width - 110) / 7,
        height: 35,
        justifyContent: 'center',
        alignItems: 'center',
        margin: 2,
    },
    dayText: {
        fontSize: 11,
        color: '#AAA',
    },
    selectedDay: {
        backgroundColor: '#000',
    },
    selectedDayText: {
        color: '#FFF',
        fontWeight: '900',
    },
    actionBtn: {
        marginTop: 20,
        backgroundColor: '#000',
        paddingVertical: 15,
        borderRadius: 2,
        alignItems: 'center',
    },
    actionBtnText: {
        color: '#FFF',
        fontSize: 12,
        fontWeight: '900',
        letterSpacing: 1,
    },
    switcherHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    timerBox: {
        backgroundColor: '#000',
        padding: 10,
        borderRadius: 2,
        alignItems: 'center',
        minWidth: 80,
    },
    timeLeft: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: '900',
        fontVariant: ['tabular-nums'],
    },
    timerLabel: {
        color: '#666',
        fontSize: 8,
        fontWeight: '900',
        marginTop: 2,
    },
    mapMock: {
        height: 250,
        backgroundColor: '#F5F5F5',
        borderRadius: 2,
        borderWidth: 1,
        borderColor: '#EEE',
        overflow: 'hidden',
        position: 'relative',
        marginTop: 10,
    },
    mapMarker: {
        position: 'absolute',
        top: 60,
        left: 50,
        alignItems: 'center',
    },
    markerEmoji: {
        fontSize: 32,
    },
    markerLabel: {
        backgroundColor: '#FFF',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 2,
        borderWidth: 1,
        borderColor: '#DDD',
        marginTop: 4,
    },
    markerText: {
        fontSize: 8,
        fontWeight: '900',
    },
    tasteInsight: {
        marginTop: 24,
        flexDirection: 'row',
        backgroundColor: '#F9F9F9',
        padding: 16,
        borderRadius: 2,
        alignItems: 'center',
    },
    insightIcon: {
        fontSize: 20,
        marginRight: 12,
    },
    insightText: {
        flex: 1,
        fontSize: 12,
        color: '#444',
        lineHeight: 18,
    },
    bold: {
        fontWeight: '900',
    },
    goldHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 30,
    },
    cancelBtn: {
        borderWidth: 1,
        borderColor: '#000',
        paddingHorizontal: 12,
        paddingVertical: 8,
    },
    cancelBtnText: {
        fontSize: 10,
        fontWeight: '900',
    },
    toggleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#EEE',
        paddingBottom: 20,
        marginBottom: 30,
    },
    toggleTitle: {
        fontSize: 14,
        fontWeight: '900',
    },
    toggleSub: {
        fontSize: 12,
        color: '#666',
    },
    qrContainer: {
        alignItems: 'center',
        paddingTop: 10,
    },
    qrLabel: {
        fontSize: 10,
        fontWeight: '900',
        letterSpacing: 2,
        marginBottom: 20,
    },
    qrMock: {
        width: 200,
        height: 200,
        borderWidth: 10,
        borderColor: '#000',
        padding: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    qrInner: {
        width: '100%',
        height: '100%',
        backgroundColor: '#000',
        justifyContent: 'center',
        alignItems: 'center',
    },
    qrBlock: {
        width: 80,
        height: 80,
        borderWidth: 2,
        borderColor: '#FFF',
        marginBottom: 10,
    },
    qrPriorityText: {
        color: '#FFF',
        fontSize: 10,
        fontWeight: '900',
        letterSpacing: 3,
    },
    qrDesc: {
        marginTop: 20,
        fontSize: 11,
        color: '#666',
        textAlign: 'center',
    },
    brandingFooter: {
        padding: 40,
        alignItems: 'center',
        opacity: 0.1,
    },
    brandingText: {
        fontSize: 14,
        fontWeight: '900',
        letterSpacing: 4,
    },
    brandingSub: {
        fontSize: 8,
        fontWeight: '700',
        letterSpacing: 2,
        marginTop: 4,
    },
    cancelSubBtn: {
        marginTop: 40,
        marginHorizontal: 24,
        paddingVertical: 15,
        borderWidth: 1,
        borderColor: '#EEE',
        alignItems: 'center',
    },
    cancelSubBtnText: {
        fontSize: 10,
        fontWeight: '900',
        color: '#F44336',
        letterSpacing: 1,
    },
});

export default PlanDetailScreen;
