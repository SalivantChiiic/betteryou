// 云函数入口文件
const cloud = require('wx-server-sdk')
cloud.init()
const db = cloud.database()

// 云函数入口函数
exports.main = async (e, context) => {
  let res = await db.collection('Groups').doc(e.openGId).get()
  let members = res.data.members
  for (let i in members) {
    if (!!members[i]) {
      if (members[i] != e.openId) {
        try {
          await cloud.openapi.subscribeMessage.send({
            touser: members[i],
            templateId: e.templateId,
            miniprogram_state: 'formal',
            page: 'pages/index/index?opengid=' + e.openGId,
            data: e.data,
          }).catch(err => {
            console.log(err)
          })
        }
        catch (e) {
          console.error(e)
        }
      }
    }
  }
}

