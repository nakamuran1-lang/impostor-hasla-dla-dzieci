
const pc=document.getElementById('playerCount');
for(let i=3;i<=9;i++) pc.innerHTML+=`<option>${i}</option>`;
pc.value=localStorage.playerCount||4;
function render(){players.innerHTML='';for(let i=0;i<pc.value;i++)players.innerHTML+=`<input id=p${i} value="${localStorage['p'+i]||''}" placeholder="Imię ${i+1}"><br>`;}
pc.onchange=render;render();

let playersArr=[],roles=[],current=0,starterPlayer='',voteChoice='',cat='',timerId;

startBtn.onclick=()=>{
playersArr=[];
for(let i=0;i<pc.value;i++){let n=document.getElementById('p'+i).value||('Gracz '+(i+1));playersArr.push(n);localStorage['p'+i]=n;}
localStorage.playerCount=pc.value;
const cats=Object.keys(WORDS); cat=cats[Math.floor(Math.random()*cats.length)];
const word=WORDS[cat][Math.floor(Math.random()*WORDS[cat].length)];
const imp=Math.floor(Math.random()*playersArr.length);
roles=playersArr.map((n,i)=>({imp:i===imp,word,cat}));
current=0;
setup.classList.add('hidden'); showPass();
};

function showPass(){passScreen.classList.remove('hidden'); roleScreen.classList.add('hidden'); hiddenRole.classList.add('hidden'); passText.innerText='📱 Przekaż telefon: '+playersArr[current]; slider.value=0;}
slider.addEventListener('input',function(){if(+this.value>=95){let r=roles[current];passScreen.classList.add('hidden');roleScreen.classList.remove('hidden');roleContent.innerHTML=r.imp?`<div class=impostor><h2>${r.cat}</h2><h1>🚨 JESTEŚ IMPOSTOREM</h1></div>`:`<div class=normal><h2>${r.cat}</h2><h1>${r.word}</h1></div>`;}});
hideBtn.onclick=()=>{roleScreen.classList.add('hidden');hiddenRole.classList.remove('hidden');}
showAgainBtn.onclick=()=>{hiddenRole.classList.add('hidden');roleScreen.classList.remove('hidden');}
function nextP(){current++; if(current>=playersArr.length){roleScreen.classList.add('hidden');hiddenRole.classList.add('hidden');readyScreen.classList.remove('hidden');} else showPass();}
nextBtn.onclick=nextP; nextBtn2.onclick=nextP;

startRoundBtn.onclick=()=>{
readyScreen.classList.add('hidden'); roundScreen.classList.remove('hidden');
starterPlayer=playersArr[Math.floor(Math.random()*playersArr.length)];
starter.innerText='🎲 Zaczyna: '+starterPlayer;
category.innerText='📚 Kategoria: '+cat;
let d=+roundTime.value; timer.innerText=String(Math.floor(d/60)).padStart(2,'0')+':00';
};

timerBtn.onclick=()=>{
let t=+roundTime.value;
clearInterval(timerId);
timerId=setInterval(()=>{
let m=Math.floor(t/60), s=t%60;
timer.innerText=String(m).padStart(2,'0')+':'+String(s).padStart(2,'0');
t--;
if(t<0){showVote();}
},1000);
};

function showVote(){
clearInterval(timerId);
roundScreen.classList.add('hidden');
voteScreen.classList.remove('hidden');
voteList.innerHTML='';
playersArr.forEach(p=>voteList.innerHTML+=`<button onclick="pickVote('${p}')">${p}</button><br>`);
}
voteBtn.onclick=showVote;

window.pickVote=(p)=>{
voteChoice=p;
voteScreen.classList.add('hidden');
confirmScreen.classList.remove('hidden');
confirmText.innerText='Głosujecie na: '+p+' ?';
}
backBtn.onclick=()=>{confirmScreen.classList.add('hidden');voteScreen.classList.remove('hidden');}
showResultBtn.onclick=()=>{
confirmScreen.classList.add('hidden');
resultScreen.classList.remove('hidden');
resultText.innerText='Wybrano: '+voteChoice;
}
