const playerCount=document.getElementById('playerCount');
const playersDiv=document.getElementById('players');
const roundTime=document.getElementById('roundTime');

for(let i=3;i<=9;i++){
 playerCount.innerHTML += `<option value="${i}">${i}</option>`;
}

playerCount.value=localStorage.getItem('playerCount') || '4';
roundTime.value=localStorage.getItem('roundTime') || '180';

function renderPlayers(){
 const count=parseInt(playerCount.value);
 playersDiv.innerHTML='';

 for(let i=0;i<count;i++){
   const input=document.createElement('input');
   input.placeholder=`Imię gracza ${i+1}`;
   input.value=localStorage.getItem('player_'+i) || '';

   input.addEventListener('input',()=>{
      localStorage.setItem('player_'+i,input.value);
   });

   playersDiv.appendChild(input);
   playersDiv.appendChild(document.createElement('br'));
 }

 localStorage.setItem('playerCount',count);
}

renderPlayers();

playerCount.addEventListener('change',renderPlayers);

roundTime.addEventListener('change',()=>{
 localStorage.setItem('roundTime',roundTime.value);
});

document.getElementById('startBtn').addEventListener('click',()=>{
 document.getElementById('message').innerHTML='<h2>✅ Sprint 1.1 działa poprawnie</h2>';
});

document.getElementById('clearBtn').addEventListener('click',()=>{
 localStorage.clear();
 location.reload();
});