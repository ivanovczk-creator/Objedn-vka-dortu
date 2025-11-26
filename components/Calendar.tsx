import React, { useState, useMemo } from 'react';
import { CZECH_HOLIDAYS } from '../types';

interface CalendarProps {
  selectedDate: Date | null;
  onSelect: (date: Date) => void;
}

const MONTHS = [
  "Leden", "Únor", "Březen", "Duben", "Květen", "Červen",
  "Červenec", "Srpen", "Září", "Říjen", "Listopad", "Prosinec"
];

const DAYS = ["Ne", "Po", "Út", "St", "Čt", "Pá", "So"];

export const Calendar: React.FC<CalendarProps> = ({ selectedDate, onSelect }) => {
  const [viewDate, setViewDate] = useState(new Date());

  const minDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7); // Min 7 days in future
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const isHoliday = (date: Date) => {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
    return CZECH_HOLIDAYS.includes(`${day}-${month}`);
  };

  const isDisabled = (date: Date) => {
    // Check if before min date
    if (date < minDate) return true;
    // Check if holiday
    if (isHoliday(date)) return true;
    return false;
  };

  const renderDays = () => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 = Sunday

    const days = [];
    
    // Empty slots for previous month
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(<div key={`empty-${i}`} className="p-2"></div>);
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const currentDay = new Date(year, month, d);
      const disabled = isDisabled(currentDay);
      const isSelected = selectedDate && 
        selectedDate.getDate() === d && 
        selectedDate.getMonth() === month && 
        selectedDate.getFullYear() === year;

      days.push(
        <button
          key={d}
          disabled={disabled}
          onClick={() => onSelect(currentDay)}
          className={`
            p-2 w-full aspect-square rounded-lg flex items-center justify-center text-sm font-medium transition-colors
            ${isSelected ? 'bg-brand-600 text-white shadow-md' : ''}
            ${!isSelected && !disabled ? 'hover:bg-brand-100 text-gray-700' : ''}
            ${disabled ? 'text-gray-300 cursor-not-allowed bg-gray-50' : ''}
          `}
          title={isHoliday(currentDay) ? "Svátek" : ""}
        >
          {d}
        </button>
      );
    }
    return days;
  };

  const changeMonth = (offset: number) => {
    const newDate = new Date(viewDate);
    newDate.setMonth(newDate.getMonth() + offset);
    setViewDate(newDate);
  };

  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-brand-100 max-w-sm mx-auto">
      <div className="flex justify-between items-center mb-4">
        <button onClick={() => changeMonth(-1)} className="p-1 hover:bg-gray-100 rounded text-brand-700">&lt;</button>
        <span className="font-serif font-bold text-lg text-brand-900">{MONTHS[viewDate.getMonth()]} {viewDate.getFullYear()}</span>
        <button onClick={() => changeMonth(1)} className="p-1 hover:bg-gray-100 rounded text-brand-700">&gt;</button>
      </div>
      <div className="grid grid-cols-7 gap-1 mb-2 text-center text-xs font-bold text-gray-500 uppercase tracking-wide">
        {DAYS.map(d => <div key={d}>{d}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {renderDays()}
      </div>
      <div className="mt-4 text-xs text-gray-500 text-center">
        * Nejdřívější datum vyzvednutí je za 7 dní. Svátky jsou blokovány.
      </div>
    </div>
  );
};