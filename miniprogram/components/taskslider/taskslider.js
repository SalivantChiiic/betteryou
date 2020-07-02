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
      screenWidth = app.globalData.systemInfo.screenWidth * 0.4
      this.data.sliderStepScale = 100 / this.properties.habitGoal
      this.data.stepWidth = screenWidth * this.data.sliderStepScale / 100
      this.data.currentStep = this.properties.currentProgress
      this.updateProgress()
    }
  },
  /**
   * Component methods
   */
  methods: {
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
    },
    onTouchEnd() {
      this.updateProgress()
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
        }
      })
    }
  }
})