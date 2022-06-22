var app = getApp()
var util = require('../../utils/util.js')

Page({
  data: {
    openid:'',
    kids: [],
    kidIndex: 0,
    avatarWord: '',
    view: 'myCardsView',
    myCards: [],
    scheduleCards: [],
    status: ['零', '壹', '贰', '叁', '肆', '伍', '陆', '柒', '捌'],
    statusColors: ['gray', 'grey', 'blue', 'green', 'olive', 'yellow', 'orange', 'red', 'purple'],
    selectedArray: [],
    scrollItem:null,
    scrollItem1:null,
    reviewInterval: [86460000, 86460000, 172860000, 259260000, 691260000, 1296060000, 2592060000],
    page: 0,
    page1:0,
    moreCardsLoaded: true,
    scrollBottom: false,
    scrollBottom1:false,
    topButton:false,
    cardUpdated:false,
    comment:false,
    commentValue:'',
    cardIndex :'',
    top:60,
    paddingBottom:25,
  },
  scroll(e){
    this.data.view ? this.setData({
      scrollItem:'',
    }) : this.setData({
      scrollItem1:''
    })
    if(e.detail.scrollTop < 600){
      this.setData({
        topButton:false
      })
    }
    else{
      this.setData({
        topButton:true
      })
    }
  },
  toTop() {
    this.data.view ? this.setData({
      scrollItem: 'item1'
    }) : this.setData({
      scrollItem1: 'item1'
    })
  },
  replyComment(e){
    this.data.cardIndex = e.currentTarget.dataset.parent
    this.data.selectedArray[this.data.cardIndex] = 1
    this.setData({
      commentValue:this.data.view ? '@'+ this.data.myCards[e.currentTarget.dataset.parent].comments[e.currentTarget.dataset.comment].name + ' ' : '@'+ this.data.scheduleCards[e.currentTarget.dataset.parent].comments[e.currentTarget.dataset.comment].name + ' ',
      selectedArray: this.data.selectedArray,
      selectedIdx: this.data.cardIndex,
      comment:true
    })
  },
  comment(e){
    this.data.cardIndex = e.currentTarget.dataset.index
    this.data.selectedArray[this.data.cardIndex] = 1
    this.setData({
      selectedArray: this.data.selectedArray,
      selectedIdx: this.data.cardIndex,
      comment:true
    })
  },
  closeCommentBox(){
    this.setData({
      selectedArray: this.data.view ? Array(this.data.myCards.length) : Array(this.data.scheduleCards.length),
      comment:false,
      cardIndex:'',
      scrollItem:'',
      scrollItem1:'',
      commentValue:''
    })
  },
  commentFocus(e){
    this.setData({
      paddingBottom:500,
      keyboardHeight:e.detail.height,
      scrollHeight:this.data.windowHeight-110-e.detail.height
    },()=>{
      this.data.view ? this.setData({
        scrollItem: 'item' + (this.data.cardIndex+1),
      }) : this.setData({
        scrollItem1: 'item' + (this.data.cardIndex+1),
      })
    })
  },
  commentBlur(){
    this.setData({
      paddingBottom:25,
      keyboardHeight:60,
      scrollHeight:this.data.view ? this.data.windowHeight-110 : this.data.windowHeight-160
    })
  },
  submitContent(){
    if(this.data.commentValue){
      var array = []
      this.data.view ? array = this.data.myCards[this.data.cardIndex].comments : array = this.data.scheduleCards[this.data.cardIndex].comments
      array.push({
        openid:app.globalData.data.openid,
        name:app.globalData.name,
        content:this.data.commentValue
      })
      var url = "https://ywsp.yuyihub.com/updatecard"
      wx.request({
        url: url,
        method: "PUT",
        data: {
          cardid: this.data.view ? this.data.myCards[this.data.cardIndex].cardId : this.data.scheduleCards[this.data.cardIndex].cardId,
          comments:array
        },
        success: res => {
          console.log(res.data)
          if(this.data.view){
            this.data.myCards[this.data.cardIndex].comments = array
            this.setData({
              myCards:this.data.myCards
            })
          }
          else{
            this.data.scheduleCards[this.data.cardIndex].comments = array
            this.setData({
              cardUpdated:true,
              scheduleCards:this.data.scheduleCards
            })
          }
          this.closeCommentBox()
        },
        fail: res => {
          util.alert(res)
        },
        timeout: res => {
          util.alert(res)
        }
      })
    }
  },
  setValue(e){
    this.data.commentValue = e.detail.value
  },
  pushCards(data,cb) {
    var array = []
    if(data.cardobjs){
      for (var j = 0; j < data.cardobjs.length; j++) {
        if (data.cardobjs[j].cardobj.title) {
          array.push({
            addTime: util.formatTime(new Date(data.cardobjs[j].addtime)),
            title: data.cardobjs[j].cardobj.title,
            author: data.cardobjs[j].cardobj.author,
            paragraphs: data.cardobjs[j].cardobj.paragraphs,
            tags: data.cardobjs[j].cardobj.tags,
            cardId: data.cardobjs[j].cardid,
            updaterAvatar: data.cardobjs[j].updaterAvatar ? data.cardobjs[j].updaterAvatar : 'default',
            updaterName: data.cardobjs[j].updaterName ? data.cardobjs[j].updaterName : '',
            updateTime: data.cardobjs[j].status == 0 ? util.getDateDiff(new Date(data.cardobjs[j].addtime)) : util.getDateDiff(new Date(data.cardobjs[j].updatetime)),
            updateTimeStamp:data.cardobjs[j].status == 0 ? data.cardobjs[j].addtime : data.cardobjs[j].updatetime,
            status: data.cardobjs[j].status,
            checked:false,
            reviewTime:data.cardobjs[j].reviewtime ? data.cardobjs[j].reviewtime : null,
            comments:data.cardobjs[j].comments ? data.cardobjs[j].comments : []
          })
        }
        else {
          array.push({
            addTime: util.formatTime(new Date(data.cardobjs[j].addtime)),
            name: data.cardobjs[j].cardobj.name,
            desc: data.cardobjs[j].cardobj.desc,
            cardId: data.cardobjs[j].cardid,
            updaterAvatar: data.cardobjs[j].updaterAvatar ? data.cardobjs[j].updaterAvatar : 'default',
            updaterName: data.cardobjs[j].updaterName ? data.cardobjs[j].updaterName : '',
            updateTime: data.cardobjs[j].status == 0 ? util.getDateDiff(new Date(data.cardobjs[j].addtime)) : util.getDateDiff(new Date(data.cardobjs[j].updatetime)),
            updateTimeStamp:data.cardobjs[j].status == 0 ? data.cardobjs[j].addtime : data.cardobjs[j].updatetime,
            status: data.cardobjs[j].status,
            checked:false,
            reviewTime:data.cardobjs[j].reviewtime ? data.cardobjs[j].reviewtime : null,
            comments:data.cardobjs[j].comments ? data.cardobjs[j].comments : []
          })
        }
      }
    }
    else{
      console.log(data)
    }
    if(this.data.view){
      this.data.myCards.length > 0 ? this.data.myCards = [...this.data.myCards,...array] : this.data.myCards = array
      this.setData({
        myCards:this.data.myCards,
        selectedArray:Array(this.data.myCards.length)
      },()=>{
        if(cb){
          cb
        }
        this.checkUpdateTime()
      })
    }
    else{
      this.data.scheduleCards.length > 0 ? this.data.scheduleCards = [...this.data.scheduleCards,...array] : this.data.scheduleCards = array
      this.setData({
        scheduleCards: this.data.scheduleCards,
        selectArray:Array(this.data.scheduleCards.length)
      },()=>{
        if(cb){
          cb
        }
        this.checkUpdateTime()
      })
    }
  },

  getMoreCards() {
    if ((this.data.view && this.data.moreCardsLoaded && !this.data.scrollBottom) || (!this.data.view && this.data.moreCardsLoaded && !this.data.scrollBottom1)) {
      this.setData({
        moreCardsLoaded:false
      })
      wx.request({
        url: this.data.view ? "https://ywsp.yuyihub.com/getkid/" : "https://ywsp.yuyihub.com/getkidactive/",
        data: {
          kidid: app.globalData.currentKidId,
          page: this.data.view ? this.data.page + 1 : this.data.page1 + 1
        },
        success: res => {
          console.log(res.data)
          if(res.data.code == 404){
            wx.navigateTo({ 
              url: '/pages/notice/notice?statusChanged=' + 'true'
            })        
          }
          else{
            if (!res.data.code) {
              this.pushCards(res.data,
                this.data.view ? this.setData({
                  page: this.data.page + 1,
                  scrollBottom: res.data.cardobjs.length < 8 ? true : false,
                  moreCardsLoaded:true
                }) : this.setData({
                  page1: this.data.page1 + 1,
                  scrollBottom1: res.data.cardobjs.length < 8 ? true : false,
                  moreCardsLoaded:true
                })
              )
            }
            if (res.data.code == 404003) {
              this.data.view ? this.setData({
                moreCardsLoaded:true,
                scrollBottom: true
              }) : this.setData({
                moreCardsLoaded:true,
                scrollBottom1: true
              })
            }
          }
        },
        fail: res => {
          util.alert(res)
          this.setData({
            moreCardsLoaded:true
          })
        },
        timeout: res => {
          util.alert(res)
          this.setData({
            moreCardsLoaded:true
          })

        },
      })
    }
  },
  cardUpdation(cb) {
    var url = "https://ywsp.yuyihub.com/updatecard"
    wx.request({
      url: url,
      method: "PUT",
      data: {
        cardid: this.data.view ? this.data.myCards[this.data.sonIndex].cardId : this.data.scheduleCards[this.data.sonIndex].cardId,
        status: this.data.view ? this.data.myCards[this.data.sonIndex].status + 1 : this.data.scheduleCards[this.data.sonIndex].status + 1,
        updater: app.globalData.data.openid,
        updaterAvatar: app.globalData.hasUserProfile ? app.globalData.userInfo.avatarUrl : '',
        updaterName: app.globalData.name,
        updatetime: new Date().getTime(),
        reviewtime: this.data.view ? new Date().getTime() + this.data.reviewInterval[this.data.myCards[this.data.sonIndex].status] : new Date().getTime() + this.data.reviewInterval[this.data.scheduleCards[this.data.sonIndex].status]
      },
      success: res => {
        console.log(res.data)
        if(res.data.code == 200){
          this.data.view ? this.data.myCards[this.data.sonIndex].reviewTime = new Date().getTime() + this.data.reviewInterval[this.data.myCards[this.data.sonIndex].status] : this.data.scheduleCards[this.data.sonIndex].reviewTime =new Date().getTime() + this.data.reviewInterval[this.data.scheduleCards[this.data.sonIndex].status]
          this.data.view ? this.data.myCards[this.data.sonIndex].status++ : this.data.scheduleCards[this.data.sonIndex].status++
          this.data.view ? this.data.myCards[this.data.sonIndex].checked = true : this.data.scheduleCards[this.data.sonIndex].checked = true
          this.data.view ? this.data.myCards[this.data.sonIndex].updateTime = util.getDateDiff(new Date()) : this.data.scheduleCards[this.data.sonIndex].updateTime = util.getDateDiff(new Date())
          this.data.view ? this.data.myCards[this.data.sonIndex].updateTimeStamp = new Date().getTime() : this.data.scheduleCards[this.data.sonIndex].updateTimeStamp = new Date().getTime()
          this.data.view ? this.data.myCards[this.data.sonIndex].updaterName = app.globalData.name : this.data.scheduleCards[this.data.sonIndex].updaterName = app.globalData.name
          this.data.view ? this.data.myCards[this.data.sonIndex].updaterAvatar = app.globalData.hasUserProfile ? app.globalData.userInfo.avatarUrl : 'default' : this.data.scheduleCards[this.data.sonIndex].updaterAvatar = app.globalData.hasUserProfile ? app.globalData.userInfo.avatarUrl : 'default',
          this.data.view ? this.setData({ 
                              myCards: this.data.myCards,
                            }) : this.setData({ 
                              scheduleCards: this.data.scheduleCards,
                              cardUpdated:true
                            })
          if(cb){
            cb()
          }
        }       
        if(res.data.code == 500){
          wx.navigateTo({ 
            url: '/pages/notice/notice?statusChanged=' + 'true'
          })        
        }
      },
      fail: res => {
        util.alert(res)
      },
      timeout: res => {
        util.alert(res)
      }
    })
  },
  cardUpdate(cb) {
    if (app.globalData.requested == false) {
      wx.getUserProfile({
        desc: '更新卡片状态',
        success: (res) => {
          app.globalData.userInfo = res.userInfo
          app.globalData.hasUserProfile = true
        },
        complete: () => {
          app.globalData.requested = true
          this.cardUpdation(cb)
        },
        fail: res => {
          util.alert(res)  
        },
        timeout: res => {
          util.alert(res)
        }  
      })
    }
    else {
      this.cardUpdation(cb)
    }
  },
  bindTouchStart: function (e) {
    this.startTime = e.timeStamp;
  },
  bindTouchEnd: function (e) {
    this.endTime = e.timeStamp;
  },
  toMyCard: function (e) {
    if (this.endTime - this.startTime < 350) {
      let idx = e.currentTarget.dataset.index
      var cardData = this.data.view ? encodeURIComponent(JSON.stringify(this.data.myCards[idx])) : encodeURIComponent(JSON.stringify(this.data.scheduleCards[idx]))
      wx.navigateTo({
        url: '/pages/myCard/myCard?cardData=' + cardData + '&index=' + idx + '&view=' + this.data.view
      })
    }
  },
  selectCard(e) {
    let idx = e.currentTarget.dataset.index
    this.data.selectedArray[idx] = 1
    this.setData({
      selectedArray: this.data.selectedArray,
      deleteCardModal: true,
      selectedIdx: idx
    })
  },
  deleteCard() {
    let idx = this.data.selectedIdx
    var url = "https://ywsp.yuyihub.com/delcard"
    wx.request({
      url: url,
      method: "DELETE",
      data: {
        cardid: this.data.view ? this.data.myCards[idx].cardId : this.data.scheduleCards[idx].cardId,
      },
      success: res => {
        console.log(res.data)
        if (res.data.code == 200) {
          this.setData({
            deleteCardModal: null,
            selectedIdx: ''
          })
          if (this.data.view) {
            this.data.myCards.splice(idx, 1)
            this.setData({
              myCards: this.data.myCards,
              selectedArray: Array(this.data.myCards.length),
            })
          }
          else {
            this.data.scheduleCards.splice(idx, 1)
            this.setData({
              cardUpdated:true,
              scheduleCards: this.data.scheduleCards,
              selectedArray: Array(this.data.scheduleCards.length),
            })
          }           
          wx.showToast({
            title: '已删除',
            icon: 'success',
            duration: 1500
          })
        }
        if (res.data.code == 500) {
          this.setData({
            selectedArray: this.data.view ? Array(this.data.myCards.length) : Array(this.data.scheduleCards.length),
            deleteCardModal: null,
            selectedIdx: ''
          })
          wx.navigateTo({ 
            url: '/pages/notice/notice?statusChanged=' + 'true'
          })        
        }
      },
      fail: res => {
        util.alert(res)
        this.cancelDelete()
      },
      timeout: res => {
        util.alert(res)
        this.cancelDelete()
      }
    })
  },
  cancelDelete() {
    this.setData({
      selectedIdx: '',
      selectedArray: this.data.view ? Array(this.data.myCards.length) : Array(this.data.scheduleCards.length),
      deleteCardModal: null
    })
  },
  selectKid (e) {
    var kidIndex = e.detail.value
    this.getKidPage(kidIndex)
  },
  getKidPage (kidIndex) {
    wx.showLoading({
      title: '加载中',
    })
    var url = "https://ywsp.yuyihub.com/getkid/"
    wx.request({
      url: url,
      data: {
        kidid: this.data.kids[kidIndex].kidid,
        page: 0
      },
      success: res => {
        console.log(res.data)
        wx.hideLoading()
        if(res.data.code == 404){
          wx.navigateTo({ 
            url: '/pages/notice/notice?statusChanged=' + 'true'
          })        
        }
        else{
          this.data.avatarWord = this.data.kids[kidIndex].name.slice(0, 1)
          this.setData({
            top:60,
            view : 'myCards',
            myCards: [],
            scheduleCards: [],
            page: 0,
            page1:0,
            kidIndex: kidIndex,
            avatarWord: this.data.avatarWord,
            scrollBottom: false,
            scrollBottom1:false,    
            cardUpdated:false,
            comment:false,
            commentValue:'',
            cardIndex :'',
            paddingBottom:25,
            scrollItem:'item1',
            scrollHeight:this.data.windowHeight-120
          })
          this.pushCards(res.data)
          app.globalData.currentKidId = this.data.kids[kidIndex].kidid
        }
      },
      fail: res => {
        util.alert(res)
      },
      timeout: res => {
        util.alert(res)
      }
    })
  },
  toScheduleCards() {
    wx.showLoading({
      title: '加载中',
    })
    var url = "https://ywsp.yuyihub.com/getkidactive/"
    wx.request({
      url: url,
      data: {
        kidid: app.globalData.currentKidId,
        page: 0
      },
      success: res => {
        console.log(res.data)
        wx.hideLoading()
        if(res.data.code == 404){
          wx.navigateTo({ 
            url: '/pages/notice/notice?statusChanged=' + 'true'
          })        
        }
        else{
          this.setData({
            top:110,
            cardUpdated : false,
            scrollBottom1:false,      
            view : null,
            page1:0,
            scheduleCards:[],
            scrollHeight:this.data.windowHeight-170,
            scrollItem1: 'item1'
          })
          this.pushCards(res.data)        
        }
      },
      fail: res => {
        util.alert(res)
      },
      timeout: res => {
        util.alert(res)
      },
    })
  },
  toMyCards() {
    if(this.data.cardUpdated == true){
      wx.showLoading({
        title: '加载中',
      })
      var url = "https://ywsp.yuyihub.com/getkid/"
      wx.request({
        url: url,
        data: {
          kidid: app.globalData.currentKidId,
          page: 0
        },
        success: res => {
          console.log(res.data)
          wx.hideLoading()
          if(res.data.code == 404){
            wx.navigateTo({ 
              url: '/pages/notice/notice?statusChanged=' + 'true'
            })        
          }
          else{
            this.setData({
              top:60,
              scrollBottom:false,
              view: 'myCardsView',
              page:0,
              myCards:[],
              scrollHeight:this.data.windowHeight-120,
              scrollItem:'item1'
            }) 
            this.pushCards(res.data) 
          }
        },
        fail: res => {
          util.alert(res) 
        },
        timeout: res => {
          util.alert(res)
        }
      })
    }
    else{
      this.setData({
        top:60,
        view: 'myCardsView',
        scrollHeight:this.data.windowHeight-120,
        scrollItem:'item1'
      })
    }
  },
  onShareAppMessage(){
    return {
      title: '',
      path:'/pages/home/home',
      imageUrl:'/resource/images/miniapp.png',
    }
  },
  
  onload(loginData){
    this.setData({
      avatarWord: app.globalData.kidobjs[0].name.slice(0, 1),
      kids: app.globalData.kidobjs,
      openid:app.globalData.data.openid,  
      scrollItem: 'item1',
    })
    this.pushCards(loginData,
      this.setData({
        loaded:true,
      })
    )
  },
  login(){
    wx.showLoading({
      title: '加载中',
    })
    wx.login({
      success: res => {
        console.log(res.code)
        var url = "https://ywsp.yuyihub.com/login"
        wx.request({
          url: url,
          method: "POST",
          data: {
            jsCode:res.code
          },
          success:( res )=> {
            util.setGlobalData(res.data)
            this.onload(app.globalData.data)
            app.globalData.sharedCardUpdated = false
            wx.hideLoading()
          },
          fail: res => {
            util.alert(res) 
          },
          timeout: res => {
            util.alert(res) 
          }    
        })
      },
      fail: res => {
        util.alert(res)
      },
      timeout: res => {
        util.alert(res)
      }
    })

  },
  onLoad() {
    this.data.windowHeight = wx.getSystemInfoSync().windowHeight
    this.setData({
      scrollHeight:this.data.windowHeight-120
    })
    if(!app.globalData.data || app.globalData.sharedCardUpdated){
      this.login()
    }
    else{
      this.onload(app.globalData.data)
    }
  },
  tabBar() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({
        selected: 0
      })
    }
  },
  checkUpdateTime(){
    var that = this
    if(that.data.interval){
      clearInterval(that.data.interval)
    }
    that.data.interval = setInterval(function(){
      if(that.data.view){
        if(that.data.myCards){
          for(var i =0;i < that.data.myCards.length; i++){
            that.data.myCards[i].updateTime = util.getDateDiff(new Date(that.data.myCards[i].updateTimeStamp))
          }
          that.setData({
            myCards:that.data.myCards
          })
        }
      }
      else{
        if(that.data.scheduleCards){
          for(var i =0;i < that.data.scheduleCards.length; i++){
            that.data.scheduleCards[i].updateTime = util.getDateDiff(new Date(that.data.scheduleCards[i].updateTimeStamp))
          }
          that.setData({
            scheduleCards:that.data.scheduleCards
          })
        }  
      }
    },20000)
  },
  onUnload(){
    if(this.data.interval){
      clearInterval(this.data.interval)
    }
  },
  onShow(){   
    this.tabBar()
    if(app.globalData.kidsNameChanged == true){
      this.setData({
        kids:app.globalData.kidobjs,
        avatarWord: app.globalData.kidobjs[0].name.slice(0, 1)
      })
      app.globalData.kidsNameChanged = false
    }
    if(app.globalData.kidsChanged == true){
      if(app.globalData.kidobjs.length>0){
        this.setData({
          kids: app.globalData.kidobjs,
        })
        this.getKidPage(0)
      }
      else{
        wx.navigateTo({ 
          url: '/pages/notice/notice?statusChanged=' + 'true'
        })        
      }
      app.globalData.kidsChanged = false
    }
    if(app.globalData.cardsToAdd.length > 0){
      for (var j = 0; j < app.globalData.cardsToAdd.length; j++) {
        this.data.myCards.unshift(app.globalData.cardsToAdd[j])
      }
      this.setData({
        myCards:this.data.myCards,
        selectArray:Array(this.data.myCards.length),
        scrollItem:'item1',
      },this.checkUpdateTime())
      app.globalData.cardsToAdd = []
    }
    if(app.globalData.statusChanged ==true){
      this.setData({
        top:60,
        view : 'myCards',
        myCards: [],
        page: 0,
        page1:0,
        kidIndex:0,
        scrollBottom:false,
        scrollBottom1:false,    
        cardUpdated:false,
        comment:false,
        commentValue:'',
        cardIndex :'',
        paddingBottom:25,
        scrollItem:'item1',
        scrollHeight:this.data.windowHeight-120
      })
      this.login()
      app.globalData.statusChanged = false
    }
  }
})
