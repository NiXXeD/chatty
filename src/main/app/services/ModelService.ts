declare var _ : any
import {Injectable} from 'angular2/core'
import * as EmployeeList from '../util/EmployeeList'
import {SettingsService} from './SettingsService'
import {BodyTransformService} from './BodyTransformService'

@Injectable()
export class ModelService {
    private threads = []
    private newThreads = []
    private posts = {}

    constructor(private settingsService:SettingsService,
                private bodyTransformService:BodyTransformService) {
    }

    updateAllThreads() {
        _.each(this.threads, this.updateExpiration)
        //$rootScope.$broadcast('countdown-timer')
        console.log('Would have broadcast countdown-timer here...')
    }

    addThread(post, event) {
        var thread = this.fixThread(post)
        if (event === true) {
            this.newThreads.push(thread)
        } else {
            this.threads.push(thread)
        }
        this.posts[thread.threadId] = thread
        return thread
    }

    getThreads() {
        return this.threads
    }

    getNewThreads() {
        return this.newThreads
    }

    addPost(post, thread) {
        if (!this.posts[post.id]) {
            thread = thread || this.posts[post.threadId]
            var parent = this.posts[post.parentId]
            if (parent && thread) {
                var fixedPost = this.fixPost(post, thread)
                this.updateLineClass(fixedPost, thread)
                this.updateModTagClass(fixedPost)
                fixedPost.parentAuthor = parent.author

                thread.replyCount++

                parent.posts.push(fixedPost)
                this.posts[fixedPost.id] = fixedPost

                return {thread: thread, parent: parent, post: fixedPost}
            }
        }
    }

    getPost(id) {
        return this.posts[id]
    }

    getPostThread(post) {
        if (post.parentId > 0) {
            return this.getPost(post.threadId)
        } else {
            return post
        }
    }

    changeCategory(id, category) {
        var post = this.posts[id]
        if (post) {
            if (category === 'nuked') {
                //remove if it's a root post
                _.pull(this.threads, post)

                //recursively remove all children
                this.removePost(post)

                //update reply count
                this.countReplies(post)
            } else {
                post.category = category
                this.updateModTagClass(post)
                //$rootScope.$broadcast('post-category-change-' + post.id)
                console.log('Would have broadcast post-category-change-' + post.id, 'here')
            }
        }
    }

    cleanCollapsed() {
        this.settingsService.cleanCollapsed(this.posts)
    }

    clear() {
        while (this.threads.length) {
            this.threads.pop()
        }
        this.posts = {}
    }

    private fixThread(thread) {
        var threadPosts = _.sortBy(thread.posts, 'id')

        //handle root post
        if (thread.posts) {
            var rootPost = _.find(threadPosts, {parentId: 0})
            _.pull(threadPosts, rootPost)
            thread.id = rootPost.id
            thread.threadId = rootPost.id
            thread.parentId = 0
            thread.author = rootPost.author
            thread.date = rootPost.date
            thread.category = rootPost.category
            thread.body = rootPost.body
            thread.lols = rootPost.lols
        }
        thread.visible = true
        thread.lastPostId = thread.id
        thread.replyCount = 0
        thread.recent = []
        thread.posts = []
        this.posts[thread.id] = thread
        this.fixPost(thread, null)
        this.updateModTagClass(thread)
        this.updateExpiration(thread)

        while (threadPosts.length > 0) {
            var post = threadPosts.shift()
            this.addPost(post, thread)
        }

        //check if it's supposed to be collapsed
        if (this.settingsService.isCollapsed(thread.threadId)) {
            thread.state = 'collapsed'
            thread.visible = false
        } else if (thread.replyCount > 10) {
            thread.state = 'truncated'
        }

        return thread
    }

    private fixPost(post, thread) {
        //parse body for extra features
        post.body = this.bodyTransformService.parse(post)

        //create sub-post container
        post.posts = post.posts || []

        //add user class highlight
        if (post.author.toLowerCase() === this.settingsService.getUsername().toLowerCase()) {
            post.userClass = 'user_me'
        } else if (thread && post.author.toLowerCase() === thread.author.toLowerCase()) {
            post.userClass = 'user_op'
        } else if (_.contains(EmployeeList, post.author.toLowerCase())) {
            post.userClass = 'user_employee'
        }

        //add last action date
        if (thread) {
            thread.lastPostId = post.id
        }

        return post
    }

    private updateLineClass(post, thread) {
        thread.recent.push(post)

        if (thread.recent.length > 10) {
            var oldPost = thread.recent.shift()
            //$rootScope.$broadcast('post-line-highlight-' + oldPost.id)
            //console.log('Would have broadcast post-line-highlight-' + oldPost.id, 'here')
        }

        _.each(thread.recent, (recentPost, index) => {
            recentPost.lineClass = 'oneline' + (9 - index)
            //$rootScope.$broadcast('post-line-highlight-' + recentPost.id)
            //console.log('Would have broadcast post-line-highlight-' + recentPost.id, 'here')
        })
    }

    private updateModTagClass(post) {
        if (post.category === 'informative') {
            post.tagClass = 'postInformative'
        } else if (post.category === 'nws') {
            post.tagClass = 'postNws'
        } else if (post.author.toLowerCase() === 'shacknews') {
            post.tagClass = 'postFrontpage'
        } else {
            delete post.tagClass
        }
    }

    private updateExpiration(thread) {
        thread.expirePercent = Math.min(((((new Date().getTime()) - new Date(thread.date).getTime()) / 3600000) / 18) * 100, 100)
        if (thread.expirePercent <= 25) {
            thread.expireColor = 'springgreen'
        } else if (thread.expirePercent <= 50) {
            thread.expireColor = 'yellow'
        } else if (thread.expirePercent <= 75) {
            thread.expireColor = 'orange'
        } else {
            thread.expireColor = 'red'
        }
    }

    private removePost(post) {
        delete this.posts[post.id]
        _.each(post.posts, this.removePost)
    }

    private countReplies(post) {
        return _.reduce(post.posts, (result, subreply) => {
            return result + this.countReplies(subreply) + 1
        }, 0)
    }
}
