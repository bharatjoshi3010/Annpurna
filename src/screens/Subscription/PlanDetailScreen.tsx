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
    
    // Standard countdown mock
    const [timeLeft, setTimeLeft] = useState(1800); // 30 mins
    useEffect(() => {
        if (plan.id === 'standard' && isSubscribed) {
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
            <Text style={styles.detailLabel}>PLAN DASHBOARD</Text>
            <Text style={styles.detailDesc}>Enjoy your essential meal services.</Text>
            <View style={styles.tasteInsight}>
                <Text style={styles.insightIcon}>✨</Text>
                <Text style={styles.insightText}>Everything is running smoothly. Check your notifications for timing updates!</Text>
            </View>
        </View>
    );

    const renderStandardContent = () => (
        <View style={styles.detailContainer}>
            <Text style={styles.detailLabel}>PLAN DASHBOARD</Text>
            <Text style={styles.detailDesc}>Switch your mess location with ease.</Text>
            <View style={styles.tasteInsight}>
                <Text style={styles.insightIcon}>✨</Text>
                <Text style={styles.insightText}>You can change your restaurant for any meal before the cutoff time. Enjoy your flexibility!</Text>
            </View>
        </View>
    );

    const renderPremiumContent = () => (
        <View style={styles.detailContainer}>
            <Text style={styles.detailLabel}>PLAN DASHBOARD</Text>
            <Text style={styles.detailDesc}>Premium access and full meal control.</Text>
            
            <View style={styles.tasteInsight}>
                <Text style={styles.insightIcon}>👑</Text>
                <Text style={styles.insightText}>Premium status active. You have full control over your meals and switching preferences.</Text>
            </View>
        </View>
    );

    const renderSelectionContent = () => (
        <View style={styles.selectionContainer}>
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

                <View style={styles.featuresListSection}>
                    <Text style={styles.sectionTitle}>PLAN FEATURES</Text>
                    <View style={styles.featuresList}>
                        {plan.features && plan.features.map((feature: string, index: number) => (
                            <FeatureItem key={index} icon="✅" title={feature} desc="Included in your plan." />
                        ))}
                    </View>
                </View>

                {isSubscribed ? (
                    <>
                        {plan.id === 'basic' && renderBasicContent()}
                        {plan.id === 'standard' && renderStandardContent()}
                        {plan.id === 'premium' && renderPremiumContent()}
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
                    <Text style={styles.brandingText}>ANNPURNA</Text>
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
        marginBottom: 20,
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
    featuresListSection: {
        padding: 24,
        borderBottomWidth: 1,
        borderBottomColor: '#EEE',
    },
    sectionTitle: {
        fontSize: 10,
        fontWeight: '900',
        letterSpacing: 2,
        color: '#999',
        marginBottom: 30,
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
