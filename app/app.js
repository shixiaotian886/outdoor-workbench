/* ===================== 云端配置 ===================== */
const CLOUD_BASE = '../cloud-config'; // 从app目录到cloud-config的相对路径
const CLOUD_FILES = ['calendar','banned-words','timeline','remix-methods','comments','topics','hots','reviews','hot-bgm','scripts'];

/* ===================== 数据存储 ===================== */
const LS = { tasks:'tw_tasks_v2', hots:'tw_hot_v2', reviews:'tw_review_v2' };
const load = (k, def) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : def; } catch { return def; } };
const save = (k, v) => localStorage.setItem(k, JSON.stringify(v));
const uid = () => Math.random().toString(36).slice(2, 9);

const $ = (s, p=document) => p.querySelector(s);
const $$ = (s, p=document) => [...p.querySelectorAll(s)];

/* ===================== CloudSync ===================== */
const CloudSync = {
  syncStatus: 'idle', // 'syncing' | 'synced' | 'offline'

  async fetchConfig(name) {
    try {
      const url = `${CLOUD_BASE}/${name}.json`;
      const resp = await fetch(url, { cache: 'no-cache' });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const data = await resp.json();
      const cached = load(`cloud_cache_${name}`, null);
      if (cached && cached.version && data.version && cached.version >= data.version) {
        return cached.data;
      }
      const entry = { version: data.version || 0, data: data.data || data, cachedAt: Date.now() };
      save(`cloud_cache_${name}`, entry);
      return entry.data;
    } catch (e) {
      const cached = load(`cloud_cache_${name}`, null);
      return cached ? cached.data : null;
    }
  },

  async syncAll() {
    if (this.syncStatus === 'syncing') return;
    this.syncStatus = 'syncing';
    this._updateIcon();
    try {
      for (const name of CLOUD_FILES) {
        await this.fetchConfig(name);
      }
      this.syncStatus = 'synced';
    } catch (e) {
      this.syncStatus = 'offline';
    }
    this._updateIcon();
    return this.syncStatus;
  },

  getCached(name) {
    const entry = load(`cloud_cache_${name}`, null);
    return entry ? entry.data : null;
  },

  _updateIcon() {
    const el = $('#syncIcon');
    if (!el) return;
    const icons = { idle: '☁️', syncing: '⏳', synced: '✅', offline: '⚠️' };
    const titles = { idle: '点击同步云端配置', syncing: '同步中…', synced: '云端已同步', offline: '离线（使用本地缓存）' };
    el.textContent = icons[this.syncStatus] || '☁️';
    el.title = titles[this.syncStatus] || '点击同步云端配置';
    el.style.cursor = this.syncStatus === 'syncing' ? 'default' : 'pointer';
  }
};

/* 同步状态图标点击事件 */
document.addEventListener('DOMContentLoaded', () => {
  const syncIcon = $('#syncIcon');
  if (syncIcon) {
    syncIcon.addEventListener('click', () => {
      if (CloudSync.syncStatus !== 'syncing') CloudSync.syncAll();
    });
  }
});

/* ===================== 种子数据 ===================== */

/* 今日时间表 */
const timelineSlots = [
  { time:'09:00', desc:'看季节日历 + 评论区挖痛点，定今日选题', tip:'查内容日历页面，确定今天该发什么' },
  { time:'09:15', desc:'写文案 / 拍素材 / 剪视频', tip:'小红书图文优先，抖音视频复用素材' },
  { time:'10:30', desc:'📕 小红书发布（黄金时段 8-10 点）', tip:'标题关键词前置，5-8个标签含长尾词' },
  { time:'12:00', desc:'🎵 抖音发布（午高峰 11-13 点）', tip:'前3秒钩子，3-5个标签+热门话题' },
  { time:'14:00', desc:'找热点：抖音榜+小红书话题+巨量算数', tip:'10分钟快速扫，选1个可二创的' },
  { time:'14:15', desc:'二创：BGM借势 / 话题借势 / 结构复刻 / 反差', tip:'见热点页的二创方法速查' },
  { time:'15:00', desc:'二创内容发布', tip:'同内容双平台发，但文案和剪辑分开' },
  { time:'19:00', desc:'回复评论 + 私信引流到微信群', tip:'每条评论都是选题金矿，顺手记到选题表' },
  { time:'22:00', desc:'数据复盘 + 记入复盘表', tip:'2h初速看互动率，24h终值看播放量' },
];

/* 今日选题决策表 */
const seedTopics = () => [
  { id:uid(), name:'坝上草原 2 日游组队', from:'季节日历', scores:{season:5,pain:4,material:5,hook:5,trend:4}, hook:'北京40°C？2小时逃到20°C草原，这周末15人已报名' },
  { id:uid(), name:'北京周边溯溪路线 Top5', from:'评论区', scores:{season:5,pain:5,material:3,hook:4,trend:3}, hook:'别再问我"有水的地方"了，这5条溯溪路线直接收藏' },
  { id:uid(), name:'第一次露营需要带什么', from:'评论区', scores:{season:4,pain:5,material:4,hook:4,trend:3}, hook:'300块搞定第一次露营，装备清单+我们免费借的装备' },
  { id:uid(), name:'周末 Citywalk 组队：胡同+咖啡', from:'热点借势', scores:{season:4,pain:4,material:5,hook:4,trend:5}, hook:'Citywalk火了？北京这3条路线我们每周都组队走' },
];

/* 评论区挖宝 */
const seedComments = () => [
  { q:'"有儿童能去的路线吗"', topic:'亲子友好路线 Top5' },
  { q:'"没有装备怎么办"', topic:'新手装备清单 + 我们能借的' },
  { q:'"安全吗？有没有领队"', topic:'我们的安全流程 + 领队资质' },
  { q:'"怎么报名？多少钱"', topic:'报名流程 + 费用明细公开' },
  { q:'"一个人去会不会尴尬"', topic:'看看往期合影，都是一个人来的' },
  { q:'"腿脚不好有轻松的路线吗"', topic:'零难度入门路线推荐' },
];

/* 二创方法速查 */
const remixMethods = [
  { tag:'⏱ 约5分钟', title:'BGM 借势', desc:'爆款BGM + 自己往期素材。剪映同款音乐，套徒步/露营/合影素材，加3-5句字幕点题', time:'5 分钟' },
  { tag:'⚡ 常用', title:'话题借势', desc:'蹭热门话题标签，内容原创。看到#打工人周末 热 → 做「北京出发2小时，躲进山里」', time:'10 分钟' },
  { tag:'🎯 推荐', title:'结构复刻', desc:'拆爆款的结构，填自己的料。数字+日常+感悟 → 带过N个人爬过N座山+往期合影+领队感悟', time:'15 分钟' },
  { tag:'💡 爆款利器', title:'反差二创', desc:'对着热点反向输出。人山人海 → 没人知道的同款风景。装备2万 → 300块搞定。被坑 → 跟我们走不踩坑', time:'15 分钟' },
];

