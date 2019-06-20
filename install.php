
<?php
/**
 * 作用: 用于命令行安装代码到项目目录
 * @作者 翟帅干  zhaishuaigan@qq.com
 * 使用方法: php -r "copy('https://raw.githubusercontent.com/zhaishuaigan/vs/master/install.php', 'vs-setup.php');"
 *          php vs-setup.php
 *          php -r "unlink('vs-setup.php');"
 */

$remote = 'https://raw.githubusercontent.com/zhaishuaigan/vs/master/src/';
$local = __DIR__ . '/vs/';
@mkdir($local, 0777);
@mkdir($local . 'assets/', 0777);
$files = [
    'index.html',
    'admin.php',
    'config.php',
    'assets/favicon.ico',
    'assets/index.css',
    'assets/index.js',
];

foreach ($files as $file) {
    copy($remote . $file, $local . $file);
    echo 'download:' . $remote . $file .' -> ' . $local . $file . "\n";
}
echo 'install ok';