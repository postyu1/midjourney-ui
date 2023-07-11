// +—————————————————————————————————————————————————————————————————————
// | Created by 元岳科技
// +—————————————————————————————————————————————————————————————————————
// | Copyright (c) 2013~2023 http://www.yuanyuekj.com/ All rights reserved.
// +—————————————————————————————————————————————————————————————————————
// | GITEE: https://gitee.com/yuanyuekeji/stable-diffusion-mobileui
// +—————————————————————————————————————————————————————————————————————
// | GITHUB: https://github.com/yuanyuekeji/stable-diffusion-mobileui
// +—————————————————————————————————————————————————————————————————————

import {
	SEMSX_API,
	HTTP_URL_MJ,
	HEADER,
	TOKENNAME
} from '@/config/app';
import utils from "@/common/utils";
import store from '../store';


function toLogin() {
	store.commit("LOGOUT");
	uni.showToast({
		title: '请先完成登录！',
		icon: 'none',
		duration: 1000
	});
}

/**
 * 发送请求
 */
function baseRequest(url, method, data, {
	noAuth = true,
	noVerify = false,
	noAlert = false,
	isMj = false,
	isToken = false
}) {
	let Url = '',
		header = HEADER;
	
	// 请求地址处理
	if(isMj){
		Url = HTTP_URL_MJ + url;
	}else{
		Url = SEMSX_API + url;
	}
	if (!noAuth) {
		//登录过期自动登录
		if (!store.state.app.token) {
			toLogin();
			return Promise.reject({
				msg: '请先登录'
			});
		}
		if(isToken) {
			header.access_token = store.state.app.token
		}
	}
	// if (store.state.app.token) {
	// 	header[TOKENNAME] = store.state.app.token;
	// }
	// if (store.state.app.uid) {
	// 	if (data) {
	// 		data.user_id = store.state.app.uid;
	// 	} else {
	// 		data = {
	// 			user_id: store.state.app.uid
	// 		};
	// 	}
	// }
	
	return new Promise((reslove, reject) => {
		uni.request({
			url: Url,
			method: method || 'GET',
			timeout: 600000,
			header: header,
			data: data || {},
			success: (res) => {
				// console.log("rk===>[requst-suc-url]",Url,res);
				let statusCode = res.statusCode;
				if(statusCode == 200){
					if(isMj) {
						reslove(res.data);
					} else {
						if(res.data.errno == 0) {
							reslove(res.data.result||"")
							// let returnData = ""
							// if(res.data.result) {
							// 	returnData = JSON.stringify(res.data.result)
							// }
							// console.log(returnData)
							// resolve(returnData)
						} else {
							reject(res.data.errmsg)
							utils.showToast(res.data.errmsg);
						}
					}
				}else{
					let showErr = '请求失败'+statusCode;
					if (!noAlert) {
						utils.showToast(showErr);
					}
					reject(showErr);
				}
			},
			fail: (message) => {
				console.log('rk===>[requst-fail-url]', Url);
				console.log("rk===>[requst-fail-msg]" + JSON.stringify(message));
				let showErr = '请求失败';
				if (!noAlert) {
					utils.showToast(showErr);
				}
				reject(showErr);
			}
		})
	});
}

const request = {};

['options', 'get', 'post', 'put', 'head', 'delete', 'trace', 'connect'].forEach((method) => {
	request[method] = (api, data, opt) => baseRequest(api, method, data, opt || {})
});

export default request;
