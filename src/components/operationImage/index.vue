<template>
    <div class="container">
        <div class="beautify-header" ref="header">
            <span class="btn-cancel" @click.stop.prevent="cancel">返回</span>
            <span class="btn-advance">
                <i class="iconfont icon-advance" v-if="operateStack.length > 0 && operateStackIndex >= 0" @click.stop.prevent="preOperateStack"></i>
                <i class="iconfont icon-advance icon-display" v-else></i>
            </span>
            <span class="btn-retreat">
                <i class="iconfont icon-retreat" v-if="operateStack.length > 0 && operateStackIndex < operateStack.length - 1" @click.stop.prevent="nextOperateStack"></i>
                <i class="iconfont icon-retreat icon-display" v-else></i>
            </span>
            <span class="btn-save" @click.stop.prevent="submit">保存</span>
        </div>
        <div class="beautify-body" ref="body">
        </div>
        <div class="beautify-footer" ref="footer">
            <div class="main-control-panel flexbox" ref="mainControlPanel">
                <div class="flex-item" @click.stop.prevent="crop">
                    <i class="iconfont icon-crop"></i>
                    <p>裁切旋转</p>
                </div>
                <div class="flex-item" @click.stop.prevent="beginDoodle">
                    <i class="iconfont icon-tubiao2tuya"></i>
                    <p>涂鸦</p>
                </div>
                <div class="flex-item" @click.stop.prevent="beginColorHandle">
                    <i class="iconfont icon-quse-"></i>
                    <p>去色</p>
                </div>
            </div>
            <div class="crop-control-panel" ref="cropControlPanel">
                <div class="crop-operation-panel">
                    <div class="crop-operation-list">
                        <div class="crop-operation-item" @click.stop.prevent="rotate">
                            <i class="iconfont icon-xuanzhuan"></i>
                            <p>旋转</p>
                        </div>
                        <div class="crop-operation-item" @click.stop.prevent="reverse">
                            <i class="iconfont icon-fanzhuan"></i>
                            <p>翻转</p>
                        </div>
                        <div class="crop-operation-item" :class="{checked:'freedom' === currentCropType}" @click.stop.prevent="chooseCropViewBox('freedom')">
                            <i class="iconfont icon-ziyou-"></i>
                            <p>自由</p>
                        </div>
                        <div class="crop-operation-item" :class="{checked:'1:1' === currentCropType}" @click.stop.prevent="chooseCropViewBox('1:1')">
                            <i class="iconfont icon-bi6"></i>
                            <p>1:1</p>
                        </div>
                        <div class="crop-operation-item" :class="{checked:'3:4' === currentCropType}" @click.stop.prevent="chooseCropViewBox('3:4')">
                            <i class="iconfont icon-bi3"></i>
                            <p>3:4</p>
                        </div>
                        <div class="crop-operation-item" :class="{checked:'4:3' === currentCropType}" @click.stop.prevent="chooseCropViewBox('4:3')">
                            <i class="iconfont icon-bi5"></i>
                            <p>4:3</p>
                        </div>
                        <div class="crop-operation-item" :class="{checked:'9:16' === currentCropType}" @click.stop.prevent="chooseCropViewBox('9:16')">
                            <i class="iconfont icon-bi4"></i>
                            <p>9:16</p>
                        </div>
                        <div class="crop-operation-item" :class="{checked:'16:9' === currentCropType}" @click.stop.prevent="chooseCropViewBox('16:9')">
                            <i class="iconfont icon-bi1"></i>
                            <p>16:9</p>
                        </div>
                        <div class="crop-operation-item" :class="{checked:'2:3' === currentCropType}" @click.stop.prevent="chooseCropViewBox('2:3')">
                            <i class="iconfont icon-bi2"></i>
                            <p>2:3</p>
                        </div>
                        <div class="crop-operation-item" :class="{checked:'3:2' === currentCropType}" @click.stop.prevent="chooseCropViewBox('3:2')">
                            <i class="iconfont icon-bi"></i>
                            <p>3:2</p>
                        </div>
                    </div>
                </div>
                <div class="final-operation flexbox">
                    <div class="flex-item">
                        <i class="iconfont icon-scha" @click.stop.prevent="cancelCropImage"></i>
                    </div>
                    <div class="flex-item">裁切旋转</div>
                    <div class="flex-item">
                        <i class="iconfont icon-duigou3" @click.stop.prevent="sureCropImage"></i>
                    </div>
                </div>
            </div>
            <div class="doodle-control-panel" ref="doodleControlPanel">
                <div class="doodle-operation-panel">
                    <div class="doodle-color-list">
                        <div class="doodle-color-item" v-for="(item) in doodleColorSpanList" :key="item.id" @click.stop.prevent="chooseDoodleColor(item)">
                            <span :style="{backgroundColor:item}" :class="{'checked':item === currentPencilColor}"></span>
                        </div>
                    </div>
                    <div class="doodle-operation-list">
                        <div class="doodle-operation-item pencil-text">
                            <p>画笔大小</p>
                        </div>
                        <div class="doodle-operation-item doodle-circle">
                            <div class="doodle-circle-item" @click.stop.prevent="chooseDoodleSize('S')">
                                <span class="circle" :class="{checked: 'S' === currentDoodleSize && 'pencil' === currentDoodleTool}"></span>
                            </div>
                            <div class="doodle-circle-item" @click.stop.prevent="chooseDoodleSize('M')">
                                <span class="circle" :class="{checked: 'M' === currentDoodleSize && 'pencil' === currentDoodleTool}"></span>
                            </div>
                            <div class="doodle-circle-item" @click.stop.prevent="chooseDoodleSize('L')">
                                <span class="circle" :class="{checked: 'L' === currentDoodleSize && 'pencil' === currentDoodleTool}"></span>
                            </div>
                            <div class="doodle-circle-item" @click.stop.prevent="chooseDoodleSize('XL')">
                                <span class="circle" :class="{checked: 'XL' === currentDoodleSize && 'pencil' === currentDoodleTool}"></span>
                            </div>
                            <div class="doodle-circle-item" @click.stop.prevent="chooseDoodleSize('XXL')">
                                <span class="circle" :class="{checked: 'XXL' === currentDoodleSize && 'pencil' === currentDoodleTool}"></span>
                            </div>
                        </div>
                        <div class="doodle-operation-item doodle-rubber" :class="{checked: 'rubber' === currentDoodleTool}" @click.stop.prevent="chooseDoodleRubber">
                            <i class="iconfont icon-xiangpica"></i>
                        </div>
                    </div>
                    <div class="final-operation flexbox">
                        <div class="flex-item">
                            <i class="iconfont icon-scha" @click.stop.prevent="cancelDoodleImage"></i>
                        </div>
                        <div class="flex-item">涂鸦</div>
                        <div class="flex-item">
                            <i class="iconfont icon-duigou3" @click.stop.prevent="sureDoodleImage"></i>
                        </div>
                    </div>
                </div>
            </div>
            <div class="color-control-panel" ref="colorControlPanel">
                <div class="final-operation flexbox">
                        <div class="flex-item">
                            <i class="iconfont icon-scha" @click.stop.prevent="cancelColorHandle"></i>
                        </div>
                        <div class="flex-item">去色</div>
                        <div class="flex-item">
                            <i class="iconfont icon-duigou3" @click.stop.prevent="sureColorHandle"></i>
                        </div>
                    </div>
            </div>
        </div>

        <div class="btn-pre" v-if="currentIndex > 0 && showPreAndNextBtn">
            <i class="iconfont icon-arrow_left1" @click.stop.prevent="preImage"></i>
        </div>
        <div class="btn-next" v-if="currentIndex < imageList.length - 1 && showPreAndNextBtn">
            <i class="iconfont icon-arrow_right" @click.stop.prevent="nextImage"></i>
        </div>
    </div>
