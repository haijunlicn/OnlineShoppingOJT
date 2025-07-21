export interface VlogDTO {
  id?: number;
  title?: string;
  vlogContent?: string;
  createdDate?: string;
  updatedDate?: string;
  vlogFiles?: VlogFileDTO[]; // Associated files
  vlog_content?: string
  
}

export interface VlogFileDTO {
  id?: number
  vlogId: number
  fileType?: string 
  filePath: string 
  title?: string 
  thumbnailPath?: string
  duration?: string 
  publishedDate?: string 
    category?: string 

}

export interface VlogComment {
  id?: number;
  author: string;
  text: string;
  avatarInitial: string;
  commentDate: string; // ISO string format of date-time
  vlogId: number;
  userId?: number;

}


