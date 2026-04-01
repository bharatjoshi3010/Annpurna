import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, SafeAreaView, TextInput } from 'react-native';
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
    const [search, setSearch] = useState('');
    const [selectedId, setSelectedId] = useState('2');

    const filteredRestaurants = RESTAURANTS.filter(r =>
        r.name.toLowerCase().includes(search.toLowerCase())
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

            <FlatList
                data={filteredRestaurants}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <RestaurantCard
                        name={item.name}
                        cuisine={item.cuisine}
                        rating={item.rating}
                        isSelected={item.id === selectedId}
                        onPress={() => setSelectedId(item.id)}
                    />
                )}
                contentContainerStyle={styles.listContent}
                ListHeaderComponent={
                    <View style={styles.listHeader}>
                        <Text style={Typography.body}>Choose where you want to have your next meal.</Text>
                    </View>
                }
            />
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
