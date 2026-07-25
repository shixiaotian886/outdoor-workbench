#!/usr/bin/env python3
"""
Auto-update script: BGM + banned-words + calendar + hot topics
Runs weekly via GitHub Actions. No manual work needed.
"""
import json
import os
import sys
from datetime import datetime
from urllib.request import urlopen, Request

CLOUD_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'cloud-config')

# ==================== BGM ====================

BGM_TIPS = [
    {"title": "First 3s: use drum beats to grab attention", "desc": "Opening with drum/beat can boost completion rate 30%+", "example": "Gu Yong Zhe chorus opening"},
    {"title": "Chorus = climax visuals", "desc": "Match chorus with summit/aerial/sunset shots for max emotion", "example": "Ru Yuan chorus + sunrise timelapse"},
    {"title": "Fade out ending = better saves", "desc": "BGM fade-out + text sync beats hard cut, improves save rate", "example": "Mohe Ballroom piano fade-out"},
    {"title": "Beat-sync editing", "desc": "Cut on BGM BPM for smoother flow", "example": "85BPM ~0.7s per beat, 120BPM ~0.5s"},
    {"title": "Multi-account matrix with same BGM", "desc": "Post 3-5 clips with same BGM across different route footage", "example": "Use Xing Chen Da Hai for grassland + Great Wall + camping"},
]

def update_bgm():
    print("=" * 50)
    print("[BGM] Updating hot BGM...")
    bgm_path = os.path.join(CLOUD_DIR, 'hot-bgm.json')
    with open(bgm_path, 'r', encoding='utf-8') as f:
        existing = json.load(f)
    
    existing_bgms = existing.get('data', {}).get('bgms', [])
    
    # Weekly heat decay: -2%
    for b in existing_bgms:
        b['heat'] = max(100, int(b.get('heat', 500) * 0.98))
        if b['heat'] < 300 and b.get('status') not in ['new', 'long-tail']:
            b['status'] = 'cooling'
    
    # Try to fetch new songs from NetEase API
    try:
        url = "https://service-qbgmgv4t-1256340968.bj.apigw.tencentcs.com/release/douyin/hot"
        resp = urlopen(Request(url, headers={'User-Agent': 'Mozilla/5.0'}), timeout=10)
        data = json.loads(resp.read())
        new_songs = data.get('data', [])[:20] if data else []
    except Exception as e:
        print(f"  [BGM] API fetch failed (expected in sandbox): {e}")
        new_songs = []
    
    existing_names = {b['name'] for b in existing_bgms}
    new_count = 0
    for song in new_songs:
        name = song.get('name', '')
        if name and name not in existing_names:
            existing_bgms.insert(0, {
                "id": f"bgm{len(existing_bgms)+new_count+1:03d}",
                "name": name,
                "artist": song.get('artist', 'unknown'),
                "platform": "douyin+xiaohongshu",
                "scene": "travel vlog / landscape",
                "mood": "healing",
                "bpm": "mid",
                "heat": song.get('heat', 500),
                "status": "new",
                "tip": f"New hot song, suitable for healing content",
                "duration": "chorus 15s",
                "link": song.get('link', '')
            })
            existing_names.add(name)
            new_count += 1
    
    existing_bgms = existing_bgms[:20]  # keep top 20
    
    output = {
        "version": datetime.now().strftime("%Y.%m.%d"),
        "updated": datetime.now().strftime("%Y-%m-%d"),
        "data": {"bgms": existing_bgms, "tips": BGM_TIPS}
    }
    with open(bgm_path, 'w', encoding='utf-8') as f:
        json.dump(output, f, ensure_ascii=False, indent=2)
    
    print(f"  [BGM] Done: +{new_count} new, total {len(existing_bgms)}")
    return new_count > 0


# ==================== Banned Words ====================

NEW_BANNED = []

def update_banned_words():
    print("=" * 50)
    print("[BANNED] Updating banned words...")
    
    path = os.path.join(CLOUD_DIR, 'banned-words.json')
    with open(path, 'r', encoding='utf-8') as f:
        existing = json.load(f)
    
    common = existing.get('common', [])
    existing_types = {item['type'] for item in common}
    added = 0
    
    for new_item in NEW_BANNED:
        if new_item['type'] not in existing_types:
            common.append(new_item)
            existing_types.add(new_item['type'])
            added += 1
            print(f"  + Added: {new_item['type']}")
    
    output = {
        "version": datetime.now().strftime("%Y.%m.%d"),
        "updated": datetime.now().strftime("%Y-%m-%d"),
        "common": common,
        "xiaohongshu": existing.get('xiaohongshu', []),
        "douyin": existing.get('douyin', [])
    }
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(output, f, ensure_ascii=False, indent=2)
    
    print(f"  [BANNED] Done: +{added} new, total common={len(common)}")
    return added > 0


