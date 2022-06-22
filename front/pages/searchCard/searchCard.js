var app = getApp()
var util = require('../../utils/util.js')

Page({
    data:{
        cardData:null,
        index:'',
    },
    onLoad(options){
        let receivedData = JSON.parse(decodeURIComponent(options.cardData))
        let index = options.index
        this.setData({
             cardData : receivedData,
             index:index
        })
    },
    pushCard(){
        var that = this
        var url = "https://ywsp.yuyihub.com/addcard"
        wx.request( {
            url: url,
            method:"POST",
            data:{
                kidid:app.globalData.data ? app.globalData.currentKidId : app.globalData.kidsobj[0].kidid,
                content:that.data.cardData.id,
                status:0,
                addtime:new Date().getTime(),
                updatetime:new Date().getTime(),
                updater:app.globalData.data ? app.globalData.data.name : app.globalData.kidsobj[0].creater,
                updaterName:app.globalData.data ? app.globalData.data.name : app.globalData.kidsobj[0].creater,
                updaterAvatar:app.globalData.userInfo ? app.globalData.userInfo.avatarUrl : '',
                creater:app.globalData.data ? app.globalData.data.openid : app.globalData.kidsobj[0].creater,
                createrAvatar:app.globalData.userInfo ? app.globalData.userInfo.avatarUrl : '',
            },
            success: res => {
                console.log(res.data)
                this.data.cardData.added = true
                var tmpObj = {                           
                    cardId:res.data.cardid,           
                    status:0    
                }
                var authorObj = {
                    name:this.data.cardData.name,
                    desc:this.data.cardData.desc
                }
                var serachObj = {
                    title:this.data.cardData.title,
                    author:this.data.cardData.author,
                    paragraphs:this.data.cardData.paragraphs,
                    tags:this.data.cardData.tags
                }   
                var newObj = Object.assign(tmpObj, this.data.cardData.title ? serachObj : authorObj)
                newObj.updaterAvatar = app.globalData.hasUserProfile ? app.globalData.userInfo.avatarUrl : 'default',
                newObj.addTime = util.formatTime(new Date()),
                newObj.updater = app.globalData.data.name
                newObj.updateTime = util.getDateDiff(new Date()),
                newObj.updateTimeStamp = new Date().getTime()
                newObj.checked = false
                app.globalData.cardsToAdd.push(newObj)
                this.setData({
                    cardData : this.data.cardData
                },()=>{
                    wx.showToast({
                      title: '添加成功',
                      icon: 'success',
                      duration: 1500
                    })       
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
    addCard(){
        if(app.globalData.requested == false){
            wx.getUserProfile({
                desc: '添加卡片信息',
                success: (res) => {
                    app.globalData.userInfo = res.userInfo
                    app.globalData.hasUserProfile = true
                },
                complete: () => {
                    app.globalData.requested = true
                    this.pushCard()
                }
            })    
        }
        else{
            this.pushCard()
        }
        let pages = getCurrentPages()
        let prevPage = pages[pages.length - 2]
        prevPage.setData({
            sonIndex: this.data.index,
        });
        this.data.cardData.title ? prevPage.SearchCardAdd() : prevPage.AuthorCardAdd()
    }
 })