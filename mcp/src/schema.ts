import { z } from 'zod';

export const MarketSummarySchema = z.object({
	id: z.string(),
	title: z.string(),
	yesPrice: z.number(),
	volumeNum: z.number(),
	timestamp: z.string().datetime(),
});

export const AnomalySchema = z.object({
	id: z.string(),
	title: z.string(),
	changePct: z.number(),
	volRatio: z.number(),
	note: z.string(),
	detectedAt: z.string().datetime(),
});

export type MarketSummary = z.infer<typeof MarketSummarySchema>;
export type Anomaly = z.infer<typeof AnomalySchema>;
