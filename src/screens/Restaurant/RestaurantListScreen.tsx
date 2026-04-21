import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, Platform, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing, Typography } from '../../styles/theme';
import Header from '../../components/Header';
import RestaurantCard from '../../components/RestaurantCard';
import AppButton from '../../components/AppButton';
import { useAuth } from '../../context/AuthContext';

// Removed hardcoded RESTAURANTS array to ensure only database content is shown.

const RestaurantListScreen = ({ navigation, route }: any) => {
    const { user } = useAuth();
    const [restaurants, setRestaurants] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [bookingLoading, setBookingLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [selectedId, setSelectedId] = useState('');
    const purpose = route.params?.purpose;

    useEffect(() => {
        fetchRestaurants();
    }, []);

    const fetchRestaurants = async () => {
        try {
            const baseUrl = Platform.OS === 'android' ? 'http://10.0.2.2:5000' : 'http://localhost:5000';
            const response = await fetch(`${baseUrl}/api/auth/restaurants`);
            const data = await response.json();
            if (response.ok) {
                setRestaurants(data);
                if (data.length > 0) setSelectedId(data[0]._id);
            }
        } catch (error) {
            console.error('Error fetching restaurants:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredRestaurants = restaurants
        .filter(r =>
            (r.restaurantName || '').toLowerCase().includes(search.toLowerCase()) || 
            (r.ownerName || '').toLowerCase().includes(search.toLowerCase())
        )
        .sort((a, b) => {
            if (a.kycStatus === 'approved' && b.kycStatus !== 'approved') return -1;
            if (a.kycStatus !== 'approved' && b.kycStatus === 'approved') return 1;
            return 0;
        });

    const handleBooking = async () => {
        if (!selectedId) {
            Alert.alert('Selection Required', 'Please select a restaurant first.');
            return;
        }

        const mealType = route.params?.mealType || 'Lunch'; // Default to Lunch if not provided

        setBookingLoading(true);
        try {
            const baseUrl = Platform.OS === 'android' ? 'http://10.0.2.2:5000' : 'http://localhost:5000';
            
            const response = await fetch(`${baseUrl}/api/meals/book`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    studentId: user._id,
                    restaurantId: selectedId,
                    mealType
                })
            });

            if (response.ok) {
                Alert.alert('Success', `Meal booked successfully for ${mealType}!`);
                navigation.navigate('Main');
            } else {
                const errorData = await response.json();
                Alert.alert('Error', errorData.message || 'Failed to book meal.');
            }
        } catch (error) {
            console.error('Error booking meal:', error);
            Alert.alert('Error', 'Something went wrong. Please try again.');
        } finally {
            setBookingLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <Header title="Select Restaurant" showBack onBackPress={() => navigation.goBack()} />

            <View style={styles.searchContainer}>
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search restaurants..."
                    value={search}
                    onChangeText={setSearch}
                />
            </View>

            <View style={{ flex: 1 }}>
                {loading ? (
                    <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: Spacing.xl }} />
                ) : (
                    <FlatList
                        data={filteredRestaurants}
                        keyExtractor={(item) => item._id}
                        renderItem={({ item }) => (
                            <RestaurantCard
                                name={item.restaurantName || 'Unknown Restaurant'}
                                cuisine={item.specifications || 'Multi-cuisine'}
                                rating={item.rating || 4.5}
                                isSelected={item._id === selectedId}
                                kycStatus={item.kycStatus}
                                onPress={() => {
                                    if (purpose === 'viewMenu') {
                                        navigation.navigate('Menu', { 
                                            restaurantId: item._id, 
                                            restaurantName: item.restaurantName,
                                            mealType: route.params?.mealType || 'Lunch'
                                        });
                                    } else {
                                        setSelectedId(item._id);
                                    }
                                }}
                            />
                        )}
                        contentContainerStyle={styles.listContent}
                        ListEmptyComponent={
                            <View style={styles.emptyContainer}>
                                <Text style={styles.emptyText}>No restaurants found in our network yet.</Text>
                            </View>
                        }
                        ListHeaderComponent={
                            <View style={styles.listHeader}>
                                <Text style={Typography.body}>Choose where you want to have your next meal.</Text>
                            </View>
                        }
                    />
                )}
            </View>

            {purpose !== 'viewMenu' && (
                <View style={styles.footer}>
                    <AppButton
                        title={bookingLoading ? "Booking..." : "Confirm Booking"}
                        onPress={handleBooking}
                        disabled={!selectedId || bookingLoading}
                    />
                </View>
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    searchContainer: {
        padding: Spacing.md,
        backgroundColor: Colors.white,
    },
    searchInput: {
        height: 48,
        backgroundColor: '#F5F5F5',
        borderRadius: 12,
        paddingHorizontal: Spacing.md,
        fontSize: 16,
    },
    listContent: {
        padding: Spacing.md,
    },
    listHeader: {
        marginBottom: Spacing.md,
    },
    emptyContainer: {
        padding: 40,
        alignItems: 'center',
    },
    emptyText: {
        fontSize: 16,
        color: Colors.textLight,
        textAlign: 'center',
    },
    footer: {
        padding: Spacing.md,
        backgroundColor: Colors.white,
        borderTopWidth: 1,
        borderTopColor: Colors.border,
    },
});

export default RestaurantListScreen;