</template>
<script>
import operationImage from './operationImage.js'
export default {
    name: 'OperationImage',
    data(){
      return {
        operationImage: null,
        currentIndex: 0,
        showPreAndNextBtn: true,
        operateStack: [],
        operateStackIndex: -1,
        doodleColorSpanList:['#bd834f','#ed475e','#f3af3b','#ffffff','#f8fa51','#63e671','#63e6fb','#51c1f9','#b565f7','#ed599e','#c3c3c3','#000000'],
        currentPencilColor: '#ffffff',
        currentDoodleTool:'pencil',
        currentDoodleSize: 'L',
        currentCropType: 'freedom'
      }
    },
    props:{
        imageList:{
            type: Array,
            required: true
        }
    },
    components: {

    },
    beforeCreate(){
        
    },
    mounted() {
        this.operationImage = new operationImage(this.imageList,document.getElementsByClassName('beautify-body')[0])
        let self = this
        this.operationImage.onOperateStackChange = function(){
            self.operateStack = self.operationImage.imageList[self.operationImage.currentIndex].operateStack
            self.operateStackIndex = self.operationImage.imageList[self.operationImage.currentIndex].operateStackIndex
        }
        this.operationImage.onImageChange = function(){
            self.operateStack = self.operationImage.imageList[self.operationImage.currentIndex].operateStack
            self.operateStackIndex = self.operationImage.imageList[self.operationImage.currentIndex].operateStackIndex
        }
    },
    methods: {
        crop() {
          this.$refs.mainControlPanel.style.display = 'none'
          this.$refs.header.style.display = 'none'
          this.$refs.cropControlPanel.style.display = 'block'
          this.operationImage.crop()
          this.showPreAndNextBtn = false
        },
        preImage(){
          let self = this;
          this.operationImage.preImage(function(currentIndex){
              self.currentIndex = currentIndex
          })
        },
        nextImage(){
          let self = this;
          this.operationImage.nextImage(function(currentIndex){
              self.currentIndex = currentIndex
          })
        },
        cancelCropImage(){
            this.operationImage.cancelCropImage()
            this.$refs.mainControlPanel.style.display = 'flex'
            this.$refs.header.style.display = 'flex'
            this.$refs.cropControlPanel.style.display = 'none'
            this.showPreAndNextBtn = true
            this.currentCropType = 'freedom'
        },
        sureCropImage(){
            this.operationImage.sureCropImage()
            console.log("sureCropImage:::::")
            this.$refs.mainControlPanel.style.display = 'flex'
            this.$refs.header.style.display = 'flex'
            this.$refs.cropControlPanel.style.display = 'none'
            this.showPreAndNextBtn = true
            this.currentCropType = 'freedom'
        },
        chooseCropViewBox(cropModel){
            this.currentCropType = cropModel
            this.operationImage.chooseCropViewBox(cropModel)
        },
        nextOperateStack(){
            this.operationImage.nextOperateStack()
        },
        preOperateStack(){
            this.operationImage.preOperateStack()
        },
        beginDoodle(){
            this.currentDoodleTool = 'pencil'
            this.currentPencilColor = '#ffffff'
            this.currentDoodleSize = 'L'
            
            this.$refs.mainControlPanel.style.display = 'none'
            this.$refs.header.style.display = 'none'
            this.$refs.doodleControlPanel.style.display = 'block'
            this.operationImage.beginDoodle()
            this.showPreAndNextBtn = false
        },
        sureDoodleImage(){
            this.$refs.mainControlPanel.style.display = 'flex'
            this.$refs.header.style.display = 'flex'
            this.$refs.doodleControlPanel.style.display = 'none'
            this.showPreAndNextBtn = true
            this.operationImage.sureDoodleImage()
        },
        cancelDoodleImage(){
            this.$refs.mainControlPanel.style.display = 'flex'
            this.$refs.header.style.display = 'flex'
            this.$refs.doodleControlPanel.style.display = 'none'
            this.showPreAndNextBtn = true
            this.operationImage.cancelDoodleImage()
        },
        chooseDoodleColor(val){
            this.currentPencilColor = val
            this.operationImage.setDoodleColor(this.currentPencilColor)
        },
        chooseDoodleSize(val){
            this.currentDoodleSize = val
            this.operationImage.setDoodleSize(this.currentDoodleSize)
            this.currentDoodleTool = 'pencil'
            this.operationImage.setDoodleTool(this.currentDoodleTool)
        },
        chooseDoodleRubber(){
            this.currentDoodleTool = 'rubber'
            this.operationImage.setDoodleTool(this.currentDoodleTool)
        },
        beginColorHandle(){
            this.$refs.mainControlPanel.style.display = 'none'
            this.$refs.header.style.display = 'none'
            this.$refs.colorControlPanel.style.display = 'block'
            this.showPreAndNextBtn = false
            this.operationImage.beginColorHandle()
        },
        cancelColorHandle(){
            this.$refs.mainControlPanel.style.display = 'flex'
            this.$refs.header.style.display = 'flex'
            this.$refs.colorControlPanel.style.display = 'none'
            this.showPreAndNextBtn = true
            this.operationImage.cancelColorHandle()
        },
        sureColorHandle(){
            this.$refs.mainControlPanel.style.display = 'flex'
            this.$refs.header.style.display = 'flex'
            this.$refs.colorControlPanel.style.display = 'none'
            this.showPreAndNextBtn = true
            this.operationImage.sureColorHandle()
        },
        cancel(ev){
            this.$emit('cancel')
        },
        submit(ev){
            let list = this.operationImage.returnImageList()
            this.$emit('submit',{
                imageList : list
            })
        },
        rotate(){
            this.operationImage.rotate()
        },
        reverse(){
            this.operationImage.reverse()
        }
    }
}
</script>

