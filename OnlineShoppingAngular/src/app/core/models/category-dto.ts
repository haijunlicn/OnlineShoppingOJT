import { OptionTypeDTO } from "./option.model";

export interface CategoryDTO {
  id?: number;
  name?: string;
  parentCategoryId?: number;
  parentCategoryName?: string;
  children?: CategoryDTO[];
  optionTypes?: OptionTypeDTO[];
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