/* 北京户外年度内容日历 - 12 个月，每月含路线+双平台文案 */
const calendarData = [
  {
    month:'1月', theme:'冰瀑·雪景·温泉徒步',
    routes:[
      { name:'龙庆峡冰灯节', xhsTitle:'❄️ 北京出发1.5h｜闯入冰雪奇缘现场，龙庆峡冰灯太震撼了', xhsTags:'#龙庆峡 #北京冰灯 #北京周末 #户外组队', dyTitle:'北京出发1.5h，龙庆峡冰灯，美到窒息！', dyTags:'#龙庆峡 #北京冰雪 #周末去哪', dyHook:'第1秒：冰灯全景航拍' },
      { name:'白河峡谷冰瀑徒步', xhsTitle:'🧊 北京周边宝藏冰瀑！白河峡谷徒步，拍出人生照片', xhsTags:'#白河峡谷 #冰瀑徒步 #北京户外 #组队', dyTitle:'白河峡谷冰瀑徒步，北京冬天值得去！', dyTags:'#白河峡谷 #冰瀑 #徒步', dyHook:'第1秒：冰瀑特写+脚步声' },
      { name:'古北水镇雪景·温泉', xhsTitle:'🏮 北京下雪了！古北水镇雪景+温泉，周末组队中', xhsTags:'#古北水镇 #北京雪景 #温泉 #周末组队', dyTitle:'下雪的古北水镇，才是北京冬天该有的样子！', dyTags:'#古北水镇 #雪景 #温泉', dyHook:'第1秒：无人机穿雪而过' },
    ]
  },
  {
    month:'2月', theme:'春节周边游·早春探路',
    routes:[
      { name:'崇礼滑雪 2日', xhsTitle:'🏂 北京出发3h｜崇礼滑雪组队，新手友好，装备可租', xhsTags:'#崇礼滑雪 #北京滑雪 #新手友好 #组队', dyTitle:'崇礼滑雪，北京出发3小时，这周末发车！', dyTags:'#崇礼 #滑雪 #北京周末', dyHook:'第1秒：第一视角滑行+雪板声' },
      { name:'京郊温泉一日', xhsTitle:'♨️ 春节不想走远？京郊温泉一日，泡汤+农家菜，惬意', xhsTags:'#京郊温泉 #春节出游 #北京周末 #组队', dyTitle:'春节不远行，京郊温泉一日，泡着看雪！', dyTags:'#温泉 #京郊 #春节', dyHook:'第1秒：热气升腾慢镜头' },
      { name:'居庸关长城早春', xhsTitle:'🏯 2月居庸关长城｜人少景美，早春徒步正合适', xhsTags:'#居庸关 #长城徒步 #北京户外 #淡季', dyTitle:'2月的长城才叫长城！居庸关早春徒步，几乎没人！', dyTags:'#居庸关 #长城 #早春', dyHook:'第1秒：空无一人的长城全景' },
    ]
  },
  {
    month:'3月', theme:'山桃花·轻徒步·春日唤醒',
    routes:[
      { name:'居庸关花海列车', xhsTitle:'🌸 一年只美2周！居庸关花海+S2列车，北京春日限定', xhsTags:'#居庸关花海 #S2列车 #北京春天 #组队', dyTitle:'北京春天必看！居庸关花海列车，一年只美2周！', dyTags:'#居庸关 #花海 #S2列车', dyHook:'第1秒：列车穿花海慢镜头' },
      { name:'平谷桃花海', xhsTitle:'🌺 22万亩桃花开了！平谷桃花海徒步+野餐，周末组队', xhsTags:'#平谷桃花 #北京花海 #春日徒步 #组队', dyTitle:'北京22万亩桃花开了，平谷桃花海徒步组队中！', dyTags:'#平谷 #桃花 #春天', dyHook:'第1秒：无人机俯瞰粉色花海' },
      { name:'玉渊潭樱花季', xhsTitle:'🌸 玉渊潭樱花季来了！避开人流攻略+出片机位分享', xhsTags:'#玉渊潭 #樱花 #北京赏花 #攻略', dyTitle:'玉渊潭樱花开了，但90%的人都挤错了地方！', dyTags:'#玉渊潭 #樱花 #攻略', dyHook:'第1秒：人流对比+樱花特写' },
    ]
  },
  {
    month:'4月', theme:'杏花·杜鹃·露营季开启',
    routes:[
      { name:'延庆百里画廊', xhsTitle:'🖼️ 北京宝藏自驾路！百里画廊春天版，沿途全是画', xhsTags:'#百里画廊 #延庆 #北京自驾 #组队', dyTitle:'北京宝藏自驾路！延庆百里画廊，春天全是画！', dyTags:'#百里画廊 #延庆 #自驾', dyHook:'第1秒：车窗视角公路大片' },
      { name:'海坨山露营开季', xhsTitle:'⛺ 2026露营季开启！海坨山谷帐篷+星空，组队中', xhsTags:'#海坨山 #露营 #星空 #北京露营 #组队', dyTitle:'海坨山露营季开了！北京出发2.5h，帐篷+星空！', dyTags:'#海坨山 #露营 #星空', dyHook:'第1秒：日落+帐篷亮灯延时' },
      { name:'箭扣长城野长城', xhsTitle:'🧗 箭扣长城｜北京很野的长城段，有胆来组队', xhsTags:'#箭扣长城 #野长城 #北京户外 #徒步', dyTitle:'北京很野的长城！箭扣，敢来的扣1！', dyTags:'#箭扣 #长城 #徒步', dyHook:'第1秒：第一人称攀爬视角' },
    ]
  },
  {
    month:'5月', theme:'五一长线·高山草甸·草原',
    routes:[
      { name:'坝上草原 2日', xhsTitle:'🐴 五一去哪？坝上草原2日游组队：骑马+篝火+星空', xhsTags:'#坝上草原 #五一去哪 #骑马 #篝火 #组队', dyTitle:'五一坝上草原2日游，骑马篝火星空，15人发车！', dyTags:'#坝上草原 #五一 #骑马', dyHook:'第1秒：万马奔腾+篝火燃起' },
      { name:'草原天路', xhsTitle:'🛣️ 北京出发3h｜草原天路，中国版66号公路', xhsTags:'#草原天路 #66号公路 #北京自驾 #组队', dyTitle:'北京出发3h，草原天路！中国版66号公路！', dyTags:'#草原天路 #自驾 #66号公路', dyHook:'第1秒：公路延伸到天际' },
      { name:'灵山高山草甸', xhsTitle:'⛰️ 北京最高峰！灵山2303m高山草甸，像在瑞士', xhsTags:'#灵山 #北京最高峰 #高山草甸 #徒步 #组队', dyTitle:'北京最高峰灵山，2303米，像在瑞士徒步！', dyTags:'#灵山 #北京最高峰 #徒步', dyHook:'第1秒：高山草甸全景+牛群' },
    ]
  },
  {
    month:'6月', theme:'玩水·溯溪·避暑',
    routes:[
      { name:'十渡拒马河玩水', xhsTitle:'💦 北京40°C？十渡玩水一日：漂流+竹筏+水枪大战', xhsTags:'#十渡 #漂流 #北京玩水 #避暑 #组队', dyTitle:'北京40度！十渡漂流玩水一日，爽翻了！', dyTags:'#十渡 #漂流 #玩水', dyHook:'第1秒：第一视角冲入水中' },
      { name:'龙庆峡避暑', xhsTitle:'🏞️ 北京小桂林！龙庆峡游船+峡谷徒步，比市区低10°C', xhsTags:'#龙庆峡 #北京避暑 #峡谷 #游船 #组队', dyTitle:'北京小桂林！龙庆峡，比市区低10度！', dyTags:'#龙庆峡 #避暑 #峡谷', dyHook:'第1秒：游船穿过峡谷全景' },
      { name:'野三坡百里峡', xhsTitle:'🌿 野三坡百里峡｜北京出发2h，天然空调房徒步', xhsTags:'#野三坡 #百里峡 #北京避暑 #徒步 #组队', dyTitle:'野三坡百里峡，北京出发2h，天然空调房！', dyTags:'#野三坡 #百里峡 #徒步', dyHook:'第1秒：峡谷溪流特写+鸟鸣' },
    ]
  },
  {
    month:'7月', theme:'草原·露营·亲子避暑',
    routes:[
      { name:'乌兰布统草原 3日', xhsTitle:'🌾 北京出发5h｜乌兰布统草原3日，还珠格格取景地！', xhsTags:'#乌兰布统 #草原 #还珠格格 #北京出发 #组队', dyTitle:'北京出发5h，乌兰布统草原！还珠格格同款取景地！', dyTags:'#乌兰布统 #草原 #还珠格格', dyHook:'第1秒：草原策马+经典BGM' },
      { name:'崇礼太舞小镇避暑', xhsTitle:'🏔️ 崇礼夏天也很绝！太舞小镇避暑+缆车+山地车', xhsTags:'#崇礼 #太舞小镇 #避暑 #缆车 #组队', dyTitle:'崇礼不只冬天！太舞小镇夏天避暑，绝了！', dyTags:'#崇礼 #太舞 #避暑', dyHook:'第1秒：缆车上升俯瞰山谷' },
      { name:'海坨山谷亲子露营', xhsTitle:'👨‍👩‍👧‍👦 带娃去哪？海坨山谷亲子露营：帐篷+游乐+星空', xhsTags:'#亲子露营 #海坨山谷 #遛娃 #北京周末 #组队', dyTitle:'带娃去哪？海坨山谷亲子露营，帐篷+星空！', dyTags:'#亲子 #露营 #海坨山谷', dyHook:'第1秒：孩子在草地上奔跑笑脸' },
    ]
  },
  {
    month:'8月', theme:'草原·玩水·英仙座流星雨',
    routes:[
      { name:'坝上草原流星雨', xhsTitle:'🌠 8月英仙座流星雨！坝上草原观星组队，无光污染', xhsTags:'#英仙座流星雨 #坝上 #观星 #露营 #组队', dyTitle:'8月英仙座流星雨！坝上草原观星，许愿去！', dyTags:'#流星雨 #坝上 #观星', dyHook:'第1秒：延时星空+流星划过' },
      { name:'白河湾溯溪', xhsTitle:'🦶 白河湾溯溪！北京少见的清澈溪水，光脚踩水太解压', xhsTags:'#白河湾 #溯溪 #北京玩水 #夏日 #组队', dyTitle:'白河湾溯溪，北京少见的清澈溪水！光脚踩水！', dyTags:'#白河湾 #溯溪 #玩水', dyHook:'第1秒：脚踩进溪水慢镜头' },
      { name:'京郊漂流合集', xhsTitle:'🌊 北京周边5���漂流地大盘点！刺激程度排名+组队', xhsTags:'#漂流 #北京周边 #夏日玩水 #攻略 #组队', dyTitle:'北京周边5个漂流地大盘点！刺激排名！', dyTags:'#漂流 #攻略 #北京', dyHook:'第1秒：激流勇进第一视角' },
    ]
  },
  {
    month:'9月', theme:'早秋·长城日出·草原渐黄',
    routes:[
      { name:'金山岭长城日出', xhsTitle:'🌅 北京宝藏日出！金山岭长城日出徒步，早秋限定', xhsTags:'#金山岭 #长城日出 #早秋 #徒步 #组队', dyTitle:'北京宝藏日出！金山岭长城，早秋限定！', dyTags:'#金山岭 #日出 #长城', dyHook:'第1秒：太阳从长城升起延时' },
      { name:'司马台长城', xhsTitle:'🏯 夜游长城！司马台长城灯光秀+古北水镇', xhsTags:'#司马台 #夜游长城 #古北水镇 #组队', dyTitle:'夜游司马台长城！灯光秀+水镇，太梦幻！', dyTags:'#司马台 #夜游 #长城', dyHook:'第1秒：长城亮灯瞬间' },
      { name:'坝上秋色初染', xhsTitle:'🍂 坝上草原开始黄了！9月初秋版，人少景美', xhsTags:'#坝上秋色 #草原 #早秋 #北京出发 #组队', dyTitle:'坝上开始黄了！9月初秋草原，人少景美！', dyTags:'#坝上 #秋天 #草原', dyHook:'第1秒：黄绿交织的草原全景' },
    ]
  },
  {
    month:'10月', theme:'红叶（黄金月）·银杏·国庆',
    routes:[
      { name:'坡峰岭红叶', xhsTitle:'🍁 坡峰岭红叶超惊艳！满山红遍，一年就这2周', xhsTags:'#坡峰岭 #红叶 #北京秋天 #徒步 #组队', dyTitle:'坡峰岭满山红遍！一年就这2周，别错过！', dyTags:'#坡峰岭 #红叶 #秋天', dyHook:'第1秒：无人机航拍红色山峦' },
      { name:'妙峰山红叶', xhsTitle:'🏔️ 妙峰山红叶+古道徒步，比坡峰岭人少一半', xhsTags:'#妙峰山 #红叶 #古道 #徒步 #组队', dyTitle:'妙峰山红叶！比坡峰岭人少一半，快冲！', dyTags:'#妙峰山 #红叶 #古道', dyHook:'第1秒：古道+红叶特写' },
      { name:'钓鱼台银杏大道', xhsTitle:'💛 北京宝藏银杏！钓鱼台银杏大道，金黄隧道', xhsTags:'#钓鱼台 #银杏 #北京秋天 #拍照 #组队', dyTitle:'北京宝藏银杏！钓鱼台金黄隧道，一年就这几天！', dyTags:'#银杏 #钓鱼台 #秋天', dyHook:'第1秒：银杏叶飘落慢镜头' },
      { name:'八达岭红叶', xhsTitle:'🍂 八达岭红叶+长城，10月北京超经典的画面', xhsTags:'#八达岭 #红叶 #长城 #北京秋天 #组队', dyTitle:'八达岭红叶+长城！10月北京超经典的画面！', dyTags:'#八达岭 #红叶 #长城', dyHook:'第1秒：红叶映衬下的长城全景' },
    ]
  },
  {
    month:'11月', theme:'银杏·初雪·温泉',
    routes:[
      { name:'故宫银杏+角楼', xhsTitle:'🏯 故宫银杏｜角楼+红墙+金黄，北京秋天最后的浪漫', xhsTags:'#故宫 #银杏 #角楼 #北京秋天 #拍照', dyTitle:'故宫银杏！角楼+红墙+金黄，秋天最后的美！', dyTags:'#故宫 #银杏 #角楼', dyHook:'第1秒：角楼银杏倒影' },
      { name:'古北水镇温泉红叶', xhsTitle:'♨️ 古北水镇温泉季！泡着温泉看红叶，太惬意了', xhsTags:'#古北水镇 #温泉 #红叶 #北京周末 #组队', dyTitle:'古北水镇温泉季！泡温泉看红叶，绝了！', dyTags:'#古北水镇 #温泉 #红叶', dyHook:'第1秒：温泉池+红叶飘落' },
      { name:'香山初雪', xhsTitle:'❄️ 香山初雪！北京今年第一场雪，雪中红叶', xhsTags:'#香山 #初雪 #红叶 #北京冬天 #组队', dyTitle:'北京初雪！香山雪中红叶，一年见一次！', dyTags:'#香山 #初雪 #红叶', dyHook:'第1秒：雪花落在红叶上特写' },
    ]
  },
  {
    month:'12月', theme:'跨年·冰雪·滑雪',
    routes:[
      { name:'崇礼跨年滑雪', xhsTitle:'🎿 跨年去哪？崇礼滑雪+跨年派对，组队中！', xhsTags:'#崇礼 #跨年 #滑雪 #派对 #组队', dyTitle:'跨年崇礼滑雪！派对+倒数+烟花，组队中！', dyTags:'#崇礼 #跨年 #滑雪', dyHook:'第1秒：烟花+雪道+倒数' },
      { name:'古北水镇跨年', xhsTitle:'🎆 古北水镇跨年：无人机灯光秀+长城倒数', xhsTags:'#古北水镇 #跨年 #无人机 #长城 #组队', dyTitle:'古北水镇跨年！无人机秀+长城倒数，超震撼！', dyTags:'#古北水镇 #跨年 #无人机', dyHook:'第1秒：无人机编队升起' },
      { name:'京郊冰瀑·黑龙潭', xhsTitle:'🧊 黑龙潭冰瀑！北京冬天超震撼的冰雪奇观', xhsTags:'#黑龙潭 #冰瀑 #北京冬天 #冰雪 #组队', dyTitle:'黑龙潭冰瀑！北京超震撼的冰雪奇观！', dyTags:'#黑龙潭 #冰瀑 #冰雪', dyHook:'第1秒：巨大冰瀑全景' },
    ]
  },
];

/* 今日任务（替代原来的个人日常） */
const seedTasks = () => [
  { id:uid(), col:'morning', name:'📕 发小红书：' + (calendarData[6].routes[0].xhsTitle||'坝上草原'), done:false, note:'10:30发布' },
  { id:uid(), col:'morning', name:'🎵 发抖音：' + (calendarData[6].routes[0].dyTitle||'坝上草原'), done:false, note:'12:00发布' },
  { id:uid(), col:'afternoon', name:'🔥 追热点二创：Citywalk话题借势', done:false, note:'14:00-15:00完成' },
  { id:uid(), col:'evening', name:'💬 回复评论+私信引流', done:false, note:'19:00-20:00' },
  { id:uid(), col:'evening', name:'📊 数据复盘', done:false, note:'22:00前完成' },
];

