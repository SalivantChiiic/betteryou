const dbhelper = require('../../utils/dbhelper')
const app = getApp()
Date.prototype.format = function (format) {
  var o = {
    "M+": this.getMonth() + 1, //month
    "d+": this.getDate(),    //day
    "h+": this.getHours(),   //hour
    "m+": this.getMinutes(), //minute
    "s+": this.getSeconds(), //second
    "q+": Math.floor((this.getMonth() + 3) / 3),  //quarter
    "S": this.getMilliseconds() //millisecond
  }
  if (/(y+)/.test(format)) format = format.replace(RegExp.$1,
    (this.getFullYear() + "").substr(4 - RegExp.$1.length));
  for (var k in o) if (new RegExp("(" + k + ")").test(format))
    format = format.replace(RegExp.$1,
      RegExp.$1.length == 1 ? o[k] :
        ("00" + o[k]).substr(("" + o[k]).length));
  return format;
}

Page({

  /**
   * Page initial data
   */
  data: {
    title: '',
    content: '',
    date: '',
    imagePath: ''
  },

  /**
   * Lifecycle function--Called when page load
   */
  onLoad: function () {
    if (!!app.globalData.groupSettings && !!app.globalData.groupSettings.addAnniversaryPageTitle && !!app.globalData.groupSettings.addAnniversaryPageTitle.length > 0) {
      wx.setNavigationBarTitle({
        title: app.globalData.groupSettings.addAnniversaryPageTitle,
      })
    }

    let date = new Date()
    this.setData({
      avatarUrl: app.globalData.userInfo.avatarUrl,
      nickName: app.globalData.userInfo.nickName,
      startDate: date.format('yyyy-MM-dd')
    })
  },
  titleInput: function (e) {
    this.data.title = e.detail.value
    this.setData({
      imgTitle: e.detail.value
    })
  },
  contentInput: function (e) {
    this.data.content = e.detail.value
  },
  bindDateChange: function (e) {
    this.setData({
      date: e.detail.value
    })
  },
  chooseImage: function (e) {
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album'],
      success: res => {
        this.setData({
          imagePath: res.tempFilePaths[0]
        })
      }
    })
  },
  beginUpload: function (e) {
    wx.vibrateShort()
    if (this.data.title.trim().length == 0 || this.data.date.length == 0) {
      wx.showToast({
        icon: 'none',
        title: '标题和日期不能为空',
      })
      return
    }
    if (app.globalData.openId && app.globalData.openGId) {
      let anniversary = {
        openGId: app.globalData.openGId,
        title: this.data.title,
        content: this.data.content.trim(),
        date: this.data.date,
        referUserOpenIds: [],
        creator: {
          nickName: app.globalData.userInfo.nickNamTe,
          avatarUrl: app.globalData.userInfo.avatarUrl
        },
        uploadTime: new Date().getTime()
      }
      if (!this.data.imagePath || this.data.imagePath.length == 0) {
        dbhelper.addToTable('GroupDates', anniversary)
        this.refreshAnniversariesPage()
        wx.navigateBack()
      }
      else {
        this.uploadImageToServer(anniversary)
      }
    }
    else {
      wx.showToast({
        icon: 'none',
        title: '没有OpenGId',
      })
    }
  },
  uploadImageToServer: function (anniversary) {
    wx.showLoading({
      title: '上传中',
      mask: true
    })
    var filePath = this.data.imagePath
    var fileName = app.globalData.openId + '-' + new Date().getTime()
    var cloudPath = fileName + filePath.match(/\.[^.]+?$/)[0]
    wx.cloud.uploadFile({
      cloudPath,
      filePath,
      success: res => {
        anniversary.imageFileId = res.fileID
        dbhelper.addToTable('GroupDates', anniversary)
        wx.saveFile({
          tempFilePath: this.data.imagePath,
          success: res => {
            anniversary.imageUrl = res.savedFilePath
            wx.setStorageSync(anniversary.imageFileId, anniversary.imageUrl)
          },
          fail: err => {
            console.error(err)
            wx.setStorageSync(anniversary.imageFileId, this.data.imagePath)
          },
          complete: () => {
            wx.navigateBack()
          }
        })
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
    app.updateUserPoints(100)
    this.refreshAnniversariesPage()
  },
  refreshAnniversariesPage: function () {
    let pages = getCurrentPages()
    let previousPage = pages[pages.length - 2]
    previousPage.data.refreshPage = true;
  },
  onshow: function () {

  }
})