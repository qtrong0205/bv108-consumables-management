import React, { useEffect, useMemo, useRef, useState } from 'react';
import { HoaDonUBot, OrderHistory } from '@/types';
import { ApiInvoiceReconciliationRecord, SaveInvoiceReconciliationItemRequest, apiService } from '@/services/api';
import { Badge } from '@/components/ui/badge';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
    Building2,
    Calendar,
    ChevronDown,
    ChevronRight,
    Package,
} from 'lucide-react';

interface InvoiceTableProps {
    orders: OrderHistory[];
    hoaDons: HoaDonUBot[];
    matchedInvoiceNumbers?: Set<string>;
    matchedReconciliations?: ApiInvoiceReconciliationRecord[];
    onMatchedInvoicesSaved?: (invoiceNumbers: string[]) => void;
    searchTerm?: string;
    onSearchChange?: (term: string) => void;
    expandedSuppliers?: Set<string>;
    onExpandedSuppliersChange?: (expanded: Set<string>) => void;
    filterSupplierStatus?: 'all' | 'hasInvoice' | 'noInvoice';
    onFilterSupplierStatusChange?: (status: 'all' | 'hasInvoice' | 'noInvoice') => void;
}

type DetailStatus = 'matched' | 'enough' | 'shortage' | 'surplus' | 'material-mismatch' | 'no-invoice';

interface ReconciliationResult {
    order: OrderHistory;
    invoice?: HoaDonUBot;
    hasInvoice: boolean;
    quantityDiff?: number;
    detailStatus: DetailStatus;
    detailNote?: string;
    matchScore?: number;
    matchedInvoiceNumber?: string;
    isFromHistory?: boolean;
}

interface SupplierGroup {
    groupId: string;
    batchKey: string;
    batchTime: string;
    nhaThau: string;
    results: ReconciliationResult[];
    latestDate: Date;
    stats: {
        hasInvoice: number;
        noInvoice: number;
        matchedInvoiceNumber?: string;
        matchedInvoiceLineCount?: number;
    };
}

interface InvoiceLine {
    codeKey: string;
    nameKey: string;
    unitKey: string;
    invoiceDate: Date | null;
    data: HoaDonUBot;
}

interface InvoiceDocument {
    supplierKey: string;
    invoiceNumber: string;
    invoiceDate: Date | null;
    lines: InvoiceLine[];
}

interface SupplierDetailModalData {
    supplierName: string;
    orderItems: ReconciliationResult[];
    invoiceItems: HoaDonUBot[];
    selectedInvoiceNumber?: string;
}

interface ModalPairRow {
    left?: ReconciliationResult;
    right?: HoaDonUBot;
}

const normalize = (value?: string | null) => {
    if (!value) return '';
    return value
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, ' ')
        .trim();
};

const normalizeInvoiceKey = (value?: string | null) => (value || '').trim().toLowerCase();

const coerceDetailStatus = (value?: string | null): DetailStatus => {
    switch (value) {
        case 'matched':
        case 'enough':
        case 'shortage':
        case 'surplus':
        case 'material-mismatch':
        case 'no-invoice':
            return value;
        default:
            return 'matched';
    }
};

const parseDate = (value: string | Date) => {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
};

const EMPTY_MATCHED_INVOICE_SET = new Set<string>();

// TEST MODE: keep true while testing with fake data.
// Set to false to enable strict invoice time gating.
const parseBooleanEnv = (value: string | undefined, defaultValue: boolean) => {
    if (!value) return defaultValue;
    const normalized = value.trim().toLowerCase();
    if (['1', 'true', 'yes', 'on'].includes(normalized)) return true;
    if (['0', 'false', 'no', 'off'].includes(normalized)) return false;
    return defaultValue;
};

const IS_INVOICE_RECONCILE_TEST_MODE = parseBooleanEnv(
    import.meta.env.VITE_INVOICE_RECONCILE_TEST_MODE as string | undefined,
    true,
);
const MIN_INVOICE_DELAY_HOURS = 12;
const MIN_INVOICE_DELAY_MS = MIN_INVOICE_DELAY_HOURS * 60 * 60 * 1000;

const isInvoiceTimeEligible = (orderDate: Date, invoiceDate: Date) => {
    return invoiceDate.getTime() - orderDate.getTime() >= MIN_INVOICE_DELAY_MS;
};

const getInvoiceNumber = (invoice: HoaDonUBot) => {
    const soHoaDon = (invoice.soHoaDon || '').trim();
    const idHoaDon = (invoice.idHoaDon || '').trim();
    if (soHoaDon) return soHoaDon;
    if (idHoaDon) return idHoaDon;
    return `ID-${invoice.id}`;
};

const getOrderSupplierKey = (order: OrderHistory) => {
    if (order.companyContactId !== undefined && order.companyContactId !== null) {
        return `cc-${order.companyContactId}`;
    }
    return normalize(order.nhaThau);
};

const getOrderSupplierFallbackKey = (order: OrderHistory) => normalize(order.nhaThau);

const getOrderBatchKey = (order: OrderHistory) => {
    const fromApi = (order.orderBatchKey || '').trim();
    if (fromApi) return fromApi;
    return `${getOrderSupplierKey(order)}__${String(order.ngayDatHang)}`;
};

const getInvoiceDocumentCompanyContactId = (document: InvoiceDocument): number | undefined => {
    const first = document.lines[0]?.data?.companyContactId;
    return first === undefined || first === null ? undefined : first;
};

const getInvoiceDocumentCompanyNameKey = (document: InvoiceDocument) => {
    const first = document.lines[0]?.data?.congTy;
    return normalize(first || '');
};

const getInvoiceSupplierKey = (invoice: HoaDonUBot) => {
    if (invoice.companyContactId !== undefined && invoice.companyContactId !== null) {
        return `cc-${invoice.companyContactId}`;
    }
    return normalize(invoice.congTy);
};

const extractPotentialMaterialCodes = (value?: string | null) => {
    const normalized = normalize(value || '');
    if (!normalized) return [] as string[];
    const parts = normalized.split(/\s+/).filter(Boolean);
    const codeLike = parts.filter((part) => /[a-z]\d{4,}/.test(part));
    return Array.from(new Set(codeLike));
};

const getOrderCodeKeys = (order: OrderHistory) => {
    const keys = new Set<string>();
    const baseCodes = [order.maQuanLy, order.maVtytCu, order.tenVtytBv];
    baseCodes.forEach((raw) => {
        const normalized = normalize(raw || '');
        if (normalized) keys.add(normalized);
        extractPotentialMaterialCodes(raw).forEach((code) => keys.add(code));
    });
    return Array.from(keys);
};

const deduplicateInvoiceDocuments = (documents: InvoiceDocument[]) => {
    const map = new Map<string, InvoiceDocument>();
    documents.forEach((doc) => {
        const uniqueKey = `${doc.invoiceNumber}__${doc.lines.length}`;
        if (!map.has(uniqueKey)) map.set(uniqueKey, doc);
    });
    return Array.from(map.values());
};

const getInvoiceDocumentUniqueKey = (document: InvoiceDocument) => {
    return `${document.invoiceNumber}__${document.lines.length}`;
};

