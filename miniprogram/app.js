//app.js

const cn = require('./languages/zh-cn.js')
const en = require('./languages/en.js')
App({
  onLaunch: function (options) {
    this.globalData = {}
    // Sets language of this program.
    let res = wx.getSystemInfoSync()
    if (res.language.indexOf('zh') >= 0) {
      this.globalData.displayInEnglish = false
      this.globalData.locale = cn.default
    } else {
      this.globalData.displayInEnglish = true
      this.globalData.locale = en.default
    }

    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力')
    } else {
      wx.cloud.init({
        // env 参数说明：
        //   env 参数决定接下来小程序发起的云开发调用（wx.cloud.xxx）会默认请求到哪个云环境的资源
        //   此处请填入环境 ID, 环境 ID 可打开云控制台查看
        //   如不填则使用默认环境（第一个创建的环境）
        // env: 'my-env-id',
        traceUser: true,
      })
    }
  },
  onShow: function (options) {
    console.log('this.data.scene = ' + options.scene)
    this.globalData.scene = options.scene
    this.globalData.shareTicket = options.shareTicket
    console.log('ShareTicket: ' + options.shareTicket)
    this.globalData.systemInfo = wx.getSystemInfoSync()
  },
  checkIfNeedToShowJoinPage: function () {
    if (!this.globalData.userInfo && !!this.globalData.openId) {
      wx.getSetting({
        success: setting => {
          if (setting.authSetting['scope.userInfo']) {
          }
          else {
            wx.navigateTo({
              url: '../join/join',
            })
          }
        },
        fail: () => {
          wx.navigateTo({
            url: '../join/join',
          })
        }
      })
    }
  },
  saveUserInfoToServer: function (openId, userInfo) {
    if (!openId) {
      console.error('Openid was null when executing saveUserInfoToServer.')
    }
    const db = wx.cloud.database()
    db.collection('UserInfo').doc(openId).get({
      success: () => {
        db.collection('UserInfo').doc(openId).update({
          data: userInfo
        })
      },
      fail: () => {
        userInfo._id = openId
        userInfo.points = 0
        db.collection('UserInfo').add({
          data: userInfo
        })
      }
    })
  },
  updateUserPoints: function (points) {
    if (typeof (points) == 'number' && points != 0) {
      const db = wx.cloud.database()
      db.collection('UserInfo').doc(this.globalData.openId).update({
        data: {
          points: db.command.inc(points)
        }
      })
    }
  },
  getGroupMembers: async function () {
    return new Promise((resolve, reject) => {
      const db = wx.cloud.database()
      db.collection('Groups').doc(this.globalData.openGId).get({
        success: res => {
          resolve(new Promise((resolve, reject) => {
            db.collection('UserInfo').where({
              _id: db.command.in(res.data.members)
            }).orderBy('points', 'desc').get({
              success: members => {
                resolve(members.data)
              },
              fail: reject
            })
          }).catch(() => { }))
        },
        fail: reject
      })
    }).catch(() => { })
  },
  doesNeedImageSecurityCheck: async function () {
    return new Promise((resolve, reject) => {
      const db = wx.cloud.database()
      db.collection('AppSettings').doc('AppSettings').get({
        success: res => {
          resolve(res.data.imgSecCheck)
        },
        fail: err => {
          reject(err)
        }
      })
    }).catch(err => { console.log(err) })
  },
  doesNeedMessageSecurityCheck: async function () {
    return new Promise((resolve, reject) => {
      const db = wx.cloud.database()
      db.collection('AppSettings').doc('AppSettings').get({
        success: res => {
          resolve(res.data.msgSecCheck)
        },
        fail: err => {
          reject(err)
        }
      })
    }).catch(err => { console.log(err) })
  }
})
