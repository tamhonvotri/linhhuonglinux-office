<script lang="ts">
  import SpreadsheetGrid from './lib/SpreadsheetGrid.svelte';
  import { SpreadsheetEngine, type CellFormat } from './lib/engine';
  import { onMount } from 'svelte';

  const engine = new SpreadsheetEngine();
  
  let currentSheet = $state('Sheet1');
  let sheets = $state(['Sheet1', 'Sheet2']);
  
  let gridComponent: any;

  onMount(() => {
    if (typeof window !== 'undefined') {
      (window as any).__SPREADSHEET_ENGINE__ = engine;
      if (engine.loadFromStorage()) {
         sheets = [...engine.sheets];
         if (!sheets.includes(currentSheet)) {
            currentSheet = sheets[0];
         }
      }
      const savedScript = localStorage.getItem('linhhuong_spreadsheet_script');
      if (savedScript) userScript = savedScript;
    }
  });

  let formulaInput = $state('');
  
  // Header and UI States
  let activeTab = $state('Trang chủ');
  const tabs = ['Trang chủ', 'Chèn', 'Bố cục', 'Công thức', 'Dữ liệu', 'Hiển thị', 'Mã lệnh'];

  // Script Editor State
  let showScriptEditor = $state(false);
  let userScript = $state('');
  let scriptOutput = $state('');

  function runScript() {
    if (!gridComponent) return;
    scriptOutput = 'Đang chạy...';
    try {
      const sheetAPI = {
        get: (cellId: string) => {
          const val = engine.cells.get(currentSheet + '!' + cellId)?.value;
          return val !== undefined ? val : '';
        },
        set: (cellId: string, value: any) => {
          engine.setCell(currentSheet + '!' + cellId, String(value));
        }
      };
      
      const fn = new Function('sheet', userScript);
      fn(sheetAPI);
      
      gridComponent.renderGrid();
      scriptOutput = 'Chạy thành công!';
    } catch (e: any) {
      scriptOutput = 'Lỗi: ' + e.message;
    }
  }

  function handleScriptKeydown(e: KeyboardEvent) {
    if (e.key === 'Tab') {
      e.preventDefault();
      const target = e.target as HTMLTextAreaElement;
      const start = target.selectionStart;
      const end = target.selectionEnd;
      userScript = userScript.substring(0, start) + '  ' + userScript.substring(end);
      setTimeout(() => {
        target.selectionStart = target.selectionEnd = start + 2;
      }, 0);
    }
  }

  function saveScript() {
    localStorage.setItem('linhhuong_spreadsheet_script', userScript);
    scriptOutput = 'Đã lưu script!';
  }

  function toggleFormat(fmt: keyof CellFormat | string, forcedVal?: any) {
    if (!gridComponent) return;
    const selectedIds = gridComponent.getSelectedCells();
    if (selectedIds.length === 0) return;
    
    const activeId = gridComponent.getSelectedCell() || selectedIds[0];
    const cellData = engine.cells.get(activeId);
    const currentFormat: any = cellData?.format || {};
    const newVal = forcedVal !== undefined ? forcedVal : !currentFormat[fmt];

    for (const id of selectedIds) {
      engine.setCellFormat(id, { [fmt]: newVal });
    }
    gridComponent.renderGrid();
  }

  function addSheet() {
    const newName = `Sheet${sheets.length + 1}`;
    sheets = [...sheets, newName];
    engine.sheets.push(newName);
    currentSheet = newName;
  }

  function deleteSheet(sheetToDelete: string) {
    if (sheets.length <= 1) return; // Cannot delete the last sheet
    sheets = sheets.filter(s => s !== sheetToDelete);
    if (currentSheet === sheetToDelete) {
      currentSheet = sheets[0];
    }
  }

  function changeColor(type: 'color' | 'bgColor', event: Event) {
    const val = (event.target as HTMLInputElement).value;
    if (!gridComponent) return;
    const selectedIds = gridComponent.getSelectedCells();
    for (const id of selectedIds) {
      engine.setCellFormat(id, { [type]: val });
    }
    gridComponent.renderGrid();
  }

  function doAutoSum(funcName = 'TONG') {
    if (!gridComponent) return;
    const selectedIds = gridComponent.getSelectedCells();
    if (selectedIds.length === 0) return;
    
    if (selectedIds.length > 1) {
      let minRow = 99999, maxRow = -1, minCol = 99999, maxCol = -1;
      for (const id of selectedIds) {
        const match = id.match(/!([A-Z]+)([0-9]+)/);
        if (match) {
          const colStr = match[1];
          const row = parseInt(match[2]);
          const colIdx = engine['colToIndex'](colStr);
          if (row < minRow) minRow = row;
          if (row > maxRow) maxRow = row;
          if (colIdx < minCol) minCol = colIdx;
          if (colIdx > maxCol) maxCol = colIdx;
        }
      }
      
      let hasDataInLastRow = false;
      for (let c = minCol; c <= maxCol; c++) {
         const val = engine.cells.get(`${currentSheet}!${engine['indexToCol'](c)}${maxRow}`)?.value;
         if (val !== undefined && val !== '' && val !== null) {
            hasDataInLastRow = true;
            break;
         }
      }

      let targetRow = maxRow + 1;
      let sumMaxRow = maxRow;

      // Phân tích: Nếu người dùng cố tình bôi dư chừa ra các ô trống ở cuối (Ví dụ bôi từ E2 đến E6 nhưng E5, E6 trống)
      // Phương án tối ưu nhất (giống Excel): Đặt kết quả vào chính ô cuối cùng của vùng chọn (E6)
      // và công thức sẽ cộng phần phía trên nó (E2:E5).
      if (!hasDataInLastRow) {
         targetRow = maxRow;
         sumMaxRow = maxRow - 1;
      }
      
      const targetId = `${currentSheet}!${engine['indexToCol'](minCol)}${targetRow}`;
      const range = `${engine['indexToCol'](minCol)}${minRow}:${engine['indexToCol'](maxCol)}${sumMaxRow}`;
      engine.setCell(targetId, `=${funcName}(${range})`);
      gridComponent.renderGrid();
      gridComponent.selectCell(targetId);
    } else {
      const activeId = selectedIds[0];
      const match = activeId.match(/!([A-Z]+)([0-9]+)/);
      if (!match) return;
      const colStr = match[1];
      const row = parseInt(match[2]);
      
      let startRow = row - 1;
      while (startRow >= 1 && typeof engine.cells.get(`${currentSheet}!${colStr}${startRow}`)?.value === 'number') startRow--;
      startRow++; 
      
      if (startRow < row) {
        engine.setCell(activeId, `=${funcName}(${colStr}${startRow}:${colStr}${row - 1})`);
      } else {
        engine.setCell(activeId, `=${funcName}()`);
        gridComponent.startEdit(activeId);
      }
      gridComponent.renderGrid();
    }
  }

  function doSort(asc: boolean) {
    if (!gridComponent) return;
    const selectedIds = gridComponent.getSelectedCells();
    if (selectedIds.length < 2) return;
    engine.sortRange(currentSheet, selectedIds, asc);
    gridComponent.renderGrid();
  }

  function doStructure(type: 'insertRow' | 'deleteRow' | 'insertCol' | 'deleteCol') {
    if (!gridComponent) return;
    const activeId = gridComponent.getSelectedCell();
    if (!activeId) return;
    const match = activeId.match(/!([A-Z]+)([0-9]+)/);
    if (!match) return;
    const colIdx = engine['colToIndex'](match[1]);
    const rowIdx = parseInt(match[2]);
    
    engine.shiftStructure(currentSheet, type, type.includes('Row') ? rowIdx : colIdx);
    gridComponent.renderGrid();
  }

  function addSoftTitle() {
    if (!gridComponent) return;
    const selectedId = gridComponent.getSelectedCell() || `${currentSheet}!A1`;
    engine.addWidget({
      id: `widget_${Date.now()}`,
      sheet: currentSheet,
      type: 'title',
      content: '',
      anchorCell: selectedId,
      style: {
        fontSize: 18,
        bold: true,
        width: 300,
        bgColor: 'rgba(255, 255, 255, 0.8)',
        color: '#1e293b'
      }
    });
    gridComponent.renderGrid();
  }
