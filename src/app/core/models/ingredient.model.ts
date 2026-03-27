export interface Ingredient {
  id: string;
  name: string;
  availableQuantity: number;
}

export interface CreateIngredientRequest {
  name: string;
  availableQuantity: number;
}

export interface UpdateIngredientRequest {
  name: string;
  availableQuantity: number;
}
