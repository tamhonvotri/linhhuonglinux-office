// Lõi Tính Toán (Computation Engine) cho Spreadsheet - Đa trang & Song ngữ

export type CellType = 'string' | 'number' | 'boolean' | 'error' | 'empty';

export interface CellFormat {
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  color?: string;
  bgColor?: string;
  align?: 'left' | 'center' | 'right';
  fontFamily?: string;
  fontSize?: number;
  border?: boolean;
}

export interface CellData {
  value: any;
  formula?: string;
  type: CellType;
  displayValue?: string;
  format?: CellFormat;
}

export interface Widget {
  id: string;
  sheet: string;
  type: 'title' | 'note';
  content: string;
  anchorCell: string;
  style?: {
    fontSize?: number;
    color?: string;
    bgColor?: string;
    bold?: boolean;
    italic?: boolean;
    width?: number;
  };
  pinned?: boolean;
}

const VI_FN_ALIASES: Record<string, string> = {
  'TONG': 'SUM',
  'TRUNGBINH': 'AVERAGE',
  'DEM': 'COUNT',
  'LONNHAT': 'MAX',
  'NHONHAT': 'MIN',
  'NEU': 'IF',
  'VA': 'AND',
  'HOAC': 'OR',
  'NOICHUOI': 'CONCATENATE',
  'TRAI': 'LEFT',
  'PHAI': 'RIGHT',
  'TIMKIEMDOC': 'VLOOKUP',
  'TIMKIEMNGANG': 'HLOOKUP'
};

// --- AST PARSER FOR EXCEL FORMULAS ---
enum TokenType {
  NUMBER, STRING, CELL_REF, FUNC_NAME, OP, LPAREN, RPAREN, COMMA, COLON, EOF
}

interface Token {
  type: TokenType;
  value: string;
}

class Parser {
  private pos = 0;
  private currentToken: Token;
  private refs = new Set<string>();

  constructor(private tokens: Token[], private currentSheet: string) {
    this.currentToken = this.tokens[0];
  }

  private advance() {
    this.pos++;
    if (this.pos < this.tokens.length) {
      this.currentToken = this.tokens[this.pos];
    } else {
      this.currentToken = { type: TokenType.EOF, value: '' };
    }
  }

  private eat(type: TokenType) {
    if (this.currentToken.type === type) {
      this.advance();
    } else {
      throw new Error(`Expected ${type} but got ${this.currentToken.type}`);
    }
  }

  public parse(): { ast: any, refs: string[] } {
    const ast = this.expr();
    return { ast, refs: Array.from(this.refs) };
  }

  private expr(): any {
    return this.logic();
  }

  private logic(): any {
    let node = this.concat();
    while (this.currentToken.type === TokenType.OP && ['>', '<', '=', '>=', '<=', '<>'].includes(this.currentToken.value)) {
      const op = this.currentToken.value;
      this.eat(TokenType.OP);
      node = { type: 'BinaryOp', left: node, op, right: this.concat() };
    }
    return node;
  }

  private concat(): any {
    let node = this.addsub();
    while (this.currentToken.type === TokenType.OP && this.currentToken.value === '&') {
      const op = this.currentToken.value;
      this.eat(TokenType.OP);
      node = { type: 'BinaryOp', left: node, op, right: this.addsub() };
    }
    return node;
  }

  private addsub(): any {
    let node = this.term();
    while (this.currentToken.type === TokenType.OP && ['+', '-'].includes(this.currentToken.value)) {
      const op = this.currentToken.value;
      this.eat(TokenType.OP);
      node = { type: 'BinaryOp', left: node, op, right: this.term() };
    }
    return node;
  }

  private term(): any {
    let node = this.factor();
    while (this.currentToken.type === TokenType.OP && ['*', '/'].includes(this.currentToken.value)) {
      const op = this.currentToken.value;
      this.eat(TokenType.OP);
      node = { type: 'BinaryOp', left: node, op, right: this.factor() };
    }
    return node;
  }

