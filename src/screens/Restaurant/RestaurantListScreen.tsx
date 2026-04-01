import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, SafeAreaView, TextInput, Platform, ActivityIndicator } from 'react-native';
import { Colors, Spacing, Typography } from '../../styles/theme';
import Header from '../../components/Header';
import RestaurantCard from '../../components/RestaurantCard';

const RESTAURANTS = [
    { id: '1', name: 'Sunrise Café', cuisine: 'North Indian, Continental', rating: 4.5 },
    { id: '2', name: 'The Green Plate', cuisine: 'Pure Veg, Healthy', rating: 4.8 },
    { id: '3', name: 'Spicy Junction', cuisine: 'South Indian, Street Food', rating: 4.2 },
    { id: '4', name: 'Campus Cloud', cuisine: 'Chinese, fast Food', rating: 4.0 },
    { id: '5', name: 'Student Hub', cuisine: 'Regional, Homestyle', rating: 4.6 },
];

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

    const filteredRestaurants = (restaurants.length > 0 ? restaurants : RESTAURANTS).filter(r =>
        (r.restaurantName || r.name).toLowerCase().includes(search.toLowerCase())
    );

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
                    keyExtractor={(item) => item._id || item.id}
                    renderItem={({ item }) => (
                        <RestaurantCard
                            name={item.restaurantName || item.name}
                            cuisine={item.specifications || item.cuisine || 'Multi-cuisine'}
                            rating={item.rating || 4.5}
                            isSelected={(item._id || item.id) === selectedId}
                            onPress={() => setSelectedId(item._id || item.id)}
                        />
                    )}
                    contentContainerStyle={styles.listContent}
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
});

export default RestaurantListScreen;
