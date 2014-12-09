angular.module('chatty')
    .service('modelService', function(settingsService) {
        var modelService = {};

        var threads = [];
        var newThreads = [];
        var posts = {};
        var username = settingsService.getUsername();

        modelService.addThread = function addThread(post, event) {
            var thread = fixThread(post);
            if (event) {
                newThreads.push(thread);
            } else {
                threads.push(thread);
            }
            posts[thread.threadId] = thread;
        };

        modelService.getThreads = function getThreads() {
            return threads;
        };

        modelService.getNewThreads = function getNewThreads() {
            return newThreads;
        };

        modelService.addPost = function addPost(post) {
            var thread = posts[post.threadId];
            var parent = posts[post.parentId];
            if (parent && thread) {
                var fixedPost = fixPost(post, thread);
                updateLineClass(fixedPost, thread);
                updateModTagClass(fixedPost);

                thread.posts.push(fixedPost);

                if (thread.posts.length > 15 && thread.state != 'expanded') {
                    thread.state = truncated;
                }

                thread.replyCount++;
                posts[fixedPost.id] = fixedPost;
            }
        };

        modelService.getPost = function getPost(id) {
            return posts[id];
        };

        modelService.getPostThread = function getPostThread(post) {
            if (post.parentId > 0) {
                return modelService.getPost(post.threadId);
            } else {
                return post;
            }
        };

        modelService.changeCategory = function changeCategory(id, category) {
            var post = posts[id];
            if (post) {
                if (category === 'nuked') {
                    //remove if it's a root post
                    _.pull(threads, post);

                    //recursively remove all children
                    removePost(post);

                    //update reply count
                    countReplies(post);
                } else {
                    post.category = category;
                    updateModTagClass(post);
                }
            }
        };

        modelService.updateTags = function updateTags(updates) {
            _.each(updates, function(update) {
                var post = posts[update.postId];
                if (post) {
                    var tag = _.find(post.lols, {'tag': update.tag});
                    if (tag) {
                        tag.count = update.count;
                    } else {
                        post.lols.push({tag:update.tag, count:update.count});
                    }
                }
            });
        };

        modelService.cleanCollapsed = function cleanCollapsed() {
            settingsService.cleanCollapsed(posts);
        };

        modelService.clear = function clear() {
            while(threads.length) {
                threads.pop();
            }
            posts = {};
        };

        function fixThread(thread) {
            var threadPosts = _.sortBy(thread.posts, 'id');

            //handle root post
            if (thread.posts) {
                var rootPost = _.find(threadPosts, { parentId: 0 });
                _.pull(threadPosts, rootPost);
                thread.id = rootPost.id;
                thread.threadId = rootPost.id;
                thread.parentId = 0;
                thread.author = rootPost.author;
                thread.date = rootPost.date;
                thread.category = rootPost.category;
                thread.body = rootPost.body;
                thread.expirePercent = ((((new Date().getTime()) - new Date(rootPost.date).getTime()) / 3600000) / 18) * 100;
            }
            thread.replyCount = threadPosts.length || 0;
            thread.recent = [];
            thread.posts = [];
            posts[thread.id] = thread;
            fixPost(thread);
            updateModTagClass(thread);

            while(threadPosts.length > 0) {
                var post = threadPosts.shift();

                //various post fixes
                fixPost(post, thread);
                updateModTagClass(post);

                //add to post list
                posts[post.id] = post;

                //create nested replies
                var parent = posts[post.parentId];
                parent.posts.push(post);

                //line coloring
                if (threadPosts.length < 10) {
                    updateLineClass(post, thread);
                }
            }

            //check if it's supposed to be collapsed
            if (settingsService.isCollapsed(thread.threadId)) {
                thread.state = 'collapsed';
            } else if (thread.replyCount > 15) {
                thread.state = 'truncated';
            }

            return thread;
        }

        function fixPost(post, thread) {
            //fix Shacknews posts with article links
            if (post.author === 'Shacknews') {
                post.body = post.body.replace('href="', 'href="http://www.shacknews.com');
            }

            //fix spoiler tags not being clickable
            post.body = post.body.replace(/onclick=[^>]+/gm, 'tabindex="1"');

            //create the one-liner used for reply view
            var stripped = _.unescape(post.body.replace(/(<(?!span)(?!\/span)[^>]+>| tabindex="1")/gm, ''));
            post.oneline = stripped.slice(0, 106) + (stripped.length > 106 ? '...' : '');

            //create sub-post container
            post.posts = post.posts || [];

            //default tags as necessary
            post.lols = post.lols || [];
            _.each(['lol','inf','unf','ugh','wtf'], function(tag) {
                if (!_.find(post.lols, {'tag': tag})) {
                    post.lols.push({ tag: tag });
                }
            });

            //add user class highlight
            if (post.author.toLowerCase() === username.toLowerCase()) {
                post.userClass = 'user_me';
            } else if (thread && post.author.toLowerCase() === thread.author.toLowerCase()) {
                post.userClass = 'user_op';
            }

            return post;
        }

        function updateLineClass(post, thread) {
            thread.recent.push(post);

            if (thread.recent.length > 10) {
                thread.recent.shift();
            }

            _.each(thread.recent, function(recentPost, index) {
                recentPost.lineClass = 'oneline' + (9 - index);
            });
        }

        function updateModTagClass(post) {
            if (post.category === 'informative') {
                post.tagClass = 'postInformative';
            } else if (post.category === 'nws') {
                post.tagClass = 'postNws';
            } else {
                delete post.tagClass;
            }
        }

        function removePost(post) {
            delete posts[post.id];
            _.each(post.posts, removePost);
        }

        function countReplies(post) {
            return _.reduce(post.posts, function(result, subreply) {
                return result + countReplies(subreply) + 1;
            }, 0);
        }

        return modelService;
    });