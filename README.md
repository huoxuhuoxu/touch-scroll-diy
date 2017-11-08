#### touch-scroll-diy

##### initial
	
	npm install touch-scroll-diy --save


##### use

	import TouchScroll from "touch-scroll-diy";

	let myScroll = new TouchScroll("body");


##### rule

	new TouchScroll(argv): 建立滑动容器
		argv: 传入一个querySelector可识别的字符串
		此字符串对应的dom元素,需要overflow: hidden; 作为实际的滑动容器的父级
		初始化的时候,自动寻找上述dom中第一个子元素作为滑动容器
	myScroll.refresh: 容器刷新
	myScroll.destroy: 容器销毁

[演示项目](https://github.com/huoxuhuoxu/touch-scroll-diy)
