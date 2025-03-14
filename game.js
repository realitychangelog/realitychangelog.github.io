const canvas = document.getElementById("game1");
const ctx = canvas.getContext("2d");

// Player object
const player = {
    x: 125,
    y: 62.5,
    width: 10,
    height: 10,
    speed: 2
};

// Obstacle object
const obst = {
    x: 10,
    y: 62.5,
    radius: 30,
    speed: 5
};
// Key press tracking
const keys = {
    left: false,
    right: false,
    up: false,
    down: false
};

// Event listeners for keydown
document.addEventListener("keydown", (event) => {
    if (event.key === "ArrowLeft" || event.key === "a") keys.left = true;
    if (event.key === "ArrowRight" || event.key === "d") keys.right = true;
    if (event.key === "ArrowUp" || event.key === "w") keys.up = true;
    if (event.key === "ArrowDown" || event.key === "s") keys.down = true;
});

// Event listeners for keyup
document.addEventListener("keyup", (event) => {
    if (event.key === "ArrowLeft" || event.key === "a") keys.left = false;
    if (event.key === "ArrowRight" || event.key === "d") keys.right = false;
    if (event.key === "ArrowUp" || event.key === "w") keys.up = false;
    if (event.key === "ArrowDown" || event.key === "s") keys.down = false;
});

function

function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw the border inside canvas
    ctx.strokeStyle = "black"; 
    ctx.lineWidth = 2; 
    ctx.strokeRect(0, 0, canvas.width, canvas.height);

    // Move the player
    if (keys.left && player.x > 0) player.x -= player.speed;
    if (keys.right && player.x < canvas.width - player.width) player.x += player.speed;
    if (keys.up && player.y > 0) player.y -= player.speed;
    if (keys.down && player.y < canvas.height - player.height) player.y += player.speed;

    // Draw the player
    ctx.fillStyle = "blue";
    ctx.fillRect(player.x, player.y, player.width, player.height);

    // Move the obstacle
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBall();
  
    if (x + dx > canvas.width - radius || x + dx < radius) {
    dx = -dx;
    }
    if (y + dy > canvas.height - radius || y + dy < radius) {
    dy = -dy;
    }
  
    x += dx;
    y += dy;
    
    // Draw the obstacle
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = '#0095DD';
    ctx.fill();
    ctx.closePath();

    requestAnimationFrame(gameLoop);
}

gameLoop(); // Start the game loop
