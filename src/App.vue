<template>
<div id="app">
    <div>
      <operation-image :image-list="imageList"></operation-image>
      <!-- <img id="image" :src="imageList[1]"> -->
    </div>
</div>
</template>

<script>
import operationImage from './components/operationImage/index.vue'
import Cropper from '/Users/chenyuwu/workSpace/workSpace/self-research-project/source-code/cropperjs/src/index.js';
import 'cropperjs/dist/cropper.css'

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
        imageList: [__4,__3,'http://www.dev-oss.image.bestarschool.com/PROBLEM/20190307/onssD5tUvSFHz7ibgM1LIkckZ944/1551954504021.PNG',__1]
        // imageList: [__1,__test1,__test2,__test3,__test4,__test5,__test6]
      }
    },
    components: {
      'operation-image': operationImage
    },
    mounted(){
      // new Cropper(document.getElementById('image'),{
      //   aspectRatio: 16 / 9,
      //   crop(event) {
      //     console.log(event.detail.x);
      //     console.log(event.detail.y);
      //     console.log(event.detail.width);
      //     console.log(event.detail.height);
      //     console.log(event.detail.rotate);
      //     console.log(event.detail.scaleX);
      //     console.log(event.detail.scaleY);
      //   },
      // })
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

#image{
  max-width: 100%;
}

html{
  overflow: hidden;
  height: 100%;
}
</style>
