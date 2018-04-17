var Vec2 = function(x, y, type, width, height){
    this.x = x;
    this.y = y;
    this.coordType = type || "screen";
    this.clientWidth = width || 600;
    this.clientHeight = height || 600;
};
Vec2.prototype.length = function() {
    return Math.sqrt(this.x * this.x + this.y * this.y);
};
Vec2.prototype.toRealCoord = function() {
    var width = this.clientWidth;
    var height = this.clientHeight;
    if(this.coordType == "real"){
        console.log("[real] coord already! Do not repeat tranferring coord type!");
        return;
    }else{
        var x = this.x * width / 2;
        var y = this.y * height / 2;
        return new Vec2(x,y,this.coordType,this.clientWidth,this.clientHeight);
    }
};
Vec2.prototype.toScreenCoord = function() {
    var width = this.clientWidth;
    var height = this.clientHeight;
    if(this.coordType == "screen"){
        console.log("[screen] coord already! Do not repeat tranferring coord type!");
        return;
    }else{
        var x = this.x / width / 2;
        var y = this.y / height / 2;
        return new Vec2(x,y,this.coordType,this.clientWidth,this.clientHeight);
    }
};

var App = function() {
    this.r = 30;
    this.trackNum = 5;
    this.trackLen = 5;
    this.useTexture = true;
    this.rndData = false;
    this.showClr = false;
    this.showShading = false;
    this.showResult = false;
    this.lightDirectionX = 0.6;
    this.lightDirectionY = 0.0;
    this.lightDirectionZ = 1.0;
    this.pt1 = new Vec2(0.2, -0.2, 'screen', gl.canvas.width, gl.canvas.height);
    this.pt2 = new Vec2(0.0, 0.5, 'screen', gl.canvas.width, gl.canvas.height);
    this.pt3 = new Vec2(0.3, -0.4, 'screen', gl.canvas.width, gl.canvas.height);
    this.pt4 = new Vec2(-0.35, 0.1, 'screen', gl.canvas.width, gl.canvas.height);

    this.initProgram();
    this.initBuffer();
    this.readData();
};
App.prototype.initProgram = function() {
    this.pt_program = createProgram(gl, V_pt_shader, F_pt_shader);
    this.line_program = createProgram(gl, V_line_shader, F_line_shader);
    this.draw_program = createProgram(gl, V_draw_shader, F_draw_shader);
    this.color_program = createProgram(gl, V_color_shader, F_color_shader);
    this.shading_program = createProgram(gl, V_normal_shader, F_normal_shader);
    this.result_program = createProgram(gl, V_result_shader, F_result_shader);
};
App.prototype.initBuffer = function() {
    // 承担容器的framebuffer <帧缓冲>
    this.framebuffer = gl.createFramebuffer();
    // 最后输出在屏幕上的纹理顶点坐标
    this.quadBuffer = createBuffer(gl, new Float32Array([0.0, 1.0, 0.0, 0.0, 1.0, 1.0, 1.0, 0.0]));
    var num = gl.canvas.width * gl.canvas.height;
    var emptyPixels = new Uint8Array(num * 4);
    for (var i = 0; i < num * 4; i++){
        emptyPixels[i] = 255;
    }
    // 两个密度纹理（用两个来实现帧缓冲）
    this.screenTexture = createTexture(gl, gl.NEAREST, emptyPixels, gl.canvas.width, gl.canvas.height);
    this.backgroundTexture = createTexture(gl, gl.NEAREST, emptyPixels, gl.canvas.width, gl.canvas.height);
    // 颜色纹理
    this.colorTexture = createTexture(gl, gl.NEAREST, emptyPixels, gl.canvas.width, gl.canvas.height);
    // 阴影纹理
    this.normalTexture = createTexture(gl, gl.NEAREST, emptyPixels, gl.canvas.width, gl.canvas.height);
    // 最后绘制到屏幕上的纹理
    this.resultTexture = createTexture(gl, gl.NEAREST, emptyPixels, gl.canvas.width, gl.canvas.height);
    // 绑定纹理单元
    bindTexture(gl, this.screenTexture, 0);         // <screenTexture>     -> texture0
    bindTexture(gl, this.backgroundTexture, 1);     // <backgroundTexture> -> texture1
    bindTexture(gl, this.colorTexture, 2);          // <colorTexture>      -> texture2
    bindTexture(gl, this.normalTexture, 3);         // <normalTexture>    -> texture3
    bindTexture(gl ,this.resultTexture, 4);         // <resultTexture>     -> texture4
    // 顶点buffer
    var indexArray = new Float32Array(num);
    for (i = 0; i < num; i++) {
        indexArray[i] = i;
    }
    this.screenIndexBuffer = createBuffer(gl, indexArray);
};
App.prototype.initLight = function() {
    this.lightDirection = new Vector3([this.lightDirectionX, this.lightDirectionY, this.lightDirectionZ]);
    this.lightDirection.normalize();
};
App.prototype.readData = function() {
    this.tracks = [];
    var trackNum = this.trackNum;
    var trackLen = this.trackLen;
    for (var i = 0; i < trackNum; i++){
        var track = [];
        for (var j = 0; j < getRnd(1, trackLen); j++){
            track.push(new Vec2(getRnd(-1, 1), getRnd(-1, 1), 'screen', gl.canvas.width, gl.canvas.height));
        }
        this.tracks.push(track);
    }
    if(!this.rndData){
        this.tracks = [[this.pt1,this.pt2]]; // for test
    }
    function getRnd(min, max) {
        return (Math.random() * (max - min) + min);
    }
};
App.prototype.drawPoints = function() {
    for(var i = 0;i < this.tracks.length; i++){
        for(var j = 0; j < this.tracks[i].length - 1; j++){
            this.drawPoint(this.tracks[i][j], this.tracks[i][j+1]);
        }
    }
};
App.prototype.drawPoint = function(pt1,pt2) {
    gl.useProgram(this.pt_program.program);
    var vBuffer = createBuffer(gl, new Float32Array([pt1.x, pt1.y, pt2.x, pt2.y]));
    bindAttribute(gl, vBuffer, this.pt_program.a_pos, 2);
    gl.drawArrays(gl.LINES, 0, 2);
    gl.drawArrays(gl.POINTS, 0, 2);
};
App.prototype.drawScreen = function() {
    this.drawLines();
    this.initLight();

    if(this.useTexture){
        // 将密度图绘制成颜色图
        var program = this.color_program;
        gl.useProgram(program.program);
        bindAttribute(gl, this.screenIndexBuffer, program.a_index, 1);
        gl.uniform1f(program.u_width, gl.canvas.width);
        gl.uniform1f(program.u_height, gl.canvas.height);
        bindTexture(gl, this.screenTexture, 0);
        gl.uniform1i(program.u_sampler, 0); // texture0 --> screenTexture

        this.enableBuffer(this.colorTexture);
        gl.drawArrays(gl.POINTS, 0, gl.canvas.width * gl.canvas.height);
        this.disableBuffer();

        // 将密度图绘制成法线图
        program = this.shading_program;
        gl.useProgram(program.program);
        bindAttribute(gl, this.screenIndexBuffer, program.a_index, 1);
        gl.uniform1f(program.u_width, gl.canvas.width);
        gl.uniform1f(program.u_height, gl.canvas.height);
        bindTexture(gl, this.screenTexture, 0);
        gl.uniform1i(program.u_sampler, 0); // texture0 --> screenTexture

        this.enableBuffer(this.normalTexture);
        gl.drawArrays(gl.POINTS, 0, gl.canvas.width * gl.canvas.height);
        this.disableBuffer();

        // 根据颜色和法线绘制出最终的效果
        program = this.result_program;
        gl.useProgram(program.program);
        bindAttribute(gl, this.screenIndexBuffer, program.a_index, 1);
        gl.uniform1f(program.u_width, gl.canvas.width);
        gl.uniform1f(program.u_height, gl.canvas.height);
        gl.uniform3fv(program.u_lightDirection, this.lightDirection.elements);
        gl.uniform1i(program.u_sampler_color, 2);  // texture2 --> colorTexture
        gl.uniform1i(program.u_sampler_normal, 3); // texture3 --> normalTexture

        this.enableBuffer(this.resultTexture);
        gl.drawArrays(gl.POINTS, 0, gl.canvas.width * gl.canvas.height);
        this.disableBuffer();

        // 根据配置项决定最终在屏幕上呈现哪项纹理
        var textureIndex = 0; // 0 -> <screenTexture>

        if(this.showClr){
            textureIndex = 2; // 2 -> <colorTexture>
        }
        if(this.showShading){
            textureIndex = 3; // 3 -> <normalTexture>
        }
        if(this.showResult){
            textureIndex = 4; // 4 -> <resultTexture>
        }
        this.drawTexture(textureIndex);

        // 去除绘制残留
        this.clearTexture(this.screenTexture);
        this.clearTexture(this.backgroundTexture);
        this.clearTexture(this.colorTexture);
    }
};
App.prototype.drawLines = function() {
    for(var i = 0;i <this.tracks.length; i++){
        for(var j = 0; j < this.tracks[i].length - 1; j++){
            this.drawLine(this.tracks[i][j], this.tracks[i][j+1]);
        }
    }
};
App.prototype.drawLine = function(pt1, pt2) {
    var cWidth = gl.canvas.width;
    var cHeight = gl.canvas.height;
    var xyScale = cWidth / cHeight; // this parameter is for fixing the webGL's coord bug
    var screen_pt1 = pt1;
    var screen_pt2 = pt2;
    var real_pt1 = pt1.toRealCoord();
    var real_pt2 = pt2.toRealCoord();
    var dis_x = real_pt2.x - real_pt1.x;
    var dis_y = real_pt2.y - real_pt1.y;
    var dis = (new Vec2(dis_x, dis_y)).length();
    var angle = Math.atan(dis_y / dis_x) * 180.0 / 3.1415926;
    var width = Math.floor(dis + 2 * this.r);
    var height = Math.floor(2 * this.r);
    var num = width * height;
    var indexArray = new Float32Array(num);
    for (var i = 0; i < num; i++) {
        indexArray[i] = i;
    }
    var indexBuffer = createBuffer(gl, indexArray);
    var offsetVector = new Vec2(pt1.x - pt2.x, pt1.y-pt2.y);
    var offset = offsetVector.length();
    var scale_x = (offset / (dis / width)) / 2.0;
    var scale_y = (this.r * offset / dis) / 1.0;

    // set Matrix (from <Texture> coord to <Screen> coord)
    var mat = new Matrix4();
    mat.setScale(1.0, xyScale, 1.0);
    mat.translate((pt1.x + pt2.x) / 2.0, (pt1.y + pt2.y) / 2.0, 0.0);
    mat.rotate(angle, 0.0, 0.0, 1.0);
    mat.scale(scale_x, scale_y, 1.0);

    var program = this.line_program;
    gl.useProgram(program.program);
    bindAttribute(gl, indexBuffer, program.a_index, 1);
    gl.uniform1f(program.u_width, width);
    gl.uniform1f(program.u_height, height);
    gl.uniformMatrix4fv(program.u_matrix, false, mat.elements);
    gl.uniform1f(program.u_line_length, dis);
    gl.uniform1f(program.u_r, this.r);

    bindTexture(gl, this.backgroundTexture, 1);
    gl.uniform1i(program.u_sampler_screen, 1);

    if(this.useTexture){
        // 启用帧缓冲(这样接下来的的绘制操作都是在temptexture中进行而不是屏幕)
        this.enableBuffer(this.screenTexture);
    }

    // 绘制
    gl.drawArrays(gl.POINTS, 0, num);

    if(this.useTexture){
        // 关闭帧缓冲
        this.disableBuffer();

        // 将screenTexture复制给backgroundTexture (js都是浅层复制，只能这么做)
        this.enableBuffer(this.backgroundTexture);
        this.drawTexture(0); // 绘制 0 号纹理
        this.disableBuffer();
    }

};
// 将给定纹理绘制到屏幕上（或当前缓冲区内）
App.prototype.drawTexture = function(inputTextureIndex) {
    console.log("draw texture" + inputTextureIndex);
    var program = this.draw_program;
    gl.useProgram(program.program);
    bindAttribute(gl, this.screenIndexBuffer, program.a_index, 1);
    gl.uniform1f(program.u_width, gl.canvas.width);
    gl.uniform1f(program.u_height, gl.canvas.height);

    gl.uniform1i(program.u_sampler, inputTextureIndex);

    gl.drawArrays(gl.POINTS, 0, gl.canvas.height * gl.canvas.width);
};
// 完全清空一个纹理->rgba(1.0, 1.0, 1.0, 1.0)
App.prototype.clearTexture = function(texture, r, g, b ,a) {
    var R = r || 1.0;
    var G = g || 1.0;
    var B = b || 1.0;
    var A = a || 1.0;
    this.enableBuffer(texture);
    clearGL(gl, r, g, b ,a);
    this.disableBuffer();
};
// 启用缓冲区
App.prototype.enableBuffer = function(outputTexture) {
    if(typeof(outputTexture) == "undefined"){
        console.log('Please input a texture for the output of framebuffer!');
        return;
    }
    bindFramebuffer(gl, this.framebuffer, outputTexture);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
};
// 关闭缓冲区
App.prototype.disableBuffer = function() {
    bindFramebuffer(gl, null);
};
