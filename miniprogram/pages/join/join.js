const app = getApp()
Page({

  /**
   * Page initial data
   */
  data: {
  },

  /**
   * Lifecycle function--Called when page load
   */
  onLoad: async function (options) {
    let members = await app.getGroupMembers()
    let friends = []
    for (let i in members) {
      let f = {
        nickName: members[i].nickName,
        avatarUrl: members[i].avatarUrl
      }
      friends.push(f)
    }
    this.setData({
      friendsJoined: friends
    })
  },
  receiveUserInfo: function (e) {
    console.log(e)
    if (e.detail.userInfo) {
      app.globalData.userInfo = e.detail.userInfo
      if (app.globalData.openId) {
        app.saveUserInfoToServer(app.globalData.openId, e.detail.userInfo)
      }
      wx.navigateBack()
    }
  },
})