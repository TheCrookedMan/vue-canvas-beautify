<template>
<div id="app">
    <div>
      <operation-image :image-list="imageList"></operation-image>
    </div>
    <!-- <canvas id="test"></canvas> -->
</div>
</template>

<script>
import operationImage from './components/operationImage/index.vue'

import __1 from './assets/1.png'
import __2 from './assets/2.jpeg'
import __3 from './assets/3.jpeg'
import __4 from './assets/WechatIMG65.jpeg'
import __test1 from './assets/test1.jpeg'
import __test2 from './assets/test2.jpeg'
import __test3 from './assets/test3.jpeg'
import __test4 from './assets/test4.jpeg'
import __test5 from './assets/test5.jpeg'
import __test6 from './assets/test6.jpeg'

export default {
    name: 'app',
    data(){
      return {
        // imageList: [__4,__3,'http://www.dev-oss.image.bestarschool.com/PROBLEM/20190307/onssD5tUvSFHz7ibgM1LIkckZ944/1551954504021.PNG',__1]
        imageList: [__test1,__test2,__test3,__test4,__test5,__test6]
      }
    },
    components: {
      'operation-image': operationImage
    },
    mounted(){
      // let canvas = document.getElementById('test'),context = canvas.getContext("2d");
      // canvas.width = 1080
      // canvas.height = 1440
      // let img = new Image()
      // img.onload = function(){
      //   context.translate(canvas.width ,0)
      //   context.rotate(90 * (Math.PI / 180));
      //   context.drawImage(this, 0, 0, canvas.height,canvas.width)
      // }
      // img.src = __test3
    }
}
</script>

<style lang="less">
#app {
    font-family: 'Avenir', Helvetica, Arial, sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    text-align: center;
    color: #2c3e50;
    margin-top: 60px;
    overflow: hidden;
}

html{
  overflow: hidden;
  height: 100%;
}
</style>
