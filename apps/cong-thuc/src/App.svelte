<script lang="ts">
  import { onMount, tick } from 'svelte';
  import { marked } from 'marked';
  import DOMPurify from 'dompurify';

  // State
  let mode: 'latex' | 'typst' = 'latex';
  let codeInput = '';
  let htmlOutput = '';
  let typstSvgUrl = '';
  let isCompiling = false;
  let compileError = '';
  
  let textareaElement: HTMLTextAreaElement;
  let suggestionsPopup: HTMLDivElement;

  // Autocomplete State
  let suggestions: any[] = [];
  let activeSuggestionIndex = 0;
  let popupStyles = 'display: none;';
  let currentSearchStr = '';
  let searchStartIndex = -1;

  // Pan & Zoom State
  let zoom = 1;
  let panX = 0;
  let panY = 0;
  let isPanning = false;
  let startPanX = 0;
  let startPanY = 0;

  const latexTemplates = [
    { cat: 'Cơ bản', name: 'Phân số', code: '$$ \\frac{a}{b} $$', icon: 'a/b' },
    { cat: 'Cơ bản', name: 'Căn bậc n', code: '$$ \\sqrt[n]{x} $$', icon: 'ⁿ√x' },
    { cat: 'Cơ bản', name: 'Lũy thừa', code: '$$ x^n $$', icon: 'xⁿ' },
    { cat: 'Cơ bản', name: 'Chỉ số dưới', code: '$$ x_n $$', icon: 'xₙ' },
    { cat: 'Giải tích', name: 'Tích phân', code: '$$ \\int_{a}^{b} f(x) \\, dx $$', icon: '∫' },
    { cat: 'Giải tích', name: 'Tích phân kép', code: '$$ \\iint_{D} f(x,y) \\, dA $$', icon: '∬' },
    { cat: 'Giải tích', name: 'Tổng Sigma', code: '$$ \\sum_{i=1}^{n} x_i $$', icon: '∑' },
    { cat: 'Giải tích', name: 'Giới hạn', code: '$$ \\lim_{x \\to \\infty} f(x) $$', icon: 'lim' },
    { cat: 'Giải tích', name: 'Đạo hàm', code: '$$ \\frac{\\partial f}{\\partial x} $$', icon: '∂' },
    { cat: 'Đại số', name: 'Ma trận 2x2', code: '$$ \\begin{bmatrix} a & b \\\\ c & d \\end{bmatrix} $$', icon: '[ ]' },
    { cat: 'Đại số', name: 'Hệ phương trình', code: '$$ \\begin{cases} x + y = 1 \\\\ x - y = 0 \\end{cases} $$', icon: '{ }' },
    { cat: 'Ký hiệu', name: 'Alpha, Beta', code: '\\alpha, \\beta, \\gamma', icon: 'α' },
    { cat: 'Ký hiệu', name: 'Vô cực', code: '\\infty', icon: '∞' },
    { cat: 'Ký hiệu', name: 'Toán tử', code: '\\pm, \\times, \\div, \\neq', icon: '±' },
    { cat: 'Tập hợp', name: 'Thuộc', code: '\\in, \\subset, \\cup', icon: '∈' }
  ];

  const typstTemplates = [
    { cat: 'Cơ bản', name: 'Phân số', code: '$ a / b $', icon: 'a/b' },
    { cat: 'Cơ bản', name: 'Căn', code: '$ sqrt(x) $', icon: '√x' },
    { cat: 'Cơ bản', name: 'Lũy thừa', code: '$ x^n $', icon: 'xⁿ' },
    { cat: 'Giải tích', name: 'Tích phân', code: '$ int_a^b f(x) dif x $', icon: '∫' },
    { cat: 'Giải tích', name: 'Tổng Sigma', code: '$ sum_(i=1)^n x_i $', icon: '∑' },
    { cat: 'Đại số', name: 'Ma trận', code: '$ mat(a, b; c, d) $', icon: '[ ]' },
    { cat: 'Đại số', name: 'Hệ PT', code: '$ cases(x + y = 1, x - y = 0) $', icon: '{ }' },
    { cat: 'Văn bản', name: 'Bảng (Table)', code: '#table(\n  columns: 2,\n  [Cột 1], [Cột 2],\n  [A], [B]\n)', icon: '⊞' },
    { cat: 'Văn bản', name: 'Chia cột', code: '#columns(2)[\n  Nội dung cột 1...\n  #colbreak()\n  Nội dung cột 2...\n]', icon: '⏸' },
    { cat: 'Văn bản', name: 'Khung (Rect)', code: '#rect(fill: luma(240), radius: 4pt)[ Nội dung ]', icon: '▭' },
    { cat: 'Ký hiệu', name: 'Mũi tên', code: '$ ->, <->, => $', icon: '→' }
  ];

  const latexDict = [
    { trig: '\\frac', desc: 'Phân số', ins: '\\frac{${1:num}}{${2:den}}' },
    { trig: '\\sqrt', desc: 'Căn bậc 2', ins: '\\sqrt{${1:x}}' },
    { trig: '\\sum', desc: 'Tổng Sigma', ins: '\\sum_{${1:i=1}}^{${2:n}}' },
    { trig: '\\int', desc: 'Tích phân', ins: '\\int_{${1:a}}^{${2:b}}' },
    { trig: '\\iint', desc: 'Tích phân kép', ins: '\\iint_{${1:D}}' },
    { trig: '\\lim', desc: 'Giới hạn', ins: '\\lim_{${1:x \\to \\infty}}' },
    { trig: '\\partial', desc: 'Đạo hàm riêng', ins: '\\partial' },
    { trig: '\\alpha', desc: 'Chữ Alpha', ins: '\\alpha' },
    { trig: '\\beta', desc: 'Chữ Beta', ins: '\\beta' },
    { trig: '\\gamma', desc: 'Chữ Gamma', ins: '\\gamma' },
    { trig: '\\Delta', desc: 'Chữ Delta', ins: '\\Delta' },
    { trig: '\\pi', desc: 'Chữ Pi', ins: '\\pi' },
    { trig: '\\infty', desc: 'Vô cực', ins: '\\infty' },
    { trig: '\\pm', desc: 'Cộng trừ', ins: '\\pm' },
    { trig: '\\times', desc: 'Nhân', ins: '\\times' },
    { trig: '\\div', desc: 'Chia', ins: '\\div' },
    { trig: '\\neq', desc: 'Khác', ins: '\\neq' },
    { trig: '\\approx', desc: 'Xấp xỉ', ins: '\\approx' },
    { trig: '\\in', desc: 'Thuộc', ins: '\\in' },
    { trig: '\\subset', desc: 'Tập con', ins: '\\subset' },
    { trig: '\\cup', desc: 'Hợp', ins: '\\cup' },
    { trig: '\\cap', desc: 'Giao', ins: '\\cap' },
    { trig: '\\rightarrow', desc: 'Mũi tên phải', ins: '\\rightarrow' },
    { trig: '\\Rightarrow', desc: 'Suy ra', ins: '\\Rightarrow' },
    { trig: '\\begin{cases}', desc: 'Hệ phương trình', ins: '\\begin{cases}\n${1:x} \\\\\n${2:y}\n\\end{cases}' },
    { trig: '\\begin{bmatrix}', desc: 'Ma trận vuông', ins: '\\begin{bmatrix}\n${1:a} & ${2:b} \\\\\n${3:c} & ${4:d}\n\\end{bmatrix}' },
    { trig: '\\begin{pmatrix}', desc: 'Ma trận tròn', ins: '\\begin{pmatrix}\n${1:a} & ${2:b} \\\\\n${3:c} & ${4:d}\n\\end{pmatrix}' },
    { trig: '\\textbf', desc: 'In đậm', ins: '\\textbf{${1:text}}' },
    { trig: '\\textit', desc: 'In nghiêng', ins: '\\textit{${1:text}}' },
  ];

  const typstDict = [
    { trig: '#table', desc: 'Tạo bảng', ins: '#table(columns: ${1:2}, [${2:A}], [${3:B}])' },
    { trig: '#columns', desc: 'Chia cột', ins: '#columns(${1:2})[\n  ${2:content}\n]' },
    { trig: '#rect', desc: 'Khung', ins: '#rect()[${1:content}]' },
    { trig: '#align', desc: 'Căn lề', ins: '#align(${1:center})[${2:content}]' },
    { trig: 'sqrt', desc: 'Căn', ins: 'sqrt(${1:x})' },
    { trig: 'frac', desc: 'Phân số', ins: '${1:a} / ${2:b}' },
    { trig: 'sum', desc: 'Tổng', ins: 'sum_(${1:i=1})^(${2:n})' },
    { trig: 'int', desc: 'Tích phân', ins: 'int_(${1:a})^(${2:b})' },
    { trig: 'lim', desc: 'Giới hạn', ins: 'lim_(${1:x -> oo})' },
    { trig: 'alpha', desc: 'Alpha', ins: 'alpha' },
    { trig: 'beta', desc: 'Beta', ins: 'beta' },
    { trig: 'gamma', desc: 'Gamma', ins: 'gamma' },
    { trig: 'pi', desc: 'Pi', ins: 'pi' },
    { trig: 'oo', desc: 'Vô cực', ins: 'oo' },
    { trig: 'in', desc: 'Thuộc', ins: 'in' },
    { trig: 'subset', desc: 'Tập con', ins: 'subset' },
    { trig: 'union', desc: 'Hợp', ins: 'union' },
    { trig: 'sect', desc: 'Giao', ins: 'sect' },
    { trig: '->', desc: 'Mũi tên phải', ins: '->' },
    { trig: '=>', desc: 'Suy ra', ins: '=>' },
    { trig: '<=>', desc: 'Tương đương', ins: '<=>' },
    { trig: 'times', desc: 'Nhân', ins: 'times' },
    { trig: 'div', desc: 'Chia', ins: 'div' },
    { trig: '+-', desc: 'Cộng trừ', ins: '+-' }
  ];

  let activeTemplates = latexTemplates;

  const defaultLatex = `% Nhập / để gọi gợi ý hoặc \\ để gõ lệnh LaTeX
# Phương trình bậc 2
Nghiệm của phương trình $ax^2 + bx + c = 0$ là:
$$ x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a} $$
`;

  const defaultTypst = `// Nhập # hoặc chữ toán học để gọi gợi ý
= Phương trình bậc 2
Nghiệm của phương trình $a x^2 + b x + c = 0$ là:
$ x = (-b +- sqrt(b^2 - 4 a c)) / (2 a) $
`;

  onMount(() => {
    codeInput = defaultLatex;
    renderContent();
  });

  function setMode(newMode: 'latex' | 'typst') {
    if (mode === newMode) return;
    mode = newMode;
    activeTemplates = mode === 'latex' ? latexTemplates : typstTemplates;
    codeInput = mode === 'latex' ? defaultLatex : defaultTypst;
    renderContent();
  }

  let debounceTimer: any;
  function handleInput(e: Event) {
    checkAutocomplete();
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      renderContent();
    }, 500);
  }

  function getCaretCoordinates(element: HTMLTextAreaElement, position: number) {
    const div = document.createElement('div');
    const style = getComputedStyle(element);
    for (const prop of style) {
      if (prop.startsWith('webkit') || prop.startsWith('moz')) continue;
      try { div.style[prop as any] = style[prop as any]; } catch(e){}
    }
    div.style.position = 'absolute';
    div.style.visibility = 'hidden';
    div.style.whiteSpace = 'pre-wrap';
    div.style.width = element.clientWidth + 'px';
    div.style.height = element.clientHeight + 'px';
    div.textContent = element.value.substring(0, position);
    const span = document.createElement('span');
    span.textContent = element.value.substring(position) || '.';
    div.appendChild(span);
    element.parentElement?.appendChild(div);
    const coordinates = {
      top: span.offsetTop - element.scrollTop,
      left: span.offsetLeft - element.scrollLeft
    };
    element.parentElement?.removeChild(div);
    return coordinates;
  }

  function checkAutocomplete() {
    if (!textareaElement) return;
    const pos = textareaElement.selectionStart;
    const textBefore = codeInput.substring(0, pos);
    
    // Tìm từ cuối cùng
    const match = textBefore.match(/(\\[a-zA-Z]*|#[a-zA-Z]*|[a-zA-Z]+)$/);
    if (match) {
      const word = match[0];
      const dict = mode === 'latex' ? latexDict : typstDict;
      const results = dict.filter(d => d.trig.startsWith(word) && d.trig !== word);
      
      if (results.length > 0) {
        suggestions = results;
        activeSuggestionIndex = 0;
        searchStartIndex = pos - word.length;
        
        // Calculate position
        const coords = getCaretCoordinates(textareaElement, pos);
        // Position relative to textarea parent
        popupStyles = `top: ${coords.top + 25}px; left: ${coords.left}px; display: block;`;
        return;
      }
    }
    closeAutocomplete();
  }

  function closeAutocomplete() {
    suggestions = [];
    popupStyles = 'display: none;';
  }

  function handleKeydown(e: KeyboardEvent) {
    if (suggestions.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        activeSuggestionIndex = (activeSuggestionIndex + 1) % suggestions.length;
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        activeSuggestionIndex = (activeSuggestionIndex - 1 + suggestions.length) % suggestions.length;
      } else if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        insertSuggestion(suggestions[activeSuggestionIndex]);
      } else if (e.key === 'Escape') {
        closeAutocomplete();
      }
    } else {
      if (e.key === 'Tab') {
        e.preventDefault();
        insertText('  ');
      }
    }
  }

  function insertSuggestion(suggestion: any) {
    if (!textareaElement) return;
    const pos = textareaElement.selectionStart;
    const before = codeInput.substring(0, searchStartIndex);
    const after = codeInput.substring(pos);
    
    // Xử lý snippet variables ${1:x} -> bỏ qua placeholder cho đơn giản, chỉ lấy text
    let insText = suggestion.ins.replace(/\$\{\d+:([^}]+)\}/g, '$1');
    
    codeInput = before + insText + after;
    closeAutocomplete();
    
    tick().then(() => {
      textareaElement.focus();
      textareaElement.setSelectionRange(searchStartIndex + insText.length, searchStartIndex + insText.length);
      renderContent();
    });
  }

  function insertText(text: string) {
    if (!textareaElement) {
       codeInput += '\n' + text;
       renderContent();
       return;
    }
    const start = textareaElement.selectionStart;
    const end = textareaElement.selectionEnd;
    codeInput = codeInput.substring(0, start) + text + codeInput.substring(end);
    
    tick().then(() => {
      textareaElement.focus();
      textareaElement.setSelectionRange(start + text.length, start + text.length);
      renderContent();
    });
  }

  function handleWheel(e: WheelEvent) {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const zoomFactor = 0.1;
      if (e.deltaY < 0) {
        zoom = Math.min(zoom + zoomFactor, 3);
      } else {
        zoom = Math.max(zoom - zoomFactor, 0.3);
      }
    }
  }

  function handlePanStart(e: MouseEvent) {
    if (e.button !== 0 && e.button !== 1) return;
    isPanning = true;
    startPanX = e.clientX - panX;
    startPanY = e.clientY - panY;
  }

  function handlePanMove(e: MouseEvent) {
    if (!isPanning) return;
    panX = e.clientX - startPanX;
    panY = e.clientY - startPanY;
  }

  function handlePanEnd() {
    isPanning = false;
  }

  function resetView() {
    zoom = 1;
    panX = 0;
    panY = 0;
  }

  async function renderContent() {
    compileError = '';
    if (mode === 'latex') {
      try {
        const rawHtml = await marked.parse(codeInput);
        htmlOutput = DOMPurify.sanitize(rawHtml as string);
        tick().then(() => {
          const previewElement = document.getElementById('preview-content');
          if (previewElement && typeof (window as any).renderMathInElement === 'function') {
            (window as any).renderMathInElement(previewElement, {
              delimiters: [
                {left: '$$', right: '$$', display: true},
                {left: '$', right: '$', display: false},
                {left: '\\(', right: '\\)', display: false},
                {left: '\\[', right: '\\]', display: true}
              ],
              throwOnError: false
            });
          }
        });
      } catch (err) {
        console.error('Markdown Parse Error:', err);
      }
    } else {
      isCompiling = true;
      try {
        const response = await fetch('/api/typst', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code: codeInput })
        });
        if (!response.ok) {
          const errText = await response.text();
          compileError = errText;
          typstSvgUrl = '';
        } else {
          const svgContent = await response.text();
          const blob = new Blob([svgContent], { type: 'image/svg+xml' });
          if (typstSvgUrl) URL.revokeObjectURL(typstSvgUrl);
          typstSvgUrl = URL.createObjectURL(blob);
        }
      } catch (err: any) {
        compileError = err.message || 'Lỗi kết nối máy chủ Typst';
      } finally {
        isCompiling = false;
      }
    }
  }
