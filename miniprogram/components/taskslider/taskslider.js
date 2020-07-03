const app = getApp()
var screenWidth
Component({
  /**
   * Component properties
   */
  properties: {
    habitId: String,
    imgUrl: String,
    habitName: String,
    habitGoal: Number,
    habitUnit: String,
    color: String,
    goalPeriod: String,
    currentProgress: Number,
    date: Number
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
  },
  lifetimes: {
    attached() {
      this.initializeComponents()
    }
  },
  observers: {
    'currentProgress'() {
      this.initializeComponents()
    }
  },
  /**
   * Component methods
   */
  methods: {
    initializeComponents() {
      screenWidth = app.globalData.systemInfo.screenWidth * 1
      this.data.sliderStepScale = 100 / this.properties.habitGoal
      this.data.stepWidth = screenWidth * this.data.sliderStepScale / 100
      this.data.currentStep = this.properties.currentProgress
      this.updateProgress()
    },
    onTouchMove(e) {
      let moveDistance = e.touches[e.touches.length - 1].clientX - this.data.startPoint.clientX
      if (moveDistance < 0) {
        moveDistance = 0
        if (this.data.sliderPos == 0) {
          return
        }
      }
      let newSliderPos = moveDistance / screenWidth * 100
      newSliderPos += this.data.sliderStepScale * this.data.lastStep
      this.setData({
        sliderPos: newSliderPos
      })
      let step = Math.round(moveDistance / this.data.stepWidth)
      step += this.data.lastStep
      if (this.data.currentStep != step && step >= 0 && step <= this.properties.habitGoal) {
        this.setData({
          isDone: step == this.properties.habitGoal,
          currentStep: step
        })
        wx.vibrateShort()
      }
    },
    onTouchStart(e) {
      this.data.startPoint = e.touches[0]
      wx.vibrateShort()
    },
    onTouchEnd() {
      this.updateProgress()
      this.saveProgressToStorage()
      this.saveProgressToServer()
    },
    updateProgress() {
      let endSliderPos = this.data.sliderStepScale * this.data.currentStep
      this.setData({
        sliderPos: endSliderPos,
        isDone: this.data.currentStep >= this.properties.habitGoal,
        currentStep: this.data.currentStep
      })
      this.data.lastStep = this.data.currentStep
    },
    saveProgressToStorage() {
      let habits = wx.getStorageSync('habits')
      for (let i in habits) {
        if (habits[i]._id == this.properties.habitId) {
          let noProgressInThisDay = true
          for (let j in habits[i].progresses) {
            let prog = habits[i].progresses[j]
            if (prog.date == this.properties.date) {
              prog.progress = this.data.currentStep
              prog.updateTime = Date.now()
              noProgressInThisDay = false
              break
            }
          }
          if (noProgressInThisDay) {
            if(!habits[i].progresses) {
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
      db.collection('UserHabit').doc(this.properties.habitId).get({
        success: res => {
          let progresses = res.data.progresses
          let noProgressInThisDay = true
          for (let i in progresses) {
            if (progresses[i].date == this.properties.date) {
              progresses[i].progress = this.data.currentStep
              progresses[i].updateTime = Date.now()
              noProgressInThisDay = false
              break
            }
          }
          if (noProgressInThisDay) {
            db.collection('UserHabit').doc(this.properties.habitId).update({
              data: {
                progresses: db.command.push({
                  date: this.properties.date,
                  progress: this.data.currentStep,
                  updateTime: Date.now()
                })
              }
            })
          } else {
            db.collection('UserHabit').doc(this.properties.habitId).update({
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
    }
  }
})