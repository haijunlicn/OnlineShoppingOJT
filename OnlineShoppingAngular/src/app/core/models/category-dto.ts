import { OptionTypeDTO } from "./option.model";

export interface CategoryDTO {
  id?: number;
  name?: string;
  parentCategoryId?: number;
  parentCategoryName?: string;
  children?: CategoryDTO[];
  optionTypes?: OptionTypeDTO[];
<<<<<<< Updated upstream
<<<<<<< Updated upstream
<<<<<<< Updated upstream
  imgPath?: string;
=======
  imagePath?: string;
>>>>>>> Stashed changes
=======
  imagePath?: string;
>>>>>>> Stashed changes
=======
  imagePath?: string;
>>>>>>> Stashed changes
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

