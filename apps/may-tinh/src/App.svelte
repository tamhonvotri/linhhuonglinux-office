<script lang="ts">
  let expression = '';
  let result = '';
  let steps: string[] = [];

  function evaluateStepByStep(expr: string): { result: string, log: string[] } {
    let log: string[] = [];
    // Remove spaces
    let current = expr.replace(/\s+/g, '');
    
    // Function to calculate a simple binary operation
    const calc = (a: number, op: string, b: number) => {
      switch (op) {
        case '*': return a * b;
        case '/': return b === 0 ? NaN : a / b;
        case '+': return a + b;
        case '-': return a - b;
        default: return 0;
      }
    };

    // Regex for finding innermost parentheses
    const parenRegex = /\(([^()]+)\)/;
    // Regex for finding multiplication/division
    const mulDivRegex = /(-?\d+\.?\d*)([\*\/])(-?\d+\.?\d*)/;
    // Regex for finding addition/subtraction
    const addSubRegex = /(-?\d+\.?\d*)([\+\-])(-?\d+\.?\d*)/;

    let stepCount = 1;
    let maxIterations = 100;

    while (isNaN(Number(current)) && maxIterations > 0) {
      maxIterations--;
      let match;
      
      if ((match = parenRegex.exec(current)) !== null) {
        let inside = match[1];
        let subRes = evaluateStepByStep(inside);
        log.push(...subRes.log);
        current = current.replace(match[0], subRes.result);
        log.push(`Bỏ ngoặc: ${current}`);
      } else if ((match = mulDivRegex.exec(current)) !== null) {
        let res = calc(parseFloat(match[1]), match[2], parseFloat(match[3]));
        current = current.replace(match[0], res.toString());
        log.push(`Thực hiện phép ${match[2] === '*' ? 'nhân' : 'chia'}: ${match[0]} = ${res} \n => ${current}`);
      } else if ((match = addSubRegex.exec(current)) !== null) {
        // Prevent matching negative numbers at the start as an operation
        if (match.index === 0 && match[1] === '') {
          // It's just a negative number
          break;
        }
        let res = calc(parseFloat(match[1]), match[2], parseFloat(match[3]));
        current = current.replace(match[0], res.toString());
        log.push(`Thực hiện phép ${match[2] === '+' ? 'cộng' : 'trừ'}: ${match[0]} = ${res} \n => ${current}`);
      } else {
        break;
      }
    }
    
    if (isNaN(Number(current))) throw new Error("Invalid expression");
    return { result: current, log };
  }

  function solve() {
    if (!expression.trim()) return;
    
    steps = [];
    steps.push(`Biểu thức gốc: ${expression}`);
    
    try {
      const res = evaluateStepByStep(expression);
      steps.push(...res.log);
      
      let finalNum = parseFloat(res.result);
      // Format to max 4 decimal places to avoid floating point issues
      result = String(Math.round(finalNum * 10000) / 10000);
      steps.push(`Kết quả cuối cùng: ${result}`);
    } catch (e) {
      result = 'Lỗi cú pháp';
      steps.push(`Không thể giải biểu thức này. Vui lòng kiểm tra lại cú pháp.`);
    }
  }

  function append(char: string) {
    expression += char;
  }
  
  function clear() {
    expression = '';
    result = '';
    steps = [];
  }
</script>