</script>

<svelte:head>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.css">
</svelte:head>

<div class="min-h-screen bg-zinc-950 text-zinc-100 flex overflow-hidden font-sans">
  
  <!-- Sidebar -->
  <aside class="w-72 bg-zinc-900 border-r border-white/5 flex flex-col z-20 shadow-2xl">
    <div class="h-16 flex items-center justify-between px-6 border-b border-white/5 bg-zinc-900/50">
      <div class="font-bold text-lg tracking-tight bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">LinhHương Formula</div>
    </div>
    
    <div class="p-4 border-b border-white/5">
      <div class="flex bg-zinc-800 rounded-lg p-1">
        <button class="flex-1 py-1.5 text-sm font-semibold rounded-md transition-colors {mode === 'latex' ? 'bg-zinc-700 text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-200'}" on:click={() => setMode('latex')}>LaTeX</button>
        <button class="flex-1 py-1.5 text-sm font-semibold rounded-md transition-colors {mode === 'typst' ? 'bg-zinc-700 text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-200'}" on:click={() => setMode('typst')}>Typst</button>
      </div>
    </div>
    
    <div class="flex-1 overflow-y-auto p-4 custom-scrollbar space-y-6">
      <div class="space-y-3">
        <h3 class="text-xs font-bold text-zinc-500 uppercase tracking-widest">Kho Mẫu (Templates)</h3>
        
        <!-- Group by category -->
        {#each Array.from(new Set(activeTemplates.map(t => t.cat))) as cat}
          <div class="mb-4">
            <div class="text-[11px] font-bold text-indigo-400 mb-2">{cat}</div>
            <div class="grid grid-cols-2 gap-2">
              {#each activeTemplates.filter(t => t.cat === cat) as tmpl}
                <button 
                  class="flex flex-col items-center justify-center p-3 bg-zinc-800/50 hover:bg-indigo-600/20 border border-white/5 hover:border-indigo-500/30 rounded-xl transition-all text-center group"
                  on:click={() => insertText(tmpl.code)}
                  title={tmpl.code}
                >
                  <span class="text-lg font-serif text-zinc-300 group-hover:text-indigo-300 mb-1 leading-none">{tmpl.icon}</span>
                  <span class="text-[10px] text-zinc-500 group-hover:text-zinc-300 font-medium">{tmpl.name}</span>
                </button>
              {/each}
            </div>
          </div>
        {/each}
      </div>
    </div>
  </aside>

  <!-- Editor Panel -->
  <main class="flex-1 flex flex-col relative z-10 border-r border-white/5 shadow-[20px_0_50px_rgba(0,0,0,0.5)]">
    <div class="h-16 flex items-center px-6 border-b border-white/5 bg-zinc-900/80 backdrop-blur-md shrink-0">
      <div class="flex items-center gap-2 text-sm">
        <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
        <span class="font-mono text-zinc-400">Soạn thảo {mode.toUpperCase()}</span>
      </div>
      
      <div class="ml-auto flex gap-3">
        <button class="px-4 py-1.5 rounded-lg text-sm font-semibold bg-zinc-800 hover:bg-zinc-700 text-white transition-colors flex items-center gap-2">
          <span>📋</span> Copy Code
        </button>
      </div>
    </div>

    <div class="flex-1 relative bg-[#1e1e1e] overflow-hidden border-t border-[#333]">
      <textarea
        bind:this={textareaElement}
        bind:value={codeInput}
        on:input={handleInput}
        on:keydown={handleKeydown}
        on:click={closeAutocomplete}
        class="absolute inset-0 w-full h-full p-8 bg-transparent text-[#d4d4d4] font-mono text-[16px] leading-[1.8] resize-none outline-none custom-scrollbar selection:bg-[#264f78] z-10"
        spellcheck="false"
      ></textarea>
      
      <!-- Autocomplete Popup -->
      {#if suggestions.length > 0}
        <div class="absolute z-50 w-64 bg-zinc-800 border border-zinc-700 rounded-xl shadow-2xl overflow-hidden py-1" style={popupStyles}>
          {#each suggestions as sug, i}
            <!-- svelte-ignore a11y-click-events-have-key-events -->
            <!-- svelte-ignore a11y-no-static-element-interactions -->
            <div 
              class="px-4 py-2 cursor-pointer flex items-center justify-between {i === activeSuggestionIndex ? 'bg-indigo-600 text-white' : 'text-zinc-300 hover:bg-zinc-700'}"
              on:click={() => insertSuggestion(sug)}
            >
              <span class="font-mono text-sm font-bold">{sug.trig}</span>
              <span class="text-[11px] opacity-70">{sug.desc}</span>
            </div>
          {/each}
        </div>
      {/if}
    </div>
  </main>

  <!-- Preview Panel -->
  <aside class="w-[500px] xl:w-[600px] bg-zinc-200 flex flex-col shrink-0 relative overflow-hidden">
    <!-- Top toolbar preview -->
    <div class="h-16 flex items-center px-6 border-b border-zinc-300 bg-zinc-100 shrink-0 z-10 shadow-sm justify-between">
      <span class="font-bold text-sm text-zinc-700">Live Preview</span>
      {#if isCompiling}
        <span class="text-xs font-bold text-indigo-600 animate-pulse">Đang dịch...</span>
      {/if}
    </div>
    
    <div 
      class="flex-1 overflow-hidden relative flex justify-center items-start pt-16 bg-zinc-200/50 bg-[radial-gradient(#d4d4d8_1px,transparent_1px)] [background-size:16px_16px]"
      on:wheel|nonpassive={handleWheel}
      on:mousedown={handlePanStart}
      on:mousemove={handlePanMove}
      on:mouseup={handlePanEnd}
      on:mouseleave={handlePanEnd}
      style="cursor: {isPanning ? 'grabbing' : 'grab'};"
    >
      <div class="absolute inset-0 flex justify-center items-start pt-16 pointer-events-none">
        <div 
          class="relative pointer-events-auto transition-transform duration-75"
          style="transform: translate({panX}px, {panY}px) scale({zoom}); transform-origin: top center;"
        >
          {#if compileError}
            <div class="w-full max-w-[21cm] bg-rose-50 border border-rose-200 text-rose-700 p-6 rounded-xl font-mono text-sm whitespace-pre-wrap shadow-sm">
              <div class="font-bold mb-2">Lỗi Biên Dịch:</div>
              {compileError}
            </div>
          {:else}
            <div class="w-full min-w-[21cm] max-w-[21cm] min-h-[29.7cm] bg-white shadow-[0_10px_40px_rgba(0,0,0,0.1)] p-12">
              {#if mode === 'latex'}
                <div id="preview-content" class="prose max-w-none text-black prose-headings:text-black prose-p:text-black prose-strong:text-black prose-em:text-black prose-code:text-indigo-600 text-[13pt] font-serif">
                  {@html htmlOutput}
                </div>
              {:else}
                {#if typstSvgUrl}
                  <img src={typstSvgUrl} alt="Render" class="w-full h-auto" />
                {/if}
              {/if}
            </div>
          {/if}
        </div>
      </div>
    </div>
  </aside>

</div>

<style>
  .custom-scrollbar::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }
  .custom-scrollbar::-webkit-scrollbar-track {
    background: transparent;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: #52525b;
    border-radius: 4px;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: #71717a;
  }
  
  :global(.katex-display) {
    margin: 1rem 0;
    overflow-x: auto;
    overflow-y: hidden;
  }
</style>
