/**
 * Customer-facing tracking stages — mapping dari "lead.app status list final".
 * Task Name (Hyundai) → 7 tahap masking untuk UI tracking publik.
 */

export const TRACKING_STAGE_IDS = [
  'Application Submitted',
  'Data Verification',
  'Approval Process',
  'Agreement Activation Process',
  'Customer Confirmation',
  'Vehicle Delivery',
  'Contract Activation',
] as const;

export type TrackingStageId = (typeof TRACKING_STAGE_IDS)[number];

export type TrackingStageStatus = "pending" | "current" | "completed" | "rejected";

export type TrackingStageProgress = {
  id: TrackingStageId;
  index: number;
  status: TrackingStageStatus;
  startedAt: string | null;
  endedAt: string | null;
};

/** Terminal rejection task (setelah Update Lead KYC) — mapping Richard Fam. */
export const REJECTED_TRACKING_TASK_NAMES = [
  'Update Lead Stat to Rejected',
  'Update Lead Status to Rejected',
  'Update App Status to Rejected',
] as const;

type TaskStageCandidate = { order: number; stageId: TrackingStageId };

/** Normalize task name for lookup (trim + collapse whitespace). */
export function normalizeTrackingTaskName(name: string): string {
  return name
    .normalize('NFKC')
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase();
}

export function isRejectedTrackingTask(taskName: string): boolean {
  const key = normalizeTrackingTaskName(taskName);
  if (!key) return false;
  if (
    REJECTED_TRACKING_TASK_NAMES.some(
      (name) => normalizeTrackingTaskName(name) === key
    )
  ) {
    return true;
  }
  // Fallback variants dari LOS/Hyundai (spelling / wording sedikit beda).
  if (key.includes('rejected') && (key.includes('lead') || key.includes('app'))) {
    return true;
  }
  if (key.includes('stat to rejected') || key.includes('status to rejected')) {
    return true;
  }
  return false;
}

