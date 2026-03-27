export interface RecipeRationBreakdown {
  recipeId?: string;
  recipeName: string;
  servingsMade?: number;
  peopleFed?: number;
}

export interface RationsResult {
  totalPeopleFed: number;
  breakdown: RecipeRationBreakdown[];
}
