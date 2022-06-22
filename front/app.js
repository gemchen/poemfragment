// app.js
// var util = require('utils/util.js')

App({
  globalData:{
    sharedKids:false,
    userInfo: null,
    hasUserProfile: false,
    requested:false,
    data:null,
    currentKidId:null,
    defaultKidId:null,
    kidobjs:[],
    name:'',
    kidsChanged:false,
    kidsNameChanged:false,
    cardsToAdd:[],
    sharedCardUpdated:false,
    statusChanged:false
  },
  onLaunch() {
  },
})
