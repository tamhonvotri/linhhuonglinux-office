<script lang="ts">
  import { onMount, tick } from 'svelte';
  
  export let onInsert: (text: string) => void;
  export let currentProfile: string = 'administrative';

  let messages: { role: 'user' | 'assistant', content: string }[] = [];
  let inputMessage = "";
  let isLoading = false;
  let chatContainer: HTMLElement;
  
  // API Endpoint configurability
  let apiEndpoint = "http://localhost:1234/v1/chat/completions";
  let apiKey = "lm-studio";
  
  // Model Management & RAM State
  let isAiEnabled = true;
  let showSettings = false;
  let systemRam = 8; // Default fallback in GB
  
  const models = [
    { id: 'linhhuonglinux-office', name: 'Linh Hương Office AI (7B)', ramRequired: 6 },
    { id: 'qwen-1.5-1.8b', name: 'Qwen Nhẹ (1.8B)', ramRequired: 2 },
    { id: 'llama3-8b', name: 'Llama 3 (8B)', ramRequired: 8 }
  ];
  
  let selectedModelId = "linhhuonglinux-office";
  $: selectedModel = models.find(m => m.id === selectedModelId) || models[0];
  $: ramPercentage = Math.min((selectedModel.ramRequired / systemRam) * 100, 100);
  $: isRamCritical = ramPercentage >= 80;
  
  onMount(() => {
    if (navigator && (navigator as any).deviceMemory) {
      systemRam = (navigator as any).deviceMemory;
    }
  });

  async function scrollToBottom() {
    await tick();
    if (chatContainer) {
      chatContainer.scrollTop = chatContainer.scrollHeight;
    }
  }

  async function sendMessage() {
    if (!isAiEnabled) {
      messages = [...messages, { role: 'assistant', content: "Hệ thống AI đang bị tắt. Vui lòng bật lại trong phần Quản lý Model để tiếp tục." }];
      setTimeout(scrollToBottom, 100);
      return;
    }

    if (!inputMessage.trim()) return;
    
    const userMessage = inputMessage.trim();
    messages = [...messages, { role: 'user', content: userMessage }];
    inputMessage = "";
    isLoading = true;
    scrollToBottom();
    
    // Add empty assistant message for streaming
    messages = [...messages, { role: 'assistant', content: "" }];
    
    try {
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: selectedModelId,
          messages: messages.slice(0, -1), // send history except the empty one
          stream: true
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder('utf-8');

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n').filter(line => line.trim() !== '');
          
          for (const line of lines) {
            if (line.replace(/^data: /, '') === '[DONE]') {
              break;
            }
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.substring(6));
                if (data.choices[0].delta?.content) {
                  messages[messages.length - 1].content += data.choices[0].delta.content;
                  messages = [...messages]; // trigger reactivity
                  scrollToBottom();
                }
              } catch (e) {
                // Parse error on incomplete chunks
              }
            }
          }
        }
      }
    } catch (error) {
      console.error("AI API Error:", error);
      messages[messages.length - 1].content = `[Lỗi kết nối API] Không thể truy cập tới mô hình AI. Vui lòng kiểm tra lại địa chỉ máy chủ: ${apiEndpoint}`;
      messages = [...messages];
    } finally {
      isLoading = false;
    }
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }
</script>

