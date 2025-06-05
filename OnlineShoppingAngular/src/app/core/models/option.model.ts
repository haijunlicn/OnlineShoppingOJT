
export interface OptionDTO {
  type: string;
  values: string[];
}

export interface OptionTypeDTO {
  id: string;
  name: string;
  optionValues: OptionValueDTO[];
}

export interface OptionValueDTO {
  id?: number;
  optionId: number;
  value: string;
  deleted?: boolean;
  
}
