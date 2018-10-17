<template>
</template>

<script>
import OBJLoader from "../js/OBJLoader.js";
import OrbitControls from "../js/OrbitControl.js";

export default {
    data() {
        return {
            scene: null,
            renderer: null,
            camera: null,
            light: null,
            controls: null,
            objScale: 0.1
        };
    },
    mounted() {
        this.initRender()
        this.initScene()
        this.initCamera()
        this.initLight()
        this.initModel()
        this.initControls()
        this.animate()

        window.onresize = this.onWindowResize;
    },
    methods: {
        initRender() {
            this.renderer = new THREE.WebGLRenderer({ antialias: true });
            this.renderer.setSize(window.innerWidth, window.innerHeight);
            this.renderer.setClearColor(0xffffff);
            document.getElementById("app").appendChild(this.renderer.domElement)
        },
        initScene() {
            this.scene = new THREE.Scene();
        },
        initCamera() {
            this.camera = new THREE.PerspectiveCamera(
                45,
                window.innerWidth / window.innerHeight,
                0.1,
                1000
            );
            this.camera.position.set(0, 40, 50);
            this.camera.lookAt(new THREE.Vector3(0, 0, 0));
        },
        initLight() {
            this.scene.add(new THREE.AmbientLight(0x444444));
            this.light = new THREE.PointLight(0xffffff);
            this.light.position.set(0, 0, 1000);
            this.light.castShadow = true;
            this.scene.add(this.light);
        },
        initModel() {
            let loader = new OBJLoader();
            let scene = this.scene;
            let objScale = this.objScale;
            loader.load("./src/assets/Heart.obj", function(loadedMesh) {
                var material = new THREE.MeshLambertMaterial({
                    color: 0xff0000
                });
                loadedMesh.children.forEach(function(child) {
                    child.material = material;
                    child.geometry.computeFaceNormals();
                    child.geometry.computeVertexNormals();
                });
                loadedMesh.scale.set(objScale, objScale, objScale);
                loadedMesh.rotation.x = -0.5;
                loadedMesh.rotation.y = 0.35;
                loadedMesh.rotation.z = 0.2;
                scene.add(loadedMesh);
            });
        },
        initControls() {
            this.controls = new OrbitControls(
                this.camera,
                this.renderer.domElement
            );
            this.controls.enableDamping = true;
            this.controls.enableZoom = true;
            this.controls.autoRotate = true;
            this.controls.enablePan = true;
        },
        render() {
            this.renderer.render(this.scene, this.camera);
        },
        animate() {
            this.render();
            this.controls.update();
            requestAnimationFrame(this.animate);
        },
        onWindowResize() {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.render();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        }
    },
    computed: {
        canvasElement() {
            if (this.renderer !== null) {
                return this.renderer.domElement
            } else {
                return document.createElement('div')
            }
        }
    }
};
</script>

<style>
</style>