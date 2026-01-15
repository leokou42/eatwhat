"use client";

import { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import { RankedRestaurant } from '@/lib/rankRestaurants';
import { MapPin, Navigation, Star, RotateCcw, List, RefreshCw, Check, X } from 'lucide-react';

interface ResultCardStackProps {
    restaurants: RankedRestaurant[];
    onReset: () => void;
}

// Helper: Convert Google Places price level to dollar signs
function getPriceLevelDisplay(priceLevel?: string): string {
    if (!priceLevel) return '$$';

    const priceLevelMap: Record<string, string> = {
        'PRICE_LEVEL_FREE': '',
        'PRICE_LEVEL_INEXPENSIVE': '$',
        'PRICE_LEVEL_MODERATE': '$$',
        'PRICE_LEVEL_EXPENSIVE': '$$$',
        'PRICE_LEVEL_VERY_EXPENSIVE': '$$$$',
    };

    return priceLevelMap[priceLevel] || '$$';
}

// Helper: Get food category image from Unsplash based on restaurant tags/types
function getCategoryImage(restaurant: RankedRestaurant): string {
    if (restaurant.imageUrl) return restaurant.imageUrl;

    // Map tags to Unsplash search queries for better food images
    const tags = restaurant.tags || [];

    if (tags.includes('noodle')) {
        return 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=500&auto=format&fit=crop&q=60'; // Ramen
    }
    if (tags.includes('rice')) {
        return 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=500&auto=format&fit=crop&q=60'; // Rice bowl
    }
    if (tags.includes('snack')) {
        return 'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=500&auto=format&fit=crop&q=60'; // Snacks
    }
    if (tags.includes('luxury')) {
        return 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=500&auto=format&fit=crop&q=60'; // Fine dining
    }

    // Default: General restaurant image
    return 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=500&auto=format&fit=crop&q=60';
}

export default function ResultCardStack({ restaurants, onReset }: ResultCardStackProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [history, setHistory] = useState<number[]>([]);
    const [showResultsList, setShowResultsList] = useState(false);

    console.log(`[ResultCardStack] Rendering with ${restaurants.length} restaurants, currentIndex=${currentIndex}`);
    if (restaurants.length > 0) {
        console.log('[ResultCardStack] First restaurant:', restaurants[0]);
    }

    // Handle empty restaurants array
    if (restaurants.length === 0) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4">
                <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center text-4xl">
                    🤔
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">找不到合適的餐廳</h2>
                    <p className="text-slate-500 mt-2">請重新測試或調整您的偏好</p>
                </div>
                <button
                    onClick={onReset}
                    className="flex items-center gap-2 bg-orange-500 text-white font-bold py-3 px-6 rounded-xl hover:bg-orange-600 transition-all shadow-lg"
                >
                    <RefreshCw size={18} />
                    重新測試
                </button>
            </div>
        );
    }

    const isEnd = currentIndex >= restaurants.length;

    const handleSwipe = useCallback((direction: 'left' | 'right') => {
        if (direction === 'right') {
            const restaurant = restaurants[currentIndex];
            if (restaurant?.locationUrl) {
                window.open(restaurant.locationUrl, '_blank');
            }
        }

        setHistory(prev => [...prev, currentIndex]);
        setCurrentIndex(prev => prev + 1);
    }, [currentIndex, restaurants]);

    const handleUndo = useCallback(() => {
        if (history.length > 0) {
            const lastIndex = history[history.length - 1];
            setHistory(prev => prev.slice(0, -1));
            setCurrentIndex(lastIndex);
        }
    }, [history]);

    if (showResultsList) {
        // Fallback or "View All" mode if needed, but the requirement is to show the end screen.
    }

    return (
        <div className="flex-1 flex flex-col w-full h-full p-4 items-center justify-between overflow-hidden bg-slate-50">
            <div className="relative flex-1 w-full max-w-sm flex items-center justify-center">
                <AnimatePresence mode='popLayout'>
                    {isEnd ? (
                        <motion.div
                            key="end-screen"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-white rounded-3xl shadow-xl p-8 text-center space-y-6 flex flex-col items-center justify-center border border-slate-100"
                        >
                            <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center text-4xl">
                                😋
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-slate-800">真的沒想吃的？</h2>
                                <p className="text-slate-500 mt-2">再測一次，找到你的命定餐廳！</p>
                            </div>
                            <div className="w-full space-y-3 pt-4">
                                <button
                                    onClick={onReset}
                                    className="w-full flex items-center justify-center gap-2 bg-orange-500 text-white font-bold py-4 rounded-2xl hover:bg-orange-600 transition-all shadow-lg shadow-orange-200"
                                >
                                    <RefreshCw size={20} />
                                    Retake Quiz
                                </button>
                                <button
                                    onClick={() => {/* If we want to implement a 'show all' mode */ }}
                                    className="w-full flex items-center justify-center gap-2 bg-slate-100 text-slate-700 font-bold py-4 rounded-2xl hover:bg-slate-200 transition-all"
                                >
                                    <List size={20} />
                                    View Summary
                                </button>
                            </div>
                        </motion.div>
                    ) : (
                        // We map a few cards to show a stack effect
                        restaurants.map((res, index) => {
                            if (index < currentIndex || index > currentIndex + 2) return null;
                            const isTop = index === currentIndex;

                            return (
                                <SwipeCard
                                    key={res.id}
                                    restaurant={res}
                                    isTop={isTop}
                                    onSwipe={handleSwipe}
                                    zIndex={restaurants.length - index}
                                />
                            );
                        }).reverse()
                    )}
                </AnimatePresence>
            </div>

            {/* Bottom Controls */}
            {!isEnd && (
                <div className="flex items-center gap-8 py-6">
                    <button
                        onClick={handleUndo}
                        disabled={history.length === 0}
                        className={`p-4 rounded-full shadow-lg transition-all border ${history.length === 0
                            ? 'bg-slate-50 text-slate-300 border-slate-100'
                            : 'bg-white text-orange-500 border-slate-100 hover:scale-110 active:scale-95'
                            }`}
                        title="Undo"
                    >
                        <RotateCcw size={24} />
                    </button>

                    <button
                        onClick={() => handleSwipe('left')}
                        className="bg-white p-6 rounded-full shadow-lg border border-slate-100 text-rose-500 hover:scale-110 active:scale-95 transition-all"
                    >
                        <X size={32} strokeWidth={3} />
                    </button>

                    <button
                        onClick={() => handleSwipe('right')}
                        className="bg-white p-6 rounded-full shadow-lg border border-slate-100 text-emerald-500 hover:scale-110 active:scale-95 transition-all"
                    >
                        <Check size={32} strokeWidth={3} />
                    </button>
                </div>
            )}
        </div>
    );
}

