const cst = {
  newPostTemplateId: 'dlQo6ODy1QSQTfGxAeOqWbJ316l-8Qtm-LUOrxZIdcs',
  commentsTemplateId: 'ucKak6zXsMBpy1uhK2nmce2dNCf43UkDfykOJ7tUHZk',
  questionResolvedTemplateId: 'hHvzLdhwaob6M0RL6BZ1jWbyjEeyLfE3V-G0zBUy0Lw'
}
function sendNewCommentAlert(title, content, openGId, openId) {
  if (!title || !content || !openGId || !openId) {
    return
  }
  sendMessage({
    templateId: cst.commentsTemplateId,
    openGId: openGId,
    openId: openId,
    data: {
      thing1: {
        value: title
      },
      thing5: {
        value: content
      }
    }
  })
}
function sendNewPostAlert(nickName, openGId, title, openId) {
  if (!nickName || !title || !openGId || !openId) {
    return
  }
  let desc = nickName + '上传了新作'
  sendMessage({
    templateId: cst.newPostTemplateId,
    openGId: openGId,
    openId: openId,
    data: {
      thing2: {
        value: desc,
      },
      thing3: {
        value: title
      }
    },
  })
}
function sendQuestionResolvedAlert(question, nickName, openGId, openId) {
  if (!question || !nickName || !openGId || !openId) {
    return
  }
  sendMessage({
    templateId: cst.questionResolvedTemplateId,
    openGId: openGId,
    openId: openId,
    data: {
      thing1: {
        value: question,
      },
      thing4: {
        value: nickName,
      },
      thing3: {
        value: '正确答案已经被找到，前往查看答案'
      }
    },
  })
}
function subscribeMessages() {
  wx.requestSubscribeMessage({
    tmplIds: [cst.newPostTemplateId, cst.commentsTemplateId, cst.questionResolvedTemplateId],
    success: res => {
      console.log(res)
    },
    fail: err => {
      console.error(err)
    }
  })
}
function sendMessage(e) {
  wx.cloud.callFunction({
    name: 'sendmsg',
    data: {
      templateId: e.templateId,
      openGId: e.openGId,
      openId: e.openId,
      data: e.data
    },
    fail: err => {
      console.error('[云函数] [sendmsg] subscribeMessage.send 调用失败：', err)
    }
  })
}

module.exports = {
  sendNewPostAlert: sendNewPostAlert,
  sendQuestionResolvedAlert: sendQuestionResolvedAlert,
  subscribeMessages: subscribeMessages,
  sendNewCommentAlert: sendNewCommentAlert
}
