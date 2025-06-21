class Input {
    constructor() {
        this.keys = new Set();
        this.mouse = { x: 0, y: 0, down: false, clicked: false };
        window.addEventListener('keydown', (e) => {
            this.keys.add(e.key);
        });
        window.addEventListener('keyup', (e) => {
            this.keys.delete(e.key);
        });
        window.addEventListener('mousemove', (e) => {
            const rect = e.target.getBoundingClientRect();
            this.mouse.x = e.clientX - rect.left;
            this.mouse.y = e.clientY - rect.top;
        });
        window.addEventListener('mousedown', () => {
            this.mouse.down = true;
            this.mouse.clicked = true;
        });
        window.addEventListener('mouseup', () => {
            this.mouse.down = false;
        });
    }
    isKeyDown(key) {
        return this.keys.has(key);
    }
    isMouseDown() {
        return this.mouse.down;
    }
    wasMouseClicked() {
        return this.mouse.clicked;
    }
    consumeClick() {
        this.mouse.clicked = false;
    }
    isMouseInside(obj) {
        return (
            this.mouse.x >= obj.x &&
            this.mouse.x <= obj.x + (obj.width || 0) &&
            this.mouse.y >= obj.y &&
            this.mouse.y <= obj.y + (obj.height || 0)
        );
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

class Text extends GameObject {
    constructor(x, y, text, color = 'white', font = '20px sans-serif') {
        super(x, y);
        this.text = text;
        this.color = color;
        this.font = font;
    }
    draw(ctx) {
        ctx.fillStyle = this.color;
        ctx.font = this.font;
        ctx.fillText(this.text, this.x, this.y);
    }
}

class Button extends Rectangle {
    constructor(x, y, w, h, label, callback) {
        super(x, y, w, h, '#555');
        this.label = label;
        this.callback = callback;
    }
    update(dt, input) {
        if (input.wasMouseClicked() && input.isMouseInside(this)) {
            if (this.callback) this.callback();
            input.consumeClick();
        }
    }
    draw(ctx) {
        super.draw(ctx);
        ctx.fillStyle = 'white';
        ctx.font = '16px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.label, this.x + this.width / 2, this.y + this.height / 2);
        ctx.textAlign = 'start';
        ctx.textBaseline = 'alphabetic';
    }
}

function rectRectCollision(a, b) {
    return (
        a.x < b.x + b.width &&
        a.x + a.width > b.x &&
        a.y < b.y + b.height &&
        a.y + a.height > b.y
    );
}

function circleCircleCollision(a, b) {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    return dist < a.radius + b.radius;
}

function rectCircleCollision(rect, circ) {
    const cx = Math.max(rect.x, Math.min(circ.x, rect.x + rect.width));
    const cy = Math.max(rect.y, Math.min(circ.y, rect.y + rect.height));
    const dx = circ.x - cx;
    const dy = circ.y - cy;
    return dx * dx + dy * dy < circ.radius * circ.radius;
}

function checkCollision(a, b) {
    if (a instanceof Rectangle && b instanceof Rectangle) return rectRectCollision(a, b);
    if (a instanceof Circle && b instanceof Circle) return circleCircleCollision(a, b);
    if (a instanceof Rectangle && b instanceof Circle) return rectCircleCollision(a, b);
    if (a instanceof Circle && b instanceof Rectangle) return rectCircleCollision(b, a);
    return false;
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
    remove(obj) {
        const idx = this.objects.indexOf(obj);
        if (idx !== -1) this.objects.splice(idx, 1);
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
        for (let i = 0; i < this.objects.length; i++) {
            for (let j = i + 1; j < this.objects.length; j++) {
                const a = this.objects[i];
                const b = this.objects[j];
                if (checkCollision(a, b) && a.onCollision) a.onCollision(b);
                if (checkCollision(a, b) && b.onCollision) b.onCollision(a);
            }
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

    const infoText = new Text(10, 20, 'Use arrow keys. Touch circle to turn blue.');

    const button = new Button(650, 550, 120, 30, 'Reset', () => {
        rect.x = 100;
        rect.y = 100;
        rect.color = 'red';
    });

    const img = new Image();
    img.onload = function() {
        const sprite = new Sprite(300, 100, img);
        engine.add(sprite);
    };
    img.src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAIAAADYYG7QAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAIdJREFUeNpi/P//PwMlgImBJRMDw388BAMjIYGhgYmBjSAAAO4FA0kFENIBqYGBgY4BkJCRH+ABGQGKjp6fgPkP8H4w8T+R9g/gfmP8HuRo0A+iAFMcAAvkDqvwHyL4gFeA+SYgZABBJABQBMoHTp09XhgYmJiYGNgYEhmpqaBgYgbiotLQzMACogYGBmYRVA3wQTmGLgH4O5gAIACDAANi1b9/QAAAAASUVORK5CYII=';

    engine.add(rect);
    engine.add(circle);
    engine.add(infoText);
    engine.add(button);

    rect.onCollision = function(other) {
        if (other === circle) this.color = 'blue';
    };

    engine.update = function(dt) {
        for (const obj of this.objects) {
            if (obj.update) obj.update(dt, this.input);
        }
        for (let i = 0; i < this.objects.length; i++) {
            for (let j = i + 1; j < this.objects.length; j++) {
                const a = this.objects[i];
                const b = this.objects[j];
                if (checkCollision(a, b)) {
                    if (a.onCollision) a.onCollision(b);
                    if (b.onCollision) b.onCollision(a);
                }
            }
        }
        if (!checkCollision(rect, circle)) rect.color = 'red';
    };
});
