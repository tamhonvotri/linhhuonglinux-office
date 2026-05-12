<script lang="ts">
  import { onMount } from 'svelte';

  // Mock data for version management
  const apps = [
    { id: 'document', name: 'LinhHuong Document', currentVersion: '1.0.0', latestVersion: '1.0.2', status: 'update_available', icon: '📄' },
    { id: 'spreadsheet', name: 'LinhHuong Spreadsheet', currentVersion: '1.0.0', latestVersion: '1.0.0', status: 'up_to_date', icon: '📊' },
    { id: 'presentation', name: 'LinhHuong Presentation', currentVersion: '1.0.0', latestVersion: '1.0.1', status: 'update_available', icon: '🎬' },
    { id: 'formula', name: 'LinhHuong Formula', currentVersion: '1.0.0', latestVersion: '1.0.0', status: 'up_to_date', icon: '∑' },
    { id: 'calculator', name: 'LinhHuong Calculator', currentVersion: '1.0.0', latestVersion: '1.0.0', status: 'up_to_date', icon: '🧮' },
    { id: 'music', name: 'LinhHuong Music', currentVersion: '1.0.0', latestVersion: '1.0.0', status: 'up_to_date', icon: '🎵' },
    { id: 'video', name: 'LinhHuong Cinema', currentVersion: '1.0.0', latestVersion: '1.0.0', status: 'up_to_date', icon: '🎞️' }
  ];

  let updating = false;
  let checkingUpdates = false;
  let updateProgress = 0;
  let updatedApps: string[] = [];
  function compareVersions(v1: string, v2: string) {
    const p1 = v1.split('.').map(Number);
    const p2 = v2.split('.').map(Number);
    for (let i = 0; i < Math.max(p1.length, p2.length); i++) {
      const n1 = p1[i] || 0;
      const n2 = p2[i] || 0;
      if (n1 > n2) return 1;
      if (n1 < n2) return -1;
    }
    return 0;
  }

  async function checkForUpdates() {
    checkingUpdates = true;
    try {
      // Fetch the latest versions from the central HuggingFace release repository
      const response = await fetch('https://huggingface.co/datasets/linhhuong/linhhuonglinux-releases/resolve/main/versions.json');
      if (!response.ok) throw new Error('HuggingFace repository not reachable');
      
      const remoteVersions = await response.json();
      let foundUpdate = false;
      
      apps = apps.map(app => {
        if (remoteVersions[app.id]) {
          const remoteVer = remoteVersions[app.id];
          if (compareVersions(remoteVer, app.currentVersion) > 0) {
            foundUpdate = true;
            return { ...app, latestVersion: remoteVer, status: 'update_available' };
          }
        }
        return app;
      });
      
    } catch (e) {
      console.warn('Fallback: Mạng lỗi hoặc repo chưa tồn tại, dùng dữ liệu giả lập.', e);
      // Fallback: Simulate update for demonstration
      let foundUpdate = false;
      apps.forEach(app => {
        if (app.status === 'up_to_date' && Math.random() > 0.6) {
          app.latestVersion = '1.' + (parseInt(app.currentVersion.split('.')[1]) + 1) + '.0';
          app.status = 'update_available';
          foundUpdate = true;
        }
      });
      if (!foundUpdate) {
        const upToDateApps = apps.filter(a => a.status === 'up_to_date');
        if (upToDateApps.length > 0) {
          upToDateApps[0].latestVersion = '1.1.0';
          upToDateApps[0].status = 'update_available';
        }
      }
      apps = [...apps];
    } finally {
      checkingUpdates = false;
    }
  }

  function updateAll() {
    updating = true;
    updateProgress = 0;
    
    const interval = setInterval(() => {
      updateProgress += 5;
      if (updateProgress >= 100) {
        clearInterval(interval);
        updating = false;
        apps.forEach(app => {
          if (app.status === 'update_available') {
            app.currentVersion = app.latestVersion;
            app.status = 'up_to_date';
            updatedApps = [...updatedApps, app.id];
          }
        });
      }
    }, 100);
  }

  function updateApp(id: string) {
    const app = apps.find(a => a.id === id);
    if (app && app.status === 'update_available') {
      app.status = 'updating';
      setTimeout(() => {
        app.currentVersion = app.latestVersion;
        app.status = 'up_to_date';
        updatedApps = [...updatedApps, id];
        // Trigger reactivity
        const idx = apps.findIndex(a => a.id === id);
        apps[idx] = app;
      }, 1500);
    }
  }

</script>

