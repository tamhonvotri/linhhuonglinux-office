<script lang="ts">
  import { onMount } from 'svelte';

  let videoPlayer: HTMLVideoElement;
  let isPlaying = false;
  let currentFile: File | null = null;
  let playlist: File[] = [];
  let progress = 0;
  let duration = 0;
  let currentTime = 0;
  let volume = 1;
  let isFullscreen = false;
  let showControls = true;
  let controlsTimeout: any;
  let showPlaylist = false;
  let isHoveringControls = false;

  function resetControlsTimeout() {
    showControls = true;
    if (controlsTimeout) clearTimeout(controlsTimeout);
    if (isPlaying && !isHoveringControls && !showPlaylist) {
      controlsTimeout = setTimeout(() => {
        showControls = false;
      }, 3000);
    }
  }

  // AI Engines State
  let aiAudioEnabled = false;
  let aiVisionEnabled = false;

  // Web Audio API
  let audioContext: AudioContext;
  let sourceNode: MediaElementAudioSourceNode;
  let aiCompressor: DynamicsCompressorNode;
  let aiExciter: WaveShaperNode;
  let aiDryGain: GainNode;
  let aiWetGain: GainNode;
  let audioInitialized = false;

  function makeDistortionCurve(amount = 20) {
    const k = amount;
    const n_samples = 44100;
    const curve = new Float32Array(n_samples);
    const deg = Math.PI / 180;
    for (let i = 0; i < n_samples; ++i) {
      const x = (i * 2) / n_samples - 1;
      curve[i] = ((3 + k) * x * 20 * deg) / (Math.PI + k * Math.abs(x));
    }
    return curve;
  }

  function initAudio() {
    if (audioInitialized || !videoPlayer) return;
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      audioContext = new AudioContextClass();
      
      sourceNode = audioContext.createMediaElementSource(videoPlayer);
      
      aiCompressor = audioContext.createDynamicsCompressor();
      aiCompressor.threshold.value = -30; // Stronger compression for movie dialogues
      aiCompressor.knee.value = 20;
      aiCompressor.ratio.value = 6;
      aiCompressor.attack.value = 0.005;
      aiCompressor.release.value = 0.25;

      aiExciter = audioContext.createWaveShaper();
      aiExciter.curve = makeDistortionCurve(15);
      aiExciter.oversample = '4x';

      aiDryGain = audioContext.createGain();
      aiWetGain = audioContext.createGain();
      aiDryGain.gain.value = aiAudioEnabled ? 0 : 1;
      aiWetGain.gain.value = aiAudioEnabled ? 1 : 0;

      sourceNode.connect(aiDryGain);
      sourceNode.connect(aiWetGain);

      aiWetGain.connect(aiExciter);
      aiExciter.connect(aiCompressor);

      aiDryGain.connect(audioContext.destination);
      aiCompressor.connect(audioContext.destination);
      
      audioInitialized = true;
    } catch (e) {
      console.error("Audio Context Init Failed:", e);
    }
  }

  function toggleAIAudio() {
    aiAudioEnabled = !aiAudioEnabled;
    if (aiDryGain && aiWetGain && audioContext) {
      const now = audioContext.currentTime;
      aiDryGain.gain.setTargetAtTime(aiAudioEnabled ? 0 : 1, now, 0.1);
      aiWetGain.gain.setTargetAtTime(aiAudioEnabled ? 1 : 0, now, 0.1);
    }
  }

  function toggleAIVision() {
    aiVisionEnabled = !aiVisionEnabled;
  }

  function handleFileSelect(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const newFiles = Array.from(input.files);
      playlist = [...playlist, ...newFiles];
      if (!currentFile && playlist.length > 0) {
        playFile(playlist[0]);
      }
    }
  }

  function playFile(file: File) {
    currentFile = file;
    const url = URL.createObjectURL(file);
    videoPlayer.src = url;
    
    // Defer audio init to ensure user gesture
    if (!audioInitialized) {
      setTimeout(initAudio, 50);
    }
    
    videoPlayer.play().then(() => {
      if(audioContext && audioContext.state === 'suspended') audioContext.resume();
      isPlaying = true;
      resetControlsTimeout();
    }).catch(e => console.error("Playback failed:", e));
  }

  function removeTrack(file: File, event: Event) {
    event.stopPropagation();
    const isCurrent = (currentFile === file);
    playlist = playlist.filter(f => f !== file);
    
    if (isCurrent) {
      if (playlist.length > 0) {
        playFile(playlist[0]);
      } else {
        videoPlayer.pause();
        videoPlayer.src = '';
        currentFile = null;
        isPlaying = false;
        currentTime = 0;
        progress = 0;
      }
    }
  }

  function togglePlay() {
    if (!currentFile) return;
    if (isPlaying) {
      videoPlayer.pause();
      isPlaying = false;
    } else {
      videoPlayer.play();
      if(audioContext && audioContext.state === 'suspended') audioContext.resume();
      isPlaying = true;
    }
    resetControlsTimeout();
  }

  function nextTrack() {
    if (playlist.length <= 1) return;
    const currentIndex = playlist.indexOf(currentFile!);
    const nextIndex = (currentIndex + 1) % playlist.length;
    playFile(playlist[nextIndex]);
  }

  function prevTrack() {
    if (playlist.length <= 1) return;
    const currentIndex = playlist.indexOf(currentFile!);
    const prevIndex = (currentIndex - 1 + playlist.length) % playlist.length;
    playFile(playlist[prevIndex]);
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

    window.addEventListener('mousemove', resetControlsTimeout);
    window.addEventListener('keydown', resetControlsTimeout);
    window.addEventListener('click', resetControlsTimeout);

    return () => {
      window.removeEventListener('mousemove', resetControlsTimeout);
      window.removeEventListener('keydown', resetControlsTimeout);
      window.removeEventListener('click', resetControlsTimeout);
    };
  });
