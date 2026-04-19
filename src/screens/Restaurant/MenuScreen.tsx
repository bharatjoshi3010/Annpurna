import React from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, Image, ActivityIndicator } from 'react-native';
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
    const { mealType, restaurantId, restaurantName } = route?.params || {};
    const [menuItems, setMenuItems] = React.useState<any[]>([]);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        if (restaurantId) {
            fetchMenu();
        }
    }, [restaurantId, mealType]);

    const fetchMenu = async () => {
        try {
            const baseUrl = Platform.OS === 'android' ? 'http://10.0.2.2:5000' : 'http://localhost:5000';
            // Passing date as today to get current menu (weekly routine or single specific)
            const response = await fetch(`${baseUrl}/api/menu/${restaurantId}?date=${new Date().toISOString()}`);
            const data = await response.json();
            if (response.ok) {
                // Find items for this specific mealType
                const mealMenu = data.find((m: any) => m.mealType === mealType);
                setMenuItems(mealMenu ? mealMenu.items : []);
            }
        } catch (error) {
            console.error('Error fetching menu:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <Header title={`${mealType} Menu`} showBack onBackPress={() => navigation.goBack()} />

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                <View style={styles.restaurantHeader}>
                    <View style={styles.restaurantInfo}>
                        <Text style={Typography.h2}>{restaurantName || 'Restaurant Menu'}</Text>
                        <Text style={Typography.caption}>Healthy • Fresh • Today's Special</Text>
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={[Typography.h3, styles.sectionTitle]}>Meal Items</Text>
                    {loading ? (
                        <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 20 }} />
                    ) : menuItems.length === 0 ? (
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyText}>No special menu items listed for this meal yet.</Text>
                        </View>
                    ) : (
                        menuItems.map((item, index) => (
                            <View key={index} style={styles.menuItem}>
                                <View style={styles.menuItemInfo}>
                                    <Text style={styles.itemName}>{item.name}</Text>
                                    <Text style={styles.itemCategory}>{mealType} Special</Text>
                                </View>
                                <Text style={styles.itemEmoji}>🍲</Text>
                            </View>
                        ))
                    )}
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
