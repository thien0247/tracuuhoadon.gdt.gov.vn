// @id 01M4W0RPRT0000000000000002
// @related 01M4W0RPRT0000000000000008, 01M4W0RPRT0000000000000009, 01M4W0RPRT0000000000000010

'use client';

import React, { useState, useMemo } from 'react';
import { HealthStatusCards } from './health/HealthStatusCards';
import { HealthFilterBar } from './health/HealthFilterBar';
import { HealthTable, type HealthItem } from './health/HealthTable';

export interface ReportData {
  summary?: { total?: number; healthy?: number; warning?: number; stalled?: number };
  provinces?: HealthItem[];
}

interface HealthReportProps {
  reportData?: ReportData;
  loading?: boolean;
  onRefresh: (days: number) => void;
  onScanProvince: (provName: string) => void;
  onSelectTin: (tin: string) => void;
}

export const HealthReport: React.FC<HealthReportProps> = ({
  reportData = { summary: {}, provinces: [] }, loading = false,
  onRefresh, onScanProvince, onSelectTin,
}) => {
  const [selectedDays, setSelectedDays] = useState(3);
  const [statusFilter, setStatusFilter] = useState('all');
  const [hasNewFilter, setHasNewFilter] = useState('all');
  const [sortBy, setSortBy] = useState('days_desc');
  const [searchQuery, setSearchQuery] = useState('');

  const summary = useMemo(() =>
    reportData?.summary || { total: 0, healthy: 0, warning: 0, stalled: 0 },
  [reportData]);

  const filteredProvinces = useMemo<HealthItem[]>(() => {
    let list = (reportData?.provinces || []).slice();
    const q = searchQuery.trim().toLowerCase();
    if (q) list = list.filter((p) => p.province.toLowerCase().includes(q) || p.prefix.includes(q));
    if (statusFilter !== 'all') list = list.filter((p) => p.status === statusFilter);
    if (hasNewFilter === 'has_new') list = list.filter((p) => (p.new_records_in_range || 0) > 0);
    if (hasNewFilter === 'no_new') list = list.filter((p) => (p.new_records_in_range || 0) === 0);

    list.sort((a, b) => {
      if (sortBy === 'days_desc') return ((b.days_diff ?? 9999) - (a.days_diff ?? 9999));
      if (sortBy === 'new_desc') return (b.new_records_in_range || 0) - (a.new_records_in_range || 0);
      if (sortBy === 'density_asc') return (a.density_rate || 0) - (b.density_rate || 0);
      return sortBy === 'prefix_asc' ? a.prefix.localeCompare(b.prefix) : a.province.localeCompare(b.province);
    });
    return list;
  }, [reportData, searchQuery, statusFilter, hasNewFilter, sortBy]);

  const resetFilters = () => {
    setStatusFilter('all');
    setHasNewFilter('all');
    setSortBy('days_desc');
    setSearchQuery('');
  };

  const changeDays = (days: number) => {
    setSelectedDays(days);
    onRefresh(days);
  };

  const exportExcel = () => {
    window.open(`/api/reports/health-excel?days=${selectedDays}`, '_blank');
  };

  return (
    <div className="space-y-4">
      <HealthStatusCards
        summary={summary}
        currentStatus={statusFilter}
        selectedDays={selectedDays}
        onSelectStatus={setStatusFilter}
      />

      <HealthFilterBar
        searchQuery={searchQuery}
        statusFilter={statusFilter}
        hasNewFilter={hasNewFilter}
        sortBy={sortBy}
        selectedDays={selectedDays}
        filteredCount={filteredProvinces.length}
        totalCount={reportData?.provinces?.length || 62}
        loading={loading}
        onChangeSearchQuery={setSearchQuery}
        onChangeStatusFilter={setStatusFilter}
        onChangeHasNewFilter={setHasNewFilter}
        onChangeSortBy={setSortBy}
        onChangeDays={changeDays}
        onResetFilters={resetFilters}
        onRefresh={() => onRefresh(selectedDays)}
        onExportExcel={exportExcel}
      />

      <HealthTable
        provinces={filteredProvinces}
        selectedDays={selectedDays}
        onSelectTin={onSelectTin}
        onScanProvince={onScanProvince}
      />
    </div>
  );
};
