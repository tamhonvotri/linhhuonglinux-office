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

  function renderCurrentState() {
    if (!scenes || scenes.length === 0) return;
    const scene = scenes[currentSceneIdx];
    
    // Thu thập tất cả actors từ step 0 đến currentStepIdx
    let newActors = [];
    for (let i = 0; i <= currentStepIdx; i++) {
      if (scene.steps[i]) {
        newActors = [...newActors, ...scene.steps[i]];
      }
    }
    activeActors = newActors;
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
      {#if actor.type === 'text'}
        <div class="absolute {actor.class} {actor.enter} transition-all duration-700">{@html actor.content}</div>
      {:else if actor.type === 'image'}
        <img src={actor.src} alt="img" class="absolute {actor.class} {actor.enter} transition-all duration-700" />
      {:else if actor.type === 'video'}
        <video src={actor.src} class="absolute {actor.class} {actor.enter} transition-all duration-700" autoplay loop muted playsinline></video>
      {:else if actor.type === 'shape'}
        <div class="absolute {actor.class} {actor.enter} transition-all duration-700"></div>
      {/if}
    {/each}
  </div>

{:else}
  <!-- Presenter / Editor View -->
  <div class="flex h-screen bg-slate-100 font-sans">
    <!-- Left: LLM Script Editor -->
    <div class="w-1/3 h-full border-r border-slate-300 bg-white flex flex-col shadow-xl z-10">
      <div class="p-4 bg-slate-800 text-white flex justify-between items-center shrink-0">
        <h2 class="font-bold text-lg flex items-center">
          <span class="text-indigo-400 mr-2 text-xl">🎬</span>
          Kịch bản Trình chiếu (JSON)
        </h2>
      </div>
      <div class="p-3 bg-indigo-50 text-indigo-800 text-xs border-b border-indigo-100">
        Thiết kế theo chuẩn "Cinematic Scene". LLM chỉ cần tạo JSON với các Scene và Step. Mỗi Step chứa các đối tượng xuất hiện.
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
      
      <div class="p-4 bg-white border-t border-slate-200 shrink-0">
        <button on:click={startDualScreen} class="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold py-3 rounded-xl shadow-lg transition-all active:scale-95 flex justify-center items-center">
          <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
          Mở màn hình khán giả (Dual Screen)
        </button>
      </div>
    </div>

    <!-- Right: Presenter Control & Preview -->
    <div class="flex-1 flex flex-col h-full bg-slate-200">
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
          <div class="w-full h-full relative {scenes[currentSceneIdx]?.bg || 'bg-black'} transition-colors duration-1000">
            {#each activeActors as actor (actor.id)}
              {#if actor.type === 'text'}
                <div class="absolute {actor.class} {actor.enter} transition-all duration-700">{@html actor.content}</div>
              {:else if actor.type === 'image'}
                <img src={actor.src} alt="img" class="absolute {actor.class} {actor.enter} transition-all duration-700" />
              {:else if actor.type === 'video'}
                <video src={actor.src} class="absolute {actor.class} {actor.enter} transition-all duration-700" autoplay loop muted playsinline></video>
              {:else if actor.type === 'shape'}
                <div class="absolute {actor.class} {actor.enter} transition-all duration-700"></div>
              {/if}
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
</style>
