import React from 'react';
import { Calendar, Filter, X, RotateCcw, AlertTriangle, MapPin, ChevronRight, Check } from 'lucide-react';
import { Report, WildlifeMarkerData } from '../types';

export function normalizeSpecies(name: string): string {
  if (!name) return 'Other';
  const l = name.toLowerCase();
  if (l.includes('elephant')) return 'Asian Elephant';
  if (l.includes('tiger')) return 'Bengal Tiger';
  if (l.includes('leopard')) return 'Indian Leopard';
  if (l.includes('bear')) return 'Sloth Bear';
  if (l.includes('gaur') || l.includes('bison')) return 'Indian Gaur';
  if (l.includes('tahr')) return 'Nilgiri Tahr';
  return name;
}

export function getItemDateStr(item: { created_at?: string; date?: string; timestamp?: string; lastSeen?: string }): string {
  if (item.date) {
    const clean = item.date.slice(0, 10);
    if (/^\d{4}-\d{2}-\d{2}$/.test(clean)) return clean;
  }
  if (item.created_at) {
    const parsed = new Date(item.created_at);
    if (!isNaN(parsed.getTime())) {
      return parsed.toISOString().slice(0, 10);
    }
  }

  const text = (item.timestamp || item.lastSeen || '').toLowerCase();
  const now = new Date();

  if (text.includes('min') || text.includes('just now') || text.includes('hour') || text.includes('today')) {
    return now.toISOString().slice(0, 10);
  }
  if (text.includes('yesterday')) {
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    return yesterday.toISOString().slice(0, 10);
  }
  const daysMatch = text.match(/(\d+)\s*day/);
  if (daysMatch) {
    const days = parseInt(daysMatch[1], 10);
    const past = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    return past.toISOString().slice(0, 10);
  }
  const weeksMatch = text.match(/(\d+)\s*week/);
  if (weeksMatch) {
    const weeks = parseInt(weeksMatch[1], 10);
    const past = new Date(now.getTime() - weeks * 7 * 24 * 60 * 60 * 1000);
    return past.toISOString().slice(0, 10);
  }

  return now.toISOString().slice(0, 10);
}

interface CombinedInteraction {
  id: string;
  common: string;
  scientific?: string;
  emoji: string;
  location: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  dateStr: string;
  displayTime: string;
  description?: string;
  isUserReport: boolean;
  originalItem: Report | WildlifeMarkerData;
}

interface FilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  fromDate: string;
  setFromDate?: (date: string) => void;
  onFromDateChange?: (date: string) => void;
  toDate: string;
  setToDate?: (date: string) => void;
  onToDateChange?: (date: string) => void;
  selectedSpecies: string;
  setSelectedSpecies?: (species: string) => void;
  onSpeciesChange?: (species: string) => void;
  selectedRisk: string;
  setSelectedRisk?: (risk: string) => void;
  onRiskChange?: (risk: string) => void;
  reports?: Report[];
  wildlifeMarkers?: WildlifeMarkerData[];
  markers?: WildlifeMarkerData[];
  onSelectInteraction: (item: Report | WildlifeMarkerData) => void;
  onReset: () => void;
}

