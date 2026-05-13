<script lang="ts">
  import { onMount } from 'svelte';

  // --- STANDARD: "Cinematic Script" (Not Microsoft PowerPoint) ---
  // The LLM generates a JSON array of "Scenes". Each scene has an array of "Actors" (text, image, shape).
  // Actors enter, exit, or move based on user clicks (steps).
  
  let scriptContent = `[
  {
    "sceneId": "intro",
    "bg": "bg-slate-900",
    "note": "Xin chào mọi người. Hôm nay tôi sẽ giới thiệu về tương lai của trình chiếu - nơi chúng ta không dùng slide, mà dùng kịch bản điện ảnh.",
    "steps": [
      [
        { "id": "shape1", "type": "shape", "class": "absolute -top-32 -right-32 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl", "enter": "animate-fade-in" },
        { "id": "t1", "type": "text", "content": "Tương lai của Trình chiếu", "class": "text-6xl text-white font-bold text-center w-full mt-32", "enter": "animate-fade-in-up" }
      ],
      [
        { "id": "i1", "type": "image", "src": "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=1200&auto=format&fit=crop", "class": "absolute bottom-0 left-0 w-full h-64 object-cover opacity-50", "enter": "animate-slide-in-bottom" },
        { "id": "t2", "type": "text", "content": "Không phải Slide tĩnh. Đây là Kịch bản Điện ảnh.", "class": "text-2xl text-indigo-300 font-medium text-center w-full mt-8", "enter": "animate-fade-in" }
      ]
    ]
  },
  {
    "sceneId": "features",
    "bg": "bg-indigo-900",
    "note": "Điểm đặc biệt nhất là các hiệu ứng. Mọi thứ trôi chảy mượt mà, thu hút hoàn toàn sự tập trung của khán giả.",
    "steps": [
      [
        { "id": "t3", "type": "text", "content": "Hiệu ứng Mượt mà", "class": "absolute top-20 left-20 text-5xl text-white font-bold", "enter": "animate-slide-in-left" }
      ],
      [
        { "id": "i2", "type": "image", "src": "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=800&auto=format&fit=crop", "class": "absolute top-40 right-20 w-96 rounded-2xl shadow-2xl animate-float", "enter": "animate-scale-in" }
      ]
    ]
  }
]`;

  let scenes = [];
  let currentSceneIdx = 0;
  let currentStepIdx = 0;
  let activeActors = [];

  // Dual Monitor Logic
  let isPresenterMode = false;
  let isAudienceView = false;
  const channel = new BroadcastChannel('linhhuong_presentation_channel');

  // Editor Tabs
  let activeTab = 'visual'; // 'visual' | 'json' | 'templates'

  let draggedActorId = null;

  let jsonError = '';


  function parseScript() {
    try {
      const parsed = JSON.parse(scriptContent);
      scenes = parsed;
      jsonError = '';
      if (!isAudienceView) {
        updateAudience();
      }
      renderCurrentState();
    } catch (e) {
      jsonError = e.message;
    }
  }

  function toggleTailwindClass(actor, cls, conflicts = []) {
    let classes = (actor.class || '').split(' ').filter(Boolean);
    if (classes.includes(cls)) {
      classes = classes.filter(c => c !== cls);
    } else {
      classes = classes.filter(c => !conflicts.includes(c));
      classes.push(cls);
    }
    actor.class = classes.join(' ');
    updateFromVisual();
  }

  function handleImageUpload(event, actor) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        actor.src = e.target.result;
        updateFromVisual();
      };
      reader.readAsDataURL(file);
    }
  }

  function updateFromVisual() {
    scriptContent = JSON.stringify(scenes, null, 2);
    if (!isAudienceView) {
      updateAudience();
    }
    renderCurrentState();
  }

  function copyPromptToClipboard(type) {
    let prompt = '';
    if (type === 'basic') {
      prompt = `Hãy viết cho tôi một kịch bản Cinematic JSON Trình chiếu về chủ đề: "Lịch sử Việt Nam". \nSử dụng các đối tượng text, image, video. Mảng JSON phải đúng cấu trúc:\n[ { "sceneId": "intro", "bg": "bg-slate-900", "note": "Ghi chú...", "steps": [ [ { "id": "t1", "type": "text", "content": "Tiêu đề", "class": "text-4xl text-white", "enter": "animate-fade-in" } ] ] } ]\nVui lòng sử dụng class TailwindCSS và hiệu ứng animate-fade-in, animate-slide-in-left...`;
    } else if (type === 'product') {
      prompt = `Đóng vai một chuyên gia Apple, viết kịch bản Cinematic JSON Trình chiếu ra mắt sản phẩm mới (Smartphone). Mảng JSON phải đúng cấu trúc: [ { "sceneId": "...", "bg": "bg-black", "note": "...", "steps": [...] } ]. Kết hợp shape phát sáng mờ (blur-3xl) và các text xuất hiện ấn tượng (animate-fade-in-up, animate-scale-in).`;
    }
    navigator.clipboard.writeText(prompt);
    alert('Đã copy Prompt! Hãy dán vào ChatGPT / DeepSeek để tạo kịch bản.');
  }

  function renderCurrentState() {
    if (!scenes || scenes.length === 0) return;
    const scene = scenes[currentSceneIdx];
    
    let actorMap = new Map();
    for (let i = 0; i <= currentStepIdx; i++) {
      if (scene.steps[i]) {
        for (let a of scene.steps[i]) {
          actorMap.set(a.id, a);
        }
      }
    }
    activeActors = Array.from(actorMap.values());
  }

  function handleDragStart(e, actorId) {
    if (isAudienceView) return;
    draggedActorId = actorId;
  }

  function handleDragMove(e) {
    if (!draggedActorId || isAudienceView) return;
    const previewBox = document.getElementById('preview-box');
    if (!previewBox) return;
    const rect = previewBox.getBoundingClientRect();
    const percentX = ((e.clientX - rect.left) / rect.width) * 100;
    const percentY = ((e.clientY - rect.top) / rect.height) * 100;
    
    const actor = activeActors.find(a => a.id === draggedActorId);
    if (actor) {
      actor.x = percentX.toFixed(2);
      actor.y = percentY.toFixed(2);
      scriptContent = JSON.stringify(scenes, null, 2);
    }
  }

  function handleDragEnd() {
    if (draggedActorId && !isAudienceView) {
      updateAudience();
    }
    draggedActorId = null;
  }

  function nextStep() {
    if (scenes.length === 0) return;
    const scene = scenes[currentSceneIdx];
    if (currentStepIdx < scene.steps.length - 1) {
      currentStepIdx++;
    } else if (currentSceneIdx < scenes.length - 1) {
      currentSceneIdx++;
      currentStepIdx = 0;
    }
    renderCurrentState();
    updateAudience();
  }

  function prevStep() {
    if (scenes.length === 0) return;
    if (currentStepIdx > 0) {
      currentStepIdx--;
    } else if (currentSceneIdx > 0) {
      currentSceneIdx--;
      currentStepIdx = scenes[currentSceneIdx].steps.length - 1;
    }
    renderCurrentState();
    updateAudience();
  }

  function updateAudience() {
    if (isPresenterMode) {
      channel.postMessage({
        type: 'SYNC_STATE',
        sceneIdx: currentSceneIdx,
        stepIdx: currentStepIdx,
        script: scriptContent
      });
    }
  }

  onMount(() => {
    // Check if we are the audience window
    if (window.location.search.includes('audience=true')) {
      isAudienceView = true;
      document.title = "Presentation (Audience View)";
      channel.onmessage = (e) => {
        if (e.data.type === 'SYNC_STATE') {
          scriptContent = e.data.script;
          scenes = JSON.parse(scriptContent);
          currentSceneIdx = e.data.sceneIdx;
          currentStepIdx = e.data.stepIdx;
          renderCurrentState();
        }
      };
    } else {
      parseScript();
      
      // Auto-parse on typing timeout (debounce)
      let timeout;
      const editor = document.getElementById('script-editor');
      if (editor) {
        editor.addEventListener('input', () => {
          clearTimeout(timeout);
          timeout = setTimeout(parseScript, 500);
        });
      }
    }

    // Keyboard navigation
    window.addEventListener('keydown', (e) => {
      // Chỉ khi đang focus vào presentation view hoặc presenter mode
      if (e.target.tagName !== 'TEXTAREA' && e.target.tagName !== 'INPUT') {
        if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown') nextStep();
        if (e.key === 'ArrowLeft' || e.key === 'PageUp') prevStep();
      }
    });
  });

  function startDualScreen() {
    isPresenterMode = true;
    window.open(window.location.pathname + '?audience=true', 'AudienceView', 'width=1280,height=720');
    updateAudience();
  }

