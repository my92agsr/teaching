(function(){
  if(sessionStorage.getItem('mw_auth')==='1') return;

  var HASH='d4d227b27228a6edc38d1e9d4de19d48dbe92779f77baf5e5d0e129f3e390027';

  document.documentElement.style.overflow='hidden';
  var orig=document.body.style.display;
  document.body.style.display='none';

  var gate=document.createElement('div');
  gate.id='pw-gate';
  gate.innerHTML=
    '<div style="position:fixed;inset:0;z-index:99999;background:#f4f5f9;display:flex;align-items:center;justify-content:center;font-family:DM Sans,-apple-system,sans-serif">'+
      '<div style="text-align:center;max-width:340px;padding:20px">'+
        '<div style="font-size:10px;font-weight:800;letter-spacing:2.5px;color:#C4880D;text-transform:uppercase;margin-bottom:6px">mattwalker.education</div>'+
        '<div style="font-size:22px;font-weight:800;color:#1a1a2e;margin-bottom:20px">Teaching Tools</div>'+
        '<input id="pw-input" type="password" placeholder="Enter password" style="width:100%;padding:12px 16px;border:2px solid #ddd;border-radius:10px;font-family:inherit;font-size:15px;outline:none;text-align:center">'+
        '<div id="pw-err" style="color:#c0392b;font-size:12px;margin-top:8px;min-height:18px"></div>'+
      '</div>'+
    '</div>';
  document.documentElement.appendChild(gate);

  var inp=document.getElementById('pw-input');
  setTimeout(function(){inp.focus()},100);

  inp.addEventListener('keydown',function(e){
    if(e.key==='Enter'){
      var v=inp.value;
      crypto.subtle.digest('SHA-256',new TextEncoder().encode(v)).then(function(buf){
        var hex=Array.from(new Uint8Array(buf)).map(function(b){return b.toString(16).padStart(2,'0')}).join('');
        if(hex===HASH){
          sessionStorage.setItem('mw_auth','1');
          gate.remove();
          document.body.style.display=orig||'';
          document.documentElement.style.overflow='';
        } else {
          document.getElementById('pw-err').textContent='Incorrect password';
          inp.value='';
          inp.focus();
        }
      });
    }
  });
})();
