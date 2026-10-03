// 本專案自己的規則 —— 只有這個專案需要,不放進每個專案都拿到的那一套。
//
// 這支檔案不在來源裡,整套更新時不會被覆蓋。代號一律以 project: 開頭,
// 每一條都要在 PROJECT_CASES 附驗證案例(自我驗證會檢查)。
// 規則的完整說明在 .claude/skills/component-groups/SKILL.md。

import { COMPONENTS_DIR, VIEWS_DIR, isInSrc, issueOf, lineNoOf, maskComments } from './shared.mjs'

// --- 規則 project:componentGroup:頻道的元件不跨頻道使用 -----------------------
//
// 共用元件目錄底下依頻道分資料夾:common 是全站共用,其餘每個頻道一個。
// 頻道資料夾裡的元件只給那個頻道用 —— 另一個頻道要用,先搬到 common。
//
// 互用的話,改或刪某個頻道的元件時會連帶弄壞另一個頻道,
// 而改的人只看自己頻道的頁面,不會知道另一邊也在用。
// 搬到 common 之後,那支元件的歸屬就寫在路徑上:看到 common 就知道全站都可能在用。
//
// 哪些檔案算哪個頻道:頁面目錄與共用元件目錄底下,從上往下第一個名字是頻道名的資料夾;
// 以及版面目錄裡以頻道名開頭的那幾支(member 與 memberAuth 都算 member)。
// 不屬於任何頻道的檔案(containers、common 元件)不檢查 —— 它們本來就給全站用。
//
// 取「第一個」而不是「第一段」:正式檔案的頻道資料夾就在第一段,兩種寫法結果相同;
// 自我驗證的探測檔則要多包一層探測名的資料夾才清得掉,只看第一段的話它們永遠驗不到。

/* 頻道名 → 元件標籤的前綴。標籤名由自動注入從資料夾推出來:
   components/buy/mChart → BuyMChart。 */
const CHANNELS = {
  buy: 'Buy',
  member: 'Member',
}

const channelOf = (rel) => {
  const names = Object.keys(CHANNELS)
  const layout = names.find((name) => new RegExp(`^layouts/${name}\\w*\\.vue$`).test(rel))

  if (layout) return layout

  const root = [VIEWS_DIR, COMPONENTS_DIR].find((dir) => rel.startsWith(`${dir}/`))

  if (!root) return null

  // 最後一段是檔名,不算資料夾
  const folders = rel.slice(root.length + 1).split('/').slice(0, -1)

  return folders.find((folder) => names.includes(folder)) ?? null
}

const checkComponentGroup = ({ rel, text }) => {
  if (!isInSrc(rel) || !rel.endsWith('.vue')) return []

  const own = channelOf(rel)
  if (!own) return []

  const masked = maskComments(rel, text)
  const issues = []

  for (const [name, prefix] of Object.entries(CHANNELS)) {
    if (name === own) continue

    /* 只認共用元件目錄的那一種(前綴後面緊接 M,對應 m 開頭的元件資料夾)——
       頁面旁的元件叫 Page<頻道>…,不在這條的範圍。 */
    const re = new RegExp(`<${prefix}M[A-Z]\\w*`, 'g')

    for (const m of masked.matchAll(re)) {
      issues.push(
        issueOf(
          rel,
          lineNoOf(text, m.index),
          'project:componentGroup',
          `${own} 的檔案用了 ${name} 頻道的元件 ${m[0].slice(1)} —— 頻道資料夾的元件只給那個頻道用;兩邊都要用的話,先搬到 ${COMPONENTS_DIR}/common`
        )
      )
    }
  }

  return issues
}

export const PROJECT_CHECKS = [checkComponentGroup]

export const PROJECT_RULE_TITLE = {
  'project:componentGroup': '跨頻道使用元件',
}

export const PROJECT_RULE_HINT = {
  'project:componentGroup': `頻道資料夾(${COMPONENTS_DIR}/<頻道>)的元件只給那個頻道用;兩個頻道都要用時搬到 ${COMPONENTS_DIR}/common`,
}

const PROBE_TAG = '<div class="m-probe"></div>'

/* 探測檔放在名字帶 selfTest 的資料夾底下 —— 自我驗證靠這個開頭認出探測檔、驗完清掉。
   直接放進頁面或元件的頻道資料夾的話,驗完會留在專案裡。 */
const PROBE_DIR = 'selfTestGroup'

export const PROJECT_CASES = [
  {
    /* member 的頁面用了 buy 頻道的元件 —— 改 buy 那支時,member 這一頁會跟著壞 */
    rule: 'project:componentGroup',
    name: 'project:componentGroup member 頁面用 buy 的元件要擋',
    file: `${VIEWS_DIR}/${PROBE_DIR}/member/Group.vue`,
    code: `<template>\n  <BuyMChart />\n  ${PROBE_TAG}\n</template>\n`,
    expect: 1,
    keyword: '用了 buy 頻道的元件',
  },
  {
    rule: 'project:componentGroup',
    name: 'project:componentGroup buy 的元件用 member 的元件要擋',
    file: `${COMPONENTS_DIR}/${PROBE_DIR}/buy/mGroup/Index.vue`,
    code: `<template>\n  <MemberMStepOval />\n  ${PROBE_TAG}\n</template>\n`,
    expect: 1,
    keyword: '用了 member 頻道的元件',
  },
  {
    /* 自己頻道與 common 的元件都可以用 */
    rule: 'project:componentGroup',
    name: 'project:componentGroup 用自己頻道與 common 的元件不報',
    file: `${VIEWS_DIR}/${PROBE_DIR}/member/GroupOwn.vue`,
    code: `<template>\n  <MemberMStepOval />\n  <CommonMSeparator />\n  ${PROBE_TAG}\n</template>\n`,
    expect: 0,
  },
  {
    /* 頁面旁的元件(Page 開頭)不在這條的範圍 */
    rule: 'project:componentGroup',
    name: 'project:componentGroup 頁面旁的元件不算',
    file: `${VIEWS_DIR}/${PROBE_DIR}/member/GroupPage.vue`,
    code: `<template>\n  <PageBuyCommonComment />\n  ${PROBE_TAG}\n</template>\n`,
    expect: 0,
  },
  {
    /* 註解掉的那一段是死的,不會產生任何畫面 */
    rule: 'project:componentGroup',
    name: 'project:componentGroup 註解裡提到不報',
    file: `${VIEWS_DIR}/${PROBE_DIR}/member/GroupComment.vue`,
    code: `<template>\n  <!-- <BuyMChart /> -->\n  ${PROBE_TAG}\n</template>\n`,
    expect: 0,
  },
  {
    /* 不屬於任何頻道的檔案本來就給全站用,不檢查 */
    rule: 'project:componentGroup',
    name: 'project:componentGroup 共用容器不檢查',
    file: `containers/${PROBE_DIR}/Index.vue`,
    code: `<template>\n  <BuyMChart />\n  ${PROBE_TAG}\n</template>\n`,
    expect: 0,
  },
]