export const FilterModal: React.FC<FilterModalProps> = ({
  isOpen,
  onClose,
  fromDate,
  setFromDate,
  onFromDateChange,
  toDate,
  setToDate,
  onToDateChange,
  selectedSpecies,
  setSelectedSpecies,
  onSpeciesChange,
  selectedRisk,
  setSelectedRisk,
  onRiskChange,
  reports = [],
  wildlifeMarkers,
  markers,
  onSelectInteraction,
  onReset
}) => {
  if (!isOpen) return null;

  const updateFromDate = setFromDate || onFromDateChange || (() => {});
  const updateToDate = setToDate || onToDateChange || (() => {});
  const updateSpecies = setSelectedSpecies || onSpeciesChange || (() => {});
  const updateRisk = setSelectedRisk || onRiskChange || (() => {});

  const activeMarkers = wildlifeMarkers || markers || [];
  const activeReports = reports || [];

  const todayStr = new Date().toISOString().slice(0, 10);

  const setPreset = (preset: 'all' | 'today' | '7days' | '30days') => {
    if (preset === 'all') {
      updateFromDate('');
      updateToDate('');
    } else if (preset === 'today') {
      updateFromDate(todayStr);
      updateToDate(todayStr);
    } else if (preset === '7days') {
      const past = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
      updateFromDate(past);
      updateToDate(todayStr);
    } else if (preset === '30days') {
      const past = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
      updateFromDate(past);
      updateToDate(todayStr);
    }
  };

  // Combine reports and wildlife markers into normalized interactions list
  const allInteractions: CombinedInteraction[] = [
    ...activeReports.map((rep) => ({
      id: `rep-${rep.id}`,
      common: rep.wildlifeType || rep.ai?.common || 'Wildlife Sighting',
      scientific: rep.ai?.scientific,
      emoji: (rep.wildlifeType || '').toLowerCase().includes('elephant') ? '🐘' :
             (rep.wildlifeType || '').toLowerCase().includes('tiger') ? '🐅' :
             (rep.wildlifeType || '').toLowerCase().includes('gaur') || (rep.wildlifeType || '').toLowerCase().includes('bison') ? '🦬' :
             (rep.wildlifeType || '').toLowerCase().includes('bear') ? '🐻' :
             (rep.wildlifeType || '').toLowerCase().includes('leopard') ? '🐆' : '🐾',
      location: rep.location,
      riskLevel: (rep.ai?.risk?.toUpperCase() === 'HIGH' ? 'HIGH' : rep.ai?.risk?.toUpperCase() === 'MEDIUM' ? 'MEDIUM' : 'LOW') as 'LOW' | 'MEDIUM' | 'HIGH',
      dateStr: getItemDateStr(rep),
      displayTime: rep.timestamp,
      description: rep.description,
      isUserReport: true,
      originalItem: rep
    })),
    ...activeMarkers.map((wm) => ({
      id: wm.id,
      common: wm.common,
      scientific: wm.scientific,
      emoji: wm.emoji,
      location: wm.locationName,
      riskLevel: wm.riskLevel,
      dateStr: getItemDateStr(wm),
      displayTime: wm.lastSeen,
      description: wm.behaviour,
      isUserReport: Boolean(wm.isUserSubmitted),
      originalItem: wm
    }))
  ];

  // Unique species list for filter dropdown
  const speciesList = Array.from(new Set(allInteractions.map((i) => normalizeSpecies(i.common)))).filter(Boolean);

  // Filter interactions based on parameters
  const filteredInteractions = allInteractions.filter((item) => {
    if (fromDate && item.dateStr < fromDate) return false;
    if (toDate && item.dateStr > toDate) return false;
    if (selectedSpecies && selectedSpecies !== 'ALL' && normalizeSpecies(item.common) !== normalizeSpecies(selectedSpecies)) return false;
    if (selectedRisk && selectedRisk !== 'ALL' && item.riskLevel !== selectedRisk) return false;
    return true;
  });

  const activeFilterCount = (fromDate ? 1 : 0) + (toDate ? 1 : 0) + (selectedSpecies && selectedSpecies !== 'ALL' ? 1 : 0) + (selectedRisk && selectedRisk !== 'ALL' ? 1 : 0);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-xs p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-lg rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-100 flex flex-col max-h-[90vh] sm:max-h-[85vh] overflow-hidden">
        
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-emerald-100 text-[#059669] flex items-center justify-center shrink-0">
              <Filter size={18} />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
                Filter Past Interactions
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                View sightings & field reports by date range
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition cursor-pointer"
            id="close-filter-modal-btn"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body - Scrollable */}
        <div className="p-4 sm:p-5 space-y-5 overflow-y-auto flex-1 no-scrollbar">

          {/* Quick Date Range Presets */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Calendar size={14} className="text-[#059669]" />
              <span>Quick Date Presets</span>
            </label>
            <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
              <button
                type="button"
                onClick={() => setPreset('all')}
                className={`py-2 px-1 text-center text-xs font-bold rounded-xl border transition cursor-pointer ${
                  !fromDate && !toDate
                    ? 'bg-[#059669] text-white border-[#059669]'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                All Time
              </button>
              <button
                type="button"
                onClick={() => setPreset('today')}
                className={`py-2 px-1 text-center text-xs font-bold rounded-xl border transition cursor-pointer ${
                  fromDate === todayStr && toDate === todayStr
                    ? 'bg-[#059669] text-white border-[#059669]'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                Today
              </button>
              <button
                type="button"
                onClick={() => setPreset('7days')}
                className={`py-2 px-1 text-center text-xs font-bold rounded-xl border transition cursor-pointer ${
                  fromDate && toDate === todayStr && fromDate !== todayStr && fromDate !== new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
                    ? 'bg-[#059669] text-white border-[#059669]'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                Past 7 Days
              </button>
              <button
                type="button"
                onClick={() => setPreset('30days')}
                className={`py-2 px-1 text-center text-xs font-bold rounded-xl border transition cursor-pointer ${
                  fromDate === new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
                    ? 'bg-[#059669] text-white border-[#059669]'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                Past 30 Days
              </button>
            </div>
          </div>

          {/* Date Picker: From Date & To Date */}
          <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-200/80 space-y-3">
            <div className="text-xs font-bold text-slate-800 flex items-center justify-between">
              <span>Custom Date Range</span>
              {(fromDate || toDate) && (
                <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                  Active Filter
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* From Date */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600 block">From Date</label>
                <div className="relative">
                  <input
                    type="date"
                    value={fromDate}
                    onChange={(e) => updateFromDate(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium text-slate-900 focus:outline-none focus:border-[#059669] focus:ring-1 focus:ring-[#059669]"
                    id="from-date-input"
                  />
                </div>
              </div>

              {/* To Date */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600 block">To Date</label>
                <div className="relative">
                  <input
                    type="date"
                    value={toDate}
                    onChange={(e) => updateToDate(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium text-slate-900 focus:outline-none focus:border-[#059669] focus:ring-1 focus:ring-[#059669]"
                    id="to-date-input"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Additional Secondary Filters: Species & Risk Level */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 block">Species</label>
              <select
                value={selectedSpecies}
                onChange={(e) => updateSpecies(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:border-[#059669]"
                id="species-filter-select"
              >
                <option value="ALL">All Species</option>
                {speciesList.map((sp) => (
                  <option key={sp} value={sp}>
                    {sp}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 block">Risk Level</label>
              <select
                value={selectedRisk}
                onChange={(e) => updateRisk(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:border-[#059669]"
                id="risk-filter-select"
              >
                <option value="ALL">All Risk Levels</option>
                <option value="HIGH">High Risk</option>
                <option value="MEDIUM">Medium Risk</option>
                <option value="LOW">Low Risk</option>
              </select>
            </div>
          </div>

          {/* Results Counter Header */}
          <div className="pt-1 flex items-center justify-between border-t border-slate-100">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <span>Matching Past Interactions</span>
              <span className="bg-emerald-100 text-[#059669] px-2 py-0.5 rounded-full text-[11px] font-extrabold">
                {filteredInteractions.length}
              </span>
            </h3>
            {fromDate && toDate && (
              <span className="text-[11px] text-slate-500 font-medium">
                {fromDate} → {toDate}
              </span>
            )}
          </div>

          {/* Matching Interactions List */}
          <div className="space-y-2.5 max-h-56 overflow-y-auto no-scrollbar pr-0.5">
            {filteredInteractions.length === 0 ? (
              <div className="p-6 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-1">
                <p className="text-xs font-bold text-slate-700">No past interactions found</p>
                <p className="text-[11px] text-slate-500">
                  Try adjusting your From Date or To Date range.
                </p>
              </div>
            ) : (
              filteredInteractions.map((item) => (
                <div
                  key={item.id}
                  onClick={() => {
                    onSelectInteraction(item.originalItem);
                    onClose();
                  }}
                  className="bg-white p-3 rounded-2xl border border-slate-200/80 hover:border-[#059669] shadow-xs flex items-center justify-between gap-3 cursor-pointer transition group"
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <span className="text-xl p-1.5 bg-slate-50 rounded-xl shrink-0">{item.emoji}</span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs font-bold text-slate-900 truncate">{item.common}</span>
                        <span className={`text-[9px] font-extrabold px-1.5 py-0.2 rounded-md ${
                          item.riskLevel === 'HIGH' ? 'bg-red-50 text-red-600' :
                          item.riskLevel === 'MEDIUM' ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-[#059669]'
                        }`}>
                          {item.riskLevel}
                        </span>
                        {item.isUserReport && (
                          <span className="text-[9px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded-md font-bold">
                            USER REPORT
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                        <span className="flex items-center gap-0.5 truncate">
                          <MapPin size={11} className="shrink-0 text-slate-400" />
                          <span className="truncate">{item.location}</span>
                        </span>
                        <span className="text-slate-300">•</span>
                        <span className="font-semibold text-slate-700 shrink-0">{item.dateStr}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 text-xs font-bold text-[#059669] group-hover:translate-x-0.5 transition-transform shrink-0">
                    <span>View</span>
                    <ChevronRight size={14} />
                  </div>
                </div>
              ))
            )}
          </div>

        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/80 flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={onReset}
            className="px-3.5 py-2.5 rounded-2xl text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-200/80 transition flex items-center gap-1.5 border border-slate-200 cursor-pointer"
            id="reset-filter-btn"
          >
            <RotateCcw size={14} />
            <span>Reset Filters</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 px-4 rounded-2xl text-xs font-extrabold text-white bg-[#059669] hover:bg-[#047857] shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer"
            id="apply-filter-btn"
          >
            <Check size={15} />
            <span>Apply Filters ({filteredInteractions.length})</span>
          </button>
        </div>

      </div>
    </div>
  );
};