</script>

{#if isAudienceView}
  <!-- Audience View (Fullscreen output) -->
  <div class="w-screen h-screen overflow-hidden {scenes[currentSceneIdx]?.bg || 'bg-black'} relative transition-colors duration-1000">
    {#each activeActors as actor (actor.id)}
      <div class="absolute {actor.class} {actor.enter} transition-all duration-700" style="{(actor.x !== undefined ? `left: ${actor.x}%; ` : '')}{(actor.y !== undefined ? `top: ${actor.y}%; ` : '')}">
        {#if actor.type === 'text'}
          {@html actor.content}
        {:else if actor.type === 'image'}
          <img src={actor.src} alt="img" class="w-full h-full object-cover" />
        {:else if actor.type === 'video'}
          <video src={actor.src} class="w-full h-full object-cover" autoplay loop muted playsinline></video>
        {:else if actor.type === 'shape'}
          <div class="w-full h-full bg-current"></div>
        {/if}
      </div>
    {/each}
  </div>

{:else}
  <!-- Presenter / Editor View -->
  <div class="flex h-screen bg-slate-100 font-sans">
    <!-- Left: LLM Script Editor -->
    <div class="w-1/3 h-full border-r border-slate-300 bg-white flex flex-col shadow-xl z-10 overflow-hidden">
      <div class="p-4 bg-slate-800 text-white flex justify-between items-center shrink-0">
        <h2 class="font-bold text-lg flex items-center">
          <span class="text-indigo-400 mr-2 text-xl">🎬</span>
          Studio
        </h2>
        <div class="flex bg-slate-700 rounded-lg p-1">
          <button class="px-3 py-1 rounded text-sm font-medium transition-colors {activeTab === 'visual' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}" on:click={() => activeTab = 'visual'}>Trực quan</button>
          <button class="px-3 py-1 rounded text-sm font-medium transition-colors {activeTab === 'json' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}" on:click={() => activeTab = 'json'}>JSON</button>
          <button class="px-3 py-1 rounded text-sm font-medium transition-colors {activeTab === 'templates' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}" on:click={() => activeTab = 'templates'}>Kho AI</button>
        </div>
      </div>
      
      {#if activeTab === 'json'}
        <div class="p-3 bg-indigo-50 text-indigo-800 text-xs border-b border-indigo-100 shrink-0">
          Chỉnh sửa trực tiếp mã JSON. Sử dụng phím tắt hoặc Copy từ AI dán vào đây.
        </div>
        <textarea
          id="script-editor"
          bind:value={scriptContent}
          class="flex-1 w-full p-4 font-mono text-sm bg-slate-50 text-slate-800 outline-none resize-none focus:ring-inset focus:ring-2 focus:ring-indigo-500 transition-all {jsonError ? 'border-2 border-red-500 bg-red-50' : ''}"
          spellcheck="false"
        ></textarea>
        
        {#if jsonError}
          <div class="p-2 bg-red-100 text-red-600 text-xs font-mono font-bold shrink-0 border-t border-red-200">
            ⚠️ {jsonError}
          </div>
        {/if}
      {:else if activeTab === 'visual'}
        <div class="flex-1 overflow-y-auto bg-slate-50 p-4 custom-scrollbar">
          {#each scenes as scene, sIdx}
            <div class="mb-4 bg-white border {currentSceneIdx === sIdx ? 'border-indigo-500 shadow-md' : 'border-slate-200 shadow-sm'} rounded-xl overflow-hidden transition-all">
              <div class="p-3 bg-slate-100 border-b border-slate-200 flex justify-between items-center cursor-pointer hover:bg-slate-200 transition-colors" on:click={() => { currentSceneIdx = sIdx; currentStepIdx = 0; renderCurrentState(); updateAudience(); }}>
                <div class="font-bold text-slate-700 flex items-center gap-2">
                  <span class="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs">{sIdx + 1}</span>
                  Scene: {scene.sceneId}
                </div>
                <button class="text-rose-400 hover:text-rose-600 text-lg transition-colors px-2" on:click|stopPropagation={() => { scenes.splice(sIdx, 1); scenes=scenes; updateFromVisual(); }}>×</button>
              </div>
              <div class="p-3 space-y-3">
                <div>
                  <label class="text-xs font-bold text-slate-500 uppercase">Background Class</label>
                  <input type="text" bind:value={scene.bg} on:input={updateFromVisual} class="w-full mt-1 p-2 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
                <div>
                  <label class="text-xs font-bold text-slate-500 uppercase">Ghi chú (Note)</label>
                  <textarea bind:value={scene.note} on:input={updateFromVisual} class="w-full mt-1 p-2 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-indigo-500 outline-none" rows="2"></textarea>
                </div>
                
                <div class="mt-4">
                  <label class="text-xs font-bold text-slate-500 uppercase mb-2 block">Các Bước (Steps)</label>
                  {#each scene.steps as step, stIdx}
                    <div class="ml-2 pl-3 border-l-2 {currentSceneIdx === sIdx && currentStepIdx === stIdx ? 'border-indigo-500' : 'border-slate-200'} mb-3 relative group transition-colors">
                      <button class="absolute -left-[18px] top-0 bg-white rounded-full {currentSceneIdx === sIdx && currentStepIdx === stIdx ? 'text-indigo-600 shadow-md' : 'text-slate-300'} hover:text-indigo-500 transition-all z-10 w-8 h-8 flex items-center justify-center text-lg" on:click={() => { currentSceneIdx=sIdx; currentStepIdx=stIdx; renderCurrentState(); updateAudience(); }}>▶</button>
                      <div class="text-xs font-semibold text-slate-400 mb-2 pl-4">Step {stIdx + 1}</div>
                      <div class="pl-4 space-y-2">
                        {#each step as actor, aIdx}
                          <div class="bg-slate-50 p-2 rounded border border-slate-200 relative group/actor">
                            <button class="absolute -top-2 -right-2 w-5 h-5 bg-rose-500 text-white rounded-full text-xs font-bold opacity-0 group-hover/actor:opacity-100 transition-opacity" on:click={() => { step.splice(aIdx, 1); scenes=scenes; updateFromVisual(); }}>×</button>
                            <div class="flex gap-2">
                              <select bind:value={actor.type} on:change={updateFromVisual} class="w-24 p-1 border border-slate-300 rounded text-xs bg-white focus:outline-none focus:border-indigo-500">
                                <option value="text">Text</option>
                                <option value="image">Image</option>
                                <option value="video">Video</option>
                                <option value="shape">Shape</option>
                              </select>
                              <select bind:value={actor.enter} on:change={updateFromVisual} class="flex-1 p-1 border border-slate-300 rounded text-xs bg-white focus:outline-none focus:border-indigo-500">
                                <option value="animate-fade-in">Fade In</option>
                                <option value="animate-fade-in-up">Fade Up</option>
                                <option value="animate-slide-in-bottom">Slide Bottom</option>
                                <option value="animate-slide-in-left">Slide Left</option>
                                <option value="animate-scale-in">Scale In</option>
                                <option value="">Không có</option>
                              </select>
                            </div>
                            {#if actor.type === 'text'}
                              <input type="text" bind:value={actor.content} on:input={updateFromVisual} class="w-full mt-2 p-1.5 border border-slate-300 rounded text-sm focus:outline-none focus:border-indigo-500" placeholder="Nội dung chữ..." />
                              <div class="flex gap-1 mt-2 mb-1">
                                <button class="px-2 py-1 text-xs border border-slate-300 rounded hover:bg-slate-200 {actor.class?.includes('text-left') ? 'bg-indigo-100 border-indigo-300' : 'bg-white'}" on:click={() => toggleTailwindClass(actor, 'text-left', ['text-center', 'text-right'])}>
                                  <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h10M4 18h16" /></svg>
                                </button>
                                <button class="px-2 py-1 text-xs border border-slate-300 rounded hover:bg-slate-200 {actor.class?.includes('text-center') ? 'bg-indigo-100 border-indigo-300' : 'bg-white'}" on:click={() => toggleTailwindClass(actor, 'text-center', ['text-left', 'text-right'])}>
                                  <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M7 12h10M4 18h16" /></svg>
                                </button>
                                <button class="px-2 py-1 text-xs border border-slate-300 rounded hover:bg-slate-200 {actor.class?.includes('text-right') ? 'bg-indigo-100 border-indigo-300' : 'bg-white'}" on:click={() => toggleTailwindClass(actor, 'text-right', ['text-left', 'text-center'])}>
                                  <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M10 12h10M4 18h16" /></svg>
                                </button>
                                <div class="w-px bg-slate-300 mx-1"></div>
                                <button class="px-2 py-1 text-xs font-bold border border-slate-300 rounded hover:bg-slate-200 {actor.class?.includes('font-bold') ? 'bg-indigo-100 border-indigo-300' : 'bg-white'}" on:click={() => toggleTailwindClass(actor, 'font-bold', ['font-normal'])}>B</button>
                                <button class="px-2 py-1 text-xs italic border border-slate-300 rounded hover:bg-slate-200 {actor.class?.includes('italic') ? 'bg-indigo-100 border-indigo-300' : 'bg-white'}" on:click={() => toggleTailwindClass(actor, 'italic', [])}>I</button>
                                <div class="w-px bg-slate-300 mx-1"></div>
                                <button class="px-2 py-1 text-xs border border-slate-300 rounded hover:bg-slate-200 {actor.class?.includes('text-sm') ? 'bg-indigo-100 border-indigo-300' : 'bg-white'}" on:click={() => toggleTailwindClass(actor, 'text-sm', ['text-base', 'text-lg', 'text-2xl', 'text-4xl', 'text-6xl'])}>S</button>
                                <button class="px-2 py-1 text-xs border border-slate-300 rounded hover:bg-slate-200 {actor.class?.includes('text-2xl') ? 'bg-indigo-100 border-indigo-300' : 'bg-white'}" on:click={() => toggleTailwindClass(actor, 'text-2xl', ['text-xs', 'text-sm', 'text-base', 'text-lg', 'text-4xl', 'text-6xl'])}>M</button>
                                <button class="px-2 py-1 text-xs border border-slate-300 rounded hover:bg-slate-200 {actor.class?.includes('text-6xl') ? 'bg-indigo-100 border-indigo-300' : 'bg-white'}" on:click={() => toggleTailwindClass(actor, 'text-6xl', ['text-xs', 'text-sm', 'text-base', 'text-lg', 'text-2xl', 'text-4xl'])}>L</button>
                              </div>
                            {:else if actor.type === 'image' || actor.type === 'video'}
                              <div class="flex gap-2 mt-2">
                                <input type="text" bind:value={actor.src} on:input={updateFromVisual} class="flex-1 p-1.5 border border-slate-300 rounded text-sm focus:outline-none focus:border-indigo-500" placeholder="URL hình ảnh/video..." />
                                {#if actor.type === 'image'}
                                  <label class="px-3 py-1.5 bg-indigo-50 text-indigo-600 border border-indigo-200 rounded text-sm font-semibold cursor-pointer hover:bg-indigo-100 transition-colors">
                                    Up ảnh
                                    <input type="file" accept="image/*" class="hidden" on:change={(e) => handleImageUpload(e, actor)} />
                                  </label>
                                {/if}
                              </div>
                            {/if}
                            <input type="text" bind:value={actor.class} on:input={updateFromVisual} class="w-full mt-2 p-1 border border-slate-300 rounded text-xs font-mono text-indigo-600 focus:outline-none focus:border-indigo-500" placeholder="Tailwind classes bổ sung..." />
                          </div>
                        {/each}
                        <button class="w-full py-1.5 border border-dashed border-slate-300 rounded text-xs font-medium text-slate-500 hover:bg-slate-100 hover:text-indigo-600 transition-colors" on:click={() => { step.push({ id: 'new_' + Date.now(), type: 'text', content: 'Văn bản mới', class: 'text-2xl text-white', enter: 'animate-fade-in' }); scenes=scenes; updateFromVisual(); }}>+ Thêm Object</button>
                      </div>
                    </div>
                  {/each}
                  <button class="w-full mt-2 py-2 border border-slate-200 bg-slate-50 rounded-lg text-xs font-bold text-slate-500 hover:bg-slate-100 hover:text-indigo-600 transition-colors" on:click={() => { scene.steps.push([]); scenes=scenes; updateFromVisual(); }}>+ Thêm Step mới</button>
                </div>
              </div>
            </div>
          {/each}
          <button class="w-full py-3 border-2 border-dashed border-slate-300 rounded-xl text-slate-500 font-bold hover:border-indigo-400 hover:bg-indigo-50 hover:text-indigo-600 transition-all shadow-sm" on:click={() => { scenes = [...scenes, {sceneId: 'scene_' + (scenes.length+1), bg: 'bg-slate-900', note: '', steps: [[]]}]; updateFromVisual(); }}>+ TẠO SCENE MỚI</button>
        </div>
      {:else if activeTab === 'templates'}
        <div class="flex-1 overflow-y-auto bg-slate-50 p-6 space-y-6">
          <div>
            <h3 class="font-bold text-slate-800 text-lg mb-2">🤖 Khởi tạo bằng AI</h3>
            <p class="text-sm text-slate-600 mb-4">Sao chép một trong các câu lệnh (Prompt) dưới đây và dán vào ChatGPT, Claude hoặc DeepSeek để AI tự động tạo ra mã JSON hoàn chỉnh cho bạn.</p>
            
            <div class="space-y-4">
              <div class="bg-white border border-slate-200 p-4 rounded-xl shadow-sm relative group">
                <h4 class="font-bold text-indigo-600 text-sm mb-2">Thuyết trình Tiêu chuẩn</h4>
                <p class="text-xs text-slate-500 mb-3">Tạo slide cấu trúc gồm Tiêu đề, Điểm nhấn, Hình ảnh.</p>
                <button class="w-full py-2 bg-slate-100 hover:bg-indigo-50 text-indigo-700 text-sm font-bold rounded-lg transition-colors border border-slate-200" on:click={() => copyPromptToClipboard('basic')}>📋 Copy Prompt</button>
              </div>

              <div class="bg-white border border-slate-200 p-4 rounded-xl shadow-sm relative group">
                <h4 class="font-bold text-rose-500 text-sm mb-2">Ra mắt Sản phẩm (Apple Style)</h4>
                <p class="text-xs text-slate-500 mb-3">Tập trung vào nền đen, chữ to mờ ảo, hiệu ứng ánh sáng (blur) và viền đẹp mắt.</p>
                <button class="w-full py-2 bg-slate-100 hover:bg-rose-50 text-rose-600 text-sm font-bold rounded-lg transition-colors border border-slate-200" on:click={() => copyPromptToClipboard('product')}>📋 Copy Prompt</button>
              </div>
            </div>
          </div>
        </div>
      {/if}
      
      <div class="p-4 bg-white border-t border-slate-200 shrink-0">
        <button on:click={startDualScreen} class="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold py-3 rounded-xl shadow-lg transition-all active:scale-95 flex justify-center items-center">
          <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
          Mở màn hình khán giả (Dual Screen)
        </button>
      </div>
    </div>

    <!-- Right: Presenter Control & Preview -->
    <div class="flex-1 flex flex-col h-full bg-slate-200" on:mousemove={handleDragMove} on:mouseup={handleDragEnd} on:mouseleave={handleDragEnd}>
      <div class="p-4 bg-white border-b border-slate-300 flex justify-between items-center shadow-sm shrink-0">
        <div class="font-bold text-slate-700 text-lg">Bảng điều khiển (Presenter)</div>
        <div class="flex space-x-3 items-center">
          <span class="text-sm font-medium text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
            Scene {currentSceneIdx + 1}/{scenes.length} - Step {currentStepIdx + 1}/{scenes[currentSceneIdx]?.steps.length || 0}
          </span>
          <button on:click={prevStep} class="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold transition-colors">◀ Trước</button>
          <button on:click={nextStep} class="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold shadow-md transition-colors">Tiếp theo ▶</button>
        </div>
      </div>

      <!-- Preview Window -->
      <div class="flex-1 flex items-center justify-center p-8 overflow-hidden relative">
        <div class="w-full max-w-5xl aspect-video bg-black shadow-2xl rounded-lg overflow-hidden relative ring-4 ring-slate-800/20 transform scale-95 origin-center transition-transform hover:scale-100 duration-500">
          <div id="preview-box" class="w-full h-full relative {scenes[currentSceneIdx]?.bg || 'bg-black'} transition-colors duration-1000">
            {#each activeActors as actor (actor.id)}
              <div class="absolute {actor.class} {actor.enter} transition-all duration-700 cursor-move border-2 border-transparent hover:border-dashed hover:border-indigo-400" 
                   style="{(actor.x !== undefined ? `left: ${actor.x}%; ` : '')}{(actor.y !== undefined ? `top: ${actor.y}%; ` : '')}"
                   on:mousedown={(e) => handleDragStart(e, actor.id)}>
                {#if actor.type === 'text'}
                  {@html actor.content}
                {:else if actor.type === 'image'}
                  <img src={actor.src} alt="img" class="w-full h-full object-cover pointer-events-none" draggable="false" />
                {:else if actor.type === 'video'}
                  <video src={actor.src} class="w-full h-full object-cover pointer-events-none" autoplay loop muted playsinline draggable="false"></video>
                {:else if actor.type === 'shape'}
                  <div class="w-full h-full bg-current pointer-events-none"></div>
                {/if}
              </div>
            {/each}
          </div>
        </div>
      </div>
      
      <div class="p-4 bg-white border-t border-slate-300 min-h-[120px] max-h-[30vh] overflow-y-auto shrink-0 flex flex-col">
        <h3 class="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Ghi chú (Presenter Notes)</h3>
        <div class="text-slate-800 text-lg whitespace-pre-wrap leading-relaxed flex-1">
          {scenes[currentSceneIdx]?.note || 'Không có ghi chú cho Scene này.'}
        </div>
      </div>
      
      <div class="p-3 text-center text-slate-500 text-sm shrink-0 bg-slate-200">
        Sử dụng <kbd class="px-2 py-1 bg-white border border-slate-300 rounded mx-1 font-mono shadow-sm">Space</kbd> hoặc Mũi tên để điều hướng kịch bản.
      </div>
    </div>
  </div>
{/if}

<style>
  :global(body) {
    margin: 0;
    overflow: hidden;
  }
  
  /* --- Custom Animations --- */
  :global(.animate-fade-in) {
    animation: fadeIn 0.8s ease-out forwards;
  }
  :global(.animate-fade-in-up) {
    animation: fadeInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  }
  :global(.animate-slide-in-bottom) {
    animation: slideInBottom 1s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  }
  :global(.animate-slide-in-left) {
    animation: slideInLeft 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  }
  :global(.animate-scale-in) {
    animation: scaleIn 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
  }
  :global(.animate-float) {
    animation: float 6s ease-in-out infinite;
  }

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  @keyframes fadeInUp {
    from { opacity: 0; transform: translateY(40px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes slideInBottom {
    from { opacity: 0; transform: translateY(100%); }
    to { opacity: 0.5; transform: translateY(0); }
  }
  @keyframes slideInLeft {
    from { opacity: 0; transform: translateX(-100px); }
    to { opacity: 1; transform: translateX(0); }
  }
  @keyframes scaleIn {
    from { opacity: 0; transform: scale(0.8); }
    to { opacity: 1; transform: scale(1); }
  }
  @keyframes float {
    0% { transform: translateY(0px) rotate(0deg); }
    50% { transform: translateY(-20px) rotate(2deg); }
    100% { transform: translateY(0px) rotate(0deg); }
  }
  :global(.custom-scrollbar::-webkit-scrollbar) {
    width: 6px;
  }
  :global(.custom-scrollbar::-webkit-scrollbar-track) {
    background: transparent;
  }
  :global(.custom-scrollbar::-webkit-scrollbar-thumb) {
    background-color: #cbd5e1;
    border-radius: 10px;
  }
  :global(.custom-scrollbar::-webkit-scrollbar-thumb:hover) {
    background-color: #94a3b8;
  }
</style>
