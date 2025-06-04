export interface CategoryDTO {
  id?: number;
  name?: string;
  parentCategoryId?: number;
  parentCategoryName?: string;
  children?: CategoryDTO[];
  // level?: number;
}

export interface CategoryNode extends CategoryDTO {
  children?: CategoryNode[];
}
