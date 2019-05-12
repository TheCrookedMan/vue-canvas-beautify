import './crop.less'
import EXIF from 'exif-js'

export default class operationImage {
  constructor(imageList = [], container, cropModel = 'freedom', cropMinW = 50, cropMinH = 50) {
    if (!imageList && imageList.length === 0) {
      throw new Error('imageList 不能为空')
    } else if ('[object Array]' !== Object.prototype.toString.call(imageList)) {
      throw new Error('imageList 属性值的类型必须是数组!')
    }

    if (!container){
      throw new Error('container 属性不能为空！')
    }

    this.container = container;
    //裁切框模式 ：freedom (自由), 按照比例 3:4 、4:3、9:16、16:9、1:1
    this.cropModel = cropModel 
    //裁切框最小宽度
    this.cropMinW = cropMinW
    //裁切框最小高度
    this.cropMinH = cropMinH

    this.timeStamp = Date.now()

    this.imageDefinition = '1'

    imageList.forEach((I, i) => {
      if (!I.origin && '[object Object]' !== Object.prototype.toString.call(I)) {
        imageList[i] = {
          origin: I
        }
      }
    })
    this.imageList = Object.assign([], imageList)

    this.initImagePrototype()

    this.createCanvas()

    this.currentIndex = 0;
    //最大图片索引数
    this.maxImageIndex = this.imageList.length - 1
    //加载图片
    this.loadImage().then(_ => {
      this.drawCanvasPanel()
    })
  }
  createCanvas() {
    this.canvas = document.createElement('Canvas')
    this.canvas.id = 'drawCanvas'
    this.canvasContainerDiv = document.createElement('div')
    this.canvasContainerDiv.id = 'canvasContainerDiv'
    this.canvasContainerDiv.appendChild(this.canvas)
  }
  loadImage() {
    let img = new Image(),
      self = this,
      __url;
    img.crossOrigin = "anonymous";
    return new Promise(function (resolve, reject) {
      img.onload = function () {
        URL.revokeObjectURL(__url);

        

        self.autoRotateImage(this).then((blob)=>{

          let autoRotateURL = URL.createObjectURL(blob)
          let blobImg = new Image()
          blobImg.onload = function(){
            URL.revokeObjectURL(autoRotateURL);
            console.log("this.height::::", this.height)
            console.log("this.width::::", this.width)
            self.imageList[self.currentIndex]['image'] = this
            self.canvas.height = this.height
            self.canvas.width = this.width
            self.container.appendChild(self.canvasContainerDiv)
            self.context = self.canvas.getContext("2d")
            self.context.drawImage(this, 0, 0)
          }
          blobImg.src = autoRotateURL

        },(result)=>{
          self.imageList[self.currentIndex]['image'] = result
          self.canvas.height = result.height
          self.canvas.width = result.width
          self.container.appendChild(self.canvasContainerDiv)
          self.context = self.canvas.getContext("2d")
          self.context.drawImage(result, 0, 0)
          resolve()
        })
      }
      img.onerror = function (error) {
        console.log("img load error::::",error)
        reject()
      }
      let imageInfo = self.imageList[self.currentIndex]
      
      if (imageInfo.operateStackIndex === -1) {
        if (imageInfo.origin.indexOf('http') !== -1) {
          img.src = imageInfo.origin + '?t=' + self.timeStamp
        } else {
          img.src = imageInfo.origin
        }
      } else {
        __url = URL.createObjectURL(imageInfo.operateStack[imageInfo.operateStackIndex])
        img.src = __url
      }
    })
  }
  //根据图片拍摄角度自动纠正
  autoRotateImage(imgFile){
    return new Promise((resolve,reject)=>{
      let Orientation = null,
        canvas = document.createElement('canvas'),
        ctx = canvas.getContext("2d"),
        deg = Math.PI / 180;

      EXIF.getData(imgFile, function () {
        Orientation = EXIF.getTag(this, "Orientation");
        console.log("Orientation::::", Orientation)
        console.log("imgFile.width", imgFile.width)
        console.log("imgFile.height", imgFile.height)
        switch (Orientation) {
          case 3:
            canvas.width = imgFile.width
            canvas.height = imgFile.height
            ctx.transform(Math.cos(Math.PI), Math.sin(Math.PI), -Math.sin(Math.PI), Math.cos(Math.PI), imgFile.width, imgFile.height);
            ctx.drawImage(imgFile, 0, 0, canvas.width, canvas.height)
            canvas.toBlob(function(result){
              resolve(result)
            }, 'image/webp', 1.0)
            break;
          case 6:
            canvas.width = imgFile.height
            canvas.height = imgFile.width

            ctx.translate(canvas.width / 2, canvas.height / 2)
            ctx.rotate(90 * (Math.PI / 180));
            ctx.drawImage(imgFile, -(canvas.height / 2), -(canvas.width / 2))

            canvas.toBlob(function (result) {
              resolve(result)
            }, 'image/webp', 1.0)
            break;
          case 8:
            canvas.width = imgFile.height
            canvas.height = imgFile.width
            ctx.transform(Math.cos(deg * 270), Math.sin(deg * 270), -Math.sin(deg * 270), Math.cos(deg * 270), 0, imgFile.width);
            ctx.drawImage(imgFile, 0, 0, canvas.width, canvas.height)
            canvas.toBlob(function (result) {
              resolve(result)
            }, 'image/webp', 1.0)
            break;
          default:
            reject(imgFile)
            break;
        }
      })
    })
  }
  calcProportion(width, height) {
    let heightProportion = 0,
      widthProportion = 0;

      if (height < (parseInt(this.container.getBoundingClientRect().height) - 10) && width < (parseInt(this.container.getBoundingClientRect().width)) ) {
        return 1
      } else {
        heightProportion = (parseInt(this.container.getBoundingClientRect().height) - 10) / height;
        widthProportion = (parseInt(this.container.getBoundingClientRect().width) - 10) / width
        return heightProportion > widthProportion ? widthProportion : heightProportion
      }
  }
  drawCanvasPanel(){
    let _currentImage = this.imageList[this.currentIndex]
    _currentImage.proportion = this.calcProportion(_currentImage.image.width, _currentImage.image.height)
    
    let canvasObj = document.getElementById('drawCanvas')
    
    canvasObj.style.transform = 'scale(' + _currentImage.proportion + ')'
    canvasObj.style.transformOrigin = 'left top'
    this.canvasObj = {
      width: canvasObj.getBoundingClientRect().width + 'px',
      height: canvasObj.getBoundingClientRect().height + 'px',
    }
    document.getElementById('canvasContainerDiv').style.width = this.canvasObj.width
    document.getElementById('canvasContainerDiv').style.height = this.canvasObj.height
    document.getElementById('canvasContainerDiv').style.margin = '0 auto'
    this.imageList[this.currentIndex] = _currentImage
  }
  //开始裁切
  crop(){
    this.loadImage().then(_ => {
      this.drawCanvasPanel()
      this.createCropBox()
    })
  }
  //定义裁切框
  chooseCropViewBox(cropModel) {
    if (this.cropModel !== cropModel) {
      this.cropModel = cropModel
      this.destroyCropTouchEvent()
      document.querySelector('.cropper-wrap-box').remove()
      // this.drawCanvasPanel()
      this.createCropBox()
    }
  }

