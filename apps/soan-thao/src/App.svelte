<script lang="ts">
  import { onMount, tick } from 'svelte';
  import AIChatPanel from './lib/AIChatPanel.svelte';
  import type { ProfileType } from './lib/config/profiles';
  import { PROFILES, getProfileConfig } from './lib/config/profiles';
  import { BLOCK_ITEMS, BLOCK_TEMPLATES } from './lib/config/blocks';
  import { TEMPLATES, getTemplatesByProfile } from './lib/config/templates';
  import { open } from '@tauri-apps/plugin-shell';
  
  let currentProfile: ProfileType = 'administrative';
  $: activeProfileConfig = getProfileConfig(currentProfile);
  
  // Selection & Formatting state
  let isTextSelected = false;
  let menuX = 0;
  let menuY = 0;

  // Editor content state
  let editorContent = "";
  let wordCount = 0;
  let zoomLevel = 100;

  // Slash Command State
  let showSlashMenu = false;
  let slashMenuX = 0;
  let slashMenuY = 0;
  let slashFilter = "";
  let slashRange: Range | null = null;

  // Block Builder (Action Button) State
  let showPlusBtn = false;
  let plusBtnX = 0;
  let plusBtnY = 0;
  let showBlockMenu = false;
  let activeEmptyNode: HTMLElement | null = null;

  // Document ID for Multi-window isolation
  let documentId = "";

  // Auto-save State
  let saveStatus: 'saved' | 'saving' = 'saved';
  let autoSaveTimer: any;

  // Donate Function
  function openDonate() {
    open('https://ko-fi.com/tamhonvotri');
  }

  // Toolbar Scroll State
  let toolbarScrollContainer: HTMLElement;
  function scrollToolbar(direction: number) {
    if (toolbarScrollContainer) {
      toolbarScrollContainer.scrollBy({ left: direction * 250, behavior: 'smooth' });
    }
  }

  // Right Sidebar State
  let rightSidebarTab: 'templates' | 'ai' = 'templates';
  $: if (currentProfile !== 'administrative') rightSidebarTab = 'ai';

  // Outline State
  interface OutlineNode {
    id: string;
    text: string;
    type: 'heading' | 'article' | 'doctype' | 'chapter' | 'character' | 'plot';
    level: number;
  }

  interface NovelCharacter {
    id: string;
    name: string;
    aliases: string;
    description: string;
  }

  let novelCharacters: NovelCharacter[] = [];
  let showAddCharacterModal = false;
  let editingCharId: string | null = null;
  let newCharName = "";
  let newCharAliases = "";
  let newCharDesc = "";

  function saveCharacters() {
    localStorage.setItem(`characters_${documentId}`, JSON.stringify(novelCharacters));
  }

  function openAddCharacterModal() {
    editingCharId = null;
    newCharName = "";
    newCharAliases = "";
    newCharDesc = "";
    showAddCharacterModal = true;
  }

  function openEditCharacterModal(char: NovelCharacter) {
    editingCharId = char.id;
    newCharName = char.name;
    newCharAliases = char.aliases;
    newCharDesc = char.description;
    showAddCharacterModal = true;
  }

  function closeCharacterModal() {
    showAddCharacterModal = false;
    editingCharId = null;
    newCharName = "";
    newCharAliases = "";
    newCharDesc = "";
  }

  function addCharacter() {
    if (!newCharName.trim()) return;
    
    if (editingCharId) {
      novelCharacters = novelCharacters.map(c => 
        c.id === editingCharId 
          ? { ...c, name: newCharName.trim(), aliases: newCharAliases.trim(), description: newCharDesc.trim() } 
          : c
      );
    } else {
      novelCharacters = [...novelCharacters, {
        id: `char-${Date.now()}`,
        name: newCharName.trim(),
        aliases: newCharAliases.trim(),
        description: newCharDesc.trim()
      }];
    }
    
    saveCharacters();
    closeCharacterModal();
  }

  interface NovelEvent {
    id: string;
    text: string;
    timestamp: number;
  }
  let novelEvents: NovelEvent[] = [];
  
  function saveNovelEvents() {
    localStorage.setItem(`events_${documentId}`, JSON.stringify(novelEvents));
  }

  function addNovelEvent() {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0 && !selection.isCollapsed) {
      const text = selection.toString().trim();
      if (text) {
        novelEvents = [...novelEvents, {
          id: `event-${Date.now()}`,
          text: text,
          timestamp: Date.now()
        }];
        saveNovelEvents();
        alert("Đã lưu sự kiện vào Dòng thời gian bên trái!");
      }
    }
  }

  function deleteNovelEvent(id: string) {
    novelEvents = novelEvents.filter(e => e.id !== id);
    saveNovelEvents();
  }

  // --- Print & File Operations ---
  let fileInput: HTMLInputElement;
  let fileHandle: any = null; // Quản lý kết nối file theo chuẩn File System Access API

  function printDocument() {
    window.print();
  }

  function getDataBlob() {
    const editor = document.getElementById('main-editor');
    const data = {
      version: '1.0',
      profile: currentProfile,
      content: editor ? editor.innerHTML : '',
      novelCharacters: novelCharacters,
      novelEvents: novelEvents
    };
    return new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  }

  function downloadFallback() {
    const blob = getDataBlob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `LinhHuong_Document_${Date.now()}.lhof`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  async function saveToFile() {
    if ('showSaveFilePicker' in window) {
      if (!fileHandle) {
        return saveAsFile(); // Chưa từng mở/lưu file nào thì chuyển thành Save As
      }
      try {
        const writable = await fileHandle.createWritable();
        await writable.write(getDataBlob());
        await writable.close();
        triggerAutoSave();
        // Thông báo lưu nhanh thành công
        const t = document.createElement('div');
        t.className = "fixed bottom-10 right-10 bg-gray-800 text-white px-4 py-2 rounded shadow-lg z-50 text-sm";
        t.innerText = "✓ Đã lưu đè file";
        document.body.appendChild(t);
        setTimeout(() => document.body.removeChild(t), 2000);
      } catch (err) {
        console.error("Save failed", err);
      }
    } else {
      downloadFallback(); // Dự phòng cho trình duyệt không hỗ trợ
    }
  }

  async function saveAsFile() {
    if ('showSaveFilePicker' in window) {
      try {
        // Mở hộp thoại chọn nơi lưu
        const handle = await (window as any).showSaveFilePicker({
          suggestedName: `LinhHuong_Document_${Date.now()}.lhof`,
          types: [{
            description: 'Linh Hương Office Format',
            accept: { 'application/json': ['.lhof'] },
          }],
        });
        fileHandle = handle;
        const writable = await fileHandle.createWritable();
        await writable.write(getDataBlob());
        await writable.close();
        triggerAutoSave();
      } catch (err) {
        console.error("Save As failed", err);
      }
    } else {
      downloadFallback();
    }
  }

  function parseFileContent(content: string) {
    try {
      const data = JSON.parse(content);
      if (data.profile) {
          currentProfile = data.profile;
          activeProfileConfig = getProfileConfig(currentProfile);
      }
      if (data.content) {
          const editor = document.getElementById('main-editor');
          if (editor) editor.innerHTML = data.content;
      }
      if (data.novelCharacters) novelCharacters = data.novelCharacters;
      if (data.novelEvents) novelEvents = data.novelEvents;
      
      triggerAutoSave();
      extractOutline();
      alert("Đã tải tệp thành công!");
    } catch (err) {
      alert("Lỗi định dạng tệp. Vui lòng chọn tệp .lhof hợp lệ.");
    }
  }

  async function openFile() {
    if ('showOpenFilePicker' in window) {
      try {
        const [handle] = await (window as any).showOpenFilePicker({
          types: [{
            description: 'Linh Hương Office Format',
            accept: { 'application/json': ['.lhof'] },
          }],
        });
        fileHandle = handle;
        const file = await fileHandle.getFile();
        const content = await file.text();
        parseFileContent(content);
      } catch (err) {
        console.error("Open failed", err);
      }
    } else {
      triggerFileInput(); // Fallback dùng thẻ input
    }
  }

  function triggerFileInput() {
    if (fileInput) fileInput.click();
  }

  function loadFromFile(event: Event) {
    const target = event.target as HTMLInputElement;
    if (!target.files || target.files.length === 0) return;
    const file = target.files[0];
    const reader = new FileReader();
    reader.onload = (e) => {
      parseFileContent(e.target?.result as string);
    };
    reader.readAsText(file);
    target.value = ''; // reset
  }

  let documentOutline: OutlineNode[] = [];
  let outlineDebounceTimer: any;

  // AI Assistant State
  let aiStatus: 'idle' | 'loading' | 'error' | 'success' = 'idle';
  let aiErrorMsg = '';

  // AI Download & Init State (Polling)
  let aiInitStatus = 'idle'; // idle, downloading, loading, ready, error
  let aiDownloadPercent = 0;
  let aiDownloadedMB = 0;
  let aiTotalMB = 0;
  let showAiInitModal = false;
  let aiStatusTimer: any;

  // Agency Context State
  let showSettingsModal = false;
  type DocType = 'quyetDinh' | 'thongBao' | 'congVan' | 'toTrinh';
  
  let agencyContext = {
    coQuanChuQuan: "",
    tenCoQuan: "",
    diaDanh: "",
    quyenHanKy: "",
    chucVuNguoiKy: "",
    tenNguoiKy: "",
    nguoiSoanThao: "",
    // Counters & Symbols
    quyetDinhCount: 1,
    quyetDinhKyHieu: "QĐ-UBND",
    thongBaoCount: 1,
    thongBaoKyHieu: "TB-UBND",
    congVanCount: 1,
    congVanKyHieu: "UBND",
    toTrinhCount: 1,
    toTrinhKyHieu: "TTr-UBND"
  };

  // Compile Template (Auto-fill & Auto-increment Engine)
  function compileTemplate(html: string, docType?: DocType): string {
    let compiled = html;
    compiled = compiled.replace(/\[CƠ QUAN CHỦ QUẢN\]/g, agencyContext.coQuanChuQuan || "[CƠ QUAN CHỦ QUẢN]");
    compiled = compiled.replace(/\[TÊN CƠ QUAN BAN HÀNH\]/g, agencyContext.tenCoQuan || "[TÊN CƠ QUAN BAN HÀNH]");
    compiled = compiled.replace(/\[QUYỀN HẠN KÝ\]/g, agencyContext.quyenHanKy ? `<div style="font-size: 14pt; font-weight: bold; text-transform: uppercase;">${agencyContext.quyenHanKy}</div>` : "");
    compiled = compiled.replace(/\[CHỨC VỤ NGƯỜI KÝ\]/g, agencyContext.chucVuNguoiKy || "[CHỨC VỤ NGƯỜI KÝ]");
    compiled = compiled.replace(/\[Họ và tên\]/g, agencyContext.tenNguoiKy || "[Họ và tên]");
    compiled = compiled.replace(/\[Người soạn thảo\]/g, agencyContext.nguoiSoanThao || "[Người soạn thảo]");

    // Dynamic Date Injection
    const now = new Date();
    const dd = String(now.getDate()).padStart(2, '0');
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const yyyy = now.getFullYear();
    const dateString = `${agencyContext.diaDanh || "[Địa danh]"}, ngày ${dd} tháng ${mm} năm ${yyyy}`;
    
    compiled = compiled.replace(/\[Địa danh\], ngày \.\.\. tháng \.\.\. năm \.\.\./g, dateString);
    compiled = compiled.replace(/\[Địa danh\]/g, agencyContext.diaDanh || "[Địa danh]");

    // Auto-increment Number Logic
    if (docType) {
      let count = 1;
      let symbol = "";
      if (docType === 'quyetDinh') {
        count = agencyContext.quyetDinhCount;
        symbol = agencyContext.quyetDinhKyHieu;
        agencyContext.quyetDinhCount++;
      } else if (docType === 'thongBao') {
        count = agencyContext.thongBaoCount;
        symbol = agencyContext.thongBaoKyHieu;
        agencyContext.thongBaoCount++;
      } else if (docType === 'congVan') {
        count = agencyContext.congVanCount;
        symbol = agencyContext.congVanKyHieu;
        agencyContext.congVanCount++;
      } else if (docType === 'toTrinh') {
        count = agencyContext.toTrinhCount;
        symbol = agencyContext.toTrinhKyHieu;
        agencyContext.toTrinhCount++;
      }
      
      const countStr = String(count).padStart(2, '0');
      compiled = compiled.replace(/Số: \.\.\.\.\.\.\/\[KÝ HIỆU\]/g, `Số: ${countStr}/${symbol}`);
      
      // Save counter instantly
      saveAgencyContext(false);
    }

    // Fallback if not matching any specific document counter
    compiled = compiled.replace(/\[KÝ HIỆU\]/g, "...");

    return compiled;
  }

  function saveAgencyContext(closeModal = true) {
    localStorage.setItem('agencyContext', JSON.stringify(agencyContext));
    if (closeModal) {
      showSettingsModal = false;
    }
  }

  function extractOutline() {
    const editor = document.getElementById('main-editor');
    if (!editor) return;

    let newOutline: OutlineNode[] = [];
    let counter = 0;

    const elements = editor.querySelectorAll('h1, h2, b, strong, div, p');
    
    elements.forEach((node) => {
      const nodeName = node.nodeName;
      let text = node.textContent?.trim() || "";
      const upperText = text.toUpperCase();

      let isMatch = false;
      let type: 'heading' | 'article' | 'doctype' | 'chapter' | 'character' | 'plot' = 'heading';
      let level = 1;

      if (currentProfile === 'novel') {
        if ((node as HTMLElement).classList && (node as HTMLElement).classList.contains('novel-chapter')) {
          isMatch = true; type = 'chapter'; level = 1;
        } else if (nodeName === 'H1') {
          isMatch = true; level = 1;
        } else if (nodeName === 'H2') {
          isMatch = true; level = 2;
        }
      } else if (currentProfile === 'administrative') {
        if (nodeName === 'B' || nodeName === 'STRONG') {
          if (text.startsWith('Điều')) {
            isMatch = true; type = 'article'; level = 2;
          }
        } else if (nodeName === 'DIV' || nodeName === 'P') {
          if (upperText === "QUYẾT ĐỊNH" || upperText === "THÔNG BÁO" || upperText === "TỜ TRÌNH" || upperText === "CÔNG VĂN" || upperText === "QUYẾT ĐỊNH:") {
            if (!node.querySelector('div, p')) {
               isMatch = true; type = 'doctype'; level = 1;
            }
          }
        }
        if (!isMatch) {
          if (nodeName === 'H1') {
            isMatch = true; level = 1;
          } else if (nodeName === 'H2') {
            isMatch = true; level = 2;
          }
        }
      } else {
        if (nodeName === 'H1') {
          isMatch = true; level = 1;
        } else if (nodeName === 'H2') {
          isMatch = true; level = 2;
        }
      }

      if (isMatch) {
        if (!node.id) {
          node.id = `outline-node-${Date.now()}-${counter}`;
        }
        newOutline.push({
          id: node.id,
          text: text.length > 50 ? text.substring(0, 50) + '...' : text,
          type: type,
          level: level
        });
        counter++;
      }
    });

    documentOutline = newOutline;
  }

  function triggerAutoSave() {
    saveStatus = 'saving';
    clearTimeout(autoSaveTimer);
    autoSaveTimer = setTimeout(() => {
      const editor = document.getElementById('main-editor');
      if (editor && documentId) {
        localStorage.setItem(`draft_${documentId}_${currentProfile}`, editor.innerHTML);
      }
      saveStatus = 'saved';
    }, 5000);
  }

  function scrollToNode(id: string) {
    const node = document.getElementById(id);
    if (node) {
      node.scrollIntoView({ behavior: 'smooth', block: 'center' });
      node.style.transition = 'background-color 0.5s';
      node.style.backgroundColor = '#fef08a'; // highlight yellow
      setTimeout(() => {
        node.style.backgroundColor = 'transparent';
      }, 1000);
    }
  }



  function handleInput(e: Event) {
    const target = e.target as HTMLElement;
    editorContent = target.innerText || "";
    wordCount = editorContent.trim() ? editorContent.trim().split(/\s+/).length : 0;
    
    // Slash command & Mention detection
    const selection = window.getSelection();
    if (selection && selection.focusNode && selection.focusNode.nodeType === Node.TEXT_NODE) {
      const textBeforeCursor = selection.focusNode.textContent?.slice(0, selection.focusOffset) || "";
      const slashMatch = textBeforeCursor.match(/\/([^\/\n]{0,30})$/);
      const mentionMatch = textBeforeCursor.match(/@([^@\n]{0,30})$/);
      
      if (slashMatch) {
        const filter = slashMatch[1].toLowerCase();
        const hasMatch = availableBlocks.some(i => i.title.toLowerCase().includes(filter) || i.key.includes(filter));
        
        if (hasMatch) {
          slashFilter = filter;
          showSlashMenu = true;
          showMentionMenu = false;
          
          // Calculate position
          const range = selection.getRangeAt(0);
          const rect = range.getBoundingClientRect();
          slashMenuX = rect.left;
          slashMenuY = rect.bottom + 5;
          
          // Store range
          slashRange = document.createRange();
          slashRange.setStart(selection.focusNode, selection.focusOffset - slashMatch[0].length);
          slashRange.setEnd(selection.focusNode, selection.focusOffset);
        } else {
          showSlashMenu = false;
        }
      } else if (mentionMatch && currentProfile === 'novel') {
        const filter = mentionMatch[1].toLowerCase();
        const hasMatch = characterList.some(c => c.name.toLowerCase().includes(filter));
        
        if (hasMatch) {
          showSlashMenu = false;
          mentionFilter = filter;
          showMentionMenu = true;
          
          // Calculate position
          const range = selection.getRangeAt(0);
          const rect = range.getBoundingClientRect();
          mentionMenuX = rect.left;
          mentionMenuY = rect.bottom + 5;
          
          // Store range
          mentionRange = document.createRange();
          mentionRange.setStart(selection.focusNode, selection.focusOffset - mentionMatch[0].length);
          mentionRange.setEnd(selection.focusNode, selection.focusOffset);
        } else {
          showMentionMenu = false;
        }
      } else {
        showSlashMenu = false;
        showMentionMenu = false;
      }
    } else {
      showSlashMenu = false;
      showMentionMenu = false;
    }
    
    updateFloatingButton();
    triggerAutoSave();

    clearTimeout(outlineDebounceTimer);
    outlineDebounceTimer = setTimeout(() => {
      extractOutline();
    }, 500);
  }
  function handleEditorKeydown(e: KeyboardEvent) {
    if (e.key === 'Backspace' || e.key === 'Delete') {
      const selection = window.getSelection();
      if (selection && !selection.isCollapsed) {
        const range = selection.getRangeAt(0);
        const container = document.createElement('div');
        container.appendChild(range.cloneContents());
        // Nếu vùng chọn chứa mention hoặc các block đặc biệt, ép buộc xóa bằng DOM API
        if (container.querySelector('.mention') || container.querySelector('.novel-character') || container.querySelector('.novel-plot') || container.querySelector('table')) {
          e.preventDefault();
          range.deleteContents();
          triggerAutoSave();
          setTimeout(extractOutline, 100);
          return;
        }
      }
    }

    if (showSlashMenu) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        slashSelectedIndex = (slashSelectedIndex + 1) % filteredSlashItems.length;
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        slashSelectedIndex = (slashSelectedIndex - 1 + filteredSlashItems.length) % filteredSlashItems.length;
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const item = filteredSlashItems[slashSelectedIndex];
        if (item) {
          insertSlashBlock(item.key, item.docType);
        }
      } else if (e.key === 'Escape') {
        showSlashMenu = false;
      }
    } else if (showMentionMenu) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        mentionSelectedIndex = (mentionSelectedIndex + 1) % filteredMentionItems.length;
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        mentionSelectedIndex = (mentionSelectedIndex - 1 + filteredMentionItems.length) % filteredMentionItems.length;
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const item = filteredMentionItems[mentionSelectedIndex];
        if (item) {
          insertMention(item);
        }
      } else if (e.key === 'Escape') {
        showMentionMenu = false;
      }
    }
  }

  function handleContextMenu(e: MouseEvent) {
    const target = e.target as HTMLElement;
    const mentionSpan = target.closest('.character-mention');
    if (mentionSpan) {
      e.preventDefault();
      const charId = mentionSpan.getAttribute('data-character-id');
      if (charId) {
        const char = novelCharacters.find(c => c.id === charId);
        if (char) {
          openEditCharacterModal(char);
        }
      }
    }
  }

  function updateFloatingButton() {
    if (showBlockMenu) return;
    
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || !selection.isCollapsed) {
      showPlusBtn = false;
      return;
    }
    
    let node = selection.focusNode;
    const editor = document.getElementById('main-editor');
    if (!editor || !editor.contains(node)) {
      showPlusBtn = false;
      return;
    }
    
    while (node && node !== editor && node.nodeName !== 'P' && node.nodeName !== 'DIV') {
      node = node.parentNode;
    }
    
    if (node && (node.nodeName === 'P' || node.nodeName === 'DIV')) {
      const text = node.textContent?.trim() || "";
      if (text.length === 0) {
        const rect = (node as HTMLElement).getBoundingClientRect();
        const editorRect = editor.getBoundingClientRect();
        
        plusBtnX = editorRect.left + 50; 
        plusBtnY = rect.top;
        
        showPlusBtn = true;
        activeEmptyNode = node as HTMLElement;
        return;
      }
    }
    showPlusBtn = false;
  }

  function toggleBlockMenu() {
    showBlockMenu = !showBlockMenu;
  }

  function insertActionBlock(key: string, docType?: string | null) {
    const editor = document.getElementById('main-editor');
    if (!editor || !activeEmptyNode) return;
    
    editor.focus();
    
    const selection = window.getSelection();
    if (selection) {
      const range = document.createRange();
      range.selectNodeContents(activeEmptyNode);
      selection.removeAllRanges();
      selection.addRange(range);
      
      const compiledHTML = compileTemplate(BLOCK_TEMPLATES[key], docType as DocType);
      document.execCommand('insertHTML', false, compiledHTML);
    }
    
    showBlockMenu = false;
    showPlusBtn = false;
    triggerAutoSave();
    setTimeout(extractOutline, 100);
  }

  function insertSlashBlock(key: string, docType?: string | null) {
    const editor = document.getElementById('main-editor');
    if (!editor) return;
    
    editor.focus();

    if (showSlashMenu && slashRange) {
      const selection = window.getSelection();
      if (selection) {
        selection.removeAllRanges();
        selection.addRange(slashRange);
        document.execCommand('delete', false);
      }
      showSlashMenu = false;
    }
    
    const compiledHTML = compileTemplate(BLOCK_TEMPLATES[key], docType as DocType);
    document.execCommand('insertHTML', false, compiledHTML);
    triggerAutoSave();
    setTimeout(extractOutline, 100);
  }

  function insertMention(character: { id: string, name: string }) {
    const editor = document.getElementById('main-editor');
    if (!editor) return;
    
    editor.focus();

    if (showMentionMenu && mentionRange) {
      const selection = window.getSelection();
      if (selection) {
        selection.removeAllRanges();
        selection.addRange(mentionRange);
        document.execCommand('delete', false);
      }
      showMentionMenu = false;
    }
    
    // Create the mention span
    const mentionHTML = `<span class="mention character-mention text-blue-800 cursor-pointer print:text-black" style="user-select: all; -webkit-user-select: all;" contenteditable="false" data-character-id="${character.id}" data-character-name="${character.name}">${character.name}</span>&nbsp;`;
    document.execCommand('insertHTML', false, mentionHTML);
    triggerAutoSave();
    setTimeout(extractOutline, 100);
  }

  function insertTemplate(key: string, docType?: string) {
    const editor = document.getElementById('main-editor');
    if (!editor) return;
    
    editor.focus();

    if (showSlashMenu && slashRange) {
      const selection = window.getSelection();
      if (selection) {
        selection.removeAllRanges();
        selection.addRange(slashRange);
        document.execCommand('delete', false);
      }
      showSlashMenu = false;
    }
    
    const tpl = TEMPLATES.find(t => t.key === key);
    if (!tpl) return;

    const compiledHTML = compileTemplate(tpl.html, docType as DocType);
    document.execCommand('insertHTML', false, compiledHTML);
    triggerAutoSave();
    setTimeout(extractOutline, 100);
  }

  async function generateAIText() {
    alert("Tính năng Sáng tạo nội dung với AI đang trong giai đoạn phát triển. Vui lòng nâng cấp gói Pro để sử dụng sau này.");
    aiStatus = 'error';
    aiErrorMsg = "Cần nâng cấp gói Pro";
    setTimeout(() => { aiStatus = 'idle'; }, 5000);
  }

  function handleSelectionChange() {
    updateFloatingButton();
    if (showSlashMenu) return; 
    
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0 && !selection.isCollapsed) {
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      
      const editor = document.getElementById('main-editor');
      if (editor && editor.contains(selection.anchorNode)) {
        isTextSelected = true;
        menuX = rect.left + rect.width / 2;
        menuY = rect.top - 10;
      } else {
        isTextSelected = false;
      }
    } else {
      isTextSelected = false;
    }
  }

  onMount(() => {
    // Kích hoạt Polling theo dõi trạng thái AI Server
    checkAiServerStatus();
    aiStatusTimer = setInterval(checkAiServerStatus, 1500);

    const savedContext = localStorage.getItem('agencyContext');
    if (savedContext) {
      try {
        agencyContext = { ...agencyContext, ...JSON.parse(savedContext) };
      } catch (e) {
        console.error("Lỗi khi đọc agency context", e);
      }
    }

    // Document Isolation Setup
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('id')) {
      documentId = urlParams.get('id') || "";
    } else {
      documentId = "doc_" + Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
      window.history.replaceState(null, '', '?id=' + documentId);
    }

    document.addEventListener('selectionchange', handleSelectionChange);
    document.addEventListener('keyup', updateFloatingButton);
    document.addEventListener('mouseup', updateFloatingButton);
    
    const editor = document.getElementById('main-editor');
    if (editor) {
      const savedProfile = localStorage.getItem(`last_profile_${documentId}`);
      if (savedProfile) {
        currentProfile = savedProfile as ProfileType;
      }
      
      const savedChars = localStorage.getItem(`characters_${documentId}`);
      if (savedChars) {
        try {
          novelCharacters = JSON.parse(savedChars);
        } catch (e) {}
      }

      const savedEvents = localStorage.getItem(`events_${documentId}`);
      if (savedEvents) {
        try {
          novelEvents = JSON.parse(savedEvents);
        } catch (e) {}
      }

      const savedDraft = localStorage.getItem(`draft_${documentId}_${currentProfile}`) || localStorage.getItem(`draft_${documentId}`);
      if (savedDraft) {
        editor.innerHTML = savedDraft;
        // Migrate old draft
        if (!localStorage.getItem(`draft_${documentId}_${currentProfile}`)) {
          localStorage.setItem(`draft_${documentId}_${currentProfile}`, savedDraft);
        }
      } else {
        // Fallback default content if no draft
        editor.innerHTML = `<p><br></p>`;
      }
      editorContent = editor.innerText || "";
      wordCount = editorContent.trim() ? editorContent.trim().split(/\s+/).length : 0;
      extractOutline();
    }

    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange);
      document.removeEventListener('keyup', updateFloatingButton);
      document.removeEventListener('mouseup', updateFloatingButton);
    };
  });

  function handleProfileChange(e: Event) {
    const newProfile = (e.target as HTMLSelectElement).value as ProfileType;
    if (newProfile === currentProfile) return;
    
    const editor = document.getElementById('main-editor');
    if (editor) {
      // Save current
      localStorage.setItem(`draft_${documentId}_${currentProfile}`, editor.innerHTML);
      
      // Load new
      const newDraft = localStorage.getItem(`draft_${documentId}_${newProfile}`);
      editor.innerHTML = newDraft || `<p><br></p>`;
      
      currentProfile = newProfile;
      editorContent = editor.innerText || "";
      wordCount = editorContent.trim() ? editorContent.trim().split(/\s+/).length : 0;
      extractOutline();
      updateFloatingButton();
      
      localStorage.setItem(`last_profile_${documentId}`, currentProfile);
    }
  }

  function execCmd(command: string, value: string | undefined = undefined) {
    document.execCommand(command, false, value);
    updateFloatingButton();
    triggerAutoSave();
  }

  function applyLaTeX() {
    const editor = document.getElementById('main-editor');
    if (!editor) return;
    
    if (typeof (window as any).renderMathInElement === 'function') {
      (window as any).renderMathInElement(editor, {
        delimiters: [
          {left: '$$', right: '$$', display: true},
          {left: '$', right: '$', display: false},
          {left: '\\(', right: '\\)', display: false},
          {left: '\\[', right: '\\]', display: true}
        ],
        throwOnError: false
      });
      triggerAutoSave();
    } else {
      console.warn("KaTeX auto-render is not loaded yet.");
      alert("Đang tải thư viện Toán học. Vui lòng thử lại sau 1-2 giây.");
    }
  }

  function handleAIInsert(text: string) {
    let html = "";
    try {
      // Thử parse JSON xem AI có trả về cấu trúc hay không
      const parsed = JSON.parse(text);
      if (parsed.cauHoi_TieuChuan && parsed.loiGiai_TungBuoc) {
        html += `<h3 style="font-size: 14pt; font-weight: bold; color: #1e3a8a; margin-bottom: 10px;">[${parsed.monHoc} - Lớp ${parsed.lop}] Chủ đề: ${parsed.chuDe} (${parsed.doKho})</h3>`;
        
        let cauHoi = parsed.cauHoi_TieuChuan;
        let optionsHtml = "";
        
        // Regex để bắt trắc nghiệm A, B, C, D
        const regexChoices = /(?:^|\\n)\\s*[(]?A[).]\\s+(.*?)(?:\\n\\s*[(]?B[).]\\s+(.*?))?(?:\\n\\s*[(]?C[).]\\s+(.*?))?(?:\\n\\s*[(]?D[).]\\s+(.*?))?$/s;
        const match = cauHoi.match(regexChoices);
        
        if (match) {
          cauHoi = cauHoi.replace(match[0], "").trim();
          const optA = match[1] ? match[1].trim() : "";
          const optB = match[2] ? match[2].trim() : "";
          const optC = match[3] ? match[3].trim() : "";
          const optD = match[4] ? match[4].trim() : "";
          
          optionsHtml = `
            <table style="width: 100%; margin-bottom: 15px; margin-top: 10px;" contenteditable="true">
              <tbody>
                <tr>
                  <td style="width: 50%; padding: 5px;">A. ${optA}</td>
                  <td style="width: 50%; padding: 5px;">B. ${optB}</td>
                </tr>
                <tr>
                  <td style="width: 50%; padding: 5px;">C. ${optC}</td>
                  <td style="width: 50%; padding: 5px;">D. ${optD}</td>
                </tr>
              </tbody>
            </table>
          `;
        }

        cauHoi = cauHoi.replace(/\\n/g, '<br>');
        html += `<p style="margin-bottom: 15px;"><strong>Đề bài:</strong> ${cauHoi}</p>`;
        if (optionsHtml) html += optionsHtml;
        
        html += `<p style="font-size: 13pt; font-weight: bold; margin-bottom: 8px;">Hướng dẫn giải chi tiết:</p>`;
        parsed.loiGiai_TungBuoc.forEach((step: string) => {
          html += `<p style="margin-left: 20px; margin-bottom: 5px;">- ${step.replace(/\\n/g, '<br>')}</p>`;
        });
        
        if (parsed.dapAnCuoiCung) {
          html += `<p style="margin-top: 15px; font-weight: bold; color: #b91c1c;">Kết luận: ${parsed.dapAnCuoiCung.replace(/\\n/g, '<br>')}</p>`;
        }
        html += `<p><br></p>`;
      } else if (parsed.loai_van_ban && parsed.dieu_khoan) {
        html += `<div style="text-align: center; font-weight: bold; font-family: 'Times New Roman', serif;">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</div>`;
        html += `<div style="text-align: center; font-weight: bold; text-decoration: underline; font-family: 'Times New Roman', serif; margin-bottom: 20px;">Độc lập - Tự do - Hạnh phúc</div>`;
        if (parsed.co_quan_ban_hanh) {
          html += `<div style="text-transform: uppercase; font-weight: bold; margin-bottom: 20px; font-family: 'Times New Roman', serif;">${parsed.co_quan_ban_hanh}</div>`;
        }
        html += `<div style="text-align: center; font-weight: bold; font-size: 16pt; text-transform: uppercase; font-family: 'Times New Roman', serif; margin-top: 20px;">${parsed.loai_van_ban}</div>`;
        if (parsed.trich_yeu) {
          html += `<div style="text-align: center; font-weight: bold; font-family: 'Times New Roman', serif; margin-bottom: 20px;">Về việc ${parsed.trich_yeu}</div>`;
        }
        if (parsed.can_cu_phap_ly && Array.isArray(parsed.can_cu_phap_ly)) {
          parsed.can_cu_phap_ly.forEach((cc: string) => {
            html += `<p style="font-style: italic; margin-bottom: 5px; margin-left: 30px;">${cc}</p>`;
          });
        }
        let actionWord = 'NAY BAN HÀNH:';
        if (parsed.loai_van_ban.toUpperCase() === 'QUYẾT ĐỊNH') actionWord = 'QUYẾT ĐỊNH:';
        if (parsed.loai_van_ban.toUpperCase() === 'TỜ TRÌNH') actionWord = 'KÍNH TRÌNH:';
        html += `<div style="text-align: center; font-weight: bold; margin-top: 20px; margin-bottom: 10px; font-family: 'Times New Roman', serif;">${actionWord}</div>`;
        if (parsed.dieu_khoan && Array.isArray(parsed.dieu_khoan)) {
          parsed.dieu_khoan.forEach((dk: string) => {
            const dkMatch = dk.match(/^(Điều \\d+\\.)(.*)/i);
            if (dkMatch) {
              html += `<p style="margin-bottom: 10px; text-align: justify;"><b>${dkMatch[1]}</b>${dkMatch[2]}</p>`;
            } else {
              html += `<p style="margin-bottom: 10px; text-align: justify;">${dk}</p>`;
            }
          });
        }
        html += `<p><br></p>`;
      } else {
        html = `<p><pre style="white-space: pre-wrap; font-family: monospace; background: #f3f4f6; padding: 10px; border-radius: 5px;">${JSON.stringify(parsed, null, 2)}</pre></p>`;
      }
    } catch (e) {
      // Fallback nếu AI chỉ trả về text thường
      html = text.split('\n').map(p => p.trim() ? `<p>${p}</p>` : '<p><br></p>').join('');
    }

    document.execCommand('insertHTML', false, html);
    triggerAutoSave();
    setTimeout(extractOutline, 100);
    
    // Tự động kích hoạt KaTeX nếu đang ở Profile giáo dục
    if (activeProfileConfig.toolbarFeatures.showComplexMath) {
      setTimeout(applyLaTeX, 500);
    }
  }

  async function checkAiServerStatus() {
    try {
      const res = await fetch('http://localhost:3001/api/status');
      if (res.ok) {
        const data = await res.json();
        aiInitStatus = data.status;
        aiDownloadPercent = data.percent;
        aiDownloadedMB = data.downloadedMB;
        aiTotalMB = data.totalMB;

        // Nếu đang tải hoặc đang nạp vào RAM thì bật bảng báo
        if (aiInitStatus === 'downloading' || aiInitStatus === 'loading') {
          showAiInitModal = true;
        } else if (aiInitStatus === 'ready') {
          showAiInitModal = false;
          // Tải xong thì dừng Polling để đỡ nặng máy
          if (aiStatusTimer) {
            clearInterval(aiStatusTimer);
            aiStatusTimer = null;
          }
        }
      }
    } catch (e) {
      // Server AI chưa bật
      aiInitStatus = 'offline';
    }
  }

  $: availableBlocks = BLOCK_ITEMS.filter(i => !i.profile || i.profile === currentProfile);
  $: filteredSlashItems = availableBlocks.filter(i => i.title.toLowerCase().includes(slashFilter) || i.key.includes(slashFilter));
  
  let slashSelectedIndex = 0;
  $: if (slashFilter !== undefined) { slashSelectedIndex = 0; }

  // Mention State
  let showMentionMenu = false;
  let mentionFilter = "";
  let mentionMenuX = 0;
  let mentionMenuY = 0;
  let mentionRange: Range | null = null;
  let mentionSelectedIndex = 0;
  $: if (mentionFilter !== undefined) { mentionSelectedIndex = 0; }
  
  $: characterList = novelCharacters.flatMap(c => {
    const items = [{ id: c.id, name: c.name, primaryName: c.name }];
    if (c.aliases) {
      const aliases = c.aliases.split(',').map(a => a.trim()).filter(a => a);
      aliases.forEach(alias => {
        items.push({ id: c.id, name: alias, primaryName: c.name });
      });
    }
    return items;
  });
  
  $: filteredMentionItems = characterList.filter(c => c.name.toLowerCase().includes(mentionFilter));

  // Timeline State
  let showTimelineModal = false;
  let timelineCharacter: { id: string, name: string } | null = null;
  let timelineEvents: string[] = [];
  
  // Mobile Sidebar State
  let showLeftSidebarMobile = false;
  let showRightSidebarMobile = false;

  function viewCharacterTimeline(charId: string) {
    const char = novelCharacters.find(c => c.id === charId);
    if (!char) return;
    
    timelineCharacter = { id: char.id, name: char.name };
    
    const editor = document.getElementById('main-editor');
    if (!editor) return;
    
    // Tìm kiếm các lần đề cập dựa trên data-character-id thay vì name (để bao hàm cả biệt danh)
    const mentions = Array.from(editor.querySelectorAll(`span.character-mention[data-character-id="${char.id}"]`));
    
    timelineEvents = mentions.map(span => {
      const block = span.closest('p, div.novel-plot, div.novel-chapter, li');
      if (block) {
        return block.textContent || "";
      }
      return span.parentElement?.textContent || "";
    });
    
    showTimelineModal = true;
  }