# ==================== Calendar ====================

def update_calendar():
    print("=" * 50)
    print("[CALENDAR] Updating seasonal tags...")
    
    path = os.path.join(CLOUD_DIR, 'calendar.json')
    with open(path, 'r', encoding='utf-8') as f:
        existing = json.load(f)
    
    now = datetime.now()
    current_month = now.month
    months = existing.get('data', [])
    
    changed = False
    for i, m in enumerate(months):
        month_num = i + 1
        diff = (month_num - current_month + 12) % 12
        
        if diff == 0:
            tag = '[CURRENT]'
        elif diff == 1:
            tag = '[NEXT]'
        elif diff <= 3:
            tag = '[SOON]'
        else:
            tag = '[ARCHIVE]'
        
        old = m.get('theme', '')
        # strip old tags
        for old_tag in ['[CURRENT]', '[NEXT]', '[SOON]', '[ARCHIVE]']:
            old = old.replace(old_tag, '')
        old = old.strip().lstrip('��').strip()
        
        new_theme = f'{tag} {old}'
        if months[i]['theme'] != new_theme:
            months[i]['theme'] = new_theme
            changed = True
    
    if changed:
        existing['updated'] = datetime.now().strftime('%Y-%m-%d')
        with open(path, 'w', encoding='utf-8') as f:
            json.dump(existing, f, ensure_ascii=False, indent=2)
        print(f"  [CALENDAR] Updated for month {current_month}")
    else:
        print(f"  [CALENDAR] No change (month {current_month})")
    
    return changed


# ==================== Hot Topics ====================

HOT_TEMPLATES = [
    {"title": "Weekend Escape topic trending", "from": "douyin+xiaohongshu", "angle": "Create 'Beijing departure X hours, N weekend getaways' series, rotate different routes weekly", "icon": "RUN", "seasons": []},
    {"title": "Worker's Weekend Vlog topic rising", "from": "xiaohongshu", "angle": "Film office-to-outdoors contrast: first 3s cubicle, then mountains/grassland/beach", "icon": "BRIEFCASE", "seasons": []},
    {"title": "Reverse Tourism avoiding crowds", "from": "douyin", "angle": "Create 'Don't go to XX, try these N hidden spots near Beijing' series", "icon": "REVERSE", "seasons": []},
    {"title": "Heatwave Escape searches surging", "from": "douyin", "angle": "Create 'Beijing 40C? N cool routes to escape' series", "icon": "HOT", "seasons": [6,7,8]},
    {"title": "Early Autumn Hiking topic rising", "from": "xiaohongshu", "angle": "Create 'Beijing autumn N hiking routes' photo collection, each route as separate detailed post", "icon": "AUTUMN", "seasons": [9,10,11]},
    {"title": "Red Leaves Season preheating", "from": "douyin+xiaohongshu", "angle": "Post teaser 2 weeks early: 'Expected peak on X date', build anticipation", "icon": "LEAF", "seasons": [9,10,11]},
    {"title": "Ice & Snow Season heating up", "from": "douyin", "angle": "Create 'N ice & snow routes near Beijing' collection: icefall + ski + hot spring combo", "icon": "SNOW", "seasons": [11,12,1,2]},
    {"title": "Family Outing searches exploding", "from": "xiaohongshu", "angle": "Create 'Where to take kids? Beijing top 5 family routes' photo collection", "icon": "FAMILY", "seasons": [6,7,8]},
    {"title": "Healing Vlog BGM going viral", "from": "douyin", "angle": "BGM remix: edit past hiking/camping/group footage with trending BGM", "icon": "MUSIC", "seasons": []},
    {"title": "Budget Travel topic hot", "from": "xiaohongshu", "angle": "Create 'Only XX yuan per person, Beijing day trip' series highlighting value", "icon": "MONEY", "seasons": []},
]