  private factor(): any {
    const token = this.currentToken;
    if (token.type === TokenType.OP && token.value === '-') {
      this.eat(TokenType.OP);
      return { type: 'UnaryOp', op: '-', expr: this.factor() };
    } else if (token.type === TokenType.NUMBER) {
      this.eat(TokenType.NUMBER);
      return { type: 'Literal', value: parseFloat(token.value) };
    } else if (token.type === TokenType.STRING) {
      this.eat(TokenType.STRING);
      return { type: 'Literal', value: token.value };
    } else if (token.type === TokenType.LPAREN) {
      this.eat(TokenType.LPAREN);
      const node = this.expr();
      this.eat(TokenType.RPAREN);
      return node;
    } else if (token.type === TokenType.FUNC_NAME) {
      // Dịch từ tiếng Việt sang tiếng Anh nếu có
      let name = token.value;
      if (VI_FN_ALIASES[name]) name = VI_FN_ALIASES[name];
      
      this.eat(TokenType.FUNC_NAME);
      this.eat(TokenType.LPAREN);
      const args = [];
      if (this.currentToken.type !== TokenType.RPAREN) {
        args.push(this.expr());
        while (this.currentToken.type === TokenType.COMMA) {
          this.eat(TokenType.COMMA);
          args.push(this.expr());
        }
      }
      this.eat(TokenType.RPAREN);
      return { type: 'FunctionCall', name, args };
    } else if (token.type === TokenType.CELL_REF) {
      // Chuẩn hóa thành Sheet!A1
      let ref1 = token.value;
      if (!ref1.includes('!')) ref1 = `${this.currentSheet}!${ref1}`;

      this.eat(TokenType.CELL_REF);
      if (this.currentToken.type === TokenType.COLON) {
        this.eat(TokenType.COLON);
        let ref2 = this.currentToken.value;
        const sheetFromRef1 = ref1.split('!')[0];
        if (!ref2.includes('!')) ref2 = `${sheetFromRef1}!${ref2}`;
        this.eat(TokenType.CELL_REF);
        
        this.refs.add(ref1);
        this.refs.add(ref2);
        return { type: 'RangeRef', start: ref1, end: ref2 };
      }
      this.refs.add(ref1);
      return { type: 'CellRef', ref: ref1 };
    }
    throw new Error(`Unexpected token: ${token.value}`);
  }
}

function tokenize(input: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  while (i < input.length) {
    let char = input[i];
    if (/\s/.test(char)) {
      i++;
      continue;
    }
    if (/[0-9]/.test(char) || char === '.') {
      let num = '';
      while (i < input.length && /[0-9.]/.test(input[i])) {
        num += input[i];
        i++;
      }
      tokens.push({ type: TokenType.NUMBER, value: num });
      continue;
    }
    if (/[a-zA-Z\$]/.test(char)) {
      let ident = '';
      while (i < input.length && /[a-zA-Z0-9_!\$]/.test(input[i])) {
        ident += input[i];
        i++;
      }
      ident = ident.toUpperCase();
      const cleanIdent = ident.replace(/\$/g, '');
      // Check if it's a cell ref (e.g., A1 or Sheet1!A1)
      if (/^([A-Z0-9_]+!)?[A-Z]+[0-9]+$/.test(cleanIdent)) {
        tokens.push({ type: TokenType.CELL_REF, value: cleanIdent });
      } else {
        tokens.push({ type: TokenType.FUNC_NAME, value: cleanIdent });
      }
      continue;
    }
    if (char === '"' || char === "'") {
      const quote = char;
      let str = '';
      i++;
      while (i < input.length && input[i] !== quote) {
        str += input[i];
        i++;
      }
      if (i < input.length) i++; // Bỏ qua dấu quote đóng
      tokens.push({ type: TokenType.STRING, value: str });
      continue;
    }
    
    if (char === '>' || char === '<') {
      if (i + 1 < input.length && input[i+1] === '=') {
        tokens.push({ type: TokenType.OP, value: char + '=' });
        i += 2;
        continue;
      }
      if (char === '<' && i + 1 < input.length && input[i+1] === '>') {
        tokens.push({ type: TokenType.OP, value: '<>' });
        i += 2;
        continue;
      }
    }
    
    if (['+', '-', '*', '/', '(', ')', ',', ':', '=', '>', '<', '&'].includes(char)) {
      let type = TokenType.OP;
      if (char === '(') type = TokenType.LPAREN;
      else if (char === ')') type = TokenType.RPAREN;
      else if (char === ',') type = TokenType.COMMA;
      else if (char === ':') type = TokenType.COLON;
      
      tokens.push({ type, value: char });
      i++;
      continue;
    }
    i++;
  }
  tokens.push({ type: TokenType.EOF, value: '' });
  return tokens;
}

