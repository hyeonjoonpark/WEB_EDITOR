import { exec } from 'child_process';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const { command } = await req.json();

  return new Promise((resolve) => {
    exec(command, (error, stdout, stderr) => {
      resolve(NextResponse.json({
        output: stdout || stderr,
        error: error?.message
      }));
    });
  });
} 