const selectCandidateDocsForBatch = (batchOrders: OrderHistory[], uniqueDocs: InvoiceDocument[]) => {
    if (batchOrders.length === 0) return uniqueDocs;

    const orderItemTypeCount = batchOrders.length;
    const orderCompanyNameKey = normalize(batchOrders[0]?.nhaThau || '');
    const orderCompanyContactId = batchOrders.find(
        (order) => order.companyContactId !== undefined && order.companyContactId !== null,
    )?.companyContactId;

    const docsWithSameItemTypeCount = uniqueDocs.filter((doc) => doc.lines.length === orderItemTypeCount);
    const docsWithNearItemTypeCount = uniqueDocs.filter((doc) => Math.abs(doc.lines.length - orderItemTypeCount) <= 1);

    const docsWithSameCompanyContactId = orderCompanyContactId !== undefined
        ? uniqueDocs.filter((doc) => getInvoiceDocumentCompanyContactId(doc) === orderCompanyContactId)
        : [];

    const docsWithSameCompanyName = uniqueDocs.filter(
        (doc) => getInvoiceDocumentCompanyNameKey(doc) === orderCompanyNameKey,
    );

    const docsStrict = uniqueDocs.filter((doc) => {
        const sameCount = Math.abs(doc.lines.length - orderItemTypeCount) <= 1;
        const sameName = getInvoiceDocumentCompanyNameKey(doc) === orderCompanyNameKey;
        const sameContact = orderCompanyContactId !== undefined
            ? getInvoiceDocumentCompanyContactId(doc) === orderCompanyContactId
            : true;
        return sameCount && sameName && sameContact;
    });

    const docsByContactAndNearCount = docsWithSameCompanyContactId.filter(
        (doc) => Math.abs(doc.lines.length - orderItemTypeCount) <= 1,
    );

    const docsByNameAndNearCount = docsWithSameCompanyName.filter(
        (doc) => Math.abs(doc.lines.length - orderItemTypeCount) <= 1,
    );

    let candidateDocs = uniqueDocs;
    if (docsStrict.length > 0) candidateDocs = docsStrict;
    else if (docsByContactAndNearCount.length > 0) candidateDocs = docsByContactAndNearCount;
    else if (docsByNameAndNearCount.length > 0) candidateDocs = docsByNameAndNearCount;
    else if (docsWithSameItemTypeCount.length > 0) candidateDocs = docsWithSameItemTypeCount;
    else if (docsWithNearItemTypeCount.length > 0) candidateDocs = docsWithNearItemTypeCount;

    return candidateDocs;
};

const scoreOrderWithInvoiceLine = (order: OrderHistory, candidate: InvoiceLine) => {
    const orderCodeKeys = getOrderCodeKeys(order);
    const orderName = normalize(order.tenVtytBv);
    const orderUnit = normalize(order.donViTinh);
    const orderDate = parseDate(order.ngayDatHang);
    const invoiceHasCode = !!candidate.codeKey;

    if (!IS_INVOICE_RECONCILE_TEST_MODE && orderDate && candidate.invoiceDate) {
        // Enable this time gate in non-test mode: invoice must be at least 12 hours after order time.
        if (!isInvoiceTimeEligible(orderDate, candidate.invoiceDate)) {
            return -10000;
        }
    }

    let score = 0;

    if (invoiceHasCode) {
        const codeMatched = !!candidate.codeKey && orderCodeKeys.includes(candidate.codeKey);
        if (codeMatched) score += 120;
        else score -= 20;
    } else {
        if (orderName && candidate.nameKey && orderName === candidate.nameKey) score += 120;
        else score -= 20;
    }

    if (orderUnit && candidate.unitKey && orderUnit === candidate.unitKey) score += 5;

    const qtyGap = Math.abs(Number(candidate.data.soLuong) - Number(order.dotGoiHang));
    score += Math.max(0, 10 - qtyGap);

    if (orderDate && candidate.invoiceDate) {
        const dayGap = Math.abs(orderDate.getTime() - candidate.invoiceDate.getTime()) / (24 * 60 * 60 * 1000);
        if (dayGap <= 7) score += 10;
        else if (dayGap <= 30) score += 6;
        else if (dayGap <= 60) score += 2;
    }

    return score;
};

const evaluateInvoiceDocument = (orders: OrderHistory[], document: InvoiceDocument) => {
    const usedInvoiceRows = new Set<number>();
    let matchedCount = 0;
    let matchScoreTotal = 0;
    let quantityDiffTotal = 0;
    let exactMatchCount = 0;

    orders.forEach((order) => {
        let bestCandidate: InvoiceLine | undefined;
        let bestScore = -1;

        document.lines.forEach((candidate) => {
            if (usedInvoiceRows.has(candidate.data.id)) return;
            const score = scoreOrderWithInvoiceLine(order, candidate);
            if (score > bestScore) {
                bestScore = score;
                bestCandidate = candidate;
            }
        });

        if (bestCandidate && bestScore >= 40) {
            usedInvoiceRows.add(bestCandidate.data.id);
            matchedCount += 1;
            matchScoreTotal += bestScore;
            const quantityDiff = Math.abs(Number(bestCandidate.data.soLuong) - Number(order.dotGoiHang));
            quantityDiffTotal += quantityDiff;

            const orderCodeKeys = getOrderCodeKeys(order);
            const orderName = normalize(order.tenVtytBv);
            const invoiceHasCode = !!bestCandidate.codeKey;
            const codeMatched = !!bestCandidate.codeKey && orderCodeKeys.includes(bestCandidate.codeKey);
            const nameMatchedExact = !!(orderName && bestCandidate.nameKey && orderName === bestCandidate.nameKey);
            const materialMatched = invoiceHasCode ? codeMatched : nameMatchedExact;

            if (materialMatched && quantityDiff === 0) {
                exactMatchCount += 1;
            }
        }
    });

    const lineGapPenalty = Math.abs(document.lines.length - orders.length) * 25;
    const coverageScore = matchedCount * 120;
    const quantityPenalty = quantityDiffTotal * 4;
    const totalScore = coverageScore + matchScoreTotal - quantityPenalty - lineGapPenalty;
    const isFullExactMatch =
        matchedCount === orders.length &&
        exactMatchCount === orders.length &&
        document.lines.length === orders.length;

    return {
        matchedCount,
        totalScore,
        isFullExactMatch,
    };
};

