// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function buildColoredSegments(
  xs: string[],
  ys: number[],
  baseline: number,
  colorAbove: string,
  colorBelow: string,
  hoverTemplate = '%{x}<br><b>%{y:,.2f}</b><extra></extra>',
): any[] {
  if (xs.length === 0) return []

  type Seg = { xs: string[]; ys: number[]; above: boolean }
  const segs: Seg[] = []
  let cur: Seg | null = null

  for (let i = 0; i < xs.length; i++) {
    const above = ys[i] >= baseline
    if (!cur) {
      cur = { xs: [xs[i]], ys: [ys[i]], above }
      segs.push(cur)
    } else if (cur.above !== above) {
      const dy = ys[i] - ys[i - 1]
      const t = dy !== 0 ? (baseline - ys[i - 1]) / dy : 0
      const crossMs =
        new Date(xs[i - 1]).getTime() +
        t * (new Date(xs[i]).getTime() - new Date(xs[i - 1]).getTime())
      const crossX = new Date(crossMs).toISOString().split('T')[0]
      cur.xs.push(crossX)
      cur.ys.push(baseline)
      cur = { xs: [crossX, xs[i]], ys: [baseline, ys[i]], above }
      segs.push(cur)
    } else {
      cur.xs.push(xs[i])
      cur.ys.push(ys[i])
    }
  }

  return segs.flatMap(seg => {
    const color = seg.above ? colorAbove : colorBelow
    return [
      // filled area (polygon from line down to baseline and back)
      {
        type: 'scatter', mode: 'none',
        x: [...seg.xs, ...seg.xs.slice().reverse()],
        y: [...seg.ys, ...seg.xs.map(() => baseline)],
        fill: 'toself', fillcolor: color + '28',
        showlegend: false, hoverinfo: 'skip',
      },
      // visible line segment
      {
        type: 'scatter', mode: 'lines',
        x: seg.xs, y: seg.ys,
        line: { color, width: 1.5 },
        showlegend: false, hovertemplate: hoverTemplate,
      },
    ]
  })
}
