//board
let board;
let boardWidth = 360;
let boardHeight = 640;
let context;

//variables for my bird / hur the bird ska se ut
let birdWidth = 34; //width/height ratio = 408pxwide/228pxtall = gives us a ratio 17/12
let birdHeight = 24;
let birdX = boardWidth / 8; //bird starts at 1/8 of the board width
let birdY = boardHeight / 2;
let birdImg;

let bird = {
  x: birdX,
  y: birdY,
  width: birdWidth,
  height: birdHeight,
};

//variables for pipes
let pipeArray = [];
let pipeWidth = 64; //width/height ratio = 384pxwide/3072pxtall = 1/8
let pipeHeight = 512;
let pipeX = boardWidth; //start at the right edge of the board
let pipeY = 0; //start at the top of the board

let topPipeImg;
let bottomPipeImg;

//physics variables
let velocityX = -2; //speed of pipes moving left
let velocityY = 0; //speed of bird moving up/down
let gravity = 0.29; //gravity or how fast the bird falls

let gameOver = false;
let score = 0;

let canRestart = true;

//when our page loads use for, example to draw the game
window.onload = function () {
  board = document.getElementById("board");
  board.height = boardHeight;
  board.width = boardWidth;
  context = board.getContext("2d"); //used for drawing on the board

  //drawing the flappy bird, to see where to place the img.
  //context.fillStyle = "green"; //color of the bird
  //context.fillRect(bird.x, bird.y, bird.width, bird.height);

  //load bird image
  birdImg = new Image();
  birdImg.src = "flappybird.png";
  birdImg.onload = function () {
    //draw the image once it's loaded
    context.drawImage(birdImg, bird.x, bird.y, bird.width, bird.height);
  };

  //load pipe images
  topPipeImg = new Image(); //create an image object
  topPipeImg.src = "toppipe.png";

  bottomPipeImg = new Image();
  bottomPipeImg.src = "bottompipe.png";

  // callback function to update the board, används för att skapa animationer i webbläsaren direkt i js.filen
  requestAnimationFrame(update);
  setInterval(placePipes, 1500); //place a new pipe every 1.5 seconds
  document.addEventListener("keydown", moveBird); //move bird when a key is pressed

  // Lägg till touch-stöd för mobil + surfplatta
  board.addEventListener("touchstart",function (e) {
      e.preventDefault(); // förhindra scroll/zoom
      moveBird({ code: "Space" }); // återanvänd samma logik som tangentbord
    },
    { passive: false }
  );
};

function update() {
  requestAnimationFrame(update);

  if (gameOver) {
    return;
  }

  context.clearRect(0, 0, boardWidth, boardHeight); //clear the board for the next draw

  //bird
  velocityY += gravity; //apply gravity to bird's velocity
  //bird.y += velocityY; //update bird's y position by its velocity
  bird.y = Math.max(bird.y + velocityY, 0); //apply gravity to current bird.y. limit the bird.y to 0 (top of the canvas)
  context.drawImage(birdImg, bird.x, bird.y, bird.width, bird.height);

  if (bird.y > board.height) {
    //bird has fallen to the ground
    gameOver = true;
  }

  //pipes
  //   for (let i = 0; i < pipeArray.length; i++) {
  //     let pipe = pipeArray[i];
  //     pipe.x += velocityX; //move pipe to the left
  //     context.drawImage(pipe.img, pipe.x, pipe.y, pipe.width, pipe.height);
  //   }

  for (let pipe of pipeArray) {
    pipe.x += velocityX; //move pipe to the left
    context.drawImage(pipe.img, pipe.x, pipe.y, pipe.width, pipe.height);

    if (!pipe.passed && bird.x > pipe.x + pipe.width) {
      score += 0.5; //increase score by 0.5, because each pipe pair consists of a top and bottom pipe
      pipe.passed = true; //this pipe has been passed
    }

    if (detectCollision(bird, pipe)) {
      gameOver = true;
    }
  }

  //pipeArray[0].x < 0 tar bort pipen så fort dess vänstra kant når vänstra kanten av canvasen.
  //pipeArray[0].x < -pipeWidth tar bort pipen först när hela pipen har lämnat canvasen (dvs. dess högra kant är utanför till vänster).

  //clear pipes that have gone off screen, to save memory
  while (pipeArray.length > 0 && pipeArray[0].x < -pipeWidth) {
    pipeArray.shift(); //remove the first element from the array
    console.log(
      "Pipe removed! Nuvarande längd på pipeArray:",
      pipeArray.length
    );
  }

  //score
  context.fillStyle = "white";
  context.font = "45px sans-serif";
  context.fillText(score, 5, 45);

  // instruktionstext mindre och till höger om poängen
  context.font = "10px sans-serif";
  context.fillText("Windows Space, X, ArrowUp To Jump", 60, 40);

  if (gameOver) {
    // context.fillStyle = "black";
    context.font = "30px sans-serif";
    context.fillText("Game Over!", 5, 90);
  }
}

function placePipes() {
  if (gameOver) {
    return;
  }
  // (0-1) * pipeHeight/2
  // 0 -> -128 (pipeHeight/4)
  // 1 -> -256 (pipeHeight/4 + pipeHeight/2) = -3/4 pipeHeight
  let randomPipeY = pipeY - pipeHeight / 4 - Math.random() * (pipeHeight / 2); //random y position for top pipe
  let openingSpace = board.height / 4; //space between top and bottom pipe

  let topPipe = {
    img: topPipeImg,
    x: pipeX,
    y: randomPipeY,
    width: pipeWidth,
    height: pipeHeight,
    passed: false, //has the bird passed this pipe?
  };
  pipeArray.push(topPipe); //add a new pipe to the array

  let bottomPipe = {
    img: bottomPipeImg,
    x: pipeX,
    y: randomPipeY + pipeHeight + openingSpace, //120 = gap between top and bottom pipe
    width: pipeWidth,
    height: pipeHeight,
    passed: false,
  };
  pipeArray.push(bottomPipe); //add a new pipe to the array
}

function moveBird(e) {
  if (e.code == "Space" || e.code == "ArrowUp" || e.code == "KeyX") {
    //jump
    velocityY = -6; //move up 6 pixels

    if (gameOver && canRestart) {
      canRestart = false; // förhindra direkt omstart
      setTimeout(() => {
        bird.y = birdY;
        pipeArray = [];
        score = 0;
        gameOver = false;
        canRestart = true; // tillåt omstart igen efter fördröjning
      }, 1000); // 1000 ms = 1 sekund fördröjning
    }
  }
}

function detectCollision(a, b) {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}
