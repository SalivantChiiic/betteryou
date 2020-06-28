// miniprogram/pages/index/index.js
var app = getApp()

Page({

  /**
   * Page initial data
   */
  data: {
    allGroupImages: [],
    lastTapTime: 0,
    invitorOpenId: '',
    newGroupTempId: 0,
    localLikesCount: {},
    localBlindsCount: {},
    defaultNaviBarTitle: '',
    imgSecCheck: true,
    showCensoredImg: false
  },
  onLoad: async function (options) {
    await this.manageLocalStorage(false)
    wx.showShareMenu({
      withShareTicket: true
    })
    let launchOptions = wx.getLaunchOptionsSync().query
    console.log(launchOptions)
    this.data.invitorOpenId = !launchOptions.invitorOpenId ? '' : launchOptions.invitorOpenId
    this.data.newGroupTempId = !launchOptions.newGroupTempId ? 0 : Number(launchOptions.newGroupTempId)
    if (!app.globalData.openId) {
      await this.manageLocalStorage(true)
      await this.login()
    }
    if (!!app.globalData.shareTicket) {
      let openGId = await this.getGroupId(app.globalData.shareTicket)
      console.log('OpenGID: ' + openGId)
      app.globalData.openGId = openGId
      app.globalData.shareTicket = ''
      await this.joinOrCreateNewGroup()
      await this.updateImageGroupId()
      this.getImagesByGroupId(openGId)
    }
    else if (!!launchOptions.openGId) {
      let openGId = options.openGId
      console.log('OpenGID: ' + openGId)
      app.globalData.openGId = openGId
      await this.joinOrCreateNewGroup()
      await this.updateImageGroupId()
      this.getImagesByGroupId(openGId)
    }
    let doesNeedImgSecCheck = await app.doesNeedImageSecurityCheck()
    this.setData({
      imgSecCheck: doesNeedImgSecCheck
    })

    this.checkIfNeedToShowEntrancePage()
  },
  onShow: async function () {
    this.checkIfNeedToShowEntrancePage()

    if (typeof this.getTabBar === 'function' &&
      this.getTabBar()) {
      this.getTabBar().setData({
        selected: 0
      })
    }
    if (app.globalData.needRefreshIndexPage || (this.data.allGroupImages.length == 0 && !!app.globalData.openGId)) {
      this.getGroupSettings(app.globalData.openGId)
      this.getImagesByGroupId(app.globalData.openGId)
      wx.pageScrollTo({
        scrollTop: 0,
        duration: 300
      })
      app.globalData.needRefreshIndexPage = false
    }
  },
  updateImageGroupId: async function () {
    if (!!this.data.newGroupTempId) {
      const db = wx.cloud.database()
      await new Promise((resolve, reject) => {
        db.collection('GroupImages').where({
          openGId: this.data.newGroupTempId
        }).update({
          data: {
            openGId: app.globalData.openGId
          },
          success: () => {
            resolve()
          },
          fail: err => {
            reject(err)
          }
        })
      }).catch(err => {
        console.error(err)
      })
    }
  },
  getGroupId: async function (shareTicket) {
    if (!shareTicket) {
      console.error('Called getGroupId without a share ticket.')
      return
    }
    let cloudId = await new Promise((resolve, reject) => {
      wx.getShareInfo({
        shareTicket: shareTicket,
        success: res => {
          resolve(res.cloudID)
        },
        fail: err => {
          reject(err)
        }
      })
    }).catch(err => {
      console.error(err)
    })
    let getOpenGIdResult = await new Promise((resolve, reject) => {
      wx.cloud.callFunction({
        name: 'getopengid',
        data: {
          openGIdData: wx.cloud.CloudID(cloudId)
        },
        success: res => {
          resolve(res)
        },
        fail: err => {
          reject(err)
        }
      })
    }).catch(err => {
      console.error(err)
      wx.showToast({
        title: 'Call cloud function getopengid failed.',
        icon: 'none'
      })
    })
    return getOpenGIdResult.result.openGId
  },
  clearSavedFileAndStorage: async function () {
    wx.clearStorageSync()
    console.log('Local storage cleared.')
    let list = await new Promise((resolve, reject) => {
      wx.getSavedFileList({
        success: res => {
          resolve(res)
        },
        fail: err => {
          reject(err)
        }
      })
    }).catch(
      err => {
        console.error(err)
      }
    )
    for (let i in list.fileList) {
      let removeResult = await new Promise((resolve, reject) => {
        wx.removeSavedFile({
          filePath: list.fileList[i].filePath,
          success: res => {
            resolve(res)
          },
          fail: err => {
            reject(err)
          }
        })
      }).catch(err => { console.error(err) })
      console.log(removeResult)
    }
  },
  manageLocalStorage: async function (clearAnyway) {
    let lastClearCacheTime = wx.getStorageSync('lastClearCacheTime')
    let now = new Date().getTime()
    if (clearAnyway) {
      lastClearCacheTime = 1
    }
    if (!lastClearCacheTime) {
      wx.setStorageSync('lastClearCacheTime', now)
    }
    else if (!!lastClearCacheTime && now - lastClearCacheTime > 3600000) {
      console.warn('Starting clear local storage...')
      await this.clearSavedFileAndStorage()
      wx.setStorage({
        data: now,
        key: 'lastClearCacheTime',
      })
    }
    else {
      // Nothing to do.
    }
  },
  login: async function () {
    wx.showLoading({
      title: '正在登录',
      mask: true
    })
    let callLoginFunction = await new Promise((resolve, reject) => {
      wx.cloud.callFunction({
        name: 'login',
        data: {},
        success: res => {
          resolve(res)
        },
        fail: () => {
          reject()
        },
        complete: () => {
          wx.hideLoading()
        }
      })
    }).catch(() => {
      wx.navigateTo({
        url: '../error/loginfailed',
      })
    })
    app.globalData.openId = callLoginFunction.result.openid
    wx.getSetting({
      success: setting => {
        if (setting.authSetting['scope.userInfo']) {
          // 已经授权，可以直接调用 getUserInfo 获取头像昵称，不会弹框
          wx.getUserInfo({
            success: ui => {
              app.globalData.userInfo = ui.userInfo
              app.saveUserInfoToServer(app.globalData.openId, ui.userInfo)
            },
            fail: err => {
              console.error(err)
            }
          })
        }
      }
    })
  },
  joinOrCreateNewGroup: async function () {
    if (!!app.globalData.openId && !!app.globalData.openGId) {
      const db = wx.cloud.database()
      let members = [app.globalData.openId]
      if (app.globalData.openId != this.data.invitorOpenId) {
        members.unshift(this.data.invitorOpenId)
      }
      let existedGroup = await new Promise((resolve, reject) => {
        db.collection('Groups').doc(app.globalData.openGId).get({
          success: res => {
            resolve(res.data)
          },
          fail: () => {
            reject()
          }
        })
      }).catch(() => { })
      if (!existedGroup) {
        let res = await new Promise((resolve, reject) => {
          db.collection('GroupImages').where({
            openGId: this.data.newGroupTempId
          }).get({
            success: resolve,
            fail: reject
          })
        }).catch(() => { })

        let settings = !!res && !!res.data[0] ? res.data[0].groupSettings : null
        if (!settings) {
          settings = {
            homePageTitle: '',
            uploadImagePageTitle: '',
            anniversariesPageTitle: '',
            addAnniversaryPageTitle: '',
            addCommentPageTitle: '',
            rankPageTitle: '',
            profilePageTitle: '',
            userPointsTitle: ''
          }
        }
        app.globalData.groupSettings = settings
        await new Promise((resolve, reject) => {
          db.collection('Groups').add({
            data: {
              _id: app.globalData.openGId,
              members: members,
              settings: settings,
            },
            success: () => {
              resolve()
            },
            fail: err => {
              reject(err)
            }
          })
        }).catch(err => {
          console.error('Create new group failed.')
          console.error(err)
        })
      }
      else {
        await new Promise((resolve, reject) => {
          db.collection('Groups').doc(app.globalData.openGId).update({
            data: {
              members: db.command.addToSet(app.globalData.openId)
            },
            success: res => {
              resolve(res)
            },
            fail: err => {
              reject(err)
            }
          })
        }).catch(err => {
          console.error(err)
        })
      }

      this.getGroupSettings(app.globalData.openGId)
    }
  },
  getGroupSettings: function (openGId) {
    const db = wx.cloud.database()
    db.collection('Groups').doc(openGId).get({
      success: res => {
        app.globalData.groupSettings = res.data.settings
        if (!!app.globalData.groupSettings && !!app.globalData.groupSettings.homePageTitle && !!app.globalData.groupSettings.homePageTitle.length > 0) {
          wx.setNavigationBarTitle({
            title: app.globalData.groupSettings.homePageTitle,
          })
        }
        else {
          wx.setNavigationBarTitle({
            title: this.data.defaultNaviBarTitle
          })
        }
        if(!!res.data.showCensoredImg){
          this.setData({
            showCensoredImg: true
          })
        }
        else{
          this.setData({
            showCensoredImg: false
          })
        }
      }
    })
  },
  getImagesByGroupId: function (openGId) {
    if (!openGId) {
      wx.navigateTo({
        url: '../entrance/entrance',
      })
      return
    }
    wx.showLoading({
      title: '数据拉取中',
      mask: true
    })
    const db = wx.cloud.database()
    db.collection('GroupImages').where({
      openGId: openGId
    }).orderBy('lastUpdateTime', 'desc').get({
      success: res => {
        this.data.allGroupImages = res.data
        for (let i in this.data.allGroupImages) {
          let groupImage = this.data.allGroupImages[i]
          let storedGroupImagePath = wx.getStorageSync(res.data[i].fileId)
          if (storedGroupImagePath) {
            groupImage.path = storedGroupImagePath
          }
          else {
            this.downloadImage(groupImage, i)
          }
        }

        this.setData({
          allGroupImages: this.data.allGroupImages
        })
      },
      fail: console.error,
      complete: () => {
        wx.stopPullDownRefresh()
        wx.hideLoading()
      }
    })
  },
  downloadImage: function (groupImage, index) {
    wx.cloud.downloadFile({
      fileID: groupImage.fileId,
      success: downloadImgRes => {
        groupImage.path = downloadImgRes.tempFilePath
        wx.saveFile({
          tempFilePath: groupImage.path,
          success: res => {
            groupImage.path = res.savedFilePath
            wx.setStorageSync(groupImage.fileId, groupImage.path)
          },
          fail: err => {
            console.error(err)
            wx.setStorageSync(groupImage.fileId, downloadImgRes.tempFilePath)
          },
          complete: () => {
            let gi = 'allGroupImages[' + index + ']'
            this.setData({
              [gi]: groupImage
            })
          }
        })
      },
      fail: console.error
    })
  },
  onShareAppMessage: function (options) {
    let index = options.target.dataset.index
    let imageToShare = this.data.allGroupImages[index]
    this.data.allGroupImages.splice(index, 1)
    this.data.allGroupImages.unshift(imageToShare)
    this.setData({
      allGroupImages: this.data.allGroupImages
    })
    var shareConfig = {
      title: '看，群里有人黑你',
      path: '/pages/index/index',
      success: res => {
        console.log(res)
      },
      fail: err => {
        console.error(err)
      }
    }
    wx.pageScrollTo({
      scrollTop: 0,
      duration: 300
    })
    return shareConfig
  },
  isDoubleClick: function (e) {
    var curTime = e.timeStamp
    var lastTapTime = this.data.lastTapTime
    var isDoubleClick = false
    if (curTime - lastTapTime > 0) {
      if (curTime - lastTapTime < 500) {
        isDoubleClick = true
      }
      else {
        this.data.lastTapTime = curTime
      }
    }
    return isDoubleClick
  },
  sendDoubleTapLike(e) {
    let isDoubleClick = this.isDoubleClick(e)
    if (!isDoubleClick) {
      return
    }
    let i = e.currentTarget.dataset.index
    let imgLikeCount = 'allGroupImages[' + i + '].likesCount'
    this.data.allGroupImages[i].likesCount++
    this.setData({
      [imgLikeCount]: this.data.allGroupImages[i].likesCount
    })
    if (!this.data.localLikesCount[i]) {
      this.data.localLikesCount[i] = 0
    }
    this.data.localLikesCount[i]++
    let clickId = '#doubletaplike' + i
    this.animate(clickId, [
      { opacity: 0, scale: [0] },
      { opacity: 1, scale: [2] },
      { opacity: 1, scale: [1.8] },
      { opacity: 1, scale: [2] },
      { opacity: 0.8, scale: [0] }
    ], 500, function () {
      this.clearAnimation(clickId)
    }.bind(this))
    this.saveLikeOrBlindCountToServer(this.data.allGroupImages[i].fileId, i)
  },
  sendLike: function (e) {
    wx.vibrateShort()
    let i = e.currentTarget.dataset.index
    let clickId = '#like' + i
    this.performIconClickAnimation(clickId)
    this.data.allGroupImages[i].likesCount++
    let imgLikeCount = 'allGroupImages[' + i + '].likesCount'
    this.setData({
      [imgLikeCount]: this.data.allGroupImages[i].likesCount
    })
    if (!this.data.localLikesCount[i]) {
      this.data.localLikesCount[i] = 0
    }
    this.data.localLikesCount[i]++
    this.saveLikeOrBlindCountToServer(this.data.allGroupImages[i].fileId, i)
  },
  sendBlind: function (e) {
    wx.vibrateShort()
    let i = e.currentTarget.dataset.index
    let clickId = '#blind' + i
    this.performIconClickAnimation(clickId)
    this.data.allGroupImages[i].blindsCount++
    let imgBlindCount = 'allGroupImages[' + i + '].blindsCount'
    this.setData({
      [imgBlindCount]: this.data.allGroupImages[i].blindsCount
    })

    if (!this.data.localBlindsCount[i]) {
      this.data.localBlindsCount[i] = 0
    }
    this.data.localBlindsCount[i]++
    this.saveLikeOrBlindCountToServer(this.data.allGroupImages[i].fileId, i)
  },
  performIconClickAnimation: function (iconId) {
    this.animate(iconId, [
      { scale: [1] },
      { scale: [1.3] },
      { scale: [1] }
    ], 200, function () {
    }.bind(this))
  },
  saveLikeOrBlindCountToServer: function (fileId, index) {
    let delayTime = 5000
    // Following logic would only be triggered once for every 5 seconds.
    if (Date.now() - this.data.lastActionTime > delayTime || this.data.lastLikeOrBlindFileId != fileId) {
      this.data.lastLikeOrBlindFileId = fileId
      this.data.lastActionTime = Date.now()
      setTimeout(this.updateImageLikesCount, delayTime, fileId, index)
    }
  },
  updateImageLikesCount: function (fileId, index) {
    const db = wx.cloud.database()
    if (typeof (this.data.localLikesCount[index]) != 'number') {
      this.data.localLikesCount[index] = 0
    }
    else {
      app.updateUserPoints(this.data.localLikesCount[index])
    }
    if (typeof (this.data.localBlindsCount[index]) != 'number') {
      this.data.localBlindsCount[index] = 0
    }
    db.collection('GroupImages').where({
      fileId: fileId
    }).update({
      data: {
        likesCount: db.command.inc(this.data.localLikesCount[index]),
        blindsCount: db.command.inc(this.data.localBlindsCount[index])
      },
      success: () => {
      },
      fail: err => {
        console.error('Failed to saveLikeCountToServer：', err)
      },
      complete: () => {
        this.data.localLikesCount[index] = 0
        this.data.localBlindsCount[index] = 0
        db.collection('GroupImages').where({
          fileId: fileId
        }).get({
          success: res => {
            let imgLikeCount = 'allGroupImages[' + index + '].likesCount'
            let imgBlindCount = 'allGroupImages[' + index + '].blindsCount'
            this.setData({
              [imgLikeCount]: res.data[0].likesCount,
              [imgBlindCount]: res.data[0].blindsCount
            })
          }
        })
      }
    })
  },
  addComments: function (e) {
    if ((!app.globalData.userInfo && !!app.globalData.openId)) {
      app.checkIfNeedToShowJoinPage()
      return
    }
    let i = e.currentTarget.dataset.index
    wx.navigateTo({
      url: '../comments/comments?index=' + i,
    })
  },
  goUploadImage: function () {
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album'],
      success: res => {
        let filePath = res.tempFilePaths[0]
        let fileSize = res.tempFiles[0].size
        wx.navigateTo({
          url: '../uploadImg/uploadImg?path=' + filePath + '&size=' + fileSize,
        })
      }
    })
  },
  checkIfNeedToShowEntrancePage: function () {
    if (!app.globalData.openGId && !!app.globalData.openId) {
      wx.navigateTo({
        url: '../entrance/entrance',
      })
      return
    }
  },
  onPullDownRefresh: function () {
    this.getGroupSettings(app.globalData.openGId)
    this.getImagesByGroupId(app.globalData.openGId)
  },

  /**
   * Called when page reach bottom
   */
  onReachBottom: function () {

  }
})