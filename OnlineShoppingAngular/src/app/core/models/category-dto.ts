import { OptionTypeDTO } from "./option.model";

export interface CategoryDTO {
  id?: number;
  name?: string;
  parentCategoryId?: number;
  parentCategoryName?: string;
  children?: CategoryDTO[];
  optionTypes?: OptionTypeDTO[];
  imgPath?: string;
  level?: number;
  delFg?: number;
  productCount?: number;
}

export interface CategoryFlatDTO extends CategoryDTO {
  level: number;
}

export interface CategoryNode extends CategoryDTO {
  children?: CategoryNode[];
}

export interface CategoryOptionDTO {
  id?: number;
  categoryId: number;
  categoryName?: string;
  optionId: number;
  optionName?: string;
  delFg?: boolean;
  name: string;
  selectedAt: Date;
}

export interface CategoryGroup {
  root: CategoryDTO;
  subcategories: CategoryDTO[];
}


