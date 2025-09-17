const canvas = document.getElementById("board");
const ctx = canvas.getContext("2d");

const size = 600;
const center = size/2;
const pocketRadius = 22;

let currentPlayer = 1;
let scores = {1:0,2:0,3:0,4:0};
let waitingForNextTurn = false;

// ---------------- PIECE CLASS ----------------
class Piece {
  constructor(x, y, color, radius=12, isQueen=false){
    this.x=x; this.y=y;
    this.vx=0; this.vy=0;
    this.color=color;
    this.radius=radius;
    this.isQueen=isQueen;
    this.active=true;
  }
  draw(){
    if(!this.active) return;
    ctx.beginPath();
    ctx.arc(this.x,this.y,this.radius,0,Math.PI*2);
    ctx.fillStyle=this.color;
    ctx.fill();
    ctx.stroke();
  }
  move(){
    if(!this.active) return;
    this.x+=this.vx;
    this.y+=this.vy;
    this.vx*=0.98;
    this.vy*=0.98;
    if(Math.hypot(this.vx,this.vy)<0.05){
      this.vx=0; this.vy=0;
    }
    if(this.x-this.radius<0 || this.x+this.radius>size){
      this.vx*=-1; 
      this.x=Math.max(this.radius, Math.min(size-this.radius,this.x));
    }
    if(this.y-this.radius<0 || this.y+this.radius>size){
      this.vy*=-1; 
      this.y=Math.max(this.radius, Math.min(size-this.radius,this.y));
    }
  }
}

// ---------------- STRIKER ----------------
let striker = new Piece(center, size-40, "red", 14);

// ---------------- PIECES ----------------
let pieces=[];
function setupPieces(){
  pieces=[];
  let colors=["white","black"];
  let angleStep = Math.PI*2/12;
  for(let i=0;i<12;i++){
    let angle=i*angleStep;
    let x=center+40*Math.cos(angle);
    let y=center+40*Math.sin(angle);
    pieces.push(new Piece(x,y,colors[i%2]));
  }
  pieces.push(new Piece(center,center,"pink",12,true)); // queen
}
setupPieces();

// ---------------- COLLISION ----------------
function collide(p1,p2){
  if(!p1.active||!p2.active) return;
  let dx=p1.x-p2.x;
  let dy=p1.y-p2.y;
  let dist=Math.hypot(dx,dy);
  if(dist < p1.radius+p2.radius){
    let angle=Math.atan2(dy,dx);
    let totalMass=1+1;
    let v1= p1.vx*Math.cos(angle)+p1.vy*Math.sin(angle);
    let v2= p2.vx*Math.cos(angle)+p2.vy*Math.sin(angle);
    let newV1=v2, newV2=v1;
    p1.vx += (newV1-v1)*Math.cos(angle);
    p1.vy += (newV1-v1)*Math.sin(angle);
    p2.vx += (newV2-v2)*Math.cos(angle);
    p2.vy += (newV2-v2)*Math.sin(angle);
  }
}

// ---------------- POCKET CHECK ----------------
function checkPockets(p){
  if(!p.active) return;
  let pockets=[[0,0],[size,0],[0,size],[size,size]];
  for(let [px,py] of pockets){
    if(Math.hypot(p.x-px,p.y-py)<pocketRadius){
      p.active=false;
      if(p.isQueen){
        scores[currentPlayer]+=5;
      } else if(p.color==="white"){
        if(currentPlayer===1||currentPlayer===3) scores[currentPlayer]++;
      } else if(p.color==="black"){
        if(currentPlayer===2||currentPlayer===4) scores[currentPlayer]++;
      }
      updateScoreboard();
    }
  }
}

function checkStrikerFoul(){
  let pockets=[[0,0],[size,0],[0,size],[size,size]];
  for(let [px,py] of pockets){
    if(Math.hypot(striker.x-px,striker.y-py)<pocketRadius){
      striker.x=center; striker.y=size-40;
      striker.vx=0; striker.vy=0;
      scores[currentPlayer]=Math.max(0,scores[currentPlayer]-1);
      updateScoreboard();
    }
  }
}

// ---------------- BOARD ----------------
function drawBoard(){
  ctx.clearRect(0,0,size,size);
  ctx.fillStyle="#fce5b0";
  ctx.fillRect(0,0,size,size);

  // pockets
  ctx.fillStyle="black";
  let pockets=[[0,0],[size,0],[0,size],[size,size]];
  for(let [px,py] of pockets){
    ctx.beginPath();
    ctx.arc(px,py,pocketRadius,0,Math.PI*2);
    ctx.fill();
  }
}

