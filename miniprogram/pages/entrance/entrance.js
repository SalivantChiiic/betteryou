var app = getApp()
Page({

  /**
   * Page initial data
   */
  data: {
    groupsJoined: [],
    testGroup: ''
  },

  /**
   * Lifecycle function--Called when page load
   */
  onLoad: function (options) {
    wx.showShareMenu({
      withShareTicket: true
    })
    const db = wx.cloud.database()
    db.collection('Groups').where({
      members: app.globalData.openId
    }).get({
      success: res => {
        for (let i in res.data) {
          if (res.data[i]._id == 'grouptest') {
            continue
          }
          this.data.groupsJoined.push(res.data[i]._id)
        }
        this.setData({
          groupsJoined: this.data.groupsJoined
        })
        if (this.data.groupsJoined.length == 0) {
          // Only for version review.
          db.collection('AppSettings').doc('AppSettings').get({
            success: res => {
              if (res.data.showTestGroup) {
                db.collection('Groups').doc('grouptest').get({
                  success: () => {
                    this.data.testGroup = 'grouptest'
                    this.setData({
                      testGroup: this.data.testGroup
                    })
                  }
                })
              }
            }
          })
        }
      }
    })
  },
  createNewGroup: function () {
    if ((!app.globalData.userInfo && !!app.globalData.openId)) {
      app.checkIfNeedToShowJoinPage()
      return
    }
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album'],
      success: res => {
        let filePath = res.tempFilePaths[0]
        let fileSize = res.tempFiles[0].size
        wx.navigateTo({
          url: '../uploadImg/uploadImg?path=' + filePath + '&size=' + fileSize + '&createNewGroup=' + 1,
        })
      }
    })
  },
  enterGroup: function (e) {
    if (!!app.globalData.openGId && app.globalData.openGId == e.currentTarget.dataset.opengid) {
      wx.navigateBack()
      return
    }

    app.globalData.openGId = e.currentTarget.dataset.opengid
    if (e.currentTarget.dataset.opengid == 'grouptest') {
      if (!!app.globalData.openId) {
        const db = wx.cloud.database()
        db.collection('Groups').doc('grouptest').update({
          data: {
            members: db.command.addToSet(app.globalData.openId)
          }
        })
      }
    }
    app.globalData.needRefreshIndexPage = true
    wx.switchTab({
      url: '/pages/index/index',
    })
  }
})