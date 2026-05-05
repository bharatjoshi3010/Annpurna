import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Platform, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing, Typography, BorderRadius } from '../../../styles/theme';
import Header from '../../../components/Header';
import { useAuth } from '../../../context/AuthContext';
import AppButton from '../../../components/AppButton';
import { API_BASE_URL } from '../../../config';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const MEAL_TYPES = ['Breakfast', 'Lunch', 'Dinner'];

const ManageMenuScreen = () => {
    const { user } = useAuth();
    const [menuType, setMenuType] = useState<'weekly' | 'single'>('weekly');
    const [selectedDay, setSelectedDay] = useState('Monday');
    const [selectedMeal, setSelectedMeal] = useState('Breakfast');
    const [items, setItems] = useState<any[]>([]);
    const [newItemName, setNewItemName] = useState('');
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchMenu();
    }, [menuType, selectedDay, selectedMeal]);

    const fetchMenu = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/api/menu/${user._id}?menuType=${menuType}`);
            const data = await response.json();
            
            if (response.ok) {
                const currentMenu = data.find((m: any) => 
                    m.menuType === menuType && 
                    m.mealType === selectedMeal && 
                    (menuType === 'weekly' ? m.dayOfWeek === selectedDay : true)
                );
                setItems(currentMenu ? currentMenu.items : []);
            }
        } catch (error) {
            console.error('Error fetching menu:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddItem = async () => {
        if (!newItemName.trim()) {
            Alert.alert('Required', 'Please enter item name');
            return;
        }

        setItems([...items, { 
            name: newItemName.trim() 
        }]);
        setNewItemName('');
    };

    const handleRemoveItem = (index: number) => {
        setItems(items.filter((_, i) => i !== index));
    };

    const handleSaveMenu = async () => {
        if (items.length === 0) {
            Alert.alert('Empty Menu', 'Please add at least one item to the menu.');
            return;
        }

        setSaving(true);
        try {
            const response = await fetch(`${API_BASE_URL}/api/menu/update`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    restaurantId: user._id,
                    menuType,
                    mealType: selectedMeal,
                    dayOfWeek: menuType === 'weekly' ? selectedDay : undefined,
                    date: menuType === 'single' ? new Date().toISOString() : undefined,
                    items
                })
            });

            if (response.ok) {
                Alert.alert('Success', 'Menu updated successfully!');
            } else {
                const error = await response.json();
                Alert.alert('Error', error.message || 'Failed to update menu');
            }
        } catch (error) {
            console.error('Error saving menu:', error);
            Alert.alert('Error', 'Communication with server failed');
        } finally {
            setSaving(false);
        }
    };

    return (
        <View style={styles.container}>
            <Header title="Manage Menu" />
            
            <View style={styles.tabContainer}>
                <TouchableOpacity 
                    style={[styles.tab, menuType === 'weekly' && styles.activeTab]} 
                    onPress={() => setMenuType('weekly')}
                >
                    <Text style={[styles.tabText, menuType === 'weekly' && styles.activeTabText]}>Weekly Routine</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                    style={[styles.tab, menuType === 'single' && styles.activeTab]} 
                    onPress={() => setMenuType('single')}
                >
                    <Text style={[styles.tabText, menuType === 'single' && styles.activeTabText]}>Single Time Choice</Text>
                </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                {menuType === 'weekly' && (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.daySelector}>
                        {DAYS.map(day => (
                            <TouchableOpacity 
                                key={day} 
                                style={[styles.dayChip, selectedDay === day && styles.activeDayChip]}
                                onPress={() => setSelectedDay(day)}
                            >
                                <Text style={[styles.dayChipText, selectedDay === day && styles.activeDayChipText]}>{day}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                )}

                <View style={styles.mealSelector}>
                    {MEAL_TYPES.map(meal => (
                        <TouchableOpacity 
                            key={meal} 
                            style={[styles.mealBtn, selectedMeal === meal && styles.activeMealBtn]}
                            onPress={() => setSelectedMeal(meal)}
                        >
                            <Text style={[styles.mealBtnText, selectedMeal === meal && styles.activeMealBtnText]}>{meal}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <View style={styles.itemsSection}>
                    <Text style={styles.sectionTitle}>Add Food Items</Text>
                    <View style={styles.inputContainer}>
                        <TextInput 
                            style={styles.input}
                            placeholder="Item Name (e.g. Thali)"
                            value={newItemName}
                            onChangeText={setNewItemName}
                        />
                        <TouchableOpacity 
                            style={[styles.addBtn, !newItemName.trim() && styles.disabledAddBtn]} 
                            onPress={handleAddItem}
                        >
                            <Text style={styles.addBtnText}>+</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.itemList}>
                        {loading ? (
                            <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 20 }} />
                        ) : items.length === 0 ? (
                            <Text style={styles.emptyText}>No items added yet for this slot.</Text>
                        ) : (
                            items.map((item, index) => (
                                <View key={index} style={styles.itemRow}>
                                    <View style={styles.itemBullet} />
                                    <Text style={styles.itemName}>{item.name}</Text>
                                    <TouchableOpacity onPress={() => handleRemoveItem(index)}>
                                        <Text style={styles.removeIcon}>✕</Text>
                                    </TouchableOpacity>
                                </View>
                            ))
                        )}
                    </View>
                </View>

                <View style={styles.footer}>
                    <AppButton 
                        title={saving ? "Saving..." : "Save Menu Plan"} 
                        onPress={handleSaveMenu}
                        disabled={saving}
                    />
                </View>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    tabContainer: {
        flexDirection: 'row',
        backgroundColor: Colors.white,
        padding: 4,
        margin: Spacing.md,
        borderRadius: BorderRadius.md,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    tab: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
        borderRadius: BorderRadius.sm,
    },
    activeTab: {
        backgroundColor: Colors.primary,
    },
    tabText: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.textLight,
    },
    activeTabText: {
        color: Colors.white,
    },
    scrollContent: {
        paddingBottom: 40,
    },
    daySelector: {
        paddingHorizontal: Spacing.md,
        marginBottom: Spacing.md,
    },
    dayChip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: Colors.white,
        marginRight: 8,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    activeDayChip: {
        backgroundColor: '#FFF1E8',
        borderColor: Colors.primary,
    },
    dayChipText: {
        fontSize: 13,
        color: Colors.text,
    },
    activeDayChipText: {
        color: Colors.primary,
        fontWeight: '700',
    },
    mealSelector: {
        flexDirection: 'row',
        paddingHorizontal: Spacing.md,
        justifyContent: 'space-between',
        marginBottom: Spacing.lg,
    },
    mealBtn: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
        backgroundColor: Colors.white,
        marginHorizontal: 4,
        borderRadius: BorderRadius.md,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    activeMealBtn: {
        borderColor: Colors.secondary,
        backgroundColor: '#FFFCFA',
    },
    mealBtnText: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.text,
    },
    activeMealBtnText: {
        color: Colors.secondary,
    },
    itemsSection: {
        paddingHorizontal: Spacing.md,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: Colors.text,
        marginBottom: 12,
    },
    inputContainer: {
        flexDirection: 'row',
        marginBottom: 20,
        alignItems: 'center',
    },
    input: {
        flex: 1,
        height: 50,
        backgroundColor: Colors.white,
        borderRadius: BorderRadius.md,
        paddingHorizontal: 15,
        borderWidth: 1,
        borderColor: Colors.border,
        fontSize: 14,
    },
    addBtn: {
        width: 60,
        height: 50,
        backgroundColor: Colors.primary,
        borderRadius: BorderRadius.md,
        marginLeft: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    disabledAddBtn: {
        backgroundColor: Colors.textLight,
        opacity: 0.6,
    },
    addBtnText: {
        color: Colors.white,
        fontSize: 30,
        fontWeight: '300',
    },
    itemList: {
        backgroundColor: Colors.white,
        borderRadius: BorderRadius.md,
        padding: Spacing.md,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    emptyText: {
        textAlign: 'center',
        color: Colors.textLight,
        fontStyle: 'italic',
        paddingVertical: 20,
    },
    itemRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: Colors.surfaceAlt,
    },
    itemBullet: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: Colors.primary,
        marginRight: 10,
    },
    itemName: {
        flex: 1,
        fontSize: 16,
        color: Colors.text,
    },
    removeIcon: {
        fontSize: 18,
        color: Colors.error,
        padding: 4,
    },
    footer: {
        padding: Spacing.md,
        marginTop: Spacing.xl,
    }
});

export default ManageMenuScreen;
