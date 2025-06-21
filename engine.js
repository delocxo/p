class Input {
    constructor() {
        this.keys = new Set();
        window.addEventListener('keydown', (e) => {
            this.keys.add(e.key);
        });
        window.addEventListener('keyup', (e) => {
            this.keys.delete(e.key);
        });
    }
    isKeyDown(key) {
        return this.keys.has(key);
    }
}

class GameObject {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.vx = 0;
        this.vy = 0;
    }
    update(dt, input) {
        // override
    }
    draw(ctx) {
        // override
    }
}

class Rectangle extends GameObject {
    constructor(x, y, w, h, color = 'white') {
        super(x, y);
        this.width = w;
        this.height = h;
        this.color = color;
    }
    draw(ctx) {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }
}

class Circle extends GameObject {
    constructor(x, y, r, color = 'white') {
        super(x, y);
        this.radius = r;
        this.color = color;
    }
    draw(ctx) {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
    }
}

class Sprite extends GameObject {
    constructor(x, y, image) {
        super(x, y);
        this.image = image;
        this.width = image.width;
        this.height = image.height;
    }
    draw(ctx) {
        ctx.drawImage(this.image, this.x, this.y);
    }
}

class Engine {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.objects = [];
        this.input = new Input();
        this.lastTime = 0;
        window.requestAnimationFrame(this.loop.bind(this));
    }
    add(obj) {
        this.objects.push(obj);
    }
    loop(time) {
        const dt = (time - this.lastTime) / 1000;
        this.lastTime = time;
        this.update(dt);
        this.draw();
        window.requestAnimationFrame(this.loop.bind(this));
    }
    update(dt) {
        for (const obj of this.objects) {
            if (obj.update) obj.update(dt, this.input);
        }
    }
    clear() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
    draw() {
        this.clear();
        for (const obj of this.objects) {
            if (obj.draw) obj.draw(this.ctx);
        }
    }
}

// Example usage
window.addEventListener('load', () => {
    const engine = new Engine('gameCanvas');

    const rect = new Rectangle(100, 100, 50, 50, 'red');
    rect.update = function(dt, input) {
        if (input.isKeyDown('ArrowRight')) this.x += 200 * dt;
        if (input.isKeyDown('ArrowLeft')) this.x -= 200 * dt;
        if (input.isKeyDown('ArrowDown')) this.y += 200 * dt;
        if (input.isKeyDown('ArrowUp')) this.y -= 200 * dt;
    };

    const circle = new Circle(200, 150, 25, 'green');

    const img = new Image();
    img.onload = function() {
        const sprite = new Sprite(300, 100, img);
        engine.add(sprite);
    };
    img.src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAIAAADYYG7QAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAIdJREFUeNpi/P//PwMlgImBJRMDw388BAMjIYGhgYmBjSAAAO4FA0kFENIBqYGBgY4BkJCRH+ABGQGKjp6fgPkP8H4w8T+R9g/gfmP8HuRo0A+iAFMcAAvkDqvwHyL4gFeA+SYgZABBJABQBMoHTp09XhgYmJiYGNgYEhmpqaBgYgbiotLQzMACogYGBmYRVA3wQTmGLgH4O5gAIACDAANi1b9/QAAAAASUVORK5CYII=';

    engine.add(rect);
    engine.add(circle);
});
