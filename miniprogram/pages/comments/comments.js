// miniprogram/pages/comments/comments.js
var app = getApp()
var imageToAddComments
var allImagesFromPrepage
const db = wx.cloud.database()
const msg = require('../../utils/msg')
Page({

  /**
   * Page initial data
   */
  data: {
    comments: [],
    inputText: '',
    submitAsAnswer: false,
    alreadySubscribed: false
  },

  /**
   * Lifecycle function--Called when page load
   */
  onLoad: async function (options) {
    if (!!app.globalData.groupSettings && !!app.globalData.groupSettings.addCommentPageTitle && !!app.globalData.groupSettings.addCommentPageTitle.length > 0) {
      wx.setNavigationBarTitle({
        title: app.globalData.groupSettings.addCommentPageTitle,
      })
    }

    let i = options.index
    let pages = getCurrentPages()
    let prePage = pages[pages.length - 2]
    imageToAddComments = prePage.data.allGroupImages[i]
    await this.getLatestComments(imageToAddComments.fileId)
    allImagesFromPrepage = prePage.data.allGroupImages
    this.setData({
      posterOpenId: imageToAddComments.openId,
      hidePoster: imageToAddComments.hidePoster,
      userInfo: app.globalData.userInfo,
      correctAnswer: imageToAddComments.correctAnswer
    })
    wx.pageScrollTo({
      selector: '#ip',
      duration: 300
    })
  },
  getLatestComments: async function (fileId) {
    let image = await new Promise((resolve) => {
      db.collection('GroupImages').where({
        fileId: fileId
      }).get({
        success: res => {
          resolve(res.data[0])
        }
      })
    })
    imageToAddComments.comments = image.comments
    imageToAddComments.isCorrectlyAnswered = image.isCorrectlyAnswered
    this.setData({
      comments: imageToAddComments.comments
    })
  },
  textInput: function (e) {
    this.data.inputText = e.detail.value
  },
  sendComment: async function () {
    let commentToSend = this.data.inputText.trim()
    if(!this.data.alreadySubscribed){
      msg.subscribeMessages()
      this.data.alreadySubscribed = !this.data.alreadySubscribed
    }
    if (commentToSend.length == 0) {
      return
    }
    else {
      wx.showLoading({
        title: '发送中',
        mask: true
      })
      let doesNeedMessageSecurityCheck = await app.doesNeedMessageSecurityCheck()
      if (!!doesNeedMessageSecurityCheck) {
        let msgCheckRes = await new Promise((resolve, reject) => {
          wx.cloud.callFunction({
            name: 'msgseccheck',
            data: {
              content: commentToSend
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
          wx.hideLoading()
          return false
        })
        if (!!msgCheckRes && !!msgCheckRes.result && msgCheckRes.result.errCode != undefined) {
          if (msgCheckRes.result.errCode == 87014) {
            wx.showToast({
              title: '评论里有脏东西',
              icon: 'none'
            })
            wx.hideLoading()
            return
          }
        }
      }
    }

    await this.getLatestComments(imageToAddComments.fileId)

    let newComment = {
      poster: this.data.userInfo.nickName,
      avatarUrl: this.data.userInfo.avatarUrl,
      comment: commentToSend,
      openId: app.globalData.openId,
      labelQA: 0,
      date: new Date().getTime()
    }
    let isCorrect = false
    if (!imageToAddComments.isCorrectlyAnswered && !!imageToAddComments.correctAnswer) {
      isCorrect = newComment.comment.toLowerCase().indexOf(imageToAddComments.correctAnswer.toLowerCase()) >= 0;
      newComment.labelQA = isCorrect ? 2 : 3
    }
    // Sends new comment to server
    if (isCorrect) {
      imageToAddComments.isCorrectlyAnswered = true
      db.collection('GroupImages').where({
        fileId: imageToAddComments.fileId
      }).update({
        data: {
          comments: db.command.push(newComment),
          isCorrectlyAnswered: true,
          lastUpdateTime: new Date().getTime()
        },
        fail: console.error
      })
      // Updates user's points.
      app.updateUserPoints(300)
      msg.sendQuestionResolvedAlert(imageToAddComments.comments[0].comment, app.globalData.userInfo.nickName, imageToAddComments.openGId, app.globalData.openId)
    }
    else {
      db.collection('GroupImages').where({
        fileId: imageToAddComments.fileId
      }).update({
        data: {
          comments: db.command.push(newComment),
          lastUpdateTime: new Date().getTime()
        },
        fail: console.error
      })
      // Updates user's points.
      app.updateUserPoints(30)
      msg.sendNewCommentAlert(imageToAddComments.comments[0].comment, newComment.comment, app.globalData.openGId, app.globalData.openId)
    }

    wx.hideLoading()
    // Refreshes current page data
    this.data.comments.push(newComment)
    this.setData({
      comments: this.data.comments,
      inputText: ''
    })
  },
  inputComfirm: function () {
    wx.pageScrollTo({
      selector: '#ip',
      duration: 300
    })
  },
  onUnload: function () {
    // Refreshes index page data
    let pages = getCurrentPages()
    let prePage = pages[pages.length - 2]
    prePage.setData({
      allGroupImages: allImagesFromPrepage
    })
  },

  /**
   * Page event handler function--Called when user drop down
   */
  onPullDownRefresh: async function () {
    await this.getLatestComments(imageToAddComments.fileId)
    wx.stopPullDownRefresh()
  }
})