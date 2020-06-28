
const msg = require('../../utils/msg')
const dbhelper = require('../../utils/dbhelper')
var app = getApp()
Page({

  /**
   * Page initial data
   */
  data: {
    comment: '',
    hidePoster: false,
    requireLikes: false,
    requireLikesNumber: 100,
    showAddAnswerField: false,
    correctAnswer: '',
    requireCorrectAnswer: false,
    imgSize: 0,
    textareaplaceholder: '分享你的思考',
    createNewGroup: false,
    newGroupTempId: 0,
    windowHeight: 0,
    windowWidth: 0,
    screenHeight: 0,
    showGroupSettings: false,
    groupSettings: {},
    blurLevel: 35
  },

  /**
   * Lifecycle function--Called when page load
   */
  onLoad: function (options) {
    if (!!app.globalData.groupSettings && !!app.globalData.groupSettings.uploadImagePageTitle && !!app.globalData.groupSettings.uploadImagePageTitle.length > 0) {
      wx.setNavigationBarTitle({
        title: app.globalData.groupSettings.uploadImagePageTitle,
      })
      if (!!app.globalData.groupSettings.uploadImagePageInputPlaceHolder && !!app.globalData.groupSettings.uploadImagePageInputPlaceHolder.length > 0) {
        this.setData({
          textareaplaceholder: app.globalData.groupSettings.uploadImagePageInputPlaceHolder
        })
      }
    }
    let sysInfo = wx.getSystemInfoSync()
    let settings = {
      homePageTitle: '',
      uploadImagePageTitle: '',
      anniversariesPageTitle: '',
      addAnniversaryPageTitle: '',
      addCommentPageTitle: '',
      rankPageTitle: '',
      profilePageTitle: '',
      userPointsTitle: ''
    }
    this.setData({
      windowHeight: sysInfo.windowHeight,
      screenHeight: sysInfo.screenHeight,
      windowWidth: sysInfo.windowWidth,
      groupSettings: settings
    })
    let path = options.path
    console.log(options.size)
    this.data.imgSize = options.size
    this.setData({
      imgPath: path,
      avatarUrl: app.globalData.userInfo.avatarUrl,
      nickName: app.globalData.userInfo.nickName,
      createNewGroup: !options.createNewGroup ? false : true
    })
    if (!this.data.createNewGroup) {
      wx.hideShareMenu()
    }
    else {
      this.data.newGroupTempId = new Date().getTime()
      wx.showShareMenu({
        withShareTicket: true
      })
    }
  },
  validateInputBeforeUpload: function () {
    let validationPass = true
    console.log('Image Size: ' + this.data.imgSize)
    if (this.data.imgSize > 1024000) {
      wx.showToast({
        title: '图片不能大于1MB因为群主没钱买服务器去存它',
        icon: 'none',
        duration: 2000
      })
      return false
    }
    if (this.data.requireCorrectAnswer && this.data.comment.trim().length == 0) {
      wx.showToast({
        title: '问题内容不能为空',
        icon: 'none',
        duration: 2000
      })
      return false
    }
    if (this.data.showAddAnswerField && this.data.correctAnswer.trim().length == 0) {
      wx.showToast({
        title: '正确答案内容不能为空',
        icon: 'none',
        duration: 2000
      })
      return false
    }
    if (this.data.requireLikes && this.data.requireLikesNumber <= 0) {
      wx.showToast({
        title: '未设置点赞达标数目',
        icon: 'none',
        duration: 2000
      })
      return false
    }
    return validationPass
  },
  beginUpload: function () {
    wx.vibrateShort()
    msg.subscribeMessages()
    if (!this.validateInputBeforeUpload()) {
      return
    }
    if (this.data.imgPath.length > 0) {
      if (app.globalData.openId) {
        let filePath = this.data.imgPath
        let fileName = app.globalData.openId + '-' + new Date().getTime()
        let cloudPath = fileName + filePath.match(/\.[^.]+?$/)[0]
        let imageType = filePath.match(/[^.]+?$/)[0]
        if (this.data.createNewGroup && !!this.data.newGroupTempId) {
          this.uploadImageToServer(cloudPath, filePath, imageType, this.data.newGroupTempId)
          app.updateUserPoints(300)
        }
        else if (app.globalData.openGId) {
          this.uploadImageToServer(cloudPath, filePath, imageType)
          app.updateUserPoints(300)
        }
        else {
          console.error('Upload image failed since there was no group id.')
          wx.showToast({
            title: '获取群ID失败，发送失败',
            icon: 'none',
            duration: 2000
          })
        }
      }
      else {
        console.error('Upload image failed since there was no openid.')
        wx.showToast({
          title: '你还没有登录，发送失败',
          icon: 'none',
          duration: 2000
        })
      }
      // wx.requestSubscribeMessage({
      //   tmplIds: [cst.publishMessageTemplateId, cst.commentsTemplateId],
      //   success: res => {
      //     console.log(res)
      //   },
      //   fail: err => {
      //     console.error(err)
      //   }
      // })
    }
  },
  imageSecurityCheck: async function (fileId, contentType) {
    let doesNeedImageSecurityCheck = await app.doesNeedImageSecurityCheck()
    if (doesNeedImageSecurityCheck) {
      wx.showLoading({
        title: '电波分析中',
        mask: true
      })
      let imgCheckRes = await new Promise((resolve, reject) => {
        wx.cloud.callFunction({
          name: 'imgseccheck',
          data: {
            contentType: 'image/' + contentType,
            fileId: fileId
          },
          success: res => {
            resolve(res)
          },
          fail: err => {
            reject(err)
          },
          complete: () => {
            wx.hideLoading()
          }
        })
      }).catch(err => {
        console.error(err)
        return false
      })
      if (!!imgCheckRes && !!imgCheckRes.result && imgCheckRes.result.errCode != undefined) {
        if (imgCheckRes.result.errCode == 87014) {
          wx.showToast({
            title: '发现脏东西,强制掉头!',
            icon: 'none'
          })
          return false
        }
      }
      else {
        return false
      }
      return true
    }
    return true
  },
  uploadImageToServer: async function (cloudPath, filePath, imageType, newGroupTempId) {
    wx.showLoading({
      title: '上传中',
      mask: true
    })
    wx.cloud.uploadFile({
      cloudPath,
      filePath,
      success: async res => {
        let imgSecCheckRes = await this.imageSecurityCheck(res.fileID, imageType)
        let tempGroupImage = {
          fileId: res.fileID,
          openId: app.globalData.openId,
          openGId: this.data.createNewGroup ? newGroupTempId : app.globalData.openGId,
          likesCount: 0,
          blindsCount: 0,
          nickName: app.globalData.userInfo.nickName,
          avatarUrl: app.globalData.userInfo.avatarUrl,
          referUserOpenId: '',
          comments: [],
          hidePoster: this.data.hidePoster,
          correctAnswer: this.data.correctAnswer.trim(),
          requireCorrectAnswer: this.data.requireCorrectAnswer,
          requireLikesNumber: this.data.requireLikes ? this.data.requireLikesNumber : 0,
          isCorrectlyAnswered: false,
          blurLevel: this.data.blurLevel,
          lastUpdateTime: new Date().getTime(),
          uploadTime: new Date().getTime(),
          imgSecCheckRes: !!imgSecCheckRes
        }
        if (!!newGroupTempId) {
          tempGroupImage.groupSettings = this.data.groupSettings
        }
        let title = '无题'
        if (this.data.comment.trim().length > 0) {
          tempGroupImage.comments = [{
            avatarUrl: app.globalData.userInfo.avatarUrl,
            poster: app.globalData.userInfo.nickName,
            comment: this.data.comment,
            openId: app.globalData.openId,
            labelQA: this.data.correctAnswer.trim().length > 0 ? 1 : 0
          }]
          title = this.data.comment
        }
        dbhelper.addToTable('GroupImages', tempGroupImage)
        if (!newGroupTempId) {
          msg.sendNewPostAlert(app.globalData.userInfo.nickName, app.globalData.openGId, title, app.globalData.openId)
          app.globalData.needRefreshIndexPage = true
          wx.saveFile({
            tempFilePath: this.data.imgPath,
            success: res => {
              tempGroupImage.path = res.savedFilePath
              let pages = getCurrentPages()
              let indexPage = pages[pages.length - 2]
              indexPage.data.allGroupImages.unshift(tempGroupImage)
              indexPage.setData({
                allGroupImages: indexPage.data.allGroupImages
              })
              wx.setStorageSync(tempGroupImage.fileId, tempGroupImage.path)
            },
            fail: err => {
              console.error(err)
            },
            complete: () => {
              wx.navigateBack()
            }
          })
        }
        else {
          wx.showModal({
            title: '发布成功',
            content: '现在请关闭当前窗口，从刚刚转发的群聊对话中再次进入小程序。',
            showCancel: false,
            success: () => {
              wx.redirectTo({
                url: '../closeMiniProgram/closeMiniProgram',
              })
            }
          })
        }
      },
      fail: e => {
        console.error('[上传文件] 失败：', e)
        wx.showToast({
          icon: 'none',
          title: '上传失败',
        })
      },
      complete: () => {
        wx.hideLoading()
      }
    })
  },
  textInput: function (e) {
    this.data.comment = e.detail.value
  },
  tapImg: function (e) {
    wx.previewImage({
      urls: [e.currentTarget.dataset.src],
    })
  },
  hidePoster: function () {
    this.setData({
      hidePoster: !this.data.hidePoster
    })
  },
  switchRequireLikes: function () {
    this.setData({
      requireLikes: !this.data.requireLikes
    })
  },
  updateRequireLikesNumber: function (e) {
    this.data.requireLikesNumber = e.detail.value
  },
  updateBlurLevel: function (e) {
    this.setData({
      blurLevel: e.detail.value
    })
  },
  switchAddCorrectAnswer: function () {
    this.data.correctAnswer = ''
    this.setData({
      showAddAnswerField: !this.data.showAddAnswerField,
      requireCorrectAnswer: !this.data.showAddAnswerField,
      textareaplaceholder: !this.data.showAddAnswerField ? '提出一个问题' : '分享你的思考'
    })
  },
  updateCorrectAnswer: function (e) {
    this.data.correctAnswer = e.detail.value
  },
  switchRequireCorrectAnswer: function () {
    this.data.requireCorrectAnswer = !this.data.requireCorrectAnswer
    this.setData({
      requireCorrectAnswer: this.data.requireCorrectAnswer
    })
  },
  subscribeMessage: function () {
    wx.requestSubscribeMessage({
      tmplIds: ['itIdBUyEmLx1Ojkrm4bnJNnXdmNRPmPghaDI-C2tXe0'],
      success: res => {

      }
    })
  },
  showGroupSettings: function () {
    this.setData({
      showGroupSettings: true
    })
    setTimeout(() => {
      this.setData({
        swiperIndex: 1
      }), 500
    })
  },
  formSubmit: function (e) {
    this.data.groupSettings = e.detail.value
    this.setData({
      swiperIndex: 0
    })
  },
  formReset: function () {
  },
  closeGroupSettingsPage: function () {
    this.setData({
      swiperIndex: 0
    })
    setTimeout(() => {
      this.setData({
        showGroupSettings: false
      })
    }, 1000)
  },
  onShareAppMessage: function () {
    var shareConfig = {
      title: '群里有人黑你耶！',
      path: '/pages/index/index?invitorOpenId=' + app.globalData.openId + '&newGroupTempId=' + this.data.newGroupTempId,
      imageUrl: '../../images/cat.jpg'
    }
    return shareConfig
  },
})