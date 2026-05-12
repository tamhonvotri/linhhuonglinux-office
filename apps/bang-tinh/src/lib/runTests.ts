import { SpreadsheetEngine } from './engine';

const engine = new SpreadsheetEngine();
let passed = 0;
let failed = 0;

function assert(condition: boolean, msg: string) {
    if (condition) {
        passed++;
    } else {
        console.error(`[FAIL] ${msg}`);
        failed++;
    }
}

console.log("=== BẮT ĐẦU CHẠY AUTO-TEST PS4 ===");

// 1. Basic Math
engine.setCell('Sheet1!A1', '=10+20*2');
assert(engine.cells.get('Sheet1!A1')?.value === 50, "Math Priority 10+20*2 = 50");

engine.setCell('Sheet1!A2', '=(10+20)*2');
assert(engine.cells.get('Sheet1!A2')?.value === 60, "Math Priority (10+20)*2 = 60");

// 2. Logic Operators
engine.setCell('Sheet1!B1', '=10>5');
assert(engine.cells.get('Sheet1!B1')?.value === true, "Logic 10 > 5 is True");

engine.setCell('Sheet1!B2', '=5>=5');
assert(engine.cells.get('Sheet1!B2')?.value === true, "Logic 5 >= 5 is True");

engine.setCell('Sheet1!B3', '=10=10');
assert(engine.cells.get('Sheet1!B3')?.value === true, "Logic 10 = 10 is True");

// 3. String Operators
engine.setCell('Sheet1!C1', '="Hello"&" World"');
assert(engine.cells.get('Sheet1!C1')?.value === "Hello World", "String Concat &");

// 4. Function IF
engine.setCell('Sheet1!D1', '=NEU(10>5; "Lớn"; "Nhỏ")');
assert(engine.cells.get('Sheet1!D1')?.value === "Lớn", "Function NEU (IF) True branch");

engine.setCell('Sheet1!D2', '=IF(3>5; "Lớn"; "Nhỏ")');
assert(engine.cells.get('Sheet1!D2')?.value === "Nhỏ", "Function IF False branch");

// 5. Function AND / OR
engine.setCell('Sheet1!E1', '=VA(10>5; 3<5)');
assert(engine.cells.get('Sheet1!E1')?.value === true, "Function VA (AND)");

engine.setCell('Sheet1!E2', '=OR(10<5; 3<5)');
assert(engine.cells.get('Sheet1!E2')?.value === true, "Function OR");

// 6. Function Text
engine.setCell('Sheet1!F1', '=TRAI("LinhHuong"; 4)');
assert(engine.cells.get('Sheet1!F1')?.value === "Linh", "Function TRAI (LEFT)");

engine.setCell('Sheet1!F2', '=RIGHT("LinhHuong"; 5)');
assert(engine.cells.get('Sheet1!F2')?.value === "Huong", "Function RIGHT");

// 7. Forgiving Types (Ép kiểu thông minh)
engine.setCell('Sheet1!G1', '10 kg');
engine.setCell('Sheet1!G2', '20 lit');
engine.setCell('Sheet1!G3', '=TONG(G1:G2)');
assert(engine.cells.get('Sheet1!G3')?.value === 30, "Forgiving Types: 10 kg + 20 lit = 30");

// 8. Circular Dependency Prevention (Tính toán vòng)
engine.setCell('Sheet1!H1', '=H2');
engine.setCell('Sheet1!H2', '=H1');
assert(engine.cells.get('Sheet1!H1')?.value === "#REF! Vòng lặp", "Circular Dependency handling");

// 9. VLOOKUP
engine.setCell('Sheet1!J1', 'Apple');
engine.setCell('Sheet1!K1', '100');
engine.setCell('Sheet1!J2', 'Banana');
engine.setCell('Sheet1!K2', '200');

engine.setCell('Sheet1!L1', '=VLOOKUP("Banana"; J1:K2; 2)');
assert(engine.cells.get('Sheet1!L1')?.value == 200, "VLOOKUP Exact Match");

console.log(`=== KẾT QUẢ: ${passed} PASSED | ${failed} FAILED ===`);
if (failed > 0) process.exit(1);
