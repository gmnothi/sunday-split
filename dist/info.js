(() => {
  window.lucide?.createIcons();
  const start=document.querySelector('#remove-profile');if(!start)return;
  const confirm=document.querySelector('#profile-confirm'),remove=document.querySelector('#confirm-remove'),cancel=document.querySelector('#cancel-remove'),status=document.querySelector('#privacy-status');
  status.tabIndex=-1;
  start.onclick=()=>{confirm.hidden=false;start.hidden=true;status.textContent='';remove.focus();};
  cancel.onclick=()=>{confirm.hidden=true;start.hidden=false;start.focus();};
  remove.onclick=async()=>{
    remove.disabled=true;cancel.disabled=true;status.textContent='Removing your shared profile...';
    try{
      const response=await fetch('/api/session',{method:'DELETE',credentials:'same-origin'});
      const data=await response.json();if(!response.ok||!data.deleted)throw new Error('Your profile could not be removed. Please try again.');
      confirm.hidden=true;status.textContent='Shared profile removed, if one was active. Local game progress and streaks are unchanged.';status.focus();
    }catch{status.textContent='Your profile could not be removed. Check your connection and try again.';remove.disabled=false;cancel.disabled=false;}
  };
})();
