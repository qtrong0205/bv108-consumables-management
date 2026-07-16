import { useState, useEffect } from 'react';
import { apiService, ApiSupply, PaginationResponse, getNullableString, getNullableNumber } from '@/services/api';
import { MedicalSupply } from '@/types';

// Chuyển đổi API response sang định dạng MedicalSupply
const convertApiSupplyToMedicalSupply = (apiSupply: ApiSupply, index: number): MedicalSupply => {
	const legacyId = getNullableString(apiSupply.id);
	const typeName = getNullableString(apiSupply.typeName);
	const materialCode = String(apiSupply.materialCode || '').trim() || typeName || legacyId;
  // Tạo id unique từ nhiều trường để tránh trùng key
  const uniqueId = `${apiSupply.idx1}-${materialCode}-${index}`;
  return {
    id: uniqueId,
	maVtyt: materialCode,
	legacyId,
    tenVtyt: getNullableString(apiSupply.name),
    tenThuongMai: getNullableString(apiSupply.name),
    maHieu: getNullableString(apiSupply.maHieu),
	typeName,
    maNhom: getNullableString(apiSupply.idx2),
    tenNhom: getNullableString(apiSupply.groupName),
    quyCach: getNullableString(apiSupply.quyCach),
    nuocSanXuat: getNullableString(apiSupply.nuocSx),
    hangSanXuat: getNullableString(apiSupply.hangSx),
    donViTinh: getNullableString(apiSupply.unit),
    donGia: getNullableNumber(apiSupply.price),
    soLuongKeHoach: getNullableNumber(apiSupply.tongNhap),
    tongThau: getNullableString(apiSupply.tongThau),
    nhaThau: getNullableString(apiSupply.nhaCungCap),
    quyetDinh: getNullableString(apiSupply.thongTinThau),
    soLuongTon: apiSupply.tonCuoiKy,
    soLuongToiThieu: getNullableNumber(apiSupply.tonKhoMin),
    soLuongTieuHao: getNullableNumber(apiSupply.xuatTrongKy),
    nhapTrongKy: getNullableNumber(apiSupply.nhapTrongKy),
    tongNhap: getNullableNumber(apiSupply.tongNhap),
  };
};

export interface UseSuppliesResult {
  supplies: MedicalSupply[];
  loading: boolean;
  error: string | null;
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
  refetch: () => void;
}

const allSuppliesPageSize = 10000;

export const useSupplies = (initialPage: number = 1, initialPageSize: number = 20): UseSuppliesResult => {
  const [supplies, setSupplies] = useState<MedicalSupply[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(initialPage);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [refetchTrigger, setRefetchTrigger] = useState(0);

  useEffect(() => {
    const fetchSupplies = async () => {
      try {
        setLoading(true);
        setError(null);
        const response: PaginationResponse<ApiSupply> = await apiService.getSupplies(page, pageSize);
        const convertedSupplies = response.data.map((item, index) => convertApiSupplyToMedicalSupply(item, index));
        setSupplies(convertedSupplies);
        setTotal(response.total);
        setTotalPages(response.totalPages);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch supplies');
        setSupplies([]);
        setTotal(0);
        setTotalPages(0);
      } finally {
        setLoading(false);
      }
    };

    fetchSupplies();
  }, [page, pageSize, refetchTrigger]);

  const refetch = () => {
    setRefetchTrigger((prev) => prev + 1);
  };

  return {
    supplies,
    loading,
    error,
    page,
    pageSize,
    total,
    totalPages,
    setPage,
    setPageSize,
    refetch,
  };
};

export interface UseSupplySearchResult extends UseSuppliesResult {
  keyword: string;
  setKeyword: (keyword: string) => void;
}

export const useSupplySearch = (initialPageSize: number = 20): UseSupplySearchResult => {
  const [supplies, setSupplies] = useState<MedicalSupply[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [keyword, setKeyword] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [refetchTrigger, setRefetchTrigger] = useState(0);

  useEffect(() => {
    if (!keyword) {
      setSupplies([]);
      return;
    }

    const fetchSupplies = async () => {
      try {
        setLoading(true);
        setError(null);
        const response: PaginationResponse<ApiSupply> = await apiService.searchSupplies(keyword, page, pageSize);
        const convertedSupplies = response.data.map((item, index) => convertApiSupplyToMedicalSupply(item, index));
        setSupplies(convertedSupplies);
        setTotal(response.total);
        setTotalPages(response.totalPages);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to search supplies');
        setSupplies([]);
        setTotal(0);
        setTotalPages(0);
      } finally {
        setLoading(false);
      }
    };

    const timeoutId = setTimeout(fetchSupplies, 300); // Debounce tìm kiếm
    return () => clearTimeout(timeoutId);
  }, [keyword, page, pageSize, refetchTrigger]);

  const refetch = () => {
    setRefetchTrigger((prev) => prev + 1);
  };

  return {
    supplies,
    loading,
    error,
    keyword,
    setKeyword,
    page,
    pageSize,
    total,
    totalPages,
    setPage,
    setPageSize,
    refetch,
  };
};

export const useSupplyGroups = () => {
  const [groups, setGroups] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchGroups = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await apiService.getGroups();
        setGroups(response.groups);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch groups');
        setGroups([]);
      } finally {
        setLoading(false);
      }
    };

    fetchGroups();
  }, []);

  return { groups, loading, error };
};

export const useAllSupplies = (): Omit<UseSuppliesResult, 'page' | 'pageSize' | 'totalPages' | 'setPage' | 'setPageSize'> & {
  total: number;
} => {
  const [supplies, setSupplies] = useState<MedicalSupply[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [refetchTrigger, setRefetchTrigger] = useState(0);

  useEffect(() => {
    const fetchAllSupplies = async () => {
      try {
        setLoading(true);
        setError(null);

        const firstPage = await apiService.getSupplies(1, allSuppliesPageSize);
        const firstBatch = firstPage.data.map((item, index) =>
          convertApiSupplyToMedicalSupply(item, index),
        );

        if (firstPage.totalPages <= 1) {
          setSupplies(firstBatch);
          setTotal(firstPage.total);
          return;
        }

        const remainingResponses = await Promise.all(
          Array.from({ length: firstPage.totalPages - 1 }, (_, index) =>
            apiService.getSupplies(index + 2, allSuppliesPageSize),
          ),
        );

        const combined = [firstPage, ...remainingResponses];
        const convertedSupplies = combined.flatMap((response, responseIndex) =>
          response.data.map((item, itemIndex) =>
            convertApiSupplyToMedicalSupply(
              item,
              responseIndex * allSuppliesPageSize + itemIndex,
            ),
          ),
        );

        setSupplies(convertedSupplies);
        setTotal(firstPage.total);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch all supplies');
        setSupplies([]);
        setTotal(0);
      } finally {
        setLoading(false);
      }
    };

    void fetchAllSupplies();
  }, [refetchTrigger]);

  const refetch = () => {
    setRefetchTrigger((prev) => prev + 1);
  };

  return {
    supplies,
    loading,
    error,
    total,
    refetch,
  };
};
