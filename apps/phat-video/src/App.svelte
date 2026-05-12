<script lang="ts">
  import { onMount } from 'svelte';

  let videoPlayer: HTMLVideoElement;
  let isPlaying = false;
  let currentFile: File | null = null;
  let progress = 0;
  let duration = 0;
  let currentTime = 0;
  let volume = 1;
  let isFullscreen = false;
  let showControls = true;
  let controlsTimeout: any;

  function handleFileSelect(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      playFile(input.files[0]);
    }
  }

  function playFile(file: File) {
    currentFile = file;
    const url = URL.createObjectURL(file);
    videoPlayer.src = url;
    videoPlayer.play();
    isPlaying = true;
  }

  function togglePlay() {
    if (!currentFile) return;
    if (isPlaying) {
      videoPlayer.pause();
    } else {
      videoPlayer.play();
    }
    isPlaying = !isPlaying;
  }

  function handleTimeUpdate() {
    currentTime = videoPlayer.currentTime;
    progress = (currentTime / duration) * 100 || 0;
  }

  function handleLoadedMetadata() {
    duration = videoPlayer.duration;
  }

  function seek(event: MouseEvent) {
    if (!duration) return;
    const progressBar = event.currentTarget as HTMLElement;
    const rect = progressBar.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const percentage = x / rect.width;
    videoPlayer.currentTime = percentage * duration;
  }

  function handleVolumeChange(event: Event) {
    const input = event.target as HTMLInputElement;
    volume = parseFloat(input.value);
    videoPlayer.volume = volume;
  }

  function formatTime(seconds: number) {
    if (isNaN(seconds)) return "00:00";
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }

  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  }

  onMount(() => {
    document.addEventListener('fullscreenchange', () => {
      isFullscreen = !!document.fullscreenElement;
    });

    const resetControlsTimeout = () => {
      showControls = true;
      clearTimeout(controlsTimeout);
      if (isPlaying) {
        controlsTimeout = setTimeout(() => {
          showControls = false;
        }, 3000);
      }
    };

    window.addEventListener('mousemove', resetControlsTimeout);
    window.addEventListener('keydown', resetControlsTimeout);

    return () => {
      window.removeEventListener('mousemove', resetControlsTimeout);
      window.removeEventListener('keydown', resetControlsTimeout);
    };
  });
</script>

<!-- svelte-ignore a11y-no-static-element-interactions -->
<div class="min-h-screen bg-black text-white font-sans flex flex-col relative overflow-hidden group" on:mousemove={() => showControls = true}>
  
  <!-- Video Element -->
  <!-- svelte-ignore a11y-media-has-caption -->
  <video
    bind:this={videoPlayer}
    class="absolute inset-0 w-full h-full object-contain"
    on:timeupdate={handleTimeUpdate}
    on:loadedmetadata={handleLoadedMetadata}
    on:click={togglePlay}
    on:dblclick={toggleFullscreen}
  ></video>

  {#if !currentFile}
    <div class="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/80 z-10">
      <div class="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-xl shadow-indigo-500/30 mb-6">
        <svg class="w-10 h-10 text-white ml-1" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clip-rule="evenodd"></path></svg>
      </div>
      <h1 class="text-3xl font-bold tracking-tight mb-2">LinhHương Cinema</h1>
      <p class="text-slate-400 mb-8">Trình phát video mượt mà, tối ưu phần cứng Linux</p>
      <label class="cursor-pointer bg-white text-black hover:bg-slate-200 px-8 py-3 rounded-full font-bold transition-all shadow-lg active:scale-95">
        Mở File Video
        <input type="file" accept="video/*" class="hidden" on:change={handleFileSelect} />
      </label>
    </div>
  {/if}

  <!-- Top Bar (Title) -->
  <div class="absolute top-0 left-0 w-full p-4 bg-gradient-to-b from-black/80 to-transparent z-20 transition-opacity duration-500 flex justify-between items-start {showControls || !isPlaying ? 'opacity-100' : 'opacity-0'}">
    <div>
      <h2 class="font-bold text-lg drop-shadow-md text-white">{currentFile ? currentFile.name : ''}</h2>
    </div>
    {#if currentFile}
      <label class="cursor-pointer bg-white/10 hover:bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-md text-xs font-semibold transition-colors border border-white/10 shadow-sm">
        Mở file khác
        <input type="file" accept="video/*" class="hidden" on:change={handleFileSelect} />
      </label>
    {/if}
  </div>

  <!-- Bottom Controls -->
  <div class="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black/90 via-black/50 to-transparent pt-16 pb-4 px-6 z-20 transition-opacity duration-500 {showControls || !isPlaying ? 'opacity-100' : 'opacity-0'}">
    {#if currentFile}
      <!-- Progress Bar -->
      <div class="flex items-center space-x-3 text-xs font-mono mb-4">
        <span>{formatTime(currentTime)}</span>
        <!-- svelte-ignore a11y-click-events-have-key-events -->
        <div class="flex-1 h-1.5 bg-white/20 rounded-full cursor-pointer relative group/progress" on:click={seek}>
          <div class="absolute top-0 left-0 h-full bg-indigo-500 rounded-full" style="width: {progress}%"></div>
          <div class="absolute top-1/2 -mt-2 -ml-2 w-4 h-4 bg-white rounded-full shadow opacity-0 group-hover/progress:opacity-100 transition-opacity pointer-events-none" style="left: {progress}%"></div>
        </div>
        <span>{formatTime(duration)}</span>
      </div>

      <!-- Control Buttons -->
      <div class="flex items-center justify-between">
        <!-- Left: Play/Pause & Volume -->
        <div class="flex items-center space-x-6">
          <button class="hover:text-indigo-400 transition-colors" on:click={togglePlay}>
            {#if isPlaying}
              <svg class="w-8 h-8" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd"></path></svg>
            {:else}
              <svg class="w-8 h-8" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clip-rule="evenodd"></path></svg>
            {/if}
          </button>
          
          <div class="flex items-center space-x-2 group/vol">
            <svg class="w-5 h-5 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.536 8.464a5 5 0 010 7.072M17.657 6.343a8 8 0 010 11.314M12 19c-2.21 0-4-1.79-4-4V9c0-2.21 1.79-4 4-4s4 1.79 4 4v6c0 2.21-1.79 4-4 4z"></path></svg>
            <input type="range" min="0" max="1" step="0.05" bind:value={volume} on:input={handleVolumeChange} class="w-0 group-hover/vol:w-20 transition-all duration-300 h-1 bg-white/30 rounded-lg appearance-none cursor-pointer accent-indigo-500 opacity-0 group-hover/vol:opacity-100" />
          </div>
        </div>

        <!-- Right: Fullscreen -->
        <div class="flex items-center space-x-4">
          <button class="hover:text-indigo-400 transition-colors" on:click={toggleFullscreen}>
            {#if isFullscreen}
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 20v-6h-6m6 0l-6 6m11-6v6h6m-6 0l6 6M9 4v6H3m6 0L3 4m11 6V4h6m-6 0l6-6"></path></svg>
            {:else}
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"></path></svg>
            {/if}
          </button>
        </div>
      </div>
    {/if}
  </div>
</div>
