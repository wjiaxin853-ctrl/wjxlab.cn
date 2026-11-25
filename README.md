# 王佳鑫 · 个人简历与作品集

王佳鑫的个人网站，汇集计算机视觉、文档智能与边缘部署相关的工作经历、项目、教育背景和研究成果。

[在线预览](https://106.52.107.206/)

## 项目作品

- **工业钢筋实时计数** · 用改进的 YOLOv8 检测钢筋端面，支持仓储现场在 PDA 上实时计数。
- **EasyPPT** · 通过手势控制演示与创作的交互平台。
- **手写数字检测与识别** · 从实时画面中定位手写数字并显示识别结果。

## 本地预览

站点使用原生 HTML、CSS 和 JavaScript。克隆仓库后，可以用 Python 3 启动本地静态服务器。

```bash
git clone https://github.com/wjiaxin853-ctrl/wjxlab.cn.git
cd wjxlab.cn
python3 -m http.server 8000 --bind 127.0.0.1
```

启动后打开 [http://127.0.0.1:8000/](http://127.0.0.1:8000/)。

## 目录说明

| 文件 | 用途 |
| --- | --- |
| [`index.html`](index.html) | 页面结构、简历内容和项目资料 |
| [`style.css`](style.css) | 深色主题、响应式布局和打印样式 |
| [`site.js`](site.js) | Canvas 粒子背景、鼠标和滚动交互 |
| [`assets/`](assets/) | 站点图标和项目演示截图 |

修改简历和项目内容时编辑 `index.html`。部署时，将上表中的文件和目录放到静态站点的发布根目录。