const TASK_STAGE_CANDIDATES: Record<string, TaskStageCandidate[]> = {
  "update lead step - lead input": [{ order: 1, stageId: 'Application Submitted' }, { order: 13, stageId: 'Data Verification' }],
  "input data from website": [{ order: 2, stageId: 'Application Submitted' }],
  "add customer consent": [{ order: 3, stageId: 'Application Submitted' }],
  "send customer consent": [{ order: 4, stageId: 'Application Submitted' }],
  "mobile cust consent": [{ order: 5, stageId: 'Application Submitted' }],
  "get all lead applicant number": [{ order: 6, stageId: 'Application Submitted' }, { order: 17, stageId: 'Data Verification' }],
  "update customer consent status success": [{ order: 7, stageId: 'Application Submitted' }],
  "request cbas_slik": [{ order: 8, stageId: 'Data Verification' }],
  "request cde pre-screening customer": [{ order: 9, stageId: 'Data Verification' }],
  "get cde pre-screening customer result": [{ order: 10, stageId: 'Data Verification' }],
  "update slik result customer": [{ order: 11, stageId: 'Data Verification' }],
  "forward to mobile loan": [{ order: 12, stageId: 'Data Verification' }],
  "lead input": [{ order: 14, stageId: 'Data Verification' }, { order: 15, stageId: 'Data Verification' }],
  "input lead customers": [{ order: 16, stageId: 'Data Verification' }],
  "add lead kyc": [{ order: 18, stageId: 'Data Verification' }],
  "internal cust duplicate checking": [{ order: 19, stageId: 'Data Verification' }],
  "get general setting fraud order": [{ order: 20, stageId: 'Data Verification' }],
  "set maximum retry for kyc check": [{ order: 21, stageId: 'Data Verification' }],
  "set kyc cust to check": [{ order: 22, stageId: 'Data Verification' }, { order: 25, stageId: 'Data Verification' }],
  "request kyc (vida)": [{ order: 23, stageId: 'Data Verification' }],
  "wait for kyc result": [{ order: 24, stageId: 'Data Verification' }],
  "request cde kyc customer": [{ order: 26, stageId: 'Data Verification' }],
  "get cde kyc customer result": [{ order: 27, stageId: 'Data Verification' }],
  "update lead kyc": [{ order: 28, stageId: 'Data Verification' }],
  /** Terminal reject — muncul setelah Update Lead KYC (lead_stat = RJC). */
  "update lead stat to rejected": [{ order: 29, stageId: 'Data Verification' }],
  "update lead step - lead review": [{ order: 30, stageId: 'Data Verification' }],
  "generate lead review stat": [{ order: 31, stageId: 'Data Verification' }],
  "lead review": [{ order: 32, stageId: 'Data Verification' }],
  "update lead step - send data to los": [{ order: 33, stageId: 'Data Verification' }],
  "send data to los r3": [{ order: 34, stageId: 'Data Verification' }],
  "customer data completion check": [{ order: 35, stageId: 'Data Verification' }],
  "check from los mobile": [{ order: 36, stageId: 'Data Verification' }],
  "update app step - mobile cust completion": [{ order: 37, stageId: 'Data Verification' }],
  "mobile cust completion": [{ order: 38, stageId: 'Data Verification' }],
  "update checking step cust data completion done": [{ order: 39, stageId: 'Data Verification' }],
  "update get and upload selfie document status": [{ order: 40, stageId: 'Data Verification' }],
  "get and upload selfie after cust consent": [{ order: 41, stageId: 'Data Verification' }],
  "check need digitalization": [{ order: 42, stageId: 'Data Verification' }],
  "third party checking": [{ order: 43, stageId: 'Data Verification' }],
  "update app step check selfie validity": [{ order: 44, stageId: 'Data Verification' }],
  "check selfie validity": [{ order: 45, stageId: 'Data Verification' }],
  "update application step credit deviation checking": [{ order: 46, stageId: 'Data Verification' }],
  "credit deviation checking": [{ order: 47, stageId: 'Data Verification' }],
  "update application step product deviation checking": [{ order: 48, stageId: 'Data Verification' }],
  "product deviation checking": [{ order: 49, stageId: 'Data Verification' }],
  "update application step calculate dsr": [{ order: 50, stageId: 'Data Verification' }],
  "calculate dsr": [{ order: 51, stageId: 'Data Verification' }],
  "update application step calculate dir": [{ order: 52, stageId: 'Data Verification' }],
  "calculate dir": [{ order: 53, stageId: 'Data Verification' }],
  "update application step score grading": [{ order: 54, stageId: 'Data Verification' }],
  "score grading": [{ order: 55, stageId: 'Data Verification' }],
  "update application step cde credit assessment debtor": [{ order: 56, stageId: 'Data Verification' }],
  "request cde credit assessment customer": [{ order: 57, stageId: 'Data Verification' }],
  "update application step get cde credit assessment recommendation": [{ order: 58, stageId: 'Data Verification' }],
  "finalize cde credit assessment result": [{ order: 59, stageId: 'Data Verification' }],
  "update cde final result to app": [{ order: 60, stageId: 'Data Verification' }],
  "get tc count with request status": [{ order: 61, stageId: 'Data Verification' }],
  "update app step - sending mandatory tc": [{ order: 62, stageId: 'Data Verification' }],
  "send os mandatory tc to cmo": [{ order: 63, stageId: 'Data Verification' }],
  "send os mandatory tc to debtor": [{ order: 64, stageId: 'Data Verification' }],
  "check need e-sign registration": [{ order: 65, stageId: 'Data Verification' }, { order: 93, stageId: 'Agreement Activation Process' }],
  "check re-tele survey": [{ order: 66, stageId: 'Data Verification' }],
  "check asset condition": [{ order: 67, stageId: 'Data Verification' }],
  "update application paralel step": [{ order: 68, stageId: 'Data Verification' }],
  "app completion mobile loan": [{ order: 69, stageId: 'Data Verification' }],
  "phone verification": [{ order: 70, stageId: 'Data Verification' }],
  "complete application step app mobile completion": [{ order: 71, stageId: 'Data Verification' }],
  "complete application step phone verification": [{ order: 72, stageId: 'Data Verification' }],
  "update application step capture exposure": [{ order: 73, stageId: 'Data Verification' }, { order: 76, stageId: 'Approval Process' }],
  "credit review data capture": [{ order: 74, stageId: 'Data Verification' }],
  "credit review": [{ order: 75, stageId: 'Approval Process' }],
  "capture exposure r3": [{ order: 77, stageId: 'Approval Process' }],
  "capture exposure from lms r3": [{ order: 78, stageId: 'Approval Process' }],
  "update application step credit review": [{ order: 79, stageId: 'Approval Process' }],
  "update application step credit approval": [{ order: 80, stageId: 'Approval Process' }],
  "process credit approval with crdv": [{ order: 81, stageId: 'Approval Process' }],
  "insert rfa log": [{ order: 82, stageId: 'Approval Process' }],
  "update application step notify credit approval result": [{ order: 83, stageId: 'Approval Process' }],
  "send push notification credit approved to sales officer": [{ order: 84, stageId: 'Approval Process' }],
  "update app approval": [{ order: 85, stageId: 'Approval Process' }],
  "update application step agreement activation": [{ order: 86, stageId: 'Agreement Activation Process' }, { order: 92, stageId: 'Agreement Activation Process' }],
  "agreement activation": [{ order: 87, stageId: 'Agreement Activation Process' }],
  "update application step notify agreement activation": [{ order: 88, stageId: 'Agreement Activation Process' }],
  "send notification after agreement activation": [{ order: 89, stageId: 'Agreement Activation Process' }],
  "update agreement step copy documents": [{ order: 90, stageId: 'Agreement Activation Process' }],
  "upload document from app to agreement": [{ order: 91, stageId: 'Agreement Activation Process' }],
  "update agreement step ofvc": [{ order: 94, stageId: 'Agreement Activation Process' }],
  "offering validity checking": [{ order: 95, stageId: 'Agreement Activation Process' }],
  "is new cust tdp paid at coy": [{ order: 96, stageId: 'Agreement Activation Process' }],
  "check vendor automatic po": [{ order: 97, stageId: 'Agreement Activation Process' }],
  "update agreement step manual po": [{ order: 98, stageId: 'Agreement Activation Process' }],
  "purchase order": [{ order: 99, stageId: 'Agreement Activation Process' }],
  "update agreement step email po": [{ order: 100, stageId: 'Agreement Activation Process' }],
  "send email purchase order": [{ order: 101, stageId: 'Agreement Activation Process' }],
  "update agreement step rapindo": [{ order: 102, stageId: 'Agreement Activation Process' }],
  "check existing rapindo result": [{ order: 103, stageId: 'Agreement Activation Process' }],
  "update agreement step cnfr": [{ order: 104, stageId: 'Agreement Activation Process' }],
  "customer confirmation": [{ order: 105, stageId: 'Customer Confirmation' }],
  "update agreement step do": [{ order: 106, stageId: 'Customer Confirmation' }],
  "delivery order": [{ order: 107, stageId: 'Vehicle Delivery' }],
  "update agreement step pglv": [{ order: 108, stageId: 'Vehicle Delivery' }],
  "pre go live": [{ order: 109, stageId: 'Contract Activation' }],
  "update agrmnt step integrasi lms r3 after agreement activation": [{ order: 110, stageId: 'Contract Activation' }],
  "integrasi lms r3 after agreement activation": [{ order: 111, stageId: 'Contract Activation' }],
  "update agreement step csr": [{ order: 112, stageId: 'Contract Activation' }],
  "customer registration": [{ order: 113, stageId: 'Contract Activation' }],
  "customer registration x": [{ order: 114, stageId: 'Contract Activation' }],
  "update agrmnt step integrasi ams r3 after pre go live": [{ order: 115, stageId: 'Contract Activation' }],
  "integrasi ams r3 after pre go live": [{ order: 116, stageId: 'Contract Activation' }],
  "send agreement data to contract doc": [{ order: 117, stageId: 'Contract Activation' }],
  "update agrmnt step integrasi lms r3 after pre go live": [{ order: 118, stageId: 'Contract Activation' }],
  "integrasi lms r3 after pre go live": [{ order: 119, stageId: 'Contract Activation' }],
  "update agrmnt step integrasi cms r3 after pre go live": [{ order: 120, stageId: 'Contract Activation' }],
  "integrasi cms r3 after pre go live": [{ order: 121, stageId: 'Contract Activation' }],
  "update agrmnt step coll_reg": [{ order: 122, stageId: 'Contract Activation' }],
  "collateral registration": [{ order: 123, stageId: 'Contract Activation' }],
  "update agrmnt step finalize dms": [{ order: 124, stageId: 'Contract Activation' }],
  "update app dms record": [{ order: 125, stageId: 'Contract Activation' }],
  "update agrmnt step integrasi fou r3 after pre go live": [{ order: 126, stageId: 'Contract Activation' }],
  "send appcust data to fou for manual update": [{ order: 127, stageId: 'Contract Activation' }],
  "update agrmnt step notify pre go live": [{ order: 128, stageId: 'Contract Activation' }],
  "send push notification application live to spv & cmo": [{ order: 129, stageId: 'Contract Activation' }],
  "update agreement status liv": [{ order: 130, stageId: 'Contract Activation' }],
  "update agreement step liv": [{ order: 131, stageId: 'Contract Activation' }],
  "update app status and step to live": [{ order: 132, stageId: 'Contract Activation' }],
};

