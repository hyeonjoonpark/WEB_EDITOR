'use client'

import { useState, useCallback, useEffect } from 'react';
import Terminal from './Terminal';
import Editor from './Editor';
import Sidebar from './Sidebar';
import { FileType } from '@/types/index'
import DebugConsole from './DebugConsole';
import * as ts from 'typescript';

export default function IDE() {
  const [isTerminalOpen, setIsTerminalOpen] = useState(true);
  const [sidebarWidth] = useState(255);
  const [terminalHeight, setTerminalHeight] = useState(300);
  const [isTerminalDragging, setIsTerminalDragging] = useState(false);
  
  // 파일 시스템 상태 추가
  const [files, setFiles] = useState<FileType[]>([]);

  // 현재 열린 파일 상태 추가
  const [currentFile, setCurrentFile] = useState<FileType | null>(null);

  // 열린 파일들의 목록을 관리하는 상태 추가
  const [openFiles, setOpenFiles] = useState<FileType[]>([]);

  const [consoleOutput, setConsoleOutput] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'terminal' | 'debug'>('terminal');

  const [history, setHistory] = useState<string[]>([]);
  const [debugOutput, setDebugOutput] = useState<string[]>([]);

  // API 호출로 코드 실행
  const executeCode = async (code: string) => {
    const response = await fetch('/api/execute', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ code }),
    });
    const result = await response.json();
    setDebugOutput(prev => [...prev, result.output || result.error]);
    setActiveTab('debug');
  };

  const handleRunCode = useCallback(() => {
    if (!currentFile?.content) return;

    const outputs = compileAndExecute(currentFile.content);
    setDebugOutput(outputs);
    outputs.forEach(output => {
      setHistory(prev => [...prev, output]);
    });
    setActiveTab('debug');
  }, [currentFile]);

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

  const handleTerminalResize = useCallback((e: MouseEvent) => {
    const newHeight = window.innerHeight - e.clientY;
    setTerminalHeight(Math.max(100, Math.min(newHeight, window.innerHeight - 200)));
  }, []);

  const handleTerminalMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsTerminalDragging(true);
    
    const handleMouseMove = (e: MouseEvent) => {
      handleTerminalResize(e);
    };
    
    const handleMouseUp = () => {
      setIsTerminalDragging(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [handleTerminalResize]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isTerminalDragging) {
      const windowHeight = window.innerHeight;
      const newHeight = windowHeight - e.clientY;
      setTerminalHeight(Math.max(100, Math.min(newHeight, windowHeight - 200)));
    }
  }, [isTerminalDragging]);

  const handleMouseUp = useCallback(() => {
    setIsTerminalDragging(false);
  }, []);

  useEffect(() => {
    if (isTerminalDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isTerminalDragging, handleMouseMove, handleMouseUp]);

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

            // 디토리를 적절한 위치에 추가
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

  // 새 폴더 생성 핸들러
  const handleCreateFolder = () => {
    const folderName = prompt('생성할 폴더 이름을 입력하세요:');
    if (!folderName) return;

    setFiles(prevFiles => {
      const newFolder: FileType = {
        name: folderName,
        type: 'directory',
        path: `/${folderName}`,
        content: '',
        children: []
      };

      return [...prevFiles, newFolder];
    });
  };

  // 새 파일 생성 핸들러
  const handleCreateFile = () => {
    const fileName = prompt('생성할 파일 이름을 입력하세요:');
    if (!fileName) return;

    const newFile: FileType = {
      name: fileName,
      type: 'file',
      path: `/${fileName}`,
      content: '',
      children: []
    };

    setFiles(prevFiles => [...prevFiles, newFile]);
    setOpenFiles(prevFiles => [...prevFiles, newFile]);
    setCurrentFile(newFile);
  };

  // compileAndExecute 함수 추가
  const compileAndExecute = (code: string): string[] => {
    try {
      const result = ts.transpileModule(code, {
        compilerOptions: { module: ts.ModuleKind.CommonJS }
      });
      
      // 트랜스파일된 코드를 콘솔에 출력
      return [`Transpiled code:\n${result.outputText}`];
    } catch (error) {
      return [`Error: ${error instanceof Error ? error.message : String(error)}`];
    }
  };

  return (
    <div className="fixed inset-0 flex flex-col bg-[#1e1e1e] text-white">
      {/* 상단 메뉴바 */}
      <div className="h-8 bg-[#323233] flex items-center px-2 text-[#CCCCCC] space-x-2">
        <button 
          onClick={handleRunCode}
          className="flex items-center px-2 py-1 hover:bg-[#3c3c3c] rounded"
        >
          <svg className="w-4 h-4 mr-1" viewBox="0 0 16 16" fill="currentColor">
            <path d="M4 2v12l8-6z"/>
          </svg>
          Run
        </button>
      </div>

      {/* 메인 영역 */}
      <div className="flex flex-1 min-h-0">
        {/* Activity Bar + Sidebar */}
        <div className="flex h-full">
          {/* Activity Bar */}
          <div className="w-12 flex-shrink-0 bg-[#333333] flex flex-col items-center py-2">
            <button className="w-12 h-12 flex items-center justify-center hover:bg-[#424242] relative group">
              <svg className="w-6 h-6" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
              <div className="absolute left-0 w-[2px] h-12 bg-white" />
            </button>
            <button className="w-12 h-12 flex items-center justify-center hover:bg-[#424242]">
              <svg className="w-6 h-6" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                <path d="M11.25 4.533A9.707 9.707 0 006 3a9.735 9.735 0 00-3.25.555.75.75 0 00-.5.707v14.25a.75.75 0 001 .707A8.237 8.237 0 016 18.75c1.995 0 3.823.707 5.25 1.886V4.533zM12.75 20.636A8.214 8.214 0 0118 18.75c.966 0 1.89.166 2.75.47a.75.75 0 001-.708V4.262a.75.75 0 00-.5-.707A9.735 9.735 0 0018 3a9.707 9.707 0 00-5.25 1.533v16.103z" />
              </svg>
            </button>
            <button className="w-12 h-12 flex items-center justify-center hover:bg-[#424242]">
              <svg className="w-6 h-6" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                <path d="M21.731 2.269a2.625 2.625 0 00-3.712 0l-1.157 1.157 3.712 3.712 1.157-1.157a2.625 2.625 0 000-3.712zM19.513 8.199l-3.712-3.712-12.15 12.15a5.25 5.25 0 00-1.32 2.214l-.8 2.685a.75.75 0 00.933.933l2.685-.8a5.25 5.25 0 002.214-1.32L19.513 8.2z" />
              </svg>
            </button>
          </div>

          {/* Sidebar + 드래그 핸들러 */}
          <div className="flex h-full" style={{ width: `${sidebarWidth}px` }}>
            <div className="flex-1 h-full bg-[#252526] overflow-auto">
              <Sidebar 
                files={files} 
                onFileSelect={handleFileSelect} 
                currentFile={currentFile || undefined}
                onFilesUpload={handleFilesUpload}
                openFiles={openFiles}
                onFileClose={handleFileClose}
                onCreateFolder={handleCreateFolder}
                onCreateFile={handleCreateFile}
              />
            </div>
          </div>
        </div>

        {/* 에디터와 터미널/디버그 영역 */}
        <div className="flex-1 flex flex-col min-h-0">
          {/* 에디터 영역 */}
          <div className="flex-1 overflow-hidden bg-[#1e1e1e]">
            <Editor 
              currentFile={currentFile} 
              onFileChange={handleFileChange}
              onRun={(code) => {
                executeCode(code);
                setActiveTab('debug');
              }}
            />
          </div>

          {/* 터미널/디버그 영역 */}
          <div 
            className="relative bg-[#1e1e1e]" 
            style={{ height: `${terminalHeight}px` }}
          >
            {/* 드래그 핸들 */}
            <div
              className="absolute top-0 left-0 right-0 h-1 cursor-ns-resize hover:bg-[#007acc]"
              onMouseDown={handleTerminalMouseDown}
            />

            <div className="h-full flex flex-col">
              {/* 탭 버튼을 가로로 배치 */}
              <div className="flex border-b border-[#333333] bg-[#252526]">
                <button
                  className={`px-4 py-1 text-sm ${
                    activeTab === 'terminal' 
                      ? 'bg-[#1e1e1e] text-white border-t-2 border-[#007acc]' 
                      : 'text-[#969696] hover:bg-[#2d2d2d]'
                  }`}
                  onClick={() => setActiveTab('terminal')}
                >
                  Terminal
                </button>
                <button
                  className={`px-4 py-1 text-sm ${
                    activeTab === 'debug' 
                      ? 'bg-[#1e1e1e] text-white border-t-2 border-[#007acc]' 
                      : 'text-[#969696] hover:bg-[#2d2d2d]'
                  }`}
                  onClick={() => setActiveTab('debug')}
                >
                  Debug
                </button>
              </div>

              {/* 콘텐츠 영역 */}
              <div className="flex-1">
                {activeTab === 'terminal' ? (
                  <Terminal 
                    onAddOutput={(output) => setHistory(prev => [...prev, output])}
                    history={history}
                  />
                ) : (
                  <DebugConsole output={debugOutput} />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 하단 상태바 */}
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