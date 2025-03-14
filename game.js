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
    radius: 10,
    dx: 2,  // Horizontal speed
    dy: 2   // Vertical speed
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
    if (event.key === "ArrowDown" || event.key === "s") keys.down = false;
});

// Event listeners for keyup
document.addEventListener("keyup", (event) => {
    if (event.key === "ArrowLeft" || event.key === "a") keys.left = false;
    if (event.key === "ArrowRight" || event.key === "d") keys.right = false;
    if (event.key === "ArrowUp" || event.key === "w") keys.up = false;
    if (event.key === "ArrowDown" || event.key === "s") keys.down = false;
});

function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear canvas

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
    obst.x += obst.dx;
    obst.y += obst.dy;

    // Bounce off walls
    if (obst.x + obst.radius > canvas.width || obst.x - obst.radius < 0) obst.dx *= -1;
    if (obst.y + obst.radius > canvas.height || obst.y - obst.radius < 0) obst.dy *= -1;

    // Draw the obstacle
    ctx.beginPath();
    ctx.arc(obst.x, obst.y, obst.radius, 0, Math.PI * 2);
    ctx.fillStyle = '#0095DD';
    ctx.fill();
    ctx.closePath();

    requestAnimationFrame(gameLoop);
}

gameLoop(); // Start the game loop
