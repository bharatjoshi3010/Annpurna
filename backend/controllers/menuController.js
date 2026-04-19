import Menu from '../models/Menu.js';

export const updateMenu = async (req, res) => {
    try {
        const { restaurantId, menuType, dayOfWeek, date, mealType, items } = req.body;

        // Upsert the menu
        const filter = { restaurant: restaurantId, menuType, mealType };
        if (menuType === 'weekly') filter.dayOfWeek = dayOfWeek;
        else filter.date = new Date(date).setHours(0, 0, 0, 0);

        const update = { items };
        const menu = await Menu.findOneAndUpdate(filter, update, {
            new: true,
            upsert: true
        });

        res.json(menu);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getRestaurantMenu = async (req, res) => {
    try {
        const { restaurantId } = req.params;
        const { date, menuType } = req.query;

        const filter = { restaurant: restaurantId };
        if (menuType) filter.menuType = menuType;
        
        if (date) {
            const requestedDate = new Date(date);
            const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
            const dayName = days[requestedDate.getDay()];
            
            // Return BOTH the weekly routine for that day AND any single specific overrides
            const menus = await Menu.find({
                restaurant: restaurantId,
                $or: [
                    { menuType: 'weekly', dayOfWeek: dayName },
                    { menuType: 'single', date: requestedDate.setHours(0, 0, 0, 0) }
                ]
            });
            return res.json(menus);
        }

        const menus = await Menu.find(filter);
        res.json(menus);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const deleteMenuItem = async (req, res) => {
    try {
        const { menuId } = req.params;
        await Menu.findByIdAndDelete(menuId);
        res.json({ message: 'Menu deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