</script>

<div class="flex flex-col h-screen w-full font-sans text-sm transition-colors duration-500 {activeProfileConfig.wrapperClass} relative">
  <!-- Add Character Modal -->
  {#if showAddCharacterModal}
    <div class="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
      <div class="bg-white rounded-lg p-6 w-full max-w-sm shadow-xl">
        <h3 class="font-bold mb-4">{editingCharId ? 'Chỉnh sửa nhân vật' : 'Thêm nhân vật mới'}</h3>
        <input bind:value={newCharName} placeholder="Tên nhân vật" class="w-full border rounded p-2 mb-2" />
        <input bind:value={newCharAliases} placeholder="Biệt danh (cách nhau bởi dấu phẩy)" class="w-full border rounded p-2 mb-2" />
        <textarea bind:value={newCharDesc} placeholder="Mô tả" class="w-full border rounded p-2 mb-4" rows="3"></textarea>
        <div class="flex justify-end gap-2">
          <button on:click={closeCharacterModal} class="px-4 py-2 text-gray-600">Hủy</button>
        </div>
      </div>
    </div>
  {/if}

  <div class="flex flex-1 overflow-hidden relative w-full">
  <!-- AI Initialization & Download Modal -->
  {#if showAiInitModal}
  <div class="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[200]">
    <div class="bg-white rounded-2xl shadow-2xl w-[500px] p-8 text-center animate-pop">
      <div class="w-20 h-20 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
        <svg class="w-10 h-10 {aiInitStatus === 'loading' ? 'animate-pulse' : 'animate-bounce'}" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
      </div>
      
      {#if aiInitStatus === 'downloading'}
        <h2 class="text-2xl font-extrabold text-gray-800 mb-2">Đang tải Dữ liệu AI Lần Đầu</h2>
        <p class="text-gray-500 mb-6 text-sm">Quá trình này chỉ diễn ra duy nhất một lần. Xin vui lòng chờ, không tắt ứng dụng.</p>
        
        <div class="w-full bg-gray-100 rounded-full h-4 mb-2 overflow-hidden shadow-inner">
          <div class="bg-blue-600 h-4 rounded-full transition-all duration-500 ease-out" style="width: {aiDownloadPercent}%"></div>
        </div>
        <div class="flex justify-between text-xs font-bold text-gray-600 mb-1">
          <span>{aiDownloadedMB} MB / {aiTotalMB} MB</span>
          <span>{aiDownloadPercent}%</span>
        </div>
      {:else if aiInitStatus === 'loading'}
        <h2 class="text-2xl font-extrabold text-gray-800 mb-2">Đang Nạp Lên GPU/CPU</h2>
        <p class="text-gray-500 text-sm">Mô hình đang được giải nén và tối ưu hóa cho phần cứng của bạn...</p>
        <div class="mt-6 flex justify-center space-x-2">
          <div class="w-3 h-3 bg-blue-600 rounded-full animate-bounce"></div>
          <div class="w-3 h-3 bg-blue-600 rounded-full animate-bounce" style="animation-delay: 0.1s"></div>
          <div class="w-3 h-3 bg-blue-600 rounded-full animate-bounce" style="animation-delay: 0.2s"></div>
        </div>
      {/if}
    </div>
  </div>
  {/if}
  <!-- Settings Modal (Agency Context) -->
  {#if showSettingsModal}
  <div class="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[100]">
    <div class="bg-white rounded-xl shadow-2xl w-[650px] overflow-hidden animate-pop">
      <div class="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
        <h2 class="font-bold text-lg text-gray-800 flex items-center">
          <svg class="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>
          Hồ sơ Đơn vị (Agency Context)
        </h2>
        <button on:click={() => showSettingsModal = false} class="text-gray-400 hover:text-red-500 transition-colors">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
        </button>
      </div>
      <div class="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
        <!-- Section: Thông tin chung -->
        <div>
          <h3 class="text-sm font-bold text-blue-600 border-b border-blue-100 pb-1 mb-3">1. Thông tin chung</h3>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-bold text-gray-500 uppercase mb-1">Cơ quan chủ quản</label>
              <input bind:value={agencyContext.coQuanChuQuan} placeholder="VD: UBND TP. HÀ NỘI" class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all">
            </div>
            <div>
              <label class="block text-xs font-bold text-gray-500 uppercase mb-1">Tên cơ quan ban hành</label>
              <input bind:value={agencyContext.tenCoQuan} placeholder="VD: SỞ TT&TT" class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all">
            </div>
            <div>
              <label class="block text-xs font-bold text-gray-500 uppercase mb-1">Địa danh ban hành</label>
              <input bind:value={agencyContext.diaDanh} placeholder="VD: Hà Nội" class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all">
            </div>
            <div>
              <label class="block text-xs font-bold text-gray-500 uppercase mb-1">Ký hiệu Người soạn thảo (Ký nháy)</label>
              <input bind:value={agencyContext.nguoiSoanThao} placeholder="VD: LHA, 05 (Tên viết tắt, Số bản)" class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all">
            </div>
            <div>
              <label class="block text-xs font-bold text-gray-500 uppercase mb-1">Quyền hạn người ký</label>
              <input bind:value={agencyContext.quyenHanKy} placeholder="VD: TM. ỦY BAN NHÂN DÂN" class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all">
            </div>
            <div>
              <label class="block text-xs font-bold text-gray-500 uppercase mb-1">Chức vụ người ký</label>
              <input bind:value={agencyContext.chucVuNguoiKy} placeholder="VD: CHỦ TỊCH" class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all">
            </div>
            <div>
              <label class="block text-xs font-bold text-gray-500 uppercase mb-1">Họ và tên người ký</label>
              <input bind:value={agencyContext.tenNguoiKy} placeholder="VD: Nguyễn Văn A" class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all">
            </div>
          </div>
        </div>

        <!-- Section: Cấu hình Đếm số Tịnh tiến -->
        <div>
          <h3 class="text-sm font-bold text-blue-600 border-b border-blue-100 pb-1 mb-3">2. Bộ đếm Số Công Văn (Tự động tịnh tiến)</h3>
          <div class="space-y-3">
            <div class="flex items-center space-x-3 bg-gray-50 p-2 rounded border border-gray-100">
              <span class="w-24 font-bold text-gray-700">Quyết định</span>
              <div class="flex-1 flex items-center">
                <span class="text-gray-500 mx-2 text-sm">Số tiếp theo:</span>
                <input type="number" bind:value={agencyContext.quyetDinhCount} class="w-20 border border-gray-300 rounded px-2 py-1 text-center font-mono">
                <span class="text-gray-500 mx-2 text-lg">/</span>
                <input bind:value={agencyContext.quyetDinhKyHieu} placeholder="QĐ-UBND" class="w-28 border border-gray-300 rounded px-2 py-1 text-center font-mono">
              </div>
            </div>
            <div class="flex items-center space-x-3 bg-gray-50 p-2 rounded border border-gray-100">
              <span class="w-24 font-bold text-gray-700">Thông báo</span>
              <div class="flex-1 flex items-center">
                <span class="text-gray-500 mx-2 text-sm">Số tiếp theo:</span>
                <input type="number" bind:value={agencyContext.thongBaoCount} class="w-20 border border-gray-300 rounded px-2 py-1 text-center font-mono">
                <span class="text-gray-500 mx-2 text-lg">/</span>
                <input bind:value={agencyContext.thongBaoKyHieu} placeholder="TB-UBND" class="w-28 border border-gray-300 rounded px-2 py-1 text-center font-mono">
              </div>
            </div>
            <div class="flex items-center space-x-3 bg-gray-50 p-2 rounded border border-gray-100">
              <span class="w-24 font-bold text-gray-700">Tờ trình</span>
              <div class="flex-1 flex items-center">
                <span class="text-gray-500 mx-2 text-sm">Số tiếp theo:</span>
                <input type="number" bind:value={agencyContext.toTrinhCount} class="w-20 border border-gray-300 rounded px-2 py-1 text-center font-mono">
                <span class="text-gray-500 mx-2 text-lg">/</span>
                <input bind:value={agencyContext.toTrinhKyHieu} placeholder="TTr-UBND" class="w-28 border border-gray-300 rounded px-2 py-1 text-center font-mono">
              </div>
            </div>
            <div class="flex items-center space-x-3 bg-gray-50 p-2 rounded border border-gray-100">
              <span class="w-24 font-bold text-gray-700">Công văn</span>
              <div class="flex-1 flex items-center">
                <span class="text-gray-500 mx-2 text-sm">Số tiếp theo:</span>
                <input type="number" bind:value={agencyContext.congVanCount} class="w-20 border border-gray-300 rounded px-2 py-1 text-center font-mono">
                <span class="text-gray-500 mx-2 text-lg">/</span>
                <input bind:value={agencyContext.congVanKyHieu} placeholder="UBND" class="w-28 border border-gray-300 rounded px-2 py-1 text-center font-mono">
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end">
        <button on:click={() => saveAgencyContext(true)} class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-md shadow-sm transition-colors">
          Lưu & Áp dụng
        </button>
      </div>
    </div>
  </div>
  {/if}

    {#if showLeftSidebarMobile || showRightSidebarMobile}
      <!-- svelte-ignore a11y-click-events-have-key-events -->
      <!-- svelte-ignore a11y-no-static-element-interactions -->
      <div class="fixed inset-0 bg-black/50 z-20 lg:hidden backdrop-blur-sm transition-opacity" on:click={() => {showLeftSidebarMobile = false; showRightSidebarMobile = false;}}></div>
    {/if}

    <!-- Sidebar Trái (Document Outline) -->
    {#if activeProfileConfig.hasLeftSidebar}
    <aside class="w-64 bg-gray-50 border-r border-gray-200 shadow-inner z-30 transition-all duration-300 {showLeftSidebarMobile ? 'fixed inset-y-0 left-0 flex flex-col' : 'hidden lg:flex flex-col'}">
    <div class="p-4 border-b border-gray-200 font-bold text-gray-800 flex justify-between items-center bg-white">
      <div class="flex items-center">
        <svg class="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h8m-8 6h16"></path></svg>
        Cấu trúc Văn bản
      </div>
      <div class="flex items-center">
        {#if currentProfile === 'administrative'}
        <button on:click={() => showSettingsModal = true} class="p-1 hover:bg-gray-100 rounded text-gray-500 transition-colors" title="Cài đặt Hồ sơ Đơn vị">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
        </button>
        {/if}
        <button on:click={() => showLeftSidebarMobile = false} class="lg:hidden ml-1 p-1 hover:bg-gray-100 rounded text-gray-500 transition-colors" title="Đóng">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
        </button>
      </div>
    </div>
    <div class="flex-1 overflow-y-auto p-3 space-y-1">
      {#if currentProfile === 'novel'}
        <div class="mb-4">
          <div class="flex justify-between items-center mb-2 px-1">
            <h3 class="text-xs font-bold text-gray-500 uppercase tracking-wider">Nhân vật</h3>
            <button on:click={openAddCharacterModal} class="text-[10px] bg-indigo-50 text-indigo-600 hover:bg-indigo-100 px-2 py-1 rounded font-semibold transition-colors">+ Thêm</button>
          </div>
          {#if novelCharacters.length === 0}
            <div class="text-[11px] text-gray-400 italic px-1">Chưa có nhân vật nào.</div>
          {:else}
            <div class="space-y-1">
              {#each novelCharacters as char}
                <div class="group relative flex items-center justify-between w-full px-3 py-1.5 rounded-md hover:bg-white hover:shadow-sm transition-all" title={char.description}>
                  <button 
                    on:click={() => viewCharacterTimeline(char.id)}
                    class="flex-1 text-[11px] font-semibold text-slate-700 group-hover:text-indigo-600 truncate flex items-center text-left"
                  >
                    <span class="mr-1 opacity-70">👤</span> {char.name}
                  </button>
                  <button 
                    on:click={() => openEditCharacterModal(char)}
                    class="opacity-0 group-hover:opacity-100 p-1 text-[10px] text-gray-400 hover:text-indigo-600 rounded transition-all ml-2 flex-shrink-0"
                    title="Chỉnh sửa nhân vật"
                  >
                    ✏️
                  </button>
                </div>
              {/each}
            </div>
          {/if}
        </div>
        
        <div class="mb-4 border-t border-gray-100 pt-3">
          <div class="flex justify-between items-center mb-2 px-1">
            <h3 class="text-xs font-bold text-gray-500 uppercase tracking-wider">Dòng sự kiện</h3>
          </div>
          {#if novelEvents.length === 0}
            <div class="text-[11px] text-gray-400 italic px-1">Bôi đen văn bản để tạo sự kiện.</div>
          {:else}
            <div class="space-y-1">
              {#each novelEvents as ev}
                <div class="group relative flex flex-col w-full px-3 py-2 rounded-md hover:bg-yellow-50 hover:shadow-sm border-l-2 border-transparent hover:border-yellow-400 transition-all text-left">
                  <div class="text-[11px] font-medium text-slate-700 leading-snug line-clamp-3"><span class="mr-1 opacity-70">🎯</span> {ev.text}</div>
                  <button 
                    on:click={() => deleteNovelEvent(ev.id)}
                    class="absolute top-1 right-1 opacity-0 group-hover:opacity-100 p-1 text-[10px] text-red-400 hover:text-red-600 rounded transition-all flex-shrink-0"
                    title="Xóa sự kiện"
                  >
                    ✖
                  </button>
                </div>
              {/each}
            </div>
          {/if}
        </div>
        
        <h3 class="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 px-1 border-t border-gray-100 pt-3">Cấu trúc</h3>
      {/if}

      {#if currentProfile === 'poem'}
        <div class="mb-4">
          <div class="flex justify-between items-center mb-2 px-1">
            <h3 class="text-xs font-bold text-gray-500 uppercase tracking-wider text-pink-600 flex items-center">
              <span class="mr-1">🎭</span> Luật Bằng Trắc
            </h3>
          </div>
          <div class="text-[11px] bg-pink-50 text-pink-800 p-2 rounded-md border border-pink-100 font-medium mb-3 shadow-sm">
            <div class="font-bold mb-1">Thơ Lục bát:</div>
            <div>Câu 6: B - B - T - T - B - B</div>
            <div>Câu 8: B - B - T - T - B - B - T - B</div>
            <div class="text-[9px] mt-1 opacity-70 italic">(Các chữ thứ 2, 4, 6 cần đúng luật)</div>
          </div>
          
          <div class="flex justify-between items-center mb-2 px-1 border-t border-gray-100 pt-3">
            <h3 class="text-xs font-bold text-gray-500 uppercase tracking-wider text-purple-600 flex items-center">
              <span class="mr-1">✍️</span> Sổ tay Gieo Vần
            </h3>
          </div>
          <div class="space-y-1.5">
            <div class="text-[11px] bg-white p-2 border border-purple-100 rounded shadow-sm">
              <span class="font-bold text-purple-700">Vần "ang/àng/áng":</span><br>
              <span class="text-gray-500 text-[10px]">sang, vàng, sáng, màng, lang thang, mênh mang...</span>
            </div>
            <div class="text-[11px] bg-white p-2 border border-purple-100 rounded shadow-sm">
              <span class="font-bold text-purple-700">Vần "ơi":</span><br>
              <span class="text-gray-500 text-[10px]">chơi, vơi, rơi, khơi, tơi bời, lả lơi...</span>
            </div>
            <div class="text-[11px] bg-white p-2 border border-purple-100 rounded shadow-sm">
              <span class="font-bold text-purple-700">Vần "iêng":</span><br>
              <span class="text-gray-500 text-[10px]">riêng, thiêng, nghiêng, kiêng, chiêng...</span>
            </div>
            <div class="text-[11px] bg-white p-2 border border-purple-100 rounded shadow-sm">
              <span class="font-bold text-purple-700">Vần "ương":</span><br>
              <span class="text-gray-500 text-[10px]">thương, vương, sương, tương, lường...</span>
            </div>
          </div>
        </div>
      {/if}

      {#if documentOutline.length === 0}
        <div class="text-xs text-gray-400 italic text-center mt-10 px-4">
          Chưa có cấu trúc nào được nhận diện (Ví dụ: QUYẾT ĐỊNH, Điều 1, Điều 2...).
        </div>
      {:else}
        {#each documentOutline as item}
          <div class="relative group">
            <button 
              on:click={() => scrollToNode(item.id)}
              class="w-full text-left px-3 py-1.5 rounded-md hover:bg-white hover:shadow-sm transition-all flex items-center"
              title={item.text}
            >
              <div class="flex-1 truncate">
                {#if item.type === 'doctype'}
                  <div class="text-[10px] font-bold text-gray-400 uppercase tracking-wider group-hover:text-blue-500">{item.text}</div>
                {:else if item.type === 'chapter'}
                  <div class="text-xs font-bold text-indigo-700 uppercase tracking-wider flex items-center mt-2 group-hover:text-indigo-900"><span class="mr-1">🔖</span> {item.text}</div>
                {:else if item.type === 'character'}
                  <div class="text-[11px] font-semibold text-slate-700 ml-4 border-l-2 border-slate-200 pl-2 group-hover:border-indigo-400 group-hover:text-indigo-600 truncate flex items-center"><span class="mr-1 opacity-70">👤</span> {item.text}</div>
                {:else if item.type === 'plot'}
                  <div class="text-[11px] font-semibold text-yellow-700 ml-4 border-l-2 border-yellow-200 pl-2 group-hover:border-yellow-400 group-hover:text-yellow-600 truncate flex items-center"><span class="mr-1 opacity-70">🎯</span> {item.text}</div>
                {:else if item.type === 'article'}
                  <div class="text-[11px] font-semibold text-gray-700 ml-4 border-l-2 border-gray-200 pl-2 group-hover:border-blue-400 group-hover:text-blue-600 truncate">{item.text}</div>
                {:else}
                  <div class="text-xs font-medium text-gray-800 {item.level === 2 ? 'ml-4' : ''} truncate group-hover:text-blue-600">
                    {item.level === 2 ? '•' : ''} {item.text}
                  </div>
                {/if}
              </div>
            </button>
            {#if item.type === 'character'}
              <button 
                on:click={() => viewCharacterTimeline(item)}
                class="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 p-1 text-indigo-600 hover:bg-indigo-50 rounded transition-all text-xs"
                title="Xem Dòng sự kiện"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              </button>
            {/if}
          </div>
        {/each}
      {/if}
    </div>
  </aside>
  {/if}

  <!-- Main Content Area -->
  <main class="flex-1 flex flex-col h-full overflow-hidden relative">
    
    <!-- Top Minimal Bar (Seamless Redesign) -->
    <header class="min-h-[3rem] py-2 border-b flex flex-nowrap items-center justify-between px-4 z-20 {currentProfile === 'creative' ? 'bg-[#F9F6EE] border-[#E8E4D9]' : 'bg-white border-gray-200'}">
      <div class="flex items-center space-x-2 shrink-0">
        {#if activeProfileConfig.hasLeftSidebar}
        <button class="lg:hidden p-1.5 hover:bg-gray-100 rounded text-gray-600 transition-colors" on:click={() => showLeftSidebarMobile = true} title="Mở cấu trúc văn bản">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h8m-8 6h16"></path></svg>
        </button>
        {/if}
        <span class="text-xs font-semibold text-gray-500 uppercase tracking-wider hidden sm:inline shrink-0">Profile</span>
        <select value={currentProfile} on:change={handleProfileChange} class="text-sm bg-transparent border border-gray-200 rounded px-2 py-1 font-medium text-gray-700 outline-none hover:border-blue-300 focus:border-blue-500 transition-colors shrink-0">
          {#each PROFILES as profile}
            <option value={profile.id}>{profile.icon} {profile.name}</option>
          {/each}
        </select>
      </div>

      <!-- Toolbars Center (Scrollable with Buttons) -->
      <div class="flex-1 flex items-center relative group min-w-0 mx-4">
        <button 
          on:click={() => scrollToolbar(-1)} 
          class="absolute left-0 z-10 w-7 h-7 rounded-full bg-white border border-gray-200 shadow-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all -ml-3 hover:bg-gray-50 hover:scale-105 active:scale-95 focus:outline-none"
          title="Cuộn trái"
        >
          <svg class="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path></svg>
        </button>

        <div bind:this={toolbarScrollContainer} class="flex-1 overflow-x-auto hide-scrollbar flex items-center scroll-smooth px-1">
          <div class="flex flex-nowrap items-center text-gray-500 gap-2 mx-auto w-max">

        <!-- Font Selection Group -->
        <div class="flex items-center px-1 py-0.5 bg-slate-50 border border-gray-200 rounded-lg shadow-sm">
          <select on:change={(e) => execCmd('fontName', e.target.value)} class="h-8 bg-transparent text-gray-700 text-sm font-medium hover:bg-gray-200 rounded px-2 outline-none cursor-pointer border-none transition-colors" title="Font chữ">
            <option value="Times New Roman" selected>Times New Roman</option>
            <option value="Arial">Arial</option>
            <option value="Roboto">Roboto</option>
            <option value="Inter">Inter</option>
            <option value="Courier New">Courier New</option>
          </select>
        </div>

        <!-- History Group -->
        <div class="flex items-center px-1 py-0.5 bg-slate-50 border border-gray-200 rounded-lg shadow-sm">
          <button on:click={() => execCmd('undo')} class="p-1.5 hover:bg-gray-200 hover:text-gray-800 rounded-md transition-all active:scale-95" title="Hoàn tác (Undo)">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"></path></svg>
          </button>
          <button on:click={() => execCmd('redo')} class="p-1.5 hover:bg-gray-200 hover:text-gray-800 rounded-md transition-all active:scale-95" title="Làm lại (Redo)">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 10h-10a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6"></path></svg>
          </button>
        </div>

        <!-- Text Format Group -->
        {#if activeProfileConfig.toolbarFeatures.showTextFormat}
        <div class="flex items-center px-1 py-0.5 bg-slate-50 border border-gray-200 rounded-lg shadow-sm">
          <button on:click={() => execCmd('bold')} class="w-8 h-8 flex items-center justify-center hover:bg-gray-200 hover:text-gray-900 rounded-md transition-all font-bold text-[15px] active:scale-95" title="In đậm (Ctrl+B)">B</button>
          <button on:click={() => execCmd('italic')} class="w-8 h-8 flex items-center justify-center hover:bg-gray-200 hover:text-gray-900 rounded-md transition-all italic font-serif text-[15px] active:scale-95" title="In nghiêng (Ctrl+I)">I</button>
          <button on:click={() => execCmd('underline')} class="w-8 h-8 flex items-center justify-center hover:bg-gray-200 hover:text-gray-900 rounded-md transition-all underline text-[15px] active:scale-95" title="Gạch chân (Ctrl+U)">U</button>
        </div>
        {/if}

        <!-- Alignment Group -->
        {#if activeProfileConfig.toolbarFeatures.showAlignment}
        <div class="flex items-center px-1 py-0.5 bg-slate-50 border border-gray-200 rounded-lg shadow-sm">
          <button on:click={() => execCmd('justifyLeft')} class="p-1.5 hover:bg-gray-200 hover:text-gray-800 rounded-md transition-all active:scale-95" title="Căn Trái">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h10M4 18h16"></path></svg>
          </button>
          <button on:click={() => execCmd('justifyCenter')} class="p-1.5 hover:bg-gray-200 hover:text-gray-800 rounded-md transition-all active:scale-95" title="Căn Giữa">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M7 12h10M4 18h16"></path></svg>
          </button>
          <button on:click={() => execCmd('justifyFull')} class="p-1.5 hover:bg-blue-100 hover:text-blue-700 rounded-md transition-all active:scale-95" title="Căn đều hai bên">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
          </button>
        </div>
        {/if}

        <!-- Lists & Indent Group -->
        <div class="flex items-center px-1 py-0.5 bg-slate-50 border border-gray-200 rounded-lg shadow-sm">
          {#if activeProfileConfig.toolbarFeatures.showLists}
            <button on:click={() => execCmd('insertUnorderedList')} class="p-1.5 hover:bg-gray-200 hover:text-gray-800 rounded-md transition-all active:scale-95" title="Danh sách chấm">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01"></path></svg>
            </button>
            <button on:click={() => execCmd('insertOrderedList')} class="p-1.5 hover:bg-gray-200 hover:text-gray-800 rounded-md font-bold font-serif text-[11px] leading-none transition-all active:scale-95" title="Danh sách số">
              1.
            </button>
          {/if}

          {#if activeProfileConfig.toolbarFeatures.showLists && activeProfileConfig.toolbarFeatures.showIndents}
            <div class="w-px h-4 bg-gray-300 mx-1"></div>
          {/if}

          {#if activeProfileConfig.toolbarFeatures.showIndents}
            <button on:click={() => execCmd('outdent')} class="p-1.5 hover:bg-gray-200 hover:text-gray-800 rounded-md transition-all active:scale-95" title="Giảm thụt lề">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h10M4 18h16M8 10L4 12l4 2v-4z"></path></svg>
            </button>
            <button on:click={() => execCmd('indent')} class="p-1.5 hover:bg-gray-200 hover:text-gray-800 rounded-md transition-all active:scale-95" title="Tăng thụt lề">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M10 12h10M4 18h16M4 10l4 2-4 2v-4z"></path></svg>
            </button>
          {/if}
        </div>

        <!-- Education Special Group (Math/Chemistry) -->
        {#if activeProfileConfig.toolbarFeatures.showBasicMath}
        <div class="flex items-center px-1 py-0.5 bg-slate-50 border border-gray-200 rounded-lg shadow-sm space-x-1">
          <button on:click={() => execCmd('superscript')} class="p-1.5 hover:bg-blue-100 text-blue-700 rounded-md transition-all font-bold text-xs flex items-center active:scale-95" title="Số mũ trên (X²)">
            X<sup class="text-[8px] leading-none ml-[1px]">2</sup>
          </button>
          <button on:click={() => execCmd('subscript')} class="p-1.5 hover:bg-blue-100 text-blue-700 rounded-md transition-all font-bold text-xs flex items-center active:scale-95" title="Chỉ số dưới (X₂)">
            X<sub class="text-[8px] leading-none ml-[1px]">2</sub>
          </button>
        </div>
        {/if}

        <!-- AI Assistant Button -->
        <div class="flex items-center ml-2">
          <button on:click={generateAIText} class="flex items-center space-x-1 px-3 py-1.5 {aiStatus === 'loading' ? 'bg-purple-100 text-purple-700 border border-purple-200' : 'bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white shadow-md hover:shadow-lg border border-transparent'} rounded-lg font-bold text-xs transition-all active:scale-95" title="Sáng tác & Cải thiện văn bản bằng AI">
            {#if aiStatus === 'loading'}
              <svg class="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
              <span class="hidden sm:inline">Đang nghĩ...</span>
            {:else if aiStatus === 'error'}
              <span class="text-white flex items-center"><span class="text-sm mr-1">🔒</span> Cần bản Pro</span>
            {:else if aiStatus === 'success'}
              <span class="text-white">✨ Hoàn tất</span>
            {:else}
              <span class="flex items-center opacity-80"><span class="text-sm mr-1">🔒</span> AI Viết tiếp</span>
            {/if}
          </button>
        </div>

        <!-- File & Print Group -->
        <div class="flex items-center ml-2 px-1 py-0.5 bg-slate-50 border border-gray-200 rounded-lg shadow-sm space-x-1">
          <input type="file" bind:this={fileInput} on:change={loadFromFile} accept=".lhof" class="hidden" />
          <button on:click={openFile} class="p-1.5 hover:bg-gray-200 hover:text-gray-800 rounded-md transition-all active:scale-95 text-xs font-bold flex items-center" title="Mở file (.lhof)">
            <span class="mr-1">📂</span> Mở
          </button>
          <button on:click={saveToFile} class="p-1.5 hover:bg-gray-200 hover:text-gray-800 rounded-md transition-all active:scale-95 text-xs font-bold flex items-center" title="Lưu ghi đè">
            <span class="mr-1">💾</span> Lưu
          </button>
          <button on:click={saveAsFile} class="p-1.5 hover:bg-gray-200 hover:text-gray-800 rounded-md transition-all active:scale-95 text-xs font-bold flex items-center" title="Lưu mới file (Save As)">
            <span class="mr-1">📋</span> Lưu mới
          </button>
          <div class="w-px h-4 bg-gray-300 mx-1"></div>
          <button on:click={printDocument} class="p-1.5 hover:bg-gray-200 hover:text-gray-800 rounded-md transition-all active:scale-95 text-xs font-bold flex items-center" title="In / Xuất PDF (A4)">
            <span class="mr-1">🖨️</span> In / PDF
          </button>
        </div>

          </div>
        </div>

        <button 
          on:click={() => scrollToolbar(1)} 
          class="absolute right-0 z-10 w-7 h-7 rounded-full bg-white border border-gray-200 shadow-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all -mr-3 hover:bg-gray-50 hover:scale-105 active:scale-95 focus:outline-none"
          title="Cuộn phải"
        >
          <svg class="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>
        </button>
      </div>

      <div class="text-xs text-gray-500 font-mono flex items-center ml-auto pl-2 shrink-0">
        {#if agencyContext.tenCoQuan}
          <span class="mr-2 text-blue-600 font-semibold truncate max-w-[100px] lg:max-w-[150px]" title="{agencyContext.tenCoQuan}">
            ✓ {agencyContext.tenCoQuan}
          </span>
        {/if}
        
        <button class="lg:hidden ml-2 p-1.5 hover:bg-gray-100 rounded text-gray-600 transition-colors" on:click={() => showRightSidebarMobile = true} title="Mở trợ lý / công cụ">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
        </button>
      </div>
    </header>

    <!-- Canvas Scroll Area -->
    <div class="flex-1 overflow-y-auto py-10 px-4 relative" id="scroll-area">
      
      <!-- Nút Action (+) Nổi (Floating Add Block Button) -->
      {#if showPlusBtn || showBlockMenu}
        <button 
          on:click={toggleBlockMenu}
          class="fixed w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-800 transition-all z-40 animate-pop cursor-pointer border border-gray-300 shadow-sm"
          style="left: {plusBtnX}px; top: {plusBtnY}px;"
          title="Thêm Khối Hành chính"
        >
          <svg class="w-5 h-5 transition-transform {showBlockMenu ? 'rotate-45' : ''}" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
        </button>

        <!-- Menu Các Khối (Block Menu) -->
        {#if showBlockMenu}
          <div 
            class="fixed bg-white border border-gray-200 shadow-xl rounded-lg py-2 w-[320px] flex flex-col z-50 animate-pop overflow-y-auto max-h-[65vh]"
            style="left: {plusBtnX + 40}px; top: {plusBtnY}px;"
          >
            <div class="px-3 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 bg-gray-50 border-b border-gray-100">
              Khối Thông Minh (Smart Blocks)
            </div>
            {#each availableBlocks as item}
              <button 
                on:click|preventDefault={() => insertActionBlock(item.key, item.docType)}
                class="flex items-start px-3 py-2 hover:bg-blue-50 text-left transition-colors"
              >
                <span class="text-lg mr-3 bg-gray-100 rounded p-1 shadow-sm">{item.icon}</span>
                <div>
                  <div class="font-semibold text-gray-800 text-sm">{item.title}</div>
                  <div class="text-xs text-gray-500">{item.desc}</div>
                </div>
              </button>
            {/each}
          </div>
        {/if}
      {/if}

      <!-- The Editor Paper -->
      <div 
        id="main-editor"
        class="mx-auto bg-white shadow-xl focus:outline-none transition-all duration-500 {activeProfileConfig.paperClass} editor-with-placeholder"
        style="zoom: {zoomLevel}%;"
        contenteditable="true" 
        spellcheck="false"
        data-placeholder="Ấn '/' để chèn khối mẫu, hoặc 'AI Gen' để sáng tạo..."
        on:input={handleInput}
        on:keydown={handleEditorKeydown}
        on:contextmenu={handleContextMenu}
      >
        <!-- Content will be injected here by onMount (from localStorage or default) -->
      </div>
    </div>

    <!-- Floating Contextual Menu (Text Selection) -->
    {#if isTextSelected && !showSlashMenu && !showBlockMenu}
      <div 
        class="fixed bg-white/90 backdrop-blur-md border border-white/40 shadow-[0_12px_40px_-10px_rgba(79,70,229,0.25)] rounded-xl py-1.5 px-3 flex items-center space-x-0.5 z-50 animate-pop"
        style="left: {menuX}px; top: {menuY}px; transform: translate(-50%, -100%);"
      >
        <select on:change={(e) => execCmd('fontSize', e.target.value)} class="h-8 bg-transparent text-gray-700 text-sm font-medium hover:bg-indigo-50/80 rounded-md px-1 outline-none cursor-pointer border-none transition-colors" title="Cỡ chữ">
          <option value="1">Rất nhỏ</option>
          <option value="2">Nhỏ</option>
          <option value="3" selected>Vừa</option>
          <option value="4">Lớn</option>
          <option value="5">Rất lớn</option>
          <option value="6">Khổng lồ</option>
        </select>
        
        <div class="w-px h-5 bg-gray-200 mx-1.5"></div>
        
        <button on:click|preventDefault={() => execCmd('bold')} class="w-8 h-8 flex items-center justify-center hover:bg-indigo-50/80 rounded-md text-gray-700 font-bold transition-all active:scale-95" title="In đậm">B</button>
        <button on:click|preventDefault={() => execCmd('italic')} class="w-8 h-8 flex items-center justify-center hover:bg-indigo-50/80 rounded-md text-gray-700 italic font-serif transition-all active:scale-95" title="In nghiêng">I</button>
        <button on:click|preventDefault={() => execCmd('underline')} class="w-8 h-8 flex items-center justify-center hover:bg-indigo-50/80 rounded-md text-gray-700 underline transition-all active:scale-95" title="Gạch chân">U</button>
        <button on:click|preventDefault={() => execCmd('strikeThrough')} class="w-8 h-8 flex items-center justify-center hover:bg-indigo-50/80 rounded-md text-gray-700 line-through transition-all active:scale-95" title="Gạch ngang">S</button>
        
        <div class="w-px h-5 bg-gray-200 mx-1.5"></div>
        
        <div class="flex items-center space-x-1" title="Màu chữ & Nền">
          <div class="relative w-6 h-6 rounded-full overflow-hidden border border-gray-200 shadow-inner group hover:scale-110 transition-transform cursor-pointer">
            <input type="color" on:input={(e) => execCmd('foreColor', e.target.value)} class="absolute -top-2 -left-2 w-10 h-10 cursor-pointer" value="#000000" />
            <div class="absolute inset-0 flex items-center justify-center pointer-events-none text-[10px] font-bold text-white drop-shadow-md">A</div>
          </div>
          <div class="relative w-6 h-6 rounded-full overflow-hidden border border-gray-200 shadow-inner group hover:scale-110 transition-transform cursor-pointer">
            <input type="color" on:input={(e) => execCmd('hiliteColor', e.target.value)} class="absolute -top-2 -left-2 w-10 h-10 cursor-pointer" value="#ffff00" />
            <div class="absolute inset-0 flex items-center justify-center pointer-events-none text-[10px] font-bold text-white drop-shadow-md">🖌️</div>
          </div>
        </div>

        <div class="w-px h-5 bg-gray-200 mx-1.5"></div>

        <button on:click|preventDefault={() => execCmd('formatBlock', 'H1')} class="px-2 h-8 flex items-center justify-center hover:bg-indigo-50/80 rounded-md text-gray-700 font-bold text-sm transition-all active:scale-95" title="Tiêu đề 1">H1</button>
        <button on:click|preventDefault={() => execCmd('formatBlock', 'H2')} class="px-2 h-8 flex items-center justify-center hover:bg-indigo-50/80 rounded-md text-gray-700 font-semibold text-sm transition-all active:scale-95" title="Tiêu đề 2">H2</button>
        
        {#if currentProfile === 'novel'}
        <div class="w-px h-5 bg-gray-200 mx-1.5"></div>
        <button on:click|preventDefault={addNovelEvent} class="px-2 h-8 flex items-center justify-center hover:bg-yellow-50 text-yellow-700 font-bold text-xs transition-all active:scale-95 rounded-md" title="Tạo sự kiện từ văn bản được bôi đen">🎯 Tạo sự kiện</button>
        {/if}

        {#if currentProfile === 'teacher' || currentProfile === 'student'}
        {/if}

        <div class="w-px h-5 bg-gray-200 mx-1.5"></div>
        
        <button on:click|preventDefault={() => execCmd('removeFormat')} class="w-8 h-8 flex items-center justify-center hover:bg-red-50/80 text-gray-400 hover:text-red-500 rounded-md transition-all active:scale-95" title="Xóa định dạng (Clear Format)">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v8l9-11h-7z"></path></svg>
        </button>
      </div>
    {/if}

    <!-- Slash Command Menu -->
    {#if showSlashMenu}
      <div 
        class="fixed bg-white border border-gray-200 shadow-2xl rounded-lg py-2 w-64 flex flex-col z-50 animate-pop overflow-hidden"
        style="left: {slashMenuX}px; top: {slashMenuY}px;"
      >
        <div class="px-3 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 bg-gray-50 border-b border-gray-100">
          Chèn Khối Mẫu (Dùng mũi tên lên/xuống)
        </div>
        {#each filteredSlashItems as item, i}
          <button 
            on:click|preventDefault={() => insertSlashBlock(item.key, item.docType)}
            on:mouseenter={() => slashSelectedIndex = i}
            class="flex items-start px-3 py-2 text-left transition-colors {i === slashSelectedIndex ? 'bg-blue-100' : 'hover:bg-blue-50'}"
          >
            <span class="text-lg mr-3 bg-gray-100 rounded p-1 shadow-sm">{item.icon}</span>
            <div>
              <div class="font-semibold text-gray-800 text-sm">{item.title}</div>
              <div class="text-xs text-gray-500">{item.desc}</div>
            </div>
          </button>
        {:else}
          <div class="px-4 py-3 text-sm text-gray-500 text-center">Không tìm thấy mẫu phù hợp</div>
        {/each}
      </div>
    {/if}

    <!-- Mention Menu -->
    {#if showMentionMenu}
      <div 
        class="fixed bg-white border border-gray-200 shadow-2xl rounded-lg py-2 w-64 flex flex-col z-50 animate-pop overflow-hidden"
        style="left: {mentionMenuX}px; top: {mentionMenuY}px;"
      >
        <div class="px-3 py-1 text-xs font-semibold text-indigo-500 uppercase tracking-wider mb-1 bg-indigo-50 border-b border-indigo-100 flex items-center">
          <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
          Gọi tên Nhân vật
        </div>
        {#each filteredMentionItems as item, i}
          <button 
            on:click|preventDefault={() => insertMention(item)}
            on:mouseenter={() => mentionSelectedIndex = i}
            class="flex items-center px-3 py-2 text-left transition-colors {i === mentionSelectedIndex ? 'bg-indigo-100 text-indigo-800' : 'hover:bg-indigo-50 text-gray-700'} {item.name !== item.primaryName ? 'pl-8' : ''}"
          >
            {#if item.name !== item.primaryName}
              <span class="w-1.5 h-1.5 bg-indigo-300 rounded-full mr-2 opacity-60"></span>
            {/if}
            <span class="font-semibold {item.name !== item.primaryName ? 'text-xs opacity-80' : 'text-sm'} truncate">@{item.name}</span>
          </button>
        {:else}
          <div class="px-4 py-3 text-sm text-gray-500 text-center">Không tìm thấy nhân vật nào. Hãy tạo nhân vật ở menu bên trái!</div>
        {/each}
      </div>
    {/if}

  </main>

  <!-- Sidebar Phải (Template Sidebar / AI Chat) -->
  <aside class="w-80 bg-slate-50 border-l border-gray-200 shadow-inner z-30 transition-all duration-300 {showRightSidebarMobile ? 'fixed inset-y-0 right-0 flex flex-col' : 'hidden lg:flex flex-col'}">
      
      <!-- Tabs Header -->
      <div class="flex border-b border-gray-200 bg-white sticky top-0 z-10">
        {#if activeProfileConfig.hasRightTemplates}
        <button 
          on:click={() => rightSidebarTab = 'templates'}
          class="flex-1 py-3 text-sm font-semibold text-center border-b-2 transition-colors {rightSidebarTab === 'templates' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}"
        >
          Kho Mẫu
        </button>
        {/if}
        <button 
          on:click={() => rightSidebarTab = 'ai'}
          class="flex-1 py-3 text-sm font-semibold text-center border-b-2 transition-colors flex items-center justify-center {rightSidebarTab === 'ai' ? 'border-purple-600 text-purple-600' : 'border-transparent text-gray-500 hover:text-gray-700'}"
        >
          <svg class="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"></path></svg>
          Trợ lý AI
        </button>
        <button on:click={() => showRightSidebarMobile = false} class="lg:hidden px-3 hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors" title="Đóng">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
        </button>
      </div>

      <!-- Tab Content -->
      <div class="flex-1 overflow-y-auto relative h-full">
        {#if rightSidebarTab === 'templates' && activeProfileConfig.hasRightTemplates}
          <div class="p-4 overflow-y-auto">
            {#each Object.entries(getTemplatesByProfile(currentProfile).reduce((acc, tpl) => {
              const cat = tpl.category || 'Mẫu Chung';
              if (!acc[cat]) acc[cat] = [];
              acc[cat].push(tpl);
              return acc;
            }, {})) as [category, tpls]}
              <div class="mb-5">
                <h3 class="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 px-1 flex items-center">
                  <span class="w-1.5 h-1.5 rounded-full bg-blue-400 mr-2"></span>
                  {category}
                </h3>
                <div class="space-y-2">
                  {#each tpls as tpl}
                    <button 
                      on:click={() => insertTemplate(tpl.key, tpl.docType || undefined)}
                      class="w-full text-left bg-white border border-gray-100 rounded-md p-3 hover:shadow-sm hover:border-blue-300 transition-all flex flex-col items-start group"
                    >
                      <div class="flex items-center text-sm font-bold text-gray-800 mb-1 group-hover:text-blue-600">
                        <span class="mr-2 opacity-70 group-hover:opacity-100">{tpl.icon}</span> {tpl.name}
                      </div>
                      <div class="text-[11px] text-gray-500 leading-snug">{tpl.desc}</div>
                    </button>
                  {/each}
                </div>
              </div>
            {/each}
          </div>
        {:else}
          <div class="absolute inset-0">
            <AIChatPanel onInsert={handleAIInsert} {currentProfile} />
          </div>
        {/if}
      </div>
    </aside>
  </div>

  <!-- Status Bar (Bottom Footer) -->
  <footer class="h-8 bg-white border-t border-gray-200 flex items-center justify-between px-4 text-xs text-gray-600 z-20 shadow-[0_-2px_5px_rgba(0,0,0,0.02)] shrink-0">
    <div class="flex items-center space-x-4">
      <span class="font-medium text-blue-700 flex items-center">
        <span class="mr-1">{activeProfileConfig.icon}</span> {activeProfileConfig.name} Mode
      </span>
      <span class="w-px h-3 bg-gray-300"></span>
      <span class="flex items-center">
        <svg class="w-3.5 h-3.5 mr-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
        Số từ: <strong class="ml-1 text-gray-800">{wordCount}</strong>
      </span>
      <span class="w-px h-3 bg-gray-300"></span>
      <span class="flex items-center">
        {#if saveStatus === 'saving'}
          <svg class="animate-spin w-3.5 h-3.5 mr-1 text-orange-500" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path></svg>
          <span class="text-orange-600 font-medium">Đang lưu...</span>
        {:else}
          <svg class="w-3.5 h-3.5 mr-1 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
          <span class="text-green-600 font-medium">Đã lưu</span>
        {/if}
      </span>
    </div>
    
    <div class="flex items-center space-x-4">
      <span class="flex items-center">
        {#if aiStatus === 'loading'}
          <svg class="animate-pulse w-3.5 h-3.5 mr-1 text-purple-500" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L2 22h20L12 2zm0 4.5l6.5 13h-13L12 6.5z"></path></svg>
          <span class="text-purple-600 font-medium">AI đang viết...</span>
        {:else if aiStatus === 'error'}
          <span class="text-red-500 font-medium">❌ Lỗi AI</span>
        {:else if aiStatus === 'success'}
          <span class="text-green-600 font-medium">✨ AI hoàn tất</span>
        {:else}
          <span class="text-gray-400">⚡ AI Ready</span>
        {/if}
      </span>
      <span class="w-px h-3 bg-gray-300"></span>
      <span class="flex items-center text-gray-500 font-medium">
        <button on:click={() => zoomLevel = Math.max(50, zoomLevel - 10)} class="px-1.5 py-0.5 hover:bg-gray-100 rounded hover:text-blue-600 transition-colors" title="Thu nhỏ">-</button>
        <span class="w-10 text-center select-none" title="Tỉ lệ Zoom">{zoomLevel}%</span>
        <button on:click={() => zoomLevel = Math.min(200, zoomLevel + 10)} class="px-1.5 py-0.5 hover:bg-gray-100 rounded hover:text-blue-600 transition-colors" title="Phóng to">+</button>
      </span>
    </div>
  </footer>
</div>

<!-- Floating Donate Button -->
<button on:click={openDonate} class="fixed bottom-12 left-6 z-50 bg-[#5cb85c] hover:bg-[#4cae4c] text-white font-bold py-2.5 px-5 rounded-full shadow-lg transition-transform hover:scale-105 flex items-center print:hidden border border-[#4cae4c]">
  <svg class="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor"><path d="M23.881 8.948c-.773-4.085-4.859-4.593-4.859-4.593H.723c-.604 0-.679.798-.679.798s-.082 7.324-.022 11.822c.164 2.424 2.586 2.672 2.586 2.672s8.267-.023 11.966-.049c2.438-.426 2.683-2.566 2.658-3.734 4.352.24 7.422-2.831 6.649-6.916zm-11.062 3.511c-1.246 1.453-4.011 3.976-4.011 3.976s-.121.119-.31.023c-.076-.057-.108-.09-.108-.09-.443-.441-3.368-3.049-4.051-3.954-1.09-1.465-1.085-3.208.012-4.298 1.096-1.083 3.097-1.09 4.193.007l.28.282.281-.282c1.097-1.097 3.098-1.09 4.194-.007 1.097 1.09 1.103 2.833.012 4.298zM22.022 9.54c-.122 2.23-2.454 3.328-3.528 3.514V5.733c1.554.194 3.122 1.343 3.528 3.807z"/></svg>
  Ủng hộ tác giả
</button>

<!-- Timeline Modal -->
{#if showTimelineModal}
<div class="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center animate-fade-in backdrop-blur-sm">
  <div class="bg-white rounded-xl shadow-2xl w-[600px] max-h-[80vh] flex flex-col animate-scale-in">
    <!-- Header -->
    <div class="flex items-center justify-between p-5 border-b border-gray-200 bg-gray-50 rounded-t-xl">
      <div class="flex items-center space-x-3">
        <span class="text-3xl">👤</span>
        <div>
          <h2 class="text-xl font-bold text-gray-800">Dòng Sự Kiện</h2>
          <p class="text-indigo-600 font-semibold">Nhân vật: {timelineCharacter?.name}</p>
        </div>
      </div>
      <button on:click={() => showTimelineModal = false} class="text-gray-400 hover:text-red-500 transition-colors p-2 hover:bg-red-50 rounded-full">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
      </button>
    </div>
    
    <!-- Content -->
    <div class="flex-1 overflow-y-auto p-6 bg-slate-50">
      {#if timelineEvents.length === 0}
        <div class="text-center py-10 text-gray-500 flex flex-col items-center">
          <svg class="w-16 h-16 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          <p class="text-lg">Nhân vật này chưa xuất hiện trong dòng thời gian.</p>
          <p class="text-sm mt-1">Gõ @{timelineCharacter?.name} trong văn bản để tạo sự kiện!</p>
        </div>
      {:else}
        <div class="relative border-l-2 border-indigo-200 ml-4 space-y-6">
          {#each timelineEvents as event, index}
            <div class="relative pl-6">
              <!-- Timeline Dot -->
              <div class="absolute w-4 h-4 bg-indigo-500 rounded-full -left-[9px] top-1.5 border-4 border-slate-50"></div>
              
              <!-- Event Content -->
              <div class="bg-white p-4 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <div class="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-2">
                  Lần xuất hiện thứ {index + 1}
                </div>
                <!-- Remove the @Name tag from display to make it read like a story, or highlight it -->
                <p class="text-gray-700 leading-relaxed font-serif text-base">
                  <!-- Highlight the mention -->
                  {@html event.replace(new RegExp(`(@${timelineCharacter?.name})`, 'gi'), '<span class="text-indigo-600 font-bold bg-indigo-50 px-1 rounded">$1</span>')}
                </p>
              </div>
            </div>
          {/each}
        </div>
      {/if}
    </div>
  </div>
</div>
{/if}

<style>
  /* Base reset for contenteditable */
  [contenteditable="true"]:focus {
    outline: none;
  }
  
  :global(#main-editor.editor-with-placeholder[data-placeholder]:empty::before),
  :global(#main-editor.editor-with-placeholder[data-placeholder] > p:first-child:empty::before) {
    content: attr(data-placeholder);
    color: #a1a1aa;
    font-style: italic;
    pointer-events: none;
    float: left;
    height: 0;
  }
  
  /* Nghị định 30 Global Paragraph Rules */
  :global(.administrative-profile p) {
    text-indent: 1.27cm;
    margin-bottom: 8pt;
    text-align: justify;
    line-height: 1.5;
    margin-top: 0;
  }

  /* Contract Profile */
  :global(.contract-profile p) {
    text-align: justify;
    margin-bottom: 6pt;
    line-height: 1.5;
  }

  /* Education Profile - Math Sub/Superscript */
  :global(.education-profile sup) {
    color: #2563eb; /* Blue for formula */
    font-weight: bold;
  }
  :global(.education-profile sub) {
    color: #059669; /* Green for chemistry */
    font-weight: bold;
  }
  :global(.education-profile p) {
    margin-bottom: 8pt;
  }

  /* Novel Profile */
  :global(.novel-profile p) {
    text-indent: 2rem;
    margin-bottom: 0;
    margin-top: 0;
    color: #2c2c2c;
  }

  /* Poem Profile */
  :global(.poem-profile p) {
    text-align: center;
    margin-bottom: 0.5rem;
    font-style: italic;
  }

  /* Music Profile */
  :global(.music-profile p) {
    margin-bottom: 4px;
  }

  /* Pop animation for menus */
  @keyframes pop {
    0% { opacity: 0; transform: scale(0.95); }
    100% { opacity: 1; transform: scale(1); }
  }
  .animate-pop {
    animation: pop 0.1s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  }
</style>
