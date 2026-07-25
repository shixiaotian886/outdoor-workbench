/* ===================== 云端配置 ===================== */
const CLOUD_BASE = '../cloud-config'; // 从app目录到cloud-config的相对路�?
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
    const icons = { idle: '☁️', syncing: '�?', synced: '�?', offline: '⚠️' };
    const titles = { idle: '点击同步云端配置', syncing: '同步中�?', synced: '云端已同�?', offline: '离线（使用本地缓存）' };
    el.textContent = icons[this.syncStatus] || '☁️';
    el.title = titles[this.syncStatus] || '点击同步云端配置';
    el.style.cursor = this.syncStatus === 'syncing' ? 'default' : 'pointer';
  }
};

/* 同步状态图标点击事�? */
document.addEventListener('DOMContentLoaded', () => {
  const syncIcon = $('#syncIcon');
  if (syncIcon) {
    syncIcon.addEventListener('click', () => {
      if (CloudSync.syncStatus !== 'syncing') CloudSync.syncAll();
    });
  }
});

/* ===================== 种子数据 ===================== */

/* 今日时间�? */
const timelineSlots = [
  { time:'09:00', desc:'看季节日�? + 评论区挖痛点，定今日选题', tip:'查内容日历页面，确定今天该发什�?' },
  { time:'09:15', desc:'写文�? / 拍素�? / 剪视�?', tip:'小红书图文优先，抖音视频复用素材' },
  { time:'10:30', desc:'📕 小红书发布（黄金时段 8-10 点）', tip:'标题关键词前置，5-8个标签含长尾�?' },
  { time:'12:00', desc:'🎵 抖音发布（午高峰 11-13 点）', tip:'�?3秒钩子，3-5个标�?+热门话题' },
  { time:'14:00', desc:'找热点：抖音�?+小红书话�?+巨量算数', tip:'10分钟快速扫，�?1个可二创�?' },
  { time:'14:15', desc:'二创：BGM借势 / 话题借势 / 结构复刻 / 反差', tip:'见热点页的二创方法速查' },
  { time:'15:00', desc:'二创内容发布', tip:'同内容双平台发，但文案和剪辑分开' },
  { time:'19:00', desc:'回复评论 + 私信引流到微信群', tip:'每条评论都是选题金矿，顺手记到选题�?' },
  { time:'22:00', desc:'数据复盘 + 记入复盘�?', tip:'2h初速看互动率，24h终值看播放�?' },
];

/* 今日选题决策�? */
const seedTopics = () => [
  { id:uid(), name:'坝上草原 2 日游组队', from:'季节日历', scores:{season:5,pain:4,material:5,hook:5,trend:4}, hook:'北京40°C�?2小时逃到20°C草原，这周末15人已报名' },
  { id:uid(), name:'北京周边溯溪路线 Top5', from:'评论�?', scores:{season:5,pain:5,material:3,hook:4,trend:3}, hook:'别再问我"有水的地�?"了，�?5条溯溪路线直接收�?' },
  { id:uid(), name:'第一次露营需要带什�?', from:'评论�?', scores:{season:4,pain:5,material:4,hook:4,trend:3}, hook:'300块搞定第一次露营，装备清单+我们免费借的装备' },
  { id:uid(), name:'周末 Citywalk 组队：胡�?+咖啡', from:'热点借势', scores:{season:4,pain:4,material:5,hook:4,trend:5}, hook:'Citywalk火了？北京这3条路线我们每周都组队�?' },
];

/* 评论区挖�? */
const seedComments = () => [
  { q:'"有儿童能去的路线�?"', topic:'亲子友好路线 Top5' },
  { q:'"没有装备怎么�?"', topic:'新手装备清单 + 我们能借的' },
  { q:'"安全吗？有没有领�?"', topic:'我们的安全流�? + 领队资质' },
  { q:'"怎么报名？多少钱"', topic:'报名流程 + 费用明细公开' },
  { q:'"一个人去会不会尴尬"', topic:'看看往期合影，都是一个人来的' },
  { q:'"腿脚不好有轻松的路线�?"', topic:'零难度入门路线推�?' },
];

/* 二创方法速查 */
const remixMethods = [
  { tag:'�? �?5分钟', title:'BGM 借势', desc:'爆款BGM + 自己往期素材。剪映同款音乐，套徒�?/露营/合影素材，加3-5句字幕点�?', time:'5 分钟' },
  { tag:'�? 常用', title:'话题借势', desc:'蹭热门话题标签，内容原创。看�?#打工人周�? �? �? 做「北京出�?2小时，躲进山里�?', time:'10 分钟' },
  { tag:'🎯 推荐', title:'结构复刻', desc:'拆爆款的结构，填自己的料。数�?+日常+感悟 �? 带过N个人爬过N座山+往期合�?+领队感悟', time:'15 分钟' },
  { tag:'💡 爆款利器', title:'反差二创', desc:'对着热点反向输出。人山人�? �? 没人知道的同款风景。装�?2�? �? 300块搞定。被�? �? 跟我们走不踩�?', time:'15 分钟' },
];