<div class="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans">
  <div class="max-w-4xl w-full bg-white rounded-3xl shadow-[0_20px_50px_rgba(8,_112,_184,_0.07)] overflow-hidden flex flex-col md:flex-row border border-slate-100">
    
    <!-- Left: Calculator UI -->
    <div class="w-full md:w-1/2 p-8 bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex flex-col justify-between relative overflow-hidden">
      <!-- Decorative circles -->
      <div class="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
      <div class="absolute bottom-0 left-0 w-48 h-48 bg-purple-900/20 rounded-full blur-2xl translate-y-1/4 -translate-x-1/4"></div>
      
      <div>
        <h1 class="text-3xl font-extrabold tracking-tight mb-2 flex items-center relative z-10">
          <span class="text-indigo-200 mr-2 text-4xl">∑</span>
          Linh Hương Math
        </h1>
        <p class="text-indigo-100 text-sm mb-8 relative z-10">Máy tính Thông minh dành cho Giáo dục</p>
        
        <div class="bg-black/20 rounded-2xl p-6 backdrop-blur-sm border border-white/10 shadow-inner relative z-10 mb-6">
          <div class="text-indigo-100 text-sm text-right h-6 mb-1 font-mono tracking-wider">{expression || '0'}</div>
          <div class="text-4xl font-bold text-right truncate font-mono text-white tracking-tight">{result || '0'}</div>
        </div>
      </div>
      
      <div class="grid grid-cols-4 gap-3 relative z-10">
        <button on:click={clear} class="col-span-2 py-4 bg-rose-500 hover:bg-rose-600 text-white rounded-xl font-bold transition-all shadow-md active:scale-95 text-lg">AC</button>
        <button on:click={() => append('(')} class="py-4 bg-white/10 hover:bg-white/20 text-indigo-100 rounded-xl font-medium transition-all active:scale-95 text-xl">(</button>
        <button on:click={() => append(')')} class="py-4 bg-white/10 hover:bg-white/20 text-indigo-100 rounded-xl font-medium transition-all active:scale-95 text-xl">)</button>
        
        {#each ['7', '8', '9', '/'] as btn}
          <button on:click={() => append(btn)} class="py-4 {['/','*','-','+'].includes(btn) ? 'bg-indigo-400 hover:bg-indigo-500 text-white shadow-md' : 'bg-white/5 hover:bg-white/10 text-white'} rounded-xl font-semibold transition-all active:scale-95 text-2xl">{btn}</button>
        {/each}
        
        {#each ['4', '5', '6', '*'] as btn}
          <button on:click={() => append(btn)} class="py-4 {['/','*','-','+'].includes(btn) ? 'bg-indigo-400 hover:bg-indigo-500 text-white shadow-md' : 'bg-white/5 hover:bg-white/10 text-white'} rounded-xl font-semibold transition-all active:scale-95 text-2xl">{btn === '*' ? '×' : btn}</button>
        {/each}
        
        {#each ['1', '2', '3', '-'] as btn}
          <button on:click={() => append(btn)} class="py-4 {['/','*','-','+'].includes(btn) ? 'bg-indigo-400 hover:bg-indigo-500 text-white shadow-md' : 'bg-white/5 hover:bg-white/10 text-white'} rounded-xl font-semibold transition-all active:scale-95 text-2xl">{btn}</button>
        {/each}
        
        <button on:click={() => append('0')} class="py-4 bg-white/5 hover:bg-white/10 text-white rounded-xl font-semibold transition-all active:scale-95 text-2xl">0</button>
        <button on:click={() => append('.')} class="py-4 bg-white/5 hover:bg-white/10 text-white rounded-xl font-semibold transition-all active:scale-95 text-2xl">.</button>
        <button on:click={() => append('+')} class="py-4 bg-indigo-400 hover:bg-indigo-500 text-white rounded-xl font-semibold transition-all active:scale-95 text-2xl shadow-md">+</button>
        <button on:click={solve} class="py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold transition-all active:scale-95 text-3xl shadow-lg">=</button>
      </div>
    </div>
    
    <!-- Right: Step-by-step logic -->
    <div class="w-full md:w-1/2 p-8 bg-white flex flex-col h-[600px] md:h-auto">
      <h2 class="text-xl font-bold text-slate-800 mb-6 flex items-center border-b pb-4">
        <svg class="w-6 h-6 text-emerald-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path></svg>
        Phân tích các bước (Tư duy Toán học)
      </h2>
      
      <div class="flex-1 overflow-y-auto pr-2 space-y-4 relative">
        {#if steps.length === 0}
          <div class="absolute inset-0 flex flex-col items-center justify-center text-slate-400 opacity-60">
            <svg class="w-16 h-16 mb-4 text-slate-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
            <p>Nhập biểu thức và nhấn = để xem cách giải</p>
          </div>
        {:else}
          {#each steps as step, i}
            <div class="flex items-start bg-slate-50 p-4 rounded-xl border border-slate-100 shadow-sm animate-fade-in-up" style="animation-delay: {i * 150}ms">
              <div class="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-sm shrink-0 mt-0.5">
                {i + 1}
              </div>
              <div class="ml-4 flex-1">
                <p class="text-slate-700 font-medium leading-relaxed">{step}</p>
                {#if i === steps.length - 1 && result !== 'Lỗi cú pháp'}
                  <div class="mt-3 p-3 bg-emerald-50 border border-emerald-100 rounded-lg text-emerald-800 font-bold flex justify-between items-center">
                    <span>Đáp số:</span>
                    <span class="text-2xl font-mono">{result}</span>
                  </div>
                {/if}
              </div>
            </div>
          {/each}
        {/if}
      </div>
      
      <div class="mt-6 pt-4 border-t border-slate-100 text-center">
        <button class="text-sm font-semibold text-indigo-600 hover:text-indigo-800 transition-colors flex items-center justify-center w-full bg-indigo-50 hover:bg-indigo-100 py-3 rounded-xl">
          <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          Hỏi AI cách giải chi tiết hơn
        </button>
      </div>
    </div>
  </div>
</div>

<style>
  :global(.animate-fade-in-up) {
    animation: fadeInUp 0.5s ease-out forwards;
    opacity: 0;
  }
  
  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(15px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
</style>