// ---------------- TURN ----------------
function nextTurn(){
  currentPlayer = (currentPlayer%4)+1;
  document.getElementById("turn").textContent=currentPlayer;
  striker.x=center;
  striker.y=size-40;
  striker.vx=striker.vy=0;
}

function updateScoreboard(){
  document.getElementById("p1").textContent=scores[1];
  document.getElementById("p2").textContent=scores[2];
  document.getElementById("p3").textContent=scores[3];
  document.getElementById("p4").textContent=scores[4];
}

// ---------------- AIMING ----------------
let aiming=false;
let aimStart=null;

function drawAimLine(){
  if(aiming && aimStart){
    ctx.beginPath();
    ctx.moveTo(striker.x, striker.y);
    ctx.lineTo(aimStart.x, aimStart.y);
    ctx.strokeStyle="blue";
    ctx.setLineDash([5,5]);
    ctx.stroke();
    ctx.setLineDash([]);
  }
}

// ---------------- MOUSE ----------------
canvas.addEventListener("mousedown",(e)=>{
  if(striker.vx===0 && striker.vy===0){
    aiming=true;
    aimStart={x:e.offsetX,y:e.offsetY};
  }
});

canvas.addEventListener("mousemove",(e)=>{
  if(aiming){
    aimStart={x:e.offsetX,y:e.offsetY};
  }
});

canvas.addEventListener("mouseup",(e)=>{
  if(aiming){
    aiming=false;
    let dx=striker.x-e.offsetX;
    let dy=striker.y-e.offsetY;
    striker.vx=dx*0.1;
    striker.vy=dy*0.1;
  }
});

// ---------------- STRIKER MOVE (ARROWS) ----------------
window.addEventListener("keydown",(e)=>{
  if(striker.vx===0 && striker.vy===0){
    if(e.key==="ArrowLeft") striker.x=Math.max(60,striker.x-20);
    if(e.key==="ArrowRight") striker.x=Math.min(size-60,striker.x+20);
  }
});

// ---------------- GAME LOOP ----------------
function gameLoop(){
  drawBoard();

  pieces.forEach(p=>{
    p.move();
    checkPockets(p);
    p.draw();
  });

  striker.move();
  checkStrikerFoul();
  striker.draw();

  // collisions
  pieces.forEach(p=>collide(striker,p));
  for(let i=0;i<pieces.length;i++){
    for(let j=i+1;j<pieces.length;j++){
      collide(pieces[i],pieces[j]);
    }
  }

  if(striker.vx===0 && striker.vy===0){
    if(!waitingForNextTurn){
      waitingForNextTurn=true;
      setTimeout(()=>{
        nextTurn();
        waitingForNextTurn=false;
      },1000);
    }
  }

  drawAimLine();
  requestAnimationFrame(gameLoop);
}
gameLoop();
function drawBoard(){
  ctx.clearRect(0,0,size,size);

  // Background
  ctx.fillStyle="#eacda3"; // wood color
  ctx.fillRect(0,0,size,size);

  // Outer black border
  ctx.strokeStyle="black";
  ctx.lineWidth=8;
  ctx.strokeRect(0,0,size,size);

  // Inner square
  ctx.lineWidth=2;
  ctx.strokeStyle="black";
  ctx.strokeRect(60,60,size-120,size-120);

  // Center circle + star
  ctx.beginPath();
  ctx.arc(center,center,40,0,Math.PI*2);
  ctx.stroke();

  for(let i=0;i<8;i++){
    let angle=(Math.PI/4)*i;
    let x=center+40*Math.cos(angle);
    let y=center+40*Math.sin(angle);
    ctx.beginPath();
    ctx.moveTo(center,center);
    ctx.lineTo(x,y);
    ctx.stroke();
  }

  // Corner arrows
  function drawArrow(x,y,dx,dy){
    ctx.beginPath();
    ctx.moveTo(x,y);
    ctx.lineTo(x+dx*40,y+dy*40);
    ctx.stroke();
    ctx.lineTo(x+dx*30-dy*10,y+dy*30+dx*10);
    ctx.moveTo(x+dx*40,y+dy*40);
    ctx.lineTo(x+dx*30+dy*10,y+dy*30-dx*10);
    ctx.stroke();
  }
  drawArrow(60,60,1,1);
  drawArrow(size-60,60,-1,1);
  drawArrow(60,size-60,1,-1);
  drawArrow(size-60,size-60,-1,-1);

  // Pockets
  ctx.fillStyle="black";
  let pockets=[[0,0],[size,0],[0,size],[size,size]];
  for(let [px,py] of pockets){
    ctx.beginPath();
    ctx.arc(px,py,pocketRadius,0,Math.PI*2);
    ctx.fill();
  }
}
