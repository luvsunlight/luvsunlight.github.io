<template>
  <div id="app">
    <div class="container">
        <Talker
            :message="currentMessage"
        ></Talker>
    </div>
    <Scene></Scene>
  </div>
</template>

<script>
// import * as THREE from './js/THREE.js'
import Scene from "./components/Scene.vue";
import Talker from "./components/Talker.vue";

export default {
    name: "app",
    mounted() {
        let vm = this
        setInterval(function () {
            vm.messageIndex = Math.floor(Math.random() * vm.messageList.length)
        },5000)
    },
    data() {
        return {
            messageList: [
                "西西你好", 
                "我是李子园的心心",
                "你可以陪我说几句话吗"
            ],
            messageIndex: 1,
        };
    },
    computed: {
        currentMessage() {
            return this.messageList[this.messageIndex]
        }
    },
    components: {
        Scene,
        Talker
    }
};
</script>

<style>
#app {
    font-family: "Avenir", Helvetica, Arial, sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    text-align: center;
    color: #2c3e50;
    position: relative;
}

html,
body {
    margin: 0;
    height: 100%;
}

.container {
    position: absolute;
    width: 100%;
    height: 100%;
    background: transparent;
    pointer-events: none;
}

a {
    color: #42b983;
}
</style>
