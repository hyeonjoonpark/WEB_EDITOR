'use client'

import { useState, useRef, useEffect } from 'react';
import { BrewPackage, CommandHistory, FileSystem } from '@/types';
import { initialBrewPackages, initialFileSystem } from '@/data/initialState';
import { handleTabCompletion } from '@/utils/tabCompletion';
import { 
  createFile, 
  createDirectory, 
  generateLsOutput,
  removeFile,
  copyFile,
  moveFile,
  writeToFile,
  showFileContent 
} from '@/utils/fileSystemUtils';
import { findFiles, searchInFiles } from '@/utils/searchUtils';

export default function Terminal() {
  const [history, setHistory] = useState<string[]>([]);
  const [currentCommand, setCurrentCommand] = useState('');
  const [path, setPath] = useState('~');
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [brewPackages, setBrewPackages] = useState<BrewPackage[]>(initialBrewPackages);
  const [fileSystem, setFileSystem] = useState<FileSystem>({
    type: 'directory',
    name: 'root',
    children: initialFileSystem
  } as FileSystem);
  const [currentDirectory, setCurrentDirectory] = useState<string[]>([]);
  const [commandHistory, setCommandHistory] = useState<CommandHistory[]>([]);

  const executeCommand = (command: string) => {
    const args = command.trim().split(' ');
    const cmd = args[0].toLowerCase();
    let output = '';

    switch (cmd) {
      case 'clear':
        setHistory([]);
        return;

      // 디렉토리 탐색
      case 'cd':
        if (args[1] === '..') {
          if (currentDirectory.length > 0) {
            setCurrentDirectory(prev => prev.slice(0, -1));
            setPath(prev => prev.split('/').slice(0, -1).join('/') || '~');
          }
        } else if (args[1]) {
          const targetDir = typeof fileSystem.children === 'object' && fileSystem.children && !Array.isArray(fileSystem.children)
            ? (fileSystem.children as Record<string, FileSystem>)[args[1]]
            : undefined;
          if (!targetDir || targetDir.type !== 'directory') {
            output = `cd: ${args[1]}: No such directory`;
            break;
          }
          setCurrentDirectory(prev => [...prev, args[1]]);
          setPath(prev => `${prev}/${args[1]}`);
        } else {
          setCurrentDirectory([]);
          setPath('~');
        }
        break;

      case 'ls':
        const currentDirContents = fileSystem.children ? Object.entries(fileSystem.children)
          .map(([name, item]) => {
            if (item.type === 'directory') {
              return `${name}/`;
            }
            return name;
          })
          .join('  ') : '';
        output = currentDirContents;
        break;

      // 파일 조작
      case 'touch':
        if (args[1]) {
          output = createFile(args[1]);
        }
        break;

      case 'mkdir':
        if (args[1]) {
          setFileSystem(prev => ({
            ...prev,
            children: {
              ...prev.children,
              [args[1]]: {
                type: 'directory' as const,
                name: args[1],
                children: {}
              }
            }
          } as FileSystem));
          output = `디렉토리 생성됨: ${args[1]}`;
        }
        break;

      case 'rm':
        const recursive = args.includes('-r') || args.includes('-rf');
        if (args[args.length - 1] !== '-r' && args[args.length - 1] !== '-rf') {
          output = removeFile(args[args.length - 1], recursive);
        }
        break;

      case 'cp':
        if (args.length === 3) {
          output = copyFile(args[1], args[2]);
        }
        break;

      case 'mv':
        if (args.length === 3) {
          output = moveFile(args[1], args[2]);
        }
        break;

      // 파일 내용 보기/수정
      case 'cat':
        if (args[1]) {
          output = showFileContent(args[1], [fileSystem]);
        }
        break;

      case 'echo':
        if (args.length > 1) {
          const text = args.slice(1).join(' ');
          if (args.includes('>')) {
            const fileName = args[args.indexOf('>') + 1];
            output = writeToFile(fileName, text);
          } else {
            output = text;
          }
        }
        break;

      // 스템 정보
      case 'whoami':
        output = 'current-user';
        break;

      case 'date':
        output = new Date().toString();
        break;

      case 'df':
        output = '파일시스템 정보:\nFilesystem Size Used Avail Use%\n/ 499G 374G 125G 75%';
        break;

      case 'top':
        output = '프로세스 모니터링 시작...';
        break;

      // 검색
      case 'find':
        if (args.length > 1) {
          output = findFiles(args[1]);
        }
        break;

      case 'grep':
        if (args.length > 2) {
          output = searchInFiles(args[1], args[2]);
        }
        break;

      // 프로세스 관리
      case 'ps':
        output = 'PID TTY TIME CMD\n1234 ttys000 0:00.12 -zsh';
        break;

      case 'kill':
        if (args[1]) {
          output = `프로세스 ${args[1]} 종료 시도...`;
        }
        break;

      // 네트워크
      case 'ping':
        if (args[1]) {
          output = `PING ${args[1]} (127.0.0.1): 56 data bytes\n64 bytes from 127.0.0.1: icmp_seq=0 ttl=64 time=0.037 ms`;
        }
        break;

      case 'curl':
        if (args[1]) {
          output = `${args[1]}에 요청 보내는 중...`;
        }
        break;

      // 압축
      case 'tar':
        output = '압제 작업 시뮬레이션...';
        break;

      case 'zip':
      case 'unzip':
        output = '압축/해제 작업 시뮬레이션...';
        break;

      // 권한 관리
      case 'chmod':
        if (args.length > 2) {
          output = `${args[2]}의 권한을 ${args[1]}로 변경 중...`;
        }
        break;

      case 'brew':
        if (args[1] === 'list') {
          output = brewPackages
            .filter(pkg => pkg.status === 'installed')
            .map(pkg => `${pkg.name} ${pkg.version}`)
            .join('\n');
        } else if (args[1] === 'search' && args[2]) {
          const searchResult = brewPackages
            .filter(pkg => pkg.name.includes(args[2]))
            .map(pkg => `${pkg.name} ${pkg.version} (${pkg.status})`)
            .join('\n');
          output = searchResult || '검색 결과가 없습니다.';
        } else if (args[1] === 'install' && args[2]) {
          const packageToInstall = brewPackages.find(pkg => pkg.name === args[2]);
          if (packageToInstall) {
            if (packageToInstall.status === 'installed') {
              output = `${args[2]}는 이미 설치되어 있습니다.`;
            } else {
              setBrewPackages(prev => prev.map(pkg => 
                pkg.name === args[2] 
                  ? { ...pkg, status: 'installed' }
                  : pkg
              ));
              output = `${args[2]} 패키지를 설치하는 중...\n설치가 완료되었습니다.\n사용 가능한 명령어: ${packageToInstall.commands?.join(', ')}`;
            }
          } else {
            output = `패키지 찾을 수 없습니다: ${args[2]}`;
          }
        } else if (args[1] === 'uninstall' && args[2]) {
          setBrewPackages(prev => prev.map(pkg => 
            pkg.name === args[2] 
              ? { ...pkg, status: 'not installed' }
              : pkg
          ));
          output = `${args[2]} 패키지를 제거하는 중...\n제거가 완료되었습니다.`;
        } else if (args[1] === 'help') {
          output = `용 가능한 brew 명령어:
- brew list: 설치된 패키지 목록
- brew search <패키지명>: 패키지 검색
- brew install <패키지명>: 패키�� 설치
- brew uninstall <패키지명>: 패키지 제거
- brew help: brew 도움말`;
        } else {
          output = '원하지 않는 brew 명령어입니다. "brew help"를 입력하여 사용 가능한 명령어를 확인하세요.';
        }
        break;
      case 'help':
        output = `사용 가능한 명령어:
- clear: 화면 지우기
- pwd: 현재 경로 표시
- ls: 파일 목록
- brew: 패키지 관리 (brew help로 자세한 정보 확인)
- help: 도움말`;
        break;
      default:
        const isPackageCommand = brewPackages
          .find(pkg => pkg.status === 'installed' && pkg.commands?.includes(args[0]));
        
        if (isPackageCommand) {
          switch(args[0]) {
            case 'node':
              if (args.length === 1) {
                output = 'Node.js REPL을 시작합니다. (.exit으로 종료)\n> ';
              } else {
                output = `Node.js로 ${args.slice(1).join(' ')} 실행 중...`;
              }
              break;
            case 'python':
              if (args.length === 1) {
                output = 'Python 인터프리터를 시작합니다. (exit()로 종료)\n>>> ';
              } else {
                output = `Python으로 ${args.slice(1).join(' ')} 실행 중...`;
              }
              break;
            case 'npm':
              output = `npm 명령어 실행 중: ${args.slice(1).join(' ')}`;
              break;
            case 'pip':
              output = `pip 명령어 실행 중: ${args.slice(1).join(' ')}`;
              break;
          }
        } else if (cmd) {
          output = `Command not found: ${cmd}. 패키지가 설치되어 있는지 확인하세요.`;
        }
    }

    setHistory(prev => [...prev, `${path} $ ${command}`, output]);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      executeCommand(currentCommand);
      setCurrentCommand('');
    }
    if (e.key === 'Tab') {
      e.preventDefault();
      handleTabCompletion(currentCommand, currentDirectory, [fileSystem], setCurrentCommand);
    }
  };

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
    inputRef.current?.focus();
  }, [history]);

  return (
    <div className="min-h-screen bg-black p-4">
      <div 
        ref={containerRef}
        className="bg-black text-green-500 font-mono p-4 rounded-lg h-[80vh] overflow-y-auto"
      >
        <div className="mb-4">
          웹 IDE에 오신 것을 환영합니다. 'help'를 입력하여 사용 가능한 명령어를 확인하세요.
        </div>
        
        {history.map((line, i) => (
          <div key={i} className="whitespace-pre-wrap">{line}</div>
        ))}

        <div className="flex">
          <span className="mr-2">{path} $</span>
          <input
            ref={inputRef}
            type="text"
            value={currentCommand}
            onChange={(e) => setCurrentCommand(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent outline-none text-green-500"
            autoFocus
          />
        </div>
      </div>
    </div>
  );
}
