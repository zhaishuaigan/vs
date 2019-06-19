var config = {
    admin: './admin.php',
    monaco: {
        vs: 'https://cdn.bootcss.com/monaco-editor/0.17.0/min/vs',
        theme: 'vs-dark'
    }
};

var vm = new Vue({
    el: '#app',
    data: function () {
        return {
            admin: config.admin,
            editor: null,
            files: [],
            currentPath: [],
            pathList: [],
            openFileList: [],
            currentOpenFile: null,
            viewImage: '',
        };
    },
    created: function () {
        this.createEditor();
        this.loadDir('/');
    },
    methods: {
        createEditor: function () {
            var that = this;
            require.config({ paths: { 'vs': config.monaco.vs } });
            require(["vs/editor/editor.main"], function () {
                that.editor = monaco.editor.create(document.getElementById('editor'), {
                    value: '',
                    language: "markdown",
                    readOnly: true,
                    theme: config.monaco.theme
                });
                that.loadHelp();

                that.editor.addAction({
                    id: 'save',
                    label: '保存',
                    keybindings: [
                        monaco.KeyMod.CtrlCmd | monaco.KeyCode.KEY_S,
                    ],
                    precondition: null,
                    keybindingContext: null,
                    contextMenuGroupId: 'navigation',
                    contextMenuOrder: 1.5,
                    run: function (ed) {
                        that.saveFile();
                        return null;
                    }
                });

                that.editor.onDidChangeModelContent((event) => {
                    that.currentOpenFile.content = that.editor.getValue();
                    that.currentOpenFile.change = true;
                })


                var resize = function () {
                    that.editor.layout({
                        width: document.getElementById('editor').offsetWidth,
                        height: document.getElementById('editor').offsetHeight
                    });
                }

                window.addEventListener('resize', resize);
                resize();

            });
        },
        loadHelp: function () {
            var help = document.getElementById('readme').innerHTML.trim();
            this.editor.updateOptions({
                readOnly: true
            });
            this.editor.setModel(monaco.editor.createModel(help, 'markdown'));
        },
        loadDir: function (path) {
            var that = this;
            var pathArray = path.split('/');
            that.currentPath = [];
            that.pathList = [];
            for (var i in pathArray) {
                if (pathArray[i].length) {
                    that.currentPath.push(pathArray[i]);
                    that.pathList.push({
                        title: pathArray[i],
                        path: '/' + that.currentPath.join('/'),
                    });
                }
            }

            axios.get(config.admin + '?act=getDir&dir=' + path)
                .then(function (res) {
                    that.files = res.data;
                })
                .catch(function (e) {
                    console.log(e);
                })
        },
        getCurrentPath: function () {
            var path = '/' + this.currentPath.join('/') + '/';
            path = path.replace('//', '/');
            return path;
        },
        loadSubDir: function (sub) {
            var path = this.getCurrentPath() + sub + '/';
            this.loadDir(path);
        },
        openFile: function (file) {
            var that = this;
            var path = this.getCurrentPath() + file;

            for (var i in this.openFileList) {
                if (this.openFileList[i].path == path) {
                    this.changeOpenFile(this.openFileList[i]);
                    return;
                }
            }

            var index = path.lastIndexOf(".");
            var ext = 'txt';
            if (index != -1) {
                ext = path.substr(index + 1);
            }

            switch (ext) {
                case 'ico':
                case 'icon':
                case 'jpg':
                case 'jpeg':
                case 'gif':
                case 'png':
                case 'bmp':
                    // 暂不支持编辑图片格式
                    that.viewImage = path;
                    return;
                    break;
            }

            axios.get(config.admin + '?act=getFile&path=' + path)
                .then(function (res) {
                    var item = {
                        path: path,
                        name: file,
                        ext: ext,
                        change: false,
                        content: res.request.responseText
                    };
                    that.openFileList.push(item);
                    that.changeOpenFile(item);
                })
                .catch(function (e) {
                    console.log(e);
                })
        },
        changeOpenFile: function (item) {
            if (!item) {
                this.loadHelp();
                return;
            }
            this.currentOpenFile = item;
            this.editor.updateOptions({
                readOnly: false
            });
            var type = item.ext;
            switch (item.ext) {
                case 'js':
                    type = 'javascript';
                    break;
                case 'md':
                    type = 'markdown';
                    break;
            }

            this.editor.setModel(monaco.editor.createModel(item.content, type));
        },
        saveFile() {
            var that = this;
            if (!that.currentOpenFile) {
                return;
            }
            axios.post(config.admin + '?act=saveFile&path=' + that.currentOpenFile.path,
                {
                    content: that.currentOpenFile.content
                },
                {
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
                    transformRequest: [
                        function (data) {
                            let ret = '';
                            for (let it in data) {
                                ret += encodeURIComponent(it) + '=' + encodeURIComponent(data[it]) + '&';
                            }
                            return ret;
                        }
                    ],
                })
                .then(function (res) {
                    if (res.data != 'ok') {
                        alert(res.data);
                        return;
                    }
                    that.currentOpenFile.change = false;
                })
                .catch(function (e) {
                    console.log(e);
                })
        },
        closeFile: function (item) {
            if (item.change) {
                var ok = window.confirm('此文件有修改, 是否放弃修改?');
                if (!ok) {
                    return;
                }
            }
            var newOpenFileList = [];
            for (var i in this.openFileList) {
                if (this.openFileList[i].path != item.path) {
                    newOpenFileList.push(this.openFileList[i]);
                }
            }
            this.openFileList = newOpenFileList;
            if (this.currentOpenFile.path == item.path) {
                if (newOpenFileList.length) {
                    this.changeOpenFile(newOpenFileList[0]);
                } else {
                    this.changeOpenFile(null);
                }
            }

        },
        onAddDir: function () {
            var that = this;
            var path = window.prompt('请输入要创建的目录名: ', '');
            if (!path.length) {
                return;
            }
            path = this.getCurrentPath() + path;
            axios.get(config.admin + '?act=newDir&path=' + path)
                .then(function (res) {
                    if (res.data != 'ok') {
                        alert(res.data);
                        return;
                    }
                    that.loadDir(that.getCurrentPath());
                })
                .catch(function (e) {
                    console.error('创建目录出错:', e);
                });
        },
        onRenameDir: function (dir) {
            var that = this;
            var oldPath = this.getCurrentPath() + dir;
            var newPath = window.prompt('请输入要新的目录名: ', dir);
            if (!path.length) {
                return;
            }
            newPath = this.getCurrentPath() + newPath;
            axios.get(config.admin + '?act=moveDir&path=' + oldPath + '&newPath=' + newPath)
                .then(function (res) {
                    if (res.data != 'ok') {
                        alert(res.data);
                        return;
                    }
                    that.loadDir(that.getCurrentPath());
                })
                .catch(function (e) {
                    console.error('目录重命名出错:', e);
                });
        },
        onDeleteDir: function (dir) {
            var that = this;
            var path = this.getCurrentPath() + dir;
            var ok = window.confirm('确定要删除这个目录吗?');
            if (!ok) {
                return;
            }
            axios.get(config.admin + '?act=removeDir&path=' + path)
                .then(function (res) {
                    if (res.data != 'ok') {
                        alert(res.data);
                        return;
                    }
                    that.loadDir(that.getCurrentPath());
                })
                .catch(function (e) {
                    console.error('删除目录出错:', e);
                });
        },
        onAddFile: function () {
            var that = this;
            var path = window.prompt('请输入要创建的文件名: ', '');
            if (!path.length) {
                return;
            }
            path = this.getCurrentPath() + path;
            axios.get(config.admin + '?act=newFile&path=' + path)
                .then(function (res) {
                    if (res.data != 'ok') {
                        alert(res.data);
                        return;
                    }
                    that.loadDir(that.getCurrentPath());
                })
                .catch(function (e) {
                    console.error('创建文件出错:', e);
                });
        },
        onRenameFile: function (file) {
            var that = this;
            var oldPath = this.getCurrentPath() + file;
            var newPath = window.prompt('请输入要新的文件名: ', file);
            if (!newPath.length) {
                return;
            }
            newPath = this.getCurrentPath() + newPath;
            axios.get(config.admin + '?act=moveFile&path=' + oldPath + '&newPath=' + newPath)
                .then(function (res) {
                    if (res.data != 'ok') {
                        alert(res.data);
                        return;
                    }
                    that.loadDir(that.getCurrentPath());
                })
                .catch(function (e) {
                    console.error('文件重命名出错:', e);
                });
        },
        onDeleteFile: function (file) {
            var that = this;
            var path = this.getCurrentPath() + file;
            var ok = window.confirm('确定要删除这个文件吗?');
            if (!ok) {
                return;
            }
            axios.get(config.admin + '?act=removeFile&path=' + path)
                .then(function (res) {
                    if (res.data != 'ok') {
                        alert(res.data);
                        return;
                    }
                    that.loadDir(that.getCurrentPath());
                })
                .catch(function (e) {
                    console.error('删除文件出错:', e);
                });
        }

    }
});