  createCropBox(){
    if (!document.querySelector('.cropper-drag-box')) {
      let dragBox = document.createElement('div')
      dragBox.classList.add('cropper-drag-box')
      dragBox.classList.add('cropper-crop')
      dragBox.classList.add('cropper-modal')
      this.container.appendChild(dragBox)
    }

    let cropperCropBoxInfo = null
    if (!!document.querySelector('.cropper-wrap-box')) {
      cropperCropBoxInfo = document.querySelector('.cropper-crop-box').getBoundingClientRect()
    
      document.querySelector('.cropper-wrap-box').remove()
    }

    let cropBoxTemplate = '<div class="cropper-crop-box"><span class="cropper-view-box"><img></span><span class="cropper-dashed dashed-h"></span><span class="cropper-dashed dashed-v"></span><span class="cropper-face cropper-move"></span><span class="cropper-line line-e"></span><span class="cropper-line line-n"></span><span class="cropper-line line-w"></span><span class="cropper-line line-s"></span><span class="cropper-point point-ne"></span><span class="cropper-point point-nw"></span><span class="cropper-point point-sw"></span><span class="cropper-point point-se"></span></div>'
    let _div = document.createElement('div')
    _div.classList.add('cropper-wrap-box')
    _div.innerHTML = cropBoxTemplate
    this.container.appendChild(_div)
    let _bgImg = document.querySelector('.cropper-view-box>img')
    _bgImg.setAttribute('crossOrigin', 'anonymous')
    _bgImg.src = this.rotateCanvas()
    // _bgImg.src = this.canvas.toDataURL("image/jpeg", 1.0)

    _bgImg.style.width = document.getElementById('canvasContainerDiv').getBoundingClientRect().width + 'px'
    _bgImg.style.height = document.getElementById('canvasContainerDiv').getBoundingClientRect().height + 'px'

    this.initCropBoxSize(cropperCropBoxInfo)
  }
  initCropBoxSize(cropperCropBoxInfo) {
    let cropperCropBox = document.querySelector('.cropper-crop-box'),
      canvas = document.querySelector('#drawCanvas');

    let _imageInfo = this.imageList[this.currentIndex]
    
    _imageInfo.borderlineValue = {
      left: canvas.getBoundingClientRect().left,
      right: canvas.getBoundingClientRect().right,
      top: canvas.getBoundingClientRect().top,
      bottom: canvas.getBoundingClientRect().bottom,
      width: canvas.getBoundingClientRect().width,
      height: canvas.getBoundingClientRect().height
    }
    //计算裁切框大小
    if (!!cropperCropBoxInfo) {
      console.log("cropperCropBoxInfo:::", cropperCropBoxInfo)
      cropperCropBox.style.width = cropperCropBoxInfo.width + 'px'
      cropperCropBox.style.height = cropperCropBoxInfo.height + 'px'
      cropperCropBox.style.top = cropperCropBoxInfo.top + 'px'
      cropperCropBox.style.left = cropperCropBoxInfo.left + 'px'
    } else {
      if (this.cropModel === 'freedom') {
        cropperCropBox.style.width = _imageInfo.borderlineValue.width + 'px'
        cropperCropBox.style.height = _imageInfo.borderlineValue.height + 'px'
        cropperCropBox.style.top = _imageInfo.borderlineValue.top + 'px'
        cropperCropBox.style.left = _imageInfo.borderlineValue.left + 'px'

      } else {
        let scale = this.cropModel.split(":")
        if (scale[0] / scale[1] <= 1) {

          let caclWidth = _imageInfo.borderlineValue.height * (scale[0] / scale[1])
          if (caclWidth <= _imageInfo.borderlineValue.width) {
            cropperCropBox.style.width = caclWidth + 'px'
            cropperCropBox.style.height = _imageInfo.borderlineValue.height + 'px'
            cropperCropBox.style.left = _imageInfo.borderlineValue.left + ((_imageInfo.borderlineValue.width - caclWidth) / 2) + 'px'
            cropperCropBox.style.top = _imageInfo.borderlineValue.top + 'px'
          } else {
            let caclHeight = _imageInfo.borderlineValue.height * (_imageInfo.borderlineValue.width / caclWidth)
            cropperCropBox.style.width = _imageInfo.borderlineValue.width + 'px'
            cropperCropBox.style.height = caclHeight + 'px'
            cropperCropBox.style.left = _imageInfo.borderlineValue.left + 'px'
            cropperCropBox.style.top = _imageInfo.borderlineValue.top + ((_imageInfo.borderlineValue.height - caclHeight) / 2) + 'px'
          }
        } else {
          let caclHeight = _imageInfo.borderlineValue.width * (scale[1] / scale[0])
          if (caclHeight <= _imageInfo.borderlineValue.height) {
            cropperCropBox.style.width = _imageInfo.borderlineValue.width + 'px'
            cropperCropBox.style.height = caclHeight + 'px'
            cropperCropBox.style.left = _imageInfo.borderlineValue.left + 'px'
            cropperCropBox.style.top = _imageInfo.borderlineValue.top + ((_imageInfo.borderlineValue.height - caclHeight) / 2) + 'px'
          } else {
            let caclWidth = _imageInfo.borderlineValue.width * (_imageInfo.borderlineValue.height / caclHeight)
            cropperCropBox.style.width = caclWidth + 'px'
            cropperCropBox.style.height = _imageInfo.borderlineValue.height + 'px'
            cropperCropBox.style.left = _imageInfo.borderlineValue.left + ((_imageInfo.borderlineValue.width - caclWidth) / 2) + 'px'
            cropperCropBox.style.top = _imageInfo.borderlineValue.top + 'px'
          }
        }
      }
    }

    this.imageList[this.currentIndex] = _imageInfo

    this.cropperCropBoxTranslate3d = {
      X: 0,
      Y: 0
    }
    this.calcViewBoxImgXY()
    this.initCropTouchEvent()
  }

