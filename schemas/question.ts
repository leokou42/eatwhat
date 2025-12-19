import { z } from 'zod';

export const QuestionSchema = z.object({
    id: z.number(),
    text: z.string().min(1, "Question text required"),
    leftChoice: z.string().min(1),
    rightChoice: z.string().min(1),
    skipChoice: z.string().default("Skip"),
    leftTags: z.array(z.string()),
    rightTags: z.array(z.string())
});

export type Question = z.infer<typeof QuestionSchema>;
