// components/buttonlist/buttonlist.js
Component({
  /**
   * 组件的属性列表
   */
  properties: {
    buttonList: Array,
    multiSelect: Boolean,
    highlightColor: String,
    compact: Boolean,
    selectedButtons: Array
  },

  /**
   * 组件的初始数据
   */
  data: {
    buttonStates: []
  },

  lifetimes: {
    attached() {
      this.initializeComponent()
    }
  },
  observers: {
    'selectedButtons'() {
      this.initializeComponent()
    }
  },
  methods: {
    initializeComponent() {
      if (this.properties.multiSelect) {
        for (let i in this.properties.buttonList) {
          if (this.properties.selectedButtons.length == 0 || this.properties.selectedButtons.indexOf(i) >= 0) {
            this.data.buttonStates.push(true)
          } else {
            this.data.buttonStates.push(false)
          }
        }
      } else {
        for (let i in this.properties.buttonList) {
          if (this.properties.selectedButtons.length == 0 && i == 0 || this.properties.selectedButtons[0] == i) {
            this.data.buttonStates.push(true)
          } else {
            this.data.buttonStates.push(false)
          }
        }
      }
      this.setData({
        buttonStates: this.data.buttonStates
      })
    },
    onButtonClicked(e) {
      if (this.properties.multiSelect) {
        for (let i in this.data.buttonStates) {
          if (i == e.currentTarget.dataset.index) {
            this.data.buttonStates[i] = !this.data.buttonStates[i]
            break
          }
        }
      } else {
        for (let i in this.data.buttonStates) {
          if (i == e.currentTarget.dataset.index) {
            this.data.buttonStates[i] = true
          } else {
            this.data.buttonStates[i] = false
          }
        }
      }
      this.setData({
        buttonStates: this.data.buttonStates
      })
      let selectedItems = []
      for (let i in this.data.buttonStates) {
        if (this.data.buttonStates[i]) {
          selectedItems.push(this.properties.buttonList[i].id)
        }
      }
      let eventDetail
      if (this.properties.multiSelect) {
        eventDetail = {
          selectedItems: selectedItems
        }
      } else {
        eventDetail = {
          selectedItem: selectedItems[0]
        }
      }
      var eventOption = {
        composed: true
      }
      this.triggerEvent('buttonListClicked', eventDetail, eventOption)
    }
  }
})