  initCropTouchEvent(){
    let cropperCropBox = document.querySelector('.cropper-crop-box');
    
    let theCropperMove = document.querySelector('.cropper-face.cropper-move');

    let self = this, _imageInfo = this.imageList[this.currentIndex];

    this.theLeftTopTouchMove = function(e){

      let pageX = e.touches[0].pageX,
        pageY = e.touches[0].pageY;

      let mouseX = pageX - parseFloat(cropperCropBox.getBoundingClientRect().left);
      let mouseY = pageY - parseFloat(cropperCropBox.getBoundingClientRect().top);
      let minAllowMoveX = _imageInfo.borderlineValue.left - parseFloat(cropperCropBox.style.left);
      let minAllowY = _imageInfo.borderlineValue.top - parseFloat(cropperCropBox.style.top);
console.log("左上~~~~")
      //自由比例
      if (self.cropModel === 'freedom') {
        if (parseFloat(cropperCropBox.style.width) - mouseX >= self.cropMinW && self.cropperCropBoxTranslate3d.X + mouseX >= minAllowMoveX) {
          cropperCropBox.style.width = parseFloat(cropperCropBox.style.width) - mouseX + 'px'
          self.cropperCropBoxTranslate3d.X = self.cropperCropBoxTranslate3d.X + mouseX
        }
        if (parseFloat(cropperCropBox.style.height) - mouseY >= self.cropMinH && self.cropperCropBoxTranslate3d.Y + mouseY >= minAllowY) {
          cropperCropBox.style.height = parseFloat(cropperCropBox.style.height) - mouseY + 'px'
          self.cropperCropBoxTranslate3d.Y = self.cropperCropBoxTranslate3d.Y + mouseY
        }
      } else {
        let scale = self.cropModel.split(":")
        scale = scale[0] / scale[1]

        let _width = parseFloat(cropperCropBox.style.width) - mouseX;
        let _height = _width / scale
        let _mouseX = mouseX
        let _mouseY = _mouseX / scale

        if (_width >= self.cropMinW && self.cropperCropBoxTranslate3d.X + _mouseX >= minAllowMoveX && _height >= self.cropMinH && self.cropperCropBoxTranslate3d.Y + _mouseY >= minAllowY) {
          cropperCropBox.style.width = _width + 'px'
          self.cropperCropBoxTranslate3d.X = self.cropperCropBoxTranslate3d.X + _mouseX
          cropperCropBox.style.height = _height + 'px'
          self.cropperCropBoxTranslate3d.Y = self.cropperCropBoxTranslate3d.Y + _mouseY
        }
      }
      cropperCropBox.style.transform = 'translate3d(' + self.cropperCropBoxTranslate3d.X + 'px,' + self.cropperCropBoxTranslate3d.Y + 'px,0px) '

      self.calcViewBoxImgXY()
      e.preventDefault()
    }

    

    this.theRightTopTouchMove = function (e) {
      let pageX = e.touches[0].pageX,
        pageY = e.touches[0].pageY;
      let mouseX = pageX - parseFloat(cropperCropBox.getBoundingClientRect().right);
      let mouseY = pageY - parseFloat(cropperCropBox.getBoundingClientRect().top);

      let maxAllowX = _imageInfo.borderlineValue.right - parseFloat(cropperCropBox.style.left) - self.cropperCropBoxTranslate3d.X
      let minAllowY = _imageInfo.borderlineValue.top - parseFloat(cropperCropBox.style.top);
      console.log("右上~~~~~~~")
      if (self.cropModel === 'freedom') {
        if (parseFloat(cropperCropBox.style.width) + mouseX <= maxAllowX && parseFloat(cropperCropBox.style.width) + mouseX >= self.cropMinW) {
          cropperCropBox.style.width = parseFloat(cropperCropBox.style.width) + mouseX + 'px'
        }
        if (parseFloat(cropperCropBox.style.height) - mouseY >= self.cropMinH && self.cropperCropBoxTranslate3d.Y + mouseY >= minAllowY) {
          cropperCropBox.style.height = parseFloat(cropperCropBox.style.height) - mouseY + 'px'
          self.cropperCropBoxTranslate3d.Y = self.cropperCropBoxTranslate3d.Y + mouseY
        }
      } else {
        let scale = self.cropModel.split(":")
        scale = scale[0] / scale[1]

        let _width = parseFloat(cropperCropBox.style.width) + mouseX;
        let _height = _width / scale
        let _mouseX = mouseX
        let _mouseY = _mouseX / scale

        if (_width <= maxAllowX && _width >= self.cropMinW && _height >= self.cropMinH && self.cropperCropBoxTranslate3d.Y - _mouseY >= minAllowY) {
          cropperCropBox.style.width = _width + 'px'
          cropperCropBox.style.height = _height + 'px'
          self.cropperCropBoxTranslate3d.Y = self.cropperCropBoxTranslate3d.Y - _mouseY
        }
      }
      cropperCropBox.style.transform = 'translate3d(' + self.cropperCropBoxTranslate3d.X + 'px,' + self.cropperCropBoxTranslate3d.Y + 'px,0px)'
      self.calcViewBoxImgXY()
      e.preventDefault()
    }

    this.theLeftBottomTouchMove = function (e) {
      let pageX = e.touches[0].pageX,
        pageY = e.touches[0].pageY;
      let mouseX = pageX - parseFloat(cropperCropBox.getBoundingClientRect().left);
      let mouseY = pageY - parseFloat(cropperCropBox.getBoundingClientRect().bottom);
      console.log("左下~~~~~~~")
      let minAllowMoveX = _imageInfo.borderlineValue.left - parseFloat(cropperCropBox.style.left);
      let maxAllowY = _imageInfo.borderlineValue.bottom - parseFloat(cropperCropBox.style.top) - self.cropperCropBoxTranslate3d.Y;
      if (self.cropModel === 'freedom') {
        if (parseFloat(cropperCropBox.style.width) - mouseX >= self.cropMinW && self.cropperCropBoxTranslate3d.X + mouseX >= minAllowMoveX) {
          cropperCropBox.style.width = parseFloat(cropperCropBox.style.width) - mouseX + 'px'
          self.cropperCropBoxTranslate3d.X = self.cropperCropBoxTranslate3d.X + mouseX
        }
        if (parseFloat(cropperCropBox.style.height) + mouseY >= self.cropMinH && parseFloat(cropperCropBox.style.height) + mouseY <= maxAllowY) {
          cropperCropBox.style.height = parseFloat(cropperCropBox.style.height) + mouseY + 'px'
        }
      } else {
        let scale = self.cropModel.split(":")
        scale = scale[0] / scale[1]

        let _width = parseFloat(cropperCropBox.style.width) - mouseX;
        let _height = _width / scale
        let _mouseX = mouseX

        if (_width >= self.cropMinW && self.cropperCropBoxTranslate3d.X + _mouseX >= minAllowMoveX && _height >= self.cropMinH && _height <= maxAllowY) {
          cropperCropBox.style.width = _width + 'px'
          self.cropperCropBoxTranslate3d.X = self.cropperCropBoxTranslate3d.X + _mouseX
          cropperCropBox.style.height = _height + 'px'
        }
      }

      cropperCropBox.style.transform = 'translate3d(' + self.cropperCropBoxTranslate3d.X + 'px,' + self.cropperCropBoxTranslate3d.Y + 'px,0px)'

      self.calcViewBoxImgXY()
      e.preventDefault()
    }

    this.theRightBottomTouchMove = function (e) {
      let pageX = e.touches[0].pageX,
        pageY = e.touches[0].pageY;
      let mouseX = pageX - parseFloat(cropperCropBox.getBoundingClientRect().right);
      let mouseY = pageY - parseFloat(cropperCropBox.getBoundingClientRect().bottom);

      let maxAllowX = _imageInfo.borderlineValue.right - parseFloat(cropperCropBox.style.left) - self.cropperCropBoxTranslate3d.X
      let maxAllowY = _imageInfo.borderlineValue.bottom - parseFloat(cropperCropBox.style.top) - self.cropperCropBoxTranslate3d.Y;
      console.log("右下~~~~")
      if (self.cropModel === 'freedom') {
        if (parseFloat(cropperCropBox.style.width) + mouseX <= maxAllowX && parseFloat(cropperCropBox.style.width) + mouseX >= self.cropMinW) {
          cropperCropBox.style.width = parseFloat(cropperCropBox.style.width) + mouseX + 'px'
        }
        if (parseFloat(cropperCropBox.style.height) + mouseY >= self.cropMinH && parseFloat(cropperCropBox.style.height) + mouseY <= maxAllowY) {
          cropperCropBox.style.height = parseFloat(cropperCropBox.style.height) + mouseY + 'px'
        }
      } else {
        let scale = self.cropModel.split(":")
        scale = scale[0] / scale[1]

        let _width = parseFloat(cropperCropBox.style.width) + mouseX;
        let _height = _width / scale

        if (_width <= maxAllowX && _width >= self.cropMinW && _height >= self.cropMinH && _height <= maxAllowY) {
          cropperCropBox.style.width = _width + 'px'
          cropperCropBox.style.height = _height + 'px'
        }
      }

      self.calcViewBoxImgXY()
      e.preventDefault()
    }

    this.bindCropFourHornEvent()

    let startMovePos = {}

    this.theCropperMoveTouchStart = function (e) {
      let pageX = e.touches[0].pageX,
        pageY = e.touches[0].pageY;
      let mouseX = pageX - parseFloat(cropperCropBox.getBoundingClientRect().left);
      let mouseY = pageY - parseFloat(cropperCropBox.getBoundingClientRect().top);
      startMovePos = {
        mouseX: mouseX,
        mouseY: mouseY
      }
      e.preventDefault()
    }

    theCropperMove.addEventListener('touchstart', this.theCropperMoveTouchStart)

    this.theCropperMoveTouchMove = function (e) {
      let pageX = e.touches[0].pageX,
        pageY = e.touches[0].pageY;
      let mouseX = pageX - parseFloat(cropperCropBox.getBoundingClientRect().left);
      let mouseY = pageY - parseFloat(cropperCropBox.getBoundingClientRect().top);

      let _moveX = self.cropperCropBoxTranslate3d.X + (mouseX - startMovePos['mouseX']), _moveY = self.cropperCropBoxTranslate3d.Y + (mouseY - startMovePos['mouseY']);

      let minAllowMoveX = _imageInfo.borderlineValue.left - parseFloat(cropperCropBox.style.left),
        maxAllowX = _imageInfo.borderlineValue.right - parseFloat(cropperCropBox.style.left) - parseFloat(cropperCropBox.style.width)

      if (_moveX >= minAllowMoveX && _moveX <= maxAllowX) {
        self.cropperCropBoxTranslate3d.X = _moveX
      } else if (_moveX < minAllowMoveX) {
        self.cropperCropBoxTranslate3d.X = minAllowMoveX
      } else if (_moveX > maxAllowX) {
        self.cropperCropBoxTranslate3d.X = maxAllowX
      }
      let minAllowY = _imageInfo.borderlineValue.top - parseFloat(cropperCropBox.style.top),
        maxAllowY = _imageInfo.borderlineValue.bottom - parseFloat(cropperCropBox.style.top) - parseFloat(cropperCropBox.style.height)
      if (_moveY >= minAllowY && _moveY <= maxAllowY) {
        self.cropperCropBoxTranslate3d.Y = _moveY
      } else if (_moveY < minAllowY) {
        self.cropperCropBoxTranslate3d.Y = minAllowY
      } else if (_moveY > maxAllowY) {
        self.cropperCropBoxTranslate3d.Y = maxAllowY
      }
      cropperCropBox.style.transform = 'translate3d(' + (self.cropperCropBoxTranslate3d.X) + 'px, ' + self.cropperCropBoxTranslate3d.Y + 'px,0px)'
      self.calcViewBoxImgXY()
      e.preventDefault()
    }
    theCropperMove.addEventListener('touchmove', this.theCropperMoveTouchMove)
  }

