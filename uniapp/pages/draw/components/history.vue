<template>
  <view class="content">
	 <view class="no-data" v-if="data.length === 0">
			<text>暂无绘图历史数据</text>
		</view>
    <view class="card" v-else v-for="(item, index) in data" :key="index">
      <image class="card-image" @click="clickImg(item.task_info.image_url)" :src="item.task_info.image_url" mode="aspectFill"></image>
      <view class="card-content">
        <text class="content-text">任务id：{{item.task_id}}</text>
        <text class="content-text">操作类型：{{item.action}}</text>
        <text class="content-text" v-if="item.base_action == 'IMAGINE'||item.action=='IMAGINE'">提示词：{{item.task_info.prompt}}</text>
        <text class="content-text" style="font-size: 15px;">生成时间：{{item.ctime}}</text>
				<view class="btn-group">
					<button class="card-btn" @click="goDetail(item)" >查看</button>
					<button class="card-btn" @click="confirmDelete(index)">删除</button>
				</view>
      </view>
    </view>
  </view>
</template>

<script>
import {setStorage} from "@/common/utils.js"
import {timestampToDateTime} from "@/common/utils.js"
import {mapGetters} from 'vuex';
import {
	getUserRecordList
} from "@/api/api.js"
export default {
  data() {
    return {
      data: []
    }
  },
	created() {
		
	},
	computed:{
		...mapGetters(['token']),
	},
	mounted() {
	},
	methods:{
		initData(data) {
			this.data = []
			if(this.token) {
				getUserRecordList().then(res=>{
				  res.map(item=>{
						if(item.task_status == 'SUCCESS'||item.task_status=='IN_PROGRESS') {
							item.task_info = JSON.parse(item.task_json)
						} else {
							item.task_info = {
								image_url:''
							}
						}
					})
					this.data = res
				})
			}

		},
		timestampToDateTime,
		confirmDelete(index) {
			uni.showModal({
				title: '提示',
				content: '确定要删除此次绘画记录吗?',
				success: (res) => {
					if (res.confirm) {
						this.data.splice(index, 1)
						setStorage('taskList',this.data)
					}
				}
			})
    },
		goDetail(item) {
			this.$emit('toDetail',item)
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
	}
}
</script>

<style>
.content {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
}
.btn-group {
  display: flex;
  justify-content: space-between;
}
.no-data {
	  display: flex;
	  justify-content: center;
	  align-items: center;
	  height: 100vh;
	  font-size: 18px;
	  color: #888;
		width: 100%;
}

.card-btn {
	display: flex;  /* 设置按钮为 flex 容器 */
	align-items: center;  /* 在垂直方向上居中文本 */
	justify-content: center;  /* 在水平方向上居中文本 */
  padding: 0px 10px;
	background-color:#F8D849;
	color: #323232;
  border: none;
  border-radius: 5px;
  width: 45%;
  text-align: center;
	font-size: 15px;
}
.card {
  width: 95%;
	margin: 20px auto 15px; /* top and bottom margin are 0, left and right margins are auto */
  display: flex;
  border: 1px solid #F8D849;
  box-shadow: 0px 0px 10px rgba(0,0,0,0.1);
  border-radius: 10px;
  overflow: hidden;
}

.card-image {
  width: 40%;
  height: 310rpx;
  object-fit: contain;
}
@media screen and (min-width: 768px) {
  .card-image {
    height: 620rpx; /* 设置PC端的高度 */
  }
	.card{
		width: 50%;
	}
}
@media screen and (max-width: 768px) {
  .content-text {
    max-width: 30ch; /* 在手机端，限制字符数为30 */
		white-space: nowrap;  /* 不允许文本自动换行 */
		overflow: hidden;     /* 隐藏超出容器的文本 */
		text-overflow: ellipsis; /* 超出部分显示为省略号 */
  }
	.card-btn {
		font-size: 13px;
	}
}
.card-content {
	display: inline-grid;
  width: 60%;
  padding: 10px 0 10px 10px;
}

.content-text {
  margin-bottom: 5px;

}
</style>
