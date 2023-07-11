<template>
	<view class="com-mj-icon">
		<scroll-view scroll-y="true" :style="'height:'+scrollHeight+'px'" :scroll-top="scrollViewTop"
			@scroll="onScroll">
			<view class="scroll-content">
				<view class="desc-box">
					<view class="desc">上传blend操作图片，最少上传2张图片，最多4张</view>
				</view>
				<view class="upload-box">
					<view v-for="(item,index) in blendQiniuUrls" :key="'blendI' + index" class="upload-content" >
						<view class="delete-button" @click="deleteImage(index)">
							<text>X</text>
						</view>
						<view class="img-box" :style="blendImageSizeStyle" v-if="item==''" @click="clickSelImg(index)">
							<text class="iconfont icon-morentupianccccccpx"></text>
							<view class="des">点击上传图片</view>
						</view>
						<view class="img-box" :style="blendImageSizeStyle" v-if="item!=''" @click="clickSelImg(index)">
							<image :src="item" mode="aspectFit"></image>
							<!-- <view class="image-caption">wmgu_Tokyo_Japan_b3cdb686-b421-41e3-992f-de580320cc51.png</view> -->
						</view>
					</view>
				</view>
				<view class="item-section">请选择比例</view>
				<view class="type-box">
					<view class="type-list" v-for="(item,index) in types" :key="index">
						<view class="type-list-item" :class="type == item.val?'type-list-sel':''"
							@click="clickChangeType(item)">
							{{item.title}}
						</view>
					</view>
				</view>
				<!-- 提交 -->
				<view class="submit-box">
					<view class="submit-btn" @click="clickSubmit" v-if="!generatesImages">立即生成</view>
					<view class="submit-btn" @click="clickSubmit" v-else>再来一次</view>
				</view>
				<view class="submit-box">
					<view class="submit-btn" @click="addImage" style="margin-right: 20px;">添加图片</view>
					<view class="submit-btn" @click="clearNowInfo">清空当前</view>
				</view>
				<!--  -->
				<view class="desc-box" v-if="!showDealTool">
					<view class="desc">生成时间1-3分钟,请耐心等待</view>
				</view>

				<!-- 结果 -->
				<view id="result-rect" class="result-box">
					<view class="result-content" v-if="generatesImages">
						<view class="item-section">生成结果(点击图片长按保存)</view>
						<view class="item-content" @click="clickImg(generatesImages)">
							<view class="res-img-box" :style="'width:'+imgSize*1.15+'px;height:'+imgSize*1.15+'px;'">
								<image :src="generatesImages" mode="aspectFit"></image>
							</view>
						</view>
					</view>
				</view>
				<!-- 图片处理 -->
				<view class="reult-iamge-deal-box" v-if="showDealTool">
					<view class="item-section">相似图重绘</view>
					<view class="same-redraw-box">
						<view class="same-redraw-list" v-for="(item,index) in redrawTypes" :key="index">
							<view class="same-redraw-list-item"
								:class="redrawForm.draw_val == item.draw_val?'same-redraw-list-item-sel':''"
								@click="clickRedrawItem(item)">{{item.title}}</view>
						</view>
					</view>
					<view class="item-section">单张下载</view>
					<view class="same-redraw-box">
						<view class="same-redraw-list" v-for="(item,index) in redrawTypes" :key="index">
							<view class="same-redraw-list-item"
								:class="redrawForm.down_val == item.down_val?'same-redraw-list-item-sel':''"
								@click="clickDownItem(item)">{{item.title}}</view>
						</view>
					</view>
					<view class="result-content" v-if="generateDownImage">
						<view class="item-section">生成结果(点击图片长按保存)</view>
						<view class="item-content" @click="clickImg(generateDownImage)">
							<view class="res-img-box" :style="'width:'+imgSize*1.15+'px;height:'+imgSize*1.15+'px;'">
								<image :src="generateDownImage" mode="aspectFit"></image>
							</view>
						</view>
					</view>
				</view>
				<view class="yuanyue-safe20"></view>
			</view>
		</scroll-view>

	</view>
