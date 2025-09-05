import { Injectable } from '@nestjs/common';

interface ProgressCalculationInput {
    currentValue: number;
    targetValue?: number;
}

@Injectable()
export class OverallProgressCalculator {
    public calculate(items: ProgressCalculationInput[]): number | undefined {
        const totalTargetValue = items.reduce((sum, item) => sum + (item.targetValue || 0), 0);
        if (totalTargetValue <= 0) return undefined;

        const totalWeightedProgress = items.reduce((sum, item) => {
            if (!item.targetValue || item.targetValue <= 0) return sum;

            const weight = item.targetValue;
            const progress = Math.max(0, Math.min(1, item.currentValue / item.targetValue));
            return sum + progress * weight;
        }, 0);

        return totalWeightedProgress / totalTargetValue;
    }
}
