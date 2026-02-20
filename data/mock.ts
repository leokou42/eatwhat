import { QuestionSchema, Question } from '@/schemas/question';
import { RestaurantSchema, Restaurant } from '@/schemas/restaurant';
import { z } from 'zod';

const RAW_QUESTIONS = [
    {
        id: '1',
        text: '今天想吃飯還是吃麵？',
        leftChoice: '飯',
        rightChoice: '麵',
        skipChoice: '都不要',
        leftTags: ['rice'],
        rightTags: ['noodle'],
    },
    {
        id: '2',
        text: '想吃正餐還是小吃？',
        leftChoice: '正餐',
        rightChoice: '小吃',
        skipChoice: '都不要',
        leftTags: ['meal'],
        rightTags: ['snack'],
    },
    {
        id: '3',
        text: '口味想清淡還是重口味？',
        leftChoice: '清淡',
        rightChoice: '重口味',
        skipChoice: '都不要',
        leftTags: ['light'],
        rightTags: ['heavy'],
    },
    {
        id: '4',
        text: '想吃近一點還是遠一點？',
        leftChoice: '近',
        rightChoice: '遠',
        skipChoice: '都不要',
        leftTags: ['near'],
        rightTags: ['far'],
    },
];

const RAW_RESTAURANTS = [
    {
        id: '1',
        name: '鼎泰豐 (信義店)',
        distance: 0, // Will be calculated dynamically if geolocation exists
        locationUrl: 'https://www.google.com/maps/search/鼎泰豐',
        tags: ['noodle', 'meal', 'light', 'near'],
        latitude: 25.033493,
        longitude: 121.529881,
    },
    {
        id: '2',
        name: '林東芳牛肉麵',
        distance: 0,
        locationUrl: 'https://www.google.com/maps/search/林東芳牛肉麵',
        tags: ['noodle', 'meal', 'heavy', 'far'],
        latitude: 25.046556,
        longitude: 121.543440,
    },
    {
        id: '3',
        name: '藍家割包',
        distance: 0,
        locationUrl: 'https://www.google.com/maps/search/藍家割包',
        tags: ['snack', 'heavy', 'far'],
        latitude: 25.015764,
        longitude: 121.532385,
    },
    {
        id: '4',
        name: '阜杭豆漿',
        distance: 0,
        locationUrl: 'https://www.google.com/maps/search/阜杭豆漿',
        tags: ['snack', 'light', 'near'],
        latitude: 25.044399,
        longitude: 121.525048,
    },
    {
        id: '5',
        name: '金峰魯肉飯',
        distance: 0,
        locationUrl: 'https://www.google.com/maps/search/金峰魯肉飯',
        tags: ['rice', 'snack', 'heavy', 'far'],
        latitude: 25.031589,
        longitude: 121.518606,
    },
];

// Fail-fast validation
export const QUESTIONS: Question[] = z.array(QuestionSchema).parse(RAW_QUESTIONS);
export const MOCK_RESTAURANTS: Restaurant[] = z.array(RestaurantSchema).parse(RAW_RESTAURANTS);