export function getTrackingStageIndex(stageId: TrackingStageId): number {
  return TRACKING_STAGE_IDS.indexOf(stageId);
}

/**
 * Resolve a Hyundai task name to a customer-facing stage.
 * For names that appear in multiple stages, pick the earliest candidate whose
 * process order is >= `minOrder` (chronological disambiguation).
 */
export function resolveTaskStage(
  taskName: string,
  minOrder = 1
): { stageId: TrackingStageId; order: number } | null {
  const key = normalizeTrackingTaskName(taskName);
  const candidates = TASK_STAGE_CANDIDATES[key];
  if (!candidates?.length) return null;

  const forward = candidates.find((c) => c.order >= minOrder);
  if (forward) return { stageId: forward.stageId, order: forward.order };

  // Fallback: last known mapping (task appeared out of order / after completion).
  const last = candidates[candidates.length - 1];
  return { stageId: last.stageId, order: last.order };
}

function parseTime(iso: string | null | undefined): number {
  if (!iso) return Number.NaN;
  const t = Date.parse(iso);
  return Number.isNaN(t) ? Number.NaN : t;
}

export type TaskLike = {
  Name: string;
  StartTime?: string | null;
  EndTime?: string | null;
};

/** Cari task reject terakhir secara kronologis. */
export function findRejectedTrackingTask<T extends TaskLike>(
  tasks: T[]
): T | null {
  let found: T | null = null;
  for (const task of tasks) {
    if (isRejectedTrackingTask(task.Name)) found = task;
  }
  return found;
}

