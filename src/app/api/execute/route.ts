import { exec } from 'child_process';
import { NextResponse } from 'next/server';

const ALLOWED_COMMANDS = ['node', 'npm', 'npx', 'python', 'pip', 'git'];

export async function POST(req: Request) {
  const { command } = await req.json();
  const args = command.split(' ');
  
  if (!ALLOWED_COMMANDS.includes(args[0])) {
    return NextResponse.json({
      error: '허용되지 않는 명령어입니다.'
    }, { status: 400 });
  }

  return new Promise((resolve) => {
    exec(command, (error, stdout, stderr) => {
      resolve(NextResponse.json({
        output: stdout || stderr,
        error: error?.message
      }));
    });
  });
} 