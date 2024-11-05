import { VM } from 'vm2';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const { code } = await request.json();
  
  const vm = new VM();
  try {
    const result = vm.run(code);
    return Response.json({ result });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 400 });
  }
} 