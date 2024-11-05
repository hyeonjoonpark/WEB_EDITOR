import { BrewPackage, FileSystem } from '@/types/index';

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

export const initialFileSystem: FileSystem = {
  name: 'root',
  type: 'directory',
  children: {}
}; 