/**
 * 기여도 순으로 배정하는 색입니다.
 * 게이지 구간, 참여자 목록의 표시 막대, 방 카드의 가로 막대가 모두 같은 색을 씁니다.
 */
export const SEGMENT_COLORS = [
  '#354F52',
  '#52796F',
  '#84A98C',
  '#B4C2B6',
  '#CAD2C5',
  '#9FB0A4',
]

export function segmentColor(rank: number): string {
  return SEGMENT_COLORS[rank % SEGMENT_COLORS.length]
}
