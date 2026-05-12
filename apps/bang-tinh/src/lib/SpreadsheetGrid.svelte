<script lang="ts">
  import type { SpreadsheetEngine, CellFormat } from './engine';
  import { onMount, tick, untrack } from 'svelte';

  let { engine, currentSheet, formulaInput = $bindable('') } = $props<{ engine: SpreadsheetEngine, currentSheet: string, formulaInput?: string }>();
  
  let cells = $state<Record<string, { displayValue: string, isEditing: boolean, editValue: string, format?: CellFormat }>>({});
  let widgetsVersion = $state(0);
  
  const ROWS = 500;
  const COLS = 50; 

  let scrollX = $state(0);
  let scrollY = $state(0);

  function getColName(index: number) {
    let colName = '';
    let curr = index;
    while (curr >= 0) {
      colName = String.fromCharCode(65 + (curr % 26)) + colName;
      curr = Math.floor(curr / 26) - 1;
    }
    return colName;
  }

  let isGridInitialized = false;

  function initGrid() {
    let initialCells: any = {};
    for (let r = 1; r <= ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const id = `${currentSheet}!${getColName(c)}${r}`;
        initialCells[id] = { 
          displayValue: '', 
          isEditing: false, 
          editValue: '',
          format: undefined
        };
      }
    }
    cells = initialCells;
    isGridInitialized = true;
  }

  export function renderGrid() {
    widgetsVersion++;
    if (!isGridInitialized) {
       initGrid();
    }
    
    // Chỉ cập nhật các giá trị thay đổi từ engine
    for (const [id, engineData] of engine.cells.entries()) {
      if (!id.startsWith(currentSheet + '!')) continue;
      if (!cells[id]) continue;
      
      const newDisplay = engineData?.displayValue || '';
      if (cells[id].displayValue !== newDisplay) {
         cells[id].displayValue = newDisplay;
      }
      // Gán lại format nếu thay đổi reference (hoặc shallow diff nếu cần, ở đây gán thẳng)
      if (cells[id].format !== engineData?.format) {
         cells[id].format = engineData?.format;
      }
    }
    
    // Auto-save sau mỗi lần lưới được render lại (khi có thay đổi dữ liệu)
    engine.saveToStorage();
  }

  $effect(() => {
    currentSheet;
    untrack(() => {
      isGridInitialized = false;
      renderGrid();
    });
  });

  // --- MULTI-SELECT STATE ---
  let selectedCell = $state<string | null>(null); // Active cell for formula bar
  let selectedCells = $state<Set<string>>(new Set()); // Multi-selection range
  
  // Header Canvas
  let manualHeaderHeight = $state(0);
  let isDraggingHeader = $state(false);

  // Freeze Panes
  let frozenRows = $state(0);
  let frozenCols = $state(0);
  let isDraggingFreezeRow = $state(false);
  let freezeRowDragY = $state(0);
  let isDraggingFreezeCol = $state(false);
  let freezeColDragX = $state(0);

  let showAutocomplete = $state(false);
  let autoSuggestions = $state<{name: string, desc: string}[]>([]);
  const functionDefs = [
    { name: 'TONG', desc: 'Tính tổng các số (SUM)' },
    { name: 'TRUNGBINH', desc: 'Tính trung bình cộng (AVERAGE)' },
    { name: 'DEM', desc: 'Đếm số lượng ô chứa số (COUNT)' },
    { name: 'LONNHAT', desc: 'Tìm số lớn nhất (MAX)' },
    { name: 'NHONHAT', desc: 'Tìm số nhỏ nhất (MIN)' }
  ];

  // --- UX Kéo thả ---
  let isSelectingRef = $state(false);
  let refDragStartId = $state<string | null>(null);
  let baseFormulaForDrag = $state<string>('');
  
  let isDraggingSelect = $state(false);
  let dragStartCell = $state<string | null>(null);
  let isDraggingFill = $state(false);
  let fillTargetId = $state<string | null>(null);

  let inputEl: HTMLInputElement | null = null;

  export function selectCell(id: string) {
    if (selectedCell && cells[selectedCell]?.isEditing) {
      finishEdit(selectedCell);
    }
    selectedCell = id;
    selectedCells = new Set([id]);
    dragStartCell = id;
    showAutocomplete = false;
    
    // Sync to formula bar
    const cellData = engine.cells.get(id);
    formulaInput = cellData?.formula ? cellData.formula : (cellData?.value !== undefined ? String(cellData.value) : '');
  }

  export function getSelectedCell() { return selectedCell; }
  export function getSelectedCells() { return Array.from(selectedCells); }

  export function updateFromFormulaBar(val: string) {
    if (!selectedCell) return;
    if (!cells[selectedCell].isEditing) {
       cells[selectedCell].isEditing = true;
    }
    cells[selectedCell].editValue = val;
    checkAutocomplete(val);
  }

  export function finishFormulaBarEdit() {
    if (selectedCell) finishEdit(selectedCell);
  }

  export function startEdit(id: string, initialChar?: string) {
    selectCell(id);
    const cellData = engine.cells.get(id);
    cells[id].editValue = initialChar !== undefined ? initialChar : (cellData?.formula ? cellData.formula : (cellData?.value !== undefined ? String(cellData.value) : ''));
    cells[id].isEditing = true;
    formulaInput = cells[id].editValue;
    checkAutocomplete(cells[id].editValue);
    
    tick().then(() => {
      if (inputEl) inputEl.focus();
    });
  }

  function finishEdit(id: string) {
    if (!cells[id] || !cells[id].isEditing) return;
    cells[id].isEditing = false;
    showAutocomplete = false;
    
    const input = cells[id].editValue;
    engine.setCell(id, input);
    
    renderGrid();
    
    // Update active formula input
    const cellData = engine.cells.get(id);
    formulaInput = cellData?.formula ? cellData.formula : (cellData?.value !== undefined ? String(cellData.value) : '');
  }

  function checkAutocomplete(val: string) {
    if (val.startsWith('=')) {
      const query = val.substring(1).toUpperCase();
      const match = query.match(/[A-Z]+$/);
      if (match) {
        const keyword = match[0];
        autoSuggestions = functionDefs.filter(f => f.name.includes(keyword));
        showAutocomplete = autoSuggestions.length > 0;
      } else {
        showAutocomplete = false;
      }
    } else {
      showAutocomplete = false;
    }
  }

  function handleInput(e: Event, id: string) {
    const val = (e.target as HTMLInputElement).value;
    cells[id].editValue = val;
    formulaInput = val; // Sync ngược lên Formula Bar
    checkAutocomplete(val);
  }

  function pickSuggestion(id: string, funcName: string) {
    const val = cells[id].editValue;
    const lastWord = val.match(/[a-zA-Z]+$/);
    if (lastWord) {
      cells[id].editValue = val.substring(0, val.length - lastWord[0].length) + funcName + '(';
      showAutocomplete = false;
      inputEl?.focus();
    }
  }

  function handleKeydown(e: KeyboardEvent, id: string) {
    if (e.key === 'Enter') {
      finishEdit(id);
      const match = id.match(/!([A-Z]+)([0-9]+)/);
      if (match) {
        const nextId = `${currentSheet}!${match[1]}${parseInt(match[2]) + 1}`;
        if (cells[nextId]) {
          selectCell(nextId);
        }
      }
    }
  }

  // --- EVENTS CHO POINT & CLICK / DRAG TO FILL ---
  function selectAll() {
    if (selectedCell && cells[selectedCell]?.isEditing) {
      finishEdit(selectedCell);
    }
    const refs = engine['getRangeRefs'](`${currentSheet}!A1`, `${currentSheet}!${getColName(COLS - 1)}${ROWS}`);
    selectedCells = new Set(refs);
    selectedCell = `${currentSheet}!A1`;
    dragStartCell = `${currentSheet}!A1`;
    showAutocomplete = false;
  }

  function selectColumn(e: MouseEvent, cIndex: number) {
    if (selectedCell && cells[selectedCell]?.isEditing) {
      finishEdit(selectedCell);
    }
    const targetCellId = `${currentSheet}!${getColName(cIndex)}1`;
    
    if (e.shiftKey && dragStartCell) {
       const match = dragStartCell.match(/!([A-Z]+)([0-9]+)/);
       if (match) {
          const startCol = engine['colToIndex'](match[1]);
          const minC = Math.min(startCol, cIndex);
          const maxC = Math.max(startCol, cIndex);
          const refs = engine['getRangeRefs'](`${currentSheet}!${getColName(minC)}1`, `${currentSheet}!${getColName(maxC)}${ROWS}`);
          selectedCells = new Set(refs);
          selectedCell = targetCellId;
          return;
       }
    }

    const refs = engine['getRangeRefs'](`${currentSheet}!${getColName(cIndex)}1`, `${currentSheet}!${getColName(cIndex)}${ROWS}`);
    selectedCells = new Set(refs);
    selectedCell = targetCellId;
    dragStartCell = targetCellId;
    showAutocomplete = false;
  }

  function selectRow(e: MouseEvent, rIndex: number) {
    if (selectedCell && cells[selectedCell]?.isEditing) {
      finishEdit(selectedCell);
    }
    const targetCellId = `${currentSheet}!A${rIndex + 1}`;
    
    if (e.shiftKey && dragStartCell) {
       const match = dragStartCell.match(/!([A-Z]+)([0-9]+)/);
       if (match) {
          const startRow = parseInt(match[2]);
          const minR = Math.min(startRow, rIndex + 1);
          const maxR = Math.max(startRow, rIndex + 1);
          const refs = engine['getRangeRefs'](`${currentSheet}!A${minR}`, `${currentSheet}!${getColName(COLS - 1)}${maxR}`);
          selectedCells = new Set(refs);
          selectedCell = targetCellId;
          return;
       }
    }

    const refs = engine['getRangeRefs'](`${currentSheet}!A${rIndex + 1}`, `${currentSheet}!${getColName(COLS - 1)}${rIndex + 1}`);
    selectedCells = new Set(refs);
    selectedCell = targetCellId;
    dragStartCell = targetCellId;
    showAutocomplete = false;
  }

  function handleMouseDown(e: MouseEvent, id: string) {
    // 1. Nếu đang gõ công thức (editing) và click ô khác -> Append tham chiếu
    if (selectedCell && cells[selectedCell]?.isEditing && id !== selectedCell) {
      const editVal = cells[selectedCell].editValue;
      if (editVal.startsWith('=')) {
        e.preventDefault(); // Ngăn input mất focus
        
        let base = editVal;
        const lastChar = base.trim().slice(-1);
        if (['(', '+', '-', '*', '/', ',', '=', ':'].includes(lastChar)) {
          // OK, append
        } else {
          // Xóa chữ/số ở đuôi để thay thế
          base = base.replace(/[A-Z0-9]+$/, '');
        }

        const localId = id.split('!')[1];
        const newFormula = base + localId;
        cells[selectedCell].editValue = newFormula;
        formulaInput = newFormula;
        baseFormulaForDrag = base;
        
        isSelectingRef = true;
        refDragStartId = id;
        inputEl?.focus();
        return;
      }
    }
    
    // 2. Normal Selection (Multi-select)
    if (e.shiftKey && selectedCell) {
      e.preventDefault();
      const refs = engine['getRangeRefs'](selectedCell, id);
      selectedCells = new Set(refs);
    } else if (e.ctrlKey || e.metaKey) {
      if (selectedCells.has(id)) {
        const newSet = new Set(selectedCells);
        newSet.delete(id);
        selectedCells = newSet;
      } else {
        const newSet = new Set(selectedCells);
        newSet.add(id);
        selectedCells = newSet;
      }
      selectedCell = id;
      const cellData = engine.cells.get(id);
      formulaInput = cellData?.formula ? cellData.formula : (cellData?.value !== undefined ? String(cellData.value) : '');
    } else {
      selectCell(id);
      dragStartCell = id;
      isDraggingSelect = true;
    }
  }

  function handleMouseEnter(e: MouseEvent, id: string) {
    if (isSelectingRef && selectedCell && refDragStartId) {
      const startLocal = refDragStartId.split('!')[1];
      const currLocal = id.split('!')[1];
      let range = startLocal;
      if (startLocal !== currLocal) {
        range = `${startLocal}:${currLocal}`;
      }
      const newFormula = baseFormulaForDrag + range;
      cells[selectedCell].editValue = newFormula;
      formulaInput = newFormula;
    }
    
    if (isDraggingSelect && dragStartCell) {
      const refs = engine['getRangeRefs'](dragStartCell, id);
      selectedCells = new Set(refs);
      selectedCell = id;
      
      const cellData = engine.cells.get(id);
      formulaInput = cellData?.formula ? cellData.formula : (cellData?.value !== undefined ? String(cellData.value) : '');
    }

    if (isDraggingFill && selectedCells.size > 0) {
      fillTargetId = id;
    }
  }

  function extrapolateSequence(sourceValues: any[], targetCount: number, isForward: boolean = true): any[] {
    const result = [];
    if (sourceValues.length === 0) return Array(targetCount).fill('');
    
    // 1. Try Arithmetic Progression & Smart Math Sequences
    let isNumeric = true;
    for(let v of sourceValues) {
       if (v === '' || v === null || v === undefined || isNaN(Number(v))) {
           isNumeric = false; break;
       }
    }
    
    const numValues = isNumeric ? sourceValues.map(v => Number(v)) : [];

    if (isNumeric && numValues.length > 1) {
        const deltas = [];
        for(let i=1; i<numValues.length; i++) {
            deltas.push(numValues[i] - numValues[i-1]);
        }
        const avgDelta = deltas.reduce((a,b)=>a+b, 0) / deltas.length;
        const isArithmetic = deltas.every(d => Math.abs(d - avgDelta) < 0.0001);
        
        if (isArithmetic) {
            let current = isForward ? numValues[numValues.length - 1] : numValues[0];
            for (let i=0; i<targetCount; i++) {
                current += isForward ? avgDelta : -avgDelta;
                let val = Number(current.toFixed(10));
                if (isForward) result.push(val); else result.unshift(val);
            }
            return result;
        }

        // Geometric Progression
        if (numValues.length >= 3) {
            let isGeometric = true;
            let ratio = numValues[1] / numValues[0];
            for(let i=1; i<numValues.length; i++) {
                if (numValues[0] === 0 || Math.abs(numValues[i] / numValues[i-1] - ratio) > 0.0001) {
                    isGeometric = false; break;
                }
            }
            if (isGeometric && numValues[0] !== 0) {
                let current = isForward ? numValues[numValues.length - 1] : numValues[0];
                for (let i=0; i<targetCount; i++) {
                    current = isForward ? current * ratio : current / ratio;
                    let val = Number(current.toFixed(10));
                    if (isForward) result.push(val); else result.unshift(val);
                }
                return result;
            }
        }

        // Fibonacci
        if (numValues.length >= 3) {
            let isFibonacci = true;
            for(let i=2; i<numValues.length; i++) {
                if (numValues[i] !== numValues[i-1] + numValues[i-2]) {
                    isFibonacci = false; break;
                }
            }
            if (isFibonacci) {
                if (isForward) {
                    let a = numValues[numValues.length - 2];
                    let b = numValues[numValues.length - 1];
                    for (let i=0; i<targetCount; i++) {
                        let next = a + b;
                        result.push(next);
                        a = b; b = next;
                    }
                } else {
                    let b = numValues[1];
                    let a = numValues[0];
                    for (let i=0; i<targetCount; i++) {
                        let prev = b - a;
                        result.unshift(prev);
                        b = a; a = prev;
                    }
                }
                return result;
            }
        }

        // Primes
        if (numValues.length >= 2) {
            const isPrime = (num: number) => {
                if (num <= 1) return false;
                if (num <= 3) return true;
                if (num % 2 === 0 || num % 3 === 0) return false;
                for (let i = 5; i * i <= num; i += 6) {
                    if (num % i === 0 || num % (i + 2) === 0) return false;
                }
                return true;
            };
            
            let allPrimes = numValues.every(n => Number.isInteger(n) && isPrime(n));
            let consecutivePrimes = false;
            if (allPrimes) {
                consecutivePrimes = true;
                for (let i=0; i<numValues.length - 1; i++) {
                    let test = numValues[i] + 1;
                    while (!isPrime(test)) test++;
                    if (test !== numValues[i+1]) {
                        consecutivePrimes = false; break;
                    }
                }
            }
            if (consecutivePrimes) {
                if (isForward) {
                    let current = numValues[numValues.length - 1];
                    for (let i=0; i<targetCount; i++) {
                        current++;
                        while (!isPrime(current)) current++;
                        result.push(current);
                    }
                } else {
                    let current = numValues[0];
                    for (let i=0; i<targetCount; i++) {
                        current--;
                        while (current > 1 && !isPrime(current)) current--;
                        result.unshift(current > 1 ? current : '');
                    }
                }
                return result;
            }
        }

        // Perfect Squares
        if (numValues.length >= 2) {
            let isSquares = true;
            let rootDelta = 0;
            if (numValues[0] >= 0 && numValues[1] >= 0) {
                rootDelta = Math.sqrt(numValues[1]) - Math.sqrt(numValues[0]);
                for(let i=1; i<numValues.length; i++) {
                    if (numValues[i] < 0 || Math.abs((Math.sqrt(numValues[i]) - Math.sqrt(numValues[i-1])) - rootDelta) > 0.0001) {
                        isSquares = false; break;
                    }
                }
            } else {
                isSquares = false;
            }

            if (isSquares) {
                let currentRoot = isForward ? Math.sqrt(numValues[numValues.length - 1]) : Math.sqrt(numValues[0]);
                for (let i=0; i<targetCount; i++) {
                    currentRoot += isForward ? rootDelta : -rootDelta;
                    let val = Number((currentRoot * currentRoot).toFixed(10));
                    if (isForward) result.push(val); else result.unshift(val);
                }
                return result;
            }
        }
    }
    
    // 2. Try Smart String Increment
    const parseTextNum = (str: any) => {
        if (str === null || str === undefined || str === '') return null;
        const match = String(str).match(/^(.*?)(\d+)$/);
        return match ? { prefix: match[1], num: parseInt(match[2]) } : null;
    };
    
    const textNums = sourceValues.map(parseTextNum);
    const allTextNums = textNums.every(n => n !== null);
    
    if (allTextNums && sourceValues.length > 0) {
        const firstPrefix = textNums[0]!.prefix;
        const samePrefix = textNums.every(n => n!.prefix === firstPrefix);
        
        if (samePrefix && firstPrefix !== "") {
            let delta = 1;
            let isConsistent = true;
            if (sourceValues.length > 1) {
                delta = textNums[1]!.num - textNums[0]!.num;
                for(let i=1; i<textNums.length; i++) {
                   if (textNums[i]!.num - textNums[i-1]!.num !== delta) {
                      isConsistent = false; break;
                   }
                }
            }
            if (isConsistent) {
                let currentNum = isForward ? textNums[textNums.length - 1]!.num : textNums[0]!.num;
                for (let i=0; i<targetCount; i++) {
                    currentNum += isForward ? delta : -delta;
                    if (isForward) result.push(firstPrefix + currentNum); else result.unshift(firstPrefix + currentNum);
                }
                return result;
            }
        }
    }
    
    // 3. Default Fallback: Repeat Pattern
    for (let i=0; i<targetCount; i++) {
        let val = isForward ? sourceValues[i % sourceValues.length] : sourceValues[(sourceValues.length - 1) - (i % sourceValues.length)];
        if (isForward) result.push(val); else result.unshift(val);
    }
    return result;
  }

  export function handleMouseUp(e: MouseEvent) {
    if (isDraggingHeader) {
      isDraggingHeader = false;
      localStorage.setItem(`headerHeight_${currentSheet}`, manualHeaderHeight.toString());
      return;
    }

    if (isDraggingFreezeRow) {
       isDraggingFreezeRow = false;
       frozenRows = Math.max(0, Math.round((freezeRowDragY - colHeaderHeight - headerHeight) / rowHeight));
       localStorage.setItem(`frozenRows_${currentSheet}`, frozenRows.toString());
       return;
    }

    if (isDraggingFreezeCol) {
       isDraggingFreezeCol = false;
       frozenCols = Math.max(0, Math.round((freezeColDragX - rowHeaderWidth) / colWidth));
       localStorage.setItem(`frozenCols_${currentSheet}`, frozenCols.toString());
       return;
    }

    isDraggingSelect = false;
    
    if (isDraggingFill && selectedCells.size > 0 && fillTargetId) {
      const matchTarget = fillTargetId.match(/!([A-Z]+)([0-9]+)/);
      if (matchTarget) {
        const tC = engine['colToIndex'](matchTarget[1]);
        const tR = parseInt(matchTarget[2]);
        const sheet = fillTargetId.split('!')[0];

        let minR = Infinity, maxR = -Infinity, minC = Infinity, maxC = -Infinity;
        for (const cid of selectedCells) {
          const match = cid.match(/!([A-Z]+)([0-9]+)/);
          if (match) {
            const c = engine['colToIndex'](match[1]);
            const r = parseInt(match[2]);
            if (r < minR) minR = r;
            if (r > maxR) maxR = r;
            if (c < minC) minC = c;
            if (c > maxC) maxC = c;
          }
        }

        if (tR > maxR || tR < minR) {
          const isDown = tR > maxR;
          const targetCount = isDown ? tR - maxR : minR - tR;
          
          for (let c = minC; c <= maxC; c++) {
            const sourceValues = [];
            const sourceFormulas = [];
            for (let r = minR; r <= maxR; r++) {
                const sId = `${sheet}!${getColName(c)}${r}`;
                const cell = engine.cells.get(sId);
                sourceValues.push(cell ? cell.value : '');
                sourceFormulas.push(cell ? cell.formula : '');
            }
            
            const newValues = extrapolateSequence(sourceValues, targetCount, isDown);
            const startR = isDown ? maxR + 1 : tR;
            const endR = isDown ? tR : minR - 1;
            
            let i = 0;
            for (let r = startR; r <= endR; r++) {
              const tId = `${sheet}!${getColName(c)}${r}`;
              const sourceIndex = isDown ? (i % sourceFormulas.length) : ((sourceFormulas.length - 1) - (i % sourceFormulas.length));
              const sourceFormula = sourceFormulas[sourceIndex];
              const sourceRow = minR + sourceIndex;
              
              if (sourceFormula && sourceFormula.startsWith('=')) {
                 const dRow = r - sourceRow;
                 const newFormula = sourceFormula.replace(/\$?[A-Z]+\$?[0-9]+/g, match => {
                    const hasColDollar = match.startsWith('$');
                    const hasRowDollar = match.indexOf('$', 1) !== -1;
                    const cStr = match.match(/[A-Z]+/)![0];
                    const rNum = parseInt(match.match(/[0-9]+/)![0]);
                    const rNew = hasRowDollar ? rNum : Math.max(1, rNum + dRow);
                    return `${hasColDollar ? '$' : ''}${cStr}${hasRowDollar ? '$' : ''}${rNew}`;
                 });
                 engine.setCell(tId, newFormula);
              } else {
                 engine.setCell(tId, String(newValues[i]));
              }
              i++;
            }
          }
          const newMinR = Math.min(minR, tR);
          const newMaxR = Math.max(maxR, tR);
          selectedCells = new Set(engine['getRangeRefs'](`${sheet}!${getColName(minC)}${newMinR}`, `${sheet}!${getColName(maxC)}${newMaxR}`));
        } else if (tC > maxC || tC < minC) {
          const isRight = tC > maxC;
          const targetCount = isRight ? tC - maxC : minC - tC;
          
          for (let r = minR; r <= maxR; r++) {
            const sourceValues = [];
            const sourceFormulas = [];
            for (let c = minC; c <= maxC; c++) {
                const sId = `${sheet}!${getColName(c)}${r}`;
                const cell = engine.cells.get(sId);
                sourceValues.push(cell ? cell.value : '');
                sourceFormulas.push(cell ? cell.formula : '');
            }
            
            const newValues = extrapolateSequence(sourceValues, targetCount, isRight);
            const startC = isRight ? maxC + 1 : tC;
            const endC = isRight ? tC : minC - 1;

            let i = 0;
            for (let c = startC; c <= endC; c++) {
              const tId = `${sheet}!${getColName(c)}${r}`;
              const sourceIndex = isRight ? (i % sourceFormulas.length) : ((sourceFormulas.length - 1) - (i % sourceFormulas.length));
              const sourceFormula = sourceFormulas[sourceIndex];
              const sourceCol = minC + sourceIndex;
              
              if (sourceFormula && sourceFormula.startsWith('=')) {
                 const dCol = c - sourceCol;
                 const newFormula = sourceFormula.replace(/\$?[A-Z]+\$?[0-9]+/g, match => {
                    const hasColDollar = match.startsWith('$');
                    const hasRowDollar = match.indexOf('$', 1) !== -1;
                    const cStr = match.match(/[A-Z]+/)![0];
                    const rNum = parseInt(match.match(/[0-9]+/)![0]);
                    const cIdx = hasColDollar ? engine['colToIndex'](cStr) : Math.max(0, engine['colToIndex'](cStr) + dCol);
                    return `${hasColDollar ? '$' : ''}${engine['indexToCol'](cIdx)}${hasRowDollar ? '$' : ''}${rNum}`;
                 });
                 engine.setCell(tId, newFormula);
              } else {
                 engine.setCell(tId, String(newValues[i]));
              }
              i++;
            }
          }
          const newMinC = Math.min(minC, tC);
          const newMaxC = Math.max(maxC, tC);
          selectedCells = new Set(engine['getRangeRefs'](`${sheet}!${getColName(newMinC)}${minR}`, `${sheet}!${getColName(newMaxC)}${maxR}`));
        }
      }
      renderGrid();
    }
    
    if (draggingWidget && currentDragPos) {
       const widget = engine.widgets.find(w => w.id === draggingWidget);
       if (widget) {
         engine.updateWidget(draggingWidget, {
            style: {
               ...widget.style,
               offsetX: currentDragPos.x,
               offsetY: currentDragPos.y
            }
         });
         renderGrid();
       }
    }
    draggingWidget = null;
    currentDragPos = null;

    if (isSelectingRef) {
      isSelectingRef = false;
      inputEl?.focus();
    }
    
    isDraggingFill = false;
    fillTargetId = null;
  }

  function startFillHandle(e: MouseEvent) {
    e.stopPropagation();
    e.preventDefault();
    if (selectedCells.size === 0) return;
    isDraggingFill = true;
    
    // Default to the bottom-rightmost cell in the selection as the visual anchor
    let maxR = -Infinity, maxC = -Infinity, anchorId = selectedCell;
    for (const cid of selectedCells) {
      const match = cid.match(/!([A-Z]+)([0-9]+)/);
      if (match) {
        const c = engine['colToIndex'](match[1]);
        const r = parseInt(match[2]);
        if (r >= maxR && c >= maxC) {
          maxR = r;
          maxC = c;
          anchorId = cid;
        }
      }
    }
    fillTargetId = anchorId;
  }
  
  // --- DRAGGABLE WIDGETS ---
  let draggingWidget = $state<string | null>(null);
  let dragOffset = $state<{x: number, y: number}>({x: 0, y: 0});
  let currentDragPos = $state<{x: number, y: number} | null>(null);

  function startDragWidget(e: MouseEvent, widgetId: string) {
    if (e.target instanceof HTMLInputElement) return; // Cho phép gõ chữ
    e.preventDefault();
    draggingWidget = widgetId;
    const widget = engine.widgets.find(w => w.id === widgetId);
    const currX = widget?.style?.offsetX || 0;
    const currY = widget?.style?.offsetY || 0;
    dragOffset = { x: e.clientX - currX, y: e.clientY - currY };
    currentDragPos = { x: currX, y: currY };
  }

  function updateFreezeRowDrag(e: MouseEvent) {
    const container = document.querySelector('.spreadsheet-container');
    if (container) {
      const rect = container.getBoundingClientRect();
      let y = e.clientY - rect.top + container.scrollTop;
      const rIndex = Math.max(0, Math.round((y - colHeaderHeight - headerHeight) / rowHeight));
      freezeRowDragY = colHeaderHeight + headerHeight + rIndex * rowHeight;
    }
  }

  function updateFreezeColDrag(e: MouseEvent) {
    const container = document.querySelector('.spreadsheet-container');
    if (container) {
      const rect = container.getBoundingClientRect();
      let x = e.clientX - rect.left + container.scrollLeft;
      const cIndex = Math.max(0, Math.round((x - rowHeaderWidth) / colWidth));
      freezeColDragX = rowHeaderWidth + cIndex * colWidth;
    }
  }

  function handleWindowMouseMove(e: MouseEvent) {
    if (isDraggingHeader) {
      const container = document.querySelector('.spreadsheet-container');
      if (container) {
         const rect = container.getBoundingClientRect();
         const newY = e.clientY - rect.top + container.scrollTop;
         manualHeaderHeight = Math.max(0, newY);
      }
      return;
    }

    if (isDraggingFreezeRow) {
      updateFreezeRowDrag(e);
      return;
    }

    if (isDraggingFreezeCol) {
      updateFreezeColDrag(e);
      return;
    }

    if (draggingWidget) {
      const widget = engine.widgets.find(w => w.id === draggingWidget);
      if (widget) {
        let newOffsetX = e.clientX - dragOffset.x;
        let newOffsetY = e.clientY - dragOffset.y;

        // Gióng lưới (Snap to grid)
        // Lưới ngang mỗi cột 96px, lưới dọc mỗi dòng 28px
        const snappedOffsetX = Math.round(newOffsetX / 96) * 96;
        const snappedOffsetY = Math.round(newOffsetY / 28) * 28;

        // Hít vào lưới nếu khoảng cách < 15px
        if (Math.abs(newOffsetX - snappedOffsetX) < 15) newOffsetX = snappedOffsetX;
        if (Math.abs(newOffsetY - snappedOffsetY) < 15) newOffsetY = snappedOffsetY;

        currentDragPos = { x: newOffsetX, y: newOffsetY };
      }
    }
  }

  // --- COPY / PASTE ---
  let clipboardData = $state<{ sourceId: string, content: string } | null>(null);

  // --- DIRECT TYPING ---
  function handleWindowKeydown(e: KeyboardEvent) {
    if (e.ctrlKey || e.metaKey) {
      if (e.key === 'c') {
        if (!selectedCell || document.activeElement instanceof HTMLInputElement) return;
        const cellData = engine.cells.get(selectedCell);
        clipboardData = {
          sourceId: selectedCell,
          content: cellData?.formula ? cellData.formula : (cellData?.value !== undefined ? String(cellData.value) : '')
        };
        navigator.clipboard.writeText(clipboardData.content).catch(()=>{});
        return;
      }
      if (e.key === 'v') {
        if (!selectedCell || document.activeElement instanceof HTMLInputElement) return;
        navigator.clipboard.readText().then(text => {
          performPaste(text);
        }).catch(()=>{});
        return;
      }
      return;
    }
    
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
    if (!selectedCell) return;
    
    // Nếu bấm Delete / Backspace -> Xóa toàn bộ selectedCells
    if (e.key === 'Delete' || e.key === 'Backspace') {
      for (const id of Array.from(selectedCells)) {
        engine.setCell(id, '');
      }
      renderGrid();
      formulaInput = '';
      e.preventDefault();
      return;
    }
    
    // Nếu bấm Enter -> Edit ô hiện tại
    if (e.key === 'Enter') {
      startEdit(selectedCell);
      e.preventDefault();
      return;
    }
    
    // Nếu bấm phím ký tự / số -> Bắt đầu Edit ngay
    if (e.key.length === 1) {
      startEdit(selectedCell, e.key);
      e.preventDefault();
    }
  }

  function performPaste(text: string) {
      if (clipboardData && clipboardData.content === text && clipboardData.content.startsWith('=')) {
        const srcColStr = clipboardData.sourceId.split('!')[1].match(/[A-Z]+/)![0];
        const srcRow = parseInt(clipboardData.sourceId.split('!')[1].match(/[0-9]+/)![0]);
        const srcColIdx = engine['colToIndex'](srcColStr);

        const destColStr = selectedCell!.split('!')[1].match(/[A-Z]+/)![0];
        const destRow = parseInt(selectedCell!.split('!')[1].match(/[0-9]+/)![0]);
        const destColIdx = engine['colToIndex'](destColStr);

        const dCol = destColIdx - srcColIdx;
        const dRow = destRow - srcRow;

        const newFormula = clipboardData.content.replace(/[A-Z]+[0-9]+/g, match => {
          const cStr = match.match(/[A-Z]+/)![0];
          const rNum = parseInt(match.match(/[0-9]+/)![0]);
          const cIdx = engine['colToIndex'](cStr) + dCol;
          const rNew = Math.max(1, rNum + dRow);
          return `${engine['indexToCol'](cIdx)}${rNew}`;
        });
        engine.setCell(selectedCell!, newFormula);
      } else {
        engine.setCell(selectedCell!, text);
      }
      renderGrid();
  }

  // --- CONTEXT MENU ---
  let contextMenu = $state<{x: number, y: number, show: boolean}>({x: 0, y: 0, show: false});

  function handleContextMenu(e: MouseEvent, id: string) {
    e.preventDefault();
    if (!selectedCells.has(id)) {
      selectCell(id);
    }
    contextMenu = {
      x: e.clientX,
      y: e.clientY,
      show: true
    };
  }

  function handleContextAction(action: 'copy' | 'paste' | 'delete') {
    contextMenu.show = false;
    if (action === 'copy') {
      if (!selectedCell) return;
      const cellData = engine.cells.get(selectedCell);
      clipboardData = {
        sourceId: selectedCell,
        content: cellData?.formula ? cellData.formula : (cellData?.value !== undefined ? String(cellData.value) : '')
      };
      navigator.clipboard.writeText(clipboardData.content).catch(()=>{});
    } else if (action === 'paste') {
      if (!selectedCell) return;
      navigator.clipboard.readText().then(text => {
         performPaste(text);
      }).catch(()=>{});
    } else if (action === 'delete') {
      for (const id of Array.from(selectedCells)) {
        engine.setCell(id, '');
      }
      renderGrid();
      formulaInput = '';
    }
  }

  // --- WIDGET POSITIONING ---
  function getWidgetPos(anchorCell: string) {
    const match = anchorCell.match(/!([A-Z]+)([0-9]+)/);
    if (!match) return { x: 0, y: 0 };
    
    const colStr = match[1];
    const rowIdx = parseInt(match[2]) - 1;
    
    let colIdx = 0;
    for (let i = 0; i < colStr.length; i++) {
      colIdx = colIdx * 26 + (colStr.charCodeAt(i) - 64);
    }
    colIdx -= 1; // 0-based

    return {
      x: 40 + colIdx * 96,
      y: 32 + rowIdx * 28
    };
  }

  let headerHeight = $derived.by(() => {
    widgetsVersion; // Đảm bảo Svelte track thay đổi khi widget cập nhật
    let maxH = 0;
    for (const w of engine.widgets) {
      if (w.sheet === currentSheet && w.pinned) {
        const pos = getWidgetPos(w.anchorCell);
        const h = pos.y + (w.style?.offsetY || 0) + 60; // 44 minHeight + 16px padding
        if (h > maxH) maxH = h;
      }
    }
    return maxH;
  });

  let activeWidgets = $derived.by(() => {
    widgetsVersion;
    return engine.widgets.filter(w => w.sheet === currentSheet);
  });

  let colWidth = $state(96);
  let rowHeight = $state(28);
  let rowHeaderWidth = $state(40);
  let colHeaderHeight = $state(32);
  let containerPadding = $state(8);

  $effect(() => {
    function measureGridSizes() {
      const container = document.querySelector('.spreadsheet-container');
      if (container) {
         const style = window.getComputedStyle(container);
         containerPadding = parseFloat(style.paddingLeft) || 8;
      }
      const cornerTh = document.querySelector('thead th:first-child');
      if (cornerTh) {
         const rect = cornerTh.getBoundingClientRect();
         rowHeaderWidth = rect.width;
         colHeaderHeight = rect.height;
      }
      const firstColTh = document.querySelector('thead th:nth-child(2)');
      if (firstColTh) {
         colWidth = firstColTh.getBoundingClientRect().width;
      }
      const firstTd = document.querySelector('tbody tr:first-child td');
      if (firstTd) {
         rowHeight = firstTd.getBoundingClientRect().height;
      }
    }
    
    measureGridSizes();
    setTimeout(measureGridSizes, 100);
    window.addEventListener('resize', measureGridSizes);
    return () => window.removeEventListener('resize', measureGridSizes);
  });

  let selectionBoxStyle = $derived.by(() => {
    if (selectedCells.size === 0) return { show: false, left: 0, top: 0, width: 0, height: 0 };
    let minR = Infinity, maxR = -Infinity, minC = Infinity, maxC = -Infinity;
    for (const id of selectedCells) {
      const match = id.match(/!([A-Z]+)([0-9]+)/);
      if (match) {
        const c = engine['colToIndex'](match[1]);
        const r = parseInt(match[2]);
        if (r < minR) minR = r;
        if (r > maxR) maxR = r;
        if (c < minC) minC = c;
        if (c > maxC) maxC = c;
      }
    }
    if (minR === Infinity) return { show: false, left: 0, top: 0, width: 0, height: 0 };
    
    return {
      left: rowHeaderWidth + minC * colWidth + containerPadding,
      top: colHeaderHeight + (minR - 1) * rowHeight + headerHeight + containerPadding,
      width: (maxC - minC + 1) * colWidth,
      height: (maxR - minR + 1) * rowHeight,
      show: true
    };
  });

  let fillBoxStyle = $derived.by(() => {
    if (!isDraggingFill || !fillTargetId || selectedCells.size === 0) return { show: false, left: 0, top: 0, width: 0, height: 0 };

    let minR = Infinity, maxR = -Infinity, minC = Infinity, maxC = -Infinity;
    for (const id of selectedCells) {
      const match = id.match(/!([A-Z]+)([0-9]+)/);
      if (match) {
        const c = engine['colToIndex'](match[1]);
        const r = parseInt(match[2]);
        if (r < minR) minR = r;
        if (r > maxR) maxR = r;
        if (c < minC) minC = c;
        if (c > maxC) maxC = c;
      }
    }

    const matchTarget = fillTargetId.match(/!([A-Z]+)([0-9]+)/);
    if (matchTarget) {
      const tC = engine['colToIndex'](matchTarget[1]);
      const tR = parseInt(matchTarget[2]);
      
      if (tR > maxR || tR < minR) {
        minR = Math.min(minR, tR);
        maxR = Math.max(maxR, tR);
      } else if (tC > maxC || tC < minC) {
        minC = Math.min(minC, tC);
        maxC = Math.max(maxC, tC);
      }
    }

    return {
      left: rowHeaderWidth + minC * colWidth + containerPadding,
      top: colHeaderHeight + (minR - 1) * rowHeight + headerHeight + containerPadding,
      width: (maxC - minC + 1) * colWidth,
      height: (maxR - minR + 1) * rowHeight,
      show: true
    };
  });

