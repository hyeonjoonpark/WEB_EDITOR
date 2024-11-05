'use client'

import React, { useRef, HTMLAttributes, useState } from 'react';
import { FileType } from '@/types';

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
}

export default function Sidebar({ files, onFileSelect, currentFile, onFilesUpload, openFiles, onFileClose }: SidebarProps) {
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
    <div className="h-full flex">
      {/* 숨겨진 파일 입력 추가 */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        webkitdirectory=""
        directory=""
        multiple
      />
      
      {/* 아이콘 사이드바 */}
      <div className="w-12 bg-[#333333] flex-shrink-0">
        <div className="flex flex-col">
          <SidebarIcon 
            icon="📁" 
            active 
            onClick={handleFileOpen}
          />
          <SidebarIcon icon="🔍" />
          <SidebarIcon icon="⚙️" />
        </div>
      </div>

      {/* 파일 트리 */}
      <div className="flex-1 bg-[#252526] border-r border-[#333333] overflow-hidden">
        <div className="h-9 px-4 flex items-center text-white/80 text-xs font-medium border-b border-[#333333]">
          EXPLORER
        </div>
        <div className="overflow-auto">
          {files.map((file) => (
            <FileTreeItem key={file.path} file={file} />
          ))}
        </div>
      </div>

      {/* 열린 파일 목록 */}
      <div className="w-60 bg-[#252526] border-r border-[#333333] overflow-hidden">
        <div className="h-9 px-4 flex items-center text-white/80 text-xs font-medium border-b border-[#333333]">
          OPEN EDITORS
        </div>
        <div className="overflow-auto">
          {openFiles.length === 0 ? (
            <div className="px-4 py-2 text-sm text-white/50">
              열린 파일이 없습니다
            </div>
          ) : (
            openFiles.map((file) => (
              <div 
                key={file.path}
                className={`
                  flex items-center px-4 py-1 hover:bg-[#2a2d2e] cursor-pointer group
                  ${currentFile?.path === file.path ? 'bg-[#37373d]' : ''}
                `}
              >
                <div 
                  className="flex-1 flex items-center"
                  onClick={() => onFileSelect(file)}
                >
                  <span className="mr-2 flex-shrink-0">📄</span>
                  <span className="text-sm text-white/80 truncate">{file.name}</span>
                </div>
                <button 
                  className="ml-2 text-white/60 hover:text-white opacity-0 group-hover:opacity-100"
                  onClick={(e) => {
                    e.stopPropagation();
                    onFileClose(file);
                  }}
                >
                  ✕
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
} 