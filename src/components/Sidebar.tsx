'use client'

import React, { useRef, HTMLAttributes, useState } from 'react';
import { FileType } from '@/types';
import { FolderPlusIcon, DocumentPlusIcon } from '@heroicons/react/24/outline';

declare module 'react' {
  interface InputHTMLAttributes<T> extends HTMLAttributes<T> {
    directory?: string;
    webkitdirectory?: string;
  }
}

interface SidebarIconProps {
  icon: string;
  active?: boolean;
  onClick?: () => void;
}

interface SidebarProps {
  files: FileType[];
  onFileSelect: (file: FileType) => void;
  currentFile?: FileType;
  onFilesUpload: (files: FileType[]) => void;
  openFiles: FileType[];
  onFileClose: (file: FileType) => void;
  onCreateFolder: () => void;
  onCreateFile: () => void;
}

export default function Sidebar({ files, onFileSelect, currentFile, onFilesUpload, openFiles, onFileClose, onCreateFolder, onCreateFile }: SidebarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileOpen = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const items = event.target.files;
    if (!items) return;

    const uploadedFiles: FileType[] = [];
    const usedPaths = new Set<string>();
    
    for (let i = 0; i < items.length; i++) {
      const file = items[i];
      const content = await readFileContent(file);
      
      const pathParts = file.webkitRelativePath.split('/');
      const fileName = pathParts[pathParts.length - 1];
      let path = file.webkitRelativePath;
      
      // 중복된 경로가 있는 경우 고유한 경로 생성
      let counter = 1;
      while (usedPaths.has(path)) {
        const ext = fileName.includes('.') ? fileName.split('.').pop() : '';
        const baseName = fileName.includes('.') ? fileName.slice(0, -(ext!.length + 1)) : fileName;
        const newFileName = `${baseName}_${counter}.${ext}`;
        pathParts[pathParts.length - 1] = newFileName;
        path = pathParts.join('/');
        counter++;
      }
      
      usedPaths.add(path);
      
      uploadedFiles.push({
        name: pathParts[pathParts.length - 1],
        type: file.name.includes('.') ? 'file' : 'directory',
        content: content || '',
        path: path,
        children: []
      });
    }

    onFilesUpload(uploadedFiles);
  };

  const readFileContent = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      if (file.name.includes('.')) {  // 파일인 경우에만 내용 읽기
        const reader = new FileReader();
        reader.onload = (e) => {
          resolve(e.target?.result as string || '');
        };
        reader.readAsText(file);
      } else {
        resolve('');  // 디렉토리는 빈 문자열 반환
      }
    });
  };

  const SidebarIcon = ({ icon, active = false, onClick }: SidebarIconProps) => {
    return (
      <div 
        className={`
          w-12 h-12 flex items-center justify-center
          hover:bg-[#2a2d2e] cursor-pointer
          ${active ? 'border-l-2 border-blue-500 bg-[#37373d]' : ''}
        `}
        onClick={onClick}
      >
        <span className="text-2xl">{icon}</span>
      </div>
    );
  };

  const FileTreeItem = ({ file }: { file: FileType }) => {
    const [isExpanded, setIsExpanded] = useState(true);  // 기본적으로 펼쳐진 상태

    const handleClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (file.type === 'file') {
        onFileSelect(file);
      } else {
        setIsExpanded(!isExpanded);
      }
    };

    // 파일 타입에 따른 아이콘 선택
    const getFileIcon = (fileName: string, type: string) => {
      if (type === 'directory') return '📁';
      
      const ext = fileName.split('.').pop()?.toLowerCase();
      switch (ext) {
        case 'js':
          return 'JS';
        case 'jsx':
          return 'JS';
        case 'ts':
          return 'TS';
        case 'tsx':
          return 'TS';
        case 'css':
          return '🎨';
        case 'svg':
          return 'SVG';
        case 'md':
          return '📝';
        case 'json':
          return '📦';
        case 'gitignore':
          return '🔒';
        case 'lock':
          return '🔐';
        default:
          return '📄';
      }
    };

    return (
      <div className="pl-2">
        <div
          className={`
            flex items-center hover:bg-[#2a2d2e] cursor-pointer py-1 pr-2
            ${currentFile?.path === file.path ? 'bg-[#37373d]' : ''}
          `}
          onClick={handleClick}
        >
          {file.type === 'directory' && (
            <span className="mr-1 text-xs">
              {isExpanded ? '▼' : '▶'}
            </span>
          )}
          <span className="mr-2 flex-shrink-0 text-sm">
            {getFileIcon(file.name, file.type)}
          </span>
          <span className="text-sm text-white/80 truncate">{file.name}</span>
        </div>
        {file.type === 'directory' && isExpanded && file.children && file.children.length > 0 && (
          <div className="pl-4">
            {file.children.sort((a, b) => {
              // 디렉토리를 먼저 정렬
              if (a.type === 'directory' && b.type === 'file') return -1;
              if (a.type === 'file' && b.type === 'directory') return 1;
              // 같은 타입끼리는 이름으로 정렬
              return a.name.localeCompare(b.name);
            }).map((child) => (
              <FileTreeItem 
                key={child.path} 
                file={child}
              />
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col w-64 bg-[#252526] text-white h-screen border-r border-gray-700 relative z-0">
      {/* 파일 입력 필드는 숨김 처리 */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        webkitdirectory=""
        directory=""
        multiple
      />
      
      <div className="p-2 flex justify-between items-center border-b border-gray-700 sticky top-0 bg-[#252526] z-[1]">
        <span className="text-sm flex items-center gap-1">
          <span>EXPLORER</span>
          <button 
            className="p-1 hover:bg-gray-700 rounded"
            onClick={handleFileOpen}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
          </button>
        </span>
        <div className="flex gap-2">
          <button 
            className="p-1 hover:bg-gray-700 rounded"
            onClick={onCreateFolder}
          >
            <FolderPlusIcon className="w-4 h-4" />
          </button>
          <button 
            className="p-1 hover:bg-gray-700 rounded"
            onClick={onCreateFile}
          >
            <DocumentPlusIcon className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      <div className="overflow-auto flex-1">
        {files.map((file) => (
          <FileTreeItem key={file.path} file={file} />
        ))}
      </div>
    </div>
  );
} 