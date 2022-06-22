Component({
	properties: {},
	data: {
        //当前高亮项
		selected: 0,
        tabList: [
            {
                "pagePath": "pages/home/home",
                "text": "首页"
            },
            {
                "pagePath": "pages/search/search",
                "text": "添加"
            },
            {
                "pagePath": "pages/me/me",
                "text": "我的"
            }
        ]
    },
	// attached: function() {},
	methods: {
		//底部切换
		switchTab(e) {
			let key = Number(e.currentTarget.dataset.index);
			let tabList = this.data.tabList;
			let selected= this.data.selected;
			
			if(selected !== key){
				this.setData({
					selected:key
				});
				wx.switchTab({
					url: `/${tabList[key].pagePath}`,
				})
			}
		},
	}
})
