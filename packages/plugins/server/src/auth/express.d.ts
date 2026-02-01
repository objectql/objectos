// Type augmentation for Express Request
declare namespace Express {
  export interface Request {
    user?: {
      userId?: string;
      id?: string;
      roles?: string[];
      spaceId?: string;
      sessionId?: string;
      isSystem?: boolean;
      [key: string]: any;
    };
  }
}