</script>

<div class="min-h-screen bg-zinc-950 text-white font-sans flex flex-col relative overflow-hidden group selection:bg-cyan-500/30 {(!showControls && isPlaying) ? 'cursor-none' : ''}">
  
  {#if !currentFile}
    <!-- Empty State / Mesh Background -->
    <div class="absolute inset-0 flex flex-col items-center justify-center z-10 overflow-hidden">
      <div class="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-cyan-600/20 rounded-full blur-[120px] pointer-events-none mix-blend-screen"></div>
      <div class="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none mix-blend-screen" style="animation-delay: 1s"></div>
      
      <div class="w-24 h-24 rounded-full bg-gradient-to-tr from-cyan-500 to-indigo-500 flex items-center justify-center shadow-[0_0_40px_rgba(6,182,212,0.4)] mb-8">
        <svg class="w-12 h-12 text-white ml-1" fill="currentColor" viewBox="0 0 24 24"><path fill-rule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z" clip-rule="evenodd"></path></svg>
      </div>
      <h1 class="text-4xl font-extrabold tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white to-white/70 mb-3">LinhHương Cinema</h1>
      <p class="text-zinc-400 mb-10 font-medium tracking-wide">Trình phát video AI-Enhanced Hi-Res Audio</p>
      <label class="cursor-pointer bg-white text-zinc-950 hover:bg-zinc-200 px-8 py-3 rounded-full font-bold transition-all shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:scale-105 active:scale-95 flex items-center gap-3">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4"></path></svg>
        Chọn Video
        <input type="file" accept="video/*" multiple class="hidden" on:change={handleFileSelect} />
      </label>
    </div>
  {/if}

  <!-- Video Element -->
  <!-- svelte-ignore a11y-media-has-caption -->
  <video
    bind:this={videoPlayer}
    class="absolute inset-0 w-full h-full object-contain transition-all duration-700 {aiVisionEnabled ? 'contrast-[1.15] saturate-[1.25] brightness-[1.05]' : ''}"
    on:timeupdate={handleTimeUpdate}
    on:loadedmetadata={handleLoadedMetadata}
    on:click={togglePlay}
    on:dblclick={toggleFullscreen}
    style="display: {currentFile ? 'block' : 'none'};"
  ></video>

  <!-- Top Glass Header -->
  <header class="absolute top-0 left-0 w-full px-6 py-4 z-40 transition-opacity duration-500 {showControls && currentFile ? 'opacity-100' : 'opacity-0 pointer-events-none'}" on:mouseenter={() => { isHoveringControls = true; resetControlsTimeout(); }} on:mouseleave={() => { isHoveringControls = false; resetControlsTimeout(); }}>
    <div class="max-w-7xl mx-auto flex justify-between items-start bg-black/40 backdrop-blur-2xl border border-white/10 rounded-3xl p-4 shadow-lg">
      <div class="flex items-center gap-4">
        <div class="w-10 h-10 rounded-full bg-gradient-to-tr from-cyan-500 to-indigo-500 flex items-center justify-center shadow-lg">
          <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
        </div>
        <div>
          <h2 class="font-extrabold text-sm text-white tracking-wide truncate max-w-sm">{currentFile ? currentFile.name : ''}</h2>
          <div class="text-[10px] font-bold tracking-widest text-zinc-400 uppercase mt-0.5">LinhHương Cinema</div>
        </div>
      </div>
      
      <div class="flex gap-3">
        {#if aiVisionEnabled}
          <div class="px-3 py-1.5 bg-cyan-500/20 text-cyan-200 text-[10px] rounded-full border border-cyan-500/50 font-bold tracking-widest uppercase shadow-[0_0_15px_rgba(6,182,212,0.3)] animate-pulse-slow flex items-center gap-1.5">
            AI Vision On
          </div>
        {/if}
        {#if aiAudioEnabled}
          <div class="px-3 py-1.5 bg-fuchsia-500/20 text-fuchsia-200 text-[10px] rounded-full border border-fuchsia-500/50 font-bold tracking-widest uppercase shadow-[0_0_15px_rgba(217,70,239,0.3)] flex items-center gap-1.5">
            AI Audio On
          </div>
        {/if}
        <button class="bg-white/5 hover:bg-white/10 px-4 py-2 rounded-full text-xs font-semibold transition-all border border-white/10 flex items-center gap-2 text-zinc-300 hover:text-white {showPlaylist ? 'bg-white/15 text-white' : ''}" on:click={() => showPlaylist = !showPlaylist}>
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 10h16M4 14h16M4 18h16"></path></svg>
          Playlist ({playlist.length})
        </button>
      </div>
    </div>
  </header>

  <!-- Bottom Floating Control Dock -->
  <footer class="absolute bottom-6 left-0 w-full px-6 z-40 transition-opacity duration-500 {showControls && currentFile && !isFullscreen ? 'opacity-100 transform translate-y-0' : (isFullscreen && showControls && currentFile) ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-4 pointer-events-none'}" on:mouseenter={() => { isHoveringControls = true; resetControlsTimeout(); }} on:mouseleave={() => { isHoveringControls = false; resetControlsTimeout(); }}>
    <div class="max-w-4xl mx-auto bg-black/60 backdrop-blur-3xl border border-white/10 rounded-3xl p-5 sm:px-8 shadow-[0_20px_50px_rgba(0,0,0,0.7)]">
      
      <!-- Progress Bar -->
      <div class="flex items-center space-x-4 text-[11px] font-bold tracking-widest text-zinc-400 mb-4">
        <span class="w-10 text-right tabular-nums">{formatTime(currentTime)}</span>
        <!-- svelte-ignore a11y-click-events-have-key-events -->
        <!-- svelte-ignore a11y-no-static-element-interactions -->
        <div class="flex-1 h-1.5 bg-white/10 rounded-full cursor-pointer relative group overflow-hidden" on:click={seek}>
          <div class="absolute top-0 left-0 h-full bg-cyan-400 rounded-full transition-all duration-100 ease-linear shadow-[0_0_15px_rgba(6,182,212,0.8)]" style="width: {progress}%"></div>
          <div class="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors"></div>
        </div>
        <span class="w-10 tabular-nums">{formatTime(duration)}</span>
      </div>

      <!-- Controls -->
      <div class="flex items-center justify-between">
        
        <!-- Left: Volume -->
        <div class="flex items-center space-x-3 w-1/4 group">
          <svg class="w-4 h-4 text-zinc-400 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.536 8.464a5 5 0 010 7.072M17.657 6.343a8 8 0 010 11.314M12 19c-2.21 0-4-1.79-4-4V9c0-2.21 1.79-4 4-4s4 1.79 4 4v6c0 2.21-1.79 4-4 4z"></path></svg>
          <input type="range" min="0" max="1" step="0.05" bind:value={volume} on:input={handleVolumeChange} class="w-24 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-cyan-400 hover:accent-cyan-300 transition-colors opacity-70 group-hover:opacity-100" />
        </div>

        <!-- Center: Playback -->
        <div class="flex items-center justify-center space-x-6 flex-1">
          <button class="text-zinc-400 hover:text-white hover:scale-110 active:scale-95 transition-all p-2" on:click={prevTrack}>
            <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M7.75 4.5a.75.75 0 0 0-1.5 0v15a.75.75 0 0 0 1.5 0v-15Z" /><path fill-rule="evenodd" d="M20.25 4.938c0-1.37-1.493-2.222-2.656-1.5l-9.375 5.86a1.75 1.75 0 0 0 0 2.964l9.375 5.86c1.163.722 2.656-.13 2.656-1.5V4.938Z" clip-rule="evenodd" /></svg>
          </button>
          
          <button class="w-16 h-16 bg-white text-zinc-950 rounded-full flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-[0_0_30px_rgba(255,255,255,0.3)]" on:click={togglePlay}>
            {#if isPlaying}
              <svg class="w-7 h-7" fill="currentColor" viewBox="0 0 24 24"><path fill-rule="evenodd" d="M6.75 5.25a.75.75 0 01.75-.75H9a.75.75 0 01.75.75v13.5a.75.75 0 01-.75.75H7.5a.75.75 0 01-.75-.75V5.25zm7.5 0a.75.75 0 01.75-.75h1.5a.75.75 0 01.75.75v13.5a.75.75 0 01-.75.75h-1.5a.75.75 0 01-.75-.75V5.25z" clip-rule="evenodd"></path></svg>
            {:else}
              <svg class="w-8 h-8 ml-1" fill="currentColor" viewBox="0 0 24 24"><path fill-rule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z" clip-rule="evenodd"></path></svg>
            {/if}
          </button>

          <button class="text-zinc-400 hover:text-white hover:scale-110 active:scale-95 transition-all p-2" on:click={nextTrack}>
            <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M16.25 4.5a.75.75 0 0 1 1.5 0v15a.75.75 0 0 1-1.5 0v-15Z" /><path fill-rule="evenodd" d="M3.75 4.938c0-1.37 1.493-2.222 2.656-1.5l9.375 5.86a1.75 1.75 0 0 1 0 2.964l-9.375 5.86c-1.163.722-2.656-.13-2.656-1.5V4.938Z" clip-rule="evenodd" /></svg>
          </button>
        </div>

        <!-- Right: AI Tools & Fullscreen -->
        <div class="w-1/4 flex justify-end items-center gap-3">
          <button class="text-[10px] font-bold tracking-widest px-2.5 py-1.5 rounded-lg border transition-all {aiVisionEnabled ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-200 shadow-[0_0_15px_rgba(6,182,212,0.3)]' : 'bg-white/5 border-white/10 text-zinc-400 hover:bg-white/10 hover:text-white'}" on:click={toggleAIVision} title="Tăng cường Hình ảnh (AI Vision)">
            VISION
          </button>
          <button class="text-[10px] font-bold tracking-widest px-2.5 py-1.5 rounded-lg border transition-all {aiAudioEnabled ? 'bg-fuchsia-500/20 border-fuchsia-500/50 text-fuchsia-200 shadow-[0_0_15px_rgba(217,70,239,0.3)]' : 'bg-white/5 border-white/10 text-zinc-400 hover:bg-white/10 hover:text-white'}" on:click={toggleAIAudio} title="Tăng cường Âm thanh hội thoại (AI Audio)">
            AUDIO
          </button>
          <div class="w-px h-6 bg-white/10 mx-1"></div>
          <button class="text-zinc-400 hover:text-white hover:scale-110 active:scale-95 transition-all p-2" on:click={toggleFullscreen}>
            {#if isFullscreen}
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 20v-6h-6m6 0l-6 6m11-6v6h6m-6 0l6 6M9 4v6H3m6 0L3 4m11 6V4h6m-6 0l6-6"></path></svg>
            {:else}
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"></path></svg>
            {/if}
          </button>
        </div>
      </div>
    </div>
  </footer>

  <!-- Playlist Overlay -->
  {#if showPlaylist}
    <div class="absolute inset-y-0 right-0 w-80 bg-zinc-950/90 backdrop-blur-3xl border-l border-white/10 z-50 flex flex-col transform transition-transform shadow-[0_0_50px_rgba(0,0,0,0.8)]">
      <div class="p-5 border-b border-white/10 flex justify-between items-center bg-white/5">
        <h3 class="font-bold text-sm tracking-widest text-zinc-200 uppercase">Danh sách Video</h3>
        <button on:click={() => showPlaylist = false} class="text-zinc-500 hover:text-white bg-white/5 hover:bg-white/10 rounded-full p-1.5 transition-colors">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
        </button>
      </div>
      
      <div class="p-4 border-b border-white/5">
        <label class="cursor-pointer w-full bg-white/5 hover:bg-white/10 border border-white/10 border-dashed rounded-xl py-3 flex items-center justify-center gap-2 text-xs font-bold tracking-wide text-zinc-300 transition-colors">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4"></path></svg>
          THÊM VIDEO
          <input type="file" accept="video/*" multiple class="hidden" on:change={handleFileSelect} />
        </label>
      </div>

      <div class="flex-1 overflow-y-auto p-3 custom-scrollbar">
        {#if playlist.length === 0}
          <div class="flex flex-col items-center justify-center mt-20 opacity-40">
            <svg class="w-12 h-12 mb-4 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z"></path></svg>
            <span class="text-sm font-medium tracking-wide">Chưa có video nào</span>
          </div>
        {:else}
          {#each playlist as file, i}
            <!-- svelte-ignore a11y-click-events-have-key-events -->
            <!-- svelte-ignore a11y-no-static-element-interactions -->
            <div class="p-3 mb-1.5 rounded-xl flex items-center space-x-3 cursor-pointer transition-all group {currentFile === file ? 'bg-cyan-500/20 border border-cyan-500/30 shadow-lg' : 'hover:bg-white/5 border border-transparent'}" on:click={() => playFile(file)}>
              <div class="w-12 h-8 bg-black rounded overflow-hidden flex-shrink-0 border border-white/10 relative">
                <svg class="w-4 h-4 text-white/50 absolute inset-0 m-auto" fill="currentColor" viewBox="0 0 24 24"><path fill-rule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z" clip-rule="evenodd"></path></svg>
              </div>
              <div class="flex-1 truncate text-xs font-medium tracking-wide {currentFile === file ? 'text-cyan-200' : 'text-zinc-400'}">{file.name}</div>
              <button class="w-6 h-6 hidden group-hover:flex items-center justify-center text-rose-400 hover:text-white hover:bg-rose-500 rounded transition-colors flex-shrink-0" on:click={(e) => removeTrack(file, e)} title="Xóa">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>
          {/each}
        {/if}
      </div>
    </div>
  {/if}
</div>
