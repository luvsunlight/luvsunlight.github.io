/*------------------------------------------------------------------------------------

    Program:             line_program      ----->  draw_program
                         (绘制线段至纹理)            （绘制至屏幕上）

    Texture:             screenTexture     ---->   backgroundTexture

------------------------------------------------------------------------------------*/
var gl = getGL(window, {preserveDrawingBuffer:true});
app = new App();
initGUI(app);

function initGUI(app) {
    var opt = {drawPt:false};
    var gui = new dat.GUI();
    redraw = function(){
        clearGL(gl);
        if(opt.drawPt){
            app.drawPoints();
        }else{
            app.drawScreen();
        }
    };
    redraw();
    gui.add(app,'r', 0, 200).name('r').onChange(redraw);
    gui.add(opt,'drawPt').name('showFrame').onChange(redraw);
    gui.add(app,'useTexture').name("使用纹理").onChange(redraw);
    gui.add(app,'showClr').name("显示颜色").onChange(redraw);
    gui.add(app,'showShading').name("显示法线图").onChange(redraw);
    gui.add(app,'showResult').name("显示最终效果").onChange(redraw);

    var dFolder = gui.addFolder('数据设置');
    dFolder.open();
    dFolder.add(app,'rndData').name("采用随机数据").onChange(function(){app.readData();redraw();});
    dFolder.add(app,'trackLen',1, 10).step(1).name('轨迹长度').onChange(function(){app.readData();redraw();});
    dFolder.add(app,'trackNum',1, 10).step(1).name('轨迹条数').onChange(function(){app.readData();redraw();});

    var lFolder = gui.addFolder('光照设置');
    lFolder.add(app,'lightDirectionX', -1, 1).name('DirectionX').onChange(redraw);
    lFolder.add(app,'lightDirectionY', -1, 1).name('DirectionY').onChange(redraw);
    lFolder.add(app,'lightDirectionZ', -10, 10).name('DirectionZ').onChange(redraw);
}
