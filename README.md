# wc库可以使用命令快捷的请求数据

1.wc

选择是否从缓存读取Y读取N取消 如果没有使用过建议N

2.选择请求方式 GET POST 等.....

3.选择请求头  application/x-www-form-urlencoded  application/json  等

4.输入请求资源路径 也就是url

5.输入参数如果是get可以忽略

6.选择返回格式(默认json) text blob buffer

7.是否缓存 Y 缓存 N 取消 缓存起来可以下次直接使用

成功返回success  

失败error

# 快捷发送请求

wc get 

输入url即可


wc post

输入url

输入参数

Commands:

  get            快捷发起get请求

  post           快捷发起get请求