import { NodeVM } from 'vm2';

export function executeJavaScript(code: string): { output: string; error?: string } {
  const vm = new NodeVM({
    console: 'redirect',
    sandbox: {},
    timeout: 3000, // 3초 제한
  });

  let output = '';
  
  try {
    // console.log 출력을 캡처
    vm.on('console.log', (...args) => {
      output += args.map(arg => String(arg)).join(' ') + '\n';
    });

    // 코드 실행
    vm.run(`
      try {
        ${code}
      } catch (error) {
        console.log('Error:', error.message);
      }
    `);

    return { output };
  } catch (error) {
    return {
      output: '',
      error: `실행 오류: ${error instanceof Error ? error.message : String(error)}`
    };
  }
} 