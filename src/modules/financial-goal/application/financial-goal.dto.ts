import { z } from 'zod';
import { FinancialGoalQuerySchema } from './schema/financial-goal.schema';

export type FinancialGoalQueryDto = z.infer<typeof FinancialGoalQuerySchema>;
