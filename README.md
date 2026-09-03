# 3D个人作品集网站

这是一个使用 Vue 3、Vite 和 Three.js 制作的单页作品集网站，包含滚动驱动的 3D 首页、个人简介、Github仓库获取、Dev Community博客获取，分类和分页实现。

## 环境要求

- Node.js：`^20.19.0` 或 `>=22.12.0`
- npm：随 Node.js 安装即可

可以先确认本机版本：

```bash
node --version
npm --version
```

## 本地启动

进入项目目录后安装锁定版本的依赖：

```bash
npm ci
```

启动开发服务器：

```bash
npm run dev
```

终端会显示本地地址，通常是：

```text
http://localhost:5173/
```

如果需要让同一局域网中的其他设备访问：

```bash
npm run dev -- --host 0.0.0.0
```

开发服务器支持热更新，保存源文件后浏览器会自动刷新。

## 构建与预览

生成生产版本：

```bash
npm run build
```

构建结果位于 `dist/`。本地预览生产版本：

```bash
npm run preview
```

## 部署到 Cloudflare Pages

这个项目是纯静态 Vite 网站，生产文件会输出到 `dist/`，可以直接部署到 Cloudflare Pages。

### 方式一：连接 Git 自动部署（推荐）

1. 把项目推送到 GitHub 或 GitLab。
2. 登录 Cloudflare Dashboard，进入 **Workers & Pages**。
3. 选择 **Create application → Pages → Import an existing Git repository**。
4. 选择这个项目的仓库。
5. 使用以下构建配置：

| Cloudflare 配置 | 值 |
| --- | --- |
| Framework preset | `Vite` |
| Build command | `npm run build` |
| Build output directory | `dist` |
| Root directory | 留空；只有项目位于 monorepo 子目录时才填写 |

在 **Environment variables** 中增加：

```text
NODE_VERSION=22.16.0
```

该版本满足当前 Vite 的 Node.js 要求。保存并部署后，网站会获得一个 `项目名.pages.dev` 地址。之后每次推送生产分支，Cloudflare 都会自动重新构建和发布；其他分支和 Pull Request 可以生成预览部署。

### 方式二：使用 Wrangler 手动上传

先构建网站：

```bash
npm ci
npm run build
```

第一次使用时登录 Cloudflare，并创建 Pages 项目：

```bash
npx wrangler login
npx wrangler pages project create
```

上传 `dist/`：

```bash
npx wrangler pages deploy dist --project-name=my-portfolio
```

把 `my-portfolio` 替换成实际的 Cloudflare Pages 项目名称。后续发布只需要重新构建并再次执行上传命令：

```bash
npm run build
npx wrangler pages deploy dist --project-name=my-portfolio
```

如需部署成预览分支：

```bash
npx wrangler pages deploy dist --project-name=my-portfolio --branch=preview
```

### 部署方式注意事项

