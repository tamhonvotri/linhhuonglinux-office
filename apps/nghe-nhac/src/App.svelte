<script lang="ts">
  let audioPlayer: HTMLAudioElement;
  let isPlaying = false;
  let currentFile: File | null = null;
  let progress = 0;
  let duration = 0;
  let currentTime = 0;
  let volume = 1;
  let showPlaylist = false;
  let playlist: File[] = [];

  function handleFileSelect(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      for (let i = 0; i < input.files.length; i++) {
        playlist = [...playlist, input.files[i]];
      }
      if (!currentFile && playlist.length > 0) {
        playFile(playlist[0]);
      }
    }
  }

  function playFile(file: File) {
    currentFile = file;
    const url = URL.createObjectURL(file);
    audioPlayer.src = url;
    audioPlayer.play();
    isPlaying = true;
  }

  function togglePlay() {
    if (!currentFile) return;
    if (isPlaying) {
      audioPlayer.pause();
    } else {
      audioPlayer.play();
    }
    isPlaying = !isPlaying;
  }

  function handleTimeUpdate() {
    currentTime = audioPlayer.currentTime;
    progress = (currentTime / duration) * 100 || 0;
  }

  function handleLoadedMetadata() {
    duration = audioPlayer.duration;
  }

  function seek(event: MouseEvent) {
    if (!duration) return;
    const progressBar = event.currentTarget as HTMLElement;
    const rect = progressBar.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const percentage = x / rect.width;
    audioPlayer.currentTime = percentage * duration;
  }

  function handleVolumeChange(event: Event) {
    const input = event.target as HTMLInputElement;
    volume = parseFloat(input.value);
    audioPlayer.volume = volume;
  }

  function formatTime(seconds: number) {
    if (isNaN(seconds)) return "00:00";
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }

  function nextTrack() {
    if (playlist.length === 0) return;
    const currentIndex = playlist.findIndex(f => f === currentFile);
    if (currentIndex < playlist.length - 1) {
      playFile(playlist[currentIndex + 1]);
    } else {
      playFile(playlist[0]);
    }
  }

  function prevTrack() {
    if (playlist.length === 0) return;
    const currentIndex = playlist.findIndex(f => f === currentFile);
    if (currentIndex > 0) {
      playFile(playlist[currentIndex - 1]);
    } else {
      playFile(playlist[playlist.length - 1]);
    }
  }
</script>

