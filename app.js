
for(let i=3;i<=9;i++) count.innerHTML+=`<option>${i}</option>`;
count.value=localStorage.count||4;
function render(){let h='';for(let i=0;i<count.value;i++)h+=`<input id=p${i} value='${localStorage['n'+i]||''}' placeholder='Imię ${i+1}'><br>`;players.innerHTML=h;}
count.onchange=render;render();
let names=[],scores=JSON.parse(localStorage.scores||"{}"),roles=[],cur=0,imp='',word='',catName='',picked='',starterName='',timerId,holdId,dur=180;
function clearNames(){localStorage.clear();location.reload()}
function setupRound(){let cats=Object.keys(WORDS);catName=cats[Math.floor(Math.random()*cats.length)];let arr=WORDS[catName];word=arr[Math.floor(Math.random()*arr.length)];imp=names[Math.floor(Math.random()*names.length)];starterName=names[Math.floor(Math.random()*names.length)];roles=names.map(n=>n===imp?'IMP':word)}
function startGame(){localStorage.count=count.value;dur=+time.value;names=[];for(let i=0;i<count.value;i++){let n=document.getElementById('p'+i).value||('Gracz '+(+i+1));localStorage['n'+i]=n;names.push(n);if(scores[n]==null)scores[n]=0;}setupRound();cur=0;s1.classList.add('hidden');s2.classList.remove('hidden');pass.innerText='📱 Przekaż telefon: '+names[0]}
function hold(){holdId=setTimeout(showRole,1000)} function cancelHold(){clearTimeout(holdId)}
function showRole(){s3.classList.remove('hidden');role.innerHTML=roles[cur]=='IMP'?`<h2>📚 ${catName}</h2><h1>🚨 JESTEŚ IMPOSTOREM</h1>`:`<h2>📚 ${catName}</h2><h1>🔑 ${roles[cur]}</h1>`}
function nextPlayer(){s3.classList.add('hidden');cur++;if(cur>=names.length){s2.classList.add('hidden');s4.classList.remove('hidden');starter.innerText='🎲 Zaczyna: '+starterName;cat.innerText='📚 '+catName;timer.innerText=Math.floor(dur/60).toString().padStart(2,'0')+':00'}else pass.innerText='📱 Przekaż telefon: '+names[cur]}
function runTimer(){let t=dur;clearInterval(timerId);timerId=setInterval(()=>{let m=Math.floor(t/60),s=t%60;timer.innerText=String(m).padStart(2,'0')+':'+String(s).padStart(2,'0');t--;if(t<0)voteScreen()},1000)}
function voteScreen(){clearInterval(timerId);s4.classList.add('hidden');s5.classList.remove('hidden');votes.innerHTML='';names.forEach(n=>votes.innerHTML+=`<button onclick="pick('${n}')">${n}</button><br>`);}
function pick(n){picked=n;s5.classList.add('hidden');s6.classList.remove('hidden');confirm.innerText='Głosujecie na '+n+'?'}
function backVote(){s6.classList.add('hidden');s5.classList.remove('hidden')}
function showResult(){s6.classList.add('hidden');s7.classList.remove('hidden');if(picked===imp){names.forEach(n=>{if(n!==imp)scores[n]++})}else scores[imp]+=2;localStorage.scores=JSON.stringify(scores);result.innerHTML=`<h2>Impostor: ${imp}</h2><h2>Hasło: ${word}</h2>`;let h='<table><tr><th>Gracz</th><th>Pkt</th></tr>';Object.entries(scores).sort((a,b)=>b[1]-a[1]).forEach(r=>h+=`<tr><td>${r[0]}</td><td>${r[1]}</td></tr>`);score.innerHTML=h+'</table>'}
function nextRound(){s7.classList.add('hidden');setupRound();cur=0;s2.classList.remove('hidden');pass.innerText='📱 Przekaż telefon: '+names[0]}
