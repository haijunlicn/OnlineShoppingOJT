export interface ProductAnswer {
    id: number;
    questionId: number;
    adminId: number;
    adminName: string;
    answerText: string;
    createdAt: string;
    updatedAt: string;
  }
  
  export interface ProductQuestion {
    id: number;
    productId: number;
    productName:string;
    userId: number;
    userName: string;
    questionText: string;
    createdAt: string;
    updatedAt: string;
    answers: ProductAnswer[];
  }