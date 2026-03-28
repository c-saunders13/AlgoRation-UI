export interface RecipeIngredientDto {
  ingredientId: string;
  requiredQuantity: number;
}

export interface Recipe {
  id: string;
  name: string;
  servings: number;
  ingredients: RecipeIngredientDto[];
}

export interface CreateRecipeRequest {
  name: string;
  servings: number;
  ingredients: Array<{
    ingredientId: string;
    requiredQuantity: number;
  }>;
}

export interface UpdateRecipeRequest {
  name: string;
  servings: number;
  ingredients: Array<{
    ingredientId: string;
    requiredQuantity: number;
  }>;
}
