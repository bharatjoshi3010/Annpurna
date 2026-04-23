import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Platform, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing, Typography, BorderRadius } from '../../styles/theme';
import Header from '../../components/Header';
import { useAuth } from '../../context/AuthContext';

const RestaurantSelectionScreen = ({ route, navigation }: any) => {
    const { plan } = route.params;
    const { user, setUser } = useAuth();
    const [restaurants, setRestaurants] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [selectedId, setSelectedId] = useState<string | null>(null);

    useEffect(() => {
        fetchRestaurants();
    }, []);

    const fetchRestaurants = async () => {
        try {
            const baseUrl = Platform.OS === 'android' ? 'http://10.0.2.2:5000' : 'http://localhost:5000';
            // Public endpoint — no auth token needed
            const response = await fetch(`${baseUrl}/api/auth/restaurants`);
            const data = await response.json();
            if (response.ok) {
                // Only show KYC-approved restaurants
                const approved = data.filter((r: any) => r.kycStatus === 'approved');
                setRestaurants(approved);
            } else {
                Alert.alert('Error', 'Could not load restaurants. Please try again.');
            }
        } catch (error) {
            console.error('Error fetching restaurants:', error);
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
            const baseUrl = Platform.OS === 'android' ? 'http://10.0.2.2:5000' : 'http://localhost:5000';
            const response = await fetch(`${baseUrl}/api/payment/subscribe`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    studentId: user._id,
                    planName: plan.name,
                    price: plan.priceNum,
                    defaultRestaurantId: selectedId
                })
            });
            const data = await response.json();
            if (response.ok) {
                setUser(data.student);
                Alert.alert('SUCCESS', 'Subscription activated! Your default mess is now set.', [
                    { text: 'GO TO DASHBOARD', onPress: () => navigation.navigate('Main') }
                ]);
            } else {
                Alert.alert('ERROR', data.message || 'Subscription failed');
            }
        } catch (error) {
            Alert.alert('ERROR', 'Network error occurred. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    const EmptyState = () => (
        <View style={{ alignItems: 'center', paddingVertical: 40 }}>
            <Text style={{ fontSize: 32, marginBottom: 12 }}>🏪</Text>
            <Text style={{ fontSize: 15, color: '#888', textAlign: 'center' }}>
                No approved restaurants available yet.
            </Text>
            <Text style={{ fontSize: 13, color: '#aaa', textAlign: 'center', marginTop: 4 }}>
                Please check back soon.
            </Text>
        </View>
    );

    const renderRestaurantItem = ({ item }: { item: any }) => (
        <TouchableOpacity
            style={[
                styles.restaurantCard,
                selectedId === item._id && styles.selectedCard
            ]}
            onPress={() => setSelectedId(item._id)}
        >
            <View style={styles.cardHeader}>
                <View style={styles.resInfo}>
                    <Text style={styles.resName}>{item.restaurantName || item.name}</Text>
                    <Text style={styles.resAddress}>{item.address}</Text>
                </View>
                {selectedId === item._id && <Text style={styles.checkIcon}>✅</Text>}
            </View>
            <TouchableOpacity
                style={styles.viewMenuBtn}
                onPress={() => navigation.navigate('Menu', {
                    restaurantId: item._id,
                    restaurantName: item.restaurantName || item.name
                })}
            >
                <Text style={styles.viewMenuText}>VIEW TODAY'S MENU</Text>
            </TouchableOpacity>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <Header title="SELECT DEFAULT MESS" showBack onBackPress={() => navigation.goBack()} />

            <View style={styles.content}>
                <View style={styles.stepHeader}>
                    <Text style={styles.stepTitle}>STEP 2: CHOOSE YOUR MESS</Text>
                    <Text style={styles.stepDesc}>Pick your primary dining location for the {plan.name} plan.</Text>
                </View>

                {loading ? (
                    <ActivityIndicator size="large" color="#000" style={{ marginTop: 50 }} />
                ) : (
                    <FlatList
                        data={restaurants}
                        keyExtractor={(item) => item._id}
                        renderItem={renderRestaurantItem}
                        contentContainerStyle={styles.listContent}
                        showsVerticalScrollIndicator={false}
                        ListEmptyComponent={<EmptyState />}
                    />
                )}

                <TouchableOpacity
                    style={[styles.confirmBtn, !selectedId && styles.disabledBtn]}
                    onPress={handleConfirmSelection}
                    disabled={submitting || !selectedId}
                >
                    <Text style={styles.confirmBtnText}>
                        {submitting ? 'ACTIVATING PLAN...' : 'FINALIZE SUBSCRIPTION'}
                    </Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFF',
    },
    content: {
        flex: 1,
        padding: 20,
    },
    stepHeader: {
        marginBottom: 24,
    },
    stepTitle: {
        fontSize: 12,
        fontWeight: '900',
        letterSpacing: 1.5,
        color: '#000',
    },
    stepDesc: {
        fontSize: 16,
        color: '#666',
        marginTop: 4,
        lineHeight: 22,
    },
    listContent: {
        paddingBottom: 20,
    },
    restaurantCard: {
        backgroundColor: '#FFF',
        borderRadius: 2,
        borderWidth: 1,
        borderColor: '#EEE',
        padding: 16,
        marginBottom: 16,
    },
    selectedCard: {
        borderColor: '#000',
        borderWidth: 2,
        backgroundColor: '#F9F9F9',
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    resInfo: {
        flex: 1,
    },
    resName: {
        fontSize: 18,
        fontWeight: '900',
        color: '#000',
    },
    resAddress: {
        fontSize: 12,
        color: '#666',
        marginTop: 4,
    },
    checkIcon: {
        fontSize: 20,
    },
    viewMenuBtn: {
        marginTop: 16,
        paddingVertical: 8,
        borderTopWidth: 1,
        borderTopColor: '#EEE',
    },
    viewMenuText: {
        fontSize: 10,
        fontWeight: '900',
        color: '#000',
        letterSpacing: 1,
    },
    confirmBtn: {
        backgroundColor: '#000',
        paddingVertical: 20,
        borderRadius: 2,
        alignItems: 'center',
        marginTop: 10,
    },
    disabledBtn: {
        backgroundColor: '#CCC',
    },
    confirmBtnText: {
        color: '#FFF',
        fontSize: 14,
        fontWeight: '900',
        letterSpacing: 2,
    },
});

export default RestaurantSelectionScreen;
