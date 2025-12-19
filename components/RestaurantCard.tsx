import { RankedRestaurant } from '@/lib/rankRestaurants';
import { MapPin, Navigation, ChevronDown, ChevronUp, Star } from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface RestaurantCardProps {
    restaurant: RankedRestaurant;
    rank: number;
}

export default function RestaurantCard({ restaurant, rank }: RestaurantCardProps) {
    const [isExpanded, setIsExpanded] = useState(false);

    return (
        <div
            className="w-full bg-white p-4 rounded-xl shadow-sm border border-gray-100 transition-all hover:shadow-md cursor-pointer"
            onClick={() => setIsExpanded(!isExpanded)}
        >
            <div className="flex items-center justify-between">
                <div className="flex items-start gap-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-orange-100 text-orange-600 font-bold text-sm shrink-0">
                        {rank}
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-800 flex items-center gap-2">
                            {restaurant.name}
                            {restaurant.score > 0 && (
                                <span className="flex items-center text-xs font-normal bg-yellow-50 text-yellow-600 px-2 py-0.5 rounded-full border border-yellow-100">
                                    <Star size={10} className="mr-1 fill-yellow-500" />
                                    Match: {restaurant.score}
                                </span>
                            )}
                        </h3>
                        <div className="flex items-center text-xs text-gray-500 mt-1 gap-1">
                            <MapPin size={12} />
                            <span>{restaurant.distance} km</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <a
                        href={restaurant.locationUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="p-2 text-blue-500 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                    >
                        <Navigation size={18} />
                    </a>
                    <button
                        className="p-1 text-gray-400"
                    >
                        {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </button>
                </div>
            </div>

            <AnimatePresence>
                {isExpanded && restaurant.reasons.length > 0 && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="mt-3 pt-3 border-t border-gray-50">
                            <p className="text-xs font-semibold text-gray-400 mb-1">Why this fits:</p>
                            <ul className="space-y-1">
                                {restaurant.reasons.map((reason, idx) => (
                                    <li key={idx} className="text-xs text-gray-600 flex items-center gap-1.5">
                                        <div className="w-1 h-1 rounded-full bg-green-400" />
                                        {reason}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
