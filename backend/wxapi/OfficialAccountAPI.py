#!/usr/bin/env python
# -*- coding: utf-8 -*-

from db import DBHelper
import requests
import json
import time
#封装的微信公众号接口
EXPIRE_IN = 7200



# 获取access_token
def get_access_token(wxcpt):
    tokenObj = DBHelper.instance.getAccessToken()
    print(tokenObj)

    # check if access_token is expired
    if int(time.time()) - tokenObj['update_time'] > EXPIRE_IN:
    # if time.time() - TOKEN_UPDATE_TIME > EXPIRE_IN:
        # get access_token from wechat server
        # print(wxcpt.appid, wxcpt.appsecret)
        URL = 'https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid={0}&secret={1}'.format(wxcpt.appid.decode(), wxcpt.appsecret.decode())
        response = requests.get(URL)
        if response.status_code == 200:
            resJson = json.loads(response.text)
            token = resJson["access_token"]
            print(token)
            DBHelper.instance.setAccessToken(token, updateTime=int(time.time()))
            
            return token
        else:
            # print error message   
            print(response.status_code,response.text)
            return None
    else:
        return tokenObj['token']

# 获取所有订阅用户列表（一次最多10000条)
def get_all_users(wxcpt):
    access_token = get_access_token(wxcpt)

    if access_token is None:
        print("access_token is None")
        return

    URL = 'https://api.weixin.qq.com/cgi-bin/user/get?access_token={0}'.format(access_token)
    response  = requests.get(URL)
    if response.status_code == 200:
        resJson = json.loads(response.text)
        print(resJson)
        if 'errcode' in resJson:
            print(resJson['errcode'], resJson['errmsg'])
        else:
            userOpenIDList = resJson["data"]["openid"]
            total = resJson["total"]
            count = resJson["count"]
            if total == count: # all users have been fetched
                #遍历userOpenIDList
                get_user_info_batch(wxcpt, userOpenIDList)
                ## 没有这么多用户，费不着这劲儿
                # tmpCount = 1
                # for userOpenID in userOpenIDList:
                #     #every 100 users, batch get unionid
                #     if tmpCount % 100 == 0:
                #         get_user_info_batch(wxcpt, userOpenIDList[tmpCount-100:tmpCount])

# 批量获取用户信息
def get_user_info_batch(wxcpt, userOpenIDList):
    access_token = get_access_token(wxcpt)

    if access_token is None:
        print("access_token is None")
        return

    URL = 'https://api.weixin.qq.com/cgi-bin/user/info/batchget?access_token={0}'.format(access_token)
    # construct json object to post
    jsonObj = {
        "user_list": []
    }
    for userOpenID in userOpenIDList:
        jsonObj["user_list"].append({
            "openid": userOpenID,
            "lang": "zh_CN"
        })
    # post
    response = requests.post(URL, json=jsonObj)
    if response.status_code == 200:
        resJson = json.loads(response.text)
        #遍历resJson
        for userInfo in resJson["user_info_list"]:
            #更新数据库
            # DBHelper.instance.update_user_unionid_oa(user)
            ret = DBHelper.instance.addUserInfo(userInfo)
        print("get_user_info_batch done")

# 查询用户信息
def get_user_info(wxcpt, userOpenID):
    access_token = get_access_token(wxcpt)

    if access_token is None:
        print("access_token is None")
        return

    URL = 'https://api.weixin.qq.com/cgi-bin/user/info?access_token={0}&openid={1}&lang=zh_CN'.format(access_token, userOpenID)
    response = requests.get(URL)
    if response.status_code == 200:
        resJson = json.loads(response.text)
        #更新数据库
        # DBHelper.instance.update_user_unionid_oa(user)
        DBHelper.instance.addUserInfo(resJson)

    else:
        # print error message   
        print(response.status_code,response.text)

# 用户订阅时下发一次性订阅消息