</template>

<script>
	import {mapGetters} from 'vuex';
	import {uploadBase64} from '@/common/qiniuUpload.js'
	import {
		TIMER_FETCH_INTERVAL,
		FETCH_REPEAT_COUNT
	} from "@/config/app.js"
	import {
		postBlend,
		getMjFetch,
		postMjChange,
		addTaskRecord,
		getRecordInfo,
		getQiniuToken,
		addFile
	} from "@/api/api.js"
	export default {
		name: 'mj-icon',
		props: {
			scrollHeight: {
				typeof: Number,
				default: 0
			}
		},
		computed: {
			imgSize() {
				let s_w = uni.getSystemInfoSync().screenWidth;
				let img_w = s_w * 0.7;
				return img_w;
			},
			blendImageSizeStyle() {
				let s_w = uni.getSystemInfoSync().screenWidth;
				let img_w = s_w * 0.7*(1/(this.blendImages.length+1.5));
				return 'width:'+img_w+'px;height:'+img_w+'px;';
			},
			...mapGetters(['token']),
		},
		data() {
			return {
				scrollViewTop: 0,
				resultRectTop: 0,
				selShowUrl: '',
				selDir: '',
				type: '', //1婴儿，2男孩，3女孩，
				types: [{
						title: '等比(1:1)',
						val: 'SQUARE',
						scale:'1:1'
					},
					{
						title: '横向(3:2)',
						val: 'LANDSCAPE',
						scale:'3:2'
					}, {
						title: '竖向(2:3)',
						val: 'PORTRAIT',
						scale:'2:3'
					}
				],
				blendImages:['',''],
				blendQiniuUrls:['',''],
				gener_task_id: '',
				down_task_id: '',
				draw_task_id: '',
				generateTimer: null,
				timerClear: false,
				isGenerating: false,
				isCurrentPage: false,
				generatesImages: '',
				redrawTypes: [{
						title: '左上',
						down_val: 'U1',
						draw_val: 'V1',
					},
					{
						title: '右上',
						down_val: 'U2',
						draw_val: 'V2',
					},
					{
						title: '左下',
						down_val: 'U3',
						draw_val: 'V3',
					},
					{
						title: '右下',
						down_val: 'U4',
						draw_val: 'V4',
					}
				],
				redrawForm: {
					down_val: '',
					draw_val: '',
				},
				showDealTool: false,
				task_type: 0, //0-生成任务，1-重绘任务，2下载任务
				generateDownImage: '',
				canResetTaskid: false,
				fetchErrCount: 0,
				fetchRepeat: false,
				loadingTxt:'请稍后...',
				historyVList:[],
				historyUList:[],
				fromHistory:false,
				qiniuTokenObj:{
					token:'',
					expiredTime:0
				},
				baseRecordId:''
			}
		},
		watch: {
			selDir(n, o) {
				if (n) {
					this.selShowUrl = n;
				}
			},
		},
		mounted() {
			let that = this;
			// let s_w = uni.getSystemInfoSync().screenWidth;
			// let img_w = s_w * 0.7;
			// console.log(img_w)
			this.$utils.getRect('#result-rect').then(res => {
				this.resultRectTop = res.top;
			})
			this.getQiniuToken()	
		},
		methods: {
			async getQiniuToken() {
				let nowDate = new Date().getTime()
				if(nowDate>this.qiniuTokenObj.expiredTime) {
					let token = await getQiniuToken()
					this.qiniuTokenObj.token = token.token
					// 过期时间1小时
					this.qiniuTokenObj.expiredTime = new Date(nowDate + (1*60*60*1000))
				}

			},
			clearNowInfo() {
				uni.showModal({
					title: '提示',
					content: '确定清空当前?',
					success: (res) => {
						if (res.confirm) {
							this.blendImages = ['','']
							this.blendQiniuUrls = ['','']
							this.type = 0
							this.isGenerating = false
							this.redrawForm.down_val = ''
							this.redrawForm.draw_val = ''
							this.type = ''
							this.gener_task_id = ''
							this.down_task_id= ''
							this.draw_task_id = ''
							this.generatesImages = ''
							this.generateDownImage = ''
							this.showDealTool = false
						}
					}
				})

			},
			setDefaultData(item) {
				this.fromHistory = true
				this.generateDownImage = ''
				this.gener_task_id = item.task_id
				// this.nowTaskInfo = item
				if(item.task_status == 'SUCCESS'||item.task_status == 'IN_PROGRESS') {
					// 获取单个数据
					let taskInfo = JSON.parse(item.task_json)
					// 获取链接以及
					this.generatesImages = taskInfo.image_url;
					let prompt = taskInfo.prompt
					// this.blendImages = prompt.match(/https?:\/\/[^ ]+/g);
					let scale = prompt.match(/--ar\s(\d+:\d+)/)[1];
					let typeInfo = this.types.find(item=>{
						return item.scale == scale
					})
					if(typeInfo) 
						this.type = typeInfo.val
					getRecordInfo(this.gener_task_id).then(data=>{
						this.blendQiniuUrls = data.blend_img_urls.split(",")
						data.variation_list.map(item=>{
							if(item.task_json) {
								item.vOpt = JSON.parse(item.task_json).description.slice(-2)
							}
						})
						data.upscale_list.map(item=>{
							if(item.task_json) {
								let objU = JSON.parse(item.task_json)
								item.uOpt = objU.description.slice(-2)
								item.uImageUrl = objU.image_url
							}
						})
						this.baseRecordId = item.base_record_id
						this.historyUList = data.upscale_list
						this.historyVList = data.variation_list
						this.showDealTool = true;
						this.toolBtnReset();
					})
				} else {
					this.getMjFetch(this.gener_task_id)
				}
			},
			
			addImage() {
				if(this.blendImages.length < 4||this.blendQiniuUrls.length<4) {
					this.blendImages.push('')
					this.blendQiniuUrls.push('')
				} else {
					this.$utils.showToast("最多上传4张图片！");
				}
			},
			deleteImage(index) {
				uni.showModal({
					title: '提示',
					content: '确定要删除此图片吗?',
					success: (res) => {
						if (res.confirm) {
							this.blendImages.splice(index, 1)
							this.blendQiniuUrls.splice(index, 1)
						}
					}
				})
			},
			/**
			 * 选择图片
			 */
			async clickSelImg(index) {
				if (this.isGenerating) {
					return;
				}
				if(!this.token) {
					return this.$utils.showToast("请先登录！");
				}
				try{
					this.getQiniuToken()
					let base64 = await this.$utils.getImageBase64()
					uni.showLoading({
						title: "请稍后...",
						mask: true
					})
					// 将base64上传至七牛
					let result = await uploadBase64(base64,this.qiniuTokenObj.token,null)
					let data = await addFile({'qiniu_hash':result.hash,'qiniu_key':result.key})
					this.$set(this.blendImages,index,base64)
					this.$set(this.blendQiniuUrls,index,data.file_url)
				} catch(e){
					console.log(e)
					//TODO handle the exception
					this.$utils.showToast("图片上传失败!");
				} finally {
					uni.hideLoading()
				}
			},
			/**
			 * 切换类型
			 */
			clickChangeType(item) {
				if (this.isGenerating) {
					return;
				}
				this.type = item.val;
			},
			async clickSubmit() {
				if(this.blendImages.length<2||this.blendQiniuUrls.length<2) {
					return this.$utils.showToast("请至少上传2张图片");
				}
				if(this.blendQiniuUrls.includes("")) {
					return this.$utils.showToast("图片不允许为空");
				}
				if(!this.type) {
					return this.$utils.showToast("请设置生成图片的比例值");
				}
				uni.showLoading({
					title: "请稍后...",
					mask: true
				})
				// 遍历blendImages 如果出现为空的话需要获取图片base64数据
				try{
					for (var i = 0; i < this.blendImages.length; i++) {
						if(!this.blendImages[i]) {
						 let base64 = await this.$utils.getBase64ByUrl(this.blendQiniuUrls[i])		
						 this.$set(this.blendImages,i,base64)
						}
					}
				}catch(e){
					//TODO handle the exception
					uni.hideLoading()
					this.$utils.showToast("图片加载出错！");
				}
				if (this.isGenerating) {
					return;
				}
				this.task_type = 0;
				this.generatesImages = '';
				this.generateDownImage = '';
				this.historyUList = []
				this.historyVList = []

				this.isGenerating = true;
				postBlend({
					base64Array:this.blendImages,
					dimensions:this.type
				}).then(res => {
					if (res.code == 1) {
						addTaskRecord({'task_id':res.result,'action':'BLEND','qiniu_urls':this.blendQiniuUrls}).then(addRes=>{
							this.baseRecordId = addRes
							this.gener_task_id = res.result;
							this.timerClear = false;
							this.createTimer(this.gener_task_id);
						}).catch(err=>{
							this.isGenerating = false;
							uni.hideLoading()
							this.$utils.showToast(err);
						})
					} else {
						this.isGenerating = false;
						uni.hideLoading()
						this.$utils.showToast(res.description);
					}
				}).catch(err => {
					this.isGenerating = false;
					uni.hideLoading()
				});
			},
			/**
			 * 创建计时器
			 */
			createTimer(taskId) {
				let that = this;
				that.generateTimer = setInterval(function() {
					if (that.timerClear) {
						clearInterval(that.generateTimer);
						that.generateTimer = null;
						return;
					}
					that.getMjFetch(taskId);
				}, TIMER_FETCH_INTERVAL);
			},
			destroyTimer() {
				if (this.generateTimer) {
					clearInterval(this.generateTimer);
					this.generateTimer = null;
				}
				this.timerClear = true;
				this.isGenerating = false;
			},
			/**
			 * 获取图片进度
			 */
			getMjFetch(taksId) {
				uni.showLoading({
					title: this.loadingTxt,
					mask: true
				})
				let that = this;
				getMjFetch(taksId).then(res => {
					if (res.status == 'NOT_START' || res.status == 'IN_PROGRESS' || res.status == 'SUBMITTED') {
						if(res.status == 'IN_PROGRESS'&&res.progress!='paused') {
							this.loadingTxt = `正在生成(${res.progress})...`
						}
						if (that.fetchRepeat) {
							that.fetchRepeat = false;
							that.destroyTimer();
							that.createTimer(taksId);
						}
					} else if (res.status == 'SUCCESS') {
						this.loadingTxt = '请稍后...'
						uni.hideLoading()
						this.fetchErrCount = 0;
						if (this.task_type == 2) {
							// 下载任务
							this.generateDownImage = res.imageUrl;
							this.historyUList.push({uOpt:this.redrawForm.down_val,uImageUrl:res.imageUrl})
						} else if (this.task_type == 1) {
							// 重绘
							this.generatesImages = res.imageUrl;
							this.showDealTool = true;
							// 重绘成功将重绘id给生成id,以便下一次重绘或下载
							this.gener_task_id = this.draw_task_id;
							this.toolBtnReset();
						} else {
							//生成
							this.generatesImages = res.imageUrl;
							this.showDealTool = true;
							this.toolBtnReset();
						}
						this.$utils.showToast('获取成功');
						// 销毁
						this.destroyTimer();
						// 滚动
						this.scrollToRes();
					} else {
						let err_msg = '获取失败';
						if(res.failReason){
							err_msg = res.failReason;
						}
						uni.hideLoading()
						this.$utils.showToast(err_msg);
						// 销毁
						this.destroyTimer();
					}
				}).catch(err => {
					// 销毁
					that.destroyTimer();
					if (that.fetchErrCount >= FETCH_REPEAT_COUNT) {
						uni.hideLoading()
						this.fetchErrCount = 0;
						that.$utils.showToast('获取失败');
						// console.log("rk===>[重试-放弃]",that.fetchErrCount);
					} else {
						setTimeout(() => {
							that.fetchErrCount += 1;
							that.fetchRepeat = true;
							// console.log("rk===>[重试]" ,that.fetchErrCount);
							that.getMjFetch(taksId);
						}, 2000);
					}
				});
			},
			onScroll(e) {
				if (e.detail.scrollTop <= 10) {
					this.scrollViewTop = 0;
				}
			},
			scrollToRes() {
				if (this.scrollViewTop <= 0) {
					this.scrollViewTop = this.resultRectTop;
				}
			},
			/**
			 * 预览
			 */
			clickImg(url) {
				let urls = [url];
				wx.previewImage({
					urls: urls,
					current: 0,
					success: function(res) {},
					fail: function(res) {},
					complate: function(res) {}
				})
			},
			/**
			 * 重绘-选择重绘的图
			 */
			clickRedrawItem(item) {
				if (item.draw_val == this.redrawForm.draw_val) {
					return
				}
				if(this.historyVList.length>0) {
					let findObj = this.historyVList.find(data=>{
						return data.vOpt == item.draw_val
					})
					if(findObj) {
						this.redrawForm.draw_val = item.draw_val;
						this.setDefaultData(findObj)
						return
					}
				}
				uni.showLoading({
					title: "请稍后...",
					mask: true
				})
				this.isGenerating = true;
				let postDic = {
					content: this.gener_task_id + " " + item.draw_val
				}
				postMjChange(postDic).then(res => {
					this.redrawForm.draw_val = item.draw_val;
					if (res.code == 1) {
						// 添加任务
						addTaskRecord({'task_id':res.result,'action':'VARIATION',base_record_id:this.baseRecordId,
							parent_task_id:this.gener_task_id,'base_action':'BLEND'}).then(addResult=>{
								this.task_type = 1;
								this.generateDownImage = '';
								this.generatesImages = '';
								this.draw_task_id = res.result;
								this.historyVList = []
								this.historyUList = []
								this.toolBtnReset()
								this.timerClear = false;
								this.createTimer(this.draw_task_id);
							}).catch(error=>{
								uni.hideLoading()
								this.isGenerating = false;
								this.toolBtnReset()
								this.$utils.showToast(error);
							})
					} else {
						uni.hideLoading()
						this.isGenerating = false;
						this.toolBtnReset()
						this.$utils.showToast(res.description);
					}
				}).catch(err => {
					uni.hideLoading()
					this.toolBtnReset()
					this.isGenerating = false;
				});
			},
			/**
			 * 单张下载
			 */
			clickDownItem(item) {
				if (item.down_val == this.redrawForm.down_val) {
					return
				}
				// 判断是否已经生成过
				if(this.historyUList.length>0) {
					let findObj = this.historyUList.find(data=>{
						return data.uOpt == item.down_val
					})
					if(findObj&&findObj.uOpt&& findObj.uImageUrl){
						this.redrawForm.down_val = findObj.uOpt
						this.generateDownImage = findObj.uImageUrl
						return
					}
				}
				if(!this.gener_task_id) {
					this.$utils.showToast('生成放大图片有误'); return;
				}
				this.redrawForm.down_val = item.down_val;
				this.task_type = 2;
				this.generateDownImage = '';
				uni.showLoading({
					title: "请稍后...",
					mask: true
				})
				this.isGenerating = true;
				let postDic = {
					content: this.gener_task_id + " " + item.down_val
				}
				postMjChange(postDic).then(res => {
					if (res.code == 1) {
						addTaskRecord({'task_id':res.result,'action':'UPSCALE',parent_task_id:this.gener_task_id}).then(addRes=>{
							this.down_task_id = res.result;
							this.timerClear = false;
							this.createTimer(this.down_task_id);
						}).catch(err=>{
							this.isGenerating = false;
							this.redrawForm.down_val = '';
							uni.hideLoading()
							this.$utils.showToast(err);
						})
					} else {
						uni.hideLoading()
						this.redrawForm.down_val = '';
						this.$utils.showToast(res.description);
					}
				}).catch(err => {
					this.redrawForm.down_val = '';
					uni.hideLoading()
				});
			},
			toolBtnReset(){
				this.redrawForm.draw_val = '';
				// 判断U操作数组是否里面有数据
				if(this.historyUList.length >0) {
					let uInfo = this.historyUList[0]
					this.redrawForm.down_val = uInfo.uOpt||''
					this.generateDownImage = uInfo.uImageUrl||''
				} else {
					this.redrawForm.down_val = '';
				}
			},
		}
	}
