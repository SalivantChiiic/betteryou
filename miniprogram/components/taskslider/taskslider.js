const app = getApp()
var dateHelper = require('../../utils/datehelper.js')
var screenWidth
Component({
  /**
   * Component properties
   */
  properties: {
    habit: Object,
    date: Number,
    showEditRow: Boolean
  },

  /**
   * Component initial data
   */
  data: {
    startPoint: 0,
    sliderStepScale: 0,
    stepWidth: 0,
    currentStep: 0,
    lastStep: 0,
    sliderPos: 0,
    isDone: false,
    longTapping: false,
    locale: app.globalData.locale.taskslider,
  },
  lifetimes: {
    attached() {}
  },
  observers: {
    'habit.currentProgress'() {
      this.initializeComponents()
    }
  },
  /**
   * Component methods
   */
  methods: {
    initializeComponents() {
      screenWidth = app.globalData.systemInfo.screenWidth * 1
      this.data.sliderStepScale = 100 / this.properties.habit.goal
      this.data.stepWidth = screenWidth * this.data.sliderStepScale / 100
      this.data.currentStep = this.properties.habit.currentProgress
      this.updateProgress(true)
    },
    onTouchMove(e) {
      this.data.longTapping = false
      let moveDistance = e.touches[e.touches.length - 1].clientX - this.data.startPoint.clientX
      if (moveDistance < 0) {
        moveDistance = 0
        if (this.data.sliderPos == 0) {
          return
        }
      }
      let newSliderPos = moveDistance / screenWidth * 100
      newSliderPos += this.data.sliderStepScale * this.data.lastStep
      // let clickId = '#slider'
      // this.animate(clickId, [{
      //     width: this.data.sliderPos
      //   },
      //   {
      //     width: 100
      //   }
      // ], 100)
      this.data.sliderPos = newSliderPos
      this.setData({
        sliderPos: newSliderPos
      })
      let step = Math.round(moveDistance / this.data.stepWidth)
      step += this.data.lastStep
      if (this.data.currentStep != step && step >= 0 && step <= this.properties.habit.goal) {
        this.setData({
          isDone: step == this.properties.habit.goal,
          currentStep: step
        })
        wx.vibrateShort()
      }
    },
    onTouchStart(e) {
      this.data.startPoint = e.touches[0]
      // Shows edit row after long tapping.
      this.hideEditRow()
      this.data.longTapping = true
      setTimeout(() => {
        if (this.data.longTapping) {
          wx.vibrateShort()
          this.animate('.editrowicon', [{
              top: -100
            },
            {
              top: 0
            }
          ], 200)
          this.setData({
            showEditRow: true
          })
          let eventDetail = {
            habitId: this.properties.habit._id
          }
          this.triggerEvent('showEditRow', eventDetail)
        }
      }, 1000)
      wx.vibrateShort()
    },
    onTouchEnd() {
      this.data.longTapping = false
      this.updateThenSaveProgress()
    },
    updateThenSaveProgress() {
      this.updateProgress()
      this.saveProgressToStorage()
      this.saveProgressToServer()
    },
    performProgressAnimation(initial, currentPosition, newPosition) {
      if (newPosition == 0) {
        return
      }
      if (!!initial) {
        currentPosition = 0
      }
      let clickId = '#slider'
      this.animate(clickId, [{
          width: currentPosition
        },
        {
          width: newPosition
        }
      ], 800)
    },
    updateProgress(initial = false) {
      let endSliderPos = this.data.sliderStepScale * this.data.currentStep
      this.performProgressAnimation(initial, this.data.sliderPos, endSliderPos)
      this.setData({
        sliderPos: endSliderPos,
        isDone: this.data.currentStep >= this.properties.habit.goal,
        currentStep: this.data.currentStep
      })
      this.data.lastStep = this.data.currentStep
    },
    saveProgressToStorage() {
      let habits = wx.getStorageSync('habits')
      for (let i in habits) {
        if (habits[i]._id == this.properties.habit._id) {
          let createNewProgress = true
          for (let j in habits[i].progresses) {
            let prog = habits[i].progresses[j]
            if (prog.date == this.properties.date) {
              prog.progress = this.data.currentStep
              prog.updateTime = Date.now()
              createNewProgress = false
              break
            }
          }
          if (createNewProgress) {
            if (!habits[i].progresses) {
              habits[i].progresses = []
            }
            habits[i].progresses.push({
              date: this.properties.date,
              progress: this.data.currentStep,
              updateTime: Date.now()
            })
          }
          break
        }
      }
      wx.setStorage({
        data: habits,
        key: 'habits',
      })
    },
    saveProgressToServer() {
      let db = wx.cloud.database()
      db.collection('UserHabit').doc(this.properties.habit._id).get({
        success: res => {
          let progresses = res.data.progresses
          let createNewProgress = true
          for (let i in progresses) {
            if (progresses[i].date == this.properties.date) {
              progresses[i].progress = this.data.currentStep
              progresses[i].updateTime = Date.now()
              createNewProgress = false
              break
            }
          }
          if (createNewProgress) {
            db.collection('UserHabit').doc(this.properties.habit._id).update({
              data: {
                progresses: db.command.push({
                  date: this.properties.date,
                  progress: this.data.currentStep,
                  updateTime: Date.now()
                })
              }
            })
          } else {
            db.collection('UserHabit').doc(this.properties.habit._id).update({
              data: {
                progresses: progresses
              }
            })
          }
        },
        fail: err => {
          console.error(err)
        }
      })
    },
    hideEditRow() {
      this.triggerEvent('hideEditRow')
    },
    editHabit() {
      app.globalData.habitToEdit = this.properties.habit
      this.setData({
        showEditRow: false
      })
      wx.navigateTo({
        url: '/pages/addHabit/addHabit'
      })
      this.hideEditRow()
    },
    resetProgress() {
      this.properties.habit.currentProgress = 0
      this.data.currentStep = 0
      this.updateThenSaveProgress()
      this.setData({
        showEditRow: false,
        habit: this.properties.habit
      })
      this.hideEditRow()
    },
    deleteHabit() {
      wx.showModal({
        content: this.data.locale.deleteConfirmContent + this.properties.habit.name + '?',
        confirmText: this.data.locale.confirmTxt,
        cancelText: this.data.locale.cancelTxt,
        confirmColor: this.properties.habit.color,
        cancelColor: this.properties.habit.color,
        success: res => {
          if (res.confirm) {
            let detail = {
              id: this.properties.habit._id
            }
            this.triggerEvent('deleteHabit', detail)
          }
        }
      })
      this.setData({
        showEditRow: false
      })
      this.hideEditRow()
    }
  }
})