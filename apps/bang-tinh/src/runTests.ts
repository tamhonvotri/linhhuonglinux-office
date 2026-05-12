import { SpreadsheetEngine } from './lib/engine.js';

function runTests() {
  console.log("=== LINH HƯƠNG LINUX PS4 TEST SUITE ===");
  const engine = new SpreadsheetEngine();
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, actual?: any, expected?: any) {
    if (condition) {
      passed++;
      console.log(`✅ PASS: ${testName}`);
    } else {
      failed++;
      console.error(`❌ FAIL: ${testName}`);
      if (actual !== undefined && expected !== undefined) {
        console.error(`   Expected: ${expected}`);
        console.error(`   Actual:   ${actual}`);
      }
    }
  }

  try {
    // TÌNH HUỐNG 1: TÍNH TOÁN CƠ BẢN
    engine.setCell('Sheet1!A1', '10');
    engine.setCell('Sheet1!A2', '20');
    engine.setCell('Sheet1!A3', '=A1+A2');
    assert(engine.cells.get('Sheet1!A3')?.value === 30, "Tính tổng cơ bản A1+A2");

    engine.setCell('Sheet1!B1', '=10*5');
    assert(engine.cells.get('Sheet1!B1')?.value === 50, "Tính nhân trực tiếp 10*5");

    engine.setCell('Sheet1!B2', '=50/2');
    assert(engine.cells.get('Sheet1!B2')?.value === 25, "Tính chia trực tiếp 50/2");

    engine.setCell('Sheet1!B3', '=B1-B2');
    assert(engine.cells.get('Sheet1!B3')?.value === 25, "Tính trừ tham chiếu B1-B2");

    // TÌNH HUỐNG 2: FORGIVING TYPES (Ép kiểu thông minh)
    engine.setCell('Sheet1!C1', '10 kg');
    engine.setCell('Sheet1!C2', '5 kg');
    engine.setCell('Sheet1!C3', '=C1+C2');
    assert(engine.cells.get('Sheet1!C3')?.value === 15, "Cộng chuỗi chứa số (10 kg + 5 kg)");

    engine.setCell('Sheet1!D1', 'rác');
    engine.setCell('Sheet1!D2', '10');
    engine.setCell('Sheet1!D3', '=D1*D2');
    assert(engine.cells.get('Sheet1!D3')?.value === 0, "Nhân chuỗi rác với số trả về 0 (không lỗi #VALUE!)");

    // TÌNH HUỐNG 3: AUTO-CORRECT CÚ PHÁP
    engine.setCell('Sheet1!E1', 'sum(A1:A2)');
    assert(engine.cells.get('Sheet1!E1')?.value === 30, "Tự động thêm dấu = cho hàm SUM");

    engine.setCell('Sheet1!E2', '10+20');
    assert(engine.cells.get('Sheet1!E2')?.value === 30, "Tự động thêm dấu = cho biểu thức tính toán");

    // TÌNH HUỐNG 4: HÀM TIẾNG VIỆT (VI_FN_ALIASES)
    engine.setCell('Sheet1!F1', '=TONG(A1:A2)');
    assert(engine.cells.get('Sheet1!F1')?.value === 30, "Hàm TONG (SUM)");

    engine.setCell('Sheet1!F2', '=TRUNGBINH(A1:A2)');
    assert(engine.cells.get('Sheet1!F2')?.value === 15, "Hàm TRUNGBINH (AVERAGE)");

    engine.setCell('Sheet1!F3', '=LONNHAT(A1:A2)');
    assert(engine.cells.get('Sheet1!F3')?.value === 20, "Hàm LONNHAT (MAX)");

    engine.setCell('Sheet1!F4', '=NHONHAT(A1:A2)');
    assert(engine.cells.get('Sheet1!F4')?.value === 10, "Hàm NHONHAT (MIN)");

    engine.setCell('Sheet1!F5', '=DEM(A1:C2)');
    assert(engine.cells.get('Sheet1!F5')?.value === 6, "Hàm DEM (COUNT) đếm số", engine.cells.get('Sheet1!F5')?.value, 6);

    // TÌNH HUỐNG 5: HÀM LOGIC (NEU, VA, HOAC)
    engine.setCell('Sheet1!G1', '=NEU(A1>5, 100, 200)');
    assert(engine.cells.get('Sheet1!G1')?.value === 100, "Hàm NEU (IF) nhánh đúng");

    engine.setCell('Sheet1!G2', '=NEU(A1>20, 100, 200)');
    assert(engine.cells.get('Sheet1!G2')?.value === 200, "Hàm NEU (IF) nhánh sai");

    engine.setCell('Sheet1!G3', '=VA(A1>5, A2>10)');
    assert(engine.cells.get('Sheet1!G3')?.value === true, "Hàm VA (AND) trả về true");

    engine.setCell('Sheet1!G4', '=HOAC(A1>20, A2>10)');
    assert(engine.cells.get('Sheet1!G4')?.value === true, "Hàm HOAC (OR) trả về true");

    // TÌNH HUỐNG 6: CHUỖI VÀ HÀM CHUỖI
    engine.setCell('Sheet1!H1', 'Linh');
    engine.setCell('Sheet1!H2', 'Hương');
    engine.setCell('Sheet1!H3', '=H1&" "&H2');
    assert(engine.cells.get('Sheet1!H3')?.value === "Linh Hương", "Nối chuỗi bằng toán tử &", engine.cells.get('Sheet1!H3')?.value, "Linh Hương");

    engine.setCell('Sheet1!H4', '=NOICHUOI(H1, " ", H2)');
    assert(engine.cells.get('Sheet1!H4')?.value === "Linh Hương", "Hàm NOICHUOI (CONCATENATE)", engine.cells.get('Sheet1!H4')?.value, "Linh Hương");

    engine.setCell('Sheet1!H5', '=TRAI(H1, 2)');
    assert(engine.cells.get('Sheet1!H5')?.value === "Li", "Hàm TRAI (LEFT)", engine.cells.get('Sheet1!H5')?.value, "Li");

    engine.setCell('Sheet1!H6', '=PHAI(H1, 2)');
    assert(engine.cells.get('Sheet1!H6')?.value === "nh", "Hàm PHAI (RIGHT)", engine.cells.get('Sheet1!H6')?.value, "nh");

    // TÌNH HUỐNG 7: VLOOKUP (TIMKIEMDOC)
    engine.setCell('Sheet1!I1', 'ID1'); engine.setCell('Sheet1!J1', 'Apple');
    engine.setCell('Sheet1!I2', 'ID2'); engine.setCell('Sheet1!J2', 'Banana');
    engine.setCell('Sheet1!I3', 'ID3'); engine.setCell('Sheet1!J3', 'Cherry');
    
    engine.setCell('Sheet1!K1', '=TIMKIEMDOC("ID2", I1:J3, 2)');
    assert(engine.cells.get('Sheet1!K1')?.value === "Banana", "Hàm TIMKIEMDOC (VLOOKUP) cơ bản", engine.cells.get('Sheet1!K1')?.value, "Banana");

    engine.setCell('Sheet1!K2', '=TIMKIEMDOC("ID4", I1:J3, 2)');
    assert(engine.cells.get('Sheet1!K2')?.value === "#N/A", "Hàm TIMKIEMDOC (VLOOKUP) không thấy");

    // TÌNH HUỐNG 8: XỬ LÝ NGÀY THÁNG CƠ BẢN
    engine.setCell('Sheet1!L1', '15/05/2026');
    engine.setCell('Sheet1!L2', '=L1+5');
    // Khi cộng 5 ngày, kết quả là 20/05/2026. Epoch của L1: (new Date(2026, 4, 15)).getTime()/86400000 = 20588
    // L2 sẽ có giá trị số là 20593, displayValue formatIfDate sẽ là '20/05/2026'
    assert(engine.cells.get('Sheet1!L2')?.displayValue === '20/05/2026', "Cộng ngày tháng thông minh", engine.cells.get('Sheet1!L2')?.displayValue, '20/05/2026');

    // TÌNH HUỐNG 9: VÒNG LẶP (CIRCULAR DEPENDENCY)
    engine.setCell('Sheet1!M1', '=M2');
    engine.setCell('Sheet1!M2', '=M1');
    assert(engine.cells.get('Sheet1!M2')?.value === "#ERROR!", "Xử lý vòng lặp Circular Dependency", engine.cells.get('Sheet1!M2')?.value, "#ERROR!");

    // TÌNH HUỐNG 10: TỐC ĐỘ (HIỆU NĂNG)
    const t0 = performance.now();
    for (let r = 1; r <= 1000; r++) {
      engine.setCell(`Sheet2!A${r}`, r.toString());
      engine.setCell(`Sheet2!B${r}`, `=A${r}*2`);
    }
    const t1 = performance.now();
    assert(t1 - t0 < 500, `Hiệu năng tính toán 1000 ô AST (${(t1-t0).toFixed(2)}ms)`, t1-t0, "< 500");
    assert(engine.cells.get('Sheet2!B1000')?.value === 2000, "Xác minh giá trị hiệu năng");

    // TÌNH HUỐNG 11: ĐỊNH DẠNG Ô (FORMATTING)
    engine.setCell('Sheet1!Z1', 'Formatted Text');
    engine.setCellFormat('Sheet1!Z1', { bold: true, align: 'center', fontFamily: 'Inter', fontSize: 16 });
    const fmt = engine.cells.get('Sheet1!Z1')?.format;
    assert(fmt?.bold === true && fmt?.align === 'center' && fmt?.fontFamily === 'Inter' && fmt?.fontSize === 16, "Cập nhật định dạng ô (Format) thành công");

    // TÌNH HUỐNG 12: DỊCH CHUYỂN TỌA ĐỘ VÀ SẮP XẾP
    engine.setCell('Sheet1!A10', '10');
    engine.setCell('Sheet1!B10', '=A10+5'); // B10 -> 15
    engine.shiftStructure('Sheet1', 'insertRow', 5);
    // Sau khi chèn hàng 5, A10 thành A11, B10 thành B11, công thức ở B11 phải là =A11+5
    assert(engine.cells.get('Sheet1!B11')?.formula === '=A11+5', "Dịch chuyển công thức khi chèn hàng", engine.cells.get('Sheet1!B11')?.formula, "=A11+5");
    assert(engine.cells.get('Sheet1!B11')?.value === 15, "Giữ nguyên kết quả sau khi dịch chuyển", engine.cells.get('Sheet1!B11')?.value, 15);

  } catch (e: any) {
    console.error("Test Suite Crashed:", e);
  }

  console.log("-----------------------------------------");
  console.log(`TOTAL: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
  if (failed === 0) {
    console.log("🎉 ALL TESTS PASSED!");
  } else {
    process.exit(1);
  }
}

runTests();
