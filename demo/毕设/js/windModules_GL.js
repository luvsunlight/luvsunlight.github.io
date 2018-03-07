/**
 * Created by lizhiyuan on 2018/3/1.
 */

var myRGB = function(hex) {
    this.r = parseInt("0x" + hex.slice(1, 3));
    this.g = parseInt("0x" + hex.slice(3, 5));
    this.b = parseInt("0x" + hex.slice(5, 7));
};

myRGB.prototype.toRGB = function() {
    return 'rgb(' + this.r + ',' + this.g + ',' + this.b + ')';
};

var Vector = function(x, y) {
    this.x = x;
    this.y = y;
};

Vector.prototype.length = function() {
    return Math.sqrt(this.x * this.x + this.y * this.y);
};

Vector.prototype.setScale = function(scale) {
    this.x *= scale;
    this.y *= scale;
};

Vector.prototype.addVector = function(v, scale, invert) {
    scale = scale || 1;
    invert = invert || false;
    if(invert){
        this.x = v.x + this.x * scale;
        this.y = v.y + this.y * scale;
    }else{
        this.x += v.x * scale;
        this.y += v.y * scale;
    }
};

Vector.prototype.addFriction = function(frictionScale) {
    frictionScale = frictionScale || 0.5;
    this.addVector(this, -frictionScale);
};


var Particle = function(x, y, age) {
    this.x = x;
    this.y = y;
    this.oldX = -1;
    this.oldY = -1;
    this.oriX = x;
    this.oriY = y;
    this.age = age || 20;
};

var VectorField = function(data) {
    this.field = [];
    this.data = data;
};

VectorField.prototype.read = function() {
    var data = this.data;
    var field = [];
    this.x0 = data.x0;
    this.x1 = data.x1;
    this.y0 = data.y0;
    this.y1 = data.y1;

    var w = data.gridWidth;
    var h = data.gridHeight;
    var index = 0;

    for(var i = 0; i < w; i++){
        field[i] = [];
        for(var j = 0; j < h; j++){
            var vx = data.field[index++];
            var vy = data.field[index++];
            var v = new Vector(vx,vy);

            field[i][j] = v;
        }
    }
    this.w = w;
    this.h = h;
    this.field = field;
    this.getMaxLen();

    return this;
};

VectorField.prototype.getMaxLen = function() {
    this.maxLength = 0;
    var field = this.field;
    var mx = 0;
    var my = 0;
    for (var i = 0; i < this.w; i++) {
      for (var j = 0; j < this.h; j++) {
            if (field[i][j].length() > this.maxLength) {
                mx = i;
                my = j;
            }
            this.maxLength = Math.max(this.maxLength, field[i][j].length());
        }
    }
};

VectorField.prototype.bilinear = function(coord, a, b) {
    var na = Math.floor(a);
    var nb = Math.floor(b);
    var ma = Math.ceil(a);
    var mb = Math.ceil(b);
    var fa = a - na;
    var fb = b - nb;

    return this.field[na][nb][coord] * (1 - fa) * (1 - fb) +
            this.field[ma][nb][coord] * fa * (1 - fb) +
            this.field[na][mb][coord] * (1 - fa) * fb +
            this.field[ma][mb][coord] * fa * fb;
};

VectorField.prototype.getValue = function(x, y) {
    var a = (this.w - 1 - 1e-6) * (x - this.x0) / (this.x1 - this.x0);
    var b = (this.h - 1 - 1e-6) * (y - this.y0) / (this.y1 - this.y0);
    var vx = this.bilinear('x', a, b);
    var vy = this.bilinear('y', a, b);

    return new Vector(vx, vy);
};

VectorField.prototype.inBounds = function(x, y) {
    return x >= this.x0 && x < this.x1 && y >= this.y0 && y < this.y1;
};


var MotionDisplay = function(scene, field, proj, ASSETS) {
    this.scene = scene;
    this.field = field;
    this.projection = proj;
    this.assets = ASSETS;
    this.x0 = field.x0;
    this.x1 = field.x1;
    this.y0 = field.y0;
    this.y1 = field.y1;

    this.numParticles = ASSETS.numParticles;
    this.speed = ASSETS.speed;
    this.age = ASSETS.age;
    this.windCount = ASSETS.windCount;
    this.size = ASSETS.size;

    this.particles = [];
    this.makeNewParticles();
    this.index = 0;
};

MotionDisplay.prototype.makeNewParticles = function() {
    for (var i = 0; i < this.numParticles; i++) {
        this.particles.push(this.makeParticle());
    }
};

MotionDisplay.prototype.makeParticle = function() {
    var a = Math.random();
    var b = Math.random();
    var x = a * this.x0 + (1 - a) * this.x1;
    var y = b * this.y0 + (1 - b) * this.y1;

    return new Particle(x, y, 1 + Math.random() * this.age);
};

MotionDisplay.prototype.animate = function() {
    this.moveThings();
    this.draw();
};

MotionDisplay.prototype.moveThings = function() {
    var speed = this.speed;
    for (var i = 0; i < this.particles.length; i++) {
		var p = this.particles[i];
		if (p.age > 0 && this.field.inBounds(p.x, p.y)) {
		    var a = this.field.getValue(p.x, p.y);
            p.v = a;
		    p.x += speed * a.x;
			p.y += speed * a.y;
			p.age--;
		} else {
			this.particles[i] = this.makeParticle();
            //this.particles[i] = new Particle(p.oriX, p.oriY, this.age);
		}
	}
};

MotionDisplay.prototype.draw = function() {
    var index = this.index;
    var scene = this.scene;
    var windName = "wind" + index;
    if(scene.getObjectByName(windName)){
        scene.remove(scene.getObjectByName(windName));
    }
    //var opacity = index / this.windCount;
    //var size = this.size * index / this.windCount;
    var opacity = 1;
    var size = this.size;
    var geom = new THREE.Geometry();
    var mat = new THREE.PointCloudMaterial({
        size : size,
        transparent : true,
        opacity : opacity,
        color: new THREE.Color(0.8, 0.8, 0.8),
        sizeAttenuation : true,
        blending: THREE.AdditiveBlending,
    });
    var canvas = this.scene.getObjectByName('world').geometry.parameters;
    for(var i = 0; i < this.particles.length; i++){
        var p = this.particles[i];
        var proj = this.projection.project(p.x, p.y, this.field, canvas);
        var w = canvas.width;
        var h = canvas.height;
        proj.x -= w / 2;
        proj.y -= h / 2;
        var vertice = new THREE.Vector3(
            proj.x,
            proj.y,
            0
        );
        geom.vertices.push(vertice);
    }

    var wind = new THREE.PointCloud(geom, mat);
    wind.sortParticles = true;
    wind.name = "wind" + index;
    this.index = (index + 1) % this.windCount;
    scene.add(wind);
};
