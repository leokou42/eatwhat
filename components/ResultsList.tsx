"use client";
import { RankedRestaurant } from '@/lib/rankRestaurants';
import RestaurantCard from './RestaurantCard';
import { motion } from 'framer-motion';

interface ResultsListProps {
    restaurants: RankedRestaurant[];
}

export default function ResultsList({ restaurants }: ResultsListProps) {
    return (
        <div className="flex-1 w-full overflow-y-auto px-6 py-4 space-y-3">
            <h2 className="text-lg font-bold text-gray-800 mb-4">Recommended for You</h2>

            {restaurants.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
                    <div className="text-4xl text-gray-300">🍽️</div>
                    <div className="space-y-1">
                        <p className="font-bold text-gray-800">No restaurants found</p>
                        <p className="text-sm text-gray-500">Try changing your answers or expanding your search.</p>
                    </div>
                </div>
            ) : (
                restaurants.map((restaurant, index) => (
                    <motion.div
                        key={restaurant.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                    >
                        <RestaurantCard restaurant={restaurant} rank={index + 1} />
                    </motion.div>
                ))
            )}

            <div className="h-20" /> {/* Spacer for bottom scroll */}
        </div>
    );
}