<div class="min-h-screen bg-slate-900 text-white font-sans flex flex-col selection:bg-indigo-500/30 overflow-hidden relative">
  <!-- Dynamic Background -->
  <div class="absolute inset-0 bg-gradient-to-br from-indigo-900 via-slate-900 to-purple-900 opacity-60"></div>
  <div class="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1614149162883-504ce4d13909?q=80&w=1200&auto=format&fit=crop')] bg-cover bg-center opacity-10 blur-3xl mix-blend-overlay {isPlaying ? 'animate-pulse-slow' : ''}"></div>
  
  <!-- Header -->
  <header class="relative z-10 flex justify-between items-center p-4 backdrop-blur-md border-b border-white/5">
    <div class="flex items-center space-x-3">
      <div class="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
        <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"></path></svg>
      </div>
      <h1 class="font-bold text-lg tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-indigo-200 to-purple-200">LinhHương Music</h1>
    </div>
    <div>
      <label class="cursor-pointer bg-white/10 hover:bg-white/20 px-4 py-2 rounded-full text-sm font-medium transition-colors border border-white/5 shadow-sm backdrop-blur-sm">
        + Thêm bài hát
        <input type="file" accept="audio/*" multiple class="hidden" on:change={handleFileSelect} />
      </label>
      <button class="ml-2 bg-white/5 hover:bg-white/15 px-4 py-2 rounded-full text-sm font-medium transition-colors border border-white/5" on:click={() => showPlaylist = !showPlaylist}>
        Danh sách ({playlist.length})
      </button>
    </div>
  </header>

  <!-- Main Content -->
  <main class="flex-1 relative z-10 flex flex-col items-center justify-center p-8">
    <!-- Vinyl / Album Art -->
    <div class="relative w-64 h-64 sm:w-80 sm:h-80 mb-10">
      <div class="absolute inset-0 bg-black rounded-full shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-slate-800 {isPlaying ? 'animate-spin-slow' : ''}">
        <div class="absolute inset-0 rounded-full bg-gradient-to-br from-white/10 to-transparent"></div>
        <!-- Grooves -->
        <div class="absolute inset-2 border border-white/5 rounded-full"></div>
        <div class="absolute inset-6 border border-white/5 rounded-full"></div>
        <div class="absolute inset-10 border border-white/5 rounded-full"></div>
        <div class="absolute inset-14 border border-white/5 rounded-full"></div>
        <div class="absolute inset-18 border border-white/5 rounded-full"></div>
        
        <!-- Center Label -->
        <div class="absolute inset-0 m-auto w-1/3 h-1/3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full shadow-inner border-4 border-slate-900 flex items-center justify-center">
          <div class="w-3 h-3 bg-slate-900 rounded-full"></div>
        </div>
      </div>
      <!-- Reflection -->
      <div class="absolute -inset-4 bg-gradient-to-t from-white/5 to-transparent rounded-full opacity-50 blur-xl pointer-events-none"></div>
    </div>

    <!-- Track Info -->
    <div class="text-center w-full max-w-lg mb-8">
      <h2 class="text-3xl sm:text-4xl font-extrabold truncate text-white mb-2 tracking-tight drop-shadow-md">
        {currentFile ? currentFile.name.replace(/\.[^/.]+$/, "") : "Chưa chọn bài hát"}
      </h2>
      <p class="text-indigo-200 text-sm font-medium truncate opacity-80">
        {currentFile ? "Linh Hương Linux OS" : "Vui lòng thêm file audio để phát"}
      </p>
    </div>
  </main>

  <!-- Control Bar -->
  <footer class="relative z-20 bg-black/40 backdrop-blur-xl border-t border-white/10 p-4 sm:p-6 pb-8">
    <div class="max-w-4xl mx-auto flex flex-col space-y-4">
      
      <!-- Progress Bar -->
      <div class="flex items-center space-x-4 text-xs font-mono text-slate-400">
        <span class="w-10 text-right">{formatTime(currentTime)}</span>
        <div class="flex-1 h-2 bg-slate-800 rounded-full cursor-pointer relative group overflow-hidden" on:click={seek}>
          <div class="absolute top-0 left-0 h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full" style="width: {progress}%"></div>
          <div class="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors"></div>
        </div>
        <span class="w-10">{formatTime(duration)}</span>
      </div>

      <!-- Controls -->
      <div class="flex items-center justify-between">
        <!-- Volume -->
        <div class="flex items-center space-x-2 w-1/4">
          <svg class="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.536 8.464a5 5 0 010 7.072M17.657 6.343a8 8 0 010 11.314M12 19c-2.21 0-4-1.79-4-4V9c0-2.21 1.79-4 4-4s4 1.79 4 4v6c0 2.21-1.79 4-4 4z"></path></svg>
          <input type="range" min="0" max="1" step="0.05" bind:value={volume} on:input={handleVolumeChange} class="w-20 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500" />
        </div>

        <!-- Main Buttons -->
        <div class="flex items-center justify-center space-x-6 flex-1">
          <button class="text-slate-400 hover:text-white transition-colors" on:click={prevTrack}>
            <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path d="M8.445 14.832A1 1 0 0010 14v-2.798l5.445 3.63A1 1 0 0017 14V6a1 1 0 00-1.555-.832L10 8.798V6a1 1 0 00-1.555-.832l-6 4a1 1 0 000 1.664l6 4z"></path></svg>
          </button>
          
          <button class="w-14 h-14 bg-white text-indigo-900 rounded-full flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(255,255,255,0.3)]" on:click={togglePlay}>
            {#if isPlaying}
              <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd"></path></svg>
            {:else}
              <svg class="w-6 h-6 ml-1" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clip-rule="evenodd"></path></svg>
            {/if}
          </button>

          <button class="text-slate-400 hover:text-white transition-colors" on:click={nextTrack}>
            <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path d="M11.555 5.168A1 1 0 0010 6v2.798l-5.445-3.63A1 1 0 003 6v8a1 1 0 001.555.832L10 11.202V14a1 1 0 001.555.832l6-4a1 1 0 000-1.664l-6-4z"></path></svg>
          </button>
        </div>

        <!-- Extra -->
        <div class="w-1/4 flex justify-end">
          <button class="text-slate-400 hover:text-white transition-colors" title="Loop">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
          </button>
        </div>
      </div>
    </div>
  </footer>

  <!-- Playlist Overlay -->
  {#if showPlaylist}
    <div class="absolute inset-y-0 right-0 w-80 bg-slate-900/95 backdrop-blur-2xl border-l border-white/10 z-30 flex flex-col transform transition-transform shadow-2xl">
      <div class="p-4 border-b border-white/10 flex justify-between items-center bg-white/5">
        <h3 class="font-bold text-lg">Danh sách phát</h3>
        <button on:click={() => showPlaylist = false} class="text-slate-400 hover:text-white">✕</button>
      </div>
      <div class="flex-1 overflow-y-auto p-2">
        {#if playlist.length === 0}
          <div class="text-center text-slate-500 mt-10 text-sm">Danh sách trống</div>
        {/else}
          {#each playlist as file, i}
            <!-- svelte-ignore a11y-click-events-have-key-events -->
            <!-- svelte-ignore a11y-no-static-element-interactions -->
            <div class="p-3 rounded-lg flex items-center space-x-3 cursor-pointer transition-colors {currentFile === file ? 'bg-indigo-500/20 border border-indigo-500/30' : 'hover:bg-white/5'}" on:click={() => playFile(file)}>
              <div class="text-xs text-slate-500 w-4">{i + 1}</div>
              <div class="flex-1 truncate text-sm {currentFile === file ? 'text-indigo-200 font-bold' : 'text-slate-300'}">{file.name}</div>
              {#if currentFile === file && isPlaying}
                <div class="w-3 h-3 flex space-x-0.5 items-end">
                  <div class="w-1 h-2 bg-indigo-400 animate-bounce" style="animation-delay: 0s"></div>
                  <div class="w-1 h-3 bg-indigo-400 animate-bounce" style="animation-delay: 0.1s"></div>
                  <div class="w-1 h-1 bg-indigo-400 animate-bounce" style="animation-delay: 0.2s"></div>
                </div>
              {/if}
            </div>
          {/each}
        {/if}
      </div>
    </div>
  {/if}

  <!-- Hidden Audio Element -->
  <audio
    bind:this={audioPlayer}
    on:timeupdate={handleTimeUpdate}
    on:loadedmetadata={handleLoadedMetadata}
    on:ended={nextTrack}
    class="hidden"
  ></audio>
</div>

<style>
  :global(.animate-spin-slow) {
    animation: spin 10s linear infinite;
  }
  :global(.animate-pulse-slow) {
    animation: pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  }
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
</style>
