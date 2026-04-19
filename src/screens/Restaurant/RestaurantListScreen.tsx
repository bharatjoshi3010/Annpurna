import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, SafeAreaView, TextInput, Platform, ActivityIndicator } from 'react-native';
import { Colors, Spacing, Typography } from '../../styles/theme';
import Header from '../../components/Header';
import RestaurantCard from '../../components/RestaurantCard';

// Removed hardcoded RESTAURANTS array to ensure only database content is shown.

const RestaurantListScreen = ({ navigation }: any) => {
    const [restaurants, setRestaurants] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [selectedId, setSelectedId] = useState('');

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
                            onPress={() => setSelectedId(item._id)}
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
});

export default RestaurantListScreen;