export default function InvoiceTable({ 
    orders, 
    hoaDons,
    matchedInvoiceNumbers,
    matchedReconciliations,
    onMatchedInvoicesSaved,
    searchTerm: externalSearchTerm,
    onSearchChange,
    expandedSuppliers: externalExpandedSuppliers,
    onExpandedSuppliersChange,
    filterSupplierStatus: externalFilterSupplierStatus,
    onFilterSupplierStatusChange,
}: InvoiceTableProps) {
    // Use external state if provided, otherwise use internal state
    const [internalExpandedSuppliers, setInternalExpandedSuppliers] = useState<Set<string>>(new Set());
    const [internalSearchTerm, setInternalSearchTerm] = useState('');
    const [internalFilterSupplierStatus, setInternalFilterSupplierStatus] = useState<'all' | 'hasInvoice' | 'noInvoice'>('all');
    
    const expandedSuppliers = externalExpandedSuppliers ?? internalExpandedSuppliers;
    const setExpandedSuppliers = (value: Set<string> | ((prev: Set<string>) => Set<string>)) => {
        const newValue = typeof value === 'function' ? value(expandedSuppliers) : value;
        if (onExpandedSuppliersChange) {
            onExpandedSuppliersChange(newValue);
        } else {
            setInternalExpandedSuppliers(newValue);
        }
    };
    
    const searchTerm = externalSearchTerm ?? internalSearchTerm;
    const setSearchTerm = (value: string | ((prev: string) => string)) => {
        const newValue = typeof value === 'function' ? value(searchTerm) : value;
        if (onSearchChange) {
            onSearchChange(newValue);
        } else {
            setInternalSearchTerm(newValue);
        }
    };
    
    const filterSupplierStatus = externalFilterSupplierStatus ?? internalFilterSupplierStatus;
    const setFilterSupplierStatus = (value: 'all' | 'hasInvoice' | 'noInvoice' | ((prev: 'all' | 'hasInvoice' | 'noInvoice') => 'all' | 'hasInvoice' | 'noInvoice')) => {
        const newValue = typeof value === 'function' ? value(filterSupplierStatus) : value;
        if (onFilterSupplierStatusChange) {
            onFilterSupplierStatusChange(newValue);
        } else {
            setInternalFilterSupplierStatus(newValue);
        }
    };
    
    const [selectedDetail, setSelectedDetail] = useState<SupplierDetailModalData | null>(null);
    const latestPersistedSignatureRef = useRef('');
    const [localMatchedMap, setLocalMatchedMap] = useState<Map<number, SaveInvoiceReconciliationItemRequest>>(new Map());
    const matchedInvoiceKeySet = matchedInvoiceNumbers ?? EMPTY_MATCHED_INVOICE_SET;
    const matchedHistoryMap = useMemo(() => {
        const map = new Map<number, ApiInvoiceReconciliationRecord>();
        (matchedReconciliations || []).forEach((record) => {
            if (!record || record.orderHistoryId <= 0) return;
            const existing = map.get(record.orderHistoryId);
            if (!existing) {
                map.set(record.orderHistoryId, record);
                return;
            }
            const existingTime = new Date(existing.matchedAt).getTime();
            const nextTime = new Date(record.matchedAt).getTime();
            if (nextTime > existingTime) {
                map.set(record.orderHistoryId, record);
            }
        });
        return map;
    }, [matchedReconciliations]);
    const invoiceRowById = useMemo(() => {
        const map = new Map<number, HoaDonUBot>();
        hoaDons.forEach((hoaDon) => {
            map.set(hoaDon.id, hoaDon);
        });
        return map;
    }, [hoaDons]);

    const resolveInvoiceLine = (invoiceNumber?: string | null, invoiceRowId?: number | null): HoaDonUBot | undefined => {
        if (invoiceRowId) {
            const byId = invoiceRowById.get(invoiceRowId);
            if (byId) return byId;
        }

        const invoiceKey = normalizeInvoiceKey(invoiceNumber);
        if (!invoiceKey) return undefined;

        for (const hoaDon of hoaDons) {
            const numberKey = normalizeInvoiceKey(getInvoiceNumber(hoaDon));
            const idKey = normalizeInvoiceKey(hoaDon.idHoaDon);
            if (numberKey === invoiceKey || idKey === invoiceKey) {
                return hoaDon;
            }
        }

        return undefined;
    };

    const eligibleHoaDons = useMemo(() => {
        if (matchedInvoiceKeySet.size === 0) return hoaDons;
        return hoaDons.filter((hoaDon) => {
            const numberKey = normalizeInvoiceKey(getInvoiceNumber(hoaDon));
            const idKey = normalizeInvoiceKey(hoaDon.idHoaDon);
            return !(numberKey && matchedInvoiceKeySet.has(numberKey)) && !(idKey && matchedInvoiceKeySet.has(idKey));
        });
    }, [hoaDons, matchedInvoiceKeySet]);

    const invoiceDocumentsBySupplier = useMemo(() => {
        const grouped: Record<string, Record<string, InvoiceDocument>> = {};

        eligibleHoaDons.forEach((hoaDon) => {
            const primarySupplierKey = getInvoiceSupplierKey(hoaDon);
            const nameSupplierKey = normalize(hoaDon.congTy);
            const supplierKeys = Array.from(new Set([primarySupplierKey, nameSupplierKey].filter(Boolean)));
            const invoiceNumberRaw = getInvoiceNumber(hoaDon);
            const invoiceNumberKey = normalize(invoiceNumberRaw);

            supplierKeys.forEach((supplierKey) => {
                if (!grouped[supplierKey]) grouped[supplierKey] = {};
                if (!grouped[supplierKey][invoiceNumberKey]) {
                    grouped[supplierKey][invoiceNumberKey] = {
                        supplierKey,
                        invoiceNumber: invoiceNumberRaw,
                        invoiceDate: parseDate(hoaDon.ngayHoaDon),
                        lines: [],
                    };
                }

                grouped[supplierKey][invoiceNumberKey].lines.push({
                    codeKey: normalize(hoaDon.maHangHoa),
                    nameKey: normalize(hoaDon.tenHangHoa),
                    unitKey: normalize(hoaDon.donViTinh),
                    invoiceDate: parseDate(hoaDon.ngayHoaDon),
                    data: hoaDon,
                });
            });
        });

        const result: Record<string, InvoiceDocument[]> = {};
        Object.entries(grouped).forEach(([supplierKey, docs]) => {
            result[supplierKey] = Object.values(docs).map((doc) => ({
                ...doc,
                lines: [...doc.lines].sort((a, b) => (a.data.sttDongHang || 0) - (b.data.sttDongHang || 0)),
            }));
        });

        return result;
    }, [eligibleHoaDons]);

    const bestInvoiceDocumentByBatch = useMemo(() => {
        const emailSentOrders = orders.filter((o) => o.emailSent === true);

        const batchesByKey: Record<string, {
            batchKey: string;
            supplierKey: string;
            fallbackKey: string;
            orders: OrderHistory[];
        }> = {};

        emailSentOrders.forEach((order) => {
            const batchKey = getOrderBatchKey(order);
            if (!batchesByKey[batchKey]) {
                batchesByKey[batchKey] = {
                    batchKey,
                    supplierKey: getOrderSupplierKey(order),
                    fallbackKey: getOrderSupplierFallbackKey(order),
                    orders: [],
                };
            }
            batchesByKey[batchKey].orders.push(order);
        });

        const batchesBySupplier: Record<string, typeof batchesByKey[string][]> = {};
        Object.values(batchesByKey).forEach((batch) => {
            if (!batchesBySupplier[batch.supplierKey]) batchesBySupplier[batch.supplierKey] = [];
            batchesBySupplier[batch.supplierKey].push(batch);
        });

        const result: Record<string, InvoiceDocument | undefined> = {};

        Object.entries(batchesBySupplier).forEach(([supplierKey, supplierBatches]) => {
            const docsByPrimaryKey = invoiceDocumentsBySupplier[supplierKey] || [];
            const fallbackDocs = supplierBatches.flatMap((batch) => {
                if (batch.fallbackKey === supplierKey) return [] as InvoiceDocument[];
                return invoiceDocumentsBySupplier[batch.fallbackKey] || [];
            });
            const uniqueDocs = deduplicateInvoiceDocuments([...docsByPrimaryKey, ...fallbackDocs]);

            if (uniqueDocs.length === 0) {
                supplierBatches.forEach((batch) => {
                    result[batch.batchKey] = undefined;
                });
                return;
            }

            type BatchDocScore = {
                batchKey: string;
                docKey: string;
                doc: InvoiceDocument;
                matchedCount: number;
                totalScore: number;
                isFullExactMatch: boolean;
            };

            const scores: BatchDocScore[] = [];
            const fullyMatchedAndLockedDocKeys = new Set<string>();

            supplierBatches.forEach((batch) => {
                const availableDocs = uniqueDocs.filter(
                    (doc) => !fullyMatchedAndLockedDocKeys.has(getInvoiceDocumentUniqueKey(doc)),
                );
                const candidateDocs = selectCandidateDocsForBatch(batch.orders, availableDocs);
                candidateDocs.forEach((doc) => {
                    const evalDoc = evaluateInvoiceDocument(batch.orders, doc);
                    if (evalDoc.matchedCount <= 0 || evalDoc.totalScore <= 0) return;
                    scores.push({
                        batchKey: batch.batchKey,
                        docKey: getInvoiceDocumentUniqueKey(doc),
                        doc,
                        matchedCount: evalDoc.matchedCount,
                        totalScore: evalDoc.totalScore,
                        isFullExactMatch: evalDoc.isFullExactMatch,
                    });
                });
            });

            scores.sort((a, b) => {
                if (a.isFullExactMatch !== b.isFullExactMatch) {
                    return a.isFullExactMatch ? -1 : 1;
                }
                if (b.matchedCount !== a.matchedCount) return b.matchedCount - a.matchedCount;
                return b.totalScore - a.totalScore;
            });

            const usedBatchKeys = new Set<string>();
            const usedDocKeys = new Set<string>();

            scores.forEach((entry) => {
                if (usedBatchKeys.has(entry.batchKey)) return;
                if (usedDocKeys.has(entry.docKey)) return;
                result[entry.batchKey] = entry.doc;
                usedBatchKeys.add(entry.batchKey);
                usedDocKeys.add(entry.docKey);

                // Once a document is exact 100% matched for a batch, lock and skip it for later comparisons.
                if (entry.isFullExactMatch) {
                    fullyMatchedAndLockedDocKeys.add(entry.docKey);
                }
            });

            supplierBatches.forEach((batch) => {
                if (!(batch.batchKey in result)) result[batch.batchKey] = undefined;
            });
        });

        return result;
    }, [orders, invoiceDocumentsBySupplier]);

    const reconciliations = useMemo((): ReconciliationResult[] => {
        const emailSentOrders = orders.filter((o) => o.emailSent === true);
        const usedInvoiceRowsByBatch = new Map<string, Set<number>>();

        return emailSentOrders.map((order) => {
            const localRecord = localMatchedMap.get(Number(order.id));
            if (localRecord) {
                const invoiceFromLocal = resolveInvoiceLine(localRecord.invoiceNumber, localRecord.invoiceRowId);
                return {
                    order,
                    invoice: invoiceFromLocal,
                    hasInvoice: true,
                    quantityDiff: localRecord.quantityDiff,
                    detailStatus: coerceDetailStatus(localRecord.detailStatus),
                    detailNote: localRecord.detailNote,
                    matchScore: localRecord.matchScore,
                    matchedInvoiceNumber: localRecord.invoiceNumber,
                    isFromHistory: true,
                };
            }

            const historyRecord = matchedHistoryMap.get(Number(order.id));
            if (historyRecord) {
                const invoiceFromHistory = resolveInvoiceLine(historyRecord.invoiceNumber, historyRecord.invoiceRowId);
                return {
                    order,
                    invoice: invoiceFromHistory,
                    hasInvoice: true,
                    quantityDiff: historyRecord.quantityDiff,
                    detailStatus: coerceDetailStatus(historyRecord.detailStatus),
                    detailNote: historyRecord.detailNote,
                    matchScore: historyRecord.matchScore,
                    matchedInvoiceNumber: historyRecord.invoiceNumber,
                    isFromHistory: true,
                };
            }

            const batchKey = getOrderBatchKey(order);
            const selectedDoc = bestInvoiceDocumentByBatch[batchKey];
            const candidates = selectedDoc?.lines || [];

            if (candidates.length === 0) {
                return {
                    order,
                    hasInvoice: false,
                    detailStatus: 'no-invoice',
                };
            }

            if (!usedInvoiceRowsByBatch.has(batchKey)) {
                usedInvoiceRowsByBatch.set(batchKey, new Set<number>());
            }
            const usedRows = usedInvoiceRowsByBatch.get(batchKey)!;

            let bestCandidate: InvoiceLine | undefined;
            let bestScore = -1;

            candidates.forEach((candidate) => {
                if (usedRows.has(candidate.data.id)) return;
                const score = scoreOrderWithInvoiceLine(order, candidate);
                if (score > bestScore) {
                    bestScore = score;
                    bestCandidate = candidate;
                }
            });

            if (!bestCandidate || bestScore < 40) {
                return {
                    order,
                    hasInvoice: false,
                    detailStatus: 'no-invoice',
                    matchScore: Number(bestScore.toFixed(2)),
                    matchedInvoiceNumber: selectedDoc?.invoiceNumber,
                };
            }

            usedRows.add(bestCandidate.data.id);
            const quantityDiff = Number((Number(bestCandidate.data.soLuong) - Number(order.dotGoiHang)).toFixed(3));

            const orderCodeKeys = getOrderCodeKeys(order);
            const orderName = normalize(order.tenVtytBv);
            const invoiceHasCode = !!bestCandidate.codeKey;
            const codeMatched = !!bestCandidate.codeKey && orderCodeKeys.includes(bestCandidate.codeKey);
            const nameMatchedExact = !!(orderName && bestCandidate.nameKey && orderName === bestCandidate.nameKey);
            const materialMatched = invoiceHasCode ? codeMatched : nameMatchedExact;

            let detailStatus: DetailStatus = 'matched';
            let detailNote = 'Khớp vật tư và số lượng';

            if (!materialMatched) {
                detailStatus = 'material-mismatch';
                detailNote = invoiceHasCode
                    ? 'Mã hàng hóa hóa đơn chưa khớp Mã QL'
                    : 'Tên vật tư chưa trùng khớp 100%';
            } else if (quantityDiff < 0) {
                detailStatus = 'shortage';
                detailNote = `Thiếu ${Math.abs(quantityDiff)} so với số lượng đặt`;
            } else if (quantityDiff > 0) {
                detailStatus = 'surplus';
                detailNote = `Thừa ${quantityDiff} so với số lượng đặt`;
            } else if (codeMatched || nameMatchedExact) {
                detailStatus = 'matched';
                detailNote = 'Đã khớp hoàn toàn';
            } else {
                detailStatus = 'enough';
                detailNote = 'Đủ số lượng, vật tư khớp theo tên';
            }

            return {
                order,
                invoice: bestCandidate.data,
                hasInvoice: true,
                quantityDiff,
                detailStatus,
                detailNote,
                matchScore: Number(bestScore.toFixed(2)),
                matchedInvoiceNumber: selectedDoc?.invoiceNumber,
            };
        });
    }, [orders, bestInvoiceDocumentByBatch, matchedHistoryMap, localMatchedMap, hoaDons, invoiceRowById]);

    const reconciliationPayloadItems = useMemo(() => {
        return reconciliations
            .filter((item) => !item.isFromHistory && item.hasInvoice && !!item.matchedInvoiceNumber)
            .map((item) => ({
                orderHistoryId: Number(item.order.id),
                orderBatchKey: getOrderBatchKey(item.order),
                companyContactId: item.order.companyContactId,
                nhaThau: item.order.nhaThau,
                maQuanLy: item.order.maQuanLy,
                maVtytCu: item.order.maVtytCu,
                tenVtytBv: item.order.tenVtytBv,
                orderedQty: Number(item.order.dotGoiHang) || 0,
                orderTime: item.order.ngayDatHang ? new Date(item.order.ngayDatHang).toISOString() : undefined,
                invoiceNumber: item.matchedInvoiceNumber as string,
                invoiceIdHoaDon: item.invoice?.idHoaDon,
                invoiceRowId: item.invoice?.id,
                invoiceCompanyContactId: item.invoice?.companyContactId,
                invoiceCompanyName: item.invoice?.congTy,
                invoiceItemCode: item.invoice?.maHangHoa,
                invoiceItemName: item.invoice?.tenHangHoa,
                invoiceQty: Number(item.invoice?.soLuong) || 0,
                invoiceTime: item.invoice?.ngayHoaDon ? new Date(item.invoice.ngayHoaDon).toISOString() : undefined,
                hasInvoice: item.hasInvoice,
                detailStatus: item.detailStatus,
                detailNote: item.detailNote,
                matchScore: Number(item.matchScore) || 0,
                quantityDiff: Number(item.quantityDiff) || 0,
                matchedAt: new Date().toISOString(),
            }))
            .filter((item) => item.orderHistoryId > 0 && item.invoiceNumber.trim().length > 0)
            .sort((a, b) => {
                if (a.orderHistoryId !== b.orderHistoryId) return a.orderHistoryId - b.orderHistoryId;
                return a.invoiceNumber.localeCompare(b.invoiceNumber);
            });
    }, [reconciliations]);

    useEffect(() => {
        if (reconciliationPayloadItems.length === 0) {
            latestPersistedSignatureRef.current = '';
            return;
        }

        const signature = JSON.stringify(reconciliationPayloadItems.map((item) => ({
            orderHistoryId: item.orderHistoryId,
            orderBatchKey: item.orderBatchKey,
            invoiceNumber: item.invoiceNumber,
            hasInvoice: item.hasInvoice,
            detailStatus: item.detailStatus,
            matchScore: item.matchScore,
            quantityDiff: item.quantityDiff,
            invoiceRowId: item.invoiceRowId,
        })));

        if (signature === latestPersistedSignatureRef.current) {
            return;
        }

        latestPersistedSignatureRef.current = signature;

        void apiService.saveInvoiceReconciliationsBulk({
            items: reconciliationPayloadItems,
        })
            .then(() => {
                if (reconciliationPayloadItems.length > 0) {
                    setLocalMatchedMap((prev) => {
                        const next = new Map(prev);
                        reconciliationPayloadItems.forEach((item) => {
                            next.set(item.orderHistoryId, item);
                        });
                        return next;
                    });
                }
                if (onMatchedInvoicesSaved) {
                    const uniqueNumbers = Array.from(new Set(reconciliationPayloadItems.map((item) => item.invoiceNumber)));
                    onMatchedInvoicesSaved(uniqueNumbers);
                }
            })
            .catch((error) => {
                console.error('Khong luu duoc lich su doi chieu hoa don:', error);
                latestPersistedSignatureRef.current = '';
            });
    }, [reconciliationPayloadItems, onMatchedInvoicesSaved]);

    const supplierGroups = useMemo(() => {
        let filtered = reconciliations;

        // Filter by search term
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            filtered = filtered.filter(r =>
                r.order.maQuanLy.toLowerCase().includes(term) ||
                r.order.tenVtytBv.toLowerCase().includes(term) ||
                r.order.nhaThau.toLowerCase().includes(term) ||
                (r.invoice?.soHoaDon || r.matchedInvoiceNumber || '').toLowerCase().includes(term)
            );
        }

        const groups: { [key: string]: ReconciliationResult[] } = {};
        filtered.forEach(r => {
            const batchKey = getOrderBatchKey(r.order);
            if (!groups[batchKey]) {
                groups[batchKey] = [];
            }
            groups[batchKey].push(r);
        });

        return Object.entries(groups).map(([batchKey, results]): SupplierGroup => {
            const sampleOrder = results[0]?.order;
            const nhaThau = sampleOrder?.nhaThau || 'N/A';
            const batchTime = String(sampleOrder?.ngayDatHang || '');
            const hasInvoiceCount = results.filter(r => r.hasInvoice).length;
            const matchedInvoiceNumbers = Array.from(
                new Set(
                    results
                        .filter((r) => r.hasInvoice && r.matchedInvoiceNumber)
                        .map((r) => r.matchedInvoiceNumber as string),
                ),
            );
            return {
                groupId: batchKey,
                batchKey,
                batchTime,
                nhaThau,
                results,
                latestDate: new Date(Math.max(...results.map(r => new Date(r.order.ngayDatHang).getTime()))),
                stats: {
                    hasInvoice: hasInvoiceCount,
                    noInvoice: results.filter(r => !r.hasInvoice).length,
                    matchedInvoiceNumber: matchedInvoiceNumbers.length === 1
                        ? matchedInvoiceNumbers[0]
                        : (matchedInvoiceNumbers.length > 1 ? `${matchedInvoiceNumbers.length} hóa đơn` : undefined),
                    matchedInvoiceLineCount: undefined,
                },
            };
        }).filter((group) => {
            if (filterSupplierStatus === 'hasInvoice') {
                return group.stats.hasInvoice > 0;
            } else if (filterSupplierStatus === 'noInvoice') {
                return group.stats.hasInvoice === 0;
            }
            return true;
        }).sort((a, b) => {
            const aHas = a.stats.hasInvoice > 0 ? 1 : 0;
            const bHas = b.stats.hasInvoice > 0 ? 1 : 0;
            if (aHas !== bHas) return aHas - bHas;
            return b.latestDate.getTime() - a.latestDate.getTime();
        });
    }, [reconciliations, searchTerm, filterSupplierStatus]);

    const toggleExpand = (groupId: string) => {
        setExpandedSuppliers(prev => {
            const newSet = new Set(prev);
            if (newSet.has(groupId)) {
                newSet.delete(groupId);
            } else {
                newSet.add(groupId);
            }
            return newSet;
        });
    };

    const getResultKey = (result: ReconciliationResult) => `${result.order.id}-${result.invoice?.id || 'no-invoice'}`;

    const formatDate = (date: string | Date) => {
        return new Date(date).toLocaleDateString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
        });
    };

    const formatDateTime = (date: string | Date) => {
        return new Date(date).toLocaleString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false,
        });
    };

    const formatTime = (date: string | Date) => {
        return new Date(date).toLocaleTimeString('vi-VN', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false,
        });
    };

    const getDetailCategory = (status: DetailStatus): { label: string; className: string } => {
        if (status === 'matched' || status === 'enough') {
            return { label: 'Khớp', className: 'bg-emerald-100 text-emerald-700 border-emerald-300' };
        } else if (status === 'no-invoice') {
            return { label: 'Chưa có HĐ', className: 'bg-red-100 text-red-700 border-red-300' };
        } else if (status === 'shortage' || status === 'surplus' || status === 'material-mismatch') {
            return { label: 'Thiếu', className: 'bg-amber-100 text-amber-700 border-amber-300' };
        }
        return { label: 'Khớp', className: 'bg-gray-100 text-gray-700 border-gray-300' };
    };

    const openSupplierDetail = (group: SupplierGroup) => {
        const batchKeys = Array.from(new Set(group.results.map((item) => getOrderBatchKey(item.order))));
        const docs = batchKeys
            .map((batchKey) => bestInvoiceDocumentByBatch[batchKey])
            .filter((doc): doc is InvoiceDocument => !!doc);

        const invoiceMap = new Map<number, HoaDonUBot>();
        docs.forEach((doc) => {
            doc.lines.forEach((line) => {
                invoiceMap.set(line.data.id, line.data);
            });
        });

        const historyInvoiceNumbers = Array.from(new Set(
            group.results
                .map((item) => item.matchedInvoiceNumber)
                .filter(Boolean) as string[],
        ));
        const historyInvoiceKeys = historyInvoiceNumbers
            .map((value) => normalizeInvoiceKey(value))
            .filter(Boolean);
        const historyInvoiceKeySet = new Set(historyInvoiceKeys);

        if (historyInvoiceKeySet.size > 0) {
            hoaDons.forEach((hoaDon) => {
                const numberKey = normalizeInvoiceKey(getInvoiceNumber(hoaDon));
                const idKey = normalizeInvoiceKey(hoaDon.idHoaDon);
                if (historyInvoiceKeySet.has(numberKey) || historyInvoiceKeySet.has(idKey)) {
                    invoiceMap.set(hoaDon.id, hoaDon);
                }
            });
        }

        const supplierInvoices = Array.from(invoiceMap.values()).sort((a, b) => {
            const dateA = new Date(a.ngayHoaDon).getTime();
            const dateB = new Date(b.ngayHoaDon).getTime();
            if (dateA !== dateB) return dateB - dateA;
            return (a.sttDongHang || 0) - (b.sttDongHang || 0);
        });

        const matchedNumbers = Array.from(new Set([
            ...docs.map((doc) => doc.invoiceNumber),
            ...historyInvoiceNumbers,
        ])).filter(Boolean);

        setSelectedDetail({
            supplierName: group.nhaThau,
            orderItems: group.results,
            invoiceItems: supplierInvoices,
            selectedInvoiceNumber: matchedNumbers.length === 1 ? matchedNumbers[0] : undefined,
        });
    };

    const totalStats = useMemo(() => {
        return supplierGroups.reduce((acc, group) => ({
            hasInvoice: acc.hasInvoice + group.stats.hasInvoice,
            noInvoice: acc.noInvoice + group.stats.noInvoice,
        }), { hasInvoice: 0, noInvoice: 0 });
    }, [supplierGroups]);

    const detailOrderTotalQuantity = useMemo(() => {
        if (!selectedDetail) return 0;
        return selectedDetail.orderItems.reduce((sum, item) => sum + Number(item.order.dotGoiHang || 0), 0);
    }, [selectedDetail]);

    const detailInvoiceTotalQuantity = useMemo(() => {
        if (!selectedDetail) return 0;
        return selectedDetail.invoiceItems.reduce((sum, item) => sum + Number(item.soLuong || 0), 0);
    }, [selectedDetail]);

    const matchedOrderItems = useMemo(() => {
        if (!selectedDetail) return [] as ReconciliationResult[];
        return selectedDetail.orderItems.filter((item) => item.hasInvoice && (item.detailStatus === 'matched' || item.detailStatus === 'enough'));
    }, [selectedDetail]);

    const quantityMismatchOrderItems = useMemo(() => {
        if (!selectedDetail) return [] as ReconciliationResult[];
        return selectedDetail.orderItems.filter(
            (item) => item.hasInvoice && (item.detailStatus === 'shortage' || item.detailStatus === 'surplus' || item.detailStatus === 'material-mismatch'),
        );
    }, [selectedDetail]);

    const materialMissingOrderItems = useMemo(() => {
        if (!selectedDetail) return [] as ReconciliationResult[];
        return selectedDetail.orderItems.filter((item) => !item.hasInvoice);
    }, [selectedDetail]);

    const usedInvoiceIdSet = useMemo(() => {
        const ids = new Set<number>();
        if (!selectedDetail) return ids;
        selectedDetail.orderItems.forEach((item) => {
            if (item.invoice?.id) ids.add(item.invoice.id);
        });
        return ids;
    }, [selectedDetail]);

    const materialMissingInvoiceItems = useMemo(() => {
        if (!selectedDetail) return [] as HoaDonUBot[];
        return selectedDetail.invoiceItems.filter(
            (line) => !usedInvoiceIdSet.has(line.id),
        );
    }, [selectedDetail, usedInvoiceIdSet]);

    const redRows = useMemo((): ModalPairRow[] => {
        const maxLen = Math.max(materialMissingOrderItems.length, materialMissingInvoiceItems.length);
        return Array.from({ length: maxLen }).map((_, idx) => ({
            left: materialMissingOrderItems[idx],
            right: materialMissingInvoiceItems[idx],
        }));
    }, [materialMissingOrderItems, materialMissingInvoiceItems]);

    const yellowRows = useMemo((): ModalPairRow[] => {
        return quantityMismatchOrderItems.map((item) => ({
            left: item,
            right: item.invoice,
        }));
    }, [quantityMismatchOrderItems]);

    const greenRows = useMemo((): ModalPairRow[] => {
        return matchedOrderItems.map((item) => ({
            left: item,
            right: item.invoice,
        }));
    }, [matchedOrderItems]);

    const selectedInvoiceNumberInModal = useMemo(() => {
        if (!selectedDetail) return '';
        if (selectedDetail.selectedInvoiceNumber) return selectedDetail.selectedInvoiceNumber;
        if (selectedDetail.invoiceItems.length === 0) return '';
        return getInvoiceNumber(selectedDetail.invoiceItems[0]);
    }, [selectedDetail]);

    const selectedInvoiceLookupLink = useMemo(() => {
        if (!selectedDetail) return '';
        const found = selectedDetail.invoiceItems.find((item) => (item.linkTraCuuHoaDon || '').trim().length > 0);
        return found?.linkTraCuuHoaDon || '';
    }, [selectedDetail]);

    const showRedSection = redRows.length > 0;
    const showYellowSection = yellowRows.length > 0;
    const showGreenSection = greenRows.length > 0;

    return (
        <div className="space-y-4">
            {/* Search & Filter */}
            <div className="space-y-3">
                <Input
                    placeholder="Tìm theo mã đơn, tên vật tư, nhà thầu, mã hóa đơn..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-muted-foreground">Lọc theo HĐ:</span>
                    <button
                        type="button"
                        onClick={() => setFilterSupplierStatus('all')}
                        className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                            filterSupplierStatus === 'all'
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted text-muted-foreground hover:bg-muted/80'
                        }`}
                    >
                        Tất cả
                    </button>
                    <button
                        type="button"
                        onClick={() => setFilterSupplierStatus('noInvoice')}
                        className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                            filterSupplierStatus === 'noInvoice'
                                ? 'bg-red-600 text-white'
                                : 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200'
                        }`}
                    >
                        Chưa có HĐ
                    </button>
                    <button
                        type="button"
                        onClick={() => setFilterSupplierStatus('hasInvoice')}
                        className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                            filterSupplierStatus === 'hasInvoice'
                                ? 'bg-green-600 text-white'
                                : 'bg-green-50 text-green-700 hover:bg-green-100 border border-green-200'
                        }`}
                    >
                        Đã có HĐ
                    </button>
                </div>
            </div>

            <div className="rounded-md border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">
                <div className="flex flex-wrap items-center gap-3">
                    <span className="font-medium">Ghi chú nhanh:</span>
                    <span className="inline-flex items-center gap-1 rounded border border-green-300 bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
                        Khớp
                    </span>
                    <span className="text-xs">= đúng mã vật tư + đúng số lượng</span>
                    <span className="inline-flex items-center gap-1 rounded border border-blue-300 bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800">
                        Đủ
                    </span>
                    <span className="text-xs">= đủ số lượng, vật tư khớp theo tên (chưa chắc đúng mã)</span>
                </div>
            </div>

            {/* Table */}
            <div className="rounded-md border border-border overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full" style={{ tableLayout: 'fixed' }}>
                        <colgroup>
                            <col style={{ width: '44px' }} />
                            <col />
                            <col style={{ width: '130px' }} />
                            <col style={{ width: '150px' }} />
                            <col style={{ width: '170px' }} />
                            <col style={{ width: '250px' }} />
                        </colgroup>
                        <thead className="bg-primary text-primary-foreground">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium"></th>
                                <th className="px-4 py-3 text-left text-xs font-medium">Nhà Thầu</th>
                                <th className="px-4 py-3 text-center text-xs font-medium">Số vật tư đối chiếu</th>
                                <th className="px-4 py-3 text-center text-xs font-medium">Lần đặt gần nhất</th>
                                <th className="px-4 py-3 text-center text-xs font-medium">Tổng quan</th>
                                <th className="px-4 py-3 text-center text-xs font-medium">Trạng thái hóa đơn</th>
                            </tr>
                        </thead>
                        <tbody>
                            {supplierGroups.map((group) => {
                                const isExpanded = expandedSuppliers.has(group.groupId);

                                return (
                                    <React.Fragment key={group.groupId}>
                                        {/* Dòng nhà thầu */}
                                        <tr
                                            className="border-b border-border bg-muted/30 hover:bg-muted/50 cursor-pointer transition-colors"
                                            onClick={() => toggleExpand(group.groupId)}
                                        >
                                            <td className="px-4 py-3">
                                                <div className="flex items-center justify-center text-muted-foreground">
                                                    {isExpanded ? (
                                                        <ChevronDown className="w-4 h-4" />
                                                    ) : (
                                                        <ChevronRight className="w-4 h-4" />
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex flex-col gap-1">
                                                    <div className="flex items-center gap-2">
                                                        <Building2 className="w-4 h-4 text-primary" />
                                                        <span className="font-medium text-sm text-foreground">{group.nhaThau}</span>
                                                    </div>
                                                    <span className="text-[11px] text-muted-foreground">
                                                        Đơn theo thời điểm: {group.batchTime ? formatDateTime(group.batchTime) : 'N/A'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                                    <Package className="w-3 h-3 mr-1" />
                                                    {group.results.length}
                                                </Badge>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <div className="inline-flex flex-col items-center gap-1">
                                                    <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
                                                        <Calendar className="w-3 h-3 mr-1" />
                                                        {formatDate(group.latestDate)}
                                                    </Badge>
                                                    <span className="text-[11px] text-muted-foreground">{formatTime(group.latestDate)}</span>
                                                    <span className="text-[10px] text-muted-foreground">mới nhất</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <div className="inline-flex flex-col items-center gap-1">
                                                    <Badge variant="outline" className="bg-slate-50 text-slate-700 border-slate-200">
                                                        Có HĐ: {group.stats.hasInvoice}/{group.results.length}
                                                    </Badge>
                                                    {group.stats.matchedInvoiceNumber ? (
                                                        <span className="text-[11px] text-muted-foreground">
                                                            HĐ khớp: <span className="font-mono">{group.stats.matchedInvoiceNumber}</span>
                                                        </span>
                                                    ) : (
                                                        <span className="text-[11px] text-muted-foreground">So khớp theo vật tư đã gửi email</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                {group.stats.hasInvoice > 0 ? (
                                                    <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300 font-semibold">
                                                        Đã có
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="outline" className="bg-red-100 text-red-700 border-red-300 font-semibold">
                                                        Chưa có
                                                    </Badge>
                                                )}
                                            </td>
                                        </tr>

                                        {/* Chi tiết */}
                                        {isExpanded && (
                                            <tr>
                                                <td colSpan={6} className="p-0">
                                                    <div className="bg-background border-l-4 border-blue-400 overflow-x-auto">
                                                        <div className="flex justify-end px-3 py-2 border-b border-blue-100 bg-blue-50/30">
                                                            {group.stats.hasInvoice > 0 ? (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => openSupplierDetail(group)}
                                                                    className="text-xs font-semibold text-blue-700 hover:text-blue-900 underline underline-offset-2"
                                                                >
                                                                    Chi tiết
                                                                </button>
                                                            ) : (
                                                                <span className="text-xs text-muted-foreground">Không có hóa đơn để xem chi tiết</span>
                                                            )}
                                                        </div>
                                                        <table className="w-full min-w-[1500px]" style={{ tableLayout: 'fixed' }}>
                                                            <colgroup>
                                                                <col style={{ width: '130px' }} />
                                                                <col style={{ width: '280px' }} />
                                                                <col style={{ width: '140px' }} />
                                                                <col style={{ width: '130px' }} />
                                                                <col style={{ width: '140px' }} />
                                                                <col style={{ width: '200px' }} />
                                                                <col style={{ width: '220px' }} />
                                                            </colgroup>
                                                            <thead className="bg-blue-50 border-b border-blue-200">
                                                                <tr className="text-xs">
                                                                    <th className="px-3 py-2 text-left font-medium text-muted-foreground">Mã QL</th>
                                                                    <th className="px-3 py-2 text-left font-medium text-muted-foreground">Tên vật tư</th>
                                                                    <th className="px-3 py-2 text-center font-medium text-muted-foreground">SL đặt</th>
                                                                    <th className="px-3 py-2 text-center font-medium text-muted-foreground">SL HĐ</th>
                                                                    <th className="px-3 py-2 text-center font-medium text-muted-foreground">Chênh lệch</th>
                                                                    <th className="px-3 py-2 text-center font-medium text-muted-foreground">Kết luận chi tiết</th>
                                                                    <th className="px-3 py-2 text-center font-medium text-muted-foreground">Ngày đặt</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {group.results.map((result) => {
                                                                    const detailKey = getResultKey(result);
                                                                    return (
                                                                        <React.Fragment key={detailKey}>
                                                                            <tr
                                                                                className={`border-b border-border/50 text-xs hover:bg-muted/30 ${
                                                                                    result.detailStatus === 'material-mismatch' || result.detailStatus === 'surplus'
                                                                                        ? 'bg-red-50/60'
                                                                                        : result.detailStatus === 'shortage' || result.detailStatus === 'no-invoice'
                                                                                            ? 'bg-amber-50/50'
                                                                                            : ''
                                                                                }`}
                                                                            >
                                                                                <td className="px-3 py-2">
                                                                                    <span className="font-mono text-xs truncate" title={result.order.maQuanLy}>
                                                                                        {result.order.maQuanLy}
                                                                                    </span>
                                                                                </td>
                                                                                <td className="px-3 py-2">
                                                                                    <div>
                                                                                        <div className="font-medium text-foreground truncate" title={result.order.tenVtytBv}>
                                                                                            {result.order.tenVtytBv}
                                                                                        </div>
                                                                                        <div className="text-[11px] text-muted-foreground truncate" title={`${result.order.hangSx} • ${result.order.quyCach}`}>
                                                                                            {result.order.hangSx} • {result.order.quyCach}
                                                                                        </div>
                                                                                    </div>
                                                                                </td>
                                                                                <td className="px-3 py-2 text-center">
                                                                                    <span className="font-semibold">
                                                                                        {result.order.dotGoiHang}
                                                                                    </span>
                                                                                    <span className="text-xs text-muted-foreground ml-1">
                                                                                        {result.order.donViTinh}
                                                                                    </span>
                                                                                </td>
                                                                                <td className="px-3 py-2 text-center">
                                                                                    {result.invoice ? (
                                                                                        <span className="font-semibold">
                                                                                            {result.invoice.soLuong}
                                                                                        </span>
                                                                                    ) : (
                                                                                        <span className="text-muted-foreground">—</span>
                                                                                    )}
                                                                                </td>
                                                                                <td className="px-3 py-2 text-center">
                                                                                    {result.quantityDiff !== undefined ? (
                                                                                        <span
                                                                                            className={`font-bold ${
                                                                                                result.quantityDiff > 0
                                                                                                    ? 'text-orange-600'
                                                                                                    : result.quantityDiff < 0
                                                                                                        ? 'text-red-600'
                                                                                                        : 'text-green-700'
                                                                                            }`}
                                                                                        >
                                                                                            {result.quantityDiff > 0 ? '+' : ''}
                                                                                            {result.quantityDiff}
                                                                                        </span>
                                                                                    ) : (
                                                                                        <span className="text-muted-foreground">—</span>
                                                                                    )}
                                                                                </td>
                                                                                <td className="px-3 py-2 text-center">
                                                                                    <div className="inline-flex flex-col items-center gap-1">
                                                                                        {(() => {
                                                                                            const category = getDetailCategory(result.detailStatus);
                                                                                            return (
                                                                                                <Badge variant="outline" className={`${category.className} text-[10px] whitespace-nowrap`}>
                                                                                                    {category.label}
                                                                                                </Badge>
                                                                                            );
                                                                                        })()}
                                                                                        {result.detailNote && (
                                                                                            <span className="text-[10px] text-muted-foreground max-w-[140px] leading-tight" title={result.detailNote}>
                                                                                                {result.detailNote}
                                                                                            </span>
                                                                                        )}
                                                                                    </div>
                                                                                </td>
                                                                                <td className="px-3 py-2 text-center whitespace-nowrap">
                                                                                    {formatDate(result.order.ngayDatHang)}
                                                                                </td>
                                                                            </tr>
                                                                        </React.Fragment>
                                                                    );
                                                                })}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            <Dialog open={!!selectedDetail} onOpenChange={(open) => { if (!open) setSelectedDetail(null); }}>
                {selectedDetail && (
                    <DialogContent className="w-[80vw] max-w-[80vw] max-h-[92vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>Chi tiết đối chiếu toàn bộ vật tư</DialogTitle>
                            <DialogDescription>
                                {selectedDetail.supplierName}
                                {selectedInvoiceNumberInModal ? ` • Hóa đơn khớp: ${selectedInvoiceNumberInModal}` : ''}
                                {' • Bên trái: Order History • Bên phải: Hóa đơn'}
                            </DialogDescription>
                        </DialogHeader>

                        <div className="rounded-lg border border-indigo-200 bg-indigo-50/40 px-4 py-3 text-sm">
                            <div className="flex flex-wrap items-center gap-3">
                                <span className="text-muted-foreground">Mã hóa đơn:</span>
                                <span className="font-mono font-semibold text-indigo-700">{selectedInvoiceNumberInModal || '—'}</span>
                                {selectedInvoiceLookupLink ? (
                                    <a
                                        href={selectedInvoiceLookupLink}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="text-indigo-700 font-medium hover:text-indigo-900 underline underline-offset-2"
                                    >
                                        Xem hóa đơn
                                    </a>
                                ) : (
                                    <span className="text-xs text-muted-foreground">Không có link tra cứu</span>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                            <div className="rounded-lg border border-blue-200 bg-blue-50/40 p-3">
                                <div className="text-muted-foreground">Tổng dòng Order History</div>
                                <div className="text-lg font-semibold text-blue-700">{selectedDetail.orderItems.length}</div>
                            </div>
                            <div className="rounded-lg border border-emerald-200 bg-emerald-50/40 p-3">
                                <div className="text-muted-foreground">Tổng SL Order History</div>
                                <div className="text-lg font-semibold text-emerald-700">{detailOrderTotalQuantity}</div>
                            </div>
                            <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-3">
                                <div className="text-muted-foreground">Tổng SL Hóa đơn</div>
                                <div className="text-lg font-semibold text-slate-700">{detailInvoiceTotalQuantity}</div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            {showRedSection && (
                            <div className="rounded-lg border border-red-300 bg-red-50/40 overflow-hidden">
                                <div className="px-3 py-2 text-sm font-semibold text-red-800 border-b border-red-200">
                                    Sai hoàn toàn vật tư (chỉ xuất hiện 1 bên)
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm" style={{ tableLayout: 'fixed' }}>
                                        <colgroup>
                                            <col style={{ width: '16.67%' }} />
                                            <col style={{ width: '16.67%' }} />
                                            <col style={{ width: '16.66%' }} />
                                            <col style={{ width: '16.67%' }} />
                                            <col style={{ width: '16.67%' }} />
                                            <col style={{ width: '16.66%' }} />
                                        </colgroup>
                                        <thead className="bg-red-100/50">
                                            <tr>
                                                <th className="px-3 py-2 text-left whitespace-nowrap">Mã QL</th>
                                                <th className="px-3 py-2 text-left whitespace-nowrap">Tên vật tư (Order)</th>
                                                <th className="px-3 py-2 text-center whitespace-nowrap border-r-4 border-red-400">SL đặt</th>
                                                <th className="px-3 py-2 text-left whitespace-nowrap border-l-4 border-red-400">Mã hàng hóa</th>
                                                <th className="px-3 py-2 text-left whitespace-nowrap">Tên vật tư (HĐ)</th>
                                                <th className="px-3 py-2 text-center whitespace-nowrap">SL HĐ</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {redRows.map((row, idx) => (
                                                <tr key={`red-row-${idx}`} className="border-t border-red-100 align-top">
                                                    <td className="px-3 py-2 font-mono bg-red-50/30">{row.left?.order.maQuanLy || '—'}</td>
                                                    <td className="px-3 py-2 bg-red-50/30">{row.left?.order.tenVtytBv || '—'}</td>
                                                    <td className="px-3 py-2 text-center font-semibold border-r-4 border-red-400 bg-red-50/30">{row.left ? row.left.order.dotGoiHang : '—'}</td>
                                                    <td className="px-3 py-2 font-mono border-l-4 border-red-400">{row.right?.maHangHoa || '—'}</td>
                                                    <td className="px-3 py-2">{row.right?.tenHangHoa || '—'}</td>
                                                    <td className="px-3 py-2 text-center font-semibold">{row.right ? row.right.soLuong : '—'}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                            )}

                            {showYellowSection && (
                            <div className="rounded-lg border border-amber-300 bg-amber-50/40 overflow-hidden">
                                <div className="px-3 py-2 text-sm font-semibold text-amber-800 border-b border-amber-200">
                                    Có ở cả 2 bên nhưng sai số lượng hoặc sai thông tin khớp
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm" style={{ tableLayout: 'fixed' }}>
                                        <colgroup>
                                            <col style={{ width: '16.67%' }} />
                                            <col style={{ width: '16.67%' }} />
                                            <col style={{ width: '16.66%' }} />
                                            <col style={{ width: '16.67%' }} />
                                            <col style={{ width: '16.67%' }} />
                                            <col style={{ width: '16.66%' }} />
                                        </colgroup>
                                        <thead className="bg-amber-100/50">
                                            <tr>
                                                <th className="px-3 py-2 text-left whitespace-nowrap">Mã QL</th>
                                                <th className="px-3 py-2 text-left whitespace-nowrap">Tên vật tư (Order)</th>
                                                <th className="px-3 py-2 text-center whitespace-nowrap border-r-4 border-amber-400">SL đặt</th>
                                                <th className="px-3 py-2 text-left whitespace-nowrap border-l-4 border-amber-400">Mã hàng hóa</th>
                                                <th className="px-3 py-2 text-left whitespace-nowrap">Tên vật tư (HĐ)</th>
                                                <th className="px-3 py-2 text-center whitespace-nowrap">SL HĐ</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {yellowRows.map((row, idx) => (
                                                <tr key={`yellow-row-${idx}`} className="border-t border-amber-100 align-top">
                                                    <td className="px-3 py-2 font-mono bg-amber-50/30">{row.left?.order.maQuanLy || '—'}</td>
                                                    <td className="px-3 py-2 bg-amber-50/30">{row.left?.order.tenVtytBv || '—'}</td>
                                                    <td className="px-3 py-2 text-center font-semibold border-r-4 border-amber-400 bg-amber-50/30">{row.left ? row.left.order.dotGoiHang : '—'}</td>
                                                    <td className="px-3 py-2 font-mono border-l-4 border-amber-400">{row.right?.maHangHoa || '—'}</td>
                                                    <td className="px-3 py-2">{row.right?.tenHangHoa || '—'}</td>
                                                    <td className="px-3 py-2 text-center font-semibold">{row.right ? row.right.soLuong : '—'}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                            )}

                            {showGreenSection && (
                            <div className="rounded-lg border border-emerald-300 bg-emerald-50/40 overflow-hidden">
                                <div className="px-3 py-2 text-sm font-semibold text-emerald-800 border-b border-emerald-200">
                                    Khớp (đã xử lý, có thể bỏ qua)
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm" style={{ tableLayout: 'fixed' }}>
                                        <colgroup>
                                            <col style={{ width: '16.67%' }} />
                                            <col style={{ width: '16.67%' }} />
                                            <col style={{ width: '16.66%' }} />
                                            <col style={{ width: '16.67%' }} />
                                            <col style={{ width: '16.67%' }} />
                                            <col style={{ width: '16.66%' }} />
                                        </colgroup>
                                        <thead className="bg-emerald-100/50">
                                            <tr>
                                                <th className="px-3 py-2 text-left whitespace-nowrap">Mã QL</th>
                                                <th className="px-3 py-2 text-left whitespace-nowrap">Tên vật tư (Order)</th>
                                                <th className="px-3 py-2 text-center whitespace-nowrap border-r-4 border-emerald-400">SL đặt</th>
                                                <th className="px-3 py-2 text-left whitespace-nowrap border-l-4 border-emerald-400">Mã hàng hóa</th>
                                                <th className="px-3 py-2 text-left whitespace-nowrap">Tên vật tư (HĐ)</th>
                                                <th className="px-3 py-2 text-center whitespace-nowrap">SL HĐ</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {greenRows.map((row, idx) => (
                                                <tr key={`green-row-${idx}`} className="border-t border-emerald-100 opacity-50 line-through decoration-slate-300 align-top">
                                                    <td className="px-3 py-2 font-mono bg-emerald-50/30">{row.left?.order.maQuanLy || '—'}</td>
                                                    <td className="px-3 py-2 bg-emerald-50/30">{row.left?.order.tenVtytBv || '—'}</td>
                                                    <td className="px-3 py-2 text-center font-semibold border-r-4 border-emerald-400 bg-emerald-50/30">{row.left ? row.left.order.dotGoiHang : '—'}</td>
                                                    <td className="px-3 py-2 font-mono border-l-4 border-emerald-400">{row.right?.maHangHoa || '—'}</td>
                                                    <td className="px-3 py-2">{row.right?.tenHangHoa || '—'}</td>
                                                    <td className="px-3 py-2 text-center font-semibold">{row.right ? row.right.soLuong : '—'}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                            )}
                        </div>
                    </DialogContent>
                )}
            </Dialog>

            {supplierGroups.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                    {searchTerm
                        ? 'Không tìm thấy kết quả'
                        : 'Chưa có đơn hàng nào được gửi email'}
                </div>
            )}

            <div className="flex items-center justify-between text-sm text-muted-foreground px-2">
                <div className="flex items-center gap-4">
                    <span>
                        <strong className="text-foreground">{supplierGroups.length}</strong> nhà thầu
                    </span>
                    <span>
                        <strong className="text-foreground">{reconciliations.length}</strong> dòng đối chiếu
                    </span>
                </div>
                <div className="flex items-center gap-4">
                    <span className="text-green-700">
                        Đã có HĐ: <strong>{totalStats.hasInvoice}</strong>
                    </span>
                    <span className="text-amber-700">
                        Chưa có HĐ: <strong>{totalStats.noInvoice}</strong>
                    </span>
                </div>
            </div>
        </div>
    );
}
