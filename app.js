
const pc=document.getElementById('playerCount');
for(let i=3;i<=9;i++) pc.innerHTML+=`<option>${i}</option>`;
pc.value=localStorage.getItem('playerCount')||4;

function renderPlayers(){
 const d=document.getElementById('players');
 d.innerHTML='';
 for(let i=0;i<pc.value;i++){
  d.innerHTML+=`<input id="p${i}" value="${localStorage.getItem('p'+i)||''}" placeholder="Imię ${i+1}"><br>`;
 }
}
renderPlayers();
pc.onchange=renderPlayers;

let players=[],roles=[],current=0;

document.getElementById('startBtn').onclick=()=>{
 players=[];
 for(let i=0;i<pc.value;i++){
   let v=document.getElementById('p'+i).value||('Gracz '+(i+1));
   localStorage.setItem('p'+i,v);
   players.push(v);
 }
 localStorage.setItem('playerCount',pc.value);

 const cats=Object.keys(WORDS);
 const cat=cats[Math.floor(Math.random()*cats.length)];
 const word=WORDS[cat][Math.floor(Math.random()*WORDS[cat].length)];
 const imp=Math.floor(Math.random()*players.length);

 roles=players.map((p,i)=>({
   cat, word, impostor:i===imp
 }));

 current=0;
 document.getElementById('setup').classList.add('hidden');
 showPass();
};

function showPass(){
 document.getElementById('passScreen').classList.remove('hidden');
 document.getElementById('roleScreen').classList.add('hidden');
 document.getElementById('hiddenRole').classList.add('hidden');
 document.getElementById('passText').innerText='📱 Przekaż telefon: '+players[current];
 document.getElementById('slider').value=0;
}

document.getElementById('slider').addEventListener('input',function(){
 if(parseInt(this.value)>=95){
   let r=roles[current];
   document.getElementById('passScreen').classList.add('hidden');
   document.getElementById('roleScreen').classList.remove('hidden');

   document.getElementById('roleContent').innerHTML=r.impostor
   ? `<div class="impostor"><h2>📚 ${r.cat}</h2><h1>🚨 JESTEŚ IMPOSTOREM</h1></div>`
   : `<div class="normal"><h2>📚 ${r.cat}</h2><h1>🔑 ${r.word}</h1></div>`;
 }
});

document.getElementById('hideBtn').onclick=()=>{
 document.getElementById('roleScreen').classList.add('hidden');
 document.getElementById('hiddenRole').classList.remove('hidden');
};

document.getElementById('showAgainBtn').onclick=()=>{
 document.getElementById('hiddenRole').classList.add('hidden');
 document.getElementById('roleScreen').classList.remove('hidden');
};

function nextPlayer(){
 current++;
 if(current>=players.length){
   document.getElementById('roleScreen').classList.add('hidden');
   document.getElementById('hiddenRole').classList.add('hidden');
   document.getElementById('readyScreen').classList.remove('hidden');
 }else{
   showPass();
 }
}

document.getElementById('nextBtn').onclick=nextPlayer;
document.getElementById('nextBtn2').onclick=nextPlayer;
