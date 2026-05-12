<script lang="ts">
  let mode: 'basic' | 'advanced' = 'basic';
  let expression = '';
  let result = '';
  let steps: string[] = [];

  // Formula state
  let a = ''; let b = ''; let c = '';
  let formulaType = 'ptb2'; // ptb2, pytago, circle

  function evaluateStepByStep(expr: string): { result: string, log: string[] } {
    let log: string[] = [];
    let current = expr.replace(/\s+/g, '');
    
    const calc = (a: number, op: string, b: number) => {
      switch (op) {
        case '*': return a * b;
        case '/': return b === 0 ? NaN : a / b;
        case '+': return a + b;
        case '-': return a - b;
        default: return 0;
      }
    };

    const parenRegex = /\(([^()]+)\)/;
    const mulDivRegex = /(-?\d+\.?\d*)([\*\/])(-?\d+\.?\d*)/;
    const addSubRegex = /(-?\d+\.?\d*)([\+\-])(-?\d+\.?\d*)/;

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
        log.push(`Thực hiện phép ${match[2] === '*' ? 'nhân' : 'chia'}: ${match[0]} = ${res} => ${current}`);
      } else if ((match = addSubRegex.exec(current)) !== null) {
        if (match.index === 0 && match[1] === '') break;
        let res = calc(parseFloat(match[1]), match[2], parseFloat(match[3]));
        current = current.replace(match[0], res.toString());
        log.push(`Thực hiện phép ${match[2] === '+' ? 'cộng' : 'trừ'}: ${match[0]} = ${res} => ${current}`);
      } else {
        break;
      }
    }
    if (isNaN(Number(current))) throw new Error("Invalid expression");
    return { result: current, log };
  }

  function solveBasic() {
    if (!expression.trim()) return;
    steps = [];
    steps.push(`Biểu thức gốc: ${expression}`);
    try {
      const res = evaluateStepByStep(expression);
      steps.push(...res.log);
      let finalNum = parseFloat(res.result);
      result = String(Math.round(finalNum * 10000) / 10000);
      steps.push(`Kết quả cuối cùng: ${result}`);
    } catch (e) {
      result = 'Lỗi';
      steps.push(`Cú pháp không hợp lệ.`);
    }
  }

  function solveAdvanced() {
    steps = [];
    result = '';
    let valA = parseFloat(a) || 0;
    let valB = parseFloat(b) || 0;
    let valC = parseFloat(c) || 0;

    if (formulaType === 'ptb2') {
      steps.push(`1. Phân tích Phương trình bậc 2: ${valA}x² + ${valB}x + ${valC} = 0`);
      if (valA === 0) {
        steps.push(`Vì hệ số a = 0, đây trở thành phương trình bậc 1.`);
        if (valB === 0) {
            result = valC === 0 ? "Vô số nghiệm" : "Vô nghiệm";
        } else {
            let x = -valC / valB;
            result = `x = ${Math.round(x*100)/100}`;
            steps.push(`Giải phương trình bậc 1: ${valB}x + ${valC} = 0 => x = -c/b = ${result}`);
        }
      } else {
        let delta = valB * valB - 4 * valA * valC;
        steps.push(`2. Tính Delta (Δ) = b² - 4ac`);
        steps.push(`Δ = (${valB})² - 4*(${valA})*(${valC}) = ${delta}`);
        if (delta < 0) {
          result = "Vô nghiệm";
          steps.push(`3. Vì Δ < 0 nên phương trình vô nghiệm trên tập số thực.`);
        } else if (delta === 0) {
          let x = -valB / (2 * valA);
          result = `x = ${Math.round(x*100)/100}`;
          steps.push(`3. Vì Δ = 0 nên phương trình có nghiệm kép:`);
          steps.push(`x = -b / 2a = -(${valB}) / (2*${valA}) = ${result}`);
        } else {
          let x1 = (-valB + Math.sqrt(delta)) / (2 * valA);
          let x2 = (-valB - Math.sqrt(delta)) / (2 * valA);
          result = `x₁ = ${Math.round(x1*100)/100}, x₂ = ${Math.round(x2*100)/100}`;
          steps.push(`3. Vì Δ > 0 nên phương trình có 2 nghiệm phân biệt:`);
          steps.push(`x₁ = (-b + √Δ) / 2a = ${Math.round(x1*100)/100}`);
          steps.push(`x₂ = (-b - √Δ) / 2a = ${Math.round(x2*100)/100}`);
        }
      }
    } else if (formulaType === 'pytago') {
      steps.push(`1. Định lý Pytago trong tam giác vuông: Bình phương cạnh huyền bằng tổng bình phương 2 cạnh góc vuông.`);
      steps.push(`Công thức: c² = a² + b²`);
      let c2 = valA * valA + valB * valB;
      steps.push(`2. Thay số: c² = (${valA})² + (${valB})² = ${c2}`);
      let c_val = Math.sqrt(c2);
      result = `c = ${Math.round(c_val*100)/100}`;
      steps.push(`3. Suy ra cạnh huyền c = √${c2} = ${result}`);
    } else if (formulaType === 'circle') {
      steps.push(`1. Hình tròn có bán kính R = ${valA}`);
      let chuVi = 2 * Math.PI * valA;
      let dienTich = Math.PI * valA * valA;
      steps.push(`2. Tính Chu vi (C): C = 2 * π * R`);
      steps.push(`C ≈ 2 * 3.14159 * ${valA} = ${Math.round(chuVi*100)/100}`);
      steps.push(`3. Tính Diện tích (S): S = π * R²`);
      steps.push(`S ≈ 3.14159 * (${valA})² = ${Math.round(dienTich*100)/100}`);
      result = `C=${Math.round(chuVi*100)/100}, S=${Math.round(dienTich*100)/100}`;
    }
  }

  function append(char: string) { expression += char; }
  function clear() { expression = ''; result = ''; steps = []; a=''; b=''; c=''; }