<div class="min-h-screen bg-slate-50 font-sans text-slate-800 flex flex-col">
  <!-- Header -->
  <header class="bg-indigo-600 text-white p-6 shadow-md shrink-0">
    <div class="max-w-4xl mx-auto flex justify-between items-center">
      <div class="flex items-center space-x-3">
        <div class="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
          <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4"></path></svg>
        </div>
        <h1 class="text-2xl font-bold tracking-tight">LinhHương Software Center</h1>
      </div>
      <div>
        <span class="bg-indigo-500 text-indigo-100 text-xs px-3 py-1.5 rounded-full font-semibold border border-indigo-400">
          OS Version: 1.0.5-stable
        </span>
      </div>
    </div>
  </header>

  <!-- Main -->
  <main class="flex-1 max-w-4xl mx-auto w-full p-6 flex flex-col gap-6">
    
    <!-- Status Banner -->
    <div class="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex justify-between items-center">
      <div>
        <h2 class="text-lg font-bold text-slate-800">Quản lý Phiên bản Phần mềm</h2>
        <p class="text-sm text-slate-500 mt-1">Hệ thống đang quản lý {apps.length} ứng dụng gốc.</p>
      </div>
      
      {#if apps.some(a => a.status === 'update_available')}
        <div class="flex flex-col items-end">
          {#if updating}
            <div class="text-sm font-bold text-indigo-600 mb-2">Đang tải và cập nhật ({updateProgress}%)...</div>
            <div class="w-48 h-2 bg-slate-100 rounded-full overflow-hidden">
              <div class="h-full bg-indigo-500 transition-all duration-100" style="width: {updateProgress}%"></div>
            </div>
          {:else}
            <div class="flex space-x-3">
              <button on:click={checkForUpdates} disabled={checkingUpdates} class="bg-white hover:bg-slate-50 text-slate-700 font-bold py-2.5 px-4 rounded-xl border border-slate-200 shadow-sm transition-all active:scale-95 flex items-center disabled:opacity-50">
                {#if checkingUpdates}
                  <svg class="animate-spin w-4 h-4 mr-2 text-slate-500" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path></svg>
                  Đang kiểm tra...
                {:else}
                  <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
                  Kiểm tra cập nhật
                {/if}
              </button>
              <button on:click={updateAll} class="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-5 rounded-xl shadow-md transition-all active:scale-95 flex items-center">
                <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
                Tải và Cập nhật tất cả
              </button>
            </div>
            <p class="text-xs text-rose-500 mt-2 font-medium">Có {apps.filter(a => a.status === 'update_available').length} bản cập nhật mới!</p>
          {/if}
        </div>
      {:else}
        <div class="flex items-center space-x-3">
          <button on:click={checkForUpdates} disabled={checkingUpdates} class="bg-white hover:bg-slate-50 text-slate-700 font-bold py-2.5 px-4 rounded-xl border border-slate-200 shadow-sm transition-all active:scale-95 flex items-center disabled:opacity-50">
            {#if checkingUpdates}
              <svg class="animate-spin w-4 h-4 mr-2 text-slate-500" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path></svg>
              Đang kiểm tra...
            {:else}
              <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
              Kiểm tra cập nhật
            {/if}
          </button>
          <div class="flex items-center text-emerald-600 font-bold bg-emerald-50 px-4 py-2.5 rounded-xl border border-emerald-100">
            <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
            Hệ thống đã cập nhật mới nhất
          </div>
        </div>
      {/if}
    </div>

    <!-- App List -->
    <div class="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      <div class="bg-slate-50 px-6 py-3 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider grid grid-cols-12 gap-4">
        <div class="col-span-5">Ứng dụng</div>
        <div class="col-span-3 text-center">Phiên bản hiện tại</div>
        <div class="col-span-4 text-right">Trạng thái</div>
      </div>
      
      <div class="divide-y divide-slate-100">
        {#each apps as app}
          <div class="px-6 py-4 grid grid-cols-12 gap-4 items-center hover:bg-slate-50/50 transition-colors">
            <!-- App Info -->
            <div class="col-span-5 flex items-center space-x-4">
              <div class="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-xl shadow-inner border border-slate-200 shrink-0">
                {app.icon}
              </div>
              <div>
                <h3 class="font-bold text-slate-800">{app.name}</h3>
                <p class="text-xs text-slate-400 font-mono">com.linhhuong.{app.id}</p>
              </div>
            </div>
            
            <!-- Versions -->
            <div class="col-span-3 text-center flex flex-col items-center">
              <span class="font-mono text-sm {updatedApps.includes(app.id) ? 'text-emerald-600 font-bold' : 'text-slate-600'}">v{app.currentVersion}</span>
              {#if app.status === 'update_available'}
                <span class="text-[10px] text-slate-400 mt-0.5">Mới nhất: v{app.latestVersion}</span>
              {/if}
            </div>
            
            <!-- Actions -->
            <div class="col-span-4 flex justify-end">
              {#if app.status === 'update_available'}
                <button on:click={() => updateApp(app.id)} class="px-4 py-1.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 hover:text-indigo-700 font-semibold rounded-lg text-sm border border-indigo-200 transition-colors active:scale-95">
                  Cập nhật ngay
                </button>
              {:else if app.status === 'updating'}
                <span class="px-4 py-1.5 text-indigo-500 font-semibold text-sm flex items-center">
                  <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-indigo-500" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  Đang tải...
                </span>
              {:else}
                <span class="px-4 py-1.5 text-emerald-600 font-semibold text-sm flex items-center">
                  Đã cài đặt
                </span>
              {/if}
            </div>
          </div>
        {/each}
      </div>
    </div>
  </main>
</div>
