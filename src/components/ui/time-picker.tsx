
'use client';

import * as React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface TimePickerProps {
  value: string; // "HH:mm"
  onChange: (value: string) => void;
}

const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
const minutes = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0'));

export function TimePicker({ value, onChange }: TimePickerProps) {
  const [hour, minute] = value.split(':');

  const handleHourChange = (newHour: string) => {
    onChange(`${newHour}:${minute}`);
  };

  const handleMinuteChange = (newMinute: string) => {
    onChange(`${hour}:${newMinute}`);
  };

  return (
    <div className="flex items-center gap-2" dir="ltr">
      <Select onValueChange={handleHourChange} value={hour}>
        <SelectTrigger className="w-[70px]">
          <SelectValue placeholder="HH" />
        </SelectTrigger>
        <SelectContent>
          {hours.map(h => (
            <SelectItem key={h} value={h}>{h}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <span>:</span>
      <Select onValueChange={handleMinuteChange} value={minute}>
        <SelectTrigger className="w-[70px]">
          <SelectValue placeholder="mm" />
        </SelectTrigger>
        <SelectContent>
          {minutes.map(m => (
            <SelectItem key={m} value={m}>{m}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