  bindCropFourHornEvent(){
    //左上角
    let theLeftTop = document.querySelector('.cropper-point.point-nw'),
      //右上角
      theRightTop = document.querySelector('.cropper-point.point-ne'),
      //左下角
      theLeftBottom = document.querySelector('.cropper-point.point-sw'),
      //右下角
      theRightBottom = document.querySelector('.cropper-point.point-se');

    let _imageInfo = this.imageList[this.currentIndex];

    theLeftTop.addEventListener('touchmove', this.theLeftTopTouchMove)
    theRightTop.addEventListener('touchmove', this.theRightTopTouchMove)
    theLeftBottom.addEventListener('touchmove', this.theLeftBottomTouchMove)
    theRightBottom.addEventListener('touchmove', this.theRightBottomTouchMove)

      // if (Math.abs((_imageInfo.imageRotateDeg / 90) % 4) === 0) {
      //   theLeftTop.addEventListener('touchmove', this.theLeftTopTouchMove)
      //   theRightTop.addEventListener('touchmove', this.theRightTopTouchMove)
      //   theLeftBottom.addEventListener('touchmove', this.theLeftBottomTouchMove)
      //   theRightBottom.addEventListener('touchmove', this.theRightBottomTouchMove)
      // } else if (Math.abs((_imageInfo.imageRotateDeg / 90) % 4) === 1) {
      //   theRightTop.addEventListener('touchmove', this.theLeftTopTouchMove)
      //   theRightBottom.addEventListener('touchmove', this.theRightTopTouchMove)
      //   theLeftTop.addEventListener('touchmove', this.theLeftBottomTouchMove)
      //   theLeftBottom.addEventListener('touchmove', this.theRightBottomTouchMove)
      // } else if (Math.abs((_imageInfo.imageRotateDeg / 90) % 4) === 2) {
      //   theRightBottom.addEventListener('touchmove', this.theLeftTopTouchMove)
      //   theLeftBottom.addEventListener('touchmove', this.theRightTopTouchMove)
      //   theRightTop.addEventListener('touchmove', this.theLeftBottomTouchMove)
      //   theLeftTop.addEventListener('touchmove', this.theRightBottomTouchMove)
      // } else if (Math.abs((_imageInfo.imageRotateDeg / 90) % 4) === 3) {
      //   theLeftBottom.addEventListener('touchmove', this.theLeftTopTouchMove)
      //   theLeftTop.addEventListener('touchmove', this.theRightTopTouchMove)
      //   theRightBottom.addEventListener('touchmove', this.theLeftBottomTouchMove)
      //   theRightTop.addEventListener('touchmove', this.theRightBottomTouchMove)
      // }
  }