def update_hot_topics():
    print("=" * 50)
    print("[HOT] Updating hot topics...")
    
    now = datetime.now()
    month = now.month
    week = now.isocalendar()[1]
    
    # Filter by season
    selected = []
    for t in HOT_TEMPLATES:
        if not t['seasons'] or month in t['seasons']:
            selected.append(t)
    
    # Rotate weekly
    offset = week % len(selected)
    selected = selected[offset:] + selected[:offset]
    selected = selected[:5]
    
    # Icon mapping
    icon_map = {
        'RUN': '?', 'BRIEFCASE': '?', 'REVERSE': '?', 'HOT': '?',
        'AUTUMN': '?', 'LEAF': '?', 'SNOW': '??', 'FAMILY': '???????',
        'MUSIC': '?', 'MONEY': '?'
    }
    
    path = os.path.join(CLOUD_DIR, 'hots.json')
    output = {
        "version": datetime.now().strftime("%Y.%m.%d"),
        "updated": datetime.now().strftime("%Y-%m-%d"),
        "data": [
            {
                "id": f"hot{week}{i:02d}",
                "title": t['title'],
                "from": t['from'],
                "angle": t['angle'],
                "icon": icon_map.get(t['icon'], '?')
            }
            for i, t in enumerate(selected)
        ]
    }
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(output, f, ensure_ascii=False, indent=2)
    
    print(f"  [HOT] Done: {len(selected)} topics (month {month}, week {week})")
    return True


# ==================== Scripts (Fan Interaction) ====================

# Seasonal tip updates - rotated based on current month
SEASONAL_TIPS = {
    "spring": [
        {"title": "Spring outing season - highlight flowers", "desc": "Mar-May: focus on flower viewing routes, mention 'flowers blooming' in comments to boost interest", "tag": "seasonal"},
        {"title": "Spring weather reminder", "desc": "Remind about temperature changes, sandstorm season in Beijing - mention packing layers", "tag": "safety"},
    ],
    "summer": [
        {"title": "Heatwave escape angle", "desc": "Jun-Aug: emphasize 'cool escape' in comments, mention temperature difference at high altitude", "tag": "seasonal"},
        {"title": "Summer thunderstorm reminder", "desc": "Remind about afternoon thunderstorms, mention we monitor weather and have backup plans", "tag": "safety"},
    ],
    "autumn": [
        {"title": "Autumn foliage season", "desc": "Sep-Nov: highlight red leaves, golden grasslands in comments, mention 'peak color this week'", "tag": "seasonal"},
        {"title": "Layer-up reminder", "desc": "Big temperature swing in mountains, remind to bring warm layers", "tag": "safety"},
    ],
    "winter": [
        {"title": "Ice & snow season", "desc": "Dec-Feb: highlight icefall, snow scenes, mention 'limited season, don't miss'", "tag": "seasonal"},
        {"title": "Cold weather gear reminder", "desc": "Emphasize warm clothing, non-slip shoes, mention we provide crampons if needed", "tag": "safety"},
    ],
}

def get_season(month):
    if month in [3, 4, 5]:
        return "spring"
    elif month in [6, 7, 8]:
        return "summer"
    elif month in [9, 10, 11]:
        return "autumn"
    else:
        return "winter"

def update_scripts():
    print("=" * 50)
    print("[SCRIPTS] Updating fan interaction scripts...")
    
    path = os.path.join(CLOUD_DIR, 'scripts.json')
    with open(path, 'r', encoding='utf-8') as f:
        existing = json.load(f)
    
    now = datetime.now()
    season = get_season(now.month)
    season_tips = SEASONAL_TIPS.get(season, [])
    
    data = existing.get('data', existing)
    base_tips = data.get('tips', [])
    
    # Replace seasonal tips (first 2) with current season, keep the rest
    static_tips = [t for t in base_tips if t.get('tag') not in ('seasonal', 'safety')]
    new_tips = season_tips + static_tips
    data['tips'] = new_tips
    
    existing['version'] = now.strftime("%Y.%m.%d")
    existing['updated'] = now.strftime("%Y-%m-%d")
    
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(existing, f, ensure_ascii=False, indent=2)
    
    print(f"  [SCRIPTS] Done: season={season}, {len(new_tips)} tips")
    return True


# ==================== Main ====================

if __name__ == '__main__':
    print(f"[AUTO-UPDATE] Start - {datetime.now().strftime('%Y-%m-%d %H:%M')}")
    print()
    
    results = {
        'bgm': update_bgm(),
        'banned': update_banned_words(),
        'calendar': update_calendar(),
        'hot': update_hot_topics(),
        'scripts': update_scripts(),
    }
    
    print()
    print("=" * 50)
    changed = any(results.values())
    print(f"[AUTO-UPDATE] {'HAS CHANGES' if changed else 'NO CHANGES'}")
    print(f"  BGM:      {'changed' if results['bgm'] else 'no change'}")
    print(f"  Banned:   {'changed' if results['banned'] else 'no change'}")
    print(f"  Calendar: {'changed' if results['calendar'] else 'no change'}")
    print(f"  Hot:      {'changed' if results['hot'] else 'no change'}")
    print(f"  Scripts:  {'changed' if results['scripts'] else 'no change'}")
    print(f"Done: {datetime.now().strftime('%Y-%m-%d %H:%M')}")
