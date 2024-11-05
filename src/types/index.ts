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
  type: 'directory' | 'file';
  content?: string;
  children?: FileSystem[];
}

export interface FileType {
  name: string;
  content: string;
  type: 'file' | 'directory';
  children?: FileType[];
} 