export class SpreadsheetEngine {
  public cells: Map<string, CellData> = new Map();
  public dependencies: Map<string, Set<string>> = new Map();
  public sheets: string[] = ['Sheet1'];
  public widgets: Widget[] = []; // Chứa danh sách Soft Layout Widgets

  constructor() {}

  // --- Widget API ---
  public addWidget(widget: Widget) {
    this.widgets.push(widget);
  }

  public updateWidget(id: string, updates: Partial<Widget>) {
    const idx = this.widgets.findIndex(w => w.id === id);
    if (idx !== -1) {
      this.widgets[idx] = { ...this.widgets[idx], ...updates };
    }
  }

  public removeWidget(id: string) {
    this.widgets = this.widgets.filter(w => w.id !== id);
  }

  // id luôn có dạng SheetID!CellID
  public setCell(id: string, input: string) {
    const existing = this.cells.get(id) || { type: 'empty', value: '' };

    // --- AUTO-CORRECT FOR BEGINNERS ---
    let processInput = input.trim();
    // 1. Quên dấu bằng khi gõ hàm
    if (/^(tong|sum|trungbinh|average|dem|count|lonnhat|max|nhonhat|min)\s*\(/i.test(processInput)) {
      processInput = '=' + processInput;
    }
    // 2. Gõ phép tính trực tiếp "10 + 20"
    else if (/^\d+(\.\d+)?\s*[\+\-\*\/]\s*\d+/.test(processInput) && !processInput.includes('=')) {
      // Ngoại trừ trường hợp nó là ngày tháng DD/MM/YYYY
      if (!/^\d{1,2}\/\d{1,2}\/\d{2,4}$/.test(processInput)) {
        processInput = '=' + processInput;
      }
    }

    if (processInput.startsWith('=')) {
      this.cells.set(id, { ...existing, value: null, formula: processInput, type: 'empty' });
      this.evaluateCell(id);
      this.triggerUpdates(id);
    } else {
      let val: any = input;
      let type: CellType = 'string';
      
      // Nhận diện Ngày tháng kiểu Việt Nam (DD/MM/YYYY)
      if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(input.trim())) {
        val = input.trim();
        type = 'string'; // Sẽ ép kiểu lúc tính toán
      } else if (!isNaN(Number(input)) && input.trim() !== '') {
        val = Number(input);
        type = 'number';
      } else if (input.toLowerCase() === 'true' || input.toLowerCase() === 'false') {
        val = input.toLowerCase() === 'true';
        type = 'boolean';
      }
      this.cells.set(id, { ...existing, value: val, formula: undefined, type, displayValue: input });
      this.clearDependenciesFor(id);
      this.triggerUpdates(id);
    }
  }

  public setCellFormat(id: string, formatUpdates: Partial<CellFormat>) {
    const cell = this.cells.get(id);
    if (cell) {
      cell.format = { ...(cell.format || {}), ...formatUpdates };
    } else {
      this.cells.set(id, { value: '', type: 'empty', displayValue: '', format: formatUpdates });
    }
  }

