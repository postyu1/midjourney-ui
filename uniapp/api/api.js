// +—————————————————————————————————————————————————————————————————————
// | Created by 元岳科技
// +—————————————————————————————————————————————————————————————————————
// | Copyright (c) 2013~2023 http://www.yuanyuekj.com/ All rights reserved.
// +—————————————————————————————————————————————————————————————————————
// | GITEE: https://gitee.com/yuanyuekeji/stable-diffusion-mobileui
// +—————————————————————————————————————————————————————————————————————
// | GITHUB: https://github.com/yuanyuekeji/stable-diffusion-mobileui
// +—————————————————————————————————————————————————————————————————————

import request from "@/common/request.js";
import {
	HTTP_CONFIG_URL,
	HTTP_TRANSLATE_URL,
	SEMSX_API
} from '@/config/app';
let notifyHook = SEMSX_API + '/Web/Mj/updateMjRecord'
/// MJ
/**
 * 公共配置
 */
export function getConfig(data) {
	return request.get('/config', data, {
		isMj: true
	});
}


/**
 * MJ生成图片【通用】
 */
export function postMjAddAll(data) {
	data.notifyHook = notifyHook
	return request.post('/mj/submit/imagine', data, {
		isMj: true,
		noAuth:false
	});
}

/**
 * MJ任务查询
 */
export function getMjFetch(data) {
	return request.get(`/mj/task/${data}/fetch`, null, {
		isMj: true,
		noAlert:true,
		noAuth:false
	});
}
/**
 * MJ图片处理
 */
export function postMjChange(data) {
	data.notifyHook = notifyHook
	return request.post('/mj/submit/simple-change', data, {
		isMj: true,
		noAuth:false
	});
}
/**
 * @param {Object} data
 */
export function postBlend(data) {
	data.notifyHook = notifyHook
	return request.post('/mj/submit/blend', data, {
		isMj: true,
		noAuth:false
	});
}

/**
 * 提交任务接口
 */
export function addTaskRecord(data) {
	return request.post('/Web/Mj/addUserMjRecord', data, {
		isMj: false,
		noAuth:false,
		isToken:true
	});
}
/**
 * @param {Object} 获取用户历史任务数据
 * 
 */
export function getUserRecordList() {
	return request.get('/Web/Mj/getMjRecordList', null, {
		isMj: false,
		noAuth:false,
		isToken:true
	});
}

// 获取单个数据详情
export function getRecordInfo(taskId) {
	return request.get('/Web/Mj/getMjRecordInfo', {task_id:taskId}, {
		isMj: false,
		noAuth:false,
		isToken:true
	});
}


/**
 * 手机发送验证码接口
 */
export function phoneCodeSend(data) {
	return request.post('/Common/Tool/sendPhoneMessage', data, {
		isMj: false,
	});
}
/**
 * 用户手机号验证码登录
 * @param {Object} data
 */
export function phoneCodeLogin(data) {
	return request.post('/Web/Mj/userLogin', data, {
		isMj: false
	});
}

export function getQiniuToken() {
	return request.get('/Common/Tool/getQiniuToken', {file_type:1}, {
		isMj: false
	});
}

export function addFile(data) {
	return request.post('/Common/AddStoreFile/addFile', data, {
		isMj: false,
		noAuth:false,
		isToken:true
	});
}