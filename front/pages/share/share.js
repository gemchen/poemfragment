var app = getApp()

Page({
    data: {
        kids:[], 
        TabCur: 0,
        kidsToShare:[]
    },
    tabSelect(e) {
      this.setData({
        TabCur: e.currentTarget.dataset.id,
      })
      if(this.data.TabCur==1){
        this.cancel()
      }
    },
    checkboxChange(e){
        console.log(e.detail.value)
        this.setData({
            cancel:false,
            kidsToShare : e.detail.value
        })
    },
    cancel(){
        this.setData({
            cancel:true,
            checked:false
        })
    },
    onShareAppMessage(opt){
        var title = ''
        var path = '/pages/home/home'
        var imageUrl = '/resource/images/miniapp.png'
        var kidstoshare = encodeURIComponent(JSON.stringify(this.data.kidsToShare))
        var sharerid = app.globalData.data.openid
        if( opt.from == 'button' ){
            title = '孩子信息分享'
            path = '/pages/notice/notice?kidstoshare=' + kidstoshare + '&sharerid=' + sharerid
        }
        return {
            title: title,
            path:path,
            imageUrl:imageUrl,
        }
    },
    onShow(){
        var array =[]
        for(var i=0;i < app.globalData.kidobjs.length;i++){
            array.push({
                name:app.globalData.kidobjs[i].name,
                kidId:app.globalData.kidobjs[i].kidid,
                avatarWord:app.globalData.kidobjs[i].name.slice(0,1),
            })
        }
        this.setData({
            kids:array,
        })   

    }
})