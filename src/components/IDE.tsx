'use client'

import { useState, useCallback, useEffect } from 'react';
import Terminal from './Terminal';
import Editor from './Editor';
import Sidebar from './Sidebar';
import { FileType } from '@/types'

export default function IDE() {
  const [isTerminalOpen, setIsTerminalOpen] = useState(true);
  const [sidebarWidth, setSidebarWidth] = useState(48);
  const [terminalHeight, setTerminalHeight] = useState(250);
  const [isDragging, setIsDragging] = useState(false);
  const [isTerminalDragging, setIsTerminalDragging] = useState(false);
  
  // 파일 시스템 상태 추가
  const [files, setFiles] = useState<FileType[]>([
    {
      name: 'src',
      type: 'directory',
      content: '',
      path: '/src',
      children: [
        {
          name: 'components',
          type: 'directory',
          content: '',
          path: '/src/components',
          children: [
            {
              name: 'App.tsx',
              type: 'file',
              content: 'export default function App() {\n  return <div>Hello World</div>;\n}',
              path: '/src/components/App.tsx'
            },
            {
              name: 'Header.tsx',
              type: 'file',
              content: 'export default function Header() {\n  return <header>Header</header>;\n}',
              path: '/src/components/Header.tsx'
            }
          ]
        }
      ]
    }
  ]);

  // 현재 열린 파일 상태 추가
  const [currentFile, setCurrentFile] = useState<FileType | null>(null);

  // 열린 파일들의 목록을 관리하는 상태 추가
  const [openFiles, setOpenFiles] = useState<FileType[]>([]);

  // 파일 선택 핸들러 수정
  const handleFileSelect = (file: FileType) => {
    if (file.type === 'file') {
      // 이미 열린 파일인지 확인
      const existingFile = openFiles.find(f => f.path === file.path);
      
      if (existingFile) {
        // 이미 열린 파일이면 해당 파일을 현재 파일로 설정
        setCurrentFile(existingFile);
      } else {
        // 새로운 파일이면 openFiles에 추가하고 현재 파일로 설정
        setOpenFiles(prev => [...prev, file]);
        setCurrentFile(file);
      }
    }
  };

  // 파일 닫기 핸들러 수정
  const handleFileClose = (file: FileType) => {
    setOpenFiles(prev => {
      const newOpenFiles = prev.filter(f => f.path !== file.path);
      
      // 현재 파일을 닫는 경우, 다른 열린 파일로 전환
      if (currentFile?.path === file.path) {
        const nextFile = newOpenFiles[newOpenFiles.length - 1] || null;
        setCurrentFile(nextFile);
      }
      
      return newOpenFiles;
    });
  };

  // 사이드바 드래그 핸들러
  const handleSidebarMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  // 터미널 드래그 핸들러
  const handleTerminalMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsTerminalDragging(true);
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isDragging) {
      const newWidth = e.clientX;
      setSidebarWidth(Math.max(48, Math.min(newWidth, 600))); // 최소 48px, 최대 600px
    }
    if (isTerminalDragging) {
      const windowHeight = window.innerHeight;
      const newHeight = windowHeight - e.clientY;
      setTerminalHeight(Math.max(100, Math.min(newHeight, windowHeight - 200))); // 최소 100px, 최대 화면높이-200px
    }
  }, [isDragging, isTerminalDragging]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setIsTerminalDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging || isTerminalDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isTerminalDragging, handleMouseMove, handleMouseUp]);

  const handleFileChange = (updatedFile: FileType) => {
    setFiles(prevFiles => {
      const updateFileInTree = (files: FileType[]): FileType[] => {
        return files.map(file => {
          if (file.path === updatedFile.path) {
            return updatedFile;
          }
          if (file.type === 'directory' && file.children) {
            return {
              ...file,
              children: updateFileInTree(file.children)
            };
          }
          return file;
        });
      };

      return updateFileInTree(prevFiles);
    });
    setCurrentFile(updatedFile);
  };

  const handleFilesUpload = (uploadedFiles: FileType[]) => {
    setFiles(prevFiles => {
      const newFiles: FileType[] = [];
      const processedPaths = new Set<string>();

      // 업로드된 파일들을 처리
      uploadedFiles.forEach(file => {
        const pathParts = file.path.split('/').filter(Boolean);
        let currentPath = '';
        
        // 각 경로 부분에 대해 디렉토리 구조 생성
        for (let i = 0; i < pathParts.length - 1; i++) {
          const part = pathParts[i];
          currentPath = currentPath ? `${currentPath}/${part}` : part;

          if (!processedPaths.has(currentPath)) {
            processedPaths.add(currentPath);
            
            // 새 디렉토리 생성
            const newDir: FileType = {
              name: part,
              type: 'directory',
              path: currentPath,
              content: '',
              children: []
            };

            // 디렉토리를 적절한 위치에 추가
            let target = newFiles;
            const parentPath = currentPath.split('/').slice(0, -1).join('/');
            if (parentPath) {
              const parent = findFileByPath(newFiles, parentPath);
              if (parent && parent.children) {
                target = parent.children;
              }
            }
            target.push(newDir);
          }
        }

        // 파일 추가
        const parentPath = pathParts.slice(0, -1).join('/');
        const parent = parentPath ? findFileByPath(newFiles, parentPath) : null;
        
        if (parent && parent.children) {
          parent.children.push(file);
        } else {
          newFiles.push(file);
        }
      });

      return newFiles;
    });
  };

  // 경로로 파일/디렉토리를 찾는 헬퍼 함수
  const findFileByPath = (files: FileType[], path: string): FileType | null => {
    for (const file of files) {
      if (file.path === path) return file;
      if (file.children) {
        const found = findFileByPath(file.children, path);
        if (found) return found;
      }
    }
    return null;
  };

  // 모든 파일 경로를 가져오는 헬퍼 함수
  const getAllFilePaths = (files: FileType[]): string[] => {
    const paths: string[] = [];
    
    const traverse = (file: FileType) => {
      paths.push(file.path);
      if (file.type === 'directory' && file.children) {
        file.children.forEach(traverse);
      }
    };
    
    files.forEach(traverse);
    return paths;
  };

  return (
    <div className="h-screen flex flex-col bg-[#1e1e1e]">
      <div className="h-9 bg-[#3c3c3c] flex items-center px-4 text-white/80 text-sm">
        <div className="flex space-x-4">
          <span>File</span>
          <span>Edit</span>
          <span>View</span>
          <span>Go</span>
          <span>Run</span>
          <span>Terminal</span>
          <span>Help</span>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div 
          className="flex-shrink-0 border-r border-[#333333] relative" 
          style={{ width: `${sidebarWidth}px` }}
        >
          <Sidebar 
            files={files} 
            onFileSelect={handleFileSelect} 
            currentFile={currentFile || undefined}
            onFilesUpload={handleFilesUpload}
            openFiles={openFiles}
            onFileClose={handleFileClose}
          />
          <div
            className="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-[#007acc]"
            onMouseDown={handleSidebarMouseDown}
          />
        </div>
        
        <div className="flex-1 flex flex-col">
          <div className="flex-1 overflow-hidden">
            <Editor 
              currentFile={currentFile} 
              onFileChange={handleFileChange}
            />
          </div>
          
          {isTerminalOpen && (
            <div 
              className="border-t border-[#333333] relative"
              style={{ height: `${terminalHeight}px` }}
            >
              <div
                className="absolute top-0 left-0 right-0 h-1 cursor-row-resize hover:bg-[#007acc]"
                onMouseDown={handleTerminalMouseDown}
              />
              <div className="h-9 bg-[#252526] flex items-center px-4 text-white/80 text-sm border-b border-[#333333]">
                <div className="flex items-center space-x-2">
                  <span>Terminal</span>
                  <button 
                    onClick={() => setIsTerminalOpen(false)}
                    className="ml-4 hover:bg-[#333333] px-2 py-1 rounded"
                  >
                    ✕
                  </button>
                </div>
              </div>
              <Terminal />
            </div>
          )}
        </div>
      </div>

      <div className="h-6 bg-[#007acc] text-white/80 text-xs flex items-center px-4">
        <div className="flex space-x-4">
          <span>Ready</span>
          <span>UTF-8</span>
          <span>JavaScript</span>
        </div>
      </div>
    </div>
  );
} 