/* 热点 */
const seedHots = () => [
  { id:uid(), title:'「Citywalk」话题抖音小红书双爆', from:'抖音/小红书', link:'', angle:'做《北京5条Citywalk路线组队》：胡同咖啡+文创探店+胡同美食，每周末固定发团', icon:'🚶' },
  { id:uid(), title:'「40°C高温逃离」话题飙升', from:'抖音', link:'', angle:'做《北京40°C？2h逃到20°C草原》+ 坝上草原实拍，对比市区温度反差', icon:'🥵' },
  { id:uid(), title:'「周末图鉴」BGM 爆火', from:'抖音', link:'', angle:'BGM借势：剪往期徒步/露营/合影素材，字幕"北京打工人的周末图鉴"', icon:'🎵' },
  { id:uid(), title:'「暑期亲子游」搜索量暴涨', from:'小红书', link:'', angle:'做《带娃去哪？北京出发亲子路线Top5》海坨山谷/十渡/古北水镇亲子版', icon:'👨‍👩‍👧‍👦' },
  { id:uid(), title:'「特种兵旅游」热度回升', from:'抖音', link:'', angle:'反差二创：不做特种兵，做"周末慢旅行"——深度1-2日不走马观花', icon:'⚡' },
];

/* ===================== 违禁词表：通用 / 小红书专属 / 抖音专属 ===================== */
// 通用违禁词（两个平台都查）
const bannedCommon = [
  { type:'极限词', banned:'最、最佳、最优、最好、最美、最野、最火、最强、最震撼、最清澈', replace:'超、非常、值得、宝藏、少见、推荐、惊艳、震撼' },
  { type:'极限词', banned:'天花板、TOP级、顶级、顶尖', replace:'超惊艳、值得去、很推荐' },
  { type:'极限词', banned:'第一、唯一、首家、首个、首选、NO.1、TOP1', replace:'值得选、很多人去、推荐' },
  { type:'2026新增', banned:'yyds、绝绝子、封神、绝版、王炸、无敌、殿堂级', replace:'很棒、惊艳、值得收藏' },
  { type:'夸张类', banned:'全民抢购、抢疯了、再不抢就没了、错过再无、史上最低价', replace:'名额有限、抓紧报名、别错过' },
  { type:'承诺类', banned:'100%、零风险、保证、无效退款、包治、根治、永不', replace:'有保障、放心、靠谱' },
  { type:'医疗类', banned:'治愈、治疗、消炎、杀菌、排毒、祛斑、防癌、降糖', replace:'放松、解压、舒缓、舒服' },
  { type:'引流类', banned:'加微信、V、VX、扫码、进群、私信领取、加V', replace:'主页了解、评论区扣1、滴滴我' },
  { type:'诱导类', banned:'一键三连、求点赞、求收藏、互关互赞', replace:'觉得有用就存一下、喜欢可以关注' },
  { type:'虚假促销', banned:'清仓、亏本、跳楼价、爆单、卖爆', replace:'性价比高、价格实在、划算' },
  { type:'对比诋毁', banned:'别家不行、碾压同行、吊打同类、全网唯一靠谱', replace:'我们不一样的地方、我们的特色是' },
  { type:'绝对化', banned:'闭眼入、人手必备、全民种草、不踩雷', replace:'可以试试、值得了解、很多人在用' },
  { type:'虚假背书', banned:'央视推荐、国家认证、政府扶持、专家推荐、明星同款', replace:'我们实测推荐、自己用过觉得好' },
  { type:'迷信类', banned:'招财、转运、辟邪、改运、旺宅、开光', replace:'（不建议使用此类表述）' },
];

// 小红书专属违禁词（小红书查，抖音不一定查）
const bannedXHS = [
  { type:'小红书-夸大词', banned:'鼻祖、王牌、性价比之王、祖传秘方、神效、秒杀同级', replace:'有特色、值得选、性价比不错' },
  { type:'小红书-测评禁词', banned:'完爆大牌、所有同类里好用、全网测评第一', replace:'用下来觉得不错、比之前用过的好' },
  { type:'小红书-美妆禁词', banned:'医美级、院线同款、医用平替、医用级', replace:'温和好用、体验感好' },
  { type:'小红书-独家禁词', banned:'无平替、独家原料、独家配方', replace:'有特色、难得找到、很特别' },
  { type:'小红书-虚假测评', banned:'全闺蜜实测全好评、100%好评、零差评', replace:'朋友用了都说不错、反馈都挺好的' },
  { type:'小红书-数据造假', banned:'已售10万+（无凭证）、万人收藏（无凭证）', replace:'很多人问、反响不错' },
];

// 抖音专属违禁词（抖音查，小红书不一定查）
const bannedDY = [
  { type:'抖音-直播禁词', banned:'卖爆、爆单、疯抢、亏本甩卖、跳楼价、厂家破产', replace:'很受欢迎、卖得不错、性价比高' },
  { type:'抖音-虚假福利', banned:'免费领大奖、零元到手、点击领红包、一键薅羊毛', replace:'有福利、活动价、限时优惠' },
  { type:'抖音-直播逼单', banned:'最后3单、马上抢、不买吃亏、库存告急', replace:'名额不多、喜欢的可以下手' },
  { type:'抖音-养生禁词', banned:'纯天然零副作用、根治慢性病、纯天然无毒', replace:'自然食材、传统配方、食补' },
  { type:'抖音-流量作弊', banned:'上热门、必火、涨粉神器、快速涨粉', replace:'用心做内容、慢慢积累' },
  { type:'抖音-夸张效果', banned:'永久抗皱、一洗白、七天祛痘、三天见效', replace:'坚持使用、慢慢改善、长期用下来' },
];

/* 复盘 */
const seedReviews = () => [
  { id:uid(), topic:'坡峰岭红叶 vlog', platform:'小红书', views:18420, likes:867, saves:423, comments:56, rate:8.6, leads:12, note:'开头3秒红叶航拍钩子有效，互动率不错。下次结尾加投票"你更想看哪条路线"，引导评论。' },
  { id:uid(), topic:'坝上草原组队', platform:'抖音', views:32500, likes:1203, saves:189, comments:87, rate:4.8, leads:23, note:'前3秒万马奔腾镜头拉满完播率，报名私信23人转化很好。但收藏偏低，下次加"收藏下次用"引导。' },
  { id:uid(), topic:'新手露营装备清单', platform:'小红书', views:9800, likes:532, saves:1201, comments:34, rate:18.3, leads:8, note:'收藏量爆炸！说明实用干货型内容在小红书有强长尾。可以做一个系列：装备/路线/避坑。' },
  { id:uid(), topic:'Citywalk组队·胡同咖啡', platform:'抖音', views:12400, likes:456, saves:89, comments:42, rate:5.1, leads:15, note:'Citywalk话题自带流量，但完播率偏低（平均只看到第8秒）。下次把路线亮点前移。' },
];

/* ===================== 云端数据引用（渲染时优先用云端数据，否则降级种子数据） ===================== */
function getCloudData(name, fallback) {
  const cached = CloudSync.getCached(name);
  return cached || fallback;
}

/* ===================== 初始化数据 ===================== */
let tasks   = load(LS.tasks, null) || seedTasks();
let hots    = load(LS.hots, null) || seedHots();
let reviews = load(LS.reviews, null) || seedReviews();
save(LS.tasks, tasks); save(LS.hots, hots); save(LS.reviews, reviews);