  destroyCropFourHornEvent(){
    //左上角
    let theLeftTop = document.querySelector('.cropper-point.point-nw'),
      //右上角
      theRightTop = document.querySelector('.cropper-point.point-ne'),
      //左下角
      theLeftBottom = document.querySelector('.cropper-point.point-sw'),
      //右下角
      theRightBottom = document.querySelector('.cropper-point.point-se');
    let _imageInfo = this.imageList[this.currentIndex];
    //删除绑定的拖动事件


    theLeftTop.removeEventListener('touchmove', this.theLeftTopTouchMove)
    theRightTop.removeEventListener('touchmove', this.theRightTopTouchMove)
    theLeftBottom.removeEventListener('touchmove', this.theLeftBottomTouchMove)
    theRightBottom.removeEventListener('touchmove', this.theRightBottomTouchMove)


    // if (Math.abs((_imageInfo.imageRotateDeg / 90) % 4) === 0) {
    //   theLeftTop.removeEventListener('touchmove', this.theLeftTopTouchMove)
    //   theRightTop.removeEventListener('touchmove', this.theRightTopTouchMove)
    //   theLeftBottom.removeEventListener('touchmove', this.theLeftBottomTouchMove)
    //   theRightBottom.removeEventListener('touchmove', this.theRightBottomTouchMove)
    // } else if (Math.abs((_imageInfo.imageRotateDeg / 90) % 4) === 1) {
    //   theRightTop.removeEventListener('touchmove', this.theLeftTopTouchMove)
    //   theRightBottom.removeEventListener('touchmove', this.theRightTopTouchMove)
    //   theLeftTop.removeEventListener('touchmove', this.theLeftBottomTouchMove)
    //   theLeftBottom.removeEventListener('touchmove', this.theRightBottomTouchMove)
    // } else if (Math.abs((_imageInfo.imageRotateDeg / 90) % 4) === 2) {
    //   theRightBottom.removeEventListener('touchmove', this.theLeftTopTouchMove)
    //   theLeftBottom.removeEventListener('touchmove', this.theRightTopTouchMove)
    //   theRightTop.removeEventListener('touchmove', this.theLeftBottomTouchMove)
    //   theLeftTop.removeEventListener('touchmove', this.theRightBottomTouchMove)
    // } else if (Math.abs((_imageInfo.imageRotateDeg / 90) % 4) === 3) {
    //   theLeftBottom.removeEventListener('touchmove', this.theLeftTopTouchMove)
    //   theLeftTop.removeEventListener('touchmove', this.theRightTopTouchMove)
    //   theRightBottom.removeEventListener('touchmove', this.theLeftBottomTouchMove)
    //   theRightTop.removeEventListener('touchmove', this.theRightBottomTouchMove)
    // }
  }

  destroyCropTouchEvent(){
    this.destroyCropFourHornEvent()
    
    let theCropperMove = document.querySelector('.cropper-face.cropper-move');

    theCropperMove.removeEventListener('touchmove', this.theCropperMoveTouchMove)
  }

  //计算裁切框中背景图片位置
  calcViewBoxImgXY(){
    let viewBoxImg = document.querySelector('.cropper-view-box>img'),cropperCropBox = document.querySelector('.cropper-crop-box');
    let _imageInfo = this.imageList[this.currentIndex]

    let X = 0,
      Y = 0;

      X = _imageInfo.borderlineValue.left - parseFloat(cropperCropBox.style.left) - this.cropperCropBoxTranslate3d.X
      Y = _imageInfo.borderlineValue.top - parseFloat(cropperCropBox.style.top) - this.cropperCropBoxTranslate3d.Y
      viewBoxImg.style.transform = 'translate(' + X + 'px, ' + Y + 'px)'
      // viewBoxImg.style.transform = 'translate(' + X + 'px, ' + Y + 'px)'
  }