</script>

<svelte:window 
  onmouseup={handleMouseUp} 
  onmousemove={handleWindowMouseMove} 
  onkeydown={handleWindowKeydown} 
  onmousedown={() => { contextMenu.show = false; }} 
/>

  <div 
    class="flex-1 overflow-auto bg-gray-100 p-2 print:p-0 print:bg-white relative select-none spreadsheet-container print:overflow-visible print:block print:h-auto"
    onscroll={(e) => {
      scrollX = (e.target as HTMLElement).scrollLeft;
      scrollY = (e.target as HTMLElement).scrollTop;
    }}
  >
  <!-- WIDGET LAYER (Soft Layout) -->
  <div class="absolute top-2 left-2 w-full h-full pointer-events-none z-30">
    {#each activeWidgets as widget (widget.id)}
      {@const pos = getWidgetPos(widget.anchorCell)}
      {@const basePosY = widget.pinned ? 0 : pos.y}
      {@const isDragging = widget.id === draggingWidget}
      {@const currentOffsetX = isDragging && currentDragPos ? currentDragPos.x : (widget.style?.offsetX || 0)}
      {@const currentOffsetY = isDragging && currentDragPos ? currentDragPos.y : (widget.style?.offsetY || 0)}
      {@const totalX = pos.x + currentOffsetX}
      {@const totalY = basePosY + currentOffsetY}
      <div 
        class="group absolute pointer-events-auto border border-white/50 hover:border-indigo-400/80 flex items-center shadow-xl shadow-indigo-500/10 bg-white/70 backdrop-blur-md transition-shadow transition-colors overflow-hidden rounded-xl ring-1 ring-slate-900/5 hover:ring-indigo-500/30"
        style="left: {totalX}px; top: {totalY}px; width: {widget.style?.width || 288}px; min-height: 44px; font-size: {widget.style?.fontSize || 16}px; font-weight: {widget.style?.bold ? 'bold' : 'normal'}; color: {widget.style?.color || '#334155'}; background-color: {widget.style?.bgColor ? widget.style.bgColor.replace(')', ', 0.7)').replace('rgb', 'rgba') : 'rgba(255,255,255,0.7)'};"
        onmousedown={(e) => startDragWidget(e, widget.id)}
      >
         <!-- Drag Handle -->
         <div class="absolute left-1 top-1/2 -translate-y-1/2 w-5 h-8 flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-move text-slate-400 hover:text-indigo-500 transition-opacity z-10" onmousedown={(e) => { /* Bubbles up to startDragWidget */ }}>
           <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M8 6h.01M16 6h.01M8 12h.01M16 12h.01M8 18h.01M16 18h.01"></path></svg>
         </div>
         
         <input 
            type="text" 
            class="w-full h-full pl-7 pr-16 py-2 bg-transparent outline-none border-none placeholder-slate-400 cursor-text font-medium relative z-0"
            placeholder="Nhập tiêu đề / Ghi chú..."
            value={widget.content}
            oninput={(e) => { engine.updateWidget(widget.id, { content: (e.currentTarget as HTMLInputElement).value }); }}
         />
         <div class="absolute top-1 right-1 opacity-0 group-hover:opacity-100 flex gap-1 transition-all z-10" onmousedown={(e) => e.stopPropagation()}>
           <button 
             class="px-2 py-1 text-xs font-medium rounded-md transition-colors {widget.pinned ? 'text-indigo-700 bg-indigo-100 hover:bg-indigo-200' : 'text-slate-600 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 shadow-sm'}" 
             onclick={() => { engine.updateWidget(widget.id, { pinned: !widget.pinned }); renderGrid(); }} 
             title={widget.pinned ? "Đang ở chế độ Tiêu đề Văn bản (Tự động đẩy bảng xuống)" : "Chuyển thành Tiêu đề Văn bản (Đẩy bảng tính xuống)"}
           >
             {widget.pinned ? 'Bỏ Tiêu đề' : 'Làm Tiêu đề'}
           </button>
           <button class="text-rose-500 hover:bg-rose-100 p-1 rounded-md transition-colors shadow-sm bg-white" onclick={() => { engine.removeWidget(widget.id); renderGrid(); }} title="Xóa">
             <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
           </button>
         </div>
      </div>
    {/each}
  </div>

  <!-- SELECTION OVERLAY -->
  {#if selectionBoxStyle.show}
    <div 
      class="absolute border-[2px] border-indigo-500 pointer-events-none transition-all duration-75 ease-out shadow-[0_0_15px_rgba(99,102,241,0.15)]"
      style="left: {selectionBoxStyle.left}px; top: {selectionBoxStyle.top}px; width: {selectionBoxStyle.width}px; height: {selectionBoxStyle.height}px; z-index: 5;"
    >
      <!-- Fill Handle -->
      <div 
        class="absolute -bottom-[5px] -right-[5px] w-2.5 h-2.5 bg-indigo-500 border-2 border-white rounded-full shadow-sm cursor-crosshair pointer-events-auto hover:scale-150 transition-transform active:scale-95"
        onmousedown={startFillHandle}
      ></div>
    </div>
  {/if}

  <!-- FILL TARGET OVERLAY -->
  {#if fillBoxStyle.show}
    <div 
      class="absolute border-[2px] border-dashed border-indigo-500 bg-indigo-500/10 pointer-events-none z-10"
      style="left: {fillBoxStyle.left}px; top: {fillBoxStyle.top}px; width: {fillBoxStyle.width}px; height: {fillBoxStyle.height}px;"
    ></div>
  {/if}

  <!-- Header Canvas Resize Handle -->
  <div 
    class="w-full h-3 bg-transparent hover:bg-indigo-500/20 cursor-row-resize absolute z-40 transition-colors flex items-center justify-center group"
    style="top: {headerHeight - 2}px; left: 0;"
    onmousedown={(e) => { isDraggingHeader = true; e.preventDefault(); }}
    title="Kéo lên/xuống để thay đổi không gian Tiêu đề Công văn"
  >
    <div class="w-16 h-1 bg-indigo-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"></div>
  </div>

  <!-- Freeze Indicators -->
  {#if isDraggingFreezeRow}
    <div class="absolute left-0 w-full h-1 bg-indigo-500 z-50 pointer-events-none" style="top: {freezeRowDragY}px;"></div>
  {/if}
  {#if isDraggingFreezeCol}
    <div class="absolute top-0 h-full w-1 bg-indigo-500 z-50 pointer-events-none" style="left: {freezeColDragX}px;"></div>
  {/if}

  <table class="border-collapse bg-white shadow-sm print:shadow-none min-w-max text-sm font-sans" style="margin-top: {headerHeight}px;">
    <thead class="print:hidden">
      <tr>
        <th 
          class="w-10 h-8 border border-slate-200 bg-slate-50/80 backdrop-blur-md text-slate-400 font-semibold sticky left-0 z-40 shadow-[inset_-1px_-1px_0_0_#e2e8f0] cursor-pointer hover:bg-slate-200 transition-colors relative" 
          style="top: 0px;"
          onclick={selectAll}
        >
          <!-- Freeze Row Handle -->
          <div class="absolute bottom-0 left-0 w-full h-2 bg-slate-400/20 hover:bg-indigo-500 cursor-row-resize transition-colors z-50 flex items-center justify-center group/fr" onmousedown={(e) => { e.preventDefault(); e.stopPropagation(); isDraggingFreezeRow = true; updateFreezeRowDrag(e); }}>
             <div class="w-4 h-0.5 bg-slate-500 rounded-full group-hover/fr:bg-white"></div>
          </div>
          <!-- Freeze Col Handle -->
          <div class="absolute top-0 right-0 w-2 h-full bg-slate-400/20 hover:bg-indigo-500 cursor-col-resize transition-colors z-50 flex items-center justify-center group/fc" onmousedown={(e) => { e.preventDefault(); e.stopPropagation(); isDraggingFreezeCol = true; updateFreezeColDrag(e); }}>
             <div class="w-0.5 h-4 bg-slate-500 rounded-full group-hover/fc:bg-white"></div>
          </div>
        </th>
        {#each Array(COLS) as _, cIndex}
          {@const isFrozenCol = cIndex < frozenCols}
          {@const isLastFrozenCol = cIndex === frozenCols - 1}
          <th 
            class="w-24 h-8 border border-slate-200 bg-slate-50/80 backdrop-blur-md text-slate-500 font-semibold sticky text-center shadow-[inset_-1px_-1px_0_0_#e2e8f0] tracking-wide text-xs cursor-pointer hover:bg-slate-200 hover:text-indigo-600 transition-colors {isLastFrozenCol ? 'border-r-2 border-r-slate-400/80 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]' : ''}" 
            style="top: 0px; z-index: {isFrozenCol ? 30 : 10}; {isFrozenCol ? `left: ${rowHeaderWidth + cIndex * colWidth}px;` : ''}"
            onclick={(e) => selectColumn(e, cIndex)}
          >
            {getColName(cIndex)}
          </th>
        {/each}
      </tr>
    </thead>
    <tbody>
      {#each Array(ROWS) as _, rIndex}
        {@const r = rIndex + 1}
        {@const isFrozenRow = rIndex < frozenRows}
        {@const isLastFrozenRow = rIndex === frozenRows - 1}
        <tr class="group">
          <th 
            class="w-10 h-7 border border-slate-200 bg-slate-50/50 text-slate-400 font-medium sticky left-0 transition-colors shadow-[inset_-1px_0_0_#e2e8f0] cursor-pointer hover:bg-slate-200 hover:text-indigo-600 print:hidden {isLastFrozenRow ? 'border-b-2 border-b-slate-400/80 shadow-[0_2px_5px_-2px_rgba(0,0,0,0.1)]' : ''}"
            style="z-index: {isFrozenRow ? 30 : 10}; {isFrozenRow ? `top: ${colHeaderHeight + rIndex * rowHeight}px;` : ''}"
            onclick={(e) => selectRow(e, rIndex)}
          >
            {r}
          </th>
          {#each Array(COLS) as _, cIndex}
            {@const id = `${currentSheet}!${getColName(cIndex)}${r}`}
            {@const isSelected = selectedCells.has(id)}
            {@const isActiveCell = selectedCell === id}
            {@const cell = cells[id]}
            {@const isFrozenCol = cIndex < frozenCols}
            {@const isLastFrozenCol = cIndex === frozenCols - 1}
            <td 
              data-cell-id={id}
              class="relative p-0 cursor-cell transition-colors duration-75 {isSelected && !isActiveCell ? 'bg-indigo-100/80' : 'bg-white hover:bg-slate-50/50'} {cell?.format?.border ? 'border-slate-800 border-[1.5px]' : 'border-slate-200 border'} {isLastFrozenRow ? 'border-b-2 border-b-slate-400/80' : ''} {isLastFrozenCol ? 'border-r-2 border-r-slate-400/80' : ''}"
              onmousedown={(e) => handleMouseDown(e, id)}
              onmouseenter={(e) => handleMouseEnter(e, id)}
              oncontextmenu={(e) => handleContextMenu(e, id)}
              ondblclick={() => startEdit(id)}
              style="{cell?.format?.bgColor ? `background-color:${cell.format.bgColor};` : ''} {isFrozenRow || isFrozenCol ? `position: sticky; z-index: ${isFrozenRow && isFrozenCol ? 25 : 15};` : ''} {isFrozenRow ? `top: ${colHeaderHeight + rIndex * rowHeight}px;` : ''} {isFrozenCol ? `left: ${rowHeaderWidth + cIndex * colWidth}px;` : ''}"
            >
              {#if cell && cell.isEditing}
                <input 
                  bind:this={inputEl}
                  type="text" 
                  bind:value={cells[id].editValue} 
                  oninput={(e) => handleInput(e, id)}
                  onblur={() => {
                    setTimeout(() => {
                      if (!isSelectingRef && !showAutocomplete) {
                         finishEdit(id);
                      }
                    }, 150);
                  }}
                  onkeydown={(e) => handleKeydown(e, id)}
                  style="{cell.format?.align ? `text-align:${cell.format.align};` : ''} {cell.format?.fontFamily ? `font-family:${cell.format.fontFamily};` : ''} {cell.format?.fontSize ? `font-size:${cell.format.fontSize}px;` : ''}"
                  class="absolute inset-0 w-[calc(100%+2px)] h-[calc(100%+2px)] -top-[1px] -left-[1px] px-2 outline-none bg-white ring-2 ring-indigo-500 shadow-[0_4px_15px_rgba(99,102,241,0.2)] z-20 font-mono text-indigo-700 font-semibold rounded-[2px]"
                />
                
                {#if showAutocomplete}
                  <div class="absolute left-0 top-full mt-2 bg-white/95 backdrop-blur-xl border border-white/40 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.1)] z-30 w-64 max-h-56 overflow-auto ring-1 ring-slate-900/5 transition-all">
                    <div class="px-3 py-2 text-[10px] font-black tracking-widest uppercase text-slate-400 bg-slate-50/50 border-b border-slate-100">Gợi ý hàm Tiếng Việt</div>
                    {#each autoSuggestions as sug}
                      <div class="px-3 py-2.5 hover:bg-indigo-50/80 cursor-pointer flex flex-col transition-colors border-b border-slate-50 last:border-0" onmousedown={(e) => { e.preventDefault(); pickSuggestion(id, sug.name); }}>
                        <span class="font-mono text-indigo-600 font-bold">{sug.name}</span>
                        <span class="text-xs text-slate-500 mt-0.5">{sug.desc}</span>
                      </div>
                    {/each}
                  </div>
                {/if}

              {:else if cell}
                <div 
                  class="px-2 w-full h-full min-h-[28px] flex items-center overflow-hidden whitespace-nowrap text-slate-700 {cell.format?.align === 'center' ? 'justify-center' : cell.format?.align === 'right' ? 'justify-end' : 'justify-start'}"
                  style="{cell.format?.bold ? 'font-weight:bold;' : ''} {cell.format?.italic ? 'font-style:italic;' : ''} {cell.format?.underline ? 'text-decoration:underline;' : ''} {cell.format?.color ? `color:${cell.format.color};` : ''} {cell.format?.fontFamily ? `font-family:${cell.format.fontFamily};` : ''} {cell.format?.fontSize ? `font-size:${cell.format.fontSize}px;` : ''}"
                >
                  {cell.displayValue}
                </div>
              {/if}
            </td>
          {/each}
        </tr>
      {/each}
    </tbody>
  </table>

  <!-- CONTEXT MENU RENDER -->
  {#if contextMenu.show}
    <div 
      class="fixed bg-white/95 backdrop-blur-xl border border-white/40 shadow-[0_10px_40px_rgba(0,0,0,0.1)] rounded-xl py-2 z-50 min-w-[200px] text-sm font-sans ring-1 ring-slate-900/5"
      style="left: {contextMenu.x}px; top: {contextMenu.y}px;"
    >
      <button class="w-full text-left px-4 py-2 hover:bg-indigo-50 text-slate-700 transition-colors flex items-center gap-3 font-medium" onclick={() => handleContextAction('copy')}>
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
        Sao chép
      </button>
      <button class="w-full text-left px-4 py-2 hover:bg-indigo-50 text-slate-700 transition-colors flex items-center gap-3 font-medium" onclick={() => handleContextAction('paste')}>
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path></svg>
        Dán
      </button>
      <div class="h-px bg-slate-100 my-1"></div>
      <button class="w-full text-left px-4 py-2 hover:bg-rose-50 text-rose-600 transition-colors flex items-center gap-3 font-medium" onclick={() => handleContextAction('delete')}>
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
        Xóa nội dung
      </button>
    </div>
  {/if}
</div>

<style>
  @media print {
    th.bg-gray-50, td.bg-gray-50 {
      display: none !important;
    }
    table {
      width: 100%;
      border: 1px solid #000;
    }
    td, th {
      border: 1px solid #000 !important;
    }
    .outline-blue-500 {
      outline: none !important;
    }
  }
</style>
