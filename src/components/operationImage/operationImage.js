import './crop.less'

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
      self = this;
    img.crossOrigin = "anonymous";
    return new Promise(function (resolve, reject) {
      img.onload = function () {
        self.imageList[self.currentIndex]['image'] = this
        self.canvas.height = this.height
        self.canvas.width = this.width
        self.container.appendChild(self.canvasContainerDiv)
        self.context = self.canvas.getContext("2d")
        self.context.drawImage(this, 0, 0)
        resolve()
      }
      img.onerror = function (error) {
        console.log("img load error::::",error)
        reject()
      }
      let imageInfo = self.imageList[self.currentIndex]
      if (imageInfo.operateStackIndex === -1) {
        img.src = imageInfo.origin + '?t=' + self.timeStamp
      } else {
        img.src = imageInfo.operateStack[imageInfo.operateStackIndex]
      }
      
    })
  }
  calcProportion(width, height) {
    let heightProportion = 0,
      widthProportion = 0;
    heightProportion = (this.container.clientHeight - 10) / height;
    widthProportion = (this.container.clientWidth - 10) / width
    return heightProportion > widthProportion ? widthProportion : heightProportion
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
      this.drawCanvasPanel()
      this.createCropBox()
    }
  }

  createCropBox(){
    let cropBoxTemplate = '<div class="cropper-drag-box cropper-crop cropper-modal"></div><div class="cropper-crop-box"><span class="cropper-view-box"><img></span><span class="cropper-dashed dashed-h"></span><span class="cropper-dashed dashed-v"></span><span class="cropper-face cropper-move"></span><span class="cropper-line line-e"></span><span class="cropper-line line-n"></span><span class="cropper-line line-w"></span><span class="cropper-line line-s"></span><span class="cropper-point point-ne"></span><span class="cropper-point point-nw"></span><span class="cropper-point point-sw"></span><span class="cropper-point point-se"></span></div>'
    let _div = document.createElement('div')
    _div.classList.add('cropper-wrap-box')
    _div.innerHTML = cropBoxTemplate

    this.container.appendChild(_div)
    let _bgImg = document.querySelector('.cropper-view-box>img')
    _bgImg.setAttribute('crossOrigin', 'anonymous')
    let imageInfo = this.imageList[this.currentIndex]
    if (imageInfo.operateStackIndex === -1) {
      _bgImg.src = imageInfo.origin + '?t=' + this.timeStamp
    } else {
      _bgImg.src = imageInfo.operateStack[imageInfo.operateStackIndex]
    }

    _bgImg.style.width = this.canvasObj.width
    _bgImg.style.height = this.canvasObj.height
    this.initCropBoxSize()
  }
  initCropBoxSize(){
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
    if (this.cropModel === 'freedom'){
      cropperCropBox.style.width = _imageInfo.borderlineValue.width + 'px'
      cropperCropBox.style.height = _imageInfo.borderlineValue.height + 'px'
      cropperCropBox.style.top = _imageInfo.borderlineValue.top + 'px'
      cropperCropBox.style.left = _imageInfo.borderlineValue.left + 'px'
    } else {
      let scale = this.cropModel.split(":")
      if (scale[0]/scale[1] <= 1){
        
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
        let caclHeight = _imageInfo.borderlineValue.width * (scale[1] / scale[0] )
        if (caclHeight <= _imageInfo.borderlineValue.height) {
          cropperCropBox.style.width = _imageInfo.borderlineValue.width + 'px'
          cropperCropBox.style.height = caclHeight + 'px'
          cropperCropBox.style.left = _imageInfo.borderlineValue.left + 'px'
          cropperCropBox.style.top = _imageInfo.borderlineValue.top + ((_imageInfo.borderlineValue.height - caclHeight) / 2) + 'px'
        } else {
          let caclWidth = _imageInfo.borderlineValue.width * (_imageInfo.borderlineValue.height / caclHeight)
          cropperCropBox.style.width = caclWidth + 'px'
          cropperCropBox.style.height = _imageInfo.borderlineValue.height + 'px'
          cropperCropBox.style.left = _imageInfo.borderlineValue.left + ((_imageInfo.borderlineValue.width - caclWidth)/2) + 'px'
          cropperCropBox.style.top = _imageInfo.borderlineValue.top + 'px'
        }
      }
    }

    this.imageList[this.currentIndex] = _imageInfo

    this.cropperCropBoxTranslate3d = {
      X:0,Y:0
    }
    this.calcViewBoxImgXY()
    this.initCropTouchEvent()
  }

  initCropTouchEvent(){
    let cropperCropBox = document.querySelector('.cropper-crop-box');
    //左上角
    let theLeftTop = document.querySelector('.cropper-point.point-nw'),
    //右上角
      theRightTop = document.querySelector('.cropper-point.point-ne'),
      //左下角
      theLeftBottom = document.querySelector('.cropper-point.point-sw'),
      //右下角
      theRightBottom = document.querySelector('.cropper-point.point-se'),
      
      theCropperMove = document.querySelector('.cropper-face.cropper-move');

    let self = this, _imageInfo = this.imageList[this.currentIndex];


    this.theLeftTopTouchMove = function(e){
      let pageX = e.touches[0].pageX,
        pageY = e.touches[0].pageY;
      let mouseX = pageX - parseFloat(cropperCropBox.getBoundingClientRect().left);
      let mouseY = pageY - parseFloat(cropperCropBox.getBoundingClientRect().top);
      let minAllowMoveX = _imageInfo.borderlineValue.left - parseFloat(cropperCropBox.style.left);
      let minAllowY = _imageInfo.borderlineValue.top - parseFloat(cropperCropBox.style.top);
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

      cropperCropBox.style.transform = 'translate3d(' + self.cropperCropBoxTranslate3d.X + 'px,' + self.cropperCropBoxTranslate3d.Y + 'px,0px)'
      self.calcViewBoxImgXY()
      e.preventDefault()
    }

    theLeftTop.addEventListener('touchmove',this.theLeftTopTouchMove)

    this.theRightTopTouchMove = function (e) {
      let pageX = e.touches[0].pageX,
        pageY = e.touches[0].pageY;
      let mouseX = pageX - parseFloat(cropperCropBox.getBoundingClientRect().right);
      let mouseY = pageY - parseFloat(cropperCropBox.getBoundingClientRect().top);

      let maxAllowX = _imageInfo.borderlineValue.right - parseFloat(cropperCropBox.style.left) - self.cropperCropBoxTranslate3d.X
      let minAllowY = _imageInfo.borderlineValue.top - parseFloat(cropperCropBox.style.top);
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
    theRightTop.addEventListener('touchmove', this.theRightTopTouchMove)

    this.theLeftBottomTouchMove = function (e) {
      let pageX = e.touches[0].pageX,
        pageY = e.touches[0].pageY;
      let mouseX = pageX - parseFloat(cropperCropBox.getBoundingClientRect().left);
      let mouseY = pageY - parseFloat(cropperCropBox.getBoundingClientRect().bottom);

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
    theLeftBottom.addEventListener('touchmove', this.theLeftBottomTouchMove)

    this.theRightBottomTouchMove = function (e) {
      let pageX = e.touches[0].pageX,
        pageY = e.touches[0].pageY;
      let mouseX = pageX - parseFloat(cropperCropBox.getBoundingClientRect().right);
      let mouseY = pageY - parseFloat(cropperCropBox.getBoundingClientRect().bottom);

      let maxAllowX = _imageInfo.borderlineValue.right - parseFloat(cropperCropBox.style.left) - self.cropperCropBoxTranslate3d.X
      let maxAllowY = _imageInfo.borderlineValue.bottom - parseFloat(cropperCropBox.style.top) - self.cropperCropBoxTranslate3d.Y;

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
    theRightBottom.addEventListener('touchmove', this.theRightBottomTouchMove)

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

  destroyCropTouchEvent(){
    //左上角
    let theLeftTop = document.querySelector('.cropper-point.point-nw'),
      //右上角
      theRightTop = document.querySelector('.cropper-point.point-ne'),
      //左下角
      theLeftBottom = document.querySelector('.cropper-point.point-sw'),
      //右下角
      theRightBottom = document.querySelector('.cropper-point.point-se'),

      theCropperMove = document.querySelector('.cropper-face.cropper-move');

    theLeftTop.removeEventListener('touchmove', this.theLeftTopTouchMove)

    theRightTop.removeEventListener('touchmove', this.theRightTopTouchMove)

    theLeftBottom.removeEventListener('touchmove', this.theLeftBottomTouchMove)

    theRightBottom.removeEventListener('touchmove', this.theRightBottomTouchMove)

    theCropperMove.removeEventListener('touchmove', this.theCropperMoveTouchMove)

    document.querySelector('.cropper-wrap-box').remove()
  }

  //计算裁切框中背景图片位置
  calcViewBoxImgXY(){
    let viewBoxImg = document.querySelector('.cropper-view-box>img'),cropperCropBox = document.querySelector('.cropper-crop-box');
    let _imageInfo = this.imageList[this.currentIndex]
    
    let X = _imageInfo.borderlineValue.left - parseFloat(cropperCropBox.style.left) - this.cropperCropBoxTranslate3d.X,
      Y = _imageInfo.borderlineValue.top - parseFloat(cropperCropBox.style.top) - this.cropperCropBoxTranslate3d.Y;

      console.log("_imageInfo.borderlineValue.left::::", _imageInfo.borderlineValue.left)
      console.log("parseFloat(cropperCropBox.style.left)::::", parseFloat(cropperCropBox.style.left))
      console.log("this.cropperCropBoxTranslate3d.X::::", this.cropperCropBoxTranslate3d.X)
    viewBoxImg.style.transform = 'translate3d(' + X + 'px, ' + Y + 'px,0px) rotateZ(0deg)'
  }

  sureCropImage(){
    let cropperCropBox = document.querySelector('.cropper-crop-box'), _imageInfo = this.imageList[this.currentIndex];
    let imgWidth = parseFloat(cropperCropBox.style.width) / _imageInfo.proportion,
      imgHeight = parseFloat(cropperCropBox.style.height) / _imageInfo.proportion,
      cropX = (_imageInfo.borderlineValue.left - parseFloat(cropperCropBox.style.left) - this.cropperCropBoxTranslate3d.X) / _imageInfo.proportion,
      cropY = (_imageInfo.borderlineValue.top - parseFloat(cropperCropBox.style.top) - this.cropperCropBoxTranslate3d.Y) / _imageInfo.proportion;
    cropY = Math.abs(cropY)
    cropX = Math.abs(cropX)

    let cropCanvas = document.createElement('Canvas'),cropContext = null;
    cropContext = cropCanvas.getContext('2d')
    cropContext.clearRect(0, 0, _imageInfo.image.width, _imageInfo.image.height);
    cropCanvas.width = imgWidth
    cropCanvas.height = imgHeight
    cropContext.drawImage(_imageInfo.image, cropX, cropY, imgWidth, imgHeight, 0, 0, imgWidth, imgHeight)
    let _cropImage = cropCanvas.toDataURL("image/jpeg", 1.0)
    
    this.pushOperateStack(_cropImage)

    this.loadImage().then(()=>{
      this.drawCanvasPanel()
    })

    this.destroyCropTouchEvent()

  }
  cancelCropImage(){
    this.destroyCropTouchEvent()
  }

  //初始化每个图片文件所需要的属性
  initImagePrototype(){
    this.imageList.forEach((I,i)=>{
      this.imageList[i]['borderlineValue'] = {}
      this.imageList[i]['operateStack'] = []
      this.imageList[i]['operateStackIndex'] = -1
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
        radius = 28;
      } else if (this.clickSize[i] == "L") {
        radius = 38;
      } else if (this.clickSize[i] == "XL") {
        radius = 48;
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
        radius = 40;
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
    let doodleImage = this.canvas.toDataURL("image/jpeg", 1.0)

    this.clearCanvas()
    this.canvas.removeEventListener('touchstart', this.doodleTouchStart)
    this.canvas.removeEventListener('touchmove', this.doodleTouchMove)

    this.pushOperateStack(doodleImage)

    this.loadImage().then(() => {
      this.drawCanvasPanel()
    })

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
    console.log("imgdata::::", imgdata.length)
    this.context.putImageData(imgdata, 0, 0);
  }
  cancelColorHandle(){
    this.clearCanvas()
    let _imageInfo = this.imageList[this.currentIndex];
    this.context.drawImage(_imageInfo.image, 0, 0, _imageInfo.image.width, _imageInfo.image.height);
  }
  sureColorHandle(){
    let colorHandleImage = this.canvas.toDataURL("image/jpeg", 1.0)

    this.clearCanvas()

    this.pushOperateStack(colorHandleImage)
    
    this.loadImage().then(() => {
      this.drawCanvasPanel()
    })
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
}