  sureCropImage(){
    let cropperCropBox = document.querySelector('.cropper-crop-box'), _imageInfo = this.imageList[this.currentIndex];
    let imgWidth = (parseFloat(cropperCropBox.style.width) / _imageInfo.proportion) / _imageInfo.canvasScaleProportion,
      imgHeight = (parseFloat(cropperCropBox.style.height) / _imageInfo.proportion) / _imageInfo.canvasScaleProportion,
      cropX = (_imageInfo.borderlineValue.left - parseFloat(cropperCropBox.style.left) - this.cropperCropBoxTranslate3d.X) / _imageInfo.proportion,
      cropY = (_imageInfo.borderlineValue.top - parseFloat(cropperCropBox.style.top) - this.cropperCropBoxTranslate3d.Y) / _imageInfo.proportion;
    cropY = Math.abs(cropY)
    cropX = Math.abs(cropX)

    let self = this

    let cropCanvas = document.createElement('Canvas'),cropContext = null;
    cropContext = cropCanvas.getContext('2d')
  
    let __img = new Image()
    __img.onload = function(){
      cropContext.clearRect(0, 0, this.width, this.height);
      cropCanvas.width = imgWidth
      cropCanvas.height = imgHeight
      cropContext.drawImage(this, cropX, cropY, imgWidth, imgHeight, 0, 0, imgWidth, imgHeight)

      // let _cropImage = cropCanvas.toDataURL("image/jpeg", 1.0)
      cropCanvas.toBlob(function(result){
        console.log("result:::", result)
        let _cropImage = result

        self.pushOperateStack(_cropImage)

        _imageInfo.imageRotateDeg = 0
        _imageInfo.canvasScaleProportion = 1

        self.imageList[self.currentIndex] = _imageInfo

        self.loadImage().then(() => {
          self.drawCanvasPanel()
        })

        self.destroyCropTouchEvent()
        document.querySelector('.cropper-wrap-box').remove()
        document.querySelector('.cropper-drag-box').remove()
        document.querySelector('#canvasContainerDiv').style.transform = 'inherit'
        document.querySelector('#canvasContainerDiv').style.transition = 'inherit'

      }, 'image/webp', self.imageDefinition)
    }
    __img.src = this.rotateCanvas()
  }
  cancelCropImage(){
    this.destroyCropTouchEvent()
    this.imageList[this.currentIndex]['imageRotateDeg'] = 0
    this.imageList[this.currentIndex]['canvasScaleProportion'] = 1
    document.querySelector('.cropper-wrap-box').remove()
    document.querySelector('.cropper-drag-box').remove()
    document.querySelector('#canvasContainerDiv').style.transform = 'inherit'
    document.querySelector('#canvasContainerDiv').style.transition = 'inherit'
  }

  //初始化每个图片文件所需要的属性
  initImagePrototype(){
    this.imageList.forEach((I,i)=>{
      this.imageList[i]['borderlineValue'] = {}
      this.imageList[i]['operateStack'] = []
      this.imageList[i]['operateStackIndex'] = -1
      this.imageList[i]['imageRotateDeg'] = 0
      this.imageList[i]['canvasScaleProportion'] = 1
    })
  }

  nextImage(callback) {
    if (++this.currentIndex <= this.maxImageIndex){
      this.loadImage().then(_ => {
        this.drawCanvasPanel()
      })
      callback(this.currentIndex)
    } else {
      this.currentIndex = this.maxImageIndex
      callback(this.currentIndex)
    }
    !!this.onImageChange && this.onImageChange()
  }

  preImage(callback){
    if (--this.currentIndex >= 0){
      this.loadImage().then(_ => {
        this.drawCanvasPanel()
      })
      callback(this.currentIndex)
    } else {
      this.currentIndex = 0
      callback(this.currentIndex)
    }
    !!this.onImageChange && this.onImageChange()
  }

  nextOperateStack(){
    let imageInfo = this.imageList[this.currentIndex]
    
    if (++imageInfo.operateStackIndex <= imageInfo.operateStack.length - 1) {
      
      this.loadImage().then(_ => {
        this.drawCanvasPanel()
      })
    } else {
      imageInfo.operateStackIndex = imageInfo.operateStack.length - 1
    }

    this.imageList[this.currentIndex]['operateStackIndex'] = imageInfo.operateStackIndex
    !!this.onImageChange && this.onImageChange()
  }

