// 스터디그룹 저장·불러오기 (docs/data-model.md)
import {
  Timestamp,
  arrayRemove,
  arrayUnion,
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  where,
  writeBatch,
  type DocumentData,
} from 'firebase/firestore'
import { db } from './firebase'

export type JoinMode = 'open' | 'approval'

export interface Group {
  id: string
  name: string
  description: string
  joinMode: JoinMode
  ownerUid: string
  memberUids: string[]
  weeklyGoalHours: number | null
  inviteCode: string
}

export interface GroupMember {
  uid: string
  displayName: string
  role: 'owner' | 'member'
  status: 'active' | 'left'
}

export interface JoinRequest {
  uid: string
  displayName: string
  requestedAt: number
  status: 'pending' | 'approved' | 'rejected'
}

export interface Contribution {
  sessionId: string
  uid: string
  studyMs: number
  dayKey: string
}

export interface MemberContribution extends Contribution {
  weekKey: string
}

export interface Person {
  uid: string
  displayName: string
}

function requireDb() {
  if (!db) throw new Error('Firestore가 설정되지 않았습니다.')
  return db
}

const groupRef = (groupId: string) => doc(requireDb(), 'groups', groupId)
const memberRef = (groupId: string, uid: string) => doc(requireDb(), 'groups', groupId, 'members', uid)
const requestRef = (groupId: string, uid: string) => doc(requireDb(), 'groups', groupId, 'joinRequests', uid)

function toGroup(id: string, data: DocumentData): Group {
  return {
    id,
    name: data.name,
    description: data.description ?? '',
    joinMode: data.joinMode,
    ownerUid: data.ownerUid,
    memberUids: data.memberUids ?? [],
    weeklyGoalHours: data.weeklyGoalHours ?? null,
    inviteCode: data.inviteCode,
  }
}

export function inviteLink(group: Group): string {
  return `${window.location.origin}/join/${group.id}?code=${group.inviteCode}`
}

// 그룹과 운영자 구성원을 한 번에 만든다. 둘 중 하나만 저장되는 일이 없다.
export async function createGroup(
  person: Person,
  input: { name: string; description: string; joinMode: JoinMode; weeklyGoalHours: number | null },
): Promise<string> {
  const ref = doc(collection(requireDb(), 'groups'))
  const batch = writeBatch(requireDb())
  batch.set(ref, {
    ...input,
    ownerUid: person.uid,
    memberUids: [person.uid],
    inviteCode: crypto.randomUUID().replaceAll('-', '').slice(0, 12),
    createdAt: serverTimestamp(),
  })
  batch.set(memberRef(ref.id, person.uid), {
    displayName: person.displayName,
    role: 'owner',
    status: 'active',
    joinedAt: serverTimestamp(),
    leftAt: null,
  })
  await batch.commit()
  return ref.id
}

export async function getGroup(groupId: string): Promise<Group | null> {
  const snapshot = await getDoc(groupRef(groupId))
  return snapshot.exists() ? toGroup(snapshot.id, snapshot.data()) : null
}

// 내가 구성원인 그룹. 세션을 마칠 때 그룹 집계에도 쓴다.
export async function getMyGroupIds(uid: string): Promise<string[]> {
  const snapshot = await getDocs(query(collection(requireDb(), 'groups'), where('memberUids', 'array-contains', uid)))
  return snapshot.docs.map((d) => d.id)
}

export function subscribeMyGroups(uid: string, onChange: (groups: Group[]) => void, onError: (error: unknown) => void) {
  return onSnapshot(
    query(collection(requireDb(), 'groups'), where('memberUids', 'array-contains', uid)),
    (snapshot) => onChange(snapshot.docs.map((d) => toGroup(d.id, d.data()))),
    onError,
  )
}

export function subscribeMembers(groupId: string, onChange: (members: GroupMember[]) => void) {
  return onSnapshot(collection(requireDb(), 'groups', groupId, 'members'), (snapshot) => {
    onChange(
      snapshot.docs.map((d) => ({
        uid: d.id,
        displayName: d.data().displayName ?? '',
        role: d.data().role,
        status: d.data().status,
      })),
    )
  })
}

