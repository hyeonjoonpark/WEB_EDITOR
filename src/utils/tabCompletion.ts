import { FileSystem } from '@/types/index';

export const handleTabCompletion = (
  input: string,
  currentDirectory: string[],
  fileSystem: FileSystem[],
  setInput: (value: string) => void
) => {
  const args = input.split(' ');
  if (args[0] === 'cd' && args[1]) {
    const prefix = args[1];
    let currentFs = fileSystem;
    
    for (const dir of currentDirectory) {
      const found = currentFs.find((item: FileSystem) => 
        item.type === 'directory' && item.name === dir
      );
      if (found?.children && Array.isArray(found.children)) {
        currentFs = found.children;
      }
    }

    const matches = currentFs.filter((item: FileSystem) => 
      item.name.toLowerCase().startsWith(prefix.toLowerCase())
    );

    if (matches.length === 1) {
      setInput(`cd ${matches[0].name}`);
    }
  }
}; 