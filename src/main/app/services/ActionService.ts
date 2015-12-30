declare var _ : any
import {Injectable} from 'angular2/core'
import {ApiService} from './ApiService'
import {ModelService} from './ModelService'
import {SettingsService} from './SettingsService'

@Injectable()
export class ActionService {
    private lastReply

    constructor(private apiService:ApiService,
                private modelService:ModelService,
                private settingsService:SettingsService) {
    }

    setThread(thread) {
        this.lastReply = thread
    }

    login(username, password) {
        this.settingsService.clearCredentials()

        if (username && password) {
            return this.apiService.login(username, password)
                .then(response => {
                    var result = _.get(response, 'data.isValid')
                    if (result) {
                        this.settingsService.setCredentials(username, password)
                    }
                    return result
                })
        } else {
            return Promise.reject('')
        }
    }

    logout() {
        this.settingsService.clearCredentials()

        //close reply boxes
        var threads = this.modelService.getThreads()
        _.each(threads, this.closeReplyBox)
    }

    reflowThreads() {
        var threads = this.modelService.getThreads()
        var tempThreads = [].concat(threads)
        threads.length = 0

        var sorted = _.sortBy(tempThreads, 'lastPostId')
        while (sorted.length) {
            var thread = sorted.pop()

            if (thread.expirePercent < 100 || thread.pinned) {
                if (this.settingsService.isCollapsed(thread.id)) {
                    if (thread.state !== 'collapsed') {
                        thread.state = 'collapsed'
                        thread.visible = false
                        //$rootScope.$broadcast('thread-collapse' + thread.id)
                        console.log('Would have broadcast thread-collapse here')
                    }
                    threads.push(thread)
                } else {
                    if (thread.replyCount > 10 && thread.state !== 'truncated') {
                        thread.state = 'truncated'
                        //$rootScope.$broadcast('thread-truncate' + thread.id)
                        console.log('Would have broadcast thread-truncate here')
                    } else if (thread.state === 'collapsed') {
                        delete thread.state
                        //$rootScope.$broadcast('thread-collapse' + thread.id)
                        console.log('Would have broadcast thread-collapse here')
                    }
                    this.collapseReply(thread)
                    this.closeReplyBox(thread)

                    if (thread.pinned) {
                        threads.unshift(thread)
                    } else {
                        threads.push(thread)
                    }
                }
            } else {
                //removing thread from model
                this.settingsService.uncollapseThread(thread.id)
            }
        }

        //new threads in at top after reflow
        var newThreads = this.modelService.getNewThreads()
        while (newThreads.length) {
            threads.unshift(newThreads.pop())
        }
    }

    togglePinThread(thread) {
        if (thread.pinned) {
            thread.pinned = false

            //update local storage
            this.settingsService.unpinThread(thread.id)
        } else {
            thread.pinned = true

            //update local storage
            this.settingsService.pinThread(thread.id)
        }
    }

    collapseThread(thread) {
        //collapse thread
        thread.visible = false
        this.closeReplyBox(thread)
        thread.state = 'collapsed'
        //$rootScope.$broadcast('thread-collapse' + thread.id)
        console.log('Would have broadcast thread-collapse here')

        //update local storage
        this.settingsService.collapseThread(thread.id)
    }

    expandThread(thread) {
        thread.state = 'expanded'
        //$rootScope.$broadcast('thread-collapse' + thread.id)
        //$rootScope.$broadcast('thread-truncate' + thread.id)
        console.log('Would have broadcast thread-collapse' + thread.id)
        console.log('Would have broadcast thread-truncate' + thread.id)

        //update local storage
        this.settingsService.uncollapseThread(thread.id)
    }

    expandReply(post) {
        var thread = this.resetThread(post, true)

        //expand
        thread.currentComment = post
        this.lastReply = post
        post.viewFull = true

        //$rootScope.$broadcast('reply-collapse' + post.id)
        console.log('Would have broadcast reply-collapse' + post.id)
    }

    private resetThread(post, closeComment) {
        var thread = this.modelService.getPostThread(post)

        //close any other actions
        this.expandThread(thread)
        this.closeReplyBox(thread)
        if (closeComment) {
            this.collapseReply(thread)
        }
        return thread
    }

    private collapseReply(thread) {
        if (thread.currentComment) {
            var id = thread.currentComment.id
            delete thread.currentComment.viewFull

            //$rootScope.$broadcast('reply-collapse' + id)
            console.log('Would have broadcast reply-collapse' + id)
        }
    }

    previousReply() {
        if (this.lastReply) {
            var parent = this.modelService.getPost(this.lastReply.parentId)
            if (parent) {
                var index = parent.posts.indexOf(this.lastReply)
                if (index === 0 && parent.parentId > 0) {
                    this.expandReply(parent)
                } else if (index > 0) {
                    var next = parent.posts[index - 1]
                    var last = this.findLastReply(next)
                    this.expandReply(last)
                }
            }
        }
    }

    private findLastReply(post) {
        if (post.posts.length) {
            return this.findLastReply(_.last(post.posts))
        } else {
            return post
        }
    }

    nextReply() {
        if (this.lastReply) {
            this.processNextReply(this.lastReply, false)
        }
    }

    private processNextReply(post, skipChildren) {
        if (!skipChildren && post.posts.length) {
            this.expandReply(post.posts[0])
        } else {
            var parent = this.modelService.getPost(post.parentId)
            if (parent) {
                var index = parent.posts.indexOf(post)
                if (index + 1 < parent.posts.length) {
                    var next = parent.posts[index + 1]
                    this.expandReply(next)
                } else {
                    this.processNextReply(parent, true)
                }
            }
        }
    }

    collapsePostReply(post) {
        if (post) {
            this.resetThread(post, true)
        } else if (this.lastReply) {
            this.collapsePostReply(this.lastReply)
            this.lastReply = null
        }
    }

    openReplyBox(post) {
        var thread = this.resetThread(post, false)

        //open reply
        thread.replyingToPost = post
        post.replying = true
        //$rootScope.$broadcast('post-reply' + thread.id)
        console.log('Would have broadcast post-reply' + thread.id)
    }

    closePostReplyBox(post) {
        var thread = this.modelService.getPostThread(post)
        this.closeReplyBox(thread)
    }

    private closeReplyBox(thread) {
        if (thread.replyingToPost) {
            delete thread.replyingToPost.replying
            delete thread.replyingToPost
            //$rootScope.$broadcast('post-reply' + thread.id)
            console.log('Would have broadcast post-reply' + thread.id)
        }
    }
}
