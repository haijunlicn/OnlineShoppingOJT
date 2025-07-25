export interface VlogDTO {
  id?: number;
  title?: string;
  vlogContent?: string;
  createdDate?: string;
  updatedDate?: string;
  vlogFiles?: VlogFileDTO[]; // Associated files
  vlog_content?: string;
  vlogId: number
  files?: VlogFileDTO[]

}

export interface VlogFileDTO {
  id?: number
  fileType?: string 
  filePath: string 
  title?: string 
  vlogId: number
  thumbnailPath?: string
  createdDate?: string;
  uploadedBy?: string; // Added for admin badge demo
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