  public evaluateCell(id: string) {
    console.log(`evaluating ${id}`);
    const cell = this.cells.get(id);
    if (!cell || !cell.formula) return;

    const sheetName = id.split('!')[0];

    try {
      const formulaStr = cell.formula.substring(1); 
      const tokens = tokenize(formulaStr);
      const parser = new Parser(tokens, sheetName);
      const { ast, refs } = parser.parse();
      
      const result = this.evalAst(ast);
      // Giữ định dạng ngày nếu kết quả là Epoch Day
      const isDateResult = typeof result === 'number' && result > 10000 && result < 100000;
      
      cell.value = result;
      cell.displayValue = isDateResult ? this.formatIfDate(result) : (typeof result === 'number' ? Number(result.toFixed(5)).toString() : String(result));
      cell.type = typeof result === 'number' ? 'number' : 'string';
      
      this.updateDependencies(id, refs);
    } catch (e) {
      console.error(e);
      cell.value = '#ERROR!';
      cell.displayValue = '#ERROR!';
      cell.type = 'error';
    }
  }

  // --- FORGIVING DATA TYPES (Ép kiểu) ---
  private coerceToNumber(val: any): number | string {
    if (typeof val === 'number') return val;
    if (typeof val === 'string') {
      // Check ngày tháng DD/MM/YYYY
      const dateMatch = val.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
      if (dateMatch) {
         // Trả về Timestamp để tính toán (+ số ngày)
         // Mặc định timestamp là số mili-giây, ta đổi thành số NGÀY (Epoch Day)
         const d = new Date(parseInt(dateMatch[3]), parseInt(dateMatch[2]) - 1, parseInt(dateMatch[1]));
         return d.getTime() / 86400000;
      }
      
      // Bóc tách số ("10 kg" -> 10)
      const numMatch = val.match(/-?\d+(\.\d+)?/);
      if (numMatch) return Number(numMatch[0]);
    }
    return 0; // Trả về 0 để an toàn, không văng lỗi #VALUE!
  }

