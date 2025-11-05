// backend/utils/obst.js
class TreeNode {
  constructor(key, value = null) {
    this.key = key;
    this.value = value;
    this.left = null;
    this.right = null;
  }
}

function buildOBST(keys, p, q, values = null) {
  const n = keys.length;
  const e = Array.from({ length: n + 2 }, () => new Array(n + 1).fill(0));
  const w = Array.from({ length: n + 2 }, () => new Array(n + 1).fill(0));
  const root = Array.from({ length: n + 2 }, () => new Array(n + 1).fill(0));

  for (let i = 0; i <= n; i++) {
    e[i + 1][i] = q[i];
    w[i + 1][i] = q[i];
  }

  for (let l = 1; l <= n; l++) {
    for (let i = 1; i <= n - l + 1; i++) {
      const j = i + l - 1;
      e[i][j] = Infinity;
      w[i][j] = w[i][j - 1] + p[j - 1] + q[j];
      for (let r = i; r <= j; r++) {
        const t = e[i][r - 1] + e[r + 1][j] + w[i][j];
        if (t < e[i][j]) {
          e[i][j] = t;
          root[i][j] = r;
        }
      }
    }
  }

  function buildTree(i, j) {
    if (i > j) return null;
    const r = root[i][j];
    const node = new TreeNode(keys[r - 1], values ? values[r - 1] : r - 1);
    node.left = buildTree(i, r - 1);
    node.right = buildTree(r + 1, j);
    return node;
  }

  return buildTree(1, n);
}

function searchOBST(root, key, compare = (a, b) => a.localeCompare(b)) {
  let cur = root;
  let comparisons = 0;
  while (cur) {
    comparisons++;
    const cmp = compare(key, cur.key);
    if (cmp === 0) return { node: cur, comparisons };
    cur = cmp < 0 ? cur.left : cur.right;
  }
  return { node: null, comparisons };
}

module.exports = { buildOBST, searchOBST };