</script>

<style lang="scss">
	.scroll-content {
		padding: 30rpx;
	}

.upload-box {
  display: flex;
  justify-content: center;
  padding: 20px;
  .upload-content {
    position: relative; /* 这样可以让删除按钮相对于这个元素进行定位 */
    background-color: #171717;
    padding: 30rpx;
    border-radius: 10rpx;
    border: 1rpx solid #222;
    margin: 0px 10rpx;
    .img-box {
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;

      text {
        font-size: 50px;
        color: #323232;
      }
      .des {
        font-size: 13px;
        color: #7e7e7e;
      }
    }
    .delete-button {
      position: absolute;
      top: 0;
      right: 5px;
      // padding: 10px;
      text {
        font-size: 12px; /* 调整 X 字符的大小 */
        color: #FFFFFF; /* 使 X 字符呈现红色 */
      }
    }
  }
}
.image-caption {
    font-size: 2px;
    color: #7e7e7e;
    text-align: center;
    margin-top: 10px;
}

	.item-section {
		padding: 30rpx 30rpx 20rpx;
	}

	.type-box {
		display: flex;
		flex-wrap: wrap;
		padding-left: 30rpx;

		.type-list {
			width: calc(25% - 17rpx);
			margin-right: 20rpx;

			&:nth-child(4n) {
				margin-right: 0;
			}

			.type-list-item {
				display: flex;
				justify-content: center;
				padding: 10rpx 0;
				background-color: #323232;
				border: 1px solid #323232;
				border-radius: 10rpx;
				font-size: 14px;
			}

			.type-list-sel {
				border: 1px solid $yuanyue-color-main;
				background-color: transparent;
				color: $yuanyue-color-main;
			}
		}
	}

	.submit-box {
		display: flex;
		justify-content: center;
		margin: 40rpx 0 20rpx;
		.submit-btn {
			width: 80%;
			padding: 20rpx 0;
			background-color: $yuanyue-color-main;
			color: #323232;
			border-radius: 10rpx;
			display: flex;
			justify-content: center;
		}
	}

	.desc-box {
		display: flex;
		justify-content: center;

		.desc {
			font-size: 14px;
		}
	}

	.result-box {
		
	}
	.result-content {
		.item-content {
			display: flex;
			justify-content: center;
	
			.res-img-box {
				background-color: #323232;
				border-radius: 10rpx;
			}
		}
	}

	.reult-iamge-deal-box {
		.same-redraw-box {
			display: flex;
			flex-wrap: wrap;

			.same-redraw-list {
				width: calc(25% - 17rpx);
				margin-right: 20rpx;

				&:nth-child(4n) {
					margin-right: 0;
				}

				.same-redraw-list-item {
					display: flex;
					justify-content: center;
					padding: 10rpx 0;
					background-color: #323232;
					border-radius: 10rpx;
					font-size: 14px;
				}

				.same-redraw-list-item-sel {
					background-color: $yuanyue-color-main;
					color: #323232;
				}
			}
		}
	}
</style>