- 创建 Pages 项目时应先决定使用 Git 集成还是 Direct Upload；同一个项目之后不能在这两种模式之间切换，需要切换时必须新建 Pages 项目。
- 也可以在 Cloudflare Dashboard 使用 Drag and drop，上传整个 `dist/` 文件夹，但不建议把源码目录直接上传。
- 当前网站使用页面锚点，没有 Vue Router 路由，因此不需要额外配置 `_redirects`。
- 自定义域名可在 Pages 项目的 **Custom domains** 页面绑定。
- Cloudflare 官方文档：[Vite 部署](https://developers.cloudflare.com/pages/framework-guides/deploy-a-vite3-project/)、[Git 集成](https://developers.cloudflare.com/pages/get-started/git-integration/)、[Direct Upload](https://developers.cloudflare.com/pages/get-started/direct-upload/)。

## 常用配置位置

| 要修改的内容 | 文件 | 说明 |
| --- | --- | --- |
| 网站标志、导航、作品区标题、详情标签、页脚文字 | `src/data/siteConfig.js` | 集中管理大部分界面文案 |
| 姓名、职位、所在地、邮箱、电话、个人介绍、技能 | `src/data/profile.js` | About 区和 3D 名牌、手机都会使用这些资料 |
| 首页主标题和滚动提示 | `src/components/HeroScene.vue` | 当前包含 `Selected films`、`Shearmine`、`Scroll to enter` 等文字 |
| 作品资料 | `src/data/projects/*.md` | 每个 Markdown 文件代表一个作品 |
| 每页显示数量 | `src/App.vue` | 修改 `const perPage = 6` |
| 全站颜色、排版、响应式布局和动画 | `src/styles.css` | 顶部的 CSS 变量控制主色 |
| 头像 | `public/assets/avatar.jpg` | 可直接替换同名文件，或修改 `profile.image` |
| 作品图片 | `public/assets/projects/` | 在作品 Markdown 中使用 `/assets/projects/文件名` 引用 |
| 网站图标 | `public/favicon.svg` | 浏览器标签页图标 |
| 首页 3D 场景 | `src/three/createPortfolioScene.js` | 镜头路径、场景动画和渲染逻辑 |
| 首页 3D 物件 | `src/three/createDirectorSet.js` | 导演场景物件 |
| About 3D 名牌和手机 | `src/three/createAboutObjects.js` | 名牌、头像纹理和手机交互 |

## 修改个人资料

编辑 `src/data/profile.js`：

```js
export const profile = {
  image: '/assets/avatar.jpg',
  name: 'Yi Txuan',
  role: 'Java Developer',
  location: 'Kuala Lumpur, Malaysia',
  email: 'yitxuanyou506',
  phone: '+6016-4197498',
  availability: 'Available for selected productions',
  intro:
    'a Computer Science and Technology student at Beijing Institute of Technology.',
  approach:
    'I’m passionate about technology and enjoy exploring new ideas in computer science. Outside of my studies, I love singing and playing badminton, which help me relax and stay active.',
  disciplines: ['Java', 'Spring Boot & Spring Cloud', 'MySQL & Redis', 'HTML + CSS + JavaScript'],
  githubUsername: 'YYT-0901',
  devCommunityUsername: 'yyt0901',
  resume: '/assets/resume/resume.pdf',
}
```

头像有两种修改方式：

1. 直接替换 `public/assets/avatar.jpg`，保持文件名不变。
2. 把新图片放进 `public/assets/`，再修改 `profile.image`，例如 `/assets/new-avatar.webp`。

简历上传：
1. 把简历放进 `public/assets/`，再修改 `profile.resume`，例如 `/assets/resume.pdf`。

## 修改网站文案

大部分文字位于 `src/data/siteConfig.js`：

- `brand`：左上角标志和无障碍标签。
- `nav`：顶部导航文字。
- `portfolio`：作品区标题和介绍。
- `about`：个人简介区标题和提示文字。
- `projectCard`：作品详情标签、按钮文字和默认值。
- `footer`：页脚版权和返回顶部文字。

## 修改颜色和滚动长度

全站主色位于 `src/styles.css` 开头：

```css
:root {
  --blue: #2d76a5;
  --blue-dark: #14496d;
  --cream: #272e38;
  --ink: #57dae3;
  --orange: #ff5b43;
}
```

首页滚动动画长度由 `.hero-scroll` 控制：

```css
.hero-scroll {
  height: 500vh;
}
```

移动端还有独立的 `430vh` 设置。修改滚动长度后，应同时检查桌面和手机尺寸下的动画节奏。

## 项目结构

```text
my-portfolio/
├─ public/
│  ├─ assets/
│  │  ├─ avatar.jpg
│  │  └─ projects/
│  └─ favicon.svg
├─ src/
│  ├─ components/
│  ├─ data/
│  │  ├─ profile.js
│  │  └─ siteConfig.js
│  ├─ three/
│  ├─ App.vue
│  ├─ main.js
│  └─ styles.css
├─ index.html
├─ package.json
└─ vite.config.js
```

## 修改后的检查流程

```bash
npm run build
npm run preview
```

建议至少检查：

- 首页 3D 动画和滚动进度是否正常。
- 进度结束后顶部导航是否出现背景色。
- About 名牌、头像、联系方式和手机点击交互是否正常。
- 分类筛选、分页、作品详情和关闭按钮是否正常。
- 所有封面、视频链接和 iframe 是否能加载。
- 桌面和手机尺寸下是否有文字溢出或布局错位。