export function subscribePendingRequests(groupId: string, onChange: (requests: JoinRequest[]) => void) {
  return onSnapshot(
    query(collection(requireDb(), 'groups', groupId, 'joinRequests'), where('status', '==', 'pending')),
    (snapshot) => {
      onChange(
        snapshot.docs.map((d) => ({
          uid: d.id,
          displayName: d.data().displayName ?? '',
          requestedAt: d.data().requestedAt instanceof Timestamp ? d.data().requestedAt.toMillis() : 0,
          status: d.data().status,
        })),
      )
    },
  )
}

export function subscribeWeekContributions(
  groupId: string,
  weekKey: string,
  onChange: (contributions: Contribution[]) => void,
) {
  return onSnapshot(
    query(collection(requireDb(), 'groups', groupId, 'contributions'), where('weekKey', '==', weekKey)),
    (snapshot) => {
      onChange(
        snapshot.docs.map((d) => ({
          sessionId: d.id,
          uid: d.data().uid,
          studyMs: d.data().studyMs ?? 0,
          dayKey: d.data().dayKey,
        })),
      )
    },
  )
}

// 한 구성원이 이 그룹에 공유한 기록 전체 (구성원 상세 화면)
export function subscribeMemberContributions(
  groupId: string,
  uid: string,
  onChange: (contributions: MemberContribution[]) => void,
) {
  return onSnapshot(
    query(collection(requireDb(), 'groups', groupId, 'contributions'), where('uid', '==', uid)),
    (snapshot) => {
      onChange(
        snapshot.docs.map((d) => ({
          sessionId: d.id,
          uid: d.data().uid,
          studyMs: d.data().studyMs ?? 0,
          dayKey: d.data().dayKey,
          weekKey: d.data().weekKey,
        })),
      )
    },
  )
}

export async function getMyJoinRequest(groupId: string, uid: string): Promise<JoinRequest | null> {
  const snapshot = await getDoc(requestRef(groupId, uid))
  if (!snapshot.exists()) return null
  return {
    uid,
    displayName: snapshot.data().displayName ?? '',
    requestedAt: 0,
    status: snapshot.data().status,
  }
}

// 즉시 가입. 구성원 문서와 그룹의 구성원 목록을 한 번에 바꾼다.
export async function joinOpenGroup(group: Group, person: Person, inviteCode: string): Promise<void> {
  const batch = writeBatch(requireDb())
  batch.set(memberRef(group.id, person.uid), {
    displayName: person.displayName,
    role: 'member',
    status: 'active',
    inviteCode,
    joinedAt: serverTimestamp(),
    leftAt: null,
  })
  batch.update(groupRef(group.id), { memberUids: arrayUnion(person.uid) })
  await batch.commit()
}

export async function requestToJoin(group: Group, person: Person, inviteCode: string): Promise<void> {
  const batch = writeBatch(requireDb())
  batch.set(requestRef(group.id, person.uid), {
    displayName: person.displayName,
    inviteCode,
    status: 'pending',
    requestedAt: serverTimestamp(),
    handledAt: null,
  })
  await batch.commit()
}

export async function approveRequest(groupId: string, request: JoinRequest): Promise<void> {
  const batch = writeBatch(requireDb())
  batch.update(requestRef(groupId, request.uid), { status: 'approved', handledAt: serverTimestamp() })
  batch.set(memberRef(groupId, request.uid), {
    displayName: request.displayName,
    role: 'member',
    status: 'active',
    joinedAt: serverTimestamp(),
    leftAt: null,
  })
  batch.update(groupRef(groupId), { memberUids: arrayUnion(request.uid) })
  await batch.commit()
}

export async function rejectRequest(groupId: string, uid: string): Promise<void> {
  const batch = writeBatch(requireDb())
  batch.update(requestRef(groupId, uid), { status: 'rejected', handledAt: serverTimestamp() })
  await batch.commit()
}

export async function leaveGroup(groupId: string, uid: string): Promise<void> {
  const batch = writeBatch(requireDb())
  batch.update(memberRef(groupId, uid), { status: 'left', leftAt: serverTimestamp() })
  batch.update(groupRef(groupId), { memberUids: arrayRemove(uid) })
  await batch.commit()
}