</script>

<div class="flex flex-col h-screen text-slate-800 font-sans selection:bg-indigo-500/30 overflow-hidden bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-50 via-white to-slate-50">
  
  <!-- Premium Glassmorphism Header -->
  <header class="shrink-0 print:hidden relative z-50 backdrop-blur-md bg-white/70 border-b border-white/20 shadow-[0_4px_30px_rgba(0,0,0,0.03)]">
    <!-- Top Nav -->
    <div class="flex items-center justify-between px-6 py-3 border-b border-slate-200/50">
      <div class="flex items-center space-x-6">
        <div class="flex items-center space-x-3 text-indigo-600 font-extrabold text-xl tracking-tight cursor-pointer hover:scale-105 transition-transform duration-300">
          <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <svg class="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M4 3h16a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1zm1 2v3h4V5H5zm6 0v3h4V5h-4zm6 0v3h4V5h-4zM5 10v4h4v-4H5zm6 0v4h4v-4h-4zm6 0v4h4v-4h-4zM5 16v3h4v-3H5zm6 0v3h4v-3h-4zm6 0v3h4v-3h-4z"/>
            </svg>
          </div>
          <span class="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-600">Linh Hương PS4</span>
        </div>
        <nav class="flex space-x-2">
          {#each tabs as tab}
            <button 
              class="px-4 py-1.5 rounded-full text-sm font-semibold transition-all duration-200 ease-out {activeTab === tab ? 'bg-indigo-100 text-indigo-700 shadow-sm' : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'}"
              onclick={() => activeTab = tab}
            >
              {tab}
            </button>
          {/each}
        </nav>
      </div>
      <!-- Right Side Actions (Avatar/Share) -->
      <div class="flex items-center space-x-3 print:hidden">
        <button class="px-4 py-1.5 rounded-full bg-slate-100 text-slate-700 text-sm font-bold shadow-sm hover:bg-slate-200 transition-all hover:-translate-y-0.5" onclick={() => window.print()} title="In tài liệu (Ctrl+P)">
          In ấn
        </button>
        <button class="px-4 py-1.5 rounded-full bg-gradient-to-r from-indigo-500 to-violet-600 text-white text-sm font-bold shadow-md shadow-indigo-500/20 hover:shadow-lg hover:shadow-indigo-500/40 transition-all hover:-translate-y-0.5">
          Chia sẻ
        </button>
      </div>
    </div>

    <!-- Tool Ribbon -->
    <div class="px-6 py-2 flex items-center space-x-6 bg-white/40 h-14">
      {#if activeTab === 'Trang chủ'}
        <!-- Font controls -->
        <div class="flex items-center space-x-2 border-r border-slate-200/60 pr-6 h-full">
          <div class="relative group">
            <select class="appearance-none border border-slate-200 rounded-lg px-3 py-1 text-sm bg-white/80 hover:bg-white outline-none w-32 cursor-pointer shadow-sm focus:ring-2 focus:ring-indigo-500/50 transition-all text-slate-700 font-medium" onchange={(e) => toggleFormat('fontFamily', (e.target).value)}>
              <option value="">Mặc định</option>
              <option value="Inter">Inter</option>
              <option value="Roboto">Roboto</option>
              <option value="Outfit">Outfit</option>
              <option value="Times New Roman">Times New Roman</option>
            </select>
            <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500">
               <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
            </div>
          </div>
          <div class="relative group">
            <select class="appearance-none border border-slate-200 rounded-lg px-3 py-1 text-sm bg-white/80 hover:bg-white outline-none w-16 cursor-pointer shadow-sm focus:ring-2 focus:ring-indigo-500/50 transition-all text-slate-700 font-medium" onchange={(e) => toggleFormat('fontSize', parseInt((e.target).value))}>
              <option value="11">11</option>
              <option value="12">12</option>
              <option value="14">14</option>
              <option value="16">16</option>
              <option value="18">18</option>
              <option value="24">24</option>
            </select>
            <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500">
               <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
            </div>
          </div>
        </div>

        <!-- Formatting & Colors -->
        <div class="flex items-center space-x-1 border-r border-slate-200/60 pr-6 h-full">
          <button class="w-8 h-8 flex items-center justify-center hover:bg-indigo-50 hover:text-indigo-600 rounded-md text-slate-600 font-bold transition-colors" onclick={() => toggleFormat('bold')} title="In đậm (Ctrl+B)">B</button>
          <button class="w-8 h-8 flex items-center justify-center hover:bg-indigo-50 hover:text-indigo-600 rounded-md text-slate-600 italic font-serif transition-colors" onclick={() => toggleFormat('italic')} title="In nghiêng (Ctrl+I)">I</button>
          <button class="w-8 h-8 flex items-center justify-center hover:bg-indigo-50 hover:text-indigo-600 rounded-md text-slate-600 underline transition-colors" onclick={() => toggleFormat('underline')} title="Gạch chân (Ctrl+U)">U</button>
          
          <button class="w-8 h-8 flex items-center justify-center hover:bg-indigo-50 hover:text-indigo-600 rounded-md text-slate-600 transition-colors" onclick={() => toggleFormat('border')} title="Kẻ bảng (All Borders)">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h12a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V6z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 12h16M12 4v16"></path></svg>
          </button>

          <div class="w-[1px] h-5 bg-slate-300 mx-2"></div>
          
          <button class="w-8 h-8 flex items-center justify-center hover:bg-indigo-50 hover:text-indigo-600 rounded-md text-slate-600 transition-colors" onclick={() => toggleFormat('align', 'left')} title="Căn trái">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h10M4 18h16"></path></svg>
          </button>
          <button class="w-8 h-8 flex items-center justify-center hover:bg-indigo-50 hover:text-indigo-600 rounded-md text-slate-600 transition-colors" onclick={() => toggleFormat('align', 'center')} title="Căn giữa">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M7 12h10M4 18h16"></path></svg>
          </button>
          <button class="w-8 h-8 flex items-center justify-center hover:bg-indigo-50 hover:text-indigo-600 rounded-md text-slate-600 transition-colors" onclick={() => toggleFormat('align', 'right')} title="Căn phải">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M10 12h10M4 18h16"></path></svg>
          </button>
          
          <div class="w-[1px] h-5 bg-slate-300 mx-2"></div>
          
          <div class="relative flex items-center group cursor-pointer" title="Màu chữ">
            <input type="color" class="w-6 h-6 p-0 border-0 cursor-pointer rounded overflow-hidden" onchange={(e) => changeColor('color', e)} value="#334155" />
            <div class="absolute bottom-0 w-full h-[3px] bg-slate-800 pointer-events-none rounded-b"></div>
          </div>
          
          <div class="relative flex items-center group cursor-pointer ml-2" title="Màu nền">
            <input type="color" class="w-6 h-6 p-0 border-0 cursor-pointer rounded overflow-hidden" onchange={(e) => changeColor('bgColor', e)} value="#ffffff" />
            <svg class="w-4 h-4 absolute top-1 left-1 pointer-events-none mix-blend-difference text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"></path></svg>
          </div>
        </div>

      {:else if activeTab === 'Chèn'}
        <!-- Insert Tools -->
        <div class="flex items-center space-x-2 border-r border-slate-200/60 pr-6 h-full">
          <button class="flex items-center space-x-2 px-3 py-1.5 hover:bg-indigo-50 rounded-lg text-slate-600 text-sm font-medium transition-colors group" onclick={addSoftTitle} title="Chèn Tiêu đề Bảng (Soft Layout)">
            <div class="bg-indigo-100 text-indigo-600 p-1 rounded group-hover:bg-indigo-200 transition-colors">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
            </div>
            <span class="group-hover:text-indigo-700">Giao diện mềm</span>
          </button>
        </div>
      
      {:else if activeTab === 'Công thức'}
        <div class="flex items-center space-x-2 border-r border-slate-200/60 pr-6 h-full">
          <button class="flex items-center space-x-2 px-3 py-1.5 hover:bg-indigo-50 rounded-lg text-slate-600 font-medium transition-colors group" onclick={() => doAutoSum('TONG')} title="Tính tổng (Sum)">
            <span class="text-indigo-600 font-bold text-lg leading-none">Σ</span>
            <span class="text-sm">AutoSum</span>
          </button>
          <button class="px-3 py-1.5 hover:bg-slate-100 rounded-lg text-slate-600 text-sm font-medium transition-colors" onclick={() => doAutoSum('TRUNGBINH')}>Trung bình</button>
          <button class="px-3 py-1.5 hover:bg-slate-100 rounded-lg text-slate-600 text-sm font-medium transition-colors" onclick={() => doAutoSum('DEM')}>Đếm</button>
          <button class="px-3 py-1.5 hover:bg-slate-100 rounded-lg text-slate-600 text-sm font-medium transition-colors" onclick={() => doAutoSum('LONNHAT')}>Max</button>
          <button class="px-3 py-1.5 hover:bg-slate-100 rounded-lg text-slate-600 text-sm font-medium transition-colors" onclick={() => doAutoSum('NHONHAT')}>Min</button>
        </div>

      {:else if activeTab === 'Mã lệnh'}
        <div class="flex items-center space-x-2 border-r border-slate-200/60 pr-6 h-full">
          <button class="flex items-center space-x-2 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 rounded-lg text-indigo-700 text-sm font-medium transition-colors border border-indigo-200 shadow-sm" onclick={() => showScriptEditor = true} title="Mở Script Editor để tự động hóa">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"></path></svg>
            <span>Mở Trình soạn thảo Script</span>
          </button>
          
          <button class="flex items-center space-x-2 px-3 py-1.5 hover:bg-emerald-50 rounded-lg text-slate-600 text-sm font-medium transition-colors group" onclick={runScript} title="Chạy đoạn mã lệnh đã lưu">
            <svg class="w-4 h-4 text-emerald-600 group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clip-rule="evenodd"></path></svg>
            <span class="group-hover:text-emerald-700">Chạy Script</span>
          </button>
        </div>

      {:else if activeTab === 'Dữ liệu'}
        <div class="flex items-center space-x-2 border-r border-slate-200/60 pr-6 h-full">
          <button class="flex items-center space-x-2 px-3 py-1.5 hover:bg-indigo-50 rounded-lg text-slate-600 font-medium transition-colors" onclick={() => doSort(true)}>
            <svg class="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12"></path></svg>
            <span class="text-sm">Sắp xếp A-Z</span>
          </button>
          <button class="flex items-center space-x-2 px-3 py-1.5 hover:bg-indigo-50 rounded-lg text-slate-600 font-medium transition-colors" onclick={() => doSort(false)}>
            <svg class="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4h13M3 8h9m-9 4h9m5-4v12m0 0l-4-4m4 4l4-4"></path></svg>
            <span class="text-sm">Sắp xếp Z-A</span>
          </button>
        </div>

      {:else if activeTab === 'Bố cục'}
        <div class="flex items-center space-x-1 border-r border-slate-200/60 pr-6 h-full">
          <button class="px-3 py-1.5 hover:bg-indigo-50 rounded-lg text-slate-600 text-sm font-medium transition-colors" onclick={() => doStructure('insertRow')}>+ Hàng trên</button>
          <button class="px-3 py-1.5 hover:bg-indigo-50 rounded-lg text-slate-600 text-sm font-medium transition-colors" onclick={() => doStructure('insertCol')}>+ Cột trái</button>
          <button class="px-3 py-1.5 hover:bg-rose-50 text-rose-600 rounded-lg text-sm font-medium transition-colors" onclick={() => doStructure('deleteRow')}>- Xóa hàng</button>
          <button class="px-3 py-1.5 hover:bg-rose-50 text-rose-600 rounded-lg text-sm font-medium transition-colors" onclick={() => doStructure('deleteCol')}>- Xóa cột</button>
        </div>

      {:else}
        <div class="flex items-center text-sm text-slate-400 italic">Tính năng đang phát triển...</div>
      {/if}

      <!-- Global Actions (Print) -->
      <div class="flex items-center space-x-1">
        <button class="flex items-center space-x-2 px-3 py-1.5 hover:bg-slate-100 rounded-lg text-slate-600 text-sm font-medium transition-colors" onclick={() => window.print()} title="In ấn">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path></svg>
          <span>In A4</span>
        </button>
      </div>
    </div>
  </header>

  <!-- Formula Bar -->
  <div class="flex items-center px-6 py-2 bg-white/80 backdrop-blur-md border-b border-slate-200/60 shrink-0 shadow-[0_4px_10px_rgba(0,0,0,0.02)] z-40 print:hidden relative">
    <div class="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 font-bold italic mr-3 text-sm shadow-inner cursor-pointer hover:bg-indigo-100 transition-colors">
      fx
    </div>
    <div class="flex-1 relative group">
      <input 
        type="text" 
        bind:value={formulaInput}
        oninput={() => {
          if (gridComponent) gridComponent.updateFromFormulaBar(formulaInput);
        }}
        onkeydown={(e) => {
          if (e.key === 'Enter' && gridComponent) gridComponent.finishFormulaBarEdit();
        }}
        placeholder="Nhập công thức (VD: =TONG(A1:B1) hoặc =SUM(A1:B1))"
        class="w-full bg-slate-50 hover:bg-white focus:bg-white outline-none border border-transparent hover:border-slate-300 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 rounded-xl px-4 py-2 text-sm font-mono text-slate-800 transition-all shadow-sm"
      />
    </div>
  </div>

  <!-- Main Grid Area -->
  <div class="flex-1 relative overflow-hidden bg-slate-100/50 flex flex-col">
     <SpreadsheetGrid {engine} {currentSheet} bind:this={gridComponent} bind:formulaInput />
  </div>

  <!-- Footer Status Bar & Sheet Tabs -->
  <footer class="h-10 bg-white/90 backdrop-blur-md border-t border-slate-200/60 flex items-center justify-between px-4 text-xs text-slate-600 shrink-0 print:hidden shadow-[0_-4px_10px_rgba(0,0,0,0.02)] z-50">
    <!-- Tabs -->
    <div class="flex items-center h-full overflow-x-auto space-x-1 pt-1">
      <button class="px-3 h-8 hover:bg-slate-100 rounded-t-lg flex items-center justify-center text-slate-500 transition-colors" onclick={addSheet} title="Thêm trang tính mới">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
      </button>
      {#each sheets as sheet}
        <div class="relative group flex items-center h-8 rounded-t-lg transition-all {currentSheet === sheet ? 'bg-indigo-50 text-indigo-700 shadow-[inset_0_2px_0_0_#4f46e5]' : 'bg-transparent hover:bg-slate-100 text-slate-600'}">
          <button 
            class="px-5 h-full font-medium"
            onclick={() => currentSheet = sheet}
          >
            {sheet}
          </button>
          {#if sheets.length > 1}
            <button class="absolute right-1 opacity-0 group-hover:opacity-100 p-0.5 hover:bg-white text-slate-400 hover:text-rose-600 rounded-full transition-all" onclick={(e) => { e.stopPropagation(); deleteSheet(sheet); }} title="Xóa Sheet">
              <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
          {/if}
        </div>
      {/each}
    </div>

    <!-- Status -->
    <div class="flex items-center space-x-6 pr-4">
      <span class="flex items-center gap-1.5 px-2 py-1 rounded-full bg-emerald-50 text-emerald-600 font-medium">
        <span class="relative flex h-2 w-2">
          <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span class="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </span>
        Sẵn sàng
      </span>
      <div class="flex items-center space-x-2">
        <svg class="w-4 h-4 cursor-pointer hover:text-indigo-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4"></path></svg>
        <span class="w-10 text-center font-semibold">100%</span>
        <svg class="w-4 h-4 cursor-pointer hover:text-indigo-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
      </div>
    </div>
  </footer>
</div>

{#if showScriptEditor}
  <!-- svelte-ignore a11y-click-events-have-key-events -->
  <!-- svelte-ignore a11y-no-static-element-interactions -->
  <div class="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4" onclick={(e) => { if (e.target === e.currentTarget) showScriptEditor = false; }}>
    <div class="bg-white rounded-xl shadow-2xl w-full max-w-4xl h-[80vh] flex flex-col overflow-hidden">
      
      <!-- Header -->
      <div class="bg-slate-800 text-white px-4 py-3 flex items-center justify-between shrink-0">
        <div class="flex items-center space-x-2">
          <svg class="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"></path></svg>
          <span class="font-bold">Trình soạn thảo Script (JavaScript)</span>
        </div>
        <div class="flex items-center space-x-2">
          <button class="bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-md text-sm font-semibold transition-colors shadow-sm flex items-center" onclick={runScript}>
            <svg class="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clip-rule="evenodd"></path></svg>
            Chạy (Run)
          </button>
          <button class="bg-slate-700 hover:bg-slate-600 px-3 py-1.5 rounded-md text-sm font-semibold transition-colors" onclick={saveScript}>
            Lưu (Save)
          </button>
          <button class="p-1 hover:bg-slate-700 rounded transition-colors text-slate-300 hover:text-white ml-2" onclick={() => showScriptEditor = false}>
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>
      </div>
      
      <!-- Body -->
      <div class="flex-1 flex bg-slate-50 relative">
        <div class="flex-1 flex flex-col p-4 border-r border-slate-200">
          <div class="text-xs text-slate-500 mb-2 font-mono flex items-center justify-between">
            <span>Viết mã JavaScript. Gọi `sheet.get('A1')` và `sheet.set('B1', value)`</span>
            {#if scriptOutput}
              <span class="px-2 py-0.5 rounded {scriptOutput.includes('Lỗi') ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}">{scriptOutput}</span>
            {/if}
          </div>
          <textarea
            class="flex-1 w-full bg-slate-900 text-slate-100 font-mono text-[14px] p-4 rounded-lg resize-none outline-none focus:ring-2 focus:ring-indigo-500/50 leading-relaxed shadow-inner"
            bind:value={userScript}
            onkeydown={handleScriptKeydown}
            spellcheck="false"
            placeholder="// Ví dụ:
// let diem = sheet.get('A1');
// sheet.set('B1', diem * 2);"
          ></textarea>
        </div>
        
        <!-- Sidebar Docs -->
        <div class="w-64 bg-white p-4 overflow-y-auto">
          <h3 class="font-bold text-slate-800 text-sm mb-3 border-b pb-2">Hướng dẫn API</h3>
          <div class="space-y-4 text-xs text-slate-600">
            <div>
              <code class="font-mono text-indigo-600 bg-indigo-50 px-1 py-0.5 rounded block mb-1">sheet.get(id)</code>
              <p>Lấy giá trị của một ô. (Ví dụ: <code>sheet.get('A1')</code>)</p>
            </div>
            <div>
              <code class="font-mono text-indigo-600 bg-indigo-50 px-1 py-0.5 rounded block mb-1">sheet.set(id, val)</code>
              <p>Gán giá trị cho một ô. (Ví dụ: <code>sheet.set('B1', 10)</code>)</p>
            </div>
            <div class="bg-amber-50 border border-amber-200 p-2 rounded text-amber-800 mt-4">
              <strong class="block mb-1">Ví dụ điền chuỗi:</strong>
              <pre class="font-mono text-[10px] bg-white p-1 rounded border border-amber-100">for(let i=1; i&lt;=10; i++) &#123;
  sheet.set('A'+i, i);
&#125;</pre>
            </div>
          </div>
        </div>
      </div>
      
    </div>
  </div>
{/if}

<style>
  :global(body) {
    margin: 0;
    overflow: hidden;
    font-family: 'Inter', system-ui, -apple-system, sans-serif;
  }
  @media print {
    :global(body) {
      overflow: visible !important;
      background: white !important;
    }
    @page {
      size: A4 portrait;
      margin: 10mm;
    }
  }
</style>
