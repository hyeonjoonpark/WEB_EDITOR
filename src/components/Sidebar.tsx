'use client'

import React, { useRef, HTMLAttributes } from 'react';
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
}

export default function Sidebar({ files, onFileSelect }: SidebarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileOpen = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const items = event.target.files;
    if (!items) return;

    const files: FileType[] = [];
    
    for (let i = 0; i < items.length; i++) {
      const file = items[i];
      const content = await readFileContent(file);
      
      // 파일 경로를 '/'로 분할하여 디렉토리 구조 생성
      const pathParts = file.webkitRelativePath.split('/');
      const fileName = pathParts[pathParts.length - 1];
      
      files.push({
        name: fileName,
        type: file.name.includes('.') ? 'file' : 'directory',
        content: content || '',
        path: file.webkitRelativePath
      });
    }

    console.log('로드된 파일들:', files);
    // 여기서 files를 상위 컴포넌트로 전달하거나 상태 관리
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
    return (
      <div className="pl-2">
        <div
          className="flex items-center hover:bg-[#2a2d2e] cursor-pointer py-1"
          onClick={() => onFileSelect(file)}
        >
          <span className="mr-2">{file.type === 'directory' ? '📁' : '📄'}</span>
          <span className="text-sm text-white/80">{file.name}</span>
        </div>
        {file.type === 'directory' && file.children && (
          <div className="pl-4">
            {file.children.map((child) => (
              <FileTreeItem key={child.path} file={child} />
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="h-full bg-[#252526] border-r border-[#333333]">
      <input 
        type="file"
        ref={fileInputRef}
        className="hidden"
        webkitdirectory=""
        directory=""
        multiple
        onChange={handleFileChange}
      />
      <div className="flex flex-col">
        <SidebarIcon 
          icon="📁" 
          active 
          onClick={handleFileOpen}
        />
        <SidebarIcon icon="🔍" />
        <SidebarIcon icon="⚙️" />
      </div>
      <div className="mt-4">
        {files.map((file) => (
          <FileTreeItem key={file.path} file={file} />
        ))}
      </div>
    </div>
  );
} 