interface SwipeCardProps {
    restaurant: RankedRestaurant;
    isTop: boolean;
    onSwipe: (dir: 'left' | 'right') => void;
    zIndex: number;
}

function SwipeCard({ restaurant, isTop, onSwipe, zIndex }: SwipeCardProps) {
    const x = useMotionValue(0);
    const rotate = useTransform(x, [-200, 200], [-30, 30]);
    const opacity = useTransform(x, [-200, -150, 0, 150, 200], [0, 1, 1, 1, 0]);

    // Swipe feedback overlays
    const leftOverlayOpacity = useTransform(x, [-150, -50], [1, 0]);
    const rightOverlayOpacity = useTransform(x, [50, 150], [0, 1]);

    const handleDragEnd = (_: any, info: PanInfo) => {
        if (info.offset.x > 100) {
            onSwipe('right');
        } else if (info.offset.x < -100) {
            onSwipe('left');
        }
    };

    return (
        <motion.div
            style={{
                x,
                rotate,
                opacity,
                zIndex,
                cursor: isTop ? 'grab' : 'default',
            }}
            drag={isTop ? 'x' : false}
            dragConstraints={{ left: 0, right: 0 }}
            onDragEnd={handleDragEnd}
            whileTap={isTop ? { scale: 1.05 } : {}}
            initial={{ scale: 0.9, opacity: 0, y: 10 }}
            animate={{
                scale: isTop ? 1 : 1 - (zIndex * 0.05),
                opacity: 1,
                y: isTop ? 0 : zIndex * 10
            }}
            exit={{
                x: x.get() < 0 ? -500 : 500,
                opacity: 0,
                scale: 0.5,
                transition: { duration: 0.3 }
            }}
            className="absolute w-full aspect-[3/4] max-w-sm bg-white rounded-[2rem] shadow-2xl border border-slate-100 overflow-hidden flex flex-col"
        >
            {/* Swiping Feedback Labels */}
            <motion.div
                style={{ opacity: rightOverlayOpacity }}
                className="absolute top-10 left-10 z-20 border-4 border-emerald-500 rounded-lg px-4 py-2 -rotate-12 bg-white/80"
            >
                <span className="text-emerald-500 font-extrabold text-2xl">YUM!</span>
            </motion.div>

            <motion.div
                style={{ opacity: leftOverlayOpacity }}
                className="absolute top-10 right-10 z-20 border-4 border-rose-500 rounded-lg px-4 py-2 rotate-12 bg-white/80"
            >
                <span className="text-rose-500 font-extrabold text-2xl">NOPE</span>
            </motion.div>

            {/* Restaurant Image */}
            <div className="relative h-2/5 w-full bg-slate-200">
                <img
                    src={getCategoryImage(restaurant)}
                    alt={restaurant.name}
                    className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <div className="absolute bottom-4 left-6 right-6 flex items-end justify-between text-white">
                    <div>
                        <h3 className="text-2xl font-bold truncate leading-tight">{restaurant.name}</h3>
                        <div className="flex items-center gap-3 mt-1 text-sm font-medium opacity-90">
                            <span className="flex items-center gap-1">
                                <Star size={14} className="fill-yellow-400 text-yellow-400" />
                                {restaurant.rating || 'N/A'}
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                                <MapPin size={14} />
                                {restaurant.distance ? `${restaurant.distance}km` : '? km'}
                            </span>
                            <span>•</span>
                            <span className="font-bold text-emerald-300">
                                {getPriceLevelDisplay(restaurant.priceLevel)}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Recommendations Reason */}
            <div className="flex-1 p-6 flex flex-col justify-start overflow-y-auto">
                <div className="space-y-4">
                    <div className="bg-orange-50 rounded-2xl p-4 border border-orange-100/50">
                        <p className="text-sm font-semibold text-orange-600 mb-1 uppercase tracking-wider">Why we love it</p>
                        <p className="text-slate-700 font-medium leading-relaxed italic">
                            "{Array.isArray(restaurant.reasons) ? restaurant.reasons[0] : restaurant.reason || 'Matches your profile'}"
                        </p>
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-slate-400">
                            <MapPin size={14} />
                            <p className="text-xs truncate">{restaurant.address || 'Address not available'}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* CTA Button overlay when top */}
            {isTop && (
                <div className="p-4 border-t border-slate-50">
                    <button
                        onClick={() => onSwipe('right')}
                        className="w-full h-12 flex items-center justify-center gap-2 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-colors"
                    >
                        <Navigation size={18} />
                        Get Directions
                    </button>
                </div>
            )}
        </motion.div>
    );
}
