<script lang="ts">
  import { onMount, tick, onDestroy } from 'svelte';
  import { marked } from 'marked';
  import DOMPurify from 'dompurify';
  
  let editingSnippetId: string | null = null;

  let mode = 'latex';
  let codeInput = '';
  let htmlOutput = '';
  let typstSvgUrl = '';
  let typstSvgString = '';
  let isCompiling = false;
  let compileError = '';
  
  let debounceTimer: any;
  let splitPane: HTMLDivElement;
  let isDragging = false;
  let leftWidth = 50; // percentage
  
  // Pan & Zoom State (Không dùng nữa nhưng giữ lại để khỏi lỗi biến)
  let zoom = 0.85;
  let panX = 0;
  let panY = 0;
  let isPanning = false;
  let startPanX = 0;
  let startPanY = 0;

  // Sync Highlight State
  let activeBlockIndex = -1;

  // Sidebar Tabs State
  let activeTab: 'menu' | 'saved' = 'menu';

  // Saved Library State
  interface SavedSnippet {
    id: string;
    name: string;
    mode: string;
    code: string;
  }
  let savedSnippets: SavedSnippet[] = [];

  // Default content
  const defaultLatex = `# Soạn giáo án môn Toán
## 1. Phương trình bậc 2
Nghiệm của phương trình $ax^2 + bx + c = 0$ được tính bằng công thức:
$$ x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a} $$

## 2. Hệ phương trình
$$
\\begin{cases}
x + y = 2 \\\\
x - y = 0
\\end{cases}
$$
`;

  const defaultTypst = `= Soạn giáo án môn Toán
== 1. Phương trình bậc 2
Nghiệm của phương trình $a x^2 + b x + c = 0$ được tính bằng công thức:
$ x = (-b +- sqrt(b^2 - 4 a c)) / (2 a) $

== 2. Ma trận và Hệ
$ mat(1, 2; 3, 4) $
`;

  onMount(() => {
    const saved = localStorage.getItem('linhhuong_lesson_plans');
    if (saved) {
      try {
        savedSnippets = JSON.parse(saved);
      } catch (e) {}
    }
    
    if (editingSnippetId) {
      const snippet = savedSnippets.find(s => s.id === editingSnippetId);
      if (snippet) {
        mode = snippet.mode;
        codeInput = snippet.code;
        activeTab = 'saved';
      } else {
        codeInput = defaultLatex;
      }
    } else {
      codeInput = defaultLatex;
    }
    renderContent();
  });

  function setMode(newMode: string) {
    if (mode === newMode) return;
    mode = newMode;
    if (mode === 'latex') {
       codeInput = defaultLatex;
       typstSvgUrl = '';
    } else {
       codeInput = defaultTypst;
       htmlOutput = '';
    }
    renderContent();
  }

  function handleInput() {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      renderContent();
    }, 500);
  }

  async function renderContent() {
    compileError = '';
    if (mode === 'latex') {
      try {
        // Render Markdown bình thường
        const rawHtml = await marked.parse(codeInput);
        htmlOutput = DOMPurify.sanitize(rawHtml as string);
        
        // Đợi DOM cập nhật xong rồi áp dụng KaTeX
        tick().then(() => {
          const previewElement = document.getElementById('a4-preview-content');
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
            // Áp dụng Highlight nếu có
            applyHighlight();
          }
        });
      } catch (err) {
        console.error('Markdown Parse Error:', err);
      }
    } else {
      // Typst mode
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
          typstSvgString = svgContent;
          const blob = new Blob([svgContent], { type: 'image/svg+xml' });
          if (typstSvgUrl) URL.revokeObjectURL(typstSvgUrl);
          typstSvgUrl = URL.createObjectURL(blob);
        }
      } catch (err: any) {
        compileError = err.message || 'Lỗi kết nối đến máy chủ Typst';
      } finally {
        isCompiling = false;
      }
    }
  }

  // --- Pan & Zoom Logic ---
  function handleWheel(e: WheelEvent) {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const zoomFactor = 0.1;
      if (e.deltaY < 0) {
        zoom = Math.min(zoom + zoomFactor, 3); // Max zoom 300%
      } else {
        zoom = Math.max(zoom - zoomFactor, 0.3); // Min zoom 30%
      }
    }
  }

  function handlePanStart(e: MouseEvent) {
    if (e.button !== 0 && e.button !== 1) return; // Only left/middle click
    // Don't pan if clicking on text to select
    const target = e.target as HTMLElement;
    if (target.closest('#a4-preview-content') && e.button === 0) return;

    isPanning = true;
    startPanX = e.clientX - panX;
    startPanY = e.clientY - panY;
    document.body.style.cursor = 'grabbing';
  }

  function handlePanMove(e: MouseEvent) {
    if (!isPanning) return;
    panX = e.clientX - startPanX;
    panY = e.clientY - startPanY;
  }

  function handlePanEnd() {
    isPanning = false;
    document.body.style.cursor = 'default';
  }

  function resetView() {
    zoom = 0.85;
    panX = 0;
    panY = 0;
  }

  function printA4() {
    // Reset view before printing so it fits nicely
    resetView();
    setTimeout(() => {
      window.print();
    }, 100);
  }

  function saveSnippet() {
    const name = prompt('Nhập tên gợi nhớ cho công thức/giáo án này:', 'Công thức mới');
    if (!name) return;
    const newSnippet = {
      id: Date.now().toString(),
      name,
      mode,
      code: codeInput
    };
    savedSnippets = [newSnippet, ...savedSnippets];
    localStorage.setItem('linhhuong_lesson_plans', JSON.stringify(savedSnippets));
    alert('Đã lưu thành công vào thư viện!');
  }

  function loadSnippet(snippet: SavedSnippet) {
    mode = snippet.mode;
    codeInput = snippet.code;
    renderContent();
  }

  function deleteSnippet(id: string, e: MouseEvent) {
    e.stopPropagation();
    if (!confirm('Bạn có chắc chắn muốn xóa bản lưu này?')) return;
    savedSnippets = savedSnippets.filter(s => s.id !== id);
    localStorage.setItem('linhhuong_lesson_plans', JSON.stringify(savedSnippets));
  }

  function insertToMain() {
    saveSnippet();
  }

  // --- Sync Highlight Logic ---
  function getVisualTokens() {
    const tokens = marked.lexer(codeInput);
    const visualTokens: any[] = [];
    let charCount = 0;
    
    // Marked tokenizer does not give raw offsets easily in all versions, 
    // but token.raw contains the exact string. We map them linearly.
    for (const t of tokens) {
      const length = (t as any).raw.length;
      if (t.type !== 'space') {
        visualTokens.push({ start: charCount, end: charCount + length, type: t.type });
      }
      charCount += length;
    }
    return visualTokens;
  }

  function handleEditorClick(e: MouseEvent | KeyboardEvent | Event) {
    if (mode !== 'latex') return;
    const textarea = e.target as HTMLTextAreaElement;
    const cursorPosition = textarea.selectionStart;
    
    const visualTokens = getVisualTokens();
    const index = visualTokens.findIndex(t => cursorPosition >= t.start && cursorPosition <= t.end);
    
    if (index !== -1) {
      activeBlockIndex = index;
      applyHighlight();
    }
  }

  function applyHighlight() {
    if (mode !== 'latex' || activeBlockIndex === -1) return;
    
    const previewContainer = document.getElementById('a4-preview-content');
    if (!previewContainer) return;
    
    // Lấy tất cả các thẻ con cấp 1 (top-level blocks)
    const children = Array.from(previewContainer.children);
    
    // Xóa highlight cũ
    children.forEach(child => {
      (child as HTMLElement).style.backgroundColor = 'transparent';
      (child as HTMLElement).style.outline = 'none';
      (child as HTMLElement).style.boxShadow = 'none';
      (child as HTMLElement).style.transition = 'background-color 0.3s ease';
    });
    
    // Thêm highlight mới
    if (children[activeBlockIndex]) {
      const activeElement = children[activeBlockIndex] as HTMLElement;
      activeElement.style.backgroundColor = '#fef08a'; // Vàng nhạt
      activeElement.style.outline = '2px solid #eab308';
      activeElement.style.borderRadius = '4px';
      activeElement.style.boxShadow = '0 0 10px rgba(234, 179, 8, 0.2)';
      
      // Tự động cuộn đến phần tử đó
      activeElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  function handlePreviewClick(e: MouseEvent) {
    if (mode !== 'latex') return;
    const target = e.target as HTMLElement;
    const previewContainer = document.getElementById('a4-preview-content');
    if (!previewContainer) return;

    // Tìm phần tử con cấp 1 chứa mục tiêu
    let blockNode = target;
    while (blockNode && blockNode.parentElement !== previewContainer) {
      if (blockNode.parentElement) blockNode = blockNode.parentElement;
      else return; // Reached body/html
    }

    const children = Array.from(previewContainer.children);
    const index = children.indexOf(blockNode);
    
    if (index !== -1) {
      activeBlockIndex = index;
      applyHighlight();
      
      const visualTokens = getVisualTokens();
      const token = visualTokens[index];
      
      const textarea = document.getElementById('code-editor') as HTMLTextAreaElement;
      if (textarea && token) {
        textarea.focus();
        textarea.setSelectionRange(token.start, token.end);
        
        // Cố gắng cuộn editor tới chỗ bôi đen
        const linesBefore = codeInput.substring(0, token.start).split('\n').length;
        const lineHeight = 21; // roughly 21px per line
        textarea.scrollTop = Math.max(0, (linesBefore - 4) * lineHeight);
      }
    }
  }

  // --- Resizer logic ---
  function onMouseDown(e: MouseEvent) {
    isDragging = true;
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }

  function onMouseMove(e: MouseEvent) {
    if (!isDragging || !splitPane) return;
    const rect = splitPane.getBoundingClientRect();
    let newWidth = ((e.clientX - rect.left) / rect.width) * 100;
    if (newWidth < 20) newWidth = 20;
    if (newWidth > 80) newWidth = 80;
    leftWidth = newWidth;
  }

  function onMouseUp() {
    isDragging = false;
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp);
  }

  // --- Toolbar helpers ---
  function insertText(text: string) {
    const textarea = document.getElementById('code-editor') as HTMLTextAreaElement;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    codeInput = codeInput.substring(0, start) + text + codeInput.substring(end);
    
    // Focus and update
    tick().then(() => {
      textarea.focus();
      textarea.setSelectionRange(start + text.length, start + text.length);
      handleInput();
    });
  }

  async function copyToClipboard() {
    if (mode === 'latex') {
      const type = "text/html";
      const blob = new Blob([htmlOutput], { type });
      const data = [new ClipboardItem({ [type]: blob })];
      try {
        await navigator.clipboard.write(data);
        alert('Đã sao chép nội dung HTML! Bạn có thể dán (Paste) trực tiếp vào vùng soạn thảo hoặc Web.');
      } catch (e) {
        navigator.clipboard.writeText(htmlOutput);
        alert('Đã sao chép mã HTML (dạng văn bản).');
      }
    } else {
      if (!typstSvgUrl) return;
      try {
         const response = await fetch(typstSvgUrl);
         const svgText = await response.text();
         navigator.clipboard.writeText(svgText);
         alert('Đã sao chép mã SVG của Typst! Bạn có thể dán vào HTML Web.');
      } catch (e) {
         alert('Lỗi khi sao chép SVG.');
      }
    }
  }

</script>

<!-- Thêm file css của katex và logic print -->
<svelte:head>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.css">
</svelte:head>

<div class="fixed inset-0 z-[100] bg-white flex flex-col">
  <!-- Toolbar -->
  <div class="h-14 border-b border-slate-200 flex items-center justify-between px-4 bg-slate-50 shrink-0 shadow-sm relative z-10">
    <div class="flex items-center space-x-4">
      <div class="flex bg-slate-200/60 p-1 rounded-lg">
        <button 
          class="px-4 py-1.5 rounded-md text-sm font-semibold transition-all {mode === 'latex' ? 'bg-white shadow text-indigo-600' : 'text-slate-600 hover:text-slate-900'}"
          on:click={() => setMode('latex')}
        >
          LaTeX Mode
        </button>
        <button 
          class="px-4 py-1.5 rounded-md text-sm font-semibold transition-all {mode === 'typst' ? 'bg-white shadow text-indigo-600' : 'text-slate-600 hover:text-slate-900'}"
          on:click={() => setMode('typst')}
        >
          Typst Mode
        </button>
      </div>
    </div>

    <div class="flex items-center space-x-3">
      <button 
        class="flex items-center space-x-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors border border-emerald-200 shadow-sm"
        on:click={saveSnippet}
        title="Lưu lại để tái sử dụng"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"></path></svg>
        <span class="hidden md:inline">Lưu Thư viện</span>
      </button>

      <div class="w-px h-6 bg-slate-300 mx-1"></div>
      
      <button
        class="flex items-center space-x-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors shadow-md active:scale-95"
        on:click={copyToClipboard}
      >
        <span class="text-lg leading-none mr-1">📋</span>
        <span>Sao chép Code HTML/SVG</span>
      </button>
    </div>
  </div>

  <!-- Main Area -->
  <div class="flex-1 flex overflow-hidden relative">
    
    <!-- Sidebar Công thức (Left) -->
    <div class="w-48 bg-slate-50 border-r border-slate-200 flex flex-col shrink-0 overflow-y-auto">
      <div class="flex border-b border-slate-200 bg-white sticky top-0 z-10 shadow-sm">
        <button class="flex-1 py-2 text-xs font-semibold transition-colors {activeTab === 'menu' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500 hover:bg-slate-50'}" on:click={() => activeTab = 'menu'}>📌 Công thức</button>
        <button class="flex-1 py-2 text-xs font-semibold transition-colors {activeTab === 'saved' ? 'text-emerald-600 border-b-2 border-emerald-600' : 'text-slate-500 hover:bg-slate-50'}" on:click={() => activeTab = 'saved'}>💾 Đã lưu</button>
      </div>
      <div class="p-2 flex flex-col gap-1.5 custom-scrollbar">
        {#if activeTab === 'menu'}
          {#if mode === 'latex'}
            <button class="px-3 py-2 text-xs bg-white border border-slate-200 rounded-md hover:bg-slate-100 hover:border-indigo-300 font-mono text-left transition-colors shadow-sm flex items-center" on:click={() => insertText('$$ \\frac{a}{b} $$')} title="Phân số">1. a/b (Phân số)</button>
            <button class="px-3 py-2 text-xs bg-white border border-slate-200 rounded-md hover:bg-slate-100 hover:border-indigo-300 font-mono text-left transition-colors shadow-sm flex items-center" on:click={() => insertText('$$ \\sqrt{x} $$')} title="Căn bậc 2">2. √x (Căn)</button>
            <button class="px-3 py-2 text-xs bg-white border border-slate-200 rounded-md hover:bg-slate-100 hover:border-indigo-300 font-mono text-left transition-colors shadow-sm flex items-center" on:click={() => insertText('$$ x^2 $$')} title="Số mũ">3. x² (Mũ)</button>
            <button class="px-3 py-2 text-xs bg-white border border-slate-200 rounded-md hover:bg-slate-100 hover:border-indigo-300 font-mono text-left transition-colors shadow-sm flex items-center" on:click={() => insertText('$$ \\begin{cases} x = 1 \\\\ y = 2 \\end{cases} $$')} title="Hệ phương trình">4. {'{x,y}'} (Hệ PT)</button>
            <button class="px-3 py-2 text-xs bg-white border border-slate-200 rounded-md hover:bg-slate-100 hover:border-indigo-300 font-mono text-left transition-colors shadow-sm flex items-center" on:click={() => insertText('$$ \\int_{a}^{b} x dx $$')} title="Tích phân">5. ∫ (Tích phân)</button>
            <button class="px-3 py-2 text-xs bg-white border border-slate-200 rounded-md hover:bg-slate-100 hover:border-indigo-300 font-mono text-left transition-colors shadow-sm flex items-center" on:click={() => insertText('$$ \\sum_{i=1}^{n} x_i $$')} title="Tổng Sigma">6. ∑ (Sigma)</button>
            <button class="px-3 py-2 text-xs bg-white border border-slate-200 rounded-md hover:bg-slate-100 hover:border-indigo-300 font-mono text-left transition-colors shadow-sm flex items-center" on:click={() => insertText('$$ \\lim_{x \\to \\infty} f(x) $$')} title="Giới hạn">7. lim (Giới hạn)</button>
          {:else}
            <button class="px-3 py-2 text-xs bg-white border border-slate-200 rounded-md hover:bg-slate-100 hover:border-indigo-300 font-mono text-left transition-colors shadow-sm flex items-center" on:click={() => insertText('$ a / b + sqrt(x) $')} title="Công thức Toán cơ bản">1. Toán cơ bản</button>
            <button class="px-3 py-2 text-xs bg-white border border-slate-200 rounded-md hover:bg-slate-100 hover:border-indigo-300 font-mono text-left transition-colors shadow-sm flex items-center" on:click={() => insertText('$ mat(1, 2; 3, 4) $')} title="Ma trận & Hệ">2. Ma trận & Hệ PT</button>
            <button class="px-3 py-2 text-xs bg-white border border-slate-200 rounded-md hover:bg-slate-100 hover:border-indigo-300 font-mono text-left transition-colors shadow-sm flex items-center" on:click={() => insertText('\n#table(\n  columns: 3,\n  [Cột 1], [Cột 2], [Cột 3],\n  [Dữ liệu 1], [Dữ liệu 2], [Dữ liệu 3]\n)\n')} title="Bảng biểu (Table)">3. Bảng (Table)</button>
            <button class="px-3 py-2 text-xs bg-white border border-slate-200 rounded-md hover:bg-slate-100 hover:border-indigo-300 font-mono text-left transition-colors shadow-sm flex items-center" on:click={() => insertText('\n#rect(fill: luma(245), stroke: 1pt + blue, radius: 4pt, inset: 10pt)[\n  *Định lý 1:*\n  Nội dung định lý ở đây...\n]\n')} title="Khung Định lý">4. Khung Định lý</button>
            <button class="px-3 py-2 text-xs bg-white border border-slate-200 rounded-md hover:bg-slate-100 hover:border-indigo-300 font-mono text-left transition-colors shadow-sm flex items-center" on:click={() => insertText('\n#columns(2)[\n  Nội dung cột trái...\n  #colbreak()\n  Nội dung cột phải...\n]\n')} title="Chia 2 cột">5. Chia cột (Columns)</button>
            <button class="px-3 py-2 text-xs bg-white border border-slate-200 rounded-md hover:bg-slate-100 hover:border-indigo-300 font-mono text-left transition-colors shadow-sm flex items-center" on:click={() => insertText('\n```cpp\nint main() {\n  return 0;\n}\n```\n')} title="Khối mã (Code block)">6. Mã nguồn (Code)</button>
            <button class="px-3 py-2 text-xs bg-white border border-slate-200 rounded-md hover:bg-slate-100 hover:border-indigo-300 font-mono text-left transition-colors shadow-sm flex items-center" on:click={() => insertText('\n#list(\n  [Mục 1],\n  [Mục 2],\n  [Mục 3]\n)\n')} title="Danh sách">7. Danh sách (List)</button>
          {/if}
        {:else}
          {#each savedSnippets as snippet}
            <!-- svelte-ignore a11y-click-events-have-key-events -->
            <!-- svelte-ignore a11y-no-static-element-interactions -->
            <div class="p-2 bg-white border border-slate-200 rounded-md shadow-sm relative group hover:border-indigo-300 transition-colors">
              <div class="text-xs font-bold text-slate-700 truncate cursor-pointer hover:text-indigo-600 mb-1" on:click={() => loadSnippet(snippet)} title={snippet.name}>
                {snippet.name}
              </div>
              <div class="text-[10px] text-slate-400 font-mono uppercase bg-slate-50 inline-block px-1 rounded">{snippet.mode}</div>
              <button class="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 text-rose-400 hover:text-rose-600 p-0.5 rounded hover:bg-rose-50 transition-all" on:click={(e) => deleteSnippet(snippet.id, e)} title="Xóa">
                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
              </button>
            </div>
          {:else}
            <div class="text-[11px] text-slate-400 text-center py-6 px-2 italic">
              Chưa có công thức nào được lưu. Bấm "Lưu Thư viện" ở trên để thêm.
            </div>
          {/each}
        {/if}
      </div>
    </div>

    <!-- Split Pane -->
    <div class="flex-1 flex overflow-hidden relative" bind:this={splitPane}>
      <!-- Code Editor (Left) -->
      <div class="h-full flex flex-col" style="width: {leftWidth}%">
        <div class="h-8 bg-slate-800 text-slate-300 text-xs flex items-center justify-between px-4 font-mono select-none">
          <span>Mã nguồn ({mode})</span>
          {#if mode === 'latex'}
            <span class="text-green-400">⚡ Auto Sync</span>
          {/if}
        </div>
        <textarea
          id="code-editor"
          class="flex-1 w-full p-4 bg-slate-50 text-slate-800 font-mono text-[15px] leading-relaxed resize-none outline-none focus:ring-inset focus:ring-1 focus:ring-indigo-500/50 selection:bg-indigo-200"
          bind:value={codeInput}
          on:input={handleInput}
          on:click={handleEditorClick}
          on:keyup={handleEditorClick}
          spellcheck="false"
        ></textarea>
      </div>

      <!-- Resizer -->
      <!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
      <!-- svelte-ignore a11y-no-noninteractive-tabindex -->
      <div 
        class="w-1 bg-slate-300 hover:bg-indigo-400 cursor-col-resize z-10 transition-colors"
        on:mousedown={onMouseDown}
        role="separator"
        tabindex="0"
      ></div>

      <!-- Preview (Right) -->
      <div class="h-full flex flex-col relative bg-white" style="width: {100 - leftWidth}%">
        <div class="h-8 bg-slate-100 border-b border-slate-200 text-slate-600 text-xs flex items-center px-4 font-semibold select-none justify-between">
          <span>Xem trước trực tiếp</span>
          {#if isCompiling}
            <span class="text-indigo-500 flex items-center gap-1">
              <svg class="animate-spin h-3 w-3 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
              Đang dịch...
            </span>
          {/if}
        </div>
        
        <!-- Interactive Preview Canvas -->
        <!-- svelte-ignore a11y-no-static-element-interactions -->
        <!-- svelte-ignore a11y-click-events-have-key-events -->
        <div 
          class="flex-1 overflow-y-auto custom-scrollbar p-8"
          on:click={handlePreviewClick}
        >
          {#if compileError}
             <div class="p-4 bg-rose-50 text-rose-700 border border-rose-200 rounded-lg font-mono text-sm whitespace-pre-wrap">
               {compileError}
             </div>
          {:else if mode === 'latex'}
             <div id="a4-preview-content" class="prose max-w-none text-slate-800 text-[12pt] font-serif leading-relaxed">
               {@html htmlOutput}
             </div>
          {:else}
             <div class="mb-4 text-center">
               <span class="inline-block px-3 py-1 bg-amber-50 text-amber-600 border border-amber-200 rounded-full text-[11px] font-medium shadow-sm">
                 💡 Typst Mode: Hiển thị dạng Vector nguyên khối (không hỗ trợ Click-to-highlight)
               </span>
             </div>
             {#if typstSvgUrl}
               <div class="flex justify-center max-w-full pb-10">
                 <img src={typstSvgUrl} alt="Typst Render" class="max-w-full h-auto bg-white shadow-[0_0_15px_rgba(0,0,0,0.1)] border border-slate-200" />
               </div>
             {:else if !isCompiling}
               <div class="text-slate-400 text-sm text-center mt-10">Đang khởi tạo Typst...</div>
             {/if}
          {/if}
        </div>
      </div>
    </div>
  </div>
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
    background: #cbd5e1;
    border-radius: 4px;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: #94a3b8;
  }
  
  :global(.katex-display) {
    margin: 1rem 0;
    overflow-x: auto;
    overflow-y: hidden;
  }
</style>
