var app = getApp()
var util = require('../../utils/util.js')

Page({
    data: {
        searchType:'搜内容',
        input:'',
        pageLoad:'initial',
        hidden:false,
        added:false,
        sonIndex:'',
        resultInfo:'',
        url1Res:false,
        url2Res:false,
        recTags:[],
        contentTags:['李白','李清照','杜甫','苏轼','王维','范仲淹','辛弃疾','杜牧','李商隐','刘禹锡','柳宗元','欧阳修','白居易','王勃','王昌龄','陆游','将进酒','长恨歌','春望','问君能有几多愁','泊船瓜洲','茅屋为秋风所破歌','登高','静夜思','山居秋暝','春夜喜雨','万紫千红总是春','过零丁洋','锦瑟','清明时节雨纷纷','一览众山小','西江月·夜行黄沙道中','大漠孤烟直','一片冰心在玉壶','柳暗花明又一村','小荷才露尖尖角','江雪','咏柳','海内存知己','黄鹤楼','秦时明月汉时关','游子吟','登飞来峰','朱雀桥边野草花','咏鹅','锄禾日当午','春江花月夜','两个黄鹂鸣翠柳','蜀道难','赋得古原草送别'],
        tagTags:['一年级','二年级','三年级','四年级','五年级','六年级','小学古诗','初中古诗','高中古诗','课外','古诗三百首','托物言志','哲理','边塞','水','江南','怀才不遇','长江','瀑布','读书','春节','思乡','鸟','唐诗三百首','月亮','中秋','写雨','乐府','爱国','勉励','送别','带有地名','荷花','春天','秋天','借景抒情','借古讽今','重阳节','雪','寺庙','爱情'],
        authorCards:[],
        searchCards:[],
    },
    search(){
        if(this.data.input != ''){
            wx.showLoading({
                title: '搜索中',
            })
          
            this.setData({
                url1Res:false,
                url2Res:false
            })
            var that = this
            var suffix = this.data.input
            var url1 = "https://ywsp.yuyihub.com/author/"+ suffix
            var url2 = "https://ywsp.yuyihub.com/query/"
            wx.request( {
                url: url1,
                success: function( res ) {
                    if(typeof(res.data) === 'object' ){
                        that.data.authorCards=[]
                        that.data.authorCards.push({
                            name:res.data.name,
                            desc:res.data.desc,
                            id:res.data.id,
                            added:false,
                        })
                        that.setData({
                            authorCards:that.data.authorCards,
                        })

                    }
                    if(typeof(res.data) === 'string' ){
                        that.setData({
                            authorCards:[]               
                        })
                        console.log(res.data)
                    }
                },
                complete:function(){
                    that.setData({
                        hidden:true,
                        resultInfo:'',
                        pageLoad:'search',
                        url1Res:true
                    })
                }
            })
            wx.request( {
                url: url2,
                data:{
                    query:that.data.searchType == "搜内容" ? that.data.input : "#" + that.data.input
                },
                success: function( res ) {
                    console.log(res.data)
                    if( typeof(res.data) === 'object' && res.data.length > 0 && res.data.length < 200){                    
                        that.data.searchCards=[]
                        for(var i = 0; i < res.data.length; i++){
                            that.data.searchCards.push({
                                author:res.data[i].author,
                                paragraphs:res.data[i].paragraphs,
                                id:res.data[i].id,
                                title:res.data[i].title,
                                tags:res.data[i].tags,
                                added:false,
                            })
                        }

                        that.setData({
                            searchCards:that.data.searchCards,
                            resultInfo:'',
                        })
                    }
                    if( typeof(res.data) === 'object' && res.data.length > 0 && res.data.length >= 200){    
                        that.setData({
                            searchCards:[],
                            resultInfo:"返回了太多结果",
                        })
                    }
                    if(res.data.code == 200 || res.data.code == 404){
                        that.setData({
                            searchCards:[],
                            resultInfo:"未找到相关结果",
                        })
                    }

                },
                complete:function(){
                    that.setData({
                        hidden:true,
                        pageLoad:'search',
                        url2Res:true
                    })
                    wx.hideLoading()
                }
            })
        }

    }, 
    useRecTag(e){
        let idx = e.currentTarget.dataset.index
        this.setData({
            input:this.data.recTags[idx],
        })
        this.search()
    },
    clear(){
        this.setData({
            hidden:false,
            input:'',
        })
    },
    pushAuthorCard(e){
        console.log(new Date())
        let idx = e.currentTarget.dataset.index
        this.data.authorCards[idx].added = true
        var url = "https://ywsp.yuyihub.com/addcard"
        wx.request( {
            url: url,
            method:"POST",
            data:{
                kidid:app.globalData.currentKidId,
                content:this.data.authorCards[idx].id,
                status:0,
                addtime:new Date().getTime(),
                creater:app.globalData.data.openid,
                createrAvatar:app.globalData.userInfo ? app.globalData.userInfo.avatarUrl : '',
                updatetime:new Date().getTime(),
                updater:app.globalData.data.openid,
                updaterName:app.globalData.data.name,
                updaterAvatar:app.globalData.userInfo ? app.globalData.userInfo.avatarUrl : '',
            },
            success: res => {
                app.globalData.cardsToAdd.push({
                    addTime:util.formatTime(new Date()),
                    name:this.data.authorCards[idx].name,
                    desc:this.data.authorCards[idx].desc,
                    cardId:res.data.cardid,
                    updaterAvatar:app.globalData.hasUserProfile ? app.globalData.userInfo.avatarUrl : 'default',
                    updaterName:app.globalData.data.name,
                    updateTime:util.getDateDiff(new Date()),
                    updateTimeStamp:new Date().getTime(),
                    status:0,
                    checked:false
                })
                this.setData({
                    authorCards:this.data.authorCards
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
    addAuthorCard(e){
        if(app.globalData.requested == false){
            wx.getUserProfile({
                desc: '添加卡片信息',
                success: (res) => {
                    app.globalData.userInfo = res.userInfo
                    app.globalData.hasUserProfile = true
                },
                complete: () => {
                    this.pushAuthorCard(e)
                    app.globalData.requested = true
                }
            })
        }
        else{
            this.pushAuthorCard(e)
        }
    },
    pushSearchCard(e){
        let idx = e.currentTarget.dataset.index
        this.data.searchCards[idx].added = true
        var url = "https://ywsp.yuyihub.com/addcard"
        wx.request( {
            url: url,
            method:"POST",
            data:{
                kidid:app.globalData.currentKidId,
                content:this.data.searchCards[idx].id,
                status:0,
                addtime:new Date().getTime(),
                creater:app.globalData.data ? app.globalData.data.openid : app.globalData.kidsobj[0].creater,
                createrAvatar:app.globalData.userInfo ? app.globalData.userInfo.avatarUrl : '',
                updatetime:new Date().getTime(),
                updater:app.globalData.data.openid,
                updaterName:app.globalData.data.name,
                updaterAvatar:app.globalData.userInfo ? app.globalData.userInfo.avatarUrl : '',
            },
            success: res => {
                app.globalData.cardsToAdd.push({
                    addTime:util.formatTime(new Date()),
                    title:this.data.searchCards[idx].title,
                    author:this.data.searchCards[idx].author,
                    paragraphs:this.data.searchCards[idx].paragraphs,
                    tags:this.data.searchCards[idx].tags,
                    cardId:res.data.cardid,
                    updaterAvatar:app.globalData.hasUserProfile ? app.globalData.userInfo.avatarUrl : 'default',
                    updaterName:app.globalData.data.name ? app.globalData.data.name : '',
                    updateTime:util.getDateDiff(new Date()),
                    updateTimeStamp:new Date().getTime(),
                    status:0,
                    checked:false
                })
                this.setData({
                    searchCards:this.data.searchCards
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
    addSearchCard(e){
        if(app.globalData.requested == false){
            wx.getUserProfile({
                desc: '添加卡片信息',
                success: (res) => {
                    app.globalData.userInfo = res.userInfo
                    app.globalData.hasUserProfile = true
                },
                complete: () => {
                    this.pushSearchCard(e)
                    app.globalData.requested = true
                }
            })
        }
        else{
            this.pushSearchCard(e)
        }
    },

    toAuthorCard(e){
        let idx = e.currentTarget.dataset.index
        let cardData = encodeURIComponent(JSON.stringify(this.data.authorCards[idx]))
        wx.navigateTo({ 
            url: '/pages/searchCard/searchCard?cardData=' + cardData + '&index=' + idx
        })

    },
    toSearchCard(e) {
        let idx = e.currentTarget.dataset.index
        let cardData = encodeURIComponent(JSON.stringify(this.data.searchCards[idx]))
        wx.navigateTo({ 
            url: '/pages/searchCard/searchCard?cardData=' + cardData + '&index=' + idx
        })
    },
    AuthorCardAdd(){
        this.data.authorCards[this.data.sonIndex].added = true
        this.setData({
            authorCards:this.data.authorCards
        })
    },
    SearchCardAdd(){
        this.data.searchCards[this.data.sonIndex].added = true
        this.setData({
            searchCards:this.data.searchCards
        })
    },
    tabBar() {
        if (typeof this.getTabBar === 'function' && this.getTabBar()) {
            this.getTabBar().setData({
                selected: 1
            })
        }
    },
    hideModal(e) {
        this.setData({
          modalName: null
        })
    },
    showModal(){
        this.setData({
            modalName:'RadioModal'
        })
    }, 
    choose(e){
        this.setData({
            searchType:e.detail.value
        },()=>{
            this.clear()
            this.refresh()
        })
    },
    refresh(){
        var arr = this.data.searchType == "搜内容" ? this.data.contentTags : this.data.tagTags
        this.data.recTags = [];
        for (var i = 0; i < 10; i++) {
            var ran = Math.floor(Math.random() * (arr.length - i));
            if(this.data.recTags.includes(arr[ran])){
                        continue;
            }
            this.data.recTags.push(arr[ran]);
        };
        this.setData({
            recTags:this.data.recTags
        })
    },
    onShow(){
        if(this.data.sonBack)
        this.setData({
            input:'',
            hidden : false
        })
        this.tabBar()
    },
    onLoad(){
        this.refresh()
    },
    onShareAppMessage(){
        return {
          title: '',
          path:'/pages/home/home',
          imageUrl:'/resource/images/miniapp.png',
        }
    },
    
})
