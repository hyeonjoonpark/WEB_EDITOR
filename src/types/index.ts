export interface BrewPackage {
    name: string;
    version: string;
    status: string;
    commands?: string[];
  }
  
  export interface CommandHistory {
    command: string;
    timestamp: Date;
  }
  
  export interface FileSystem {
    name: string;
    type: 'file' | 'directory';
    content?: string;
    children: Record<string, FileSystem>;
  }
  
  export interface FileType {
    name: string;
    type: 'file' | 'directory';
    path: string;
    content: string;
    children?: FileType[];
  } 