  preOperateStack() {
    let imageInfo = this.imageList[this.currentIndex]

    if (--imageInfo.operateStackIndex >= -1) {
      this.loadImage().then(_ => {
        this.drawCanvasPanel()
      })
    } else {
      imageInfo.operateStackIndex = -1
    }
    this.imageList[this.currentIndex]['operateStackIndex'] = imageInfo.operateStackIndex
    !!this.onImageChange && this.onImageChange()
  }
  initDoodleOptions(){
    this.clickX = []
    this.clickY = []
    this.clickDrag = []

    this.clickTool = []
    this.clickColor = []
    this.clickSize = []

    this.curTool = 'pencil'
    this.curColor = '#ffffff'
    this.curSize = 'L'
  }
  //开始涂鸦
  beginDoodle(){
    this.initDoodleOptions()
    let self = this,_imageInfo = this.imageList[this.currentIndex]

    this.doodleTouchStart = function (e) {
      let pageX = e.touches[0].pageX,
        pageY = e.touches[0].pageY;
      var mouseX = pageX - self.canvas.getBoundingClientRect().left;
      var mouseY = pageY - self.canvas.getBoundingClientRect().top;
      mouseX = mouseX / _imageInfo.proportion;
      mouseY = mouseY / _imageInfo.proportion;
      self.addClick(mouseX, mouseY, false);
      self.redraw();
      e.preventDefault()
    }
    this.canvas.addEventListener('touchstart', this.doodleTouchStart, false)

    this.doodleTouchMove = function (e) {
      let pageX = e.touches[0].pageX,
        pageY = e.touches[0].pageY;
      var mouseX = pageX - self.canvas.getBoundingClientRect().left;
      var mouseY = pageY - self.canvas.getBoundingClientRect().top;
      mouseX = mouseX / _imageInfo.proportion;
      mouseY = mouseY / _imageInfo.proportion;
      self.addClick(mouseX, mouseY, true);
      self.redraw();
      e.preventDefault()
    }

    this.canvas.addEventListener('touchmove', this.doodleTouchMove, false)
  }
  redraw(){
    this.clearCanvas()

    let _imageInfo = this.imageList[this.currentIndex];
    
    let canvas = document.createElement('canvas')
    canvas.width = _imageInfo.image.width
    canvas.height = _imageInfo.image.height
    let context = canvas.getContext("2d");
    var radius = 0;
    var i = 0;
    for (; i < this.clickX.length; i++) {
      if (this.clickSize[i] == "S") {
        radius = 10;
      } else if (this.clickSize[i] == "M") {
        radius = 18;
      } else if (this.clickSize[i] == "L") {
        radius = 26;
      } else if (this.clickSize[i] == "XL") {
        radius = 40;
      } else if (this.clickSize[i] == "XXL") {
        radius = 58;
      } else {
        alert("Error: Radius is zero for click " + i);
        radius = 0;
      }

      context.beginPath();

      if (this.clickDrag[i] && i) {
        context.moveTo(this.clickX[i - 1], this.clickY[i - 1]);
      } else {
        context.moveTo(this.clickX[i], this.clickY[i]);
      }
      context.lineTo(this.clickX[i], this.clickY[i]);
      context.closePath();

      if (this.clickTool[i] == "rubber") {
        context.globalCompositeOperation = "destination-out";
        context.strokeStyle = 'white';
        radius = 70;
      } else {
        context.globalCompositeOperation = "source-over";
        context.strokeStyle = this.clickColor[i];
      }
      context.lineJoin = "round";
      context.lineWidth = radius;
      context.stroke();
    }
    context.restore();

    // Draw the outline image
    this.context.drawImage(_imageInfo.image, 0, 0, _imageInfo.image.width, _imageInfo.image.height);
    this.context.drawImage(canvas, 0, 0, _imageInfo.image.width, _imageInfo.image.height);
  }
  addClick(x, y, dragging) {
    this.clickX.push(x);
    this.clickY.push(y);
    this.clickTool.push(this.curTool);
    this.clickColor.push(this.curColor);
    this.clickSize.push(this.curSize);
    this.clickDrag.push(dragging);
  }
  clearCanvas(){
    let _imageInfo = this.imageList[this.currentIndex];
    this.context.clearRect(0, 0, _imageInfo.image.width, _imageInfo.image.height);
  }
  setDoodleTool(val){
    this.curTool = val
  }
  setDoodleColor(val) {
    this.curColor = val
  }
  setDoodleSize(val) {
    this.curSize = val
  }
  cancelDoodleImage(){
    this.clearCanvas()
    let _imageInfo = this.imageList[this.currentIndex];
    this.context.drawImage(_imageInfo.image, 0, 0, _imageInfo.image.width, _imageInfo.image.height);
    this.canvas.removeEventListener('touchstart', this.doodleTouchStart)
    this.canvas.removeEventListener('touchmove', this.doodleTouchMove)
  }
  sureDoodleImage(){
    let self = this
    // let doodleImage = this.canvas.toDataURL("image/jpeg", 1.0)
    this.canvas.toBlob(function(result){
      let doodleImage = result

      self.clearCanvas()
      self.canvas.removeEventListener('touchstart', self.doodleTouchStart)
      self.canvas.removeEventListener('touchmove', self.doodleTouchMove)

      self.pushOperateStack(doodleImage)

      self.loadImage().then(() => {
        self.drawCanvasPanel()
      })
    }, 'image/webp', self.imageDefinition)
  }
  beginColorHandle(){
    this.loadImage().then(_ => {
      this.drawCanvasPanel()
      this.operationColorHD()
    })
  }
  operationColorHD(){
    let _imageInfo = this.imageList[this.currentIndex];
    let imgdata = this.context.getImageData(0, 0, _imageInfo.image.width, _imageInfo.image.height);
    var data = imgdata.data;
    /*灰度处理：求r，g，b的均值，并赋回给r，g，b*/
    for (var i = 0, n = data.length; i < n; i += 4) {
      var average = (data[i] + data[i + 1] + data[i + 2]) / 3;
      data[i] = average;
      data[i + 1] = average;
      data[i + 2] = average;
    }
    this.context.putImageData(imgdata, 0, 0);
  }
  cancelColorHandle(){
    this.clearCanvas()
    let _imageInfo = this.imageList[this.currentIndex];
    this.context.drawImage(_imageInfo.image, 0, 0, _imageInfo.image.width, _imageInfo.image.height);
  }
  sureColorHandle(){
    // let colorHandleImage = this.canvas.toDataURL("image/jpeg", 1.0)
    let self = this
    this.canvas.toBlob(function(result){
      let colorHandleImage = result
      self.clearCanvas()

      self.pushOperateStack(colorHandleImage)

      self.loadImage().then(() => {
        self.drawCanvasPanel()
      })
    },"image/webp", self.imageDefinition)
  }
  //图片旋转
  rotate(){
    //解绑之前的四个角绑定的事件
    // this.destroyCropFourHornEvent()
    //重新计算旋转角度
    let _imageInfo = this.imageList[this.currentIndex]
    _imageInfo.imageRotateDeg -= 90
    
    this.imageList[this.currentIndex] = _imageInfo
    //旋转Canvas容器，按比例缩小
    let canvasContainerDiv = document.querySelector('#canvasContainerDiv'),
    canvasContainerDivPos = canvasContainerDiv.getBoundingClientRect()
    let canvasScaleProportion = 0,
      preCanvasScaleProportion = _imageInfo.canvasScaleProportion

    if (Math.abs((_imageInfo.imageRotateDeg / 90) % 2) === 1) {
      canvasScaleProportion = ((canvasContainerDivPos.width) / (canvasContainerDivPos.height))
    } else {
      canvasScaleProportion = 1
    }
    _imageInfo.canvasScaleProportion = canvasScaleProportion

    canvasContainerDiv.style.transform = 'scale(' + canvasScaleProportion + ') rotateZ(' + _imageInfo.imageRotateDeg + 'deg)'
    canvasContainerDiv.style.transition = 'transform 0.5s'
    _imageInfo.borderlineValue = canvasContainerDiv.getBoundingClientRect()

    this.imageList[this.currentIndex] = _imageInfo

    let cropperCropBox = document.querySelector('.cropper-wrap-box');
    
    //如果裁切框scale不为1表示 放大缩小过，所以 再次 变换的时候 就需要还原
    if (preCanvasScaleProportion !== 1) {
      cropperCropBox.style.transform = 'scale(' + 1 / preCanvasScaleProportion + ') rotateZ(-90deg)'
    } else {
      cropperCropBox.style.transform = 'scale(' + canvasScaleProportion + ') rotateZ(-90deg)'
      // document.querySelector('.cropper-point.point-ne').style.transform = 'scale(' + 1 / canvasScaleProportion + ')'
      // document.querySelector('.cropper-point.point-nw').style.transform = 'scale(' + 1 / canvasScaleProportion + ')'
      // document.querySelector('.cropper-point.point-sw').style.transform = 'scale(' + 1 / canvasScaleProportion + ')'
      // document.querySelector('.cropper-point.point-se').style.transform = 'scale(' + 1 / canvasScaleProportion + ')'
      // // document.querySelector('.cropper-dashed.dashed-h').style.transform = 'scale(' + 1 / canvasScaleProportion + ')'
      // // document.querySelector('.cropper-dashed.dashed-v').style.transform = 'scale(' + 1 / canvasScaleProportion + ')'

      // document.querySelector('.cropper-line.line-e').style.transform = 'scale(' + 1 / canvasScaleProportion + ')'
      // document.querySelector('.cropper-line.line-n').style.transform = 'scale(' + 1 / canvasScaleProportion + ')'
      // document.querySelector('.cropper-line.line-w').style.transform = 'scale(' + 1 / canvasScaleProportion + ')'
      // document.querySelector('.cropper-line.line-s').style.transform = 'scale(' + 1 / canvasScaleProportion + ')'


      

      // document.querySelector('.cropper-point.point-sw').style.transition = 'transform .5s'
      // document.querySelector('.cropper-point.point-nw').style.transition = 'transform .5s'
      // document.querySelector('.cropper-point.point-se').style.transition = 'transform .5s'
      // document.querySelector('.cropper-point.point-ne').style.transition = 'transform .5s'

      // // document.querySelector('.cropper-dashed.dashed-h').style.transition = 'transform .5s'
      // // document.querySelector('.cropper-dashed.dashed-v').style.transition = 'transform .5s'

      // document.querySelector('.cropper-line.line-e').style.transition = 'transform .5s'
      // document.querySelector('.cropper-line.line-n').style.transition = 'transform .5s'
      // document.querySelector('.cropper-line.line-w').style.transition = 'transform .5s'
      // document.querySelector('.cropper-line.line-s').style.transition = 'transform .5s'

    }
    cropperCropBox.style.transition = 'transform .5s'

    setTimeout(()=>{
      this.destroyCropTouchEvent()
      this.createCropBox()
    },800)
  }

