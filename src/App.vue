<template>
<div id="app">
    <div>
      <operation-image :image-list="imageList"></operation-image>
    </div>
</div>
</template>

<script>
import operationImage from './components/operationImage/index.vue'

import __1 from './assets/1.png'
import __2 from './assets/2.jpeg'
import __3 from './assets/3.jpeg'

export default {
    name: 'app',
    data(){
      return {
        imageList: ['http://www.dev-oss.image.bestarschool.com/PROBLEM/20190307/onssD5tUvSFHz7ibgM1LIkckZ944/1551954504021.PNG',__1,__3]
      }
    },
    components: {
      'operation-image': operationImage
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
