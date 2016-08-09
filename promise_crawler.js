/**
 * Created by wangyongzhi on 16/8/8.
 */

//加载http模块，它的职责是负责创建web服务器，处理http相关的任务等等
var http = require('http')
/*老版本的node.js引入方式是 require('bluebird'),新版本ES6 新特性可以直接引入Promise
*   这里用的是require('bluebird')
* */
var Promise = require('bluebird')
//加载抓取网页模块cheerio
var cheerio = require('cheerio')
//所要抓取的网页
var baseUrl = 'http://www.imooc.com/learn/'
// var url = 'http://www.imooc.com/learn/348'
var videoIds = [348,637,259,197,134,75]

//过滤网页信息得到所需的章节信息
function filterChapters(html) {
    var $ = cheerio.load(html)
    var chapters = $('.chapter')

    //要达到的结构
    // courseData={
    //     title:title,
    //     number:number,
    //     videos:[{
    //         chapterTitle:''
    //         videos：[
    //             title:''
    //             id:''
    //     ]
    //     }]
    // }


    //课程名和学习人数
    var title = $('.pr .hd .l').text()
    var number = parseInt($($('.static-item .meta-value strong')[3]).text().trim(),10)

    var courseData = {
        title: title,
        number: number,
        videos: []
    }
    chapters.each(function (item) {
        var chapter = $(this)
        var chapterTitle = chapter.find('strong').text()
        var videos = chapter.find('.video').children('li')
        var chapterData = {
            chapterTitle : chapterTitle,
            videos : []
        }

        videos.each(function (item) {
            var video = $(this).find('.studyvideo')
            var videoTitle = video.text()
            var id = video.attr('href').split('video/')[1]

            chapterData.videos.push({
                title : videoTitle,
                id : id
            })
        })
        courseData.videos.push(chapterData)
    })
    return courseData
}

//打印所有章节的内容
function printCourseInfo(coursesData) {
    coursesData.forEach(function (courseData) {
        console.log(courseData.number + '人学过' + courseData.title+'\n')
    })
    coursesData.forEach(function (courseData) {
        console.log('###' + courseData.title + '\n')
        courseData.videos.forEach(function (item) {
            var chapterTitle = item.chapterTitle
            console.log(chapterTitle+'\n')

            item.videos.forEach(function (video) {
                console.log('  【' + video.id + '】 ' + video.title )
            })
        })
    })

}

//异步爬取网页
function getPageAsync(url) {
    return new Promise(function (resolve,reject) {
        console.log('正在爬取'+url)

        http.get(url,function (res) {
            var html = ''
            res.on('data',function (data) {
                html += data;
            })

            res.on('end',function () {
                resolve(html)
            })
        }).on('error',function (e) {
            reject(e)
            console.log('Get the course information error!')
        })
    })
}

//存放所有课程的html的一个数组
var fetchCourseArray = []

videoIds.forEach(function (id) {
    fetchCourseArray.push(getPageAsync(baseUrl + id))
})

//多页面数据处理
Promise
    .all(fetchCourseArray)
    .then(function (pages) {
        var coursesData = []
        pages.forEach(function (html) {
            var courses = filterChapters(html)
            coursesData.push(courses)
        })
        //按学习课程人数从大到小排序
        coursesData.sort(function (a,b) {
            return a.number < b.number
        })

        printCourseInfo(coursesData)
    })