/* ===================== 工具函数 ===================== */
function escapeHTML(s){ return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
let toastT;
function toast(msg){
  const el = $('#toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toastT);
  toastT = setTimeout(() => el.classList.remove('show'), 1800);
}

/* ===================== 页面名 ===================== */
const pageName = { plan:'每日选题工作流', calendar:'内容日历', hot:'爆款热点·二创', copy:'双平台文案库', check:'文案安检', bgm:'热点BGM', remix:'路线二创', interact:'粉丝互动话术', review:'数据复盘' };

/* ===================== 导航 ===================== */
function setPage(name){
  $$('.page').forEach(p => p.classList.remove('active'));
  $(`#page-${name}`).classList.add('active');
  $$('.nav-item').forEach(b => b.classList.toggle('active', b.dataset.page === name));
  $$('.tab-item').forEach(b => b.classList.toggle('active', b.dataset.page === name));
  $('#crumbCurrent').textContent = pageName[name];
  $('#drawer').classList.remove('show');
  $('#content').scrollTop = 0;
  if (name === 'calendar') renderCalendar();
  if (name === 'bgm') renderBGM();
  if (name === 'interact') renderInteract();
  if (name === 'remix') { /* remix 页面无需主动渲染 */ }
}
$$('.nav-item, .tab-item').forEach(b => b.addEventListener('click', () => setPage(b.dataset.page)));

/* 抽屉 */
$('#menuBtn').addEventListener('click', () => {
  const drawer = $('#drawer');
  if (drawer.classList.contains('show')) { drawer.classList.remove('show'); return; }
  $('#drawerBody').innerHTML = $('.sidebar').innerHTML;
  $$('.nav-item', $('#drawerBody')).forEach(b => b.addEventListener('click', () => setPage(b.dataset.page)));
  drawer.classList.add('show');
});
$('#drawer').addEventListener('click', e => { if (e.target.classList.contains('drawer-mask')) $('#drawer').classList.remove('show'); });

/* ===================== 渲染：任务看板 ===================== */
function renderTasks(){
  ['morning','afternoon','evening'].forEach(col => {
    const list = $(`#col-${col}`);
    if (!list) return;
    list.innerHTML = '';
    tasks.filter(t => t.col === col).forEach(t => {
      const li = document.createElement('li');
      li.className = 'task' + (t.done ? ' done' : '');
      li.innerHTML = `
        <div class="check" data-id="${t.id}"><svg viewBox="0 0 24 24"><polyline points="4 12 10 18 20 6"/></svg></div>
        <div class="task-name">${escapeHTML(t.name)}</div>
        <button class="task-del" data-del="${t.id}" title="删除">×</button>`;
      list.appendChild(li);
    });
  });
  const total = tasks.length;
  const done  = tasks.filter(t => t.done).length;
  const pending = total - done;
  const rate = total ? Math.round(done / total * 100) : 0;
  $('#stat-total').textContent = total;
  $('#stat-done').textContent  = done;
  $('#stat-pending').textContent = pending;
  $('#stat-rate').textContent  = rate + '%';
  $('#rateBar').style.width    = rate + '%';
  save(LS.tasks, tasks);
}

/* ===================== 渲染：时间表 ===================== */
function renderTimeline(){
  const el = $('#timeline');
  const data = getCloudData('timeline', timelineSlots);
  el.innerHTML = data.map(s => `
    <div class="time-slot">
      <div class="time">${s.time}</div>
      <div class="time-desc">${escapeHTML(s.desc)}<small>${escapeHTML(s.tip)}</small></div>
    </div>`).join('');
}

/* ===================== 渲染：选题决策表 ===================== */
function renderTopics(){
  const g = $('#topicGrid');
  const cloudTopics = getCloudData('topics', null);
  const topics = cloudTopics || load('tw_topics_v2', null) || seedTopics();
  save('tw_topics_v2', topics);
  g.innerHTML = topics.map(t => {
    const scores = [t.scores.season, t.scores.pain, t.scores.material, t.scores.hook, t.scores.trend];
    const total = scores.reduce((a,b) => a+b, 0);
    const go = total >= 12;
    return `<div class="topic-card" style="${go ? 'border-color: rgba(34,197,94,.3)' : ''}">
      <div class="topic-name">${go ? '✅' : '⏳'} ${escapeHTML(t.name)}</div>
      <div class="topic-score">
        <span>季节${t.scores.season}</span><span>痛点${t.scores.pain}</span><span>素材${t.scores.material}</span>
        <span>钩子${t.scores.hook}</span><span>趋势${t.scores.trend}</span>
        <span class="score-total">${total}分 ${go ? '发！' : '再想想'}</span>
      </div>
      <div class="topic-from">来源：${escapeHTML(t.from)}</div>
      <div class="topic-hook">钩子：${escapeHTML(t.hook)}</div>
    </div>`;
  }).join('');
}

/* ===================== 渲染：评论区挖宝 ===================== */
function renderCommentMine(){
  const el = $('#commentMine');
  const cloudComments = getCloudData('comments', null);
  const comments = cloudComments || load('tw_comments_v2', null) || seedComments();
  save('tw_comments_v2', comments);
  el.innerHTML = comments.map(c => `
    <div class="comment-item">
      <div class="cmt-q">${escapeHTML(c.q)}</div>
      <div class="cmt-arrow">→</div>
      <div class="cmt-topic">${escapeHTML(c.topic)}</div>
    </div>`).join('');
}

/* ===================== 渲染：日历 ===================== */
let calMonthIdx = 6; // 默认7月
function renderCalendar(){
  const cloudCal = getCloudData('calendar', null);
  const calSource = cloudCal || calendarData;
  const m = calSource[calMonthIdx];
  if (!m) return;
  $('#calMonth').textContent = m.month;
  const grid = $('#calendarGrid');
  grid.innerHTML = `<div class="cal-month-card">
    <div class="cal-month-head"><span class="mon">${m.month}</span><span class="mon-theme">${escapeHTML(m.theme)}</span></div>
    <table class="cal-route-table">
      <tr><th>路线</th><th>📕 小红书标题</th><th>🎵 抖音标题</th></tr>
      ${m.routes.map(r => `
        <tr>
          <td class="route-name">${escapeHTML(r.name)}</td>
          <td class="route-copy"><span class="plat-badge xhs">小红书</span>${escapeHTML(r.xhsTitle)}</td>
          <td class="route-copy"><span class="plat-badge dy">抖音</span>${escapeHTML(r.dyTitle)}</td>
        </tr>`).join('')}
    </table>
  </div>`;
}
$('#calPrev').addEventListener('click', () => { calMonthIdx = (calMonthIdx + 11) % 12; renderCalendar(); });
$('#calNext').addEventListener('click', () => { calMonthIdx = (calMonthIdx + 1) % 12; renderCalendar(); });

/* ===================== 渲染：热点 ===================== */
function renderHot(){
  const list = $('#hotList'); list.innerHTML = '';
  hots.forEach(h => {
    const item = document.createElement('div');
    item.className = 'hot-item';
    item.innerHTML = `
      <div class="hot-cover">${h.icon || '🔥'}</div>
      <div class="hot-body">
        <div class="hot-title">${escapeHTML(h.title)}</div>
        <div class="hot-meta"><span>📍 ${escapeHTML(h.from||'未填')}</span>${h.link ? '<span>🔗 已附链接</span>' : ''}</div>
        <div class="hot-angle">二创角度：${escapeHTML(h.angle||'—')}</div>
        <div class="hot-actions">
          ${h.link ? `<a class="link-btn" href="${escapeHTML(h.link)}" target="_blank" rel="noopener">查看原片</a>` : ''}
          <button class="link-btn" data-del-hot="${h.id}">删除</button>
        </div>
      </div>`;
    list.appendChild(item);
  });
  save(LS.hots, hots);
}

/* ===================== 渲染：二创方法 ===================== */
function renderRemixMethods(){
  const el = $('#remixMethods');
  const data = getCloudData('remix-methods', remixMethods);
  el.innerHTML = data.map(m => `
    <div class="remix-card">
      <div class="rm-tag">${m.tag}</div>
      <div class="rm-title">${m.title}</div>
      <div class="rm-desc">${escapeHTML(m.desc)}</div>
      <div class="rm-time">⏱ 约 ${m.time}</div>
    </div>`).join('');
}

/* ===================== AI 文案模板库 ===================== */
const aiTemplates = {
  '露营': {
    xhsTitle: '⛺ {place}露营！{season}限定，帐篷+星空+篝火，组队中',
    xhsTags: '#{place} #露营 #星空 #北京出发 #组队',
    dyTitle: '{place}露营！{season}组队中，帐篷+星空！',
    dyTags: '#{place} #露营 #户外',
    dyHook: '第1秒：帐篷亮灯+星空延时'
  },
  '徒步': {
    xhsTitle: '🥾 {place}徒步！{season}必走路线，沿途风景太值得了',
    xhsTags: '#{place} #徒步 #户外 #北京周末 #组队',
    dyTitle: '{place}徒步！{season}出发，风景值得！',
    dyTags: '#{place} #徒步 #户外',
    dyHook: '第1秒：山脊线行走第一视角'
  },
  '滑雪': {
    xhsTitle: '🏂 {place}滑雪！{season}开板，新手友好，装备可租',
    xhsTags: '#{place} #滑雪 #北京滑雪 #新手友好 #组队',
    dyTitle: '{place}滑雪！{season}开板，组队中！',
    dyTags: '#{place} #滑雪 #冬季',
    dyHook: '第1秒：第一视角滑行+雪板声'
  },
  '漂流': {
    xhsTitle: '🌊 {place}漂流！{season}玩水必去，刺激又解暑',
    xhsTags: '#{place} #漂流 #北京玩水 #避暑 #组队',
    dyTitle: '{place}漂流！{season}必玩，爽翻了！',
    dyTags: '#{place} #漂流 #玩水',
    dyHook: '第1秒：激流勇进第一视角'
  },
  '赏花': {
    xhsTitle: '🌸 {place}花海！{season}限定，拍照超出片',
    xhsTags: '#{place} #花海 #{season}赏花 #北京周末 #组队',
    dyTitle: '{place}花海！{season}限定，美到不想走！',
    dyTags: '#{place} #赏花 #{season}',
    dyHook: '第1秒：无人机俯瞰花海'
  },
  '温泉': {
    xhsTitle: '♨️ {place}温泉！{season}泡汤+美食，惬意一日',
    xhsTags: '#{place} #温泉 #{season}出游 #北京周末 #组队',
    dyTitle: '{place}温泉！{season}泡着看景，太惬意！',
    dyTags: '#{place} #温泉 #{season}',
    dyHook: '第1秒：热气升腾慢镜头'
  },
  '草原': {
    xhsTitle: '🌾 {place}草原！{season}限定，骑马+篝火+星空',
    xhsTags: '#{place} #草原 #{season} #骑马 #组队',
    dyTitle: '{place}草原！{season}出发，骑马篝火！',
    dyTags: '#{place} #草原 #{season}',
    dyHook: '第1秒：万马奔腾+草原全景'
  },
  '红叶': {
    xhsTitle: '🍁 {place}红叶！{season}限定，满山红遍，一年就这2周',
    xhsTags: '#{place} #红叶 #秋天 #北京周末 #组队',
    dyTitle: '{place}红叶！{season}满山红遍，别错过！',
    dyTags: '#{place} #红叶 #秋天',
    dyHook: '第1秒：无人机航拍红色山峦'
  },
  '冰瀑': {
    xhsTitle: '🧊 {place}冰瀑！{season}限定，北京超震撼冰雪奇观',
    xhsTags: '#{place} #冰瀑 #北京冬天 #冰雪 #组队',
    dyTitle: '{place}冰瀑！{season}限定，超震撼！',
    dyTags: '#{place} #冰瀑 #冬天',
    dyHook: '第1秒：巨大冰瀑全景'
  },
  '溯溪': {
    xhsTitle: '🦶 {place}溯溪！{season}玩水推荐，清澈溪水光脚踩',
    xhsTags: '#{place} #溯溪 #北京玩水 #夏日 #组队',
    dyTitle: '{place}溯溪！{season}光脚踩水，太解压！',
    dyTags: '#{place} #溯溪 #玩水',
    dyHook: '第1秒：脚踩进溪水慢镜头'
  },
  '骑行': {
    xhsTitle: '🚴 {place}骑行！{season}推荐路线，沿途风景绝了',
    xhsTags: '#{place} #骑行 #户外 #北京周末 #组队',
    dyTitle: '{place}骑行！{season}出发，风景在路上！',
    dyTags: '#{place} #骑行 #户外',
    dyHook: '第1秒：车轮+沿途风景'
  },
  'Citywalk': {
    xhsTitle: '🚶 {place} Citywalk！{season}慢逛指南，胡同+咖啡+美食',
    xhsTags: '#{place} #Citywalk #北京周末 #探店 #组队',
    dyTitle: '{place} Citywalk！{season}慢逛，发现宝藏！',
    dyTags: '#{place} #Citywalk #探店',
    dyHook: '第1秒：街角咖啡+阳光洒落'
  },
  '攀岩': {
    xhsTitle: '🧗 {place}攀岩！{season}挑战自己，新手也可尝试',
    xhsTags: '#{place} #攀岩 #户外 #挑战 #组队',
    dyTitle: '{place}攀岩！{season}挑战，敢来的扣1！',
    dyTags: '#{place} #攀岩 #户外',
    dyHook: '第1秒：第一人称攀爬视角'
  },
  '越野': {
    xhsTitle: '🏃 {place}越野跑！{season}山野路线，风景超值',
    xhsTags: '#{place} #越野跑 #户外 #北京周末 #组队',
    dyTitle: '{place}越野！{season}山野跑起来！',
    dyTags: '#{place} #越野 #户外',
    dyHook: '第1秒：山脊奔跑第一视角'
  },
  '自驾': {
    xhsTitle: '🛣️ {place}自驾！{season}宝藏路线，沿途全是风景',
    xhsTags: '#{place} #自驾 #北京出发 #公路旅行 #组队',
    dyTitle: '{place}自驾！{season}宝藏路线，美在路上！',
    dyTags: '#{place} #自驾 #旅行',
    dyHook: '第1秒：车窗视角公路大片'
  },
  '摄影': {
    xhsTitle: '📷 {place}出片机位！{season}摄影攻略，随手拍大片',
    xhsTags: '#{place} #摄影 #北京拍照 #{season} #攻略',
    dyTitle: '{place}拍照！{season}出片机位，随手大片！',
    dyTags: '#{place} #摄影 #拍照',
    dyHook: '第1秒：快门声+构图切换'
  },
  '亲子': {
    xhsTitle: '👨‍👩‍👧‍👦 带娃去哪？{place}亲子游，{season}遛娃推荐',
    xhsTags: '#{place} #亲子游 #遛娃 #北京周末 #组队',
    dyTitle: '带娃去{place}！{season}亲子游，孩子玩疯了！',
    dyTags: '#{place} #亲子 #遛娃',
    dyHook: '第1秒：孩子在草地上奔跑笑脸'
  },
};

/* AI 文案生成 */
function getCurrentSeason() {
  const m = new Date().getMonth() + 1;
  if (m >= 3 && m <= 5) return '春日';
  if (m >= 6 && m <= 8) return '夏日';
  if (m >= 9 && m <= 11) return '秋日';
  return '冬日';
}

function detectActivityType(input) {
  const lower = input.toLowerCase();
  const keywords = {
    '露营': ['露营', '帐篷', '篝火', '星空露营'],
    '徒步': ['徒步', '穿越', '登山', '爬山', '拉练'],
    '滑雪': ['滑雪', '雪场', '开板', '雪道'],
    '漂流': ['漂流', '竹筏', '皮划艇'],
    '赏花': ['赏花', '花海', '樱花', '桃花', '杏花', '梅花', '油菜花'],
    '温泉': ['温泉', '泡汤', '泡澡', '汤泉'],
    '草原': ['草原', '牧场', '坝上', '乌兰布统'],
    '红叶': ['红叶', '枫叶', '银杏', '秋色'],
    '冰瀑': ['冰瀑', '冰灯', '冰挂', '冰雕'],
    '溯溪': ['溯溪', '溪水', '戏水', '玩水', '踩水'],
    '骑行': ['骑行', '骑车', '环线', '骑行道'],
    'Citywalk': ['citywalk', 'city walk', '胡同', '逛街', '漫步'],
    '攀岩': ['攀岩', '抱石', '岩壁'],
    '越野': ['越野', '越野跑', '山地跑'],
    '自驾': ['自驾', '公路', '天路', '环线自驾'],
    '摄影': ['摄影', '拍照', '出片', '打卡', '机位'],
    '亲子': ['亲子', '带娃', '遛娃', '儿童', '小孩', '家庭'],
  };
  for (const [type, kws] of Object.entries(keywords)) {
    if (kws.some(kw => lower.includes(kw))) return type;
  }
  return null;
}

function extractPlaceName(input) {
  const cleaned = input.replace(/(露营|徒步|滑雪|漂流|赏花|温泉|草原|红叶|冰瀑|溯溪|骑行|citywalk|攀岩|越野|自驾|摄影|亲子|组队|一日|两日|2日|3日|周末|攻略|推荐|打卡)/gi, '').trim();
  return cleaned || input.trim();
}

function aiGenerateCopy(input) {
  if (!input.trim()) return null;
  const place = extractPlaceName(input);
  const activity = detectActivityType(input);
  const season = getCurrentSeason();
  const template = activity ? aiTemplates[activity] : {
    xhsTitle: '📍 {place}！{season}出发，值得去的地方',
    xhsTags: '#{place} #北京周末 #户外 #组队',
    dyTitle: '{place}！{season}组队中，风景太值得了！',
    dyTags: '#{place} #户外 #北京',
    dyHook: '第1秒：风景全景+出发'
  };

  const fill = (str) => str.replace(/\{place\}/g, place).replace(/\{season\}/g, season);

  return {
    place,
    activity: activity || '通用',
    season,
    xhsTitle: fill(template.xhsTitle),
    xhsTags: fill(template.xhsTags),
    dyTitle: fill(template.dyTitle),
    dyTags: fill(template.dyTags),
    dyHook: fill(template.dyHook),
  };
}

/* AI 生成历史记录 */
let aiHistory = load('tw_ai_history', []);

function saveAIHistory(copy) {
  aiHistory.unshift({ ...copy, id: uid(), createdAt: Date.now() });
  if (aiHistory.length > 50) aiHistory = aiHistory.slice(0, 50);
  save('tw_ai_history', aiHistory);
}

function renderAIResult(copy) {
  const el = $('#aiGenResult');
  if (!el) return;

  const fullText = `【小红书标题】\n${copy.xhsTitle}\n【小红书标签】\n${copy.xhsTags}\n\n【抖音标题】\n${copy.dyTitle}\n【抖音标签】\n${copy.dyTags}\n【前3秒钩子】\n${copy.dyHook}`;

  // 违禁词扫描
  const scanResult = scanText(fullText, 'both');
  const scanBadge = scanResult.clean
    ? '<span class="scan-badge clean">✅ 已过违禁词</span>'
    : `<span class="scan-badge warn">⚠️ 发现 ${scanResult.hits.length} 个违禁词</span>`;

  const hitDetails = scanResult.clean ? '' : `
    <div class="ai-scan-details">
      ${scanResult.hits.map(h => `<div class="ai-scan-hit">🚫 <b>${escapeHTML(h.word)}</b> → ${escapeHTML(h.replace)}</div>`).join('')}
    </div>`;

  el.innerHTML = `
    <div class="ai-result-card">
      <div class="ai-result-head">
        <span class="ai-result-label">📍 ${escapeHTML(copy.place)}</span>
        <span class="ai-result-type">${copy.activity} · ${copy.season}</span>
        ${scanBadge}
      </div>
      <div class="copy-block">
        <div class="cb-platform"><span class="dot xhs-dot"></span>小红书</div>
        <div class="cb-field"><div class="cb-label">标题</div><div class="cb-val">${escapeHTML(copy.xhsTitle)}</div></div>
        <div class="cb-field"><div class="cb-label">标签</div><div class="cb-tags">${copy.xhsTags.split(/\s+/).filter(Boolean).map(t=>`<span>${escapeHTML(t)}</span>`).join('')}</div></div>
      </div>
      <div class="copy-block">
        <div class="cb-platform"><span class="dot dy-dot"></span>抖音</div>
        <div class="cb-field"><div class="cb-label">标题</div><div class="cb-val">${escapeHTML(copy.dyTitle)}</div></div>
        <div class="cb-field"><div class="cb-label">标签</div><div class="cb-tags">${copy.dyTags.split(/\s+/).filter(Boolean).map(t=>`<span>${escapeHTML(t)}</span>`).join('')}</div></div>
        <div class="cb-field"><div class="cb-label">前3秒钩子</div><div class="cb-val">${escapeHTML(copy.dyHook)}</div></div>
      </div>
      ${hitDetails}
      <div class="ai-result-actions">
        <button class="btn small" onclick="copyAIText(event)" data-text="${escapeHTML(fullText)}">📋 复制</button>
        <button class="btn small primary" onclick="addAIToLibrary(event)" data-place="${escapeHTML(copy.place)}" data-xhs-title="${escapeHTML(copy.xhsTitle)}" data-xhs-tags="${escapeHTML(copy.xhsTags)}" data-dy-title="${escapeHTML(copy.dyTitle)}" data-dy-tags="${escapeHTML(copy.dyTags)}" data-dy-hook="${escapeHTML(copy.dyHook)}">📚 加入文案库</button>
      </div>
    </div>`;
  el.style.display = 'block';
}

/* 绑定 AI 生成按钮 */
function bindAIGen() {
  const btn = $('#aiGenBtn');
  const input = $('#aiRouteInput');
  if (!btn || !input) return;

  btn.addEventListener('click', () => {
    const val = input.value.trim();
    if (!val) { toast('请输入路线名或地点'); return; }
    const copy = aiGenerateCopy(val);
    if (!copy) return;
    saveAIHistory(copy);
    renderAIResult(copy);
    const resultEl = $('#aiGenResult');
    if (resultEl) resultEl.scrollIntoView({ behavior: 'smooth' });
    toast('文案已生成 ✨');
  });

  input.addEventListener('keydown', e => {
    if (e.key === 'Enter') btn.click();
  });
}

/* 复制 AI 文案 */
window.copyAIText = function(e) {
  const text = e.target.dataset.text;
  if (!text) return;
  navigator.clipboard.writeText(text).then(() => toast('已复制到剪贴板 ✨')).catch(() => toast('复制失败'));
};

/* AI 文案加入文案库 */
window.addAIToLibrary = function(e) {
  const btn = e.target;
  const place = btn.dataset.place;
  const xhsTitle = btn.dataset.xhsTitle;
  const xhsTags = btn.dataset.xhsTags;
  const dyTitle = btn.dataset.dyTitle;
  const dyTags = btn.dataset.dyTags;
  const dyHook = btn.dataset.dyHook;

  // 添加到日历数据（加到当前月份作为自定义路线）
  const currentMonth = new Date().getMonth();
  if (!calendarData[currentMonth].routes.some(r => r.name === place)) {
    calendarData[currentMonth].routes.push({
      name: place,
      xhsTitle,
      xhsTags,
      dyTitle,
      dyTags,
      dyHook,
    });
  }
  save('tw_calendar_custom', calendarData);
  renderCopyList();
  toast('已加入文案库 📚');
};

/* ===================== 渲染：文案库 ===================== */
function renderCopyList(filter = ''){
  const el = $('#copyList');
  if (!el) return;

  // 在文案列表顶部渲染 AI 生成区
  const aiArea = $('#aiGenResult');
  if (aiArea && !aiArea.innerHTML) {
    aiArea.innerHTML = '<div class="ai-gen-hint">👆 输入路线名或地点，自动生成双平台文案</div>';
  }

  const cloudCal = getCloudData('calendar', null);
  const calSource = cloudCal || calendarData;
  const all = [];
  calSource.forEach((m, mi) => {
    m.routes.forEach((r, ri) => {
      all.push({ month: m.month, theme: m.theme, ...r, mi, ri });
    });
  });
  const filtered = filter ? all.filter(a =>
    a.name.includes(filter) || a.month.includes(filter) || a.xhsTitle.includes(filter) || a.theme.includes(filter)
  ) : all;

  el.innerHTML = filtered.map(a => `
    <div class="copy-item" data-mi="${a.mi}" data-ri="${a.ri}">
      <div class="copy-month">${a.month}</div>
      <div class="copy-info">
        <div class="copy-title">${escapeHTML(a.name)}</div>
        <div class="copy-route">${escapeHTML(a.theme)}</div>
        <div class="copy-platforms"><span class="plat-badge xhs">小红书</span><span class="plat-badge dy">抖音</span></div>
        <div class="copy-preview">📕 ${escapeHTML(a.xhsTitle)}<br>🎵 ${escapeHTML(a.dyTitle)}</div>
      </div>
    </div>`).join('');
}

/* 文案详情弹层 */
let currentCopy = null;
$('#copyList').addEventListener('click', e => {
  const item = e.target.closest('.copy-item');
  if (!item) return;
  const mi = parseInt(item.dataset.mi), ri = parseInt(item.dataset.ri);
  const cloudCal = getCloudData('calendar', null);
  const calSource = cloudCal || calendarData;
  currentCopy = calSource[mi].routes[ri];
  const m = calSource[mi];
  $('#copyModalTitle').textContent = `${m.month} · ${currentCopy.name}`;
  $('#copyDetail').innerHTML = `
    <div class="copy-block">
      <div class="cb-platform"><span class="dot xhs-dot"></span>小红书</div>
      <div class="cb-field"><div class="cb-label">标题</div><div class="cb-val">${escapeHTML(currentCopy.xhsTitle)}</div></div>
      <div class="cb-field"><div class="cb-label">标签</div><div class="cb-tags">${currentCopy.xhsTags.split(/\s+/).filter(Boolean).map(t=>`<span>${escapeHTML(t)}</span>`).join('')}</div></div>
      <div class="cb-field"><div class="cb-label">发布建议</div><div class="cb-val">早8-10点发布 / 9图或视频封面 / 文案写详细路线+报名方式 / 评论区置顶报名钩子</div></div>
    </div>
    <div class="copy-block">
      <div class="cb-platform"><span class="dot dy-dot"></span>抖音</div>
      <div class="cb-field"><div class="cb-label">标题</div><div class="cb-val">${escapeHTML(currentCopy.dyTitle)}</div></div>
      <div class="cb-field"><div class="cb-label">标签</div><div class="cb-tags">${currentCopy.dyTags.split(/\s+/).filter(Boolean).map(t=>`<span>${escapeHTML(t)}</span>`).join('')}</div></div>
      <div class="cb-field"><div class="cb-label">前3秒钩子</div><div class="cb-val">${escapeHTML(currentCopy.dyHook||'无')}</div></div>
      <div class="cb-field"><div class="cb-label">发布建议</div><div class="cb-val">午12点/晚7-9点发布 / 竖屏9:16 / 15-60秒 / 结尾口播引导私信报名</div></div>
    </div>`;
  $('#copyModal').classList.add('show');
});
$('#copyClose').addEventListener('click', () => $('#copyModal').classList.remove('show'));
$('#copyCopyBtn').addEventListener('click', () => {
  if (!currentCopy) return;
  const text = `【小红书标题】\n${currentCopy.xhsTitle}\n【小红书标签】\n${currentCopy.xhsTags}\n\n【抖音标题】\n${currentCopy.dyTitle}\n【抖音标签】\n${currentCopy.dyTags}\n【前3秒钩子】\n${currentCopy.dyHook||''}`;
  navigator.clipboard.writeText(text).then(() => toast('已复制到剪贴板 ✨')).catch(() => toast('复制失败，请手动选择'));
});
$('#copySearch').addEventListener('input', e => renderCopyList(e.target.value.trim()));

/* ===================== 渲染：复盘 ===================== */
function renderReview(){
  const g = $('#reviewGrid'); g.innerHTML = '';
  reviews.forEach(r => {
    const card = document.createElement('div');
    card.className = 'review-card';
    card.innerHTML = `
      <div class="rv-head">
        <div class="rv-topic">${escapeHTML(r.topic)}</div>
        <div style="display:flex;gap:6px;align-items:center">
          <span class="rv-plat ${r.platform==='抖音'?'dy':'xhs'}">${escapeHTML(r.platform||'小红书')}</span>
          <button class="link-btn" data-del-rv="${r.id}">删除</button>
        </div>
      </div>
      <div class="rv-stats">
        <span>👁 播放 <b>${(r.views||0).toLocaleString()}</b></span>
        <span>❤️ <b>${(r.likes||0).toLocaleString()}</b></span>
        <span>⭐ <b>${(r.saves||0).toLocaleString()}</b></span>
        <span>💬 <b>${(r.comments||0)}</b></span>
      </div>
      <div class="rv-stats">
        <span>📊 互动率 <b>${r.rate||0}%</b></span>
        <span>📩 转化 <b>${r.leads||0}人</b></span>
      </div>
      <div class="rv-note">${escapeHTML(r.note||'')}</div>`;
    g.appendChild(card);
  });
  save(LS.reviews, reviews);
}

/* ===================== 事件：任务看板 ===================== */
$('#content').addEventListener('click', e => {
  const check = e.target.closest('.check');
  if (check) {
    const t = tasks.find(x => x.id === check.dataset.id);
    if (t) { t.done = !t.done; renderTasks(); toast(t.done ? '✓ 已完成！' : '已撤销'); }
    return;
  }
  const del = e.target.closest('[data-del]');
  if (del) {
    tasks = tasks.filter(x => x.id !== del.dataset.del);
    renderTasks();
    toast('已删除任务');
    return;
  }
});

/* ===================== 渲染：热点 BGM ===================== */
let bgmFilter = 'all';
function renderBGM(){
  // hot-bgm.json 结构：{ data: { bgms: [], tips: [] } }
  const allCloud = CloudSync.getCached('hot-bgm');
  let bgmData = [];
  let tipsData = [];
  
  if (Array.isArray(allCloud)) {
    bgmData = allCloud;
  } else if (allCloud && allCloud.bgms) {
    // 新结构
    bgmData = allCloud.bgms;
    tipsData = allCloud.tips || [];
  } else if (allCloud && allCloud.data) {
    // 兼容老结构
    bgmData = allCloud.data.bgms || allCloud.data;
    tipsData = allCloud.data.tips || allCloud.tips || [];
  }
  
  const list = $('#bgmList');
  if (!list) return;
  
  if (!bgmData.length) {
    list.innerHTML = '<div class="ai-gen-empty">⏳ 正在从云端加载 BGM 数据…</div>';
  } else {
    const filtered = bgmFilter === 'all' ? bgmData : bgmData.filter(b => 
      (b.platform || '').includes(bgmFilter) || (b.mood || '').includes(bgmFilter)
    );
    
    list.innerHTML = filtered.map(b => {
      const plats = (b.platform || '').split('+');
      const platTags = plats.map(p => {
        const t = p.trim();
        if (t === '抖音') return '<span class="bgm-plat-tag dy">🎵 抖音</span>';
        if (t === '小红书') return '<span class="bgm-plat-tag xhs">📕 小红书</span>';
        return `<span class="bgm-plat-tag both">${escapeHTML(b.platform)}</span>`;
      }).join('');
      
      const statusClass = (b.status||'').includes('上升') ? 'up' : (b.status||'').includes('长尾') ? 'long' : 'hot';
      
      return `<div class="bgm-card">
        <div class="bgm-card-head">
          <div>
            <div class="bgm-name">${escapeHTML(b.name)}</div>
            <div class="bgm-artist">${escapeHTML(b.artist||'')}</div>
          </div>
          <span class="bgm-heat">🔥 ${b.heat||0}万</span>
        </div>
        <div class="bgm-platforms">${platTags}</div>
        <span class="bgm-status ${statusClass}">${escapeHTML(b.status||'热门')}</span>
        <div class="bgm-scene">📍 ${escapeHTML(b.scene||'')}</div>
        <div class="bgm-meta">
          <span>🎵 ${escapeHTML(b.mood||'')}</span>
          <span>⚡ ${escapeHTML(b.bpm||'')}</span>
          <span>⏱ ${escapeHTML(b.duration||'')}</span>
        </div>
        <div class="bgm-tip">💡 ${escapeHTML(b.tip||'')}</div>
        <div class="bgm-actions">
          ${b.link ? `<a class="link-btn" href="${escapeHTML(b.link)}" target="_blank" rel="noopener">🎧 试听</a>` : ''}
          <button class="link-btn" data-bgm-copy="${escapeHTML(b.name + ' - ' + (b.artist||''))}">📋 复制歌名</button>
        </div>
      </div>`;
    }).join('');
  }
  
  // 渲染技巧
  const tipsEl = $('#bgmTips');
  if (tipsEl && tipsData.length) {
    tipsEl.innerHTML = tipsData.map(t => `
      <div class="bgm-tip-card">
        <div class="bt-title">${escapeHTML(t.title)}</div>
        <div class="bt-desc">${escapeHTML(t.desc)}</div>
        <div class="bt-example">📌 ${escapeHTML(t.example)}</div>
      </div>`).join('');
  }
}

// BGM 筛选
$$('.bgm-filter').forEach(btn => {
  btn.addEventListener('click', function() {
    $$('.bgm-filter').forEach(b => b.classList.remove('active'));
    this.classList.add('active');
    bgmFilter = this.dataset.filter;
    renderBGM();
  });
});

// BGM 复制歌名
$('#content').addEventListener('click', e => {
  const copyBtn = e.target.closest('[data-bgm-copy]');
  if (copyBtn) {
    const text = copyBtn.dataset.bgmCopy;
    navigator.clipboard.writeText(text).then(() => toast('已复制：' + text)).catch(() => toast('复制失败'));
  }
});

/* ===================== 渲染：违禁词速查表（双平台分开） ===================== */
function renderBannedWords(){
  const el = $('#bannedTable');
  if (!el) return;

  const cloudBanned = getCloudData('banned-words', null);
  const common = cloudBanned ? (cloudBanned.bannedCommon || cloudBanned) : bannedCommon;
  const xhs = cloudBanned ? (cloudBanned.bannedXHS || []) : bannedXHS;
  const dy = cloudBanned ? (cloudBanned.bannedDY || []) : bannedDY;

  const renderTable = (title, words) => `
    <div class="bw-section">
      <div class="bw-section-title">${title}</div>
      <table>
        <tr><th style="width:90px">类型</th><th style="width:220px">🚫 禁用词</th><th>✅ 替换为</th></tr>
        ${words.map(b => `
          <tr>
            <td class="bw-type">${escapeHTML(b.type)}</td>
            <td class="bw-banned">${escapeHTML(b.banned)}</td>
            <td class="bw-replace">${escapeHTML(b.replace)}</td>
          </tr>`).join('')}
      </table>
    </div>`;

  el.innerHTML = `
    <div class="bw-tabs">
      <button class="bw-tab active" data-bw="all">全部</button>
      <button class="bw-tab" data-bw="common">🔵 通用</button>
      <button class="bw-tab" data-bw="xhs">📕 小红书专属</button>
      <button class="bw-tab" data-bw="dy">🎵 抖音专属</button>
    </div>
    <div class="bw-content" data-bw-content="all">
      ${renderTable('🔵 通用违禁词（两平台都查）', common)}
      ${renderTable('📕 小红书专属违禁词', xhs)}
      ${renderTable('🎵 抖音专属违禁词', dy)}
    </div>
    <div class="bw-content" data-bw-content="common" style="display:none">
      ${renderTable('🔵 通用违禁词（两平台都查）', common)}
    </div>
    <div class="bw-content" data-bw-content="xhs" style="display:none">
      ${renderTable('📕 小红书专属违禁词', xhs)}
    </div>
    <div class="bw-content" data-bw-content="dy" style="display:none">
      ${renderTable('🎵 抖音专属违禁词', dy)}
    </div>`;

  // Tab 切换
  $$('.bw-tab', el).forEach(tab => {
    tab.addEventListener('click', () => {
      $$('.bw-tab', el).forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      $$('[data-bw-content]', el).forEach(c => c.style.display = 'none');
      $(`[data-bw-content="${tab.dataset.bw}"]`, el).style.display = 'block';
    });
  });
}

/* ===================== 文案安检 ===================== */
function renderCopyCheck(){
  // 页面已预置，无需额外渲染
}

// 扫描文案中的违禁词
function scanText(text, platform) {
  if (!text.trim()) return { hits: [], clean: true };

  const words = platform === 'xhs'
    ? [...bannedCommon, ...bannedXHS]
    : platform === 'dy'
    ? [...bannedCommon, ...bannedDY]
    : [...bannedCommon, ...bannedXHS, ...bannedDY];

  const hits = [];
  const lower = text.toLowerCase();

  words.forEach(cat => {
    cat.banned.split('、').forEach(w => {
      const kw = w.trim();
      if (!kw) return;
      // 检查是否在文本中出现
      const idx = text.indexOf(kw);
      if (idx >= 0) {
        hits.push({
          word: kw,
          type: cat.type,
          replace: cat.replace,
          pos: idx,
          context: text.substring(Math.max(0, idx - 15), Math.min(text.length, idx + kw.length + 15))
        });
      }
    });
  });

  // 去重按位置排序
  const seen = new Set();
  const unique = hits.filter(h => {
    const key = `${h.word}-${h.pos}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).sort((a, b) => a.pos - b.pos);

  return { hits: unique, clean: unique.length === 0 };
}

// 渲���扫描结果
function renderScanResult(result) {
  const el = $('#scanResult');
  if (!el) return;

  if (!result || result.clean) {
    el.innerHTML = '<div class="scan-clean">✅ 未发现违禁词，可以放心发布！</div>';
    return;
  }

  const xhsHits = result.hits.filter(h => bannedXHS.some(c => c.type === h.type));
  const dyHits = result.hits.filter(h => bannedDY.some(c => c.type === h.type));
  const commonHits = result.hits.filter(h =>
    !bannedXHS.some(c => c.type === h.type) && !bannedDY.some(c => c.type === h.type)
  );

  el.innerHTML = `
    <div class="scan-warn">⚠️ 发现 <b>${result.hits.length}</b> 个疑似违禁词</div>
    <div class="scan-hits">
      ${result.hits.map(h => {
        const isXHS = bannedXHS.some(c => c.type === h.type);
        const isDY = bannedDY.some(c => c.type === h.type);
        const platTag = isXHS ? '<span class="plat-badge xhs">小红书</span>'
                      : isDY ? '<span class="plat-badge dy">抖音</span>'
                      : '<span class="plat-badge" style="background:rgba(255,255,255,.08);color:var(--text-2)">通用</span>';
        return `
        <div class="scan-hit">
          <div class="scan-hit-head">
            ${platTag}
            <span class="scan-hit-type">${escapeHTML(h.type)}</span>
            <span class="scan-hit-word">🚫 ${escapeHTML(h.word)}</span>
          </div>
          <div class="scan-hit-ctx">…${escapeHTML(h.context)}…</div>
          <div class="scan-hit-replace">✅ 建议替换为：${escapeHTML(h.replace)}</div>
        </div>`;
      }).join('')}
    </div>`;
}

// 绑定安检按钮
$('#scanBtn').addEventListener('click', () => {
  const text = $('#scanInput').value;
  const plat = $('.seg-btn.active', $('#scanPlatform')).dataset.plat || 'both';
  if (!text.trim()) { toast('请先粘贴文案'); return; }

  let result;
  if (plat === 'both') {
    // 两个平台都扫，取并集
    const r1 = scanText(text, 'xhs');
    const r2 = scanText(text, 'dy');
    const allHits = [...r1.hits];
    r2.hits.forEach(h => {
      if (!allHits.some(x => x.word === h.word && x.pos === h.pos)) {
        allHits.push(h);
      }
    });
    result = { hits: allHits.sort((a,b) => a.pos - b.pos), clean: allHits.length === 0 };
  } else {
    result = scanText(text, plat);
  }
  renderScanResult(result);
  $('#scanResult').scrollIntoView({ behavior: 'smooth' });
});

// 清空按钮
$('#scanClear').addEventListener('click', () => {
  $('#scanInput').value = '';
  $('#scanResult').innerHTML = '<div class="scan-hint">👆 左边粘贴文案，选择平台，点击扫描即可检查违禁词</div>';
});

// 文案安检平台切换
$$('#scanPlatform .seg-btn').forEach(b => {
  b.addEventListener('click', function() {
    $$('#scanPlatform .seg-btn').forEach(x => x.classList.remove('active'));
    this.classList.add('active');
  });
});

/* ===================== 弹层：热点 ===================== */
$('#newHotBtn').addEventListener('click', () => {
  $('#hotTitle').value = ''; $('#hotFrom').value = ''; $('#hotLink').value = ''; $('#hotAngle').value = '';
  $('#hotModal').classList.add('show');
});
$('#hotSave').addEventListener('click', () => {
  const title = $('#hotTitle').value.trim();
  if (!title) { toast('请输入热点标题'); return; }
  const icons = ['🔥','🎵','🐱','💼','🎬','✨','📈','🌟','🚀','💡','🎯','⚡'];
  hots.unshift({ id:uid(), title, from:$('#hotFrom').value.trim(), link:$('#hotLink').value.trim(), angle:$('#hotAngle').value.trim(), icon:icons[Math.floor(Math.random()*icons.length)] });
  renderHot(); $('#hotModal').classList.remove('show');
  toast('热点已收录 🚀');
});
$('#content').addEventListener('click', e => {
  const id = e.target.dataset.delHot;
  if (id) { hots = hots.filter(x => x.id !== id); renderHot(); toast('已删除热点'); }
});

/* ===================== 弹层：复盘 ===================== */
$('#newReviewBtn').addEventListener('click', () => {
  $('#rvTopic').value = ''; $('#rvViews').value = ''; $('#rvLikes').value = ''; $('#rvSaves').value = '';
  $('#rvComments').value = ''; $('#rvRate').value = ''; $('#rvLeads').value = ''; $('#rvNote').value = '';
  $('#reviewModal').classList.add('show');
});
$('#rvSave').addEventListener('click', () => {
  const topic = $('#rvTopic').value.trim();
  if (!topic) { toast('请输入内容主题'); return; }
  const plat = $('.seg-btn.active', $('#reviewModal')).dataset.plat || '小红书';
  reviews.unshift({
    id:uid(), topic, platform:plat,
    views:Number($('#rvViews').value)||0, likes:Number($('#rvLikes').value)||0,
    saves:Number($('#rvSaves').value)||0, comments:Number($('#rvComments').value)||0,
    rate:Number($('#rvRate').value)||0, leads:Number($('#rvLeads').value)||0,
    note:$('#rvNote').value.trim()
  });
  renderReview(); $('#reviewModal').classList.remove('show');
  toast('复盘已写入 📝');
});
$('#content').addEventListener('click', e => {
  const id = e.target.dataset.delRv;
  if (id) { reviews = reviews.filter(x => x.id !== id); renderReview(); toast('已删除复盘'); }
});

/* ===================== 弹层：通用关闭 ===================== */
$$('[data-close]').forEach(b => b.addEventListener('click', () => $(`#${b.dataset.close}`).classList.remove('show')));
$$('.modal-mask').forEach(m => m.addEventListener('click', () => m.parentElement.classList.remove('show')));
$$('.seg-btn').forEach(b => b.addEventListener('click', function() {
  const parent = this.parentElement;
  $$('.seg-btn', parent).forEach(x => x.classList.remove('active'));
  this.classList.add('active');
}));

/* ===================== 全局搜索（增强版） ===================== */
$('#globalSearch').addEventListener('input', function(e) {
  const q = e.target.value.trim().toLowerCase();
  if (!q) return;

  // 1. 搜索文案库中的路线名
  const cloudCal = getCloudData('calendar', null);
  const calSource = cloudCal || calendarData;
  const foundInCal = calSource.some(m =>
    m.month.includes(q) || m.routes.some(r => r.name.toLowerCase().includes(q))
  );

  // 2. 搜索 AI 生成历史
  const foundInAI = aiHistory.some(h =>
    h.place.toLowerCase().includes(q) || (h.activity && h.activity.includes(q))
  );

  if (foundInCal) {
    setPage('copy');
    $('#copySearch').value = q;
    renderCopyList(q);
  } else if (foundInAI) {
    // 显示 AI 历史中匹配的结果
    setPage('copy');
    const match = aiHistory.find(h => h.place.toLowerCase().includes(q));
    if (match) renderAIResult(match);
  } else {
    // 搜不到，提示 AI 生成
    setPage('copy');
    const aiInput = $('#aiRouteInput');
    if (aiInput) {
      aiInput.value = q;
      aiInput.focus();
      toast('未找到，试试 AI 生成？👇');
    }
  }
});

/* ===================== 初始化 ===================== */
async function init() {
  // 启动云端同步
  CloudSync.syncAll().then(() => {
    // 同步完成后刷新所有依赖云端数据的渲染
    renderTimeline();
    renderTopics();
    renderCommentMine();
    renderCalendar();
    renderRemixMethods();
    renderBannedWords();
    renderBGM();
    renderCopyList();
  }).catch(() => {
    // 同步失败，用种子数据渲染
  });

  // 先渲染种子数据（不等待云端）
  renderTasks();
  renderTimeline();
  renderTopics();
  renderCommentMine();
  renderHot();
  renderRemixMethods();
  renderBannedWords();
  renderBGM();
  renderCopyCheck();
  renderCopyList();
  renderReview();

  // 绑定 AI 生成
  bindAIGen();
}

init();

/* ESC */
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    $$('.modal.show').forEach(m => m.classList.remove('show'));
    $('#drawer').classList.remove('show');
  }
});

/* ===================== 路线二创：攻略 → 双平台文案 ===================== */

// 活动类型识别关键词
const REMIX_ACTIVITY_KEYWORDS = {
  '露营': ['露营', '帐篷', '星空', '篝火', '过夜'],
  '徒步': ['徒步', '登山', '爬', '步道', '穿越', '环线'],
  '滑雪': ['滑雪', '雪场', '雪道'],
  '漂流': ['漂流', '橡皮艇', '激流'],
  '赏花': ['花', '桃花', '樱花', '杏花', '油菜花', '花海'],
  '温泉': ['温泉', '泡汤', '汤泉'],
  '草原': ['草原', '草甸', '牧场'],
  '红叶': ['红叶', '秋天', '枫叶', '彩林'],
  '冰瀑': ['冰瀑', '冰挂', '冰瀑'],
  '溯溪': ['溯溪', '踩水', '溪水'],
  '骑行': ['骑行', '骑车', '自行车'],
  'Citywalk': ['citywalk', '胡同', 'city walk', '漫步'],
  '攀岩': ['攀岩', '攀爬', '岩壁'],
  '自驾': ['自驾', '公路', '开车', '车窗'],
  '摄影': ['摄影', '拍照', '机位', '出片'],
  '亲子': ['亲子', '带娃', '儿童', '孩子'],
};

// 季节识别
const REMIX_SEASON_KEYWORDS = {
  '春日': ['春', '3月', '4月', '5月', '花', '暖'],
  '夏日': ['夏', '6月', '7月', '8月', '避暑', '玩水'],
  '秋日': ['秋', '9月', '10月', '11月', '红叶', '银杏'],
  '冬日': ['冬', '12月', '1月', '2月', '雪', '冰'],
};

// 从攻略文本中提取关键信息
function parseRoute(text) {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  const allText = text;

  // 提取地名（常见模式：XX位于、XX在、XX出发、到XX）
  let place = '';
  const placePatterns = [
    /([^\s,，。]{2,6})位于/,
    /([^\s,，。]{2,6})在(?:河北|北京|山西|内蒙古|山东)/,
    /到([^\s,，。]{2,6})/,
    /([^\s,，。]{2,6})(?:出发|徒步|露营|徒步路线|风景区)/,
  ];
  for (const p of placePatterns) {
    const m = allText.match(p);
    if (m && m[1]) { place = m[1]; break; }
  }
  // 如果没匹配到，取第一行前几个字
  if (!place && lines.length > 0) {
    place = lines[0].replace(/[^\u4e00-\u9fa5a-zA-Z0-9]/g, '').slice(0, 6);
  }

  // 识别活动类型
  let activity = '徒步';
  for (const [act, keywords] of Object.entries(REMIX_ACTIVITY_KEYWORDS)) {
    if (keywords.some(k => allText.includes(k))) { activity = act; break; }
  }

  // 识别季节
  let season = '当季';
  for (const [s, keywords] of Object.entries(REMIX_SEASON_KEYWORDS)) {
    if (keywords.some(k => allText.includes(k))) { season = s; break; }
  }

  // 提取海拔
  let altitude = '';
  const altMatch = allText.match(/海拔(\d+)/);
  if (altMatch) altitude = altMatch[1] + '米';

  // 提取距离
  let distance = '';
  const distMatch = allText.match(/(?:全程|约|大约)(\d+)\s*(?:公里|km|千米)/i);
  if (distMatch) distance = distMatch[1] + '公里';

  // 提取车程
  let driveTime = '';
  const driveMatch = allText.match(/(?:车程|出发|开车)(?:约|大约)?(\d+(?:\.\d+)?)\s*(?:小时|h)/i);
  if (driveMatch) driveTime = driveMatch[1] + '小时';

  // 提取难度
  let difficulty = '';
  if (allText.includes('简单') || allText.includes('轻松') || allText.includes('入门')) difficulty = '简单';
  else if (allText.includes('中等') || allText.includes('适中')) difficulty = '中等';
  else if (allText.includes('困难') || allText.includes('挑战') || allText.includes('高强度')) difficulty = '有挑战';

  // 提取亮点
  const highlights = [];
  if (allText.includes('星空')) highlights.push('星空');
  if (allText.includes('日出') || allText.includes('日落')) highlights.push('日出日落');
  if (allText.includes('花')) highlights.push('花海');
  if (allText.includes('草甸') || allText.includes('草原')) highlights.push('高山草甸');
  if (allText.includes('长城')) highlights.push('长城');
  if (allText.includes('湖泊') || allText.includes('水库')) highlights.push('湖泊');
  if (allText.includes('森林')) highlights.push('森林');
  if (allText.includes('瀑布') || allText.includes('冰瀑')) highlights.push('瀑布');

  return { place, activity, season, altitude, distance, driveTime, difficulty, highlights, rawText: allText };
}

// 生成小红书文案
function genXHSCopy(info, style) {
  const { place, activity, season, altitude, distance, driveTime, difficulty, highlights } = info;

  let title, body, tags;

  if (style === '种草') {
    const hl = highlights.length > 0 ? highlights.slice(0, 3).join('+') : '风景';
    title = `${getEmoji(activity)} ${place}${activity}！${season}限定，${hl}太绝了`;
    body = `📍 ${place}\n${activity === '露营' ? '⛺' : '🥾'} ${activity}打卡\n\n`;
    if (driveTime) body += `🚗 北京出发${driveTime}直达\n`;
    if (altitude) body += `⛰️ 海拔${altitude}\n`;
    if (distance) body += `📏 全程${distance}\n`;
    if (difficulty) body += `💪 难度：${difficulty}\n`;
    body += `\n✨ 亮点：\n`;
    if (highlights.length > 0) {
      highlights.forEach(h => body += `• ${h}\n`);
    } else {
      body += `• 风景超赞，值得打卡\n`;
    }
    body += `\n👥 周末组队中，评论区扣1报名\n💬 主页有更多路线`;

  } else if (style === '攻略') {
    title = `📍 ${place}${activity}攻略｜${driveTime || '2小时'}直达${distance ? '·'+distance : ''}详细路线`;
    body = `📋 ${place}${activity}攻略\n\n`;
    body += `🚗 交通：北京出发${driveTime || '约2小时'}\n`;
    if (distance) body += `📏 路线长度：${distance}\n`;
    if (altitude) body += `⛰️ 海拔：${altitude}\n`;
    if (difficulty) body += `💪 难度等级：${difficulty}\n`;
    body += `\n🎒 装备建议：\n• 徒步鞋、防晒、足够的水\n• 保暖外套（山区温差大）\n• 充电宝、离线地图\n`;
    body += `\n⚠️ 注意事项：\n• 提前下载轨迹（部分路段无信号）\n• 结伴同行，不要单独行动\n• 带走垃圾，无痕户外\n`;
    body += `\n👥 跟我们走，省心省力：车接车送+领队+装备\n💬 评论区扣1或主页了解`;

  } else { // vlog
    title = `${getEmoji(activity)} ${place}周末逃离计划｜${activity}vlog`;
    body = `周末就该这样过。\n\n${place}，北京出发${driveTime || '2小时'}，${activity}人的快乐老家。\n\n`;
    if (highlights.length > 0) {
      body += `${highlights.map(h => h).join('、')}，每一样都让人想多待一天。\n\n`;
    }
    if (difficulty) body += `难度${difficulty}，新手也能冲。\n`;
    body += `\n这周末组队去，评论区扣1。\n主页有更多路线，欢迎加入。`;
  }

  tags = `#${place} #${activity} #北京出发 #周末去哪 #户外组队`;
  if (season !== '当季') tags += ` #${season}`;
  if (highlights.includes('星空')) tags += ` #星空`;
  if (highlights.includes('长城')) tags += ` #长城`;

  return { title, body, tags };
}

// 生成抖音文案
function genDYCopy(info, style) {
  const { place, activity, season, altitude, distance, driveTime, difficulty, highlights } = info;

  let title, body, tags, hook;

  if (style === '种草') {
    const hl = highlights[0] || '风景';
    title = `${place}${activity}！北京出发${driveTime || '2小时'}，${season}必去！`;
    body = `${place}，北京打工人的周末逃离地。\n${driveTime ? '车程'+driveTime : ''}${distance ? '全程'+distance : ''}\n${difficulty ? '难度'+difficulty : ''}\n这周末组队，评论区扣1！`;
    hook = `第1秒：${highlights[0] || '风景'}特写+节奏切入`;

  } else if (style === '攻略') {
    title = `${place}${activity}攻略！${distance || '详细路线'}避坑指南`;
    body = `去${place}之前必看！\n${driveTime ? '车程'+driveTime+' ' : ''}${distance ? '全程'+distance+' ' : ''}${difficulty ? '难度'+difficulty : ''}\n装备清单+注意事项+路线图\n跟着我们走不踩坑，评论区扣1`;
    hook = `第1秒：路线地图+「去之前必看」文字`;

  } else {
    title = `${place}周末vlog｜北京出发${driveTime || '2小时'}${activity}`;
    body = `周末就该这样过。\n${place}${activity}，${highlights[0] || '风景'}绝了。\n这周末继续组队，扣1报名。`;
    hook = `第1秒：${highlights[0] || '风景'}慢镜头+BGM副歌`;
  }

  tags = `#${place} #${activity} #北京周末`;
  if (season !== '当季') tags += ` #${season}`;
  tags += ` #组队`;

  return { title, body, tags, hook };
}

function getEmoji(activity) {
  const map = { '露营':'⛺', '徒步':'🥾', '滑雪':'🏂', '漂流':'💦', '赏花':'🌸', '温泉':'♨️', '草原':'🌾', '红叶':'🍁', '冰瀑':'🧊', '溯溪':'🦶', '骑行':'🚴', 'Citywalk':'🚶', '攀岩':'🧗', '自驾':'🛣️', '摄影':'📷', '亲子':'👨‍👩‍👧' };
  return map[activity] || '📍';
}

// 渲染二创结果
function renderRemixResult(info, xhs, dy) {
  const el = $('#remixResult');
  if (!el) return;

  // 合并所有文案做违禁词扫描
  const allText = xhs.title + ' ' + xhs.body + ' ' + xhs.tags + ' ' + dy.title + ' ' + dy.body + ' ' + dy.tags;
  const scanResult = scanText(allText, 'both');
  const scanBadge = scanResult.clean
    ? '<div class="remix-scan pass">✅ 违禁词检查通过，可以放心发布</div>'
    : `<div class="remix-scan warn">⚠️ 发现 ${scanResult.hits.length} 个疑似违禁词，建议替换后再发</div>`;

  el.innerHTML = `
    <div class="remix-output">
      <div class="remix-out-card">
        <div class="remix-out-head"><span class="dot xhs-dot"></span>📕 小红书（${info.style || '种草'}风格）</div>
        <div class="remix-out-section"><div class="remix-out-label">标题</div><div class="remix-out-val">${escapeHTML(xhs.title)}</div></div>
        <div class="remix-out-section"><div class="remix-out-label">正文</div><div class="remix-out-val">${escapeHTML(xhs.body)}</div></div>
        <div class="remix-out-section"><div class="remix-out-label">标签</div><div class="remix-out-tags">${xhs.tags.split(/\s+/).filter(Boolean).map(t=>`<span>${escapeHTML(t)}</span>`).join('')}</div></div>
        <div class="remix-out-actions">
          <button class="btn ghost" data-copy-xhs="${escapeHTML(xhs.title + '\n\n' + xhs.body + '\n\n' + xhs.tags)}">📋 复制全部</button>
        </div>
      </div>
      <div class="remix-out-card">
        <div class="remix-out-head"><span class="dot dy-dot"></span>🎵 抖音（${info.style || '种草'}风格）</div>
        <div class="remix-out-section"><div class="remix-out-label">标题/口播</div><div class="remix-out-val">${escapeHTML(dy.title)}</div></div>
        <div class="remix-out-section"><div class="remix-out-label">文案</div><div class="remix-out-val">${escapeHTML(dy.body)}</div></div>
        <div class="remix-out-section"><div class="remix-out-label">标签</div><div class="remix-out-tags">${dy.tags.split(/\s+/).filter(Boolean).map(t=>`<span>${escapeHTML(t)}</span>`).join('')}</div></div>
        <div class="remix-out-section"><div class="remix-out-label">前3秒钩子</div><div class="remix-out-val">${escapeHTML(dy.hook)}</div></div>
        <div class="remix-out-actions">
          <button class="btn ghost" data-copy-dy="${escapeHTML(dy.title + '\n\n' + dy.body + '\n\n' + dy.tags + '\n\n钩子：' + dy.hook)}">📋 复制全部</button>
        </div>
      </div>
      ${scanBadge}
      ${!scanResult.clean ? `<div class="scan-hits">${scanResult.hits.map(h=>`<div class="scan-hit"><div class="scan-hit-head"><span class="scan-hit-type">${escapeHTML(h.type)}</span><span class="scan-hit-word">🚫 ${escapeHTML(h.word)}</span></div><div class="scan-hit-replace">✅ 替换为：${escapeHTML(h.replace)}</div></div>`).join('')}</div>` : ''}
    </div>`;
}

// 绑定二创按钮
$('#remixGenBtn').addEventListener('click', () => {
  const text = $('#remixInput').value.trim();
  if (!text || text.length < 10) { toast('请粘贴至少 10 字的攻略内容'); return; }

  const styleBtn = $('.seg-btn.active', $('#remixStyle'));
  const style = styleBtn ? styleBtn.dataset.style : '种草';

  // 解析攻略
  const info = parseRoute(text);
  info.style = style;

  // 生成双平台文案
  const xhs = genXHSCopy(info, style);
  const dy = genDYCopy(info, style);

  // 渲染
  renderRemixResult(info, xhs, dy);
  toast('✨ 文案已生成，已过违禁词检查');
  $('#remixResult').scrollIntoView({ behavior: 'smooth' });
});

// 二创风格切换
$$('#remixStyle .seg-btn').forEach(b => {
  b.addEventListener('click', function() {
    $$('#remixStyle .seg-btn').forEach(x => x.classList.remove('active'));
    this.classList.add('active');
  });
});

// 二创结果复制
$('#content').addEventListener('click', e => {
  const xhsBtn = e.target.closest('[data-copy-xhs]');
  if (xhsBtn) {
    navigator.clipboard.writeText(xhsBtn.dataset.copyXhs).then(() => toast('小红书文案已复制 ✨')).catch(() => toast('复制失败'));
    return;
  }
  const dyBtn = e.target.closest('[data-copy-dy]');
  if (dyBtn) {
    navigator.clipboard.writeText(dyBtn.dataset.copyDy).then(() => toast('抖音文案已复制 ✨')).catch(() => toast('复制失败'));
    return;
  }
});


/* ===================== 粉丝互动话术库 ===================== */
let interactStage = 'all';
let interactPlat = 'xhs';

function renderInteract() {
  const cloud = CloudSync.getCached('scripts');
  const scenesData = (cloud && cloud.scenes) ? cloud : (cloud && cloud.data && cloud.data.scenes ? cloud.data : { scenes: [], tips: [] });
  const scenes = scenesData.scenes || [];
  const tips = scenesData.tips || [];

  const list = $('#interactList');
  if (!list) return;

  const filtered = scenes.filter(s => interactStage === 'all' || s.stage_en === interactStage);

  if (!filtered.length) {
    list.innerHTML = '<div class="scan-hint">暂无话术数据</div>';
  } else {
    list.innerHTML = filtered.map(s => {
      const scripts = s[interactPlat] || [];
      const platName = interactPlat === 'xhs' ? '小红书' : '抖音';
      const platIcon = interactPlat === 'xhs' ? '📕' : '🎵';

      // 对每条话术做违禁词预检
      const scriptsHTML = scripts.map((t, idx) => {
        const scan = scanText(t, interactPlat);
        const warnBadge = scan.clean ? '' : `<span class="interact-warn">⚠️含违禁词</span>`;
        return `
          <div class="interact-script">
            <div class="interact-script-head">
              <span class="interact-script-num">话术 ${idx + 1}</span>
              ${warnBadge}
            </div>
            <div class="interact-script-text">${escapeHTML(t).replace(/\n/g, '<br>')}</div>
            <div class="interact-script-actions">
              <button class="link-btn" data-interact-copy="${escapeHTML(t)}">📋 复制</button>
              <button class="link-btn" data-interact-scan="${escapeHTML(t)}" data-plat="${interactPlat}">🔍 查违禁词</button>
            </div>
          </div>`;
      }).join('');

      return `
        <div class="interact-card">
          <div class="interact-card-head">
            <div class="interact-card-icon">${s.icon}</div>
            <div class="interact-card-info">
              <div class="interact-card-stage">${escapeHTML(s.stage)}</div>
              <div class="interact-card-scenario">${escapeHTML(s.scenario)}</div>
            </div>
            <span class="interact-card-plat">${platIcon} ${platName}</span>
          </div>
          <div class="interact-card-intent">💡 ${escapeHTML(s.intent)}</div>
          <div class="interact-scripts">${scriptsHTML}</div>
        </div>`;
    }).join('');
  }

  // 渲染技巧
  const tipsEl = $('#interactTips');
  if (tipsEl && tips.length) {
    tipsEl.innerHTML = tips.map(t => `
      <div class="interact-tip-card">
        <div class="it-head">
          <span class="it-title">${escapeHTML(t.title)}</span>
          <span class="it-tag">${escapeHTML(t.tag)}</span>
        </div>
        <div class="it-desc">${escapeHTML(t.desc)}</div>
      </div>`).join('');
  }
}

// 场景筛选
$$('.interact-filter').forEach(btn => {
  btn.addEventListener('click', function() {
    $$('.interact-filter').forEach(b => b.classList.remove('active'));
    this.classList.add('active');
    interactStage = this.dataset.stage;
    renderInteract();
  });
});

// 平台切换
$$('.interact-plat-tab').forEach(btn => {
  btn.addEventListener('click', function() {
    $$('.interact-plat-tab').forEach(b => b.classList.remove('active'));
    this.classList.add('active');
    interactPlat = this.dataset.plat;
    renderInteract();
  });
});

// 话术复制和扫描
$('#content').addEventListener('click', e => {
  const copyBtn = e.target.closest('[data-interact-copy]');
  if (copyBtn) {
    const text = copyBtn.dataset.interactCopy;
    navigator.clipboard.writeText(text).then(() => toast('话术已复制 📋')).catch(() => {
      // 降级方案
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); toast('话术已复制 📋'); } catch { toast('复制失败'); }
      document.body.removeChild(ta);
    });
    return;
  }
  const scanBtn = e.target.closest('[data-interact-scan]');
  if (scanBtn) {
    const text = scanBtn.dataset.interactScan;
    const plat = scanBtn.dataset.plat;
    const result = scanText(text, plat);
    if (result.clean) {
      toast('✅ 未发现违禁词，可放心使用');
    } else {
      const words = result.hits.map(h => h.word).join('、');
      toast(`⚠️ 发现 ${result.hits.length} 个违禁词: ${words}`);
    }
    return;
  }
});


/* PWA */
if ('serviceWorker' in navigator) {
  const swCode = `const C='tw-v2';self.addEventListener('install',e=>{self.skipWaiting()});self.addEventListener('activate',e=>{e.waitUntil(self.clients.claim())});self.addEventListener('fetch',e=>{e.respondWith(caches.open(C).then(c=>c.match(e.request).then(r=>r||fetch(e.request).then(res=>{if(e.request.method==='GET'&&res.ok)c.put(e.request,res.clone());return res}).catch(()=>c.match('./index.html')))))});self.addEventListener('message',e=>{if(e.data&&e.data.type==='SKIP_WAITING')self.skipWaiting()});`;
  const blob = new Blob([swCode], { type: 'application/javascript' });
  navigator.serviceWorker.register(URL.createObjectURL(blob)).catch(()=>{});
}