<style lang="less" scoped>
.container {
    position: absolute;
    left: 0;
    right: 0;
    top: 0;
    bottom: 0;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    background: color(#fff);
    color: #000;
    text-align: center;

    .beautify-header {
        height: 40px;
        width: 100%;
        position: relative;
        display: flex;
        span{
            flex: 1;
            line-height: 40px;
        }
        .btn-advance{
            text-align: right;
            .icon-advance {
                font-size: 24px;
                margin-right: 5px;
            }
        }
        .btn-retreat{
            text-align: left;
            .icon-retreat{
                font-size: 24px;
                margin-left: 5px;
            }
        }
        .btn-cancel{
            font-size: 14px;
            font-weight: 600;
            text-align: left;
            margin-left: 10px;
        }

        .btn-save {
            font-size: 14px;
            font-weight: 600;
            text-align: right;
            margin-right: 10px;
        }

        .icon-display{
            color: #9e9e9e;
        }

    }

    .beautify-body {
        flex: 1;
        overflow: hidden;
        text-align: center;
        display: flex;
        flex-direction: column;
        justify-content: center;
        position: relative;
    }

    .beautify-footer {
        .main-control-panel {
            padding: 10px 0px 5px;
            .flex-item {
                display: flex;
                flex-direction: column;
                justify-content: center;
                p {
                    margin: 3px 0px;
                    text-align: center;
                    font-size: 12px;
                    transform: scale(0.8);
                    font-weight: 600;
                }
                .iconfont {
                    font-size: 28px;
                }
            }
        }
        .crop-control-panel{
          display: none;
          .crop-operation-panel{
            overflow-x: scroll;
            -webkit-overflow-scrolling:touch;
            .crop-operation-list{
                overflow: hidden;
                width: 600px;
                .crop-operation-item{
                    display: inline-block;
                    float: left;
                    padding-top: 20px;
                    width: 60px;
                    i{
                        font-size: 24px;
                    }
                    p{
                        margin: 0;
                        font-size: 14px;
                        font-weight: 600;
                        transform: scale(.8)
                    }
                    &.checked {
                        color: #da1470;
                    }
                }
            }
          }
          .final-operation{
              &>:first-child{
                  overflow: hidden;
                  i{
                      float: left;
                      font-size: 24px;
                      padding: 5px 20px;
                  }
              }
              &>:nth-child(2){
                  font-size: 14px;
                  transform: scale(0.9);
                  height: 36px;
                  line-height: 36px;
              }
              &>:last-child{
                  overflow: hidden;
                  i{
                      float: right;
                      font-size: 24px;
                      padding: 5px 20px;
                  }
              }
          }
        }
        .doodle-control-panel{
            display: none;
            .doodle-operation-panel{
                overflow-x: scroll;
                -webkit-overflow-scrolling:touch;
                .doodle-operation-list{
                    display: flex;
                    .doodle-operation-item{
                        height: 40px;
                        line-height: 40px;
                    }
                    .pencil-text{
                        font-size: 12px;
                        padding: 0 15px;
                        p{
                            margin: 0;
                        }
                    }
                    .doodle-rubber{
                        padding: 0 20px;
                        >i{
                            font-size: 24px;
                        }
                        &.icon-display{
                            color: #9e9e9e;
                        }
                        &.checked{
                            color: #da1470;
                        }
                    }
                    .doodle-circle{
                        flex: 1;
                        display: flex;
                        padding-left: 10px;
                        .doodle-circle-item{
                            flex: 1;
                            height: 40px;
                            display: flex;
                            align-items: center;
                            text-align: center;
                            // border:1px solid #000;
                            .circle{
                                background-color: #000;
                                // border:1px solid red;
                                display: inline-block;
                                &.checked{
                                    background-color: #da1470;
                                }
                            }
                            &:nth-child(1){
                                .circle{
                                    width: 12px;
                                    height: 12px;
                                    border-radius: 450%;
                                    transform: scale(.7);
                                }
                            }
                            &:nth-child(2){
                                .circle{
                                    width: 10px;
                                    height: 10px;
                                    border-radius: 50%;
                                    // transform: scale(.9);
                                }
                            }
                            &:nth-child(3){
                                .circle{
                                    width: 14px;
                                    height: 14px;
                                    border-radius: 40px;
                                    // transform: scale(1.1);
                                }
                            }
                            &:nth-child(4){
                                .circle{
                                    width: 17px;
                                    height: 17px;
                                    border-radius: 40px;
                                    // transform: scale(1.3);
                                }
                            }
                            &:nth-child(5){
                                .circle{
                                    width: 20px;
                                    height: 20px;
                                    border-radius: 40px;
                                    // transform: scale(1.5);
                                }
                            }
                        }
                    }
                }
            }
            .final-operation{
                &>:first-child{
                    overflow: hidden;
                    i{
                        float: left;
                        font-size: 24px;
                        padding: 5px 20px;
                    }
                }
                &>:nth-child(2){
                    font-size: 14px;
                    transform: scale(0.9);
                    height: 36px;
                    line-height: 36px;
                }
                &>:last-child{
                    overflow: hidden;
                    i{
                        float: right;
                        font-size: 24px;
                        padding: 5px 20px;
                    }
                }
            }
        }
        .doodle-color-list{
            overflow: hidden;
            display: flex;
            .doodle-color-item{
                flex: 1;
                span{
                    width: 100%;
                    height: 30px;
                    display: inline-block;
                    float: left;
                    &.checked{
                        transition: transform .1s;
                        transform:scale(1.2);
                    }   
                }
            }
        }
        .color-control-panel{
            display: none;
            .final-operation{
                &>:first-child{
                    overflow: hidden;
                    i{
                        float: left;
                        font-size: 24px;
                        padding: 5px 20px;
                    }
                }
                &>:nth-child(2){
                    font-size: 14px;
                    transform: scale(0.9);
                    height: 36px;
                    line-height: 36px;
                }
                &>:last-child{
                    overflow: hidden;
                    i{
                        float: right;
                        font-size: 24px;
                        padding: 5px 20px;
                    }
                }
            }
        }
    }

    .btn-pre{
        position: fixed;
        top: 40%;
        left: 0;
        width: 50px;
        height: 50px;
        line-height: 50px;
        background-color: #00000045;
        .iconfont {
            font-size: 30px;
            color: #fff;
        }
    }

    .btn-next{
        position: fixed;
        top: 40%;
        right: 0;
        width: 50px;
        height: 50px;
        line-height: 50px;
        background-color: #00000045;
        .iconfont {
            font-size: 30px;
            color: #fff;
        }
    }

    .flexbox{
        display:flex;
        text-align: center;
        .flex-item{
            flex:1;
        }
    }
}




</style>
