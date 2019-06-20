import './crop.less'
import EXIF from 'exif-js'

export default class operationImage {
  constructor(imageList = [], container, cropModel = 'freedom', cropMinW = 50, cropMinH = 50) {
    if (!imageList && imageList.length === 0) {
      throw new Error('imageList 不能为空')
    } else if ('[object Array]' !== Object.prototype.toString.call(imageList)) {
      throw new Error('imageList 属性值的类型必须是数组!')
    }

    if (!container) {
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

    this.timer;
    this.imageType = 'image/png'
    this.imageDefinition = 1.0

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
    //此字段用来标记 设置等比模式之后是否旋转过。如果旋转过，那么计算 等比 放大缩小的计算方式有变化
    this.isRotate = false
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
        self.autoRotateImage(this).then((base64URL) => {
          let blobImg = new Image()
          blobImg.onload = function () {
            self.imageList[self.currentIndex]['image'] = this
            self.canvas.height = this.height
            self.canvas.width = this.width
            self.container.appendChild(self.canvasContainerDiv)
            self.context = self.canvas.getContext("2d")
            self.context.drawImage(this, 0, 0)
            resolve()
          }
          blobImg.src = base64URL

        }, (result) => {
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
        console.log("img load error::::", error)
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
        // __url = URL.createObjectURL(imageInfo.operateStack[imageInfo.operateStackIndex])
        let oReader = new FileReader()
        oReader.onload = function (e) {
          img.src = e.target.result
        }
        oReader.readAsDataURL(imageInfo.operateStack[imageInfo.operateStackIndex])
      }
    })
  }
  //根据图片拍摄角度自动纠正
  autoRotateImage(imgFile) {
    let self = this
    return new Promise((resolve, reject) => {
      let Orientation = null,
        canvas = document.createElement('canvas'),
        ctx = canvas.getContext("2d"),
        deg = Math.PI / 180;

      EXIF.getData(imgFile, function () {
        
        Orientation = EXIF.getTag(this, "Orientation");
        
        switch (Orientation) {
          case 3:
            canvas.width = imgFile.width
            canvas.height = imgFile.height
            ctx.translate(canvas.width / 2, canvas.height / 2)
            ctx.rotate(180 * (Math.PI / 180));
            ctx.translate(-canvas.width / 2, -canvas.height / 2)
            ctx.drawImage(imgFile, 0, 0, canvas.width, canvas.height)
            resolve(canvas.toDataURL(self.imageType, self.imageDefinition))
            break;
          case 6:
            canvas.width = imgFile.height
            canvas.height = imgFile.width
            ctx.translate(canvas.width, 0)
            ctx.rotate(90 * (Math.PI / 180));
            ctx.drawImage(this, 0, 0, canvas.height, canvas.width)
            resolve(canvas.toDataURL(self.imageType, self.imageDefinition))
            break;
          case 8:
            canvas.width = imgFile.height
            canvas.height = imgFile.width
            ctx.translate(0, canvas.height)
            ctx.rotate(270 * (Math.PI / 180));
            ctx.drawImage(this, 0, 0, canvas.height, canvas.width)
            resolve(canvas.toDataURL(self.imageType, self.imageDefinition))
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
    if (height < (parseInt(this.container.getBoundingClientRect().height) - 10) && width < (parseInt(this.container.getBoundingClientRect().width))) {
      return 1
    } else {
      heightProportion = (parseInt(this.container.getBoundingClientRect().height) - 10) / height;
      widthProportion = (parseInt(this.container.getBoundingClientRect().width) - 10) / width
      return heightProportion > widthProportion ? widthProportion : heightProportion
    }
  }
  drawCanvasPanel() {
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
  crop() {
    this.loadImage().then(_ => {
      this.drawCanvasPanel()
      this.createCropBox()
    })
  }
  //定义裁切框
  chooseCropViewBox(cropModel) {
    // if (this.cropModel !== cropModel) {
      this.cropModel = cropModel
      this.isRotate = false
      if (!!document.querySelector('.cropper-wrap-box')) {
        this.initCropBoxSize()
      } else {
        this.createCropBox()
      }
      // this.destroyCropTouchEvent()
      // document.querySelector('.cropper-wrap-box').remove()
      // this.createCropBox()
    // }
  }

  createCropBox() {
    if (!document.querySelector('.cropper-drag-box')) {
      let dragBox = document.createElement('div')
      dragBox.classList.add('cropper-drag-box')
      dragBox.classList.add('cropper-crop')
      dragBox.classList.add('cropper-modal')
      this.container.appendChild(dragBox)
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

    this.initCropBoxSize()
    this.initCropTouchEvent()
  }

  initCropBoxSize() {
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
    this.cropperCropBoxTranslate3d = {
      X: 0,
      Y: 0
    }
    
    if (this.cropModel === 'freedom') {
      if (Math.abs((_imageInfo.imageRotateDeg / 90) % 2) === 0) {
        cropperCropBox.style.width = _imageInfo.borderlineValue.width + 'px'
        cropperCropBox.style.height = _imageInfo.borderlineValue.height + 'px'
        cropperCropBox.style.top = _imageInfo.borderlineValue.top + 'px'
        cropperCropBox.style.left = _imageInfo.borderlineValue.left + 'px'
      } else if (Math.abs((_imageInfo.imageRotateDeg / 90) % 2) === 1) {
        cropperCropBox.style.width = _imageInfo.borderlineValue.height / _imageInfo.canvasScaleProportion + 'px'
        cropperCropBox.style.height = _imageInfo.borderlineValue.width / _imageInfo.canvasScaleProportion + 'px'
      }
    } else {
      let scale = this.cropModel.split(":")
      
      if (Math.abs((_imageInfo.imageRotateDeg / 90) % 2) === 0) {
        if (scale[0] / scale[1] <= 1) {
          let calcWidth = _imageInfo.borderlineValue.height * (scale[0] / scale[1]);
          if (calcWidth <= _imageInfo.borderlineValue.width) {
            cropperCropBox.style.width = calcWidth + 'px'
            cropperCropBox.style.height = (_imageInfo.borderlineValue.height / _imageInfo.canvasScaleProportion) + 'px'
            this.cropperCropBoxTranslate3d = {
              X: (_imageInfo.borderlineValue.width - calcWidth) / 2,
              Y: 0
            }
          } else {
            let calcHeight = _imageInfo.borderlineValue.height * (_imageInfo.borderlineValue.width / calcWidth);
            cropperCropBox.style.width = _imageInfo.borderlineValue.width + 'px'
            cropperCropBox.style.height = (calcHeight / _imageInfo.canvasScaleProportion) + 'px'
            this.cropperCropBoxTranslate3d = {
              X: 0,
              Y: (_imageInfo.borderlineValue.height - calcHeight) / 2
            }
          }
        } else {
          let calcHeight = _imageInfo.borderlineValue.width * (scale[1] / scale[0]);
          
          if (calcHeight <= _imageInfo.borderlineValue.height) {
            cropperCropBox.style.width = (_imageInfo.borderlineValue.width / _imageInfo.canvasScaleProportion) + 'px'
            cropperCropBox.style.height = calcHeight + 'px'
            this.cropperCropBoxTranslate3d = {
              X: 0,
              Y: (_imageInfo.borderlineValue.height - calcHeight) / 2
            }
          } else {
            let calcWidth = _imageInfo.borderlineValue.width * (_imageInfo.borderlineValue.height / calcHeight)
            cropperCropBox.style.width = (calcWidth / _imageInfo.canvasScaleProportion) + 'px'
            cropperCropBox.style.height = (_imageInfo.borderlineValue.height / _imageInfo.canvasScaleProportion) + 'px'
            this.cropperCropBoxTranslate3d = {
              X: (_imageInfo.borderlineValue.width - calcWidth) / 2,
              Y: 0
            }
          }
        }

      } else if (Math.abs((_imageInfo.imageRotateDeg / 90) % 2) === 1) {
        if (scale[0] / scale[1] <= 1) {
          let calcWidth = _imageInfo.borderlineValue.height * (scale[0] / scale[1]);
          if (calcWidth <= _imageInfo.borderlineValue.width) {
            cropperCropBox.style.width = (_imageInfo.borderlineValue.height / _imageInfo.canvasScaleProportion) + 'px'
            cropperCropBox.style.height = (calcWidth / _imageInfo.canvasScaleProportion) + 'px'
            this.cropperCropBoxTranslate3d = {
              X: 0,
              Y: ((_imageInfo.borderlineValue.width - calcWidth) / _imageInfo.canvasScaleProportion) / 2
            }
          } else {
            let calcHeight = _imageInfo.borderlineValue.height * (_imageInfo.borderlineValue.width / calcWidth)
            cropperCropBox.style.width = _imageInfo.borderlineValue.width / _imageInfo.canvasScaleProportion + 'px'
            cropperCropBox.style.height = (calcHeight / _imageInfo.canvasScaleProportion) + 'px'
            this.cropperCropBoxTranslate3d = {
              X: ((_imageInfo.borderlineValue.height - calcHeight) / _imageInfo.canvasScaleProportion) / 2,
              Y: 0
            }
          }
        } else {
          let calcHeight = _imageInfo.borderlineValue.width * (scale[1] / scale[0]);
          if (calcHeight <= _imageInfo.borderlineValue.height) {
            cropperCropBox.style.width = (calcHeight / _imageInfo.canvasScaleProportion) + 'px'
            cropperCropBox.style.height = (_imageInfo.borderlineValue.width / _imageInfo.canvasScaleProportion) + 'px'
            this.cropperCropBoxTranslate3d = {
              X: ((_imageInfo.borderlineValue.height - calcHeight) / _imageInfo.canvasScaleProportion) / 2,
              Y: 0
            }
          } else {
            let calcWidth = _imageInfo.borderlineValue.width * (_imageInfo.borderlineValue.height/calcHeight)
            cropperCropBox.style.width = (_imageInfo.borderlineValue.height / _imageInfo.canvasScaleProportion) + 'px'
            cropperCropBox.style.height = (calcWidth / _imageInfo.canvasScaleProportion) + 'px'
            this.cropperCropBoxTranslate3d = {
              X: 0,
              Y: ((_imageInfo.borderlineValue.width - calcWidth) / _imageInfo.canvasScaleProportion) / 2
            }
          }
        }
      }
    }

    this.initCropBoxPosition = {
      X: 0,
      Y: 0
    }

    this.imageList[this.currentIndex] = _imageInfo

    cropperCropBox.style.transform = 'translate3d(' + this.cropperCropBoxTranslate3d.X + 'px,' + this.cropperCropBoxTranslate3d.Y + 'px,0px) '
    this.calcViewBoxImgXY()
  }

  initCropTouchEvent() {
    let cropperCropBox = document.querySelector('.cropper-crop-box');

    let theCropperMove = document.querySelector('.cropper-face.cropper-move');

    let self = this,
      _imageInfo = this.imageList[this.currentIndex];

    this.theLeftTopTouchMove = function (e) {

      let pageX = parseFloat(e.touches[0].pageX),
        pageY = parseFloat(e.touches[0].pageY);

      let cropperCropBoxBorderLine = cropperCropBox.getBoundingClientRect(),
        canvasContainerBorderlineValue = document.querySelector('#canvasContainerDiv').getBoundingClientRect()

      let mouseX, mouseY;

      mouseX = pageX - cropperCropBoxBorderLine.left;
      mouseY = pageY - cropperCropBoxBorderLine.top;

      //自由比例
      if (self.cropModel === 'freedom') {
        if (cropperCropBoxBorderLine.width - mouseX <= canvasContainerBorderlineValue.width && cropperCropBoxBorderLine.width - mouseX >= self.cropMinW && pageX > canvasContainerBorderlineValue.left) {
          if (Math.abs((_imageInfo.imageRotateDeg / 90) % 4) === 0) {
            if (self.cropperCropBoxTranslate3d.X + mouseX > -self.initCropBoxPosition.X) {
              cropperCropBox.style.width = (cropperCropBoxBorderLine.width - mouseX) + 'px'
              self.cropperCropBoxTranslate3d.X = self.cropperCropBoxTranslate3d.X + mouseX
            }
          } else if (Math.abs((_imageInfo.imageRotateDeg / 90) % 4) === 1) {
            if (self.cropperCropBoxTranslate3d.Y + mouseX > -self.initCropBoxPosition.X) {
              cropperCropBox.style.height = (cropperCropBoxBorderLine.width - mouseX) / _imageInfo.canvasScaleProportion + 'px'
              self.cropperCropBoxTranslate3d.Y = self.cropperCropBoxTranslate3d.Y + (mouseX / _imageInfo.canvasScaleProportion)
            }
          } else if (Math.abs((_imageInfo.imageRotateDeg / 90) % 4) === 2) {
            cropperCropBox.style.width = (cropperCropBoxBorderLine.width - mouseX) + 'px'
          } else if (Math.abs((_imageInfo.imageRotateDeg / 90) % 4) === 3) {
            cropperCropBox.style.height = (cropperCropBoxBorderLine.width - mouseX) / _imageInfo.canvasScaleProportion + 'px'
          }
        }
        if (cropperCropBoxBorderLine.height - mouseY <= canvasContainerBorderlineValue.height && cropperCropBoxBorderLine.height - mouseY >= self.cropMinH && pageY > canvasContainerBorderlineValue.top) {
          if (Math.abs((_imageInfo.imageRotateDeg / 90) % 4) === 0) {
            if (self.cropperCropBoxTranslate3d.Y + mouseY > -self.initCropBoxPosition.Y) {
              cropperCropBox.style.height = (cropperCropBoxBorderLine.height - mouseY) + 'px'
              self.cropperCropBoxTranslate3d.Y = self.cropperCropBoxTranslate3d.Y + mouseY
            }
          } else if (Math.abs((_imageInfo.imageRotateDeg / 90) % 4) === 1) {
            cropperCropBox.style.width = (cropperCropBoxBorderLine.height - mouseY) / _imageInfo.canvasScaleProportion + 'px'
          } else if (Math.abs((_imageInfo.imageRotateDeg / 90) % 4) === 2) {
            cropperCropBox.style.height = (cropperCropBoxBorderLine.height - mouseY) + 'px'
          } else if (Math.abs((_imageInfo.imageRotateDeg / 90) % 4) === 3) {
            if (self.cropperCropBoxTranslate3d.X + mouseY > -self.initCropBoxPosition.Y) {
              cropperCropBox.style.width = (cropperCropBoxBorderLine.height - mouseY) / _imageInfo.canvasScaleProportion + 'px'
              self.cropperCropBoxTranslate3d.X = self.cropperCropBoxTranslate3d.X + (mouseY / _imageInfo.canvasScaleProportion)
            }
          }
        }
      } else {
        let scale = self.cropModel.split(":")
        scale = scale[0] / scale[1]

        if (!self.isRotate) {
          mouseY = mouseX / scale
        } else {
          mouseY = mouseX * scale
        }

        if (cropperCropBoxBorderLine.width - mouseX <= canvasContainerBorderlineValue.width && cropperCropBoxBorderLine.width - mouseX >= self.cropMinW && pageX > canvasContainerBorderlineValue.left && cropperCropBoxBorderLine.height - mouseY <= canvasContainerBorderlineValue.height && cropperCropBoxBorderLine.height - mouseY >= self.cropMinH && pageY > canvasContainerBorderlineValue.top && cropperCropBoxBorderLine.bottom - canvasContainerBorderlineValue.top - (cropperCropBoxBorderLine.height - mouseY) > -self.initCropBoxPosition.Y) {
          if (Math.abs((_imageInfo.imageRotateDeg / 90) % 4) === 0) {
            if (self.cropperCropBoxTranslate3d.X + mouseX > -self.initCropBoxPosition.X && self.cropperCropBoxTranslate3d.Y + mouseY > -self.initCropBoxPosition.Y) {
              cropperCropBox.style.width = (cropperCropBoxBorderLine.width - mouseX) + 'px'
              self.cropperCropBoxTranslate3d.X = self.cropperCropBoxTranslate3d.X + mouseX
              cropperCropBox.style.height = (cropperCropBoxBorderLine.height - mouseY) + 'px'
              self.cropperCropBoxTranslate3d.Y = self.cropperCropBoxTranslate3d.Y + mouseY
            }
          } else if (Math.abs((_imageInfo.imageRotateDeg / 90) % 4) === 1) {
            if (self.cropperCropBoxTranslate3d.Y + mouseX > -self.initCropBoxPosition.Y) {
              cropperCropBox.style.height = (cropperCropBoxBorderLine.width - mouseX) / _imageInfo.canvasScaleProportion + 'px'
              self.cropperCropBoxTranslate3d.Y = self.cropperCropBoxTranslate3d.Y + (mouseX / _imageInfo.canvasScaleProportion)
              cropperCropBox.style.width = (cropperCropBoxBorderLine.height - mouseY) / _imageInfo.canvasScaleProportion + 'px'
            }
          } else if (Math.abs((_imageInfo.imageRotateDeg / 90) % 4) === 2) {
            cropperCropBox.style.width = (cropperCropBoxBorderLine.width - mouseX) / _imageInfo.canvasScaleProportion + 'px'
            cropperCropBox.style.height = (cropperCropBoxBorderLine.height - mouseY) / _imageInfo.canvasScaleProportion + 'px'
          } else if (Math.abs((_imageInfo.imageRotateDeg / 90) % 4) === 3) {
            if (self.cropperCropBoxTranslate3d.X + mouseY > -self.initCropBoxPosition.Y) {
              cropperCropBox.style.height = (cropperCropBoxBorderLine.width - mouseX) / _imageInfo.canvasScaleProportion + 'px'
              cropperCropBox.style.width = (cropperCropBoxBorderLine.height - mouseY) / _imageInfo.canvasScaleProportion + 'px'
              self.cropperCropBoxTranslate3d.X = self.cropperCropBoxTranslate3d.X + (mouseY / _imageInfo.canvasScaleProportion)
            }
          }
        }
      }

      cropperCropBox.style.transform = 'translate3d(' + self.cropperCropBoxTranslate3d.X + 'px,' + self.cropperCropBoxTranslate3d.Y + 'px,0px) '
      self.calcViewBoxImgXY()
      e.preventDefault()
      e.stopPropagation()
    }



    this.theRightTopTouchMove = function (e) {
      let pageX = parseFloat(e.touches[0].pageX),
        pageY = parseFloat(e.touches[0].pageY);

      let cropperCropBoxBorderLine = cropperCropBox.getBoundingClientRect(),
        canvasContainerBorderlineValue = document.querySelector('#canvasContainerDiv').getBoundingClientRect()

      let mouseX = pageX - cropperCropBoxBorderLine.right;
      let mouseY = pageY - cropperCropBoxBorderLine.top;
      if (self.cropModel === 'freedom') {
        if (cropperCropBoxBorderLine.width + mouseX <= canvasContainerBorderlineValue.width && cropperCropBoxBorderLine.width + mouseX >= self.cropMinW && pageX < canvasContainerBorderlineValue.right) {
          if (Math.abs((_imageInfo.imageRotateDeg / 90) % 4) === 0) {
            cropperCropBox.style.width = (cropperCropBoxBorderLine.width + mouseX) + 'px'
          } else if (Math.abs((_imageInfo.imageRotateDeg / 90) % 4) === 1) {
            cropperCropBox.style.height = (cropperCropBoxBorderLine.width + mouseX) / _imageInfo.canvasScaleProportion + 'px'
          } else if (Math.abs((_imageInfo.imageRotateDeg / 90) % 4) === 2) {
            if (self.cropperCropBoxTranslate3d.X - mouseX > -self.initCropBoxPosition.X) {
              cropperCropBox.style.width = (cropperCropBoxBorderLine.width + mouseX) + 'px'
              self.cropperCropBoxTranslate3d.X = self.cropperCropBoxTranslate3d.X - mouseX
            }
          } else if (Math.abs((_imageInfo.imageRotateDeg / 90) % 4) === 3) {
            if (self.cropperCropBoxTranslate3d.Y - mouseX > -self.initCropBoxPosition.X) {
              cropperCropBox.style.height = (cropperCropBoxBorderLine.width + mouseX) / _imageInfo.canvasScaleProportion + 'px'
              self.cropperCropBoxTranslate3d.Y = self.cropperCropBoxTranslate3d.Y - (mouseX / _imageInfo.canvasScaleProportion)
            }
          }
        }

        if (cropperCropBoxBorderLine.height - mouseY <= canvasContainerBorderlineValue.height && cropperCropBoxBorderLine.height - mouseY >= self.cropMinH && pageY > canvasContainerBorderlineValue.top) {
          if (Math.abs((_imageInfo.imageRotateDeg / 90) % 4) === 0) {
            if (self.cropperCropBoxTranslate3d.Y + mouseY > -self.initCropBoxPosition.Y) {
              cropperCropBox.style.height = (cropperCropBoxBorderLine.height - mouseY) + 'px'
              self.cropperCropBoxTranslate3d.Y = self.cropperCropBoxTranslate3d.Y + mouseY
            }
          } else if (Math.abs((_imageInfo.imageRotateDeg / 90) % 4) === 1) {
            cropperCropBox.style.width = (cropperCropBoxBorderLine.height - mouseY) / _imageInfo.canvasScaleProportion + 'px'
          } else if (Math.abs((_imageInfo.imageRotateDeg / 90) % 4) === 2) {
            cropperCropBox.style.height = (cropperCropBoxBorderLine.height - mouseY) + 'px'
          } else if (Math.abs((_imageInfo.imageRotateDeg / 90) % 4) === 3) {
            if (self.cropperCropBoxTranslate3d.X + mouseY > -self.initCropBoxPosition.Y) {
              cropperCropBox.style.width = (cropperCropBoxBorderLine.height - mouseY) / _imageInfo.canvasScaleProportion + 'px'
              self.cropperCropBoxTranslate3d.X = self.cropperCropBoxTranslate3d.X + (mouseY / _imageInfo.canvasScaleProportion)
            }
          }
        }

      } else {
        let scale = self.cropModel.split(":")
        scale = scale[0] / scale[1]

        if (!self.isRotate) {
          mouseY = mouseX / scale
        } else {
          mouseY = mouseX * scale
        }

        if (cropperCropBoxBorderLine.width + mouseX <= canvasContainerBorderlineValue.width && cropperCropBoxBorderLine.width + mouseX >= self.cropMinW && pageX < canvasContainerBorderlineValue.right && cropperCropBoxBorderLine.height + mouseY <= canvasContainerBorderlineValue.height && cropperCropBoxBorderLine.height + mouseY >= self.cropMinH && pageY > canvasContainerBorderlineValue.top && cropperCropBoxBorderLine.bottom - canvasContainerBorderlineValue.top - (cropperCropBoxBorderLine.height + mouseY) > -self.initCropBoxPosition.Y) {
          if (Math.abs((_imageInfo.imageRotateDeg / 90) % 4) === 0) {
            if (self.cropperCropBoxTranslate3d.Y - mouseY > -self.initCropBoxPosition.Y) {
              cropperCropBox.style.width = (cropperCropBoxBorderLine.width + mouseX) + 'px'
              cropperCropBox.style.height = (cropperCropBoxBorderLine.height + mouseY) + 'px'
              self.cropperCropBoxTranslate3d.Y = self.cropperCropBoxTranslate3d.Y - mouseY
            }
          } else if (Math.abs((_imageInfo.imageRotateDeg / 90) % 4) === 1) {
            cropperCropBox.style.height = (cropperCropBoxBorderLine.width + mouseX) / _imageInfo.canvasScaleProportion + 'px'
            cropperCropBox.style.width = (cropperCropBoxBorderLine.height + mouseY) / _imageInfo.canvasScaleProportion + 'px'
          } else if (Math.abs((_imageInfo.imageRotateDeg / 90) % 4) === 2) {
            if (self.cropperCropBoxTranslate3d.X - mouseX > -self.initCropBoxPosition.X) {
              cropperCropBox.style.width = (cropperCropBoxBorderLine.width + mouseX) + 'px'
              self.cropperCropBoxTranslate3d.X = self.cropperCropBoxTranslate3d.X - mouseX
              cropperCropBox.style.height = (cropperCropBoxBorderLine.height + mouseY) + 'px'
            }
          } else if (Math.abs((_imageInfo.imageRotateDeg / 90) % 4) === 3) {
            if (self.cropperCropBoxTranslate3d.Y - mouseX > -self.initCropBoxPosition.X && self.cropperCropBoxTranslate3d.X - mouseY > -self.initCropBoxPosition.Y) {
              cropperCropBox.style.height = (cropperCropBoxBorderLine.width + mouseX) / _imageInfo.canvasScaleProportion + 'px'
              self.cropperCropBoxTranslate3d.Y = self.cropperCropBoxTranslate3d.Y - (mouseX / _imageInfo.canvasScaleProportion)

              cropperCropBox.style.width = (cropperCropBoxBorderLine.height + mouseY) / _imageInfo.canvasScaleProportion + 'px'
              self.cropperCropBoxTranslate3d.X = self.cropperCropBoxTranslate3d.X - (mouseY / _imageInfo.canvasScaleProportion)
            }
          }
        }

      }
      cropperCropBox.style.transform = 'translate3d(' + self.cropperCropBoxTranslate3d.X + 'px,' + self.cropperCropBoxTranslate3d.Y + 'px,0px)'
      self.calcViewBoxImgXY()
      e.preventDefault()
      e.stopPropagation()
    }

    this.theLeftBottomTouchMove = function (e) {
      let pageX = parseFloat(e.touches[0].pageX),
        pageY = parseFloat(e.touches[0].pageY);

      let cropperCropBoxBorderLine = cropperCropBox.getBoundingClientRect(),
        canvasContainerBorderlineValue = document.querySelector('#canvasContainerDiv').getBoundingClientRect()

      let mouseX = pageX - cropperCropBoxBorderLine.left;
      let mouseY = pageY - cropperCropBoxBorderLine.bottom;

      if (self.cropModel === 'freedom') {
        if (cropperCropBoxBorderLine.width - mouseX <= canvasContainerBorderlineValue.width && cropperCropBoxBorderLine.width - mouseX >= self.cropMinW && pageX > canvasContainerBorderlineValue.left) {
          if (Math.abs((_imageInfo.imageRotateDeg / 90) % 4) === 0) {
            if (self.cropperCropBoxTranslate3d.X + mouseX > -self.initCropBoxPosition.X) {
              cropperCropBox.style.width = (cropperCropBoxBorderLine.width - mouseX) + 'px'
              self.cropperCropBoxTranslate3d.X = self.cropperCropBoxTranslate3d.X + mouseX
            }
          } else if (Math.abs((_imageInfo.imageRotateDeg / 90) % 4) === 1) {
            if (self.cropperCropBoxTranslate3d.Y + mouseX > -self.initCropBoxPosition.X) {
              cropperCropBox.style.height = (cropperCropBoxBorderLine.width - mouseX) / _imageInfo.canvasScaleProportion + 'px'
              self.cropperCropBoxTranslate3d.Y = self.cropperCropBoxTranslate3d.Y + (mouseX / _imageInfo.canvasScaleProportion)
            }
          } else if (Math.abs((_imageInfo.imageRotateDeg / 90) % 4) === 2) {
            cropperCropBox.style.width = (cropperCropBoxBorderLine.width - mouseX) + 'px'
          } else if (Math.abs((_imageInfo.imageRotateDeg / 90) % 4) === 3) {
            cropperCropBox.style.height = (cropperCropBoxBorderLine.width - mouseX) / _imageInfo.canvasScaleProportion + 'px'
          }
        }

        if (cropperCropBoxBorderLine.height + mouseY <= canvasContainerBorderlineValue.height && cropperCropBoxBorderLine.height + mouseY >= self.cropMinH && pageY < canvasContainerBorderlineValue.bottom) {
          if (Math.abs((_imageInfo.imageRotateDeg / 90) % 4) === 0) {
            cropperCropBox.style.height = (cropperCropBoxBorderLine.height + mouseY) + 'px'
          } else if (Math.abs((_imageInfo.imageRotateDeg / 90) % 4) === 1) {
            cropperCropBox.style.width = (cropperCropBoxBorderLine.height + mouseY) / _imageInfo.canvasScaleProportion + 'px'
            self.cropperCropBoxTranslate3d.X = self.cropperCropBoxTranslate3d.X - (mouseY / _imageInfo.canvasScaleProportion)
          } else if (Math.abs((_imageInfo.imageRotateDeg / 90) % 4) === 2) {
            cropperCropBox.style.height = (cropperCropBoxBorderLine.height + mouseY) + 'px'
            self.cropperCropBoxTranslate3d.Y = self.cropperCropBoxTranslate3d.Y - mouseY
          } else if (Math.abs((_imageInfo.imageRotateDeg / 90) % 4) === 3) {
            cropperCropBox.style.width = (cropperCropBoxBorderLine.height + mouseY) / _imageInfo.canvasScaleProportion + 'px'
          }
        }

      } else {
        let scale = self.cropModel.split(":")
        scale = scale[0] / scale[1]

        if (!self.isRotate) {
          mouseY = mouseX / scale
        } else {
          mouseY = mouseX * scale
        }


        if (cropperCropBoxBorderLine.width - mouseX <= canvasContainerBorderlineValue.width && cropperCropBoxBorderLine.width - mouseX >= self.cropMinW && pageX > canvasContainerBorderlineValue.left && cropperCropBoxBorderLine.height - mouseY <= canvasContainerBorderlineValue.height && cropperCropBoxBorderLine.height - mouseY >= self.cropMinH && pageY < canvasContainerBorderlineValue.bottom && (cropperCropBoxBorderLine.height - mouseY) + cropperCropBoxBorderLine.top < canvasContainerBorderlineValue.bottom) {
          if (Math.abs((_imageInfo.imageRotateDeg / 90) % 4) === 0) {
            if (self.cropperCropBoxTranslate3d.X + mouseX > -self.initCropBoxPosition.X) {
              cropperCropBox.style.width = (cropperCropBoxBorderLine.width - mouseX) + 'px'
              self.cropperCropBoxTranslate3d.X = self.cropperCropBoxTranslate3d.X + mouseX
              cropperCropBox.style.height = (cropperCropBoxBorderLine.height - mouseY) + 'px'
            }
          } else if (Math.abs((_imageInfo.imageRotateDeg / 90) % 4) === 1) {
            if (self.cropperCropBoxTranslate3d.Y + mouseX > -self.initCropBoxPosition.X) {
              cropperCropBox.style.height = (cropperCropBoxBorderLine.width - mouseX) / _imageInfo.canvasScaleProportion + 'px'
              self.cropperCropBoxTranslate3d.Y = self.cropperCropBoxTranslate3d.Y + (mouseX / _imageInfo.canvasScaleProportion)

              cropperCropBox.style.width = (cropperCropBoxBorderLine.height - mouseY) / _imageInfo.canvasScaleProportion + 'px'
              self.cropperCropBoxTranslate3d.X = self.cropperCropBoxTranslate3d.X + (mouseY / _imageInfo.canvasScaleProportion)
            }
          } else if (Math.abs((_imageInfo.imageRotateDeg / 90) % 4) === 2) {
            cropperCropBox.style.width = (cropperCropBoxBorderLine.width - mouseX) + 'px'
            cropperCropBox.style.height = (cropperCropBoxBorderLine.height - mouseY) + 'px'
            self.cropperCropBoxTranslate3d.Y = self.cropperCropBoxTranslate3d.Y + mouseY
          } else if (Math.abs((_imageInfo.imageRotateDeg / 90) % 4) === 3) {
            cropperCropBox.style.height = (cropperCropBoxBorderLine.width - mouseX) / _imageInfo.canvasScaleProportion + 'px'
            cropperCropBox.style.width = (cropperCropBoxBorderLine.height - mouseY) / _imageInfo.canvasScaleProportion + 'px'
          }
        }
      }
      cropperCropBox.style.transform = 'translate3d(' + self.cropperCropBoxTranslate3d.X + 'px,' + self.cropperCropBoxTranslate3d.Y + 'px,0px)'

      self.calcViewBoxImgXY()
      e.preventDefault()
      e.stopPropagation()
    }

    this.theRightBottomTouchMove = function (e) {
      let pageX = parseFloat(e.touches[0].pageX),
        pageY = parseFloat(e.touches[0].pageY);

      let cropperCropBoxBorderLine = cropperCropBox.getBoundingClientRect(),
        canvasContainerBorderlineValue = document.querySelector('#canvasContainerDiv').getBoundingClientRect()

      let mouseX = pageX - cropperCropBoxBorderLine.right;
      let mouseY = pageY - cropperCropBoxBorderLine.bottom;

      if (self.cropModel === 'freedom') {
        if (cropperCropBoxBorderLine.width + mouseX <= canvasContainerBorderlineValue.width && cropperCropBoxBorderLine.width + mouseX >= self.cropMinW && pageX < canvasContainerBorderlineValue.right) {
          if (Math.abs((_imageInfo.imageRotateDeg / 90) % 4) === 0) {
            cropperCropBox.style.width = (cropperCropBoxBorderLine.width + mouseX) + 'px'
          } else if (Math.abs((_imageInfo.imageRotateDeg / 90) % 4) === 1) {
            cropperCropBox.style.height = (cropperCropBoxBorderLine.width + mouseX) / _imageInfo.canvasScaleProportion + 'px'
          } else if (Math.abs((_imageInfo.imageRotateDeg / 90) % 4) === 2) {
            cropperCropBox.style.width = (cropperCropBoxBorderLine.width + mouseX) + 'px'
            self.cropperCropBoxTranslate3d.X = self.cropperCropBoxTranslate3d.X - mouseX
          } else if (Math.abs((_imageInfo.imageRotateDeg / 90) % 4) === 3) {
            if (self.cropperCropBoxTranslate3d.Y - mouseX > -self.initCropBoxPosition.X) {
              cropperCropBox.style.height = (cropperCropBoxBorderLine.width + mouseX) / _imageInfo.canvasScaleProportion + 'px'
              self.cropperCropBoxTranslate3d.Y = self.cropperCropBoxTranslate3d.Y - (mouseX / _imageInfo.canvasScaleProportion)
            }
          }
        }

        if (cropperCropBoxBorderLine.height + mouseY <= canvasContainerBorderlineValue.height && cropperCropBoxBorderLine.height + mouseY >= self.cropMinH && pageY < canvasContainerBorderlineValue.bottom) {
          if (Math.abs((_imageInfo.imageRotateDeg / 90) % 4) === 0) {
            cropperCropBox.style.height = (cropperCropBoxBorderLine.height + mouseY) + 'px'
          } else if (Math.abs((_imageInfo.imageRotateDeg / 90) % 4) === 1) {
            cropperCropBox.style.width = (cropperCropBoxBorderLine.height + mouseY) / _imageInfo.canvasScaleProportion + 'px'

            self.cropperCropBoxTranslate3d.X = self.cropperCropBoxTranslate3d.X - (mouseY / _imageInfo.canvasScaleProportion)
          } else if (Math.abs((_imageInfo.imageRotateDeg / 90) % 4) === 2) {
            cropperCropBox.style.height = (cropperCropBoxBorderLine.height + mouseY) + 'px'
            self.cropperCropBoxTranslate3d.Y = self.cropperCropBoxTranslate3d.Y - mouseY
          } else if (Math.abs((_imageInfo.imageRotateDeg / 90) % 4) === 3) {
            cropperCropBox.style.width = (cropperCropBoxBorderLine.height + mouseY) / _imageInfo.canvasScaleProportion + 'px'
          }
        }
      } else {
        let scale = self.cropModel.split(":")
        scale = scale[0] / scale[1]

        if (!self.isRotate) {
          mouseY = mouseX / scale
        } else {
          mouseY = mouseX * scale
        }

        if (cropperCropBoxBorderLine.width + mouseX <= canvasContainerBorderlineValue.width && cropperCropBoxBorderLine.width + mouseX >= self.cropMinW && pageX < canvasContainerBorderlineValue.right && cropperCropBoxBorderLine.height + mouseY <= canvasContainerBorderlineValue.height && cropperCropBoxBorderLine.height + mouseY >= self.cropMinH && pageY < canvasContainerBorderlineValue.bottom && (cropperCropBoxBorderLine.height + mouseY) + cropperCropBoxBorderLine.top < canvasContainerBorderlineValue.bottom) {
          if (Math.abs((_imageInfo.imageRotateDeg / 90) % 4) === 0) {
            cropperCropBox.style.width = (cropperCropBoxBorderLine.width + mouseX) + 'px'
            cropperCropBox.style.height = (cropperCropBoxBorderLine.height + mouseY) + 'px'
          } else if (Math.abs((_imageInfo.imageRotateDeg / 90) % 4) === 1) {
            cropperCropBox.style.height = (cropperCropBoxBorderLine.width + mouseX) / _imageInfo.canvasScaleProportion + 'px'
            cropperCropBox.style.width = (cropperCropBoxBorderLine.height + mouseY) / _imageInfo.canvasScaleProportion + 'px'
            self.cropperCropBoxTranslate3d.X = self.cropperCropBoxTranslate3d.X - (mouseY / _imageInfo.canvasScaleProportion)
          } else if (Math.abs((_imageInfo.imageRotateDeg / 90) % 4) === 2) {
            cropperCropBox.style.width = (cropperCropBoxBorderLine.width + mouseX) + 'px'
            self.cropperCropBoxTranslate3d.X = self.cropperCropBoxTranslate3d.X - mouseX
            cropperCropBox.style.height = (cropperCropBoxBorderLine.height + mouseY) + 'px'
            self.cropperCropBoxTranslate3d.Y = self.cropperCropBoxTranslate3d.Y - mouseY
          } else if (Math.abs((_imageInfo.imageRotateDeg / 90) % 4) === 3) {
            if (self.cropperCropBoxTranslate3d.Y - mouseX > -self.initCropBoxPosition.X) {
              cropperCropBox.style.height = (cropperCropBoxBorderLine.width + mouseX) / _imageInfo.canvasScaleProportion + 'px'
              self.cropperCropBoxTranslate3d.Y = self.cropperCropBoxTranslate3d.Y - (mouseX / _imageInfo.canvasScaleProportion)
              cropperCropBox.style.width = (cropperCropBoxBorderLine.height + mouseY) / _imageInfo.canvasScaleProportion + 'px'
            }
          }
        }
      }

      cropperCropBox.style.transform = 'translate3d(' + self.cropperCropBoxTranslate3d.X + 'px,' + self.cropperCropBoxTranslate3d.Y + 'px,0px)'
      self.calcViewBoxImgXY()
      e.preventDefault()
      e.stopPropagation()
    }

    this.bindCropFourHornEvent()

    let startMovePos = {}

    this.theCropperMoveTouchStart = function (e) {
      let pageX = parseFloat(e.touches[0].pageX),
        pageY = parseFloat(e.touches[0].pageY);
      let mouseX = pageX - cropperCropBox.getBoundingClientRect().left;
      let mouseY = pageY - cropperCropBox.getBoundingClientRect().top;
      startMovePos = {
        mouseX: mouseX,
        mouseY: mouseY
      }
      e.preventDefault()
      e.stopPropagation()
    }

    theCropperMove.addEventListener('touchstart', this.theCropperMoveTouchStart)

    this.theCropperMoveTouchMove = function (e) {
      let pageX = parseFloat(e.touches[0].pageX),
        pageY = parseFloat(e.touches[0].pageY);

      let cropperCropBoxBorderLine = cropperCropBox.getBoundingClientRect(),
        canvasContainerBorderlineValue = document.querySelector('#canvasContainerDiv').getBoundingClientRect()

      let mouseX = pageX - cropperCropBoxBorderLine.left;
      let mouseY = pageY - cropperCropBoxBorderLine.top;

      let _moveX,
        _moveY;
      if (Math.abs((_imageInfo.imageRotateDeg / 90) % 4) === 0) {
        _moveX = self.cropperCropBoxTranslate3d.X + (mouseX - startMovePos['mouseX'])
        _moveY = self.cropperCropBoxTranslate3d.Y + (mouseY - startMovePos['mouseY'])
      } else if (Math.abs((_imageInfo.imageRotateDeg / 90) % 4) === 1) {
        _moveX = self.cropperCropBoxTranslate3d.Y + (mouseX - startMovePos['mouseX'])
        _moveY = self.cropperCropBoxTranslate3d.X - (mouseY - startMovePos['mouseY'])
      } else if (Math.abs((_imageInfo.imageRotateDeg / 90) % 4) === 2) {
        _moveX = self.cropperCropBoxTranslate3d.X - (mouseX - startMovePos['mouseX'])
        _moveY = self.cropperCropBoxTranslate3d.Y - (mouseY - startMovePos['mouseY'])
      } else if (Math.abs((_imageInfo.imageRotateDeg / 90) % 4) === 3) {
        _moveX = self.cropperCropBoxTranslate3d.Y - (mouseX - startMovePos['mouseX'])
        _moveY = self.cropperCropBoxTranslate3d.X + (mouseY - startMovePos['mouseY'])
      }
      if (_moveX >= -self.initCropBoxPosition.X / _imageInfo.canvasScaleProportion && _moveX <= (canvasContainerBorderlineValue.width - cropperCropBoxBorderLine.width - self.initCropBoxPosition.X) / _imageInfo.canvasScaleProportion) {
        if (Math.abs((_imageInfo.imageRotateDeg / 90) % 2) === 0) {
          self.cropperCropBoxTranslate3d.X = _moveX
        } else if (Math.abs((_imageInfo.imageRotateDeg / 90) % 2) === 1) {
          self.cropperCropBoxTranslate3d.Y = _moveX
        }
      }
      if (_moveY >= -self.initCropBoxPosition.Y / _imageInfo.canvasScaleProportion && _moveY <= (canvasContainerBorderlineValue.height - cropperCropBoxBorderLine.height - self.initCropBoxPosition.Y) / _imageInfo.canvasScaleProportion) {
        if (Math.abs((_imageInfo.imageRotateDeg / 90) % 2) === 0) {
          self.cropperCropBoxTranslate3d.Y = _moveY
        } else if (Math.abs((_imageInfo.imageRotateDeg / 90) % 2) === 1) {
          self.cropperCropBoxTranslate3d.X = _moveY
        }
      }
      cropperCropBox.style.transform = 'translate3d(' + (self.cropperCropBoxTranslate3d.X) + 'px, ' + self.cropperCropBoxTranslate3d.Y + 'px,0px)'
      self.calcViewBoxImgXY()
      e.preventDefault()
      e.stopPropagation()
    }
    theCropperMove.addEventListener('touchmove', this.theCropperMoveTouchMove)
  }

  bindCropFourHornEvent() {
    //左上角
    let theLeftTop = document.querySelector('.cropper-point.point-nw'),
      //右上角
      theRightTop = document.querySelector('.cropper-point.point-ne'),
      //左下角
      theLeftBottom = document.querySelector('.cropper-point.point-sw'),
      //右下角
      theRightBottom = document.querySelector('.cropper-point.point-se');

    let _imageInfo = this.imageList[this.currentIndex];

    if (Math.abs((_imageInfo.imageRotateDeg / 90) % 4) === 0) {
      theLeftTop.addEventListener('touchmove', this.theLeftTopTouchMove)
      theRightTop.addEventListener('touchmove', this.theRightTopTouchMove)
      theLeftBottom.addEventListener('touchmove', this.theLeftBottomTouchMove)
      theRightBottom.addEventListener('touchmove', this.theRightBottomTouchMove)
    } else if (Math.abs((_imageInfo.imageRotateDeg / 90) % 4) === 1) {
      theRightTop.addEventListener('touchmove', this.theLeftTopTouchMove)
      theRightBottom.addEventListener('touchmove', this.theRightTopTouchMove)
      theLeftTop.addEventListener('touchmove', this.theLeftBottomTouchMove)
      theLeftBottom.addEventListener('touchmove', this.theRightBottomTouchMove)
    } else if (Math.abs((_imageInfo.imageRotateDeg / 90) % 4) === 2) {
      theRightBottom.addEventListener('touchmove', this.theLeftTopTouchMove)
      theLeftBottom.addEventListener('touchmove', this.theRightTopTouchMove)
      theRightTop.addEventListener('touchmove', this.theLeftBottomTouchMove)
      theLeftTop.addEventListener('touchmove', this.theRightBottomTouchMove)
    } else if (Math.abs((_imageInfo.imageRotateDeg / 90) % 4) === 3) {
      theLeftBottom.addEventListener('touchmove', this.theLeftTopTouchMove)
      theLeftTop.addEventListener('touchmove', this.theRightTopTouchMove)
      theRightBottom.addEventListener('touchmove', this.theLeftBottomTouchMove)
      theRightTop.addEventListener('touchmove', this.theRightBottomTouchMove)
    }
  }

  destroyCropFourHornEvent() {
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
    if (Math.abs((_imageInfo.imageRotateDeg / 90) % 4) === 0) {
      theLeftTop.removeEventListener('touchmove', this.theLeftTopTouchMove)
      theRightTop.removeEventListener('touchmove', this.theRightTopTouchMove)
      theLeftBottom.removeEventListener('touchmove', this.theLeftBottomTouchMove)
      theRightBottom.removeEventListener('touchmove', this.theRightBottomTouchMove)
    } else if (Math.abs((_imageInfo.imageRotateDeg / 90) % 4) === 1) {
      theRightTop.removeEventListener('touchmove', this.theLeftTopTouchMove)
      theRightBottom.removeEventListener('touchmove', this.theRightTopTouchMove)
      theLeftTop.removeEventListener('touchmove', this.theLeftBottomTouchMove)
      theLeftBottom.removeEventListener('touchmove', this.theRightBottomTouchMove)
    } else if (Math.abs((_imageInfo.imageRotateDeg / 90) % 4) === 2) {
      theRightBottom.removeEventListener('touchmove', this.theLeftTopTouchMove)
      theLeftBottom.removeEventListener('touchmove', this.theRightTopTouchMove)
      theRightTop.removeEventListener('touchmove', this.theLeftBottomTouchMove)
      theLeftTop.removeEventListener('touchmove', this.theRightBottomTouchMove)
    } else if (Math.abs((_imageInfo.imageRotateDeg / 90) % 4) === 3) {
      theLeftBottom.removeEventListener('touchmove', this.theLeftTopTouchMove)
      theLeftTop.removeEventListener('touchmove', this.theRightTopTouchMove)
      theRightBottom.removeEventListener('touchmove', this.theLeftBottomTouchMove)
      theRightTop.removeEventListener('touchmove', this.theRightBottomTouchMove)
    }
  }

  destroyCropTouchEvent() {
    this.destroyCropFourHornEvent()

    let theCropperMove = document.querySelector('.cropper-face.cropper-move');

    theCropperMove.removeEventListener('touchmove', this.theCropperMoveTouchMove)
  }

  //计算裁切框中背景图片位置
  calcViewBoxImgXY() {
    let viewBoxImg = document.querySelector('.cropper-view-box>img');
    let X = -(this.cropperCropBoxTranslate3d.X + this.initCropBoxPosition.X),
      Y = -(this.cropperCropBoxTranslate3d.Y + this.initCropBoxPosition.Y);
    viewBoxImg.style.transform = 'translate(' + X + 'px, ' + Y + 'px)'
  }

  sureCropImage() {
    let cropperCropBox = document.querySelector('.cropper-crop-box').getBoundingClientRect(),
      canvasContainerBorderlineValue = document.querySelector('#canvasContainerDiv').getBoundingClientRect(),
      _imageInfo = this.imageList[this.currentIndex];
    let imgWidth = cropperCropBox.width / _imageInfo.canvasScaleProportion / _imageInfo.proportion,
      imgHeight = cropperCropBox.height / _imageInfo.canvasScaleProportion / _imageInfo.proportion,
      cropX = (cropperCropBox.left - canvasContainerBorderlineValue.left) / _imageInfo.canvasScaleProportion / _imageInfo.proportion,
      cropY = (cropperCropBox.top - canvasContainerBorderlineValue.top) / _imageInfo.canvasScaleProportion / _imageInfo.proportion;

    let self = this

    let cropCanvas = document.createElement('Canvas'),
      cropContext = cropCanvas.getContext('2d', {
        alpha: false
      });

    let __img = new Image()
    __img.onload = function () {
      cropCanvas.width = imgWidth
      cropCanvas.height = imgHeight
      cropContext.clearRect(0, 0, imgWidth, imgHeight);

      cropContext.drawImage(this, cropX, cropY, imgWidth, imgHeight, 0, 0, imgWidth, imgHeight)

      cropCanvas.toBlob(function (result) {
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
        self.cropModel = 'freedom'
      }, self.imageType, self.imageDefinition)
    }
    __img.src = this.rotateCanvas()
  }
  cancelCropImage() {
    this.destroyCropTouchEvent()
    this.imageList[this.currentIndex]['imageRotateDeg'] = 0
    this.imageList[this.currentIndex]['canvasScaleProportion'] = 1
    this.cropModel = 'freedom'
    document.querySelector('.cropper-wrap-box').remove()
    document.querySelector('.cropper-drag-box').remove()
    document.querySelector('#canvasContainerDiv').style.transform = 'inherit'
    document.querySelector('#canvasContainerDiv').style.transition = 'inherit'
  }

  //初始化每个图片文件所需要的属性
  initImagePrototype() {
    this.imageList.forEach((I, i) => {
      this.imageList[i]['borderlineValue'] = {}
      this.imageList[i]['operateStack'] = []
      this.imageList[i]['operateStackIndex'] = -1
      this.imageList[i]['imageRotateDeg'] = 0
      this.imageList[i]['canvasScaleProportion'] = 1
    })
  }

  nextImage(callback) {
    if (++this.currentIndex <= this.maxImageIndex) {
      this.loadImage().then(_ => {
        this.drawCanvasPanel()
      })
      callback(this.currentIndex)
    } else {
      this.currentIndex = this.maxImageIndex
      callback(this.currentIndex)
    }!!this.onImageChange && this.onImageChange()
  }

  preImage(callback) {
    if (--this.currentIndex >= 0) {
      this.loadImage().then(_ => {
        this.drawCanvasPanel()
      })
      callback(this.currentIndex)
    } else {
      this.currentIndex = 0
      callback(this.currentIndex)
    }!!this.onImageChange && this.onImageChange()
  }

  nextOperateStack() {
    let imageInfo = this.imageList[this.currentIndex]

    if (++imageInfo.operateStackIndex <= imageInfo.operateStack.length - 1) {
      this.loadImage().then(_ => {
        this.drawCanvasPanel()
      })
    } else {
      imageInfo.operateStackIndex = imageInfo.operateStack.length - 1
    }

    this.imageList[this.currentIndex]['operateStackIndex'] = imageInfo.operateStackIndex;
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
    this.imageList[this.currentIndex]['operateStackIndex'] = imageInfo.operateStackIndex;
    !!this.onImageChange && this.onImageChange()
  }
  initDoodleOptions() {
    this.curTool = 'pencil'
    this.curColor = '#ffffff'
    this.curSize = 'L'
  }
  //开始涂鸦
  beginDoodle() {
    this.initDoodleOptions()
    let self = this,
      _imageInfo = this.imageList[this.currentIndex];

    this.drawCanvas = document.createElement('Canvas');
    this.drawCanvas.style.position = 'absolute'
    this.drawCanvas.width = self.canvas.getBoundingClientRect().width
    this.drawCanvas.height = self.canvas.getBoundingClientRect().height
    this.drawCanvas.style.left = self.canvas.getBoundingClientRect().left + 'px'
    this.drawCanvas.style.top = self.canvas.getBoundingClientRect().top + 'px'
    this.drawCanvas.style.zIndex = '1'


    this.drawContext = this.drawCanvas.getContext('2d')
    let canvasContainerDiv = document.querySelector('#canvasContainerDiv')
    canvasContainerDiv.appendChild(this.drawCanvas)
    this.posList = []
    this.doodleTouchStart = function (e) {
      let pageX = e.touches[0].pageX,
        pageY = e.touches[0].pageY;
      var mouseX = pageX - self.drawCanvas.getBoundingClientRect().left;
      var mouseY = pageY - self.drawCanvas.getBoundingClientRect().top;
      // mouseX = mouseX / _imageInfo.proportion;
      // mouseY = mouseY / _imageInfo.proportion;
      self.posList = []
      self.posList.push({
        mouseX: mouseX,
        mouseY: mouseY
      })
      self.drawLineStart()
      e.preventDefault()
      e.stopPropagation()
    }
    // this.canvas.removeEventListener('touchstart', this.doodleTouchStart)
    this.drawCanvas.addEventListener('touchstart', this.doodleTouchStart, false)

    this.doodleTouchMove = function (e) {
      let pageX = e.touches[0].pageX,
        pageY = e.touches[0].pageY;
      var mouseX = pageX - self.drawCanvas.getBoundingClientRect().left;
      var mouseY = pageY - self.drawCanvas.getBoundingClientRect().top;
      // mouseX = mouseX / _imageInfo.proportion;
      // mouseY = mouseY / _imageInfo.proportion;

      self.posList.push({
        mouseX: mouseX,
        mouseY: mouseY
      })
      if (self.posList.length === 3) {
        self.posList.shift()
      }
      self.drawLine()
      e.preventDefault()
      e.stopPropagation()
    }
    // this.canvas.removeEventListener('touchmove', this.doodleTouchMove)
    this.drawCanvas.addEventListener('touchmove', this.doodleTouchMove, false)
  }

  drawLineStart (){
    let _imageInfo = this.imageList[this.currentIndex];
    if (this.curTool === 'pencil') {
      this.drawContext.globalCompositeOperation = "source-over";
      this.drawContext.strokeStyle = this.curColor;
      this.drawContext.lineJoin = "round";
      if (this.curSize === 'S') {
        this.drawContext.lineWidth = Math.ceil(document.body.clientWidth * 0.01);
      } else if (this.curSize === 'M') {
        this.drawContext.lineWidth = Math.ceil(document.body.clientWidth * 0.03);
      } else if (this.curSize === 'L') {
        this.drawContext.lineWidth = Math.ceil(document.body.clientWidth * 0.04);
      } else if (this.curSize === 'XL') {
        this.drawContext.lineWidth = Math.ceil(document.body.clientWidth * 0.05);
      } else if (this.curSize === 'XXL') {
        this.drawContext.lineWidth = Math.ceil(document.body.clientWidth * 0.06);
      }
    } else {
      this.drawContext.globalCompositeOperation = "destination-out";
      this.drawContext.strokeStyle = '#fff';
      this.drawContext.lineJoin = "round";
      this.drawContext.lineWidth = Math.ceil(document.body.clientWidth * 0.1);
    }

    console.log("this.drawContext.lineWidth::::::", this.drawContext.lineWidth)

    // this.drawContext.beginPath()
    
  }
  drawLine() {
    let _imageInfo = this.imageList[this.currentIndex];
    // this.clearCanvas()
    
    this.drawContext.beginPath()
    this.drawContext.moveTo(this.posList[0]['mouseX'], this.posList[0]['mouseY'])
    if (this.posList.length > 1) {
      this.drawContext.lineTo(this.posList[1]['mouseX'], this.posList[1]['mouseY']);
    }

    this.drawContext.closePath();
    this.drawContext.stroke();
    
    // Draw the outline image
    // this.context.drawImage(_imageInfo.image, 0, 0, _imageInfo.image.width, _imageInfo.image.height);
    
  }
  clearCanvas() {
    let _imageInfo = this.imageList[this.currentIndex];
    this.context.clearRect(0, 0, _imageInfo.image.width, _imageInfo.image.height);
  }
  setDoodleTool(val) {
    this.curTool = val
  }
  setDoodleColor(val) {
    this.curColor = val
  }
  setDoodleSize(val) {
    this.curSize = val
  }
  cancelDoodleImage() {
    this.clearCanvas()
    let _imageInfo = this.imageList[this.currentIndex];
    this.drawCanvas.remove()
    this.context.drawImage(_imageInfo.image, 0, 0, _imageInfo.image.width, _imageInfo.image.height);
    this.canvas.removeEventListener('touchstart', this.doodleTouchStart)
    this.canvas.removeEventListener('touchmove', this.doodleTouchMove)
  }
  sureDoodleImage() {
    let self = this
    let _imageInfo = this.imageList[this.currentIndex];
    this.context.drawImage(this.drawCanvas, 0, 0, _imageInfo.image.width, _imageInfo.image.height);
    this.canvas.toBlob(function (result) {
      self.drawCanvas.remove()
      let doodleImage = result

      self.clearCanvas()
      self.canvas.removeEventListener('touchstart', self.doodleTouchStart)
      self.canvas.removeEventListener('touchmove', self.doodleTouchMove)

      self.pushOperateStack(doodleImage)

      self.loadImage().then(() => {
        self.drawCanvasPanel()
      })
    }, self.imageType, self.imageDefinition)
  }
  beginColorHandle() {
    this.loadImage().then(_ => {
      this.drawCanvasPanel()
      this.operationColorHD()
    })
  }
  operationColorHD() {
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
  cancelColorHandle() {
    this.clearCanvas()
    let _imageInfo = this.imageList[this.currentIndex];
    this.context.drawImage(_imageInfo.image, 0, 0, _imageInfo.image.width, _imageInfo.image.height);
  }
  sureColorHandle() {
    // let colorHandleImage = this.canvas.toDataURL("image/jpeg", 1.0)
    let self = this
    this.canvas.toBlob(function (result) {
      let colorHandleImage = result
      self.clearCanvas()

      self.pushOperateStack(colorHandleImage)

      self.loadImage().then(() => {
        self.drawCanvasPanel()
      })
    }, self.imageType, self.imageDefinition)
  }
  //图片旋转
  rotate() {
    //解绑之前的四个角绑定的事件
    this.destroyCropFourHornEvent()
    //重新计算旋转角度
    let _imageInfo = this.imageList[this.currentIndex]
    _imageInfo.imageRotateDeg -= 90

    //旋转Canvas容器，按比例缩小
    let canvasContainerDiv = document.querySelector('#canvasContainerDiv'),
      canvasContainerDivPos = canvasContainerDiv.getBoundingClientRect()
    
    let containerDivPos = this.container.getBoundingClientRect()
    let canvasScaleProportion = 0;

    if (Math.abs((_imageInfo.imageRotateDeg / 90) % 2) === 1 && (_imageInfo.image.width > containerDivPos.width || _imageInfo.image.height > containerDivPos.height)) {
      let proportionWidth = (containerDivPos.width - 10) / canvasContainerDivPos.height,
      proportionHeight = (containerDivPos.height - 10) / canvasContainerDivPos.width;
      canvasScaleProportion = proportionWidth < proportionHeight ? proportionWidth : proportionHeight
    } else {
      canvasScaleProportion = 1
    }
    _imageInfo.canvasScaleProportion = canvasScaleProportion

    canvasContainerDiv.style.transform = 'scale(' + canvasScaleProportion + ') rotateZ(' + _imageInfo.imageRotateDeg + 'deg)'
    canvasContainerDiv.style.transition = 'transform 0.2s'
    _imageInfo.borderlineValue = canvasContainerDiv.getBoundingClientRect()

    this.imageList[this.currentIndex] = _imageInfo

    let cropperCropBox = document.querySelector('.cropper-wrap-box');

    //如果裁切框scale不为1表示 放大缩小过，所以 再次 变换的时候 就需要还原
    cropperCropBox.style.transform = 'scale(' + canvasScaleProportion + ') rotateZ(' + _imageInfo.imageRotateDeg + 'deg)'
    cropperCropBox.style.transition = 'transform 0.2s'
    
    this.isRotate = true
    this.initCropTouchEvent()
  }

  reverse() {
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
    document.querySelector('.cropper-view-box>img').src = this.canvas.toDataURL("image/jpeg", this.imageDefinition)
  }
  pushOperateStack(base64Object) {
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
    let context = canvas.getContext('2d', {
      alpha: false
    })
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
    return canvas.toDataURL(this.imageType, this.imageDefinition)
  }

  returnImageList() {
    return this.imageList.reduce((acc, cur) => {
      if (cur.operateStackIndex !== -1) {
        acc.push(cur.operateStack[cur.operateStackIndex])
      } else {
        acc.push(cur.origin)
      }
      return acc
    }, [])
  }
}