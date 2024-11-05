'use client'

import { useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { FileType } from '@/types/index';

interface EditorProps {
  currentFile: FileType | null;
  onFileChange: (updatedFile: FileType) => void;
  onRun: (code: string) => void;
}

export default function CodeEditor({ currentFile, onFileChange, onRun }: EditorProps) {
  const getLanguage = (filename: string) => {
    const ext = filename.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'js':
        return 'javascript';
      case 'ts':
      case 'tsx':
        return 'typescript';
      case 'jsx':
        return 'javascript';
      case 'css':
        return 'css';
      case 'html':
        return 'html';
      case 'json':
        return 'json';
      default:
        return 'plaintext';
    }
  };

  if (!currentFile) {
    return (
      <div className="h-full flex items-center justify-center text-white/50">
        파일을 선택해주세요
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="h-9 bg-[#252526] flex items-center px-4 text-white/80 text-sm border-b border-[#333333]">
        {currentFile.name}
      </div>
      <div className="flex-1">
        <Editor
          height="100%"
          defaultLanguage={getLanguage(currentFile.name)}
          value={currentFile.content}
          onChange={(value) => {
            if (onFileChange && value) {
              onFileChange({
                ...currentFile,
                content: value
              });
            }
          }}
          theme="vs-dark"
          options={{
            fontSize: 14,
            minimap: { enabled: true },
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 2,
            wordWrap: 'on',
            renderWhitespace: 'selection',
            lineNumbers: 'on',
            glyphMargin: true,
            folding: true,
            lineDecorationsWidth: 10,
            bracketPairColorization: { enabled: true },
          }}
        />
      </div>
    </div>
  );
} 