<div class="flex flex-col h-full bg-slate-50 relative">
  <!-- Header / Settings Toggle -->
  <div class="px-4 py-3 border-b border-gray-200 bg-white flex justify-between items-center shadow-sm z-10">
    <div class="flex items-center space-x-2">
      <div class="w-2 h-2 rounded-full {isAiEnabled ? 'bg-green-500' : 'bg-red-500'} animate-pulse"></div>
      <span class="font-bold text-gray-800 text-sm">Trợ lý AI</span>
    </div>
    <button on:click={() => showSettings = !showSettings} class="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors" title="Quản lý Model">
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
    </button>
  </div>

  {#if showSettings}
  <div class="bg-white border-b border-gray-200 p-4 space-y-4 shadow-inner absolute w-full z-20 top-12">
    <!-- Bật/Tắt AI -->
    <div class="flex items-center justify-between">
      <span class="text-sm font-semibold text-gray-700">Trạng thái AI</span>
      <label class="flex items-center cursor-pointer">
        <div class="relative">
          <input type="checkbox" bind:checked={isAiEnabled} class="sr-only">
          <div class="block bg-gray-300 w-10 h-6 rounded-full transition-colors {isAiEnabled ? 'bg-blue-600' : ''}"></div>
          <div class="dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform {isAiEnabled ? 'transform translate-x-4' : ''}"></div>
        </div>
      </label>
    </div>

    <!-- Chọn Model -->
    <div>
      <label class="block text-xs font-bold text-gray-500 mb-1">Mô hình Ngôn ngữ</label>
      <select bind:value={selectedModelId} disabled={!isAiEnabled} class="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none disabled:opacity-50">
        {#each models as m}
          <option value={m.id}>{m.name} ({m.ramRequired}GB RAM)</option>
        {/each}
      </select>
    </div>

    <!-- Phân tích RAM -->
    <div class="bg-gray-50 p-3 rounded-md border border-gray-100">
      <div class="flex justify-between text-xs mb-1">
        <span class="font-semibold text-gray-600">Mức sử dụng RAM</span>
        <span class="font-mono {isRamCritical ? 'text-red-600 font-bold' : 'text-gray-500'}">{selectedModel.ramRequired}GB / {systemRam}GB</span>
      </div>
      <div class="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
        <div class="h-2 rounded-full transition-all {isRamCritical ? 'bg-red-500' : 'bg-green-500'}" style="width: {ramPercentage}%"></div>
      </div>
      {#if isRamCritical}
        <div class="mt-2 text-xs text-red-600 bg-red-50 p-2 rounded flex items-start space-x-2">
          <svg class="w-4 h-4 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
          <div>
            <p class="font-bold">Gần quá giới hạn RAM!</p>
            <p>Máy có thể bị giật lag. Nên rẽ nhánh sang model nhẹ hơn.</p>
            <button on:click={() => selectedModelId = 'qwen-1.5-1.8b'} class="mt-1 text-blue-600 underline hover:text-blue-800">Chuyển sang Qwen Nhẹ</button>
          </div>
        </div>
      {/if}
    </div>
  </div>
  {/if}

  <!-- Messages -->
  <div bind:this={chatContainer} class="flex-1 overflow-y-auto p-4 space-y-4">
    {#if messages.length === 0}
      <div class="text-center text-gray-400 mt-10">
        {#if currentProfile === 'novel'}
          <span class="text-4xl mb-3 block">📖</span>
          <p class="text-sm">Trợ lý AI Hỗ trợ Nhà văn<br>Hãy thử hỏi: "Phân tích tâm lý nhân vật..."</p>
        {:else if currentProfile === 'poem'}
          <span class="text-4xl mb-3 block">🎭</span>
          <p class="text-sm">Trợ lý AI Hỗ trợ Làm thơ<br>Hãy thử hỏi: "Gieo vần cho câu thơ..."</p>
        {:else if currentProfile === 'music'}
          <span class="text-4xl mb-3 block">🎸</span>
          <p class="text-sm">Trợ lý AI Hỗ trợ Soạn nhạc<br>Hãy thử hỏi: "Gợi ý vòng hợp âm..."</p>
        {:else}
          <svg class="w-12 h-12 mx-auto text-blue-200 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path></svg>
          <p class="text-sm">Trợ lý AI chuyên môn<br>Hãy thử hỏi: "Soạn giúp tôi một đoạn trích yếu"</p>
        {/if}
      </div>
    {/if}

    {#each messages as msg}
      <div class="flex flex-col {msg.role === 'user' ? 'items-end' : 'items-start'}">
        <div class="max-w-[90%] rounded-2xl px-4 py-3 shadow-sm {msg.role === 'user' ? 'bg-blue-600 text-white rounded-tr-sm' : 'bg-white text-gray-800 border border-gray-200 rounded-tl-sm'}">
          <p class="whitespace-pre-wrap text-sm leading-relaxed font-sans">{msg.content}</p>
        </div>
        {#if msg.role === 'assistant' && msg.content && !isLoading}
          <button 
            on:click={() => onInsert(msg.content)}
            class="mt-1 text-xs text-blue-600 font-medium flex items-center hover:underline opacity-60 hover:opacity-100 transition-opacity"
          >
            <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"></path></svg>
            Chèn vào văn bản
          </button>
        {/if}
      </div>
    {/each}

    {#if isLoading}
      <div class="flex items-center text-gray-400 text-xs">
        <svg class="animate-spin -ml-1 mr-2 h-3 w-3 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
        AI đang soạn thảo...
      </div>
    {/if}
  </div>

  <!-- Quick Actions -->
  {#if currentProfile === 'novel' || currentProfile === 'poem' || currentProfile === 'music'}
  <div class="px-3 py-2 bg-gray-50 flex space-x-2 overflow-x-auto whitespace-nowrap hide-scrollbar border-t border-gray-200">
    {#if currentProfile === 'novel'}
      <button on:click={() => inputMessage = "Phân tích tâm lý nhân vật: "} class="text-xs font-semibold bg-white border border-gray-300 rounded-full px-3 py-1 hover:bg-indigo-50 hover:text-indigo-700 transition-colors">👤 Phân tích nhân vật</button>
      <button on:click={() => inputMessage = "Mở rộng tình tiết sau: "} class="text-xs font-semibold bg-white border border-gray-300 rounded-full px-3 py-1 hover:bg-yellow-50 hover:text-yellow-700 transition-colors">🎯 Phát triển tình tiết</button>
    {:else if currentProfile === 'poem'}
      <button on:click={() => inputMessage = "Gợi ý gieo vần cho câu thơ: "} class="text-xs font-semibold bg-white border border-gray-300 rounded-full px-3 py-1 hover:bg-pink-50 hover:text-pink-700 transition-colors">✨ Gieo vần</button>
      <button on:click={() => inputMessage = "Đánh giá cảm xúc đoạn thơ: "} class="text-xs font-semibold bg-white border border-gray-300 rounded-full px-3 py-1 hover:bg-purple-50 hover:text-purple-700 transition-colors">🎭 Phân tích cảm xúc</button>
    {:else if currentProfile === 'music'}
      <button on:click={() => inputMessage = "Gợi ý vòng hợp âm cho đoạn: "} class="text-xs font-semibold bg-white border border-gray-300 rounded-full px-3 py-1 hover:bg-blue-50 hover:text-blue-700 transition-colors">🎸 Hợp âm</button>
      <button on:click={() => inputMessage = "Sáng tác lời điệp khúc về chủ đề: "} class="text-xs font-semibold bg-white border border-gray-300 rounded-full px-3 py-1 hover:bg-green-50 hover:text-green-700 transition-colors">🎼 Viết điệp khúc</button>
    {/if}
  </div>
  {/if}

  <!-- Input Area -->
  <div class="p-3 bg-white border-t border-gray-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
    <div class="relative">
      <textarea 
        bind:value={inputMessage}
        on:keydown={handleKeydown}
        disabled={isLoading}
        placeholder="Nhắn tin cho AI (Shift+Enter để xuống dòng)..."
        class="w-full bg-gray-50 border border-gray-300 rounded-xl pl-3 pr-10 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white resize-none h-16 disabled:opacity-50"
      ></textarea>
      <button 
        on:click={sendMessage}
        disabled={isLoading || !inputMessage.trim()}
        class="absolute right-2 bottom-2 p-1.5 rounded-lg bg-blue-600 text-white disabled:bg-gray-300 transition-colors"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path></svg>
      </button>
    </div>
  </div>
</div>
