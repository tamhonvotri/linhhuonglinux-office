<script lang="ts">
  import { onMount } from 'svelte';

  // State
  let directoryHandle: any = null;
  let images: any[] = [];
  let filterLevel = 'all'; // all, reject, neutral, keep, masterpiece
  let selectedIndices: Set<number> = new Set();
  let lightboxImage: any = null;
  
  // UI State
  let isDragging = false;

  async function loadFolder() {
    try {
      directoryHandle = await (window as any).showDirectoryPicker();
      await readDirectory();
    } catch (e) {
      console.error(e);
    }
  }

  async function readDirectory() {
    images = [];
    if (!directoryHandle) return;
    
    async function traverse(dirHandle: any) {
      for await (const entry of dirHandle.values()) {
        if (entry.kind === 'file') {
          if (entry.name.match(/\.(jpg|jpeg|png|webp|gif|svg|bmp|ico)$/i)) {
            const file = await entry.getFile();
            const url = URL.createObjectURL(file);
            images = [...images, {
              name: entry.name,
              url: url,
              file: file,
              level: 'neutral', // default level
              id: crypto.randomUUID()
            }];
          }
        } else if (entry.kind === 'directory') {
          await traverse(entry);
        }
      }
    }
    
    await traverse(directoryHandle);
  }

  function setLevel(image: any, level: string, event?: Event) {
    if (event) event.stopPropagation();
    image.level = level;
    images = [...images]; // trigger reactivity
    if (lightboxImage && lightboxImage.id === image.id) {
      lightboxImage = lightboxImage; // force lightbox reactivity
    }
  }

  function toggleSelect(index: number, event: MouseEvent) {
    const newSelected = new Set(selectedIndices);
    if (event.shiftKey) {
      if (newSelected.size > 0) {
        const lastSelected = Array.from(newSelected).pop()!;
        const start = Math.min(lastSelected, index);
        const end = Math.max(lastSelected, index);
        for (let i = start; i <= end; i++) {
          newSelected.add(i);
        }
      } else {
        newSelected.add(index);
      }
    } else if (event.metaKey || event.ctrlKey) {
      if (newSelected.has(index)) newSelected.delete(index);
      else newSelected.add(index);
    } else {
      newSelected.clear();
      newSelected.add(index);
    }
    selectedIndices = newSelected;
  }

  function openLightbox(img: any) {
    lightboxImage = img;
  }

  function closeLightbox() {
    lightboxImage = null;
  }

  function autoAdvance() {
    if (!lightboxImage) return;
    const idx = filteredImages.findIndex(i => i.id === lightboxImage.id);
    if (idx < filteredImages.length - 1) {
      lightboxImage = filteredImages[idx + 1];
    }
  }

  function handleKeydown(e: KeyboardEvent) {
    if (lightboxImage) {
      if (e.key === 'Escape') {
        closeLightbox();
        return;
      }
      
      const idx = filteredImages.findIndex(i => i.id === lightboxImage.id);
      
      if (e.key === 'ArrowLeft' && idx > 0) {
        lightboxImage = filteredImages[idx - 1];
      } else if (e.key === 'ArrowRight' && idx < filteredImages.length - 1) {
        lightboxImage = filteredImages[idx + 1];
      }
      
      if (['1', '2', '3', '4'].includes(e.key)) {
        if (e.key === '1') setLevel(lightboxImage, 'reject');
        if (e.key === '2') setLevel(lightboxImage, 'neutral');
        if (e.key === '3') setLevel(lightboxImage, 'keep');
        if (e.key === '4') setLevel(lightboxImage, 'masterpiece');
        setTimeout(autoAdvance, 150); // slight delay to see the UI reaction
      }
      
      return;
    }

    if (selectedIndices.size > 0) {
      if (e.key === '1') {
        Array.from(selectedIndices).forEach(i => images[i].level = 'reject');
        images = [...images];
      }
      if (e.key === '2') {
        Array.from(selectedIndices).forEach(i => images[i].level = 'neutral');
        images = [...images];
      }
      if (e.key === '3') {
        Array.from(selectedIndices).forEach(i => images[i].level = 'keep');
        images = [...images];
      }
      if (e.key === '4') {
        Array.from(selectedIndices).forEach(i => images[i].level = 'masterpiece');
        images = [...images];
      }
    }
  }

  onMount(() => {
    window.addEventListener('keydown', handleKeydown);
    return () => window.removeEventListener('keydown', handleKeydown);
  });

  $: filteredImages = images.filter(img => filterLevel === 'all' || img.level === filterLevel);

