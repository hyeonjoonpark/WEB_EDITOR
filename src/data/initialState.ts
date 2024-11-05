import { BrewPackage, FileSystem } from '@/types';

export const initialBrewPackages: BrewPackage[] = [
  {
    name: 'node',
    version: '20.11.0',
    status: 'installed',
    commands: ['node', 'npm']
  },
  {
    name: 'python',
    version: '3.11.0',
    status: 'installed',
    commands: ['python', 'pip']
  },
  {
    name: 'git',
    version: '2.43.0',
    status: 'installed',
    commands: ['git']
  }
];

export const initialFileSystem: FileSystem[] = [
  {
    name: 'Documents',
    type: 'directory',
    children: [
      { name: 'notes.txt', type: 'file', content: '메모입니다.' }
    ]
  },
  {
    name: 'Downloads',
    type: 'directory',
    children: []
  }
]; 