</script>

<div class="min-h-screen bg-slate-100 flex items-center justify-center p-6 font-sans">
  <div class="max-w-5xl w-full bg-white rounded-3xl shadow-[0_20px_50px_rgba(20,_184,_166,_0.1)] overflow-hidden flex flex-col md:flex-row border border-slate-200">
    
    <!-- Left: Calculator UI -->
    <div class="w-full md:w-1/2 p-8 bg-gradient-to-br from-teal-600 to-emerald-700 text-white flex flex-col justify-between relative overflow-hidden">
      <!-- Decorative educational graphics (Chalkboard style elements) -->
      <div class="absolute top-0 right-0 w-64 h-64 border-[40px] border-white/5 rounded-full blur-sm -translate-y-1/2 translate-x-1/3"></div>
      <div class="absolute bottom-0 left-0 w-48 h-48 border-[20px] border-emerald-900/20 rounded-full blur-md translate-y-1/4 -translate-x-1/4"></div>
      
      <div>
        <div class="flex items-center justify-between mb-2 relative z-10">
          <h1 class="text-3xl font-extrabold tracking-tight flex items-center">
            <span class="text-emerald-200 mr-2 text-4xl">∑</span>
            Linh Hương Math
          </h1>
          <div class="flex bg-black/20 rounded-lg p-1 backdrop-blur-sm">
            <button on:click={() => { mode = 'basic'; clear(); }} class="px-3 py-1 rounded-md text-sm font-semibold transition-all {mode === 'basic' ? 'bg-white text-teal-800 shadow-sm' : 'text-white/70 hover:text-white'}">Cơ bản</button>
            <button on:click={() => { mode = 'advanced'; clear(); }} class="px-3 py-1 rounded-md text-sm font-semibold transition-all {mode === 'advanced' ? 'bg-white text-teal-800 shadow-sm' : 'text-white/70 hover:text-white'}">Cấp 2/3</button>
          </div>
        </div>
        <p class="text-emerald-100 text-sm mb-6 relative z-10 opacity-90">Hỗ trợ giải toán từng bước cho học sinh</p>
        
        <div class="bg-black/25 rounded-2xl p-6 backdrop-blur-md border border-white/10 shadow-inner relative z-10 mb-6 min-h-[110px] flex flex-col justify-center">
          {#if mode === 'basic'}
            <div class="text-emerald-100 text-sm text-right h-6 mb-1 font-mono tracking-wider">{expression || 'Nhập biểu thức...'}</div>
            <div class="text-4xl font-bold text-right truncate font-mono text-white tracking-tight">{result || '0'}</div>
          {:else}
            <div class="text-emerald-100 text-sm text-center h-6 mb-1 font-semibold uppercase tracking-wider">
              {formulaType === 'ptb2' ? 'Phương trình bậc 2' : formulaType === 'pytago' ? 'Định lý Pytago' : 'Hình tròn'}
            </div>
            <div class="text-2xl font-bold text-center truncate font-mono text-white tracking-tight mt-2">{result || '...'}</div>
          {/if}
        </div>
      </div>
      
      {#if mode === 'basic'}
      <div class="grid grid-cols-4 gap-3 relative z-10">
        <button on:click={clear} class="col-span-2 py-4 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold transition-all shadow-md active:scale-95 text-lg">Xóa (AC)</button>
        <button on:click={() => append('(')} class="py-4 bg-white/10 hover:bg-white/20 text-emerald-50 rounded-xl font-medium transition-all active:scale-95 text-xl">(</button>
        <button on:click={() => append(')')} class="py-4 bg-white/10 hover:bg-white/20 text-emerald-50 rounded-xl font-medium transition-all active:scale-95 text-xl">)</button>
        
        {#each ['7', '8', '9', '/'] as btn}
          <button on:click={() => append(btn)} class="py-4 {['/','*','-','+'].includes(btn) ? 'bg-teal-500 hover:bg-teal-400 text-white shadow-sm' : 'bg-white/5 hover:bg-white/10 text-white'} rounded-xl font-semibold transition-all active:scale-95 text-2xl">{btn}</button>
        {/each}
        
        {#each ['4', '5', '6', '*'] as btn}
          <button on:click={() => append(btn)} class="py-4 {['/','*','-','+'].includes(btn) ? 'bg-teal-500 hover:bg-teal-400 text-white shadow-sm' : 'bg-white/5 hover:bg-white/10 text-white'} rounded-xl font-semibold transition-all active:scale-95 text-2xl">{btn === '*' ? '×' : btn}</button>
        {/each}
        
        {#each ['1', '2', '3', '-'] as btn}
          <button on:click={() => append(btn)} class="py-4 {['/','*','-','+'].includes(btn) ? 'bg-teal-500 hover:bg-teal-400 text-white shadow-sm' : 'bg-white/5 hover:bg-white/10 text-white'} rounded-xl font-semibold transition-all active:scale-95 text-2xl">{btn}</button>
        {/each}
        
        <button on:click={() => append('0')} class="py-4 bg-white/5 hover:bg-white/10 text-white rounded-xl font-semibold transition-all active:scale-95 text-2xl">0</button>
        <button on:click={() => append('.')} class="py-4 bg-white/5 hover:bg-white/10 text-white rounded-xl font-semibold transition-all active:scale-95 text-2xl">.</button>
        <button on:click={() => append('+')} class="py-4 bg-teal-500 hover:bg-teal-400 text-white rounded-xl font-semibold transition-all active:scale-95 text-2xl shadow-sm">+</button>
        <button on:click={solveBasic} class="py-4 bg-emerald-400 hover:bg-emerald-300 text-teal-900 rounded-xl font-bold transition-all active:scale-95 text-3xl shadow-lg">=</button>
      </div>
      {:else}
      <div class="relative z-10 flex-1 flex flex-col gap-4">
        <select bind:value={formulaType} on:change={clear} class="w-full bg-white/10 border border-white/20 text-white rounded-xl px-4 py-3 outline-none focus:bg-white/20 transition-all font-medium appearance-none">
          <option value="ptb2" class="text-slate-800">Phương trình bậc 2 (ax² + bx + c = 0)</option>
          <option value="pytago" class="text-slate-800">Định lý Pytago (Tìm cạnh huyền)</option>
          <option value="circle" class="text-slate-800">Hình tròn (Chu vi & Diện tích)</option>
        </select>

        <div class="bg-black/10 rounded-2xl p-5 border border-white/5 flex flex-col gap-4">
          {#if formulaType === 'ptb2'}
            <div class="flex items-center gap-3">
              <input type="number" bind:value={a} placeholder="a" class="w-full bg-white/10 border-b-2 border-emerald-300/50 text-white text-center text-xl p-2 outline-none focus:border-emerald-300 placeholder:text-white/30" />
              <span class="text-xl font-bold">x² +</span>
              <input type="number" bind:value={b} placeholder="b" class="w-full bg-white/10 border-b-2 border-emerald-300/50 text-white text-center text-xl p-2 outline-none focus:border-emerald-300 placeholder:text-white/30" />
              <span class="text-xl font-bold">x +</span>
              <input type="number" bind:value={c} placeholder="c" class="w-full bg-white/10 border-b-2 border-emerald-300/50 text-white text-center text-xl p-2 outline-none focus:border-emerald-300 placeholder:text-white/30" />
              <span class="text-xl font-bold">= 0</span>
            </div>
          {:else if formulaType === 'pytago'}
            <div class="flex items-center justify-center gap-4">
              <div class="flex flex-col items-center">
                <span class="text-sm text-emerald-200 mb-1">Cạnh góc vuông a</span>
                <input type="number" bind:value={a} placeholder="Nhập a" class="w-24 bg-white/10 border-b-2 border-emerald-300/50 text-white text-center text-xl p-2 outline-none focus:border-emerald-300 placeholder:text-white/30" />
              </div>
              <span class="text-2xl font-bold">+</span>
              <div class="flex flex-col items-center">
                <span class="text-sm text-emerald-200 mb-1">Cạnh góc vuông b</span>
                <input type="number" bind:value={b} placeholder="Nhập b" class="w-24 bg-white/10 border-b-2 border-emerald-300/50 text-white text-center text-xl p-2 outline-none focus:border-emerald-300 placeholder:text-white/30" />
              </div>
            </div>
          {:else if formulaType === 'circle'}
            <div class="flex flex-col items-center justify-center gap-2 pt-2">
              <span class="text-sm text-emerald-200 mb-1">Bán kính R</span>
              <input type="number" bind:value={a} placeholder="Nhập R" class="w-32 bg-white/10 border-b-2 border-emerald-300/50 text-white text-center text-xl p-3 outline-none focus:border-emerald-300 placeholder:text-white/30" />
            </div>
          {/if}
        </div>
        
        <div class="flex gap-3 mt-auto pt-4">
          <button on:click={clear} class="flex-1 py-4 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold transition-all active:scale-95 text-lg">Làm lại</button>
          <button on:click={solveAdvanced} class="flex-[2] py-4 bg-orange-500 hover:bg-orange-400 text-white rounded-xl font-bold transition-all active:scale-95 text-xl shadow-lg">Giải Toán</button>
        </div>
      </div>
      {/if}
    </div>
    
    <!-- Right: Step-by-step logic -->
    <div class="w-full md:w-1/2 p-8 bg-white flex flex-col h-[600px] md:h-auto border-l border-slate-100">
      <h2 class="text-xl font-bold text-slate-800 mb-6 flex items-center border-b border-slate-100 pb-4">
        <div class="w-8 h-8 rounded-lg bg-teal-100 text-teal-600 flex items-center justify-center mr-3">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg>
        </div>
        {mode === 'basic' ? 'Phân tích bước giải' : 'Lời giải chi tiết'}
      </h2>
      
      <div class="flex-1 overflow-y-auto pr-2 space-y-4 relative custom-scrollbar">
        {#if steps.length === 0}
          <div class="absolute inset-0 flex flex-col items-center justify-center text-slate-400 opacity-60">
            <svg class="w-16 h-16 mb-4 text-slate-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path></svg>
            <p>Nhập {mode === 'basic' ? 'biểu thức' : 'số liệu'} và nhấn Giải để xem chi tiết</p>
          </div>
        {:else}
          {#each steps as step, i}
            <div class="flex items-start bg-slate-50/50 p-4 rounded-xl border border-slate-100 shadow-sm animate-fade-in-up hover:bg-slate-50 transition-colors" style="animation-delay: {i * 100}ms">
              <div class="w-7 h-7 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 border border-teal-200">
                {i + 1}
              </div>
              <div class="ml-3 flex-1">
                <p class="text-slate-700 font-medium leading-relaxed font-sans">{step}</p>
                {#if i === steps.length - 1 && !result.includes('Lỗi')}
                  <div class="mt-4 p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 flex justify-between items-center shadow-inner">
                    <span class="font-semibold">Đáp số:</span>
                    <span class="text-2xl font-bold font-mono text-emerald-700">{result}</span>
                  </div>
                {/if}
              </div>
            </div>
          {/each}
        {/if}
      </div>
      
      <div class="mt-6 pt-4 border-t border-slate-100 text-center">
        <button class="text-sm font-semibold text-teal-700 hover:text-teal-900 transition-colors flex items-center justify-center w-full bg-teal-50 hover:bg-teal-100 py-3 rounded-xl border border-teal-100">
          <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
          Sử dụng AI Phụ Đạo
        </button>
      </div>
    </div>
  </div>
</div>

<style>
  :global(.animate-fade-in-up) {
    animation: fadeInUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    opacity: 0;
  }
  
  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .custom-scrollbar::-webkit-scrollbar {
    width: 6px;
  }
  .custom-scrollbar::-webkit-scrollbar-track {
    background: transparent;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background-color: #cbd5e1;
    border-radius: 10px;
  }
</style>