/**
 * Collapse raw Hyundai task history into the 7 customer-facing stages.
 * Stages before the furthest reached stage are completed; the furthest is
 * current (unless fully ended and is the final stage → completed).
 *
 * Jika ada task terminal reject (mis. "Update Lead Stat to Rejected"), tahap
 * tempat reject terjadi ditandai `rejected` (bukan "sedang diproses").
 */
export function collapseTaskHistoryToStages(tasks: TaskLike[]): TrackingStageProgress[] {
  const sorted = [...tasks].sort((a, b) => {
    const ta = parseTime(a.StartTime);
    const tb = parseTime(b.StartTime);
    if (Number.isNaN(ta) && Number.isNaN(tb)) return 0;
    if (Number.isNaN(ta)) return 1;
    if (Number.isNaN(tb)) return -1;
    return ta - tb;
  });

  // Pass 1: temukan reject terminal (pakai yang terakhir secara waktu).
  let rejectAtSortedIndex = -1;
  for (let i = 0; i < sorted.length; i++) {
    if (isRejectedTrackingTask(sorted[i].Name)) {
      rejectAtSortedIndex = i;
    }
  }
  const rejectTask =
    rejectAtSortedIndex >= 0 ? sorted[rejectAtSortedIndex] : null;
  const tasksToProcess =
    rejectAtSortedIndex >= 0 ? sorted.slice(0, rejectAtSortedIndex + 1) : sorted;

  const stageMeta = new Map<
    TrackingStageId,
    { startedAt: string | null; endedAt: string | null; maxOrder: number; openCount: number; seen: number }
  >();

  let cursorOrder = 1;
  let furthestIndex = -1;
  let rejectedIndex = -1;

  for (const task of tasksToProcess) {
    const isReject = isRejectedTrackingTask(task.Name);
    const resolved = isReject
      ? resolveTaskStage(task.Name, cursorOrder) ?? {
          stageId: 'Data Verification' as TrackingStageId,
          order: Math.max(cursorOrder, 29),
        }
      : resolveTaskStage(task.Name, cursorOrder);
    if (!resolved) continue;

    const { stageId, order } = resolved;
    cursorOrder = Math.max(cursorOrder, order);
    const idx = getTrackingStageIndex(stageId);
    if (idx > furthestIndex) furthestIndex = idx;

    if (isReject) {
      rejectedIndex = idx;
    }

    const prev = stageMeta.get(stageId) ?? {
      startedAt: null,
      endedAt: null,
      maxOrder: 0,
      openCount: 0,
      seen: 0,
    };
    prev.seen += 1;
    prev.maxOrder = Math.max(prev.maxOrder, order);

    const start = task.StartTime ?? null;
    const end = task.EndTime ?? null;
    if (start) {
      const prevStart = parseTime(prev.startedAt);
      const nextStart = parseTime(start);
      if (Number.isNaN(prevStart) || (!Number.isNaN(nextStart) && nextStart < prevStart)) {
        prev.startedAt = start;
      }
    }
    if (end) {
      const prevEnd = parseTime(prev.endedAt);
      const nextEnd = parseTime(end);
      if (Number.isNaN(prevEnd) || (!Number.isNaN(nextEnd) && nextEnd > prevEnd)) {
        prev.endedAt = end;
      }
    } else if (!isReject) {
      prev.openCount += 1;
    }

    stageMeta.set(stageId, prev);
  }

  // Safety: reject task ketemu tapi tidak ter-map ke stage manapun.
  if (rejectTask && rejectedIndex < 0) {
    rejectedIndex = Math.max(furthestIndex, getTrackingStageIndex('Data Verification'));
  }

  if (rejectedIndex >= 0 && rejectTask) {
    return TRACKING_STAGE_IDS.map((id, index) => {
      const meta = stageMeta.get(id);
      let status: TrackingStageStatus = 'pending';
      if (index < rejectedIndex) status = 'completed';
      else if (index === rejectedIndex) status = 'rejected';

      return {
        id,
        index,
        status,
        startedAt:
          index === rejectedIndex
            ? rejectTask.StartTime ?? meta?.startedAt ?? null
            : meta?.startedAt ?? null,
        endedAt:
          index === rejectedIndex
            ? rejectTask.EndTime ?? meta?.endedAt ?? null
            : meta?.endedAt ?? null,
      };
    });
  }

  const lastStageIndex = TRACKING_STAGE_IDS.length - 1;
  const furthestFullyDone =
    furthestIndex === lastStageIndex &&
    (() => {
      const meta = stageMeta.get(TRACKING_STAGE_IDS[lastStageIndex]);
      return Boolean(meta && meta.seen > 0 && meta.openCount === 0 && meta.endedAt);
    })();

  return TRACKING_STAGE_IDS.map((id, index) => {
    const meta = stageMeta.get(id);
    let status: TrackingStageStatus = 'pending';
    if (furthestIndex < 0) {
      status = 'pending';
    } else if (index < furthestIndex) {
      status = 'completed';
    } else if (index === furthestIndex) {
      status = furthestFullyDone ? 'completed' : 'current';
    }

    return {
      id,
      index,
      status,
      startedAt: meta?.startedAt ?? null,
      endedAt: meta?.endedAt ?? null,
    };
  });
}