  reverse(){
    let _imageInfo = this.imageList[this.currentIndex];
    let imgdata = this.context.getImageData(0, 0, _imageInfo.image.width, _imageInfo.image.height),
      i, i2, t,
      h = imgdata.height,
      w = imgdata.width,
      w_2 = w / 2;
    // 将 imgdata 的数据水平翻转
    for (var dy = 0; dy < h; dy++) {
      for (var dx = 0; dx < w_2; dx++) {
        i = (dy << 2) * w + (dx << 2)
        i2 = ((dy + 1) << 2) * w - ((dx + 1) << 2)
        for (var p = 0; p < 4; p++) {
          t = imgdata.data[i + p]
          imgdata.data[i + p] = imgdata.data[i2 + p]
          imgdata.data[i2 + p] = t
        }
      }
    }
    this.context.putImageData(imgdata, 0, 0);
    document.querySelector('.cropper-view-box>img').src = this.canvas.toDataURL("image/jpeg", 1.0)
  }
  pushOperateStack(base64Object){
    let _imageInfo = this.imageList[this.currentIndex];
    //如果不是最后一个，那么从当先数组下标开始。删除后面的值
    if (_imageInfo.operateStackIndex === -1) {
      _imageInfo.operateStack = []
    } else if (_imageInfo.operateStackIndex < _imageInfo.operateStack.length - 1 && _imageInfo.operateStackIndex >= 0) {
      let numner = _imageInfo.operateStack.length - 1 - _imageInfo.operateStackIndex
      _imageInfo.operateStack.splice(_imageInfo.operateStackIndex + 1, numner)
    }
    _imageInfo.operateStack.push(base64Object)
    _imageInfo.operateStackIndex = (_imageInfo.operateStack.length - 1);
    !!this.onOperateStackChange && this.onOperateStackChange();
    this.imageList[this.currentIndex] = _imageInfo
  }

  rotateCanvas() {
    let _imageInfo = this.imageList[this.currentIndex];
    let canvas = document.createElement('Canvas')
    let context = canvas.getContext('2d')
    if (Math.abs((_imageInfo.imageRotateDeg / 90) % 2) === 1) {
      canvas.width = _imageInfo.image.height
      canvas.height = _imageInfo.image.width

      context.translate(canvas.width / 2, canvas.height / 2)
      context.rotate(_imageInfo.imageRotateDeg * (Math.PI / 180));
      context.drawImage(this.canvas, -(canvas.height / 2), -(canvas.width / 2))

    } else {
      canvas.width = _imageInfo.image.width
      canvas.height = _imageInfo.image.height

      context.translate(canvas.width / 2, canvas.height / 2)
      context.rotate(_imageInfo.imageRotateDeg * (Math.PI / 180));
      context.drawImage(this.canvas, -(canvas.width / 2), -(canvas.height / 2))
    }
    return canvas.toDataURL("image/jpeg", 1.0)
  }

  returnImageList(){
    return this.imageList.reduce((acc,cur)=>{
      if(cur.operateStackIndex !== -1){
        acc.push(cur.operateStack[cur.operateStackIndex])
      } else {
        acc.push(cur.origin)
      }
      return acc
    },[])
  }
}