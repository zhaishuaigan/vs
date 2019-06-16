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
            leftWidth: 300,
            editor: null,
            files: [],
            currentPath: [],
            pathList: [],
            openFileList: [],
            currentOpenFile: null,
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
                    value: document.getElementById('readme').innerHTML.trim(),
                    language: "markdown",
                    readOnly: true,
                    theme: config.monaco.theme
                });

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
        loadDir: function (path) {
            var that = this;
            var pathArray = path.split('/');
            that.currentPath = [];
            that.pathList = [];
            for (var i in pathArray) {
                if (pathArray[i].length) {
                    console.log('pathArray[i]', pathArray[i]);
                    that.currentPath.push(pathArray[i]);
                    that.pathList.push({
                        title: pathArray[i],
                        path: '/' + that.currentPath.join('/'),
                    });
                }
            }

            console.log('path', path);

            axios.get(config.admin + '?act=getDir&dir=' + path)
                .then(function (res) {
                    that.files = res.data;
                })
                .catch(function (e) {
                    console.log(e);
                })
        },
        loadSubDir: function (sub) {
            var path = '/' + this.currentPath.join('/') + '/' + sub + '/';
            path = path.replace('//', '/');
            this.loadDir(path);
        },
        openFile: function (file) {
            var that = this;
            var path = '/' + this.currentPath.join('/') + '/' + file;
            path = path.replace('//', '/');

            for (var i in this.openFileList) {
                if (this.openFileList[i].path == path) {
                    this.changeOpenFile(this.openFileList[i]);
                    return;
                }
            }

            var index = path.lastIndexOf(".");
            var ext = path.substr(index + 1);
            console.log(ext);

            axios.get(config.admin + '?act=getFile&path=' + path)
                .then(function (res) {
                    var item = {
                        path: path,
                        name: file,
                        ext: ext,
                        change: false,
                        content: res.data
                    };
                    that.openFileList.push(item);
                    that.changeOpenFile(item);
                })
                .catch(function (e) {
                    console.log(e);
                })
        },
        changeOpenFile: function (item) {
            this.currentOpenFile = item;
            this.editor.updateOptions({
                readOnly: false
            });
            // this.editor.setValue(item.content);

            var type = item.ext;
            switch (item.ext) {
                case 'js':
                    type = 'javascript';
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
                .then(function () {
                    that.currentOpenFile.change = false;
                })
                .catch(function (e) {
                    console.log(e);
                })
        }

    }
});