/* 北京户外年度内容日历 - 12 个月，每月含路线+双平台文�? */
const calendarData = [
  {
    month:'1�?', theme:'冰瀑·雪景·温泉徒�?',
    routes:[
      { name:'龙庆峡冰灯节', xhsTitle:'❄️ 北京出发1.5h｜闯入冰雪奇缘现场，龙庆峡冰灯太震撼�?', xhsTags:'#龙庆�? #北京冰灯 #北京周末 #户外组队', dyTitle:'北京出发1.5h，龙庆峡冰灯，美到窒息！', dyTags:'#龙庆�? #北京冰雪 #周末去哪', dyHook:'�?1秒：冰灯全景航拍' },
      { name:'白河峡谷冰瀑徒�?', xhsTitle:'🧊 北京周边宝藏冰瀑！白河峡谷徒步，拍出人生照�?', xhsTags:'#白河峡谷 #冰瀑徒�? #北京户外 #组队', dyTitle:'白河峡谷冰瀑徒步，北京冬天值得去！', dyTags:'#白河峡谷 #冰�? #徒步', dyHook:'�?1秒：冰瀑特�?+脚步�?' },
      { name:'古北水镇雪景·温泉', xhsTitle:'🏮 北京下雪了！古北水镇雪景+温泉，周末组队中', xhsTags:'#古北水镇 #北京雪景 #温泉 #周末组队', dyTitle:'下雪的古北水镇，才是北京冬天该有的样子！', dyTags:'#古北水镇 #雪景 #温泉', dyHook:'�?1秒：无人机穿雪而过' },
    ]
  },
  {
    month:'2�?', theme:'春节周边游·早春探�?',
    routes:[
      { name:'崇礼滑雪 2�?', xhsTitle:'🏂 北京出发3h｜崇礼滑雪组队，新手友好，装备可�?', xhsTags:'#崇礼滑雪 #北京滑雪 #新手友好 #组队', dyTitle:'崇礼滑雪，北京出�?3小时，这周末发车�?', dyTags:'#崇礼 #滑雪 #北京周末', dyHook:'�?1秒：第一视角滑行+雪板�?' },
      { name:'京郊温泉一�?', xhsTitle:'♨️ 春节不想走远？京郊温泉一日，泡汤+农家菜，惬意', xhsTags:'#京郊温泉 #春节出游 #北京周末 #组队', dyTitle:'春节不远行，京郊温泉一日，泡着看雪�?', dyTags:'#温泉 #京郊 #春节', dyHook:'�?1秒：热气升腾慢镜�?' },
      { name:'居庸关长城早�?', xhsTitle:'🏯 2月居庸关长城｜人少景美，早春徒步正合�?', xhsTags:'#居庸�? #长城徒步 #北京户外 #淡季', dyTitle:'2月的长城才叫长城！居庸关早春徒步，几乎没人！', dyTags:'#居庸�? #长城 #早春', dyHook:'�?1秒：空无一人的长城全景' },
    ]
  },
  {
    month:'3�?', theme:'山桃花·轻徒步·春日唤醒',
    routes:[
      { name:'居庸关花海列�?', xhsTitle:'🌸 一年只�?2周！居庸关花�?+S2列车，北京春日限�?', xhsTags:'#居庸关花�? #S2列车 #北京春天 #组队', dyTitle:'北京春天必看！居庸关花海列车，一年只�?2周！', dyTags:'#居庸�? #花海 #S2列车', dyHook:'�?1秒：列车穿花海慢镜头' },
      { name:'平谷桃花�?', xhsTitle:'🌺 22万亩桃花开了！平谷桃花海徒�?+野餐，周末组�?', xhsTags:'#平谷桃花 #北京花海 #春日徒步 #组队', dyTitle:'北京22万亩桃花开了，平谷桃花海徒步组队中�?', dyTags:'#平谷 #桃花 #春天', dyHook:'�?1秒：无人机俯瞰粉色花�?' },
      { name:'玉渊潭樱花季', xhsTitle:'🌸 玉渊潭樱花季来了！避开人流攻略+出片机位分享', xhsTags:'#玉渊�? #樱花 #北京赏花 #攻略', dyTitle:'玉渊潭樱花开了，�?90%的人都挤错了地方�?', dyTags:'#玉渊�? #樱花 #攻略', dyHook:'�?1秒：人流对比+樱花特写' },
    ]
  },
  {
    month:'4�?', theme:'杏花·杜鹃·露营季开�?',
    routes:[
      { name:'延庆百里画廊', xhsTitle:'🖼�? 北京宝藏自驾路！百里画廊春天版，沿途全是画', xhsTags:'#百里画廊 #延庆 #北京自驾 #组队', dyTitle:'北京宝藏自驾路！延庆百里画廊，春天全是画�?', dyTags:'#百里画廊 #延庆 #自驾', dyHook:'�?1秒：车窗视角公路大片' },
      { name:'海坨山露营开�?', xhsTitle:'�? 2026露营季开启！海坨山谷帐篷+星空，组队中', xhsTags:'#海坨�? #露营 #星空 #北京露营 #组队', dyTitle:'海坨山露营季开了！北京出发2.5h，帐�?+星空�?', dyTags:'#海坨�? #露营 #星空', dyHook:'�?1秒：日落+帐篷亮灯延时' },
      { name:'箭扣长城野长�?', xhsTitle:'🧗 箭扣长城｜北京很野的长城段，有胆来组�?', xhsTags:'#箭扣长城 #野长�? #北京户外 #徒步', dyTitle:'北京很野的长城！箭扣，敢来的�?1�?', dyTags:'#箭扣 #长城 #徒步', dyHook:'�?1秒：第一人称攀爬视�?' },
    ]
  },
  {
    month:'5�?', theme:'五一长线·高山草甸·草原',
    routes:[
      { name:'坝上草原 2�?', xhsTitle:'🐴 五一去哪？坝上草�?2日游组队：骑�?+篝火+星空', xhsTags:'#坝上草原 #五一去哪 #骑马 #篝火 #组队', dyTitle:'五一坝上草原2日游，骑马篝火星空，15人发车！', dyTags:'#坝上草原 #五一 #骑马', dyHook:'�?1秒：万马奔腾+篝火燃起' },
      { name:'草原天路', xhsTitle:'🛣�? 北京出发3h｜草原天路，中国�?66号公�?', xhsTags:'#草原天路 #66号公�? #北京自驾 #组队', dyTitle:'北京出发3h，草原天路！中国�?66号公路！', dyTags:'#草原天路 #自驾 #66号公�?', dyHook:'�?1秒：公路延伸到天�?' },
      { name:'灵山高山草甸', xhsTitle:'⛰️ 北京最高峰！灵�?2303m高山草甸，像在瑞�?', xhsTags:'#灵山 #北京最高峰 #高山草甸 #徒步 #组队', dyTitle:'北京最高峰灵山�?2303米，像在瑞士徒步�?', dyTags:'#灵山 #北京最高峰 #徒步', dyHook:'�?1秒：高山草甸全景+牛群' },
    ]
  },
  {
    month:'6�?', theme:'玩水·溯溪·避暑',
    routes:[
      { name:'十渡拒马河玩�?', xhsTitle:'💦 北京40°C？十渡玩水一日：漂流+竹筏+水枪大战', xhsTags:'#十渡 #漂流 #北京玩水 #避暑 #组队', dyTitle:'北京40度！十渡漂流玩水一日，爽翻了！', dyTags:'#十渡 #漂流 #玩水', dyHook:'�?1秒：第一视角冲入水中' },
      { name:'龙庆峡避�?', xhsTitle:'🏞�? 北京小桂林！龙庆峡游�?+峡谷徒步，比市区�?10°C', xhsTags:'#龙庆�? #北京避暑 #峡谷 #游船 #组队', dyTitle:'北京小桂林！龙庆峡，比市区低10度！', dyTags:'#龙庆�? #避暑 #峡谷', dyHook:'�?1秒：游船穿过峡谷全景' },
      { name:'野三坡百里峡', xhsTitle:'🌿 野三坡百里峡｜北京出�?2h，天然空调房徒步', xhsTags:'#野三�? #百里�? #北京避暑 #徒步 #组队', dyTitle:'野三坡百里峡，北京出�?2h，天然空调房�?', dyTags:'#野三�? #百里�? #徒步', dyHook:'�?1秒：峡谷溪流特写+鸟鸣' },
    ]
  },
  {
    month:'7�?', theme:'草原·露营·亲子避暑',
    routes:[
      { name:'乌兰布统草原 3�?', xhsTitle:'🌾 北京出发5h｜乌兰布统草�?3日，还珠格格取景地！', xhsTags:'#乌兰布统 #草原 #还珠格格 #北京出发 #组队', dyTitle:'北京出发5h，乌兰布统草原！还珠格格同款取景地！', dyTags:'#乌兰布统 #草原 #还珠格格', dyHook:'�?1秒：草原策马+经典BGM' },
      { name:'崇礼太舞小镇避暑', xhsTitle:'🏔�? 崇礼夏天也很绝！太舞小镇避暑+缆车+山地�?', xhsTags:'#崇礼 #太舞小镇 #避暑 #缆车 #组队', dyTitle:'崇礼不只冬天！太舞小镇夏天避暑，绝了�?', dyTags:'#崇礼 #太舞 #避暑', dyHook:'�?1秒：缆车上升俯瞰山谷' },
      { name:'海坨山谷亲子露营', xhsTitle:'👨‍👩‍👧‍�? 带娃去哪？海坨山谷亲子露营：帐篷+游乐+星空', xhsTags:'#亲子露营 #海坨山谷 #遛娃 #北京周末 #组队', dyTitle:'带娃去哪？海坨山谷亲子露营，帐篷+星空�?', dyTags:'#亲子 #露营 #海坨山谷', dyHook:'�?1秒：孩子在草地上奔跑笑脸' },
    ]
  },
  {
    month:'8�?', theme:'草原·玩水·英仙座流星雨',
    routes:[
      { name:'坝上草原流星�?', xhsTitle:'🌠 8月英仙座流星雨！坝上草原观星组队，无光污�?', xhsTags:'#英仙座流星雨 #坝上 #观星 #露营 #组队', dyTitle:'8月英仙座流星雨！坝上草原观星，许愿去�?', dyTags:'#流星�? #坝上 #观星', dyHook:'�?1秒：延时星空+流星划过' },
      { name:'白河湾溯�?', xhsTitle:'🦶 白河湾溯溪！北京少见的清澈溪水，光脚踩水太解�?', xhsTags:'#白河�? #溯溪 #北京玩水 #夏日 #组队', dyTitle:'白河湾溯溪，北京少见的清澈溪水！光脚踩水�?', dyTags:'#白河�? #溯溪 #玩水', dyHook:'�?1秒：脚踩进溪水慢镜头' },
      { name:'京郊漂流合集', xhsTitle:'🌊 北京周边5���漂流地大盘点！刺激程度排名+组队', xhsTags:'#漂流 #北京周边 #夏日玩水 #攻略 #组队', dyTitle:'北京周边5个漂流地大盘点！刺激排名�?', dyTags:'#漂流 #攻略 #北京', dyHook:'�?1秒：激流勇进第一视角' },
    ]
  },
  {
    month:'9�?', theme:'早秋·长城日出·草原渐黄',
    routes:[
      { name:'金山岭长城日�?', xhsTitle:'🌅 北京宝藏日出！金山岭长城日出徒步，早秋限�?', xhsTags:'#金山�? #长城日出 #早秋 #徒步 #组队', dyTitle:'北京宝藏日出！金山岭长城，早秋限定！', dyTags:'#金山�? #日出 #长城', dyHook:'�?1秒：太阳从长城升起延�?' },
      { name:'司马台长�?', xhsTitle:'🏯 夜游长城！司马台长城灯光秀+古北水镇', xhsTags:'#司马�? #夜游长城 #古北水镇 #组队', dyTitle:'夜游司马台长城！灯光秀+水镇，太梦幻�?', dyTags:'#司马�? #夜游 #长城', dyHook:'�?1秒：长城亮灯瞬间' },
      { name:'坝上秋色初染', xhsTitle:'🍂 坝上草原开始黄了！9月初秋版，人少景�?', xhsTags:'#坝上秋色 #草原 #早秋 #北京出发 #组队', dyTitle:'坝上开始黄了！9月初秋草原，人少景美�?', dyTags:'#坝上 #秋天 #草原', dyHook:'�?1秒：黄绿交织的草原全�?' },
    ]
  },
  {
    month:'10�?', theme:'红叶（黄金月）·银杏·国�?',
    routes:[
      { name:'坡峰岭红�?', xhsTitle:'🍁 坡峰岭红叶超惊艳！满山红遍，一年就�?2�?', xhsTags:'#坡峰�? #红叶 #北京秋天 #徒步 #组队', dyTitle:'坡峰岭满山红遍！一年就�?2周，别错过！', dyTags:'#坡峰�? #红叶 #秋天', dyHook:'�?1秒：无人机航拍红色山�?' },
      { name:'妙峰山红�?', xhsTitle:'🏔�? 妙峰山红�?+古道徒步，比坡峰岭人少一�?', xhsTags:'#妙峰�? #红叶 #古道 #徒步 #组队', dyTitle:'妙峰山红叶！比坡峰岭人少一半，快冲�?', dyTags:'#妙峰�? #红叶 #古道', dyHook:'�?1秒：古道+红叶特写' },
      { name:'钓鱼台银杏大�?', xhsTitle:'💛 北京宝藏银杏！钓鱼台银杏大道，金黄隧�?', xhsTags:'#钓鱼�? #银杏 #北京秋天 #拍照 #组队', dyTitle:'北京宝藏银杏！钓鱼台金黄隧道，一年就这几天！', dyTags:'#银杏 #钓鱼�? #秋天', dyHook:'�?1秒：银杏叶飘落慢镜头' },
      { name:'八达岭红�?', xhsTitle:'🍂 八达岭红�?+长城�?10月北京超经典的画�?', xhsTags:'#八达�? #红叶 #长城 #北京秋天 #组队', dyTitle:'八达岭红�?+长城�?10月北京超经典的画面！', dyTags:'#八达�? #红叶 #长城', dyHook:'�?1秒：红叶映衬下的长城全景' },
    ]
  },
  {
    month:'11�?', theme:'银杏·初雪·温泉',
    routes:[
      { name:'故宫银杏+角楼', xhsTitle:'🏯 故宫银杏｜角�?+红墙+金黄，北京秋天最后的浪漫', xhsTags:'#故宫 #银杏 #角楼 #北京秋天 #拍照', dyTitle:'故宫银杏！角�?+红墙+金黄，秋天最后的美！', dyTags:'#故宫 #银杏 #角楼', dyHook:'�?1秒：角楼银杏倒影' },
      { name:'古北水镇温泉红叶', xhsTitle:'♨️ 古北水镇温泉季！泡着温泉看红叶，太惬意了', xhsTags:'#古北水镇 #温泉 #红叶 #北京周末 #组队', dyTitle:'古北水镇温泉季！泡温泉看红叶，绝了！', dyTags:'#古北水镇 #温泉 #红叶', dyHook:'�?1秒：温泉�?+红叶飘落' },
      { name:'香山初雪', xhsTitle:'❄️ 香山初雪！北京今年第一场雪，雪中红�?', xhsTags:'#香山 #初雪 #红叶 #北京冬天 #组队', dyTitle:'北京初雪！香山雪中红叶，一年见一次！', dyTags:'#香山 #初雪 #红叶', dyHook:'�?1秒：雪花落在红叶上特�?' },
    ]
  },
  {
    month:'12�?', theme:'跨年·冰雪·滑雪',
    routes:[
      { name:'崇礼跨年滑雪', xhsTitle:'🎿 跨年去哪？崇礼滑�?+跨年派对，组队中�?', xhsTags:'#崇礼 #跨年 #滑雪 #派对 #组队', dyTitle:'跨年崇礼滑雪！派�?+倒数+烟花，组队中�?', dyTags:'#崇礼 #跨年 #滑雪', dyHook:'�?1秒：烟花+雪道+倒数' },
      { name:'古北水镇跨年', xhsTitle:'🎆 古北水镇跨年：无人机灯光秀+长城倒数', xhsTags:'#古北水镇 #跨年 #无人�? #长城 #组队', dyTitle:'古北水镇跨年！无人机秀+长城倒数，超震撼�?', dyTags:'#古北水镇 #跨年 #无人�?', dyHook:'�?1秒：无人机编队升�?' },
      { name:'京郊冰瀑·黑龙潭', xhsTitle:'🧊 黑龙潭冰瀑！北京冬天超震撼的冰雪奇观', xhsTags:'#黑龙�? #冰�? #北京冬天 #冰雪 #组队', dyTitle:'黑龙潭冰瀑！北京超震撼的冰雪奇观�?', dyTags:'#黑龙�? #冰�? #冰雪', dyHook:'�?1秒：巨大冰瀑全�?' },
    ]
  },
];

/* 今日任务（替代原来的个人日常�? */
const seedTasks = () => [
  { id:uid(), col:'morning', name:'📕 发小红书�?' + (calendarData[6].routes[0].xhsTitle||'坝上草原'), done:false, note:'10:30发布' },
  { id:uid(), col:'morning', name:'🎵 发抖音：' + (calendarData[6].routes[0].dyTitle||'坝上草原'), done:false, note:'12:00发布' },
  { id:uid(), col:'afternoon', name:'🔥 追热点二创：Citywalk话题借势', done:false, note:'14:00-15:00完成' },
  { id:uid(), col:'evening', name:'💬 回复评论+私信引流', done:false, note:'19:00-20:00' },
  { id:uid(), col:'evening', name:'📊 数据复盘', done:false, note:'22:00前完�?' },
];

/* 热点 */
const seedHots = () => [
  { id:uid(), title:'「Citywalk」话题抖音小红书双爆', from:'抖音/小红�?', link:'', angle:'做《北�?5条Citywalk路线组队》：胡同咖啡+文创探店+胡同美食，每周末固定发团', icon:'🚶' },
  { id:uid(), title:'�?40°C高温逃离」话题飙�?', from:'抖音', link:'', angle:'做《北�?40°C�?2h逃到20°C草原�?+ 坝上草原实拍，对比市区温度反�?', icon:'🥵' },
  { id:uid(), title:'「周末图鉴」BGM 爆火', from:'抖音', link:'', angle:'BGM借势：剪往期徒�?/露营/合影素材，字�?"北京打工人的周末图鉴"', icon:'🎵' },
  { id:uid(), title:'「暑期亲子游」搜索量暴涨', from:'小红�?', link:'', angle:'做《带娃去哪？北京出发亲子路线Top5》海坨山�?/十渡/古北水镇亲子�?', icon:'👨‍👩‍👧‍�?' },
  { id:uid(), title:'「特种兵旅游」热度回�?', from:'抖音', link:'', angle:'反差二创：不做特种兵，做"周末慢旅�?"——深�?1-2日不走马观花', icon:'�?' },
];

/* ===================== 违禁词表：通用 / 小红书专�? / 抖音专属 ===================== */
// 通用违禁词（两个平台都查�?
const bannedCommon = [
  { type:'极限�?', banned:'最、最佳、最优、最好、最美、最野、最火、最强、最震撼、最清澈', replace:'超、非常、值得、宝藏、少见、推荐、惊艳、震�?' },
  { type:'极限�?', banned:'天花板、TOP级、顶级、顶�?', replace:'超惊艳、值得去、很推荐' },
  { type:'极限�?', banned:'第一、唯一、首家、首个、首选、NO.1、TOP1', replace:'值得选、很多人去、推�?' },
  { type:'2026新增', banned:'yyds、绝绝子、封神、绝版、王炸、无敌、殿堂级', replace:'很棒、惊艳、值得收藏' },
  { type:'夸张�?', banned:'全民抢购、抢疯了、再不抢就没了、错过再无、史上最低价', replace:'名额有限、抓紧报名、别错过' },
  { type:'承诺�?', banned:'100%、零风险、保证、无效退款、包治、根治、永�?', replace:'有保障、放心、靠�?' },
  { type:'医疗�?', banned:'治愈、治疗、消炎、杀菌、排毒、祛斑、防癌、降�?', replace:'放松、解压、舒缓、舒�?' },
  { type:'引流�?', banned:'加微信、V、VX、扫码、进群、私信领取、加V', replace:'主页了解、评论区�?1、滴滴我' },
  { type:'诱导�?', banned:'一键三连、求点赞、求收藏、互关互�?', replace:'觉得有用就存一下、喜欢可以关�?' },
  { type:'虚假促销', banned:'清仓、亏本、跳楼价、爆单、卖�?', replace:'性价比高、价格实在、划�?' },
  { type:'对比诋毁', banned:'别家不行、碾压同行、吊打同类、全网唯一靠谱', replace:'我们不一样的地方、我们的特色�?' },
  { type:'绝对�?', banned:'闭眼入、人手必备、全民种草、不踩雷', replace:'可以试试、值得了解、很多人在用' },
  { type:'虚假背书', banned:'央视推荐、国家认证、政府扶持、专家推荐、明星同�?', replace:'我们实测推荐、自己用过觉得好' },
  { type:'迷信�?', banned:'招财、转运、辟邪、改运、旺宅、开�?', replace:'（不建议使用此类表述�?' },
];

// 小红书专属违禁词（小红书查，抖音不一定查�?
const bannedXHS = [
  { type:'小红�?-夸大�?', banned:'鼻祖、王牌、性价比之王、祖传秘方、神效、秒杀同级', replace:'有特色、值得选、性价比不�?' },
  { type:'小红�?-测评禁词', banned:'完爆大牌、所有同类里好用、全网测评第一', replace:'用下来觉得不错、比之前用过的好' },
  { type:'小红�?-美妆禁词', banned:'医美级、院线同款、医用平替、医用级', replace:'温和好用、体验感�?' },
  { type:'小红�?-独家禁词', banned:'无平替、独家原料、独家配�?', replace:'有特色、难得找到、很特别' },
  { type:'小红�?-虚假测评', banned:'全闺蜜实测全好评�?100%好评、零差评', replace:'朋友用了都说不错、反馈都挺好�?' },
  { type:'小红�?-数据造假', banned:'已售10�?+（无凭证）、万人收藏（无凭证）', replace:'很多人问、反响不�?' },
];

// 抖音专属违禁词（抖音查，小红书不一定查�?
const bannedDY = [
  { type:'抖音-直播禁词', banned:'卖爆、爆单、疯技��亏本甩卖、跳楼价、厂家破�?', replace:'很受欢迎、卖得不错、性价比高' },
  { type:'抖音-虚假福利', banned:'免费领大奖、零元到手、点击领红包、一键薅羊毛', replace:'有福利、活动价、限时优�?' },
  { type:'抖音-直播逼单', banned:'最�?3单、马上抢、不买吃亏、库存告�?', replace:'名额不多、喜欢的可以下手' },
  { type:'抖音-养生禁词', banned:'纯天然零副作用、根治慢性病、纯天然无毒', replace:'自然食材、传统配方、食�?' },
  { type:'抖音-流量作弊', banned:'上热门、必火、涨粉神器、快速涨�?', replace:'用心做内容、慢慢积�?' },
  { type:'抖音-夸张效果', banned:'永久抗皱、一洗白、七天祛痘、三天见�?', replace:'坚持使用、慢慢改善、长期用下来' },
];

/* 复盘 */
const seedReviews = () => [
  { id:uid(), topic:'坡峰岭红�? vlog', platform:'小红�?', views:18420, likes:867, saves:423, comments:56, rate:8.6, leads:12, note:'开�?3秒红叶航拍钩子有效，互动率不错。下次结尾加投票"你更想看哪条路线"，引导评论�?' },
  { id:uid(), topic:'坝上草原组队', platform:'抖音', views:32500, likes:1203, saves:189, comments:87, rate:4.8, leads:23, note:'�?3秒万马奔腾镜头拉满完播率，报名私�?23人转化很好。但收藏偏低，下次加"收藏下次�?"引导�?' },
  { id:uid(), topic:'新手露营装备清单', platform:'小红�?', views:9800, likes:532, saves:1201, comments:34, rate:18.3, leads:8, note:'收藏量爆炸！说明实用干货型内容在小红书有强长尾。可以做一个系列：装备/路线/避坑�?' },
  { id:uid(), topic:'Citywalk组队·胡同咖啡', platform:'抖音', views:12400, likes:456, saves:89, comments:42, rate:5.1, leads:15, note:'Citywalk话题自带流量，但完播率偏低（平均只看到第8秒）。下次把路线亮点前移�?' },
];

/* ===================== 云端数据引用（渲染时优先用云端数据，否则降级种子数据�? ===================== */
function getCloudData(name, fallback) {
  const cached = CloudSync.getCached(name);
  return cached || fallback;
}

/* ===================== 初始化数�? ===================== */
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

/* ===================== 页面�? ===================== */
const pageName = { plan:'每日选题工作�?', calendar:'内容日历', hot:'爆款热点·二创', copy:'双平台文案库', check:'文案安检', bgm:'热点BGM', remix:'路线二创', interact:'粉丝互动话术', review:'数据复盘' };

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

/* ===================== 渲染：任务看�? ===================== */
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

/* ===================== 渲染：选题决策�? ===================== */
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
      <div class="topic-name">${go ? '�?' : '�?'} ${escapeHTML(t.name)}</div>
      <div class="topic-score">
        <span>季节${t.scores.season}</span><span>痛点${t.scores.pain}</span><span>素材${t.scores.material}</span>
        <span>钩子${t.scores.hook}</span><span>趋势${t.scores.trend}</span>
        <span class="score-total">${total}�? ${go ? '发！' : '再想�?'}</span>
      </div>
      <div class="topic-from">来源�?${escapeHTML(t.from)}</div>
      <div class="topic-hook">钩子�?${escapeHTML(t.hook)}</div>
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
      <div class="cmt-arrow">�?</div>
      <div class="cmt-topic">${escapeHTML(c.topic)}</div>
    </div>`).join('');
}

/* ===================== 渲染：日�? ===================== */
let calMonthIdx = 6; // 默认7�?
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
      <tr><th>路线</th><th>📕 小红书标�?</th><th>🎵 抖音标题</th></tr>
      ${m.routes.map(r => `
        <tr>
          <td class="route-name">${escapeHTML(r.name)}</td>
          <td class="route-copy"><span class="plat-badge xhs">小红�?</span>${escapeHTML(r.xhsTitle)}</td>
          <td class="route-copy"><span class="plat-badge dy">抖音</span>${escapeHTML(r.dyTitle)}</td>
        </tr>`).join('')}
    </table>
  </div>`;
}
$('#calPrev').addEventListener('click', () => { calMonthIdx = (calMonthIdx + 11) % 12; renderCalendar(); });
$('#calNext').addEventListener('click', () => { calMonthIdx = (calMonthIdx + 1) % 12; renderCalendar(); });

/* ===================== 渲染：热�? ===================== */
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
        <div class="hot-angle">二创角度�?${escapeHTML(h.angle||'�?')}</div>
        <div class="hot-actions">
          ${h.link ? `<a class="link-btn" href="${escapeHTML(h.link)}" target="_blank" rel="noopener">查看原片</a>` : ''}
          <button class="link-btn" data-del-hot="${h.id}">删除</button>
        </div>
      </div>`;
    list.appendChild(item);
  });
  save(LS.hots, hots);
}

/* ===================== 渲染：二创方�? ===================== */
function renderRemixMethods(){
  const el = $('#remixMethods');
  const data = getCloudData('remix-methods', remixMethods);
  el.innerHTML = data.map(m => `
    <div class="remix-card">
      <div class="rm-tag">${m.tag}</div>
      <div class="rm-title">${m.title}</div>
      <div class="rm-desc">${escapeHTML(m.desc)}</div>
      <div class="rm-time">�? �? ${m.time}</div>
    </div>`).join('');
}

/* ===================== AI 文案模板�? ===================== */
const aiTemplates = {
  '露营': {
    xhsTitle: '�? {place}露营！{season}限定，帐�?+星空+篝火，组队中',
    xhsTags: '#{place} #露营 #星空 #北京出发 #组队',
    dyTitle: '{place}露营！{season}组队中，帐篷+星空�?',
    dyTags: '#{place} #露营 #户外',
    dyHook: '�?1秒：帐篷亮灯+星空延时'
  },
  '徒步': {
    xhsTitle: '🥾 {place}徒步！{season}必走路线，沿途风景太值得�?',
    xhsTags: '#{place} #徒步 #户外 #北京周末 #组队',
    dyTitle: '{place}徒步！{season}出发，风景值得�?',
    dyTags: '#{place} #徒步 #户外',
    dyHook: '�?1秒：山脊线行走第一视角'
  },
  '滑雪': {
    xhsTitle: '🏂 {place}滑雪！{season}开板，新手友好，装备可�?',
    xhsTags: '#{place} #滑雪 #北京滑雪 #新手友好 #组队',
    dyTitle: '{place}滑雪！{season}开板，组队中！',
    dyTags: '#{place} #滑雪 #冬季',
    dyHook: '�?1秒：第一视角滑行+雪板�?'
  },
  '漂流': {
    xhsTitle: '🌊 {place}漂流！{season}玩水必去，刺激又解�?',
    xhsTags: '#{place} #漂流 #北京玩水 #避暑 #组队',
    dyTitle: '{place}漂流！{season}必玩，爽翻了�?',
    dyTags: '#{place} #漂流 #玩水',
    dyHook: '�?1秒：激流勇进第一视角'
  },
  '赏花': {
    xhsTitle: '🌸 {place}花海！{season}限定，拍照超出片',
    xhsTags: '#{place} #花海 #{season}赏花 #北京周末 #组队',
    dyTitle: '{place}花海！{season}限定，美到不想走�?',
    dyTags: '#{place} #赏花 #{season}',
    dyHook: '�?1秒：无人机俯瞰花�?'
  },
  '温泉': {
    xhsTitle: '♨️ {place}温泉！{season}泡汤+美食，惬意一�?',
    xhsTags: '#{place} #温泉 #{season}出游 #北京周末 #组队',
    dyTitle: '{place}温泉！{season}泡着看景，太惬意�?',
    dyTags: '#{place} #温泉 #{season}',
    dyHook: '�?1秒：热气升腾慢镜�?'
  },
  '草原': {
    xhsTitle: '🌾 {place}草原！{season}限定，骑�?+篝火+星空',
    xhsTags: '#{place} #草原 #{season} #骑马 #组队',
    dyTitle: '{place}草原！{season}出发，骑马篝火！',
    dyTags: '#{place} #草原 #{season}',
    dyHook: '�?1秒：万马奔腾+草原全景'
  },
  '红叶': {
    xhsTitle: '🍁 {place}红叶！{season}限定，满山红遍，一年就�?2�?',
    xhsTags: '#{place} #红叶 #秋天 #北京周末 #组队',
    dyTitle: '{place}红叶！{season}满山红遍，别错过�?',
    dyTags: '#{place} #红叶 #秋天',
    dyHook: '�?1秒：无人机航拍红色山�?'
  },
  '冰�?': {
    xhsTitle: '🧊 {place}冰瀑！{season}限定，北京超震撼冰雪奇观',
    xhsTags: '#{place} #冰�? #北京冬天 #冰雪 #组队',
    dyTitle: '{place}冰瀑！{season}限定，超震撼�?',
    dyTags: '#{place} #冰�? #冬天',
    dyHook: '�?1秒：巨大冰瀑全�?'
  },
  '溯溪': {
    xhsTitle: '🦶 {place}溯溪！{season}玩水推荐，清澈溪水光脚踩',
    xhsTags: '#{place} #溯溪 #北京玩水 #夏日 #组队',
    dyTitle: '{place}溯溪！{season}光脚踩水，太解压�?',
    dyTags: '#{place} #溯溪 #玩水',
    dyHook: '�?1秒：脚踩进溪水慢镜头'
  },
  '骑行': {
    xhsTitle: '🚴 {place}骑行！{season}推荐路线，沿途风景绝�?',
    xhsTags: '#{place} #骑行 #户外 #北京周末 #组队',
    dyTitle: '{place}骑行！{season}出发，风景在路上�?',
    dyTags: '#{place} #骑行 #户外',
    dyHook: '�?1秒：车轮+沿途风�?'
  },
  'Citywalk': {
    xhsTitle: '🚶 {place} Citywalk！{season}慢逛指南，胡同+咖啡+美食',
    xhsTags: '#{place} #Citywalk #北京周末 #探店 #组队',
    dyTitle: '{place} Citywalk！{season}慢逛，发现宝藏�?',
    dyTags: '#{place} #Citywalk #探店',
    dyHook: '�?1秒：街角咖啡+阳光洒落'
  },
  '攀�?': {
    xhsTitle: '🧗 {place}攀岩！{season}挑战自己，新手也可尝�?',
    xhsTags: '#{place} #攀�? #户外 #挑战 #组队',
    dyTitle: '{place}攀岩！{season}挑战，敢来的�?1�?',
    dyTags: '#{place} #攀�? #户外',
    dyHook: '�?1秒：第一人称攀爬视�?'
  },
  '越野': {
    xhsTitle: '🏃 {place}越野跑！{season}山野路线，风景超�?',
    xhsTags: '#{place} #越野�? #户外 #北京周末 #组队',
    dyTitle: '{place}越野！{season}山野跑起来！',
    dyTags: '#{place} #越野 #户外',
    dyHook: '�?1秒：山脊奔跑第一视角'
  },
  '自驾': {
    xhsTitle: '🛣�? {place}自驾！{season}宝藏路线，沿途全是风�?',
    xhsTags: '#{place} #自驾 #北京出发 #公路旅行 #组队',
    dyTitle: '{place}自驾！{season}宝藏路线，美在路上！',
    dyTags: '#{place} #自驾 #旅行',
    dyHook: '�?1秒：车窗视角公路大片'
  },
  '摄影': {
    xhsTitle: '📷 {place}出片机位！{season}摄影攻略，随手拍大片',
    xhsTags: '#{place} #摄影 #北京拍照 #{season} #攻略',
    dyTitle: '{place}拍照！{season}出片机位，随手大片！',
    dyTags: '#{place} #摄影 #拍照',
    dyHook: '�?1秒：快门�?+构图切换'
  },
  '亲子': {
    xhsTitle: '👨‍👩‍👧‍�? 带娃去哪？{place}亲子游，{season}遛娃推荐',
    xhsTags: '#{place} #亲子�? #遛娃 #北京周末 #组队',
    dyTitle: '带娃去{place}！{season}亲子游，孩子玩疯了！',
    dyTags: '#{place} #亲子 #遛娃',
    dyHook: '�?1秒：孩子在草地上奔跑笑脸'
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
    '滑雪': ['滑雪', '雪场', '开�?', '雪道'],
    '漂流': ['漂流', '竹筏', '皮划�?'],
    '赏花': ['赏花', '花海', '樱花', '桃花', '杏花', '梅花', '油菜�?'],
    '温泉': ['温泉', '泡汤', '泡澡', '汤泉'],
    '草原': ['草原', '牧场', '坝上', '乌兰布统'],
    '红叶': ['红叶', '枫叶', '银杏', '秋色'],
    '冰�?': ['冰�?', '冰灯', '冰挂', '冰雕'],
    '溯溪': ['溯溪', '溪水', '戏水', '玩水', '踩水'],
    '骑行': ['骑行', '骑车', '环线', '骑行�?'],
    'Citywalk': ['citywalk', 'city walk', '胡同', '逛街', '漫步'],
    '攀�?': ['攀�?', '抱石', '岩壁'],
    '越野': ['越野', '越野�?', '山地�?'],
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

  // 先尝试主题型生成（如"北京亲子路线带娃top5"�?
  const topicResult = genTopicCopy(input);
  if (topicResult) return topicResult;

  // 否则用地点型生成（如"麻田岭露�?"�?
  const place = extractPlaceName(input);
  const activity = detectActivityType(input);
  const season = getCurrentSeason();
  const template = activity ? aiTemplates[activity] : {
    xhsTitle: '\u{1F4CD} {place}\uFF0C{season}\u51FA\u53D1\uFF0C\u503C\u5F97\u53BB\u8BD5\u7684\u5730\u65B9',
    xhsTags: '#{place} #\u5317\u4EAC\u5468\u8FB9 #\u6237\u5916 #\u7EC4\u961F',
    dyTitle: '{place}\uFF0C{season}\u7EC4\u961F\u4E2D\uFF01\u98CE\u666F\u592A\u503C\u5F97\u4E86\uFF01',
    dyTags: '#{place} #\u6237\u5916 #\u5317\u4EAC',
    dyHook: '\u7B2C1\u79D2\uFF1A\u98CE\u666F\u5168\u666F+\u51FA\u53D1'
  };

  const fill = (str) => str.replace(/\{place\}/g, place).replace(/\{season\}/g, season);

  return {
    place,
    activity: activity || '\u901A\u7528',
    season,
    xhsTitle: fill(template.xhsTitle),
    xhsTags: fill(template.xhsTags),
    dyTitle: fill(template.dyTitle),
    dyTags: fill(template.dyTags),
    dyHook: fill(template.dyHook),
  };
}

// 主题型文案生成（识别"亲子""带娃""top5"等主题关键词�?
const TOPIC_TEMPLATES = {
  '\u4EB2\u5B50\u5E26\u5A03': {
    keywords: ['\u4EB2\u5B50','\u5E26\u5A03','\u5E69\u7AE5','\u5C0F\u5B69','\u5BB6\u5EAD','\u9075\u5B9D','\u9057\u817E'],
    gen: (input) => ({
      xhsTitle: '\u{1F476}\u5317\u4EAC\u4EB2\u5B50\u8DEF\u7EBF\u5408\u96C6\uFF01\u5E26\u5A03\u51FA\u95E8\u8FD95\u6761\u8DEF\u7EBF\uFF0C\u5B9D\u5B9D\u73A9\u4E0D\u591F',
      xhsBody: '\u5468\u672B\u5E26\u5A03\u53BB\u54EA\uFF1F\u6574\u7406\u4E865\u6761\u5317\u4EAC\u51FA\u53D1\u4EB2\u5B50\u8DEF\u7EBF\uFF0C\u6BCF\u6761\u90FD\u662F\u5B9D\u5B9D\u73A9\u4E0D\u591F\u7684\u5730\u65B9\uFF01\n\n\u{1F4CD}\u8DEF\u7EBF\u4E00\uFF1A\u53E4\u5317\u6C34\u9547\uFF0C\u53E4\u9547+\u6E29\u6CC9+\u7BE1\u706B\n\u{1F4CD}\u8DEF\u7EBF\u4E8C\uFF1A\u5EF6\u5E86\u767E\u91CC\u753B\u5ECA\u9A91\u884C\uFF0C\u5B9D\u5B9D\u770B\u98CE\u666F\n\u{1F4CD}\u8DEF\u7EBF\u4E09\uFF1A\u5369\u82B3\u82B1\u9999\u8C37\uFF0C\u91C7\u679C+\u7237\u7237\u519C\u573A\n\n\u6BCF\u6761\u8DEF\u7EBF\u90FD\u96BE\u5EA6\u4E0D\u9AD8\uFF0C\u5B9D\u5B9D\u80FD\u8DDF\u4E0A\uFF0C\u5168\u7A0B\u6709\u9886\u961F\u7167\u987E\u3002\u70B9\u8D77\u6765\u5E26\u5A03\u51FA\u95E8\u4E0D\u7D2F\u8FD8\u7701\u5FC3\u3002\n\n\u60F3\u5E26\u5A03\u51FA\u95E8\u7684\u5B9D\u5988\u4EEC\u7701\u5FC3\u4E86\uFF0C\u4E3B\u9875\u627E\u6211\u62FF\u5B8C\u6574\u8DEF\u7EBF\u653B\u7565',
      xhsTags: '#\u4EB2\u5B50\u8DEF\u7EBF #\u5317\u4EAC\u5E26\u5A03 #\u4EB2\u5B50\u6E38 #\u5468\u672B\u9053\u5A03 #\u9075\u5B9D\u795E\u5668 #\u5BB6\u5EAD\u51FA\u884C',
      dyTitle: '\u5317\u4EAC\u4EB2\u5B50\u8DEF\u7EBFTop5\uFF01\u5E26\u5A03\u51FA\u95E8\u8FD9\u6761\u5F88\u7701\u5FC3',
      dyBody: '\u5468\u672B\u5E26\u5A03\u53BB\u54EA\uFF1F5\u6761\u4EB2\u5B50\u8DEF\u7EBF\u5168\u90E8\u6574\u7406\u597D\u4E86\n\u96BE\u5EA6\u4E0D\u9AD8\uFF0C\u5B9D\u5B9D\u80FD\u8DDF\u4E0A\n\u4E3B\u9875\u627E\u6211\u62FF\u5B8C\u6574\u653B\u7565',
      dyTags: '#\u4EB2\u5B50\u8DEF\u7EBF #\u5317\u4EAC\u5E26\u5A03 #\u5BB6\u5EAD\u51FA\u884C #\u5468\u672B\u9053\u5A03',
      dyHook: '\u7B2C1\u79D2\uFF1A\u5B9D\u5B9D\u7B11\u8138\u7279\u5199+\u98CE\u666F\u5168\u666F'
    })
  },
  'Citywalk\u9053\u8FC2': {
    keywords: ['citywalk','\u9053\u8FC2','city walk','\u6D6E\u8855','\u6F02\u6D41','\u62CD\u7167'],
    gen: (input) => ({
      xhsTitle: '\u{1F97D}\u5317\u4EACCitywalk\u8DEF\u7EBF\u5408\u96C6\uFF01\u62CD\u7167+\u5496\u5561+\u6587\u521B\u5E97\u4E00\u7AD9\u5230\u5E95',
      xhsBody: '\u5317\u4EAC\u6700\u9002\u5408\u9053\u8FC2\u7684\u5E97\u90FD\u6574\u7406\u597D\u4E86\uFF01\n\n\u{1F4CD}\u8DEF\u7EBF\u4E00\uFF1A\u4E94\u9053\u8425\u2192\u6210\u8D4D\u8857\u2192\u5317\u4EAC\u8335\u5B50\n\u{1F4CD}\u8DEF\u7EBF\u4E8C\uFF1A\u9605\u5175\u5382\u2192\u9999\u5C71\u2192\u897F\u5C71\n\u{1F4CD}\u8DEF\u7EBF\u4E09\uFF1A\u4E09\u91CC\u5C6F\u2192\u9762\u8854\u2192\u4E1C\u76F4\u95E8\n\n\u6BCF\u6761\u8DEF\u7EBF\u90FD\u662F\u5496\u5561\u5E97+\u62CD\u7167\u70B9+\u6587\u521B\u5E97\u7684\u7EC4\u5408\uFF0C\u8D70\u8D70\u62CD\u62CD\u5C31\u5230\u3002\u4E3B\u9875\u627E\u6211\u62FF\u5B8C\u6574\u8DEF\u7EBF',
      xhsTags: '#Citywalk #\u5317\u4EAC\u9053\u8FC2 #\u62CD\u7167\u597D\u53BB\u5904 #\u5496\u5561\u5E97 #\u5317\u4EAC\u62CD\u7167 #\u5468\u672B\u53BB\u54EA',
      dyTitle: '\u5317\u4EACCitywalk\u5408\u96C6\uFF01\u62CD\u7167+\u5496\u5561\u4E00\u7AD9\u5230\u5E95',
      dyBody: '\u5317\u4EAC\u9053\u8FC2\u8DEF\u7EBF\u6574\u7406\u597D\u4E86\n\u5496\u5561\u5E97+\u62CD\u7167\u70B9\u90FD\u6709\n\u4E3B\u9875\u627E\u6211\u62FF\u5B8C\u6574\u8DEF\u7EBF',
      dyTags: '#Citywalk #\u5317\u4EAC\u9053\u8FC2 #\u5317\u4EAC\u62CD\u7167 #\u5468\u672B\u53BB\u54EA',
      dyHook: '\u7B2C1\u79D2\uFF1A\u8857\u9053\u5168\u666F+\u5496\u5561\u5E97\u7279\u5199'
    })
  },
  '\u5468\u672B\u9038\u9038': {
    keywords: ['\u5468\u672B\u9038\u9038','\u5468\u672B\u53BB\u54EA','\u5468\u672B\u600E\u4E48\u8FC7','\u5468\u672B\u73A9'],
    gen: (input) => ({
      xhsTitle: '\u{1F3D6}\u5317\u4EAC\u5468\u672B\u9038\u9038\u5408\u96C6\uFF01N\u4E2A\u53BB\u4E86\u5C31\u4E0D\u60F3\u56DE\u7684\u5730\u65B9',
      xhsBody: '\u5468\u672B\u4E0D\u77E5\u9053\u53BB\u54EA\uFF1F\u6574\u7406\u4E86N\u4E2A\u5317\u4EAC\u51FA\u53D1\u5468\u672B\u9038\u9038\u5730\u70B9\uFF01\n\n\u{1F4CD}\u8349\u539F\u7CFB\uFF1A\u575D\u4E0A\u8349\u539F\uFF0C\u98CE\u543B+\u8349\u576D+\u9A91\u9A6C\n\u{1F4CD}\u5C71\u7CFB\uFF1A\u6D77\u5774\u5C71\u89C2\u661F\uFF0C\u4E91\u6D77+\u65E5\u51FA\n\u{1F4CD}\u6D77\u7CFB\uFF1A\u5317\u6234\u6CB3\uFF0C\u6D77\u8FB9+\u65E5\u843D+\u6D77\u9C9C\n\n\u6BCF\u4E2A\u90FD\u662F\u5317\u4EAC\u51FA\u53D1\uFF0C\u8F66\u7A0B4\u5C0F\u65F6\u5185\u3002\u4E3B\u9875\u627E\u6211\u62FF\u5B8C\u6574\u8DEF\u7EBF',
      xhsTags: '#\u5468\u672B\u9038\u9038 #\u5317\u4EAC\u51FA\u53D1 #\u5468\u672B\u53BB\u54EA #\u5317\u4EAC\u5468\u672B #\u6237\u5916 #\u7EC4\u961F',
      dyTitle: '\u5317\u4EAC\u5468\u672B\u9038\u9038Top5\uFF01\u7B2C1\u4E2A\u53BB\u4E86\u5C31\u4E0D\u60F3\u56DE',
      dyBody: '\u5468\u672B\u4E0D\u77E5\u9053\u53BB\u54EA\uFF1F\n5\u4E2A\u5317\u4EAC\u51FA\u53D1\u7684\u9038\u9038\u5730\u70B9\n\u8F66\u7A0B4\u5C0F\u65F6\u5185\n\u4E3B\u9875\u627E\u6211\u62FF\u5B8C\u6574\u8DEF\u7EBF',
      dyTags: '#\u5468\u672B\u9038\u9038 #\u5317\u4EAC\u51FA\u53D1 #\u5468\u672B\u53BB\u54EA #\u6237\u5916',
      dyHook: '\u7B2C1\u79D2\uFF1A\u5168\u666F\u822A\u62CD+\u7279\u5199\u52A8\u4F5C'
    })
  },
  '\u907F\u5377\u65C5\u884C': {
    keywords: ['\u907F\u5377','\u5C0F\u4F17','\u4E0D\u6324','\u53CD\u5411','\u51B7\u95E8'],
    gen: (input) => ({
      xhsTitle: '\u{1F9ED}\u522B\u53BB\u6324\u4E86\uFF01\u5317\u4EAC\u51FA\u53D1N\u4E2A\u5C0F\u4F17\u907F\u5377\u5730\u70B9',
      xhsBody: '\u4EBA\u4ECE\u4F17\u7684\u5730\u65B9\u53BB\u4E86\u592A\u591A\u6B21\uFF1F\u8FD9\u4E9B\u5C0F\u4F17\u907F\u5377\u5730\u70B9\u4F60\u4E00\u5B9A\u6CA1\u53BB\u8FC7\uFF01\n\n\u{1F4CD}\u9695\u843D\u6C9F\uFF1A\u539F\u59CB\u68EE\u6797+\u6EAA\u6D41\uFF0C\u4EBA\u5C11\u666F\u7F8E\n\u{1F4CD}\u6CD7\u6C34\u6CB3\uFF1A\u660E\u6E05\u53E4\u9053\uFF0C\u6CA1\u6709\u5546\u4E1A\u6C14\n\n\u4EBA\u5C11\u666F\u7F8E\u8FD8\u5B89\u9759\uFF0C\u4E3B\u9875\u627E\u6211\u62FF\u5B8C\u6574\u8DEF\u7EBF\u653B\u7565',
      xhsTags: '#\u907F\u5377\u65C5\u884C #\u5C0F\u4F17\u666F\u70B9 #\u5317\u4EAC\u51FA\u53D1 #\u4E0D\u6324 #\u5468\u672B #\u6237\u5916',
      dyTitle: '\u522B\u53BB\u6324\u4E86\uFF01\u5317\u4EAC\u51FA\u53D1\u907F\u5377\u5730\u70B9\u5408\u96C6',
      dyBody: '\u4EBA\u5C11\u666F\u7F8E\u7684\u5C0F\u4F17\u5730\u70B9\n\u5317\u4EAC\u51FA\u53D1\uFF0C\u6CA1\u6709\u5546\u4E1A\u6C14\n\u4E3B\u9875\u627E\u6211\u62FF\u8DEF\u7EBF',
      dyTags: '#\u907F\u5377\u65C5\u884C #\u5C0F\u4F17\u666F\u70B9 #\u5317\u4EAC\u51FA\u53D1 #\u6237\u5916',
      dyHook: '\u7B2C1\u79D2\uFF1A\u7A7A\u65E0\u4E00\u4EBA\u7684\u98CE\u666F\u7279\u5199'
    })
  },
  '\u653B\u7565\u5408\u96C6': {
    keywords: ['top5','top10','\u5408\u96C6','\u76D8\u70B9','\u6E05\u5355','\u5408\u96C6','\u653B\u7565'],
    gen: (input) => {
      // 提取主题�?
      let topic = input.replace(/top\s*\d+|[\u5408\u96C6\u76D8\u70B9\u6E05\u5355\u653B\u7565\u8DEF\u7EBF]/gi,'').trim() || '\u5317\u4EAC\u5468\u8FB9';
      return {
        xhsTitle: '\u{1F4CB}' + topic + '\u5408\u96C6\uFF01\u6574\u7406\u597D\u4E86N\u4E2A\u503C\u5F97\u53BB\u7684\u5730\u65B9',
        xhsBody: topic + '\u600E\u4E48\u9009\uFF1F\u6574\u7406\u4E86N\u4E2A\u503C\u5F97\u53BB\u7684\u5730\u70B9\uFF01\n\n\u6BCF\u4E2A\u90FD\u662F\u7CBE\u6311\u7EC6\u9009\uFF0C\u53BB\u8FC7\u7684\u4EBA\u90FD\u8BF4\u597D\u3002\u4E3B\u9875\u627E\u6211\u62FF\u5B8C\u6574\u653B\u7565',
        xhsTags: '#' + topic + ' #\u5317\u4EAC\u51FA\u53D1 #\u5468\u672B\u53BB\u54EA #\u6237\u5916 #\u7EC4\u961F #\u653B\u7565',
        dyTitle: topic + '\u5408\u96C6\uFF01\u8FD9N\u4E2A\u5730\u65B9\u53BB\u4E86\u4E0D\u540E\u6094',
        dyBody: topic + '\u600E\u4E48\u9009\uFF1F\nN\u4E2A\u503C\u5F97\u53BB\u7684\u5730\u70B9\n\u7CBE\u6311\u7EC6\u9009\uFF0C\u4E3B\u9875\u627E\u6211\u62FF\u5B8C\u6574\u653B\u7565',
        dyTags: '#' + topic + ' #\u5317\u4EAC\u51FA\u53D1 #\u5468\u672B\u53BB\u54EA #\u6237\u5916',
        dyHook: '\u7B2C1\u79D2\uFF1A\u591A\u4E2A\u573A\u666F\u5FEB\u5207+\u7279\u5199\u52A8\u4F5C'
      };
    }
  }
};

// 主题型文案生�?
function genTopicCopy(input) {
  const lower = input.toLowerCase();
  for (const [name, config] of Object.entries(TOPIC_TEMPLATES)) {
    if (config.keywords.some(kw => lower.includes(kw.toLowerCase()))) {
      const result = config.gen(input);
      const season = getCurrentSeason();
      return {
        place: name,
        activity: name,
        season,
        ...result
      };
    }
  }
  return null;
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

  // 违禁词扫�?
  const scanResult = scanText(fullText, 'both');
  const scanBadge = scanResult.clean
    ? '<span class="scan-badge clean">�? 已过违禁�?</span>'
    : `<span class="scan-badge warn">⚠️ 发现 ${scanResult.hits.length} 个违禁词</span>`;

  const hitDetails = scanResult.clean ? '' : `
    <div class="ai-scan-details">
      ${scanResult.hits.map(h => `<div class="ai-scan-hit">🚫 <b>${escapeHTML(h.word)}</b> �? ${escapeHTML(h.replace)}</div>`).join('')}
    </div>`;

  el.innerHTML = `
    <div class="ai-result-card">
      <div class="ai-result-head">
        <span class="ai-result-label">📍 ${escapeHTML(copy.place)}</span>
        <span class="ai-result-type">${copy.activity} · ${copy.season}</span>
        ${scanBadge}
      </div>
      <div class="copy-block">
        <div class="cb-platform"><span class="dot xhs-dot"></span>小红�?</div>
        <div class="cb-field"><div class="cb-label">标题</div><div class="cb-val">${escapeHTML(copy.xhsTitle)}</div></div>
        <div class="cb-field"><div class="cb-label">标签</div><div class="cb-tags">${copy.xhsTags.split(/\s+/).filter(Boolean).map(t=>`<span>${escapeHTML(t)}</span>`).join('')}</div></div>
      </div>
      <div class="copy-block">
        <div class="cb-platform"><span class="dot dy-dot"></span>抖音</div>
        <div class="cb-field"><div class="cb-label">标题</div><div class="cb-val">${escapeHTML(copy.dyTitle)}</div></div>
        <div class="cb-field"><div class="cb-label">标签</div><div class="cb-tags">${copy.dyTags.split(/\s+/).filter(Boolean).map(t=>`<span>${escapeHTML(t)}</span>`).join('')}</div></div>
        <div class="cb-field"><div class="cb-label">�?3秒钩�?</div><div class="cb-val">${escapeHTML(copy.dyHook)}</div></div>
      </div>
      ${hitDetails}
      <div class="ai-result-actions">
        <button class="btn small" onclick="copyAIText(event)" data-text="${escapeHTML(fullText)}">📋 复制</button>
        <button class="btn small primary" onclick="addAIToLibrary(event)" data-place="${escapeHTML(copy.place)}" data-xhs-title="${escapeHTML(copy.xhsTitle)}" data-xhs-tags="${escapeHTML(copy.xhsTags)}" data-dy-title="${escapeHTML(copy.dyTitle)}" data-dy-tags="${escapeHTML(copy.dyTags)}" data-dy-hook="${escapeHTML(copy.dyHook)}">📚 加入文案�?</button>
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
    if (!val) { toast('请输入路线名或地�?'); return; }
    const copy = aiGenerateCopy(val);
    if (!copy) return;
    saveAIHistory(copy);
    renderAIResult(copy);
    const resultEl = $('#aiGenResult');
    if (resultEl) resultEl.scrollIntoView({ behavior: 'smooth' });
    toast('文案已生�? �?');
  });

  input.addEventListener('keydown', e => {
    if (e.key === 'Enter') btn.click();
  });
}

/* 复制 AI 文案 */
window.copyAIText = function(e) {
  const text = e.target.dataset.text;
  if (!text) return;
  copyToClipboard(text);
};

/* AI 文案加入文案�? */
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

  // 在文案列表顶部渲�? AI 生成�?
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
        <div class="copy-platforms"><span class="plat-badge xhs">小红�?</span><span class="plat-badge dy">抖音</span></div>
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
      <div class="cb-platform"><span class="dot xhs-dot"></span>小红�?</div>
      <div class="cb-field"><div class="cb-label">标题</div><div class="cb-val">${escapeHTML(currentCopy.xhsTitle)}</div></div>
      <div class="cb-field"><div class="cb-label">正文</div><div class="cb-val cb-body">${escapeHTML(currentCopy.xhsBody||'').replace(/\n/g,'<br>')}</div></div>
      <div class="cb-field"><div class="cb-label">标签</div><div class="cb-tags">${currentCopy.xhsTags.split(/\s+/).filter(Boolean).map(t=>`<span>${escapeHTML(t)}</span>`).join('')}</div></div>
      <div class="cb-field"><div class="cb-label">发布建议</div><div class="cb-val">�?8-10点发�? / 9图或视频封面 / 文案写详细路�?+报名方式 / 评论区置顶报名钩�?</div></div>
    </div>
    <div class="copy-block">
      <div class="cb-platform"><span class="dot dy-dot"></span>抖音</div>
      <div class="cb-field"><div class="cb-label">标题</div><div class="cb-val">${escapeHTML(currentCopy.dyTitle)}</div></div>
      <div class="cb-field"><div class="cb-label">正文</div><div class="cb-val cb-body">${escapeHTML(currentCopy.dyBody||'').replace(/\n/g,'<br>')}</div></div>
      <div class="cb-field"><div class="cb-label">标签</div><div class="cb-tags">${currentCopy.dyTags.split(/\s+/).filter(Boolean).map(t=>`<span>${escapeHTML(t)}</span>`).join('')}</div></div>
      <div class="cb-field"><div class="cb-label">�?3秒钩�?</div><div class="cb-val">${escapeHTML(currentCopy.dyHook||'�?')}</div></div>
      <div class="cb-field"><div class="cb-label">发布建议</div><div class="cb-val">�?12�?/�?7-9点发�? / 竖屏9:16 / 15-60�? / 结尾口播引导私信报名</div></div>
    </div>`;
  $('#copyModal').classList.add('show');
});
$('#copyClose').addEventListener('click', () => $('#copyModal').classList.remove('show'));
$('#copyCopyBtn').addEventListener('click', () => {
  if (!currentCopy) return;
  const text = '\u3010\u5C0F\u7EA2\u4E66\u6807\u9898\u3011\n' + currentCopy.xhsTitle + '\n\n\u3010\u5C0F\u7EA2\u4E66\u6B63\u6587\u3011\n' + (currentCopy.xhsBody||'') + '\n\n\u3010\u5C0F\u7EA2\u4E66\u6807\u7B7E\u3011\n' + currentCopy.xhsTags + '\n\n\u3010\u6296\u97F3\u6807\u9898\u3011\n' + currentCopy.dyTitle + '\n\n\u3010\u6296\u97F3\u6B63\u6587\u3011\n' + (currentCopy.dyBody||'') + '\n\n\u3010\u6296\u97F3\u6807\u7B7E\u3011\n' + currentCopy.dyTags + '\n\u3010\u524D3\u79D2\u94A9\u5B50\u3011\n' + (currentCopy.dyHook||'');
  copyToClipboard(text);
});

// 通用复制函数（兼容非HTTPS环境�?
function copyToClipboard(text) {
  if (navigator.clipboard && navigator.clipboard.writeText && window.isSecureContext) {
    navigator.clipboard.writeText(text).then(() => toast('\u5DF2\u590D\u5236\u5230\u5263\u8D34\u677F \u2705')).catch(() => fallbackCopy(text));
  } else {
    fallbackCopy(text);
  }
}
function fallbackCopy(text) {
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.style.position = 'fixed';
  ta.style.left = '-9999px';
  ta.style.top = '0';
  document.body.appendChild(ta);
  ta.focus();
  ta.select();
  try {
    const ok = document.execCommand('copy');
    if (ok) toast('\u5DF2\u590D\u5236\u5230\u5263\u8D34\u677F \u2705');
    else toast('\u590D\u5236\u5931\u8D25\uFF0C\u8BF7\u624B\u52A8\u9009\u4E2D\u590D\u5236');
  } catch(e) {
    toast('\u590D\u5236\u5931\u8D25\uFF0C\u8BF7\u624B\u52A8\u9009\u4E2D\u590D\u5236');
  }
  document.body.removeChild(ta);
}
$('#copySearch').addEventListener('input', e => renderCopyList(e.target.value.trim()));

/* ===================== 渲染：复�? ===================== */
function renderReview(){
  const g = $('#reviewGrid'); g.innerHTML = '';
  reviews.forEach(r => {
    const card = document.createElement('div');
    card.className = 'review-card';
    card.innerHTML = `
      <div class="rv-head">
        <div class="rv-topic">${escapeHTML(r.topic)}</div>
        <div style="display:flex;gap:6px;align-items:center">
          <span class="rv-plat ${r.platform==='抖音'?'dy':'xhs'}">${escapeHTML(r.platform||'小红�?')}</span>
          <button class="link-btn" data-del-rv="${r.id}">删除</button>
        </div>
      </div>
      <div class="rv-stats">
        <span>👁 播放 <b>${(r.views||0).toLocaleString()}</b></span>
        <span>❤️ <b>${(r.likes||0).toLocaleString()}</b></span>
        <span>�? <b>${(r.saves||0).toLocaleString()}</b></span>
        <span>💬 <b>${(r.comments||0)}</b></span>
      </div>
      <div class="rv-stats">
        <span>📊 互动�? <b>${r.rate||0}%</b></span>
        <span>📩 转化 <b>${r.leads||0}�?</b></span>
      </div>
      <div class="rv-note">${escapeHTML(r.note||'')}</div>`;
    g.appendChild(card);
  });
  save(LS.reviews, reviews);
}

/* ===================== 事件：任务看�? ===================== */
$('#content').addEventListener('click', e => {
  const check = e.target.closest('.check');
  if (check) {
    const t = tasks.find(x => x.id === check.dataset.id);
    if (t) { t.done = !t.done; renderTasks(); toast(t.done ? '�? 已完成！' : '已撤销'); }
    return;
  }
  const del = e.target.closest('[data-del]');
  if (del) {
    tasks = tasks.filter(x => x.id !== del.dataset.del);
    renderTasks();
    toast('已删除任�?');
    return;
  }
});

/* ===================== 渲染：热�? BGM ===================== */
let bgmFilter = 'all';
function renderBGM(){
  // hot-bgm.json 结构：{ data: { bgms: [], tips: [] } }
  const allCloud = CloudSync.getCached('hot-bgm');
  let bgmData = [];
  let tipsData = [];
  
  if (Array.isArray(allCloud)) {
    bgmData = allCloud;
  } else if (allCloud && allCloud.bgms) {
    // 新结�?
    bgmData = allCloud.bgms;
    tipsData = allCloud.tips || [];
  } else if (allCloud && allCloud.data) {
    // 兼容老结�?
    bgmData = allCloud.data.bgms || allCloud.data;
    tipsData = allCloud.data.tips || allCloud.tips || [];
  }
  
  const list = $('#bgmList');
  if (!list) return;
  
  if (!bgmData.length) {
    list.innerHTML = '<div class="ai-gen-empty">�? 正在从云端加�? BGM 数据�?</div>';
  } else {
    const filtered = bgmFilter === 'all' ? bgmData : bgmData.filter(b => 
      (b.platform || '').includes(bgmFilter) || (b.mood || '').includes(bgmFilter)
    );
    
    list.innerHTML = filtered.map(b => {
      const plats = (b.platform || '').split('+');
      const platTags = plats.map(p => {
        const t = p.trim();
        if (t === '抖音') return '<span class="bgm-plat-tag dy">🎵 抖音</span>';
        if (t === '小红�?') return '<span class="bgm-plat-tag xhs">📕 小红�?</span>';
        return `<span class="bgm-plat-tag both">${escapeHTML(b.platform)}</span>`;
      }).join('');
      
      const statusClass = (b.status||'').includes('上升') ? 'up' : (b.status||'').includes('长尾') ? 'long' : 'hot';
      
      return `<div class="bgm-card">
        <div class="bgm-card-head">
          <div>
            <div class="bgm-name">${escapeHTML(b.name)}</div>
            <div class="bgm-artist">${escapeHTML(b.artist||'')}</div>
          </div>
          <span class="bgm-heat">🔥 ${b.heat||0}�?</span>
        </div>
        <div class="bgm-platforms">${platTags}</div>
        <span class="bgm-status ${statusClass}">${escapeHTML(b.status||'热门')}</span>
        <div class="bgm-scene">📍 ${escapeHTML(b.scene||'')}</div>
        <div class="bgm-meta">
          <span>🎵 ${escapeHTML(b.mood||'')}</span>
          <span>�? ${escapeHTML(b.bpm||'')}</span>
          <span>�? ${escapeHTML(b.duration||'')}</span>
        </div>
        <div class="bgm-tip">💡 ${escapeHTML(b.tip||'')}</div>
        <div class="bgm-actions">
          ${b.link ? `<a class="link-btn" href="${escapeHTML(b.link)}" target="_blank" rel="noopener">🎧 试听</a>` : ''}
          <button class="link-btn" data-bgm-copy="${escapeHTML(b.name + ' - ' + (b.artist||''))}">📋 复制歌名</button>
        </div>
      </div>`;
    }).join('');
  }
  
  // 渲染技�?
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

// BGM 筛�?
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

/* ===================== 渲染：违禁词速查表（双平台分开�? ===================== */
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
        <tr><th style="width:90px">类型</th><th style="width:220px">🚫 禁用�?</th><th>�? 替换�?</th></tr>
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
      <button class="bw-tab" data-bw="xhs">📕 小红书专�?</button>
      <button class="bw-tab" data-bw="dy">🎵 抖音专属</button>
    </div>
    <div class="bw-content" data-bw-content="all">
      ${renderTable('🔵 通用违禁词（两平台都查）', common)}
      ${renderTable('📕 小红书专属违禁词', xhs)}
      ${renderTable('🎵 抖音专属违禁�?', dy)}
    </div>
    <div class="bw-content" data-bw-content="common" style="display:none">
      ${renderTable('🔵 通用违禁词（两平台都查）', common)}
    </div>
    <div class="bw-content" data-bw-content="xhs" style="display:none">
      ${renderTable('📕 小红书专属违禁词', xhs)}
    </div>
    <div class="bw-content" data-bw-content="dy" style="display:none">
      ${renderTable('🎵 抖音专属违禁�?', dy)}
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

// 扫描文案中的违禁�?
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
    cat.banned.split('�?').forEach(w => {
      const kw = w.trim();
      if (!kw) return;
      // 检查是否在文本中出�?
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

  // 去重按位置排�?
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
    el.innerHTML = '<div class="scan-clean">�? 未发现违禁词，可以放心发布！</div>';
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
        const platTag = isXHS ? '<span class="plat-badge xhs">小红�?</span>'
                      : isDY ? '<span class="plat-badge dy">抖音</span>'
                      : '<span class="plat-badge" style="background:rgba(255,255,255,.08);color:var(--text-2)">通用</span>';
        return `
        <div class="scan-hit">
          <div class="scan-hit-head">
            ${platTag}
            <span class="scan-hit-type">${escapeHTML(h.type)}</span>
            <span class="scan-hit-word">🚫 ${escapeHTML(h.word)}</span>
          </div>
          <div class="scan-hit-ctx">�?${escapeHTML(h.context)}�?</div>
          <div class="scan-hit-replace">�? 建议替换为：${escapeHTML(h.replace)}</div>
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

/* ===================== 弹层：热�? ===================== */
$('#newHotBtn').addEventListener('click', () => {
  $('#hotTitle').value = ''; $('#hotFrom').value = ''; $('#hotLink').value = ''; $('#hotAngle').value = '';
  $('#hotModal').classList.add('show');
});
$('#hotSave').addEventListener('click', () => {
  const title = $('#hotTitle').value.trim();
  if (!title) { toast('请输入热点标�?'); return; }
  const icons = ['🔥','🎵','🐱','💼','🎬','�?','📈','🌟','🚀','💡','🎯','�?'];
  hots.unshift({ id:uid(), title, from:$('#hotFrom').value.trim(), link:$('#hotLink').value.trim(), angle:$('#hotAngle').value.trim(), icon:icons[Math.floor(Math.random()*icons.length)] });
  renderHot(); $('#hotModal').classList.remove('show');
  toast('热点已收�? 🚀');
});
$('#content').addEventListener('click', e => {
  const id = e.target.dataset.delHot;
  if (id) { hots = hots.filter(x => x.id !== id); renderHot(); toast('已删除热�?'); }
});

/* ===================== 弹层：复�? ===================== */
$('#newReviewBtn').addEventListener('click', () => {
  $('#rvTopic').value = ''; $('#rvViews').value = ''; $('#rvLikes').value = ''; $('#rvSaves').value = '';
  $('#rvComments').value = ''; $('#rvRate').value = ''; $('#rvLeads').value = ''; $('#rvNote').value = '';
  $('#reviewModal').classList.add('show');
});
$('#rvSave').addEventListener('click', () => {
  const topic = $('#rvTopic').value.trim();
  if (!topic) { toast('请输入内容主�?'); return; }
  const plat = $('.seg-btn.active', $('#reviewModal')).dataset.plat || '小红�?';
  reviews.unshift({
    id:uid(), topic, platform:plat,
    views:Number($('#rvViews').value)||0, likes:Number($('#rvLikes').value)||0,
    saves:Number($('#rvSaves').value)||0, comments:Number($('#rvComments').value)||0,
    rate:Number($('#rvRate').value)||0, leads:Number($('#rvLeads').value)||0,
    note:$('#rvNote').value.trim()
  });
  renderReview(); $('#reviewModal').classList.remove('show');
  toast('复盘已写�? 📝');
});
$('#content').addEventListener('click', e => {
  const id = e.target.dataset.delRv;
  if (id) { reviews = reviews.filter(x => x.id !== id); renderReview(); toast('已删除复�?'); }
});

/* ===================== 弹层：通用关闭 ===================== */
$$('[data-close]').forEach(b => b.addEventListener('click', () => $(`#${b.dataset.close}`).classList.remove('show')));
$$('.modal-mask').forEach(m => m.addEventListener('click', () => m.parentElement.classList.remove('show')));
$$('.seg-btn').forEach(b => b.addEventListener('click', function() {
  const parent = this.parentElement;
  $$('.seg-btn', parent).forEach(x => x.classList.remove('active'));
  this.classList.add('active');
}));

/* ===================== 全局搜索（增强版�? ===================== */
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
      toast('未找到，试试 AI 生成？�?');
    }
  }
});

/* ===================== 初始�? ===================== */
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

/* ===================== 路线二创：攻�? �? 双平台文�? ===================== */

// 活动类型识别关键�?
const REMIX_ACTIVITY_KEYWORDS = {
  '露营': ['露营', '帐篷', '星空', '篝火', '过夜'],
  '徒步': ['徒步', '登山', '�?', '步道', '穿越', '环线'],
  '滑雪': ['滑雪', '雪场', '雪道'],
  '漂流': ['漂流', '橡皮�?', '激�?'],
  '赏花': ['�?', '桃花', '樱花', '杏花', '油菜�?', '花海'],
  '温泉': ['温泉', '泡汤', '汤泉'],
  '草原': ['草原', '草甸', '牧场'],
  '红叶': ['红叶', '秋天', '枫叶', '彩林'],
  '冰�?': ['冰�?', '冰挂', '冰�?'],
  '溯溪': ['溯溪', '踩水', '溪水'],
  '骑行': ['骑行', '骑车', '自行�?'],
  'Citywalk': ['citywalk', '胡同', 'city walk', '漫步'],
  '攀�?': ['攀�?', '攀�?', '岩壁'],
  '自驾': ['自驾', '公路', '开�?', '车窗'],
  '摄影': ['摄影', '拍照', '机位', '出片'],
  '亲子': ['亲子', '带娃', '儿童', '孩子'],
};

// 季节识别
const REMIX_SEASON_KEYWORDS = {
  '春日': ['�?', '3�?', '4�?', '5�?', '�?', '�?'],
  '夏日': ['�?', '6�?', '7�?', '8�?', '避暑', '玩水'],
  '秋日': ['�?', '9�?', '10�?', '11�?', '红叶', '银杏'],
  '冬日': ['�?', '12�?', '1�?', '2�?', '�?', '�?'],
};

