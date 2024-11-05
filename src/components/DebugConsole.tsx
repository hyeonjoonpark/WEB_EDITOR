'use client'

interface DebugConsoleProps {
  output: string[];
}

export default function DebugConsole({ output }: DebugConsoleProps) {
  return (
    <div className="h-full bg-[#1e1e1e] text-white p-2 font-mono text-sm overflow-auto">
      {output.map((line, index) => (
        <div 
          key={index} 
          className={`whitespace-pre-wrap ${line.startsWith('Error') ? 'text-red-400' : 'text-green-400'}`}
        >
          {line.startsWith('Error') ? '❌ ' : '✓ '}{line}
        </div>
      ))}
    </div>
  );
} 