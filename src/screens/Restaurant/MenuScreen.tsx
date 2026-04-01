import React from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, Image } from 'react-native';
import { Colors, Spacing, Typography, BorderRadius } from '../../styles/theme';
import Header from '../../components/Header';

const MENU_ITEMS = [
    { id: '1', name: 'Paneer Butter Masala', category: 'Main Course', price: 120, featured: true },
    { id: '2', name: 'Dal Tadka', category: 'Main Course', price: 90, featured: false },
    { id: '3', name: 'Butter Naan (2 pcs)', category: 'Bread', price: 40, featured: true },
    { id: '4', name: 'Mixed Veg Curry', category: 'Main Course', price: 100, featured: false },
    { id: '5', name: 'Jeera Rice', category: 'Rice', price: 70, featured: false },
    { id: '6', name: 'Gulab Jamun (2 pcs)', category: 'Dessert', price: 50, featured: true },
];

const MenuScreen = ({ navigation, route }: any) => {
    const mealType = route?.params?.mealType || 'Meal';

    return (
        <SafeAreaView style={styles.container}>
            <Header title={`${mealType} Menu`} showBack onBackPress={() => navigation.goBack()} />

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                <View style={styles.restaurantHeader}>
                    <View style={styles.restaurantInfo}>
                        <Text style={Typography.h2}>The Green Plate</Text>
                        <Text style={Typography.caption}>Pure Veg • Healthy • 4.8 ★</Text>
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={[Typography.h3, styles.sectionTitle]}>Featured Dishes</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.featuredContainer}>
                        {MENU_ITEMS.filter(item => item.featured).map(item => (
                            <View key={item.id} style={styles.featuredCard}>
                                <View style={styles.featuredImagePlaceholder}>
                                    <Text style={styles.featuredEmoji}>🍛</Text>
                                </View>
                                <Text style={styles.featuredName}>{item.name}</Text>
                                <Text style={styles.featuredPrice}>₹{item.price}</Text>
                            </View>
                        ))}
                    </ScrollView>
                </View>

                <View style={styles.section}>
                    <Text style={[Typography.h3, styles.sectionTitle]}>Full Menu</Text>
                    {MENU_ITEMS.map(item => (
                        <View key={item.id} style={styles.menuItem}>
                            <View style={styles.menuItemInfo}>
                                <Text style={styles.itemName}>{item.name}</Text>
                                <Text style={styles.itemCategory}>{item.category}</Text>
                            </View>
                            <Text style={styles.itemPrice}>₹{item.price}</Text>
                        </View>
                    ))}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    scrollContent: {
        paddingBottom: Spacing.xl,
    },
    restaurantHeader: {
        backgroundColor: Colors.white,
        padding: Spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    restaurantInfo: {},
    section: {
        padding: Spacing.md,
        marginTop: Spacing.sm,
    },
    sectionTitle: {
        marginBottom: Spacing.md,
    },
    featuredContainer: {
        flexDirection: 'row',
    },
    featuredCard: {
        backgroundColor: Colors.white,
        width: 140,
        borderRadius: BorderRadius.md,
        padding: Spacing.sm,
        marginRight: Spacing.md,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    featuredImagePlaceholder: {
        height: 80,
        backgroundColor: Colors.secondary,
        borderRadius: BorderRadius.sm,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    featuredEmoji: {
        fontSize: 32,
    },
    featuredName: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.text,
    },
    featuredPrice: {
        fontSize: 12,
        color: Colors.primary,
        fontWeight: '700',
        marginTop: 2,
    },
    menuItem: {
        backgroundColor: Colors.white,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: Spacing.md,
        borderRadius: BorderRadius.md,
        marginBottom: Spacing.sm,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.05)',
    },
    menuItemInfo: {},
    itemName: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.text,
    },
    itemCategory: {
        fontSize: 12,
        color: Colors.textLight,
    },
    itemPrice: {
        fontSize: 14,
        fontWeight: '700',
        color: Colors.text,
    },
});

export default MenuScreen;