// 从攻略文本中提取关键信息
function parseRoute(text) {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  const allText = text;

  // 提取地名（常见模式：XX位于、XX在、XX出发、到XX�?
  let place = '';
  const placePatterns = [
    /([^\s,，。]{2,6})位于/,
    /([^\s,，。]{2,6})�?(?:河北|北京|山西|内蒙古|山东)/,
    /�?([^\s,，。]{2,6})/,
    /([^\s,，。]{2,6})(?:出发|徒步|露营|徒步路线|风景�?)/,
  ];
  for (const p of placePatterns) {
    const m = allText.match(p);
    if (m && m[1]) { place = m[1]; break; }
  }
  // 如果没匹配到，取第一行前几个�?
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
  if (altMatch) altitude = altMatch[1] + '�?';

  // 提取距离
  let distance = '';
  const distMatch = allText.match(/(?:全程|约|大约)(\d+)\s*(?:公里|km|千米)/i);
  if (distMatch) distance = distMatch[1] + '公里';

  // 提取车程
  let driveTime = '';
  const driveMatch = allText.match(/(?:车程|出发|开�?)(?:约|大约)?(\d+(?:\.\d+)?)\s*(?:小时|h)/i);
  if (driveMatch) driveTime = driveMatch[1] + '小时';

  // 提取难度
  let difficulty = '';
  if (allText.includes('简�?') || allText.includes('轻松') || allText.includes('入门')) difficulty = '简�?';
  else if (allText.includes('中等') || allText.includes('适中')) difficulty = '中等';
  else if (allText.includes('困难') || allText.includes('挑战') || allText.includes('高强�?')) difficulty = '有挑�?';

  // 提取亮点
  const highlights = [];
  if (allText.includes('星空')) highlights.push('星空');
  if (allText.includes('日出') || allText.includes('日落')) highlights.push('日出日落');
  if (allText.includes('�?')) highlights.push('花海');
  if (allText.includes('草甸') || allText.includes('草原')) highlights.push('高山草甸');
  if (allText.includes('长城')) highlights.push('长城');
  if (allText.includes('湖泊') || allText.includes('水库')) highlights.push('湖泊');
  if (allText.includes('森林')) highlights.push('森林');
  if (allText.includes('瀑布') || allText.includes('冰�?')) highlights.push('瀑布');

  return { place, activity, season, altitude, distance, driveTime, difficulty, highlights, rawText: allText };
}

// 生成小红书文�?
function genXHSCopy(info, style) {
  const { place, activity, season, altitude, distance, driveTime, difficulty, highlights } = info;

  let title, body, tags;

  if (style === '种草') {
    const hl = highlights.length > 0 ? highlights.slice(0, 3).join('+') : '风景';
    title = `${getEmoji(activity)} ${place}${activity}�?${season}限定�?${hl}太绝了`;
    body = `📍 ${place}\n${activity === '露营' ? '�?' : '🥾'} ${activity}打卡\n\n`;
    if (driveTime) body += `🚗 北京出发${driveTime}直达\n`;
    if (altitude) body += `⛰️ 海拔${altitude}\n`;
    if (distance) body += `📏 全程${distance}\n`;
    if (difficulty) body += `💪 难度�?${difficulty}\n`;
    body += `\n�? 亮点：\n`;
    if (highlights.length > 0) {
      highlights.forEach(h => body += `�? ${h}\n`);
    } else {
      body += `�? 风景超赞，值得打卡\n`;
    }
    body += `\n👥 周末组队中，评论区扣1报名\n💬 主页有更多路线`;

  } else if (style === '攻略') {
    title = `📍 ${place}${activity}攻略�?${driveTime || '2小时'}直达${distance ? '·'+distance : ''}详细路线`;
    body = `📋 ${place}${activity}攻略\n\n`;
    body += `🚗 交通：北京出发${driveTime || '�?2小时'}\n`;
    if (distance) body += `📏 路线长度�?${distance}\n`;
    if (altitude) body += `⛰️ 海拔�?${altitude}\n`;
    if (difficulty) body += `💪 难度等级�?${difficulty}\n`;
    body += `\n🎒 装备建议：\n�? 徒步鞋、防晒、足够的水\n�? 保暖外套（山区温差大）\n�? 充电宝、离线地图\n`;
    body += `\n⚠️ 注意事项：\n�? 提前下载轨迹（部分路段无信号）\n�? 结伴同行，不要单独行动\n�? 带走垃圾，无痕户外\n`;
    body += `\n👥 跟我们走，省心省力：车接车�?+领队+装备\n💬 评论区扣1或主页了解`;

  } else { // vlog
    title = `${getEmoji(activity)} ${place}周末逃离计划�?${activity}vlog`;
    body = `周末就该这样过。\n\n${place}，北京出�?${driveTime || '2小时'}�?${activity}人的快乐老家。\n\n`;
    if (highlights.length > 0) {
      body += `${highlights.map(h => h).join('�?')}，每一样都让人想多待一天。\n\n`;
    }
    if (difficulty) body += `难度${difficulty}，新手也能冲。\n`;
    body += `\n这周末组队去，评论区�?1。\n主页有更多路线，欢迎加入。`;
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
    title = `${place}${activity}！北京出�?${driveTime || '2小时'}�?${season}必去！`;
    body = `${place}，北京打工人的周末逃离地。\n${driveTime ? '车程'+driveTime : ''}${distance ? '全程'+distance : ''}\n${difficulty ? '难度'+difficulty : ''}\n这周末组队，评论区扣1！`;
    hook = `�?1秒：${highlights[0] || '风景'}特写+节奏切入`;

  } else if (style === '攻略') {
    title = `${place}${activity}攻略�?${distance || '详细路线'}避坑指南`;
    body = `�?${place}之前必看！\n${driveTime ? '车程'+driveTime+' ' : ''}${distance ? '全程'+distance+' ' : ''}${difficulty ? '难度'+difficulty : ''}\n装备清单+注意事项+路线图\n跟着我们走不踩坑，评论区�?1`;
    hook = `�?1秒：路线地图+「去之前必看」文字`;

  } else {
    title = `${place}周末vlog｜北京出�?${driveTime || '2小时'}${activity}`;
    body = `周末就该这样过。\n${place}${activity}�?${highlights[0] || '风景'}绝了。\n这周末继续组队，�?1报名。`;
    hook = `�?1秒：${highlights[0] || '风景'}慢镜�?+BGM副歌`;
  }

  tags = `#${place} #${activity} #北京周末`;
  if (season !== '当季') tags += ` #${season}`;
  tags += ` #组队`;

  return { title, body, tags, hook };
}

function getEmoji(activity) {
  const map = { '露营':'�?', '徒步':'🥾', '滑雪':'🏂', '漂流':'💦', '赏花':'🌸', '温泉':'♨️', '草原':'🌾', '红叶':'🍁', '冰�?':'🧊', '溯溪':'🦶', '骑行':'🚴', 'Citywalk':'🚶', '攀�?':'🧗', '自驾':'🛣�?', '摄影':'📷', '亲子':'👨‍👩‍�?' };
  return map[activity] || '📍';
}

// 渲染二创结果
function renderRemixResult(info, xhs, dy) {
  const el = $('#remixResult');
  if (!el) return;

  // 合并所有文案做违禁词扫�?
  const allText = xhs.title + ' ' + xhs.body + ' ' + xhs.tags + ' ' + dy.title + ' ' + dy.body + ' ' + dy.tags;
  const scanResult = scanText(allText, 'both');
  const scanBadge = scanResult.clean
    ? '<div class="remix-scan pass">�? 违禁词检查通过，可以放心发�?</div>'
    : `<div class="remix-scan warn">⚠️ 发现 ${scanResult.hits.length} 个疑似违禁词，建议替换后再发</div>`;

  el.innerHTML = `
    <div class="remix-output">
      <div class="remix-out-card">
        <div class="remix-out-head"><span class="dot xhs-dot"></span>📕 小红书（${info.style || '种草'}风格�?</div>
        <div class="remix-out-section"><div class="remix-out-label">标题</div><div class="remix-out-val">${escapeHTML(xhs.title)}</div></div>
        <div class="remix-out-section"><div class="remix-out-label">正文</div><div class="remix-out-val">${escapeHTML(xhs.body)}</div></div>
        <div class="remix-out-section"><div class="remix-out-label">标签</div><div class="remix-out-tags">${xhs.tags.split(/\s+/).filter(Boolean).map(t=>`<span>${escapeHTML(t)}</span>`).join('')}</div></div>
        <div class="remix-out-actions">
          <button class="btn ghost" data-copy-xhs="${escapeHTML(xhs.title + '\n\n' + xhs.body + '\n\n' + xhs.tags)}">📋 复制全部</button>
        </div>
      </div>
      <div class="remix-out-card">
        <div class="remix-out-head"><span class="dot dy-dot"></span>🎵 抖音�?${info.style || '种草'}风格�?</div>
        <div class="remix-out-section"><div class="remix-out-label">标题/口播</div><div class="remix-out-val">${escapeHTML(dy.title)}</div></div>
        <div class="remix-out-section"><div class="remix-out-label">文案</div><div class="remix-out-val">${escapeHTML(dy.body)}</div></div>
        <div class="remix-out-section"><div class="remix-out-label">标签</div><div class="remix-out-tags">${dy.tags.split(/\s+/).filter(Boolean).map(t=>`<span>${escapeHTML(t)}</span>`).join('')}</div></div>
        <div class="remix-out-section"><div class="remix-out-label">�?3秒钩�?</div><div class="remix-out-val">${escapeHTML(dy.hook)}</div></div>
        <div class="remix-out-actions">
          <button class="btn ghost" data-copy-dy="${escapeHTML(dy.title + '\n\n' + dy.body + '\n\n' + dy.tags + '\n\n钩子�?' + dy.hook)}">📋 复制全部</button>
        </div>
      </div>
      ${scanBadge}
      ${!scanResult.clean ? `<div class="scan-hits">${scanResult.hits.map(h=>`<div class="scan-hit"><div class="scan-hit-head"><span class="scan-hit-type">${escapeHTML(h.type)}</span><span class="scan-hit-word">🚫 ${escapeHTML(h.word)}</span></div><div class="scan-hit-replace">�? 替换为：${escapeHTML(h.replace)}</div></div>`).join('')}</div>` : ''}
    </div>`;
}

// 绑定二创按钮
$('#remixGenBtn').addEventListener('click', () => {
  const text = $('#remixInput').value.trim();
  if (!text || text.length < 10) { toast('请粘贴至�? 10 字的攻略内容'); return; }

  const styleBtn = $('.seg-btn.active', $('#remixStyle'));
  const style = styleBtn ? styleBtn.dataset.style : '种草';

  // 解析攻略
  const info = parseRoute(text);
  info.style = style;

  // 生成双平台文�?
  const xhs = genXHSCopy(info, style);
  const dy = genDYCopy(info, style);

  // 渲染
  renderRemixResult(info, xhs, dy);
  toast('�? 文案已生成，已过违禁词检�?');
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
    navigator.clipboard.writeText(xhsBtn.dataset.copyXhs).then(() => toast('小红书文案已复制 �?')).catch(() => toast('复制失败'));
    return;
  }
  const dyBtn = e.target.closest('[data-copy-dy]');
  if (dyBtn) {
    navigator.clipboard.writeText(dyBtn.dataset.copyDy).then(() => toast('抖音文案已复�? �?')).catch(() => toast('复制失败'));
    return;
  }
});


/* ===================== 粉丝互动话术�? ===================== */
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
      const platName = interactPlat === 'xhs' ? '小红�?' : '抖音';
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

  // 渲染技�?
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

// 场景筛�?
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

// 话术复制和扫�?
$('#content').addEventListener('click', e => {
  const copyBtn = e.target.closest('[data-interact-copy]');
  if (copyBtn) {
    const text = copyBtn.dataset.interactCopy;
    copyToClipboard(text);
    return;
  }
  const scanBtn = e.target.closest('[data-interact-scan]');
  if (scanBtn) {
    const text = scanBtn.dataset.interactScan;
    const plat = scanBtn.dataset.plat;
    const result = scanText(text, plat);
    if (result.clean) {
      toast('�? 未发现违禁词，可放心使用');
    } else {
      const words = result.hits.map(h => h.word).join('�?');
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