</script>

<div class="min-h-screen bg-zinc-950 text-white font-sans flex overflow-hidden">
  
  <!-- Sidebar -->
  <aside class="w-64 bg-black/50 backdrop-blur-3xl border-r border-white/10 flex flex-col z-20">
    <div class="p-6 border-b border-white/10 shrink-0">
      <div class="w-12 h-12 rounded-2xl bg-gradient-to-tr from-rose-500 to-orange-500 flex items-center justify-center shadow-[0_0_30px_rgba(244,63,94,0.4)] mb-4">
        <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
      </div>
      <h1 class="text-xl font-bold tracking-tight">LinhHương Gallery</h1>
      <p class="text-xs text-zinc-500 mt-1 font-medium">Smart AI Tagging Engine</p>
    </div>

    <div class="p-4 flex-1 overflow-y-auto">
      {#if !directoryHandle}
        <button class="w-full py-3 bg-white/10 hover:bg-white/20 rounded-xl font-bold transition-all flex items-center justify-center gap-2 border border-white/5 shadow-sm" on:click={loadFolder}>
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"></path></svg>
          Mở Thư Mục Ảnh
        </button>
      {:else}
        <div class="mb-4">
          <div class="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2 px-2">Bộ Lọc Thông Minh</div>
          <div class="space-y-1">
            <button class="w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors {filterLevel === 'all' ? 'bg-white/10 text-white' : 'text-zinc-400 hover:bg-white/5'}" on:click={() => filterLevel = 'all'}>
              Tất cả ảnh ({images.length})
            </button>
            <button class="w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-between {filterLevel === 'masterpiece' ? 'bg-amber-500/20 text-amber-300' : 'text-zinc-400 hover:bg-white/5'}" on:click={() => filterLevel = 'masterpiece'}>
              <span>Tuyệt đỉnh ({images.filter(i => i.level === 'masterpiece').length})</span>
              <span class="text-amber-500">★</span>
            </button>
            <button class="w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-between {filterLevel === 'keep' ? 'bg-emerald-500/20 text-emerald-300' : 'text-zinc-400 hover:bg-white/5'}" on:click={() => filterLevel = 'keep'}>
              <span>Ưng ý ({images.filter(i => i.level === 'keep').length})</span>
              <span class="text-emerald-500">✔</span>
            </button>
            <button class="w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-between {filterLevel === 'neutral' ? 'bg-blue-500/10 text-blue-300' : 'text-zinc-400 hover:bg-white/5'}" on:click={() => filterLevel = 'neutral'}>
              <span>Thường ({images.filter(i => i.level === 'neutral').length})</span>
              <span class="text-blue-400">-</span>
            </button>
            <button class="w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-between {filterLevel === 'reject' ? 'bg-rose-500/10 text-rose-300' : 'text-zinc-400 hover:bg-white/5'}" on:click={() => filterLevel = 'reject'}>
              <span>Loại bỏ ({images.filter(i => i.level === 'reject').length})</span>
              <span class="text-rose-500">✖</span>
            </button>
          </div>
        </div>

        <div class="p-3 bg-white/5 rounded-xl border border-white/10 text-xs text-zinc-400 leading-relaxed">
          <strong class="text-white block mb-1">Phím tắt:</strong>
          Click: Chọn ảnh<br>
          Shift+Click: Chọn nhiều<br>
          Phím 1-4: Gắn thẻ nhanh<br>
          DoubleClick: Xem lớn
        </div>
      {/if}
    </div>
  </aside>

  <!-- Main Content -->
  <main class="flex-1 relative bg-zinc-900/50 flex flex-col">
    <!-- Mesh Background -->
    <div class="absolute inset-0 pointer-events-none overflow-hidden z-0">
      <div class="absolute top-[20%] right-[10%] w-[40%] h-[40%] bg-rose-600/10 rounded-full blur-[120px] mix-blend-screen"></div>
      <div class="absolute bottom-[10%] left-[20%] w-[50%] h-[50%] bg-orange-600/10 rounded-full blur-[120px] mix-blend-screen"></div>
    </div>

    <!-- Toolbar -->
    <div class="h-16 border-b border-white/5 bg-black/20 backdrop-blur-xl flex items-center px-6 z-10 shrink-0">
      {#if directoryHandle}
        <div class="text-sm font-medium text-zinc-300">
          <span class="text-white">{directoryHandle.name}</span> / {filteredImages.length} mục
        </div>
        <div class="ml-auto flex items-center gap-2">
          {#if selectedIndices.size > 0}
            <span class="text-xs font-bold text-zinc-500 mr-2">Đã chọn {selectedIndices.size} ảnh</span>
            <button class="px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 transition-colors" on:click={() => Array.from(selectedIndices).forEach(i => setLevel(images[i], 'masterpiece'))}>Set ★</button>
            <button class="px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-colors" on:click={() => Array.from(selectedIndices).forEach(i => setLevel(images[i], 'keep'))}>Set ✔</button>
          {/if}
        </div>
      {/if}
    </div>

    <!-- Grid -->
    <div class="flex-1 overflow-y-auto p-6 z-10 custom-scrollbar">
      {#if !directoryHandle}
        <div class="h-full flex flex-col items-center justify-center text-zinc-500">
          <svg class="w-16 h-16 mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
          <p class="text-lg">Chưa mở thư mục nào</p>
        </div>
      {:else}
        <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 auto-rows-[200px]">
          {#each filteredImages as img, i (img.id)}
            <!-- svelte-ignore a11y-click-events-have-key-events -->
            <!-- svelte-ignore a11y-no-static-element-interactions -->
            <div 
              class="relative rounded-xl overflow-hidden cursor-pointer group select-none bg-black/40 border-2 transition-all duration-200 {selectedIndices.has(images.indexOf(img)) ? 'border-indigo-500 scale-[0.98]' : 'border-transparent hover:border-white/20'} {img.level === 'reject' ? 'opacity-30 grayscale' : ''} {img.level === 'masterpiece' ? 'ring-2 ring-amber-500 ring-offset-2 ring-offset-zinc-900' : ''} {img.level === 'keep' ? 'ring-2 ring-emerald-500 ring-offset-2 ring-offset-zinc-900' : ''}"
              on:click={(e) => toggleSelect(images.indexOf(img), e)}
              on:dblclick={() => openLightbox(img)}
            >
              <img src={img.url} alt={img.name} class="w-full h-full object-cover pointer-events-none group-hover:scale-110 transition-transform duration-700" loading="lazy" />
              
              <!-- Badges -->
              <div class="absolute top-2 right-2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button class="w-6 h-6 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-amber-500 hover:text-black transition-colors {img.level === 'masterpiece' ? 'bg-amber-500 text-black opacity-100' : ''}" on:click={(e) => setLevel(img, 'masterpiece', e)} title="Tuyệt đỉnh">★</button>
                <button class="w-6 h-6 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-emerald-500 hover:text-black transition-colors {img.level === 'keep' ? 'bg-emerald-500 text-black opacity-100' : ''}" on:click={(e) => setLevel(img, 'keep', e)} title="Ưng ý">✔</button>
                <button class="w-6 h-6 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-rose-500 hover:text-black transition-colors {img.level === 'reject' ? 'bg-rose-500 text-black opacity-100' : ''}" on:click={(e) => setLevel(img, 'reject', e)} title="Loại bỏ">✖</button>
              </div>

              <!-- Name bar -->
              <div class="absolute bottom-0 left-0 w-full p-2 bg-gradient-to-t from-black/80 to-transparent">
                <p class="text-[10px] font-medium text-white/90 truncate">{img.name}</p>
              </div>
            </div>
          {/each}
        </div>
      {/if}
    </div>
  </main>

  <!-- Lightbox -->
  {#if lightboxImage}
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <!-- svelte-ignore a11y-no-static-element-interactions -->
    <div class="fixed inset-0 z-50 bg-black/95 backdrop-blur-3xl flex flex-col" on:click={closeLightbox}>
      <div class="h-16 flex items-center justify-between px-6 shrink-0 bg-gradient-to-b from-black/50 to-transparent">
        <div class="text-sm font-bold text-white">{lightboxImage.name}</div>
        <button class="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors" on:click={closeLightbox}>
          <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
        </button>
      </div>
      <div class="flex-1 p-8 flex items-center justify-center overflow-hidden">
        <img src={lightboxImage.url} alt={lightboxImage.name} class="max-w-full max-h-full object-contain shadow-2xl" on:click|stopPropagation />
      </div>
      
      <!-- Lightbox Controls -->
      <div class="h-20 bg-gradient-to-t from-black/80 to-transparent flex items-center justify-center gap-4 shrink-0" on:click|stopPropagation>
        <button class="px-6 py-2 rounded-full font-bold text-sm transition-colors {lightboxImage.level === 'reject' ? 'bg-rose-500 text-white shadow-[0_0_20px_rgba(244,63,94,0.4)]' : 'bg-white/10 hover:bg-white/20 text-zinc-300'}" on:click={() => { setLevel(lightboxImage, 'reject'); setTimeout(autoAdvance, 150); }}>
          ✖ Loại (1)
        </button>
        <button class="px-6 py-2 rounded-full font-bold text-sm transition-colors {lightboxImage.level === 'neutral' ? 'bg-blue-500 text-white shadow-[0_0_20px_rgba(59,130,246,0.4)]' : 'bg-white/10 hover:bg-white/20 text-zinc-300'}" on:click={() => { setLevel(lightboxImage, 'neutral'); setTimeout(autoAdvance, 150); }}>
          - Thường (2)
        </button>
        <button class="px-6 py-2 rounded-full font-bold text-sm transition-colors {lightboxImage.level === 'keep' ? 'bg-emerald-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.4)]' : 'bg-white/10 hover:bg-white/20 text-zinc-300'}" on:click={() => { setLevel(lightboxImage, 'keep'); setTimeout(autoAdvance, 150); }}>
          ✔ Ưng ý (3)
        </button>
        <button class="px-6 py-2 rounded-full font-bold text-sm transition-colors {lightboxImage.level === 'masterpiece' ? 'bg-amber-500 text-black shadow-[0_0_20px_rgba(245,158,11,0.6)]' : 'bg-white/10 hover:bg-white/20 text-zinc-300'}" on:click={() => { setLevel(lightboxImage, 'masterpiece'); setTimeout(autoAdvance, 150); }}>
          ★ Tuyệt đỉnh (4)
        </button>
      </div>
    </div>
  {/if}
</div>

<style>
  .custom-scrollbar::-webkit-scrollbar {
    width: 8px;
  }
  .custom-scrollbar::-webkit-scrollbar-track {
    background: transparent;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background-color: rgba(255,255,255,0.1);
    border-radius: 20px;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background-color: rgba(255,255,255,0.2);
  }
</style>
