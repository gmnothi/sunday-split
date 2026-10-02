(() => {
  const key='sunday-split:theme';
  const system=matchMedia('(prefers-color-scheme: dark)');
  const valid=value=>['light','dark','system'].includes(value);
  let preference='system';
  try {const saved=localStorage.getItem(key);if(valid(saved))preference=saved;} catch {}
  function apply() {
    const theme=preference==='system'?(system.matches?'dark':'light'):preference;
    document.documentElement.dataset.theme=theme;
    const button=document.querySelector('#theme');
    if(!button)return;
    const label=`Appearance: ${preference==='system'?'System ('+theme+')':theme}`;
    button.title=label;button.setAttribute('aria-label',label);
    button.innerHTML=`<i data-lucide="${preference==='system'?'monitor':theme==='dark'?'moon':'sun'}" aria-hidden="true"></i>`;
    document.querySelectorAll('[name="theme-choice"]').forEach(input=>{input.checked=input.value===preference;});
    window.lucide?.createIcons({nodes:[button]});
  }
  apply();
  system.addEventListener('change',()=>{if(preference==='system')apply();});
  window.addEventListener('storage',event=>{if(event.key===key){preference=valid(event.newValue)?event.newValue:'system';apply();}});
  document.addEventListener('DOMContentLoaded',()=>{
    document.querySelectorAll('[name="theme-choice"]').forEach(input=>input.addEventListener('change',()=>{
      preference=input.value;
      try {localStorage.setItem(key,preference);} catch {}
      apply();document.querySelector('#theme-menu').hidePopover();document.querySelector('#theme').focus();
    }));
    apply();
  });
})();
