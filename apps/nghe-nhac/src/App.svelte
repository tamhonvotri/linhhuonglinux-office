<script lang="ts">
  import { onMount } from 'svelte';

  let audioPlayer: HTMLAudioElement;
  let canvas: HTMLCanvasElement;
  let isPlaying = false;
  let currentFile: File | null = null;
  let progress = 0;
  let duration = 0;
  let currentTime = 0;
  let volume = 1;
  let showPlaylist = false;
  let showEQ = false;
  let playlist: File[] = [];

  // EQ state
  let bass = 0; // Range: -15 to 15
  let treble = 0; // Range: -15 to 15

  // Database helper for saving File objects
  const DB_NAME = 'LinhHuongMusicDB';
  const STORE_NAME = 'playlist_store';

  function openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, 1);
      request.onupgradeneeded = (e) => {
        const db = (e.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async function savePlaylistToDB() {
    try {
      const db = await openDB();
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).put(playlist, 'files');
    } catch (e) {
      console.error("Could not save playlist:", e);
    }
  }

  function saveConfig() {
    localStorage.setItem('lh_music_config', JSON.stringify({ bass, treble, volume }));
  }

  // Web Audio API
  let audioContext: AudioContext;
  let sourceNode: MediaElementAudioSourceNode;
  let bassFilter: BiquadFilterNode;
  let trebleFilter: BiquadFilterNode;
  let analyser: AnalyserNode;
  let audioInitialized = false;
  let animationId: number;

  function initAudio() {
    if (audioInitialized) return;
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    audioContext = new AudioContextClass();
    
    // Resume context if suspended (browser policy)
    if (audioContext.state === 'suspended') {
      audioContext.resume();
    }

    sourceNode = audioContext.createMediaElementSource(audioPlayer);
    
    bassFilter = audioContext.createBiquadFilter();
    bassFilter.type = 'lowshelf';
    bassFilter.frequency.value = 250;
    bassFilter.gain.value = bass;

    trebleFilter = audioContext.createBiquadFilter();
    trebleFilter.type = 'highshelf';
    trebleFilter.frequency.value = 4000;
    trebleFilter.gain.value = treble;

    analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;
    analyser.smoothingTimeConstant = 0.8;

    sourceNode.connect(bassFilter);
    bassFilter.connect(trebleFilter);
    trebleFilter.connect(analyser);
    analyser.connect(audioContext.destination);
    
    audioInitialized = true;
    drawVisualizer();
  }

  function drawVisualizer() {
    if (!canvas || !analyser) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    
    // Canvas dimensions
    const width = canvas.width;
    const height = canvas.height;
    
    function renderFrame() {
      animationId = requestAnimationFrame(renderFrame);
      analyser.getByteFrequencyData(dataArray);

      ctx.clearRect(0, 0, width, height);
      
      const barWidth = (width / bufferLength) * 2.5;
      let barHeight;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        barHeight = (dataArray[i] / 255) * height;

        // Gradient color
        const hue = i * 2;
        ctx.fillStyle = `hsla(${230 + hue}, 100%, 70%, 0.8)`;
        
        // Draw centered vertically
        const y = height - barHeight;
        ctx.fillRect(x, y, barWidth - 2, barHeight);
        
        x += barWidth;
      }
    }
    
    renderFrame();
  }

  function handleFileSelect(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      const newFiles = Array.from(input.files);
      playlist = [...playlist, ...newFiles];
      savePlaylistToDB();
      
      if (!currentFile && playlist.length > 0) {
        playFile(playlist[0]);
      }
    }
  }

  function playFile(file: File) {
    if (!audioInitialized) initAudio();
    if (audioContext && audioContext.state === 'suspended') {
      audioContext.resume();
    }
    
    currentFile = file;
    const url = URL.createObjectURL(file);
    audioPlayer.src = url;
    audioPlayer.play();
    isPlaying = true;
  }

  function togglePlay() {
    if (!currentFile) return;
    if (!audioInitialized) initAudio();
    if (audioContext && audioContext.state === 'suspended') {
      audioContext.resume();
    }

    if (isPlaying) {
      audioPlayer.pause();
    } else {
      audioPlayer.play();
    }
    isPlaying = !isPlaying;
  }

  function updateBass() {
    if (bassFilter) bassFilter.gain.value = bass;
    saveConfig();
  }

  function updateTreble() {
    if (trebleFilter) trebleFilter.gain.value = treble;
    saveConfig();
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
    saveConfig();
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
  
  function removeTrack(file: File, event: Event) {
    event.stopPropagation();
    const isCurrent = (currentFile === file);
    playlist = playlist.filter(f => f !== file);
    savePlaylistToDB();
    
    if (isCurrent) {
      if (playlist.length > 0) {
        playFile(playlist[0]);
      } else {
        audioPlayer.pause();
        audioPlayer.src = '';
        currentFile = null;
        isPlaying = false;
        currentTime = 0;
        progress = 0;
      }
    }
  }
  
  onMount(async () => {
    // Setup canvas sizing
    if (canvas) {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    }
    
    // Load config
    const config = localStorage.getItem('lh_music_config');
    if (config) {
      try {
        const parsed = JSON.parse(config);
        bass = parsed.bass || 0;
        treble = parsed.treble || 0;
        volume = parsed.volume !== undefined ? parsed.volume : 1;
      } catch (e) {}
    }
    
    // Load playlist
    try {
      const db = await openDB();
      const tx = db.transaction(STORE_NAME, 'readonly');
      const req = tx.objectStore(STORE_NAME).get('files');
      req.onsuccess = () => {
        if (req.result && req.result.length > 0) {
          playlist = req.result;
          // Apply initial volume immediately
          audioPlayer.volume = volume;
        }
      };
    } catch (e) {
      console.error("Could not load playlist:", e);
    }
  });
</script>

<div class="min-h-screen bg-zinc-950 text-white font-sans flex flex-col selection:bg-pink-500/30 overflow-hidden relative">
  <!-- Modern Mesh Gradient Background -->
  <div class="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-fuchsia-600/30 rounded-full blur-[120px] pointer-events-none mix-blend-screen {isPlaying ? 'animate-pulse-slow' : ''}"></div>
  <div class="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-violet-600/30 rounded-full blur-[120px] pointer-events-none mix-blend-screen {isPlaying ? 'animate-pulse-slow' : ''}" style="animation-delay: 1s"></div>
  <div class="absolute top-[20%] right-[10%] w-[30%] h-[30%] bg-cyan-500/20 rounded-full blur-[100px] pointer-events-none mix-blend-screen"></div>
  <div class="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1614149162883-504ce4d13909?q=80&w=1200&auto=format&fit=crop')] bg-cover bg-center opacity-[0.02] mix-blend-overlay pointer-events-none"></div>
  
  <!-- Floating Glass Header -->
  <header class="relative z-20 flex justify-between items-center px-6 py-4 mx-4 mt-4 bg-white/5 backdrop-blur-2xl border border-white/10 rounded-full shadow-lg shadow-black/20">
    <div class="flex items-center space-x-3">
      <div class="w-9 h-9 rounded-full bg-gradient-to-tr from-fuchsia-500 to-cyan-400 flex items-center justify-center shadow-[0_0_15px_rgba(217,70,239,0.4)]">
        <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"></path></svg>
      </div>
      <h1 class="font-extrabold text-lg tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white to-white/70">LinhHương Audio</h1>
    </div>
    <div class="flex gap-3">
      <button class="bg-white/5 hover:bg-white/10 px-5 py-2.5 rounded-full text-xs font-semibold transition-all border border-white/10 flex items-center gap-2 {showEQ ? 'bg-fuchsia-500/20 border-fuchsia-500/50 text-fuchsia-200' : 'text-zinc-300 hover:text-white'}" on:click={() => showEQ = !showEQ}>
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"></path></svg>
        EQ
      </button>
      <label class="cursor-pointer bg-white text-zinc-900 hover:bg-zinc-200 hover:scale-105 active:scale-95 px-5 py-2.5 rounded-full text-xs font-bold transition-all shadow-[0_0_20px_rgba(255,255,255,0.2)] flex items-center gap-2">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4"></path></svg>
        Thêm nhạc
        <input type="file" accept="audio/*" multiple class="hidden" on:change={handleFileSelect} />
      </label>
      <button class="bg-white/5 hover:bg-white/10 px-5 py-2.5 rounded-full text-xs font-semibold transition-all border border-white/10 flex items-center gap-2 text-zinc-300 hover:text-white {showPlaylist ? 'bg-white/15 text-white' : ''}" on:click={() => showPlaylist = !showPlaylist}>
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 10h16M4 14h16M4 18h16"></path></svg>
        Playlist ({playlist.length})
      </button>
    </div>
  </header>

  <!-- Main Content -->
  <main class="flex-1 relative z-10 flex flex-col items-center justify-center p-4 sm:p-8 overflow-hidden pt-8">
    
    <!-- Audio Visualizer Canvas -->
    <div class="absolute bottom-0 left-0 w-full h-2/5 opacity-50 pointer-events-none mix-blend-screen">
      <canvas bind:this={canvas} class="w-full h-full block"></canvas>
    </div>

    <!-- Vinyl / Album Art -->
    <div class="relative w-64 h-64 sm:w-[360px] sm:h-[360px] mb-12 z-10 mt-4 group">
      <div class="absolute inset-0 bg-[#0a0a0a] rounded-full shadow-[0_30px_60px_rgba(0,0,0,0.8),0_0_100px_rgba(217,70,239,0.15)] border border-zinc-800 transition-transform duration-500 ease-out {isPlaying ? 'animate-spin-slow scale-100' : 'scale-95'}">
        <div class="absolute inset-0 rounded-full bg-gradient-to-br from-white/10 to-transparent"></div>
        <!-- Realistic Grooves -->
        <div class="absolute inset-3 border border-white/5 rounded-full shadow-inner"></div>
        <div class="absolute inset-[1.2rem] border border-white/5 rounded-full"></div>
        <div class="absolute inset-[2.5rem] border border-white/5 rounded-full shadow-inner"></div>
        <div class="absolute inset-[3.5rem] border border-white/5 rounded-full"></div>
        <div class="absolute inset-[5rem] border border-white/5 rounded-full shadow-inner"></div>
        
        <!-- Center Label -->
        <div class="absolute inset-0 m-auto w-[35%] h-[35%] bg-gradient-to-tr from-fuchsia-600 via-purple-600 to-cyan-500 rounded-full shadow-inner border-8 border-[#111] flex items-center justify-center overflow-hidden">
          <div class="absolute inset-0 bg-black/10 mix-blend-multiply"></div>
          <div class="absolute w-full h-full bg-[url('https://images.unsplash.com/photo-1614149162883-504ce4d13909?q=80&w=1200&auto=format&fit=crop')] bg-cover opacity-20"></div>
          <div class="w-4 h-4 bg-zinc-950 rounded-full z-10 shadow-sm border border-zinc-800/50"></div>
        </div>
      </div>
      <!-- Reflection -->
      <div class="absolute -inset-10 bg-gradient-to-t from-white/5 to-transparent rounded-full opacity-30 blur-2xl pointer-events-none mix-blend-overlay"></div>
    </div>

    <!-- Track Info -->
    <div class="text-center w-full max-w-2xl mb-12 z-10 px-4">
      <h2 class="text-3xl sm:text-5xl font-extrabold truncate text-white mb-3 tracking-tighter drop-shadow-lg">
        {currentFile ? currentFile.name.replace(/\.[^/.]+$/, "") : "Not Playing"}
      </h2>
      <div class="flex items-center justify-center gap-3">
        <span class="px-2.5 py-1 bg-white/10 text-zinc-300 text-xs rounded-md border border-white/10 font-medium tracking-wide uppercase shadow-sm backdrop-blur-md">Lossless Engine</span>
        <span class="text-zinc-400 text-sm font-medium tracking-wide">LinhHương OS</span>
      </div>
    </div>
  </main>

  <!-- EQ Panel Overlay -->
  {#if showEQ}
    <div class="absolute bottom-40 left-1/2 -translate-x-1/2 bg-zinc-900/80 backdrop-blur-3xl border border-white/10 rounded-3xl p-6 z-30 shadow-[0_30px_60px_rgba(0,0,0,0.6)] w-80 animate-fade-in-up">
      <div class="flex justify-between items-center mb-6">
        <h3 class="font-bold text-sm text-white tracking-widest uppercase flex items-center gap-2">
          <svg class="w-4 h-4 text-fuchsia-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"></path></svg>
          Equalizer
        </h3>
        <button on:click={() => showEQ = false} class="text-zinc-500 hover:text-white transition-colors bg-white/5 hover:bg-white/10 p-1.5 rounded-full">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
        </button>
      </div>
      
      <div class="space-y-6">
        <div>
          <div class="flex justify-between text-xs text-zinc-400 mb-2 font-semibold tracking-wide">
            <span>BASS</span>
            <span class={bass > 0 ? 'text-fuchsia-400' : bass < 0 ? 'text-zinc-500' : 'text-zinc-300'}>{bass > 0 ? '+'+bass : bass} dB</span>
          </div>
          <input type="range" min="-15" max="15" step="1" bind:value={bass} on:input={updateBass} class="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-fuchsia-500" />
        </div>
        
        <div>
          <div class="flex justify-between text-xs text-zinc-400 mb-2 font-semibold tracking-wide">
            <span>TREBLE</span>
            <span class={treble > 0 ? 'text-cyan-400' : treble < 0 ? 'text-zinc-500' : 'text-zinc-300'}>{treble > 0 ? '+'+treble : treble} dB</span>
          </div>
          <input type="range" min="-15" max="15" step="1" bind:value={treble} on:input={updateTreble} class="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-cyan-400" />
        </div>
        
        <div class="pt-2">
          <button class="w-full text-xs font-semibold bg-white/5 hover:bg-white/10 py-2.5 rounded-xl text-zinc-300 transition-all active:scale-95" on:click={() => {bass=0; treble=0; updateBass(); updateTreble();}}>Khôi phục mặc định</button>
        </div>
      </div>
    </div>
  {/if}

  <!-- Control Bar Floating Dock -->
  <footer class="relative z-40 mx-4 mb-6">
    <div class="max-w-4xl mx-auto bg-zinc-900/60 backdrop-blur-3xl border border-white/10 rounded-3xl p-5 sm:px-8 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
      
      <!-- Progress Bar -->
      <div class="flex items-center space-x-4 text-[11px] font-bold tracking-widest text-zinc-400 mb-4">
        <span class="w-10 text-right tabular-nums">{formatTime(currentTime)}</span>
        <div class="flex-1 h-1.5 bg-white/5 rounded-full cursor-pointer relative group overflow-hidden" on:click={seek}>
          <div class="absolute top-0 left-0 h-full bg-white rounded-full transition-all duration-100 ease-linear shadow-[0_0_10px_rgba(255,255,255,0.8)]" style="width: {progress}%"></div>
          <div class="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors"></div>
        </div>
        <span class="w-10 tabular-nums">{formatTime(duration)}</span>
      </div>

      <!-- Controls -->
      <div class="flex items-center justify-between">
        <!-- Volume -->
        <div class="flex items-center space-x-3 w-1/4 group">
          <svg class="w-4 h-4 text-zinc-400 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.536 8.464a5 5 0 010 7.072M17.657 6.343a8 8 0 010 11.314M12 19c-2.21 0-4-1.79-4-4V9c0-2.21 1.79-4 4-4s4 1.79 4 4v6c0 2.21-1.79 4-4 4z"></path></svg>
          <input type="range" min="0" max="1" step="0.05" bind:value={volume} on:input={handleVolumeChange} class="w-24 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-white hover:accent-zinc-200 transition-colors opacity-70 group-hover:opacity-100" />
        </div>

        <!-- Main Buttons -->
        <div class="flex items-center justify-center space-x-6 flex-1">
          <button class="text-zinc-400 hover:text-white hover:scale-110 active:scale-95 transition-all p-2" on:click={prevTrack}>
            <svg class="w-7 h-7" fill="currentColor" viewBox="0 0 20 20"><path d="M8.445 14.832A1 1 0 0010 14v-2.798l5.445 3.63A1 1 0 0017 14V6a1 1 0 00-1.555-.832L10 8.798V6a1 1 0 00-1.555-.832l-6 4a1 1 0 000 1.664l6 4z"></path></svg>
          </button>
          
          <button class="w-16 h-16 bg-white text-zinc-950 rounded-full flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-[0_0_30px_rgba(255,255,255,0.3)]" on:click={togglePlay}>
            {#if isPlaying}
              <svg class="w-8 h-8" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd"></path></svg>
            {:else}
              <svg class="w-8 h-8 ml-1" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clip-rule="evenodd"></path></svg>
            {/if}
          </button>

          <button class="text-zinc-400 hover:text-white hover:scale-110 active:scale-95 transition-all p-2" on:click={nextTrack}>
            <svg class="w-7 h-7" fill="currentColor" viewBox="0 0 20 20"><path d="M11.555 5.168A1 1 0 0010 6v2.798l-5.445-3.63A1 1 0 003 6v8a1 1 0 001.555.832L10 11.202V14a1 1 0 001.555.832l6-4a1 1 0 000-1.664l-6-4z"></path></svg>
          </button>
        </div>

        <!-- Extra -->
        <div class="w-1/4 flex justify-end">
          <button class="text-zinc-400 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-full" title="Loop">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
          </button>
        </div>
      </div>
    </div>
  </footer>

  <!-- Playlist Overlay -->
  {#if showPlaylist}
    <div class="absolute inset-y-0 right-0 w-80 bg-zinc-950/80 backdrop-blur-3xl border-l border-white/10 z-50 flex flex-col transform transition-transform shadow-[0_0_50px_rgba(0,0,0,0.5)]">
      <div class="p-5 border-b border-white/10 flex justify-between items-center">
        <h3 class="font-bold text-sm tracking-widest text-zinc-200 uppercase">Danh sách phát</h3>
        <button on:click={() => showPlaylist = false} class="text-zinc-500 hover:text-white bg-white/5 hover:bg-white/10 rounded-full p-1.5 transition-colors">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
        </button>
      </div>
      <div class="flex-1 overflow-y-auto p-3 custom-scrollbar">
        {#if playlist.length === 0}
          <div class="flex flex-col items-center justify-center mt-32 opacity-40">
            <svg class="w-12 h-12 mb-4 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"></path></svg>
            <span class="text-sm font-medium tracking-wide">Chưa có bài hát nào</span>
          </div>
        {:else}
          {#each playlist as file, i}
            <!-- svelte-ignore a11y-click-events-have-key-events -->
            <!-- svelte-ignore a11y-no-static-element-interactions -->
            <div class="p-3 mb-1.5 rounded-xl flex items-center space-x-3 cursor-pointer transition-all group {currentFile === file ? 'bg-white/10 border border-white/20 shadow-lg' : 'hover:bg-white/5 border border-transparent'}" on:click={() => playFile(file)}>
              <div class="text-xs font-bold text-zinc-500 w-5 text-center group-hover:hidden">{i + 1}</div>
              <button class="w-5 h-5 hidden group-hover:flex items-center justify-center text-rose-400 hover:text-white hover:bg-rose-500 rounded transition-colors" on:click={(e) => removeTrack(file, e)} title="Xóa bài hát">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
              <div class="flex-1 truncate text-sm font-medium tracking-wide {currentFile === file ? 'text-white' : 'text-zinc-400'}">{file.name.replace(/\.[^/.]+$/, "")}</div>
              {#if currentFile === file && isPlaying}
                <div class="w-4 h-4 flex space-x-0.5 items-end opacity-80">
                  <div class="w-1 h-2 bg-fuchsia-400 animate-bounce" style="animation-delay: 0s"></div>
                  <div class="w-1 h-4 bg-cyan-400 animate-bounce" style="animation-delay: 0.1s"></div>
                  <div class="w-1 h-3 bg-violet-400 animate-bounce" style="animation-delay: 0.2s"></div>
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
    animation: spin 12s linear infinite;
  }
  :global(.animate-pulse-slow) {
    animation: pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  }
  :global(.animate-fade-in-up) {
    animation: fadeInUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  }
  
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
  @keyframes pulse {
    0%, 100% { opacity: 0.03; transform: scale(1); }
    50% { opacity: 0.08; transform: scale(1.05); }
  }
  @keyframes fadeInUp {
    from { opacity: 0; transform: translate(-50%, 10px); }
    to { opacity: 1; transform: translate(-50%, 0); }
  }

  .custom-scrollbar::-webkit-scrollbar { width: 6px; }
  .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
  .custom-scrollbar::-webkit-scrollbar-thumb { background-color: rgba(255,255,255,0.1); border-radius: 10px; }
</style>
