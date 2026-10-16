# Firestore 데이터 구조

## users/{uid}
- displayName, email, createdAt, lastLoginAt
- settings: { notifyOnLeave: boolean, longPauseMinutes: number(10~120, 기본 30, 이 시간 넘게 쉬면 자동 저장), shareToGroups: boolean }

## sessions/{sessionId}
- uid, goal
- status: "active" | "paused" | "completed" | "auto_closed" | "cancelled"
- startedAt, endedAt
- dayKey: "2026-10-16" (시작 시각에서 5시간을 뺀 날짜)
- weekKey: "2026-W42" (dayKey 기준, 월요일 시작)
- events: [{ type: "start" | "pause" | "resume" | "end", at }] (탭 이탈로 생긴 일시정지도 "pause"로 기록하고 구분하지 않는다. 공부 타임라인에 쓴다.)
- pausedMs (화면에 보여주지 않는 데이터), studyMs (확정 학습 시간, 일시정지 시간 제외)
- shareToGroups: boolean
- closeReason: null | "long_pause" | "stale_heartbeat" (자동 저장된 세션은 status를 "auto_closed"로 둔다)
- lastHeartbeatAt
- nextGoals: [{ at, text }] (복귀 루틴: 일시정지 후 다시 시작할 때 적은 이어서 할 일)

## groups/{groupId}
- name, description, joinMode: "open" | "approval", ownerUid, createdAt
- weeklyGoalHours (공동 목표)
- inviteCode

## groups/{groupId}/members/{uid}
- displayName, role: "owner" | "member", status: "active" | "left", joinedAt, leftAt

## groups/{groupId}/joinRequests/{uid}
- displayName, requestedAt, status: "pending" | "approved" | "rejected", handledAt

## contributions/{groupId}_{sessionId}
- 문서 ID를 `그룹ID_세션ID`로 고정해서 같은 세션이 두 번 더해지지 않게 한다.
- groupId, sessionId, uid, displayName, studyMs, dayKey, weekKey, createdAt

## 세션 저장 흐름
1. 세션 종료 시 `studyMs`를 계산해 sessions 문서를 completed로 바꾼다. 오래 쉬어 자동 저장되면 auto_closed로 바꾼다. 둘 다 개인 통계와 그룹 집계에 들어간다.
2. `shareToGroups`가 켜져 있으면, 그 시점에 status가 "active"인 모든 그룹 멤버십을 찾는다.
3. 각 그룹에 contributions 문서를 `set`으로 쓴다(같은 ID면 덮어쓰므로 중복이 생기지 않는다).
4. 1~3을 Firestore batch로 한 번에 처리한다.

## 집계
- 개인 통계: sessions에서 uid와 weekKey로 조회해 화면에서 합산한다.
- 그룹 통계: contributions에서 groupId와 weekKey로 조회해 화면에서 합산한다.
