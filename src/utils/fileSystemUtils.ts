import { FileSystem } from '@/types/index';

export const createFile = (fileName: string): string => {
  return `파일 생성됨: ${fileName}`;
};

export const createDirectory = (dirName: string): string => {
  return `디렉토리 생성됨: ${dirName}`;
};

export const generateLsOutput = (
  files: FileSystem[], 
  showHidden: boolean, 
  showDetails: boolean
): string => {
  if (!files) return '';
  
  return files
    .filter((file: FileSystem) => showHidden || !file.name.startsWith('.'))
    .map(file => {
      if (showDetails) {
        const permissions = file.permissions || (file.type === 'directory' ? 'drwxr-xr-x' : '-rw-r--r--');
        const owner = file.owner || 'user';
        const group = file.group || 'user';
        const size = file.size || 0;
        const date = file.modifiedDate ? file.modifiedDate.toLocaleDateString() : new Date().toLocaleDateString();
        return `${permissions} ${owner} ${group} ${size.toString().padStart(8)} ${date} ${file.name}`;
      }
      return file.name;
    })
    .join('\n');
};

export const removeFile = (fileName: string, recursive: boolean): string => {
  return `파일 삭제됨: ${fileName}${recursive ? ' (재귀적)' : ''}`;
};

export const copyFile = (source: string, destination: string): string => {
  return `파일 복사됨: ${source} → ${destination}`;
};

export const moveFile = (source: string, destination: string): string => {
  return `파일 이동됨: ${source} → ${destination}`;
};

export const writeToFile = (fileName: string, content: string): string => {
  return `파일에 내용 작성됨: ${fileName}`;
};

export const showFileContent = (fileName: string, fileSystem: FileSystem[]): string => {
  const file = fileSystem.find(item => item.type === 'file' && item.name === fileName);
  return file ? file.content || '(빈 파일)' : '파일을 찾을 수 없습니다.';
};