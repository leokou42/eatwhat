import { GeneratedQuestion } from '@/lib/gemini';

export const STARTER_QUESTIONS: GeneratedQuestion[] = [
  {
    text: '今天想吃正餐還是小吃？',
    leftChoice: '正餐',
    rightChoice: '小吃',
    skipChoice: '都可以',
    leftTags: ['meal'],
    rightTags: ['snack'],
  },
  {
    text: '口味想清淡還是重口味？',
    leftChoice: '清淡',
    rightChoice: '重口味',
    skipChoice: '都可以',
    leftTags: ['light'],
    rightTags: ['heavy'],
  },
  {
    text: '偏好價位？',
    leftChoice: '平價',
    rightChoice: '中高價',
    skipChoice: '不拘',
    leftTags: ['budget'],
    rightTags: ['high'],
  },
];

export const DYNAMIC_QUESTION_TEMPLATES: GeneratedQuestion[] = [
  {
    text: '今天想吃哪種料理？',
    leftChoice: '日式',
    rightChoice: '中式',
    skipChoice: '都可以',
    leftTags: ['japanese'],
    rightTags: ['chinese'],
  },
  {
    text: '更在意份量還是口感？',
    leftChoice: '份量',
    rightChoice: '口感',
    skipChoice: '都可以',
    leftTags: ['heavy'],
    rightTags: ['light'],
  },
  {
    text: '想要近一點還是遠一點？',
    leftChoice: '近',
    rightChoice: '遠',
    skipChoice: '都可以',
    leftTags: ['near'],
    rightTags: ['far'],
  },
  {
    text: '用餐氣氛偏好？',
    leftChoice: '隨性',
    rightChoice: '約會感',
    skipChoice: '都可以',
    leftTags: ['casual'],
    rightTags: ['date'],
  },
  {
    text: '想要甜點或飲品？',
    leftChoice: '甜點',
    rightChoice: '飲品',
    skipChoice: '都可以',
    leftTags: ['sweet'],
    rightTags: ['cafe'],
  },
];