  private formatIfDate(val: any): string {
    // Nếu kết quả phép tính lớn (ví dụ > 10000 days epoch), format lại ra ngày tháng nếu hợp lý
    // Để an toàn, chỉ format nếu ta chắc nó bắt nguồn từ ngày (hiện tại đơn giản hóa: xuất nguyên số hoặc string)
    // Tạm thời nếu người dùng làm A1(Date) + 5, kết quả là 1 số Epoch Day. Ta format ngược:
    if (typeof val === 'number' && val > 10000 && val < 100000) { // Khoảng epoch day của năm 1997 đến 2243
       const d = new Date(val * 86400000);
       return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth()+1).toString().padStart(2, '0')}/${d.getFullYear()}`;
    }
    return typeof val === 'number' ? Number(val.toFixed(5)).toString() : String(val);
  }

  private evalAst(node: any, evalPath: Set<string> = new Set()): any {
    if (node.type === 'Literal') return node.value;
    if (node.type === 'CellRef') {
      if (evalPath.has(node.ref)) throw new Error('#REF! Vòng lặp');
      evalPath.add(node.ref);
      const val = this.cells.get(node.ref)?.value;
      return val === undefined ? '' : val;
    }
    if (node.type === 'RangeRef') {
      const refs = this.getRangeRefs(node.start, node.end);
      return refs.map(ref => {
        if (evalPath.has(ref)) throw new Error('#REF! Vòng lặp');
        evalPath.add(ref);
        const val = this.cells.get(ref)?.value;
        return val === undefined ? '' : val;
      });
    }
    if (node.type === 'UnaryOp') {
      if (node.op === '-') return -this.evalAst(node.expr, new Set(evalPath));
    }
    if (node.type === 'BinaryOp') {
      const leftRaw = this.evalAst(node.left, new Set(evalPath));
      const rightRaw = this.evalAst(node.right, new Set(evalPath));
      
      // Logic & String Ops don't need strict coercion
      if (node.op === '&') return String(leftRaw) + String(rightRaw);
      if (node.op === '=') return String(leftRaw).toLowerCase() === String(rightRaw).toLowerCase() || leftRaw === rightRaw;
      if (node.op === '<>') return String(leftRaw).toLowerCase() !== String(rightRaw).toLowerCase() && leftRaw !== rightRaw;
      if (node.op === '>') return this.coerceToNumber(leftRaw) > this.coerceToNumber(rightRaw);
      if (node.op === '<') return this.coerceToNumber(leftRaw) < this.coerceToNumber(rightRaw);
      if (node.op === '>=') return this.coerceToNumber(leftRaw) >= this.coerceToNumber(rightRaw);
      if (node.op === '<=') return this.coerceToNumber(leftRaw) <= this.coerceToNumber(rightRaw);

      const left = this.coerceToNumber(leftRaw) as number;
      const right = this.coerceToNumber(rightRaw) as number;
      if (node.op === '+') return left + right;
      if (node.op === '-') return left - right;
      if (node.op === '*') return left * right;
      if (node.op === '/') return left / right;
    }
    if (node.type === 'FunctionCall') {
      const args = node.args; // Don't eval yet for VLOOKUP & IF
      
      switch (node.name) {
        case 'IF': 
          return this.evalAst(args[0], new Set(evalPath)) ? this.evalAst(args[1], new Set(evalPath)) : this.evalAst(args[2], new Set(evalPath));
        case 'AND': 
          return args.every((a:any) => !!this.evalAst(a, new Set(evalPath)));
        case 'OR': 
          return args.some((a:any) => !!this.evalAst(a, new Set(evalPath)));
        case 'CONCATENATE': 
          return args.map((a:any) => this.evalAst(a, new Set(evalPath))).flat(Infinity).join('');
        case 'LEFT': 
          return String(this.evalAst(args[0], new Set(evalPath))).substring(0, this.coerceToNumber(this.evalAst(args[1], new Set(evalPath))) as number);
        case 'RIGHT': {
           const str = String(this.evalAst(args[0], new Set(evalPath)));
           const len = this.coerceToNumber(this.evalAst(args[1], new Set(evalPath))) as number;
           return str.substring(str.length - len);
        }
        case 'VLOOKUP': {
           const searchKey = this.evalAst(args[0], new Set(evalPath));
           const rangeNode = args[1];
           const colIndex = this.coerceToNumber(this.evalAst(args[2], new Set(evalPath))) as number;
           
           if (rangeNode.type !== 'RangeRef') return '#N/A';
           const matchStart = rangeNode.start.match(/([A-Z]+)([0-9]+)/);
           const matchEnd = rangeNode.end.match(/([A-Z]+)([0-9]+)/);
           if (!matchStart || !matchEnd) return '#N/A';
           
           const startCol = this.colToIndex(matchStart[1]);
           const endCol = this.colToIndex(matchEnd[1]);
           const startRow = parseInt(matchStart[2]);
           const endRow = parseInt(matchEnd[2]);
           
           for (let r = startRow; r <= endRow; r++) {
               const checkRef = `${rangeNode.start.split('!')[0] || this.sheets[0]}!${this.indexToCol(startCol)}${r}`;
               const checkVal = this.cells.get(checkRef)?.value;
               if (checkVal == searchKey || String(checkVal).toLowerCase() == String(searchKey).toLowerCase()) {
                   const targetRef = `${rangeNode.start.split('!')[0] || this.sheets[0]}!${this.indexToCol(startCol + colIndex - 1)}${r}`;
                   return this.cells.get(targetRef)?.value || '';
               }
           }
           return '#N/A';
        }
        case 'HLOOKUP': {
           const searchKey = this.evalAst(args[0], new Set(evalPath));
           const rangeNode = args[1];
           const rowIndex = this.coerceToNumber(this.evalAst(args[2], new Set(evalPath))) as number;
           
           if (rangeNode.type !== 'RangeRef') return '#N/A';
           const matchStart = rangeNode.start.match(/([A-Z]+)([0-9]+)/);
           const matchEnd = rangeNode.end.match(/([A-Z]+)([0-9]+)/);
           if (!matchStart || !matchEnd) return '#N/A';
           
           const startCol = this.colToIndex(matchStart[1]);
           const endCol = this.colToIndex(matchEnd[1]);
           const startRow = parseInt(matchStart[2]);
           const endRow = parseInt(matchEnd[2]);
           
           for (let c = startCol; c <= endCol; c++) {
               const checkRef = `${rangeNode.start.split('!')[0] || this.sheets[0]}!${this.indexToCol(c)}${startRow}`;
               const checkVal = this.cells.get(checkRef)?.value;
               if (checkVal == searchKey || String(checkVal).toLowerCase() == String(searchKey).toLowerCase()) {
                   const targetRef = `${rangeNode.start.split('!')[0] || this.sheets[0]}!${this.indexToCol(c)}${startRow + rowIndex - 1}`;
                   return this.cells.get(targetRef)?.value || '';
               }
           }
           return '#N/A';
        }
        case 'SUM': 
        case 'AVERAGE': 
        case 'COUNT': 
        case 'MAX': 
        case 'MIN': {
           const flatArgs = args.map((a: any) => this.evalAst(a, new Set(evalPath))).flat(Infinity);
           if (node.name === 'SUM') return flatArgs.reduce((acc: number, val: number) => acc + (this.coerceToNumber(val) as number), 0);
           if (node.name === 'AVERAGE') return flatArgs.length ? flatArgs.reduce((a: number, b: number) => a + (this.coerceToNumber(b) as number), 0) / flatArgs.length : 0;
           if (node.name === 'COUNT') return flatArgs.filter((a: any) => typeof a === 'number' || (typeof a === 'string' && (/-?\d+(\.\d+)?/.test(a) || /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.test(a)))).length;
           if (node.name === 'MAX') return Math.max(...flatArgs.map((a:any) => this.coerceToNumber(a) as number));
           if (node.name === 'MIN') return Math.min(...flatArgs.map((a:any) => this.coerceToNumber(a) as number));
        }
        default: throw new Error(`Unknown function ${node.name}`);
      }
    }
    return 0;
  }

  private getRangeRefs(start: string, end: string): string[] {
    const s1 = start.split('!');
    const s2 = end.split('!');
    const sheet1 = s1.length > 1 ? s1[0] : 'Sheet1';
    const c1 = s1.length > 1 ? s1[1] : s1[0];
    const sheet2 = s2.length > 1 ? s2[0] : 'Sheet1';
    const c2 = s2.length > 1 ? s2[1] : s2[0];

    // Chỉ hỗ trợ range trên cùng 1 sheet hiện tại
    const sheet = sheet1; 

    const colStr1 = c1.match(/[A-Z]+/)?.[0] || 'A';
    const rowStr1 = c1.match(/[0-9]+/)?.[0] || '1';
    const colStr2 = c2.match(/[A-Z]+/)?.[0] || 'A';
    const rowStr2 = c2.match(/[0-9]+/)?.[0] || '1';

    const col1 = this.colToIndex(colStr1);
    const row1 = parseInt(rowStr1);
    const col2 = this.colToIndex(colStr2);
    const row2 = parseInt(rowStr2);

    const refs = [];
    for (let c = Math.min(col1, col2); c <= Math.max(col1, col2); c++) {
      for (let r = Math.min(row1, row2); r <= Math.max(row1, row2); r++) {
        refs.push(`${sheet}!${this.indexToCol(c)}${r}`);
      }
    }
    return refs;
  }

  private colToIndex(col: string): number {
    let result = 0;
    for (let i = 0; i < col.length; i++) {
      result *= 26;
      result += col.charCodeAt(i) - 64;
    }
    return result - 1;
  }

  private indexToCol(index: number): string {
    let colName = '';
    let curr = index;
    while (curr >= 0) {
      colName = String.fromCharCode((curr % 26) + 65) + colName;
      curr = Math.floor(curr / 26) - 1;
    }
    return colName;
  }

  private clearDependenciesFor(id: string) {
    this.dependencies.forEach((dependents) => dependents.delete(id));
  }

  private updateDependencies(id: string, newRefs: string[]) {
    this.clearDependenciesFor(id);
    newRefs.forEach(ref => {
      if (!this.dependencies.has(ref)) this.dependencies.set(ref, new Set());
      this.dependencies.get(ref)!.add(id);
    });
  }

  private triggerUpdates(changedId: string, visited: Set<string> = new Set()) {
    console.log(`triggerUpdates ${changedId}, visited:`, Array.from(visited));
    if (visited.has(changedId)) {
      console.log(`cycle detected for ${changedId}`);
      const cell = this.cells.get(changedId);
      if (cell) {
        cell.value = '#ERROR!';
        cell.displayValue = '#REF! Vòng lặp';
        cell.type = 'error';
      }
      return;
    }
    visited.add(changedId);
    const dependents = this.dependencies.get(changedId);
    if (dependents) {
      Array.from(dependents).forEach(dep => {
        this.evaluateCell(dep);
        this.triggerUpdates(dep, new Set(visited));
      });
    }
  }

  // --- Advanced Operations (Sorting & Reference Shifting) ---
  public sortRange(sheet: string, rangeRefs: string[], asc: boolean = true) {
    if (rangeRefs.length < 2) return;
    
    // Determine bounding box
    let minRow = Infinity, maxRow = -Infinity;
    let minCol = Infinity, maxCol = -Infinity;
    rangeRefs.forEach(ref => {
      const match = ref.match(/!([A-Z]+)([0-9]+)/);
      if (!match) return;
      const cIdx = this.colToIndex(match[1]);
      const rIdx = parseInt(match[2]);
      if (rIdx < minRow) minRow = rIdx;
      if (rIdx > maxRow) maxRow = rIdx;
      if (cIdx < minCol) minCol = cIdx;
      if (cIdx > maxCol) maxCol = cIdx;
    });

    if (minRow === Infinity) return;

    // Group data by row
    const rows: { ref: string, val: any, formula?: string, format?: CellFormat, cIdx: number }[][] = [];
    for (let r = minRow; r <= maxRow; r++) {
      const rowData = [];
      for (let c = minCol; c <= maxCol; c++) {
        const ref = `${sheet}!${this.indexToCol(c)}${r}`;
        const cell = this.cells.get(ref);
        // We preserve formula to avoid data loss if sorting columns with pure formulas
        rowData.push({ ref, val: cell ? cell.value : '', formula: cell?.formula, format: cell?.format, cIdx: c });
      }
      rows.push(rowData);
    }

    // Sort rows based on the first selected column
    rows.sort((rowA, rowB) => {
      const valA = rowA[0].val;
      const valB = rowB[0].val;
      if (typeof valA === 'number' && typeof valB === 'number') {
        return asc ? valA - valB : valB - valA;
      }
      const strA = String(valA).toLowerCase();
      const strB = String(valB).toLowerCase();
      if (strA < strB) return asc ? -1 : 1;
      if (strA > strB) return asc ? 1 : -1;
      return 0;
    });

    // Write sorted rows back
    let currentR = minRow;
    for (const sortedRow of rows) {
      for (const item of sortedRow) {
        const targetRef = `${sheet}!${this.indexToCol(item.cIdx)}${currentR}`;
        if (item.formula) {
           this.setCell(targetRef, item.formula);
        } else {
           this.setCell(targetRef, String(item.val));
        }
        
        if (item.format) {
           this.setCellFormat(targetRef, item.format);
        } else {
           const targetCell = this.cells.get(targetRef);
           if (targetCell) targetCell.format = undefined;
        }
      }
      currentR++;
    }
  }

  private shiftFormula(formula: string, targetSheet: string, insertRowAt?: number, insertColAt?: number, delRowAt?: number, delColAt?: number): string {
    return formula.replace(/([A-Za-z0-9_]+!)?(\$?)([A-Z]+)(\$?)([0-9]+)/g, (match, p1, p2, p3, p4, p5) => {
      const sheetName = p1 ? p1.slice(0, -1) : 'Sheet1';
      if (sheetName !== targetSheet) return match;

      let cIdx = this.colToIndex(p3);
      let rIdx = parseInt(p5);

      if (insertRowAt !== undefined && rIdx >= insertRowAt) rIdx++;
      if (insertColAt !== undefined && cIdx >= insertColAt) cIdx++;
      
      if (delRowAt !== undefined) {
         if (rIdx === delRowAt) return '#REF!';
         if (rIdx > delRowAt) rIdx--;
      }
      if (delColAt !== undefined) {
         if (cIdx === delColAt) return '#REF!';
         if (cIdx > delColAt) cIdx--;
      }

      return `${p1 || ''}${p2 || ''}${this.indexToCol(cIdx)}${p4 || ''}${rIdx}`;
    });
  }

  public shiftStructure(sheet: string, type: 'insertRow' | 'deleteRow' | 'insertCol' | 'deleteCol', index: number) {
    const newCells: Map<string, CellData> = new Map();
    const cellsToReevaluate: string[] = [];

    // 1. Shift cells map
    this.cells.forEach((cell, id) => {
      const match = id.match(/^([A-Za-z0-9_]+)!([A-Z]+)([0-9]+)$/);
      if (!match) {
        newCells.set(id, cell);
        return;
      }
      const [_, sName, cStr, rStr] = match;
      
      if (sName !== sheet) {
         // Re-parse formula if it references the shifted sheet
         if (cell.formula) {
            cell.formula = this.shiftFormula(cell.formula, sheet, 
               type === 'insertRow' ? index : undefined,
               type === 'insertCol' ? index : undefined,
               type === 'deleteRow' ? index : undefined,
               type === 'deleteCol' ? index : undefined
            );
            cellsToReevaluate.push(id);
         }
         newCells.set(id, cell);
         return;
      }

      let cIdx = this.colToIndex(cStr);
      let rIdx = parseInt(rStr);

      if (type === 'deleteRow' && rIdx === index) return; // Delete
      if (type === 'deleteCol' && cIdx === index) return; // Delete

      if (type === 'insertRow' && rIdx >= index) rIdx++;
      if (type === 'insertCol' && cIdx >= index) cIdx++;
      if (type === 'deleteRow' && rIdx > index) rIdx--;
      if (type === 'deleteCol' && cIdx > index) cIdx--;

      const newId = `${sName}!${this.indexToCol(cIdx)}${rIdx}`;
      
      if (cell.formula) {
        cell.formula = this.shiftFormula(cell.formula, sheet, 
           type === 'insertRow' ? index : undefined,
           type === 'insertCol' ? index : undefined,
           type === 'deleteRow' ? index : undefined,
           type === 'deleteCol' ? index : undefined
        );
        cellsToReevaluate.push(newId);
      }
      newCells.set(newId, cell);
    });

    this.cells = newCells;
    cellsToReevaluate.forEach(id => this.evaluateCell(id));
  }

  // --- Persistence (Auto-Save) ---
  public saveToStorage() {
    if (typeof window === 'undefined') return;
    try {
      const cellsObj: any = {};
      this.cells.forEach((value, key) => {
         cellsObj[key] = value;
      });
      const data = {
        sheets: this.sheets,
        widgets: this.widgets,
        cells: cellsObj
      };
      localStorage.setItem('linhhuong_spreadsheet_data', JSON.stringify(data));
    } catch (e) {
      console.warn("Lỗi lưu dữ liệu tự động:", e);
    }
  }

  public loadFromStorage(): boolean {
    if (typeof window === 'undefined') return false;
    try {
      const json = localStorage.getItem('linhhuong_spreadsheet_data');
      if (!json) return false;
      const data = JSON.parse(json);
      
      if (data.sheets && Array.isArray(data.sheets)) {
         this.sheets = data.sheets;
      }
      if (data.widgets && Array.isArray(data.widgets)) {
         this.widgets = data.widgets;
      }
      if (data.cells) {
         this.cells.clear();
         for (const [key, val] of Object.entries(data.cells)) {
            this.cells.set(key, val as CellData);
         }
      }
      // Re-evaluate all cells to rebuild dependencies
      this.cells.forEach((_, id) => this.evaluateCell(id));
      return true;
    } catch (e) {
      console.warn("Lỗi tải dữ liệu tự động:", e);
      return false;
    }
  }
}

// Global expose for IDE Testing
if (typeof window !== 'undefined') {
  (window as any).__SPREADSHEET_ENGINE__ = null; // Will